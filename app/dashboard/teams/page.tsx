"use client";
/**
 * /app/dashboard/teams/page.tsx
 *
 * Employee "My Teams" — Supabase/Linear-grade UI.
 * Uses DiceBear pixel-art-neutral avatars (gender-neutral, CC0, deterministic).
 * No left border strips. No border-radius. Theme-aware.
 */

import React, { useEffect, useState, useCallback } from "react";
import {
  Users, CheckCircle2, Clock, AlertCircle,
  RefreshCw, Briefcase, Shield, ChevronRight,
  ArrowLeft, Sparkles, Globe, BarChart3, CalendarDays,
  UserCheck, Lock, Zap, Package, Building2,
} from "lucide-react";
import { Client, Databases, Query } from "appwrite";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useRequireAuth } from "@/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import ThemeToggle from "@/components/Themetoggle";

// ─── APPWRITE CONFIG ──────────────────────────────────────────────────────────
const ENDPOINT   = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;

const client = new Client()
  .setEndpoint(ENDPOINT.replace(/\/$/, ""))
  .setProject(PROJECT_ID);
const db = new Databases(client);

const USERS_DB_ID                   = "hmex_db";
const COMPANY_MEMBERS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_COMPANY_MEMBERS_COLLECTION_ID!;
const COMPANIES_COLLECTION_ID       = process.env.NEXT_PUBLIC_APPWRITE_COMPANIES_COLLECTION_ID!;

// ─── TYPES ───────────────────────────────────────────────────────────────────
type MemberStatus = "pending" | "active" | "declined" | "removed";

interface TeamMembership {
  $id: string; $createdAt: string;
  companyId: string; companyName: string; email: string;
  status: MemberStatus; invitedAt: string; acceptedAt: string | null; invitedBy: string;
}
interface CompanyDetail {
  $id: string; name: string; size: string; industry: string;
  inviteCount: number; ownerId: string;
}
interface TeamCard extends TeamMembership { companyDetail: CompanyDetail | null; }

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function parseMembership(d: Record<string, unknown>): TeamMembership {
  return {
    $id: d.$id as string, $createdAt: d.$createdAt as string,
    companyId: (d.companyId as string) || "", companyName: (d.companyName as string) || "",
    email: (d.email as string) || "", status: ((d.status as MemberStatus) || "pending"),
    invitedAt: (d.invitedAt as string) || "", acceptedAt: (d.acceptedAt as string) || null,
    invitedBy: (d.invitedBy as string) || "",
  };
}
function parseCompany(d: Record<string, unknown>): CompanyDetail {
  return {
    $id: d.$id as string, name: (d.name as string) || "", size: (d.size as string) || "",
    industry: (d.industry as string) || "", inviteCount: (d.inviteCount as number) || 0,
    ownerId: (d.ownerId as string) || "",
  };
}
function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function fmtDateShort(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

// DiceBear pixel-art-neutral — gender-neutral, CC0, deterministic from seed
function dicebearUrl(seed: string, size = 40): string {
  const s = encodeURIComponent(seed);
  return `https://api.dicebear.com/9.x/pixel-art-neutral/svg?seed=${s}&size=${size}&backgroundColor=transparent`;
}

// ─── COMPANY AVATAR ───────────────────────────────────────────────────────────
function CompanyAvatar({ name, size = 40 }: { name: string; size?: number }) {
  const { surface } = useTheme();
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  return (
    <div style={{
      width: size, height: size, flexShrink: 0,
      background: surface.surfaceAlt,
      border: `1px solid ${surface.border}`,
      overflow: "hidden",
      display: "flex", alignItems: "center", justifyContent: "center",
      position: "relative",
    }}>
      {/* Fallback icon while loading or on error */}
      {(!loaded || errored) && (
        <Building2 size={size * 0.4} strokeWidth={1.5} style={{ color: surface.subtle, position: "absolute" }} />
      )}
      {!errored && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={dicebearUrl(name, size)}
          alt={name}
          width={size}
          height={size}
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
          style={{
            width: size, height: size,
            opacity: loaded ? 1 : 0,
            transition: "opacity 0.2s ease",
            imageRendering: "pixelated",
          }}
        />
      )}
    </div>
  );
}

// ─── STATUS CHIP ─────────────────────────────────────────────────────────────
function StatusChip({ status }: { status: MemberStatus }) {
  const map: Record<MemberStatus, { label: string; bg: string; dot: string }> = {
    active:   { label: "Active",   bg: "rgba(34,197,94,0.12)",  dot: "#22c55e" },
    pending:  { label: "Pending",  bg: "rgba(245,158,11,0.12)", dot: "#f59e0b" },
    declined: { label: "Declined", bg: "rgba(239,68,68,0.12)",  dot: "#ef4444" },
    removed:  { label: "Removed",  bg: "rgba(100,116,139,0.1)", dot: "#64748b" },
  };
  const { label, bg, dot } = map[status] ?? map.pending;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 9px", fontSize: 11, fontWeight: 600,
      background: bg, color: dot, letterSpacing: "0.02em", flexShrink: 0,
    }}>
      <span style={{
        width: 5, height: 5, borderRadius: "50%", background: dot, flexShrink: 0,
        boxShadow: status === "active" ? `0 0 0 2px ${dot}40` : "none",
      }} />
      {label}
    </span>
  );
}

// ─── TEAM LIST ROW ────────────────────────────────────────────────────────────
function TeamRow({ team, index, onClick }: { team: TeamCard; index: number; onClick: () => void }) {
  const { isDark, surface, accentColor } = useTheme();
  const [hovered, setHovered] = useState(false);
  const cd = team.companyDetail;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center",
        background: hovered
          ? (isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.018)")
          : surface.surface,
        borderBottom: `1px solid ${surface.border}`,
        cursor: "pointer",
        transition: "background 0.15s ease",
        animation: `rowIn 0.35s ease both`,
        animationDelay: `${index * 55}ms`,
      }}
    >
      {/* Avatar */}
      <div style={{ padding: "12px 14px 12px 16px", flexShrink: 0 }}>
        <CompanyAvatar name={team.companyName} size={40} />
      </div>

      {/* Main info */}
      <div style={{ flex: 1, minWidth: 0, padding: "14px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
          <span style={{
            fontSize: 14, fontWeight: 700, color: surface.text,
            letterSpacing: "-0.02em",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {team.companyName}
          </span>
          <StatusChip status={team.status} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          {cd?.industry && (
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, color: surface.muted }}>
              <Briefcase size={10} strokeWidth={2} />
              {cd.industry}
            </span>
          )}
          {cd?.inviteCount ? (
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, color: surface.muted }}>
              <Users size={10} strokeWidth={2} />
              {cd.inviteCount} members
            </span>
          ) : null}
          {cd?.size && (
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, color: surface.muted }}>
              <BarChart3 size={10} strokeWidth={2} />
              {cd.size}
            </span>
          )}
        </div>
      </div>

      {/* Right: joined + chevron */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "0 20px", flexShrink: 0 }}>
        <div style={{ textAlign: "right" }}>
          <p style={{ margin: 0, fontSize: 10, fontWeight: 600, color: surface.subtle, letterSpacing: "0.06em", textTransform: "uppercase" as const }}>
            Joined
          </p>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: surface.muted }}>
            {fmtDateShort(team.acceptedAt)}
          </p>
        </div>
        <ChevronRight
          size={15} strokeWidth={2}
          style={{
            color: hovered ? accentColor : surface.subtle,
            transform: hovered ? "translateX(2px)" : "none",
            transition: "all 0.15s ease",
          }}
        />
      </div>
    </div>
  );
}

// ─── TEAM DETAIL VIEW ─────────────────────────────────────────────────────────
function TeamDetail({ team, onBack }: { team: TeamCard; onBack: () => void }) {
  const { isDark, surface, accentColor } = useTheme();
  const cd = team.companyDetail;

  return (
    <div style={{ animation: "detailIn 0.25s ease both" }}>

      {/* Back */}
      <button
        onClick={onBack}
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "7px 12px", marginBottom: 24,
          background: surface.surface, border: `1px solid ${surface.border}`,
          color: surface.muted, fontSize: 12, fontWeight: 600,
          cursor: "pointer", transition: "color 0.15s",
        }}
        onMouseEnter={e => (e.currentTarget.style.color = accentColor)}
        onMouseLeave={e => (e.currentTarget.style.color = surface.muted)}
      >
        <ArrowLeft size={12} strokeWidth={2.5} />
        All Teams
      </button>

      {/* Hero banner */}
      <div style={{
        position: "relative", overflow: "hidden",
        background: isDark
          ? "rgba(255,255,255,0.02)"
          : "rgba(0,0,0,0.015)",
        border: `1px solid ${surface.border}`,
        borderBottom: "none",
        padding: "28px 28px 24px",
      }}>
        {/* Subtle dot grid texture */}
        <div style={{
          position: "absolute", inset: 0, opacity: isDark ? 0.06 : 0.04,
          backgroundImage: `radial-gradient(circle, ${surface.border} 1px, transparent 1px)`,
          backgroundSize: "20px 20px", pointerEvents: "none",
        }} />

        <div style={{ display: "flex", alignItems: "flex-start", gap: 18, position: "relative" }}>
          {/* Large avatar */}
          <CompanyAvatar name={team.companyName} size={64} />

          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
              <h1 style={{
                margin: 0, fontSize: "clamp(1.25rem, 2.5vw, 1.55rem)",
                fontWeight: 900, color: surface.text, letterSpacing: "-0.03em",
              }}>
                {team.companyName}
              </h1>
              <StatusChip status={team.status} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              {cd?.industry && (
                <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: surface.muted }}>
                  <Briefcase size={11} strokeWidth={2} />
                  {cd.industry}
                </span>
              )}
              {cd?.size && (
                <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: surface.muted }}>
                  <Globe size={11} strokeWidth={2} />
                  {cd.size} company
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
        border: `1px solid ${surface.border}`,
        borderTop: `2px solid ${accentColor}`,
        marginBottom: 24, background: surface.surface,
      }}>
        {[
          {
            label: "Team Members",
            value: cd?.inviteCount ? `${cd.inviteCount}` : "—",
            sub: "total invited",
            Icon: Users, color: accentColor,
          },
          {
            label: "Your Status",
            value: team.status.charAt(0).toUpperCase() + team.status.slice(1),
            sub: "membership",
            Icon: UserCheck,
            color: team.status === "active" ? "#22c55e" : "#f59e0b",
          },
          {
            label: "Member Since",
            value: fmtDateShort(team.acceptedAt),
            sub: team.invitedAt ? `Invited ${fmtDate(team.invitedAt)}` : "pending",
            Icon: CalendarDays, color: "#6366f1",
          },
        ].map(({ label, value, sub, Icon, color }, i) => (
          <div key={label} style={{
            padding: "18px 20px",
            borderRight: i < 2 ? `1px solid ${surface.border}` : "none",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
              <div style={{
                width: 24, height: 24, background: `${color}15`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon size={12} strokeWidth={2} color={color} />
              </div>
              <span style={{
                fontSize: 10, fontWeight: 700,
                textTransform: "uppercase" as const, letterSpacing: "0.08em",
                color: surface.subtle,
              }}>
                {label}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color, letterSpacing: "-0.02em", lineHeight: 1 }}>
              {value}
            </p>
            <p style={{ margin: "4px 0 0", fontSize: 11, color: surface.subtle }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Programs section */}
      <div style={{ marginBottom: 20 }}>
        <div style={{
          display: "flex", alignItems: "center",
          justifyContent: "space-between", marginBottom: 12,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Package size={14} strokeWidth={2} style={{ color: accentColor }} />
            <h2 style={{
              margin: 0, fontSize: 14, fontWeight: 800,
              color: surface.text, letterSpacing: "-0.02em",
            }}>
              Wellness Programs
            </h2>
          </div>
          <span style={{
            padding: "2px 8px", fontSize: 10, fontWeight: 700,
            background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
            color: surface.subtle, letterSpacing: "0.04em",
          }}>
            COMING SOON
          </span>
        </div>

        <div style={{
          border: `1px dashed ${surface.border}`,
          padding: "48px 32px",
          display: "flex", flexDirection: "column",
          alignItems: "center", textAlign: "center", gap: 14,
          background: isDark ? "rgba(255,255,255,0.01)" : "rgba(0,0,0,0.008)",
        }}>
          <div style={{
            width: 52, height: 52,
            background: `${accentColor}12`,
            border: `1px solid ${accentColor}25`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Sparkles size={22} strokeWidth={1.5} style={{ color: accentColor }} />
          </div>
          <div>
            <p style={{
              margin: 0, marginBottom: 6,
              fontSize: 14, fontWeight: 800,
              color: surface.text, letterSpacing: "-0.02em",
            }}>
              Programs will appear here
            </p>
            <p style={{
              margin: 0, fontSize: 12.5, color: surface.muted,
              maxWidth: 340, lineHeight: 1.75,
            }}>
              When your employer broadcasts a wellness program to your team, you'll be able to view and enrol directly from this page.
            </p>
          </div>
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 14px",
            background: `${accentColor}10`,
            border: `1px solid ${accentColor}25`,
          }}>
            <Zap size={11} strokeWidth={2} style={{ color: accentColor }} />
            <span style={{ fontSize: 11.5, fontWeight: 600, color: accentColor }}>
              Programmes earn you Health XP when completed
            </span>
          </div>
        </div>
      </div>

      {/* Privacy */}
      <div style={{
        display: "flex", alignItems: "flex-start", gap: 10,
        padding: "14px 16px",
        background: isDark ? "rgba(13,148,136,0.05)" : "rgba(13,148,136,0.03)",
        border: `1px solid ${accentColor}20`,
      }}>
        <Lock size={12} strokeWidth={2} style={{ color: accentColor, flexShrink: 0, marginTop: 2 }} />
        <div>
          <p style={{ margin: 0, marginBottom: 3, fontSize: 11.5, fontWeight: 700, color: accentColor }}>
            Your data is private
          </p>
          <p style={{ margin: 0, fontSize: 11, color: surface.subtle, lineHeight: 1.7 }}>
            Your employer sees only anonymised, aggregated risk data for the team — never your individual assessment results, scores, or health history.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── SKELETON ─────────────────────────────────────────────────────────────────
function Skeleton() {
  const { surface } = useTheme();
  return (
    <div style={{ border: `1px solid ${surface.border}` }}>
      {[0, 1, 2].map(i => (
        <div key={i} className="animate-pulse" style={{
          height: 72, background: surface.surface,
          borderBottom: `1px solid ${surface.border}`,
          animationDelay: `${i * 80}ms`,
        }} />
      ))}
    </div>
  );
}

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────
function EmptyState() {
  const { isDark, surface, accentColor } = useTheme();
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "80px 24px", textAlign: "center", gap: 18,
      border: `1px solid ${surface.border}`, background: surface.surface,
    }}>
      <div style={{
        width: 64, height: 64,
        background: isDark ? "rgba(13,148,136,0.08)" : "rgba(13,148,136,0.05)",
        border: `1px solid ${accentColor}25`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {/* Show a sample DiceBear avatar in the empty state */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={dicebearUrl("hmex-placeholder", 48)}
          alt="No teams"
          width={48} height={48}
          style={{ imageRendering: "pixelated", opacity: 0.5 }}
        />
      </div>
      <div>
        <h2 style={{
          fontSize: 17, fontWeight: 800, color: surface.text,
          margin: 0, marginBottom: 7, letterSpacing: "-0.02em",
        }}>
          Not part of any team yet
        </h2>
        <p style={{ fontSize: 12.5, color: surface.muted, margin: 0, maxWidth: 300, lineHeight: 1.8 }}>
          Ask your employer to invite you. Once you accept, your organisation will appear here.
        </p>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function TeamsPage() {
  const auth = useRequireAuth();
  const { isDark, surface, accentColor } = useTheme();

  const [teams, setTeams]           = useState<TeamCard[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [selected, setSelected]     = useState<TeamCard | null>(null);

  const loadTeams = useCallback(async (userId: string) => {
    try {
      setError(null);
      const res = await db.listDocuments(USERS_DB_ID, COMPANY_MEMBERS_COLLECTION_ID, [
        Query.equal("userId", userId),
        Query.notEqual("status", "removed"),
        Query.orderDesc("$createdAt"),
        Query.limit(20),
      ]);
      const memberships = res.documents.map(d =>
        parseMembership(d as unknown as Record<string, unknown>)
      );
      const uniqueIds = [...new Set(memberships.map(m => m.companyId))];
      const cMap = new Map<string, CompanyDetail>();
      await Promise.all(uniqueIds.map(async cid => {
        if (!cid) return;
        try {
          const doc = await db.getDocument(USERS_DB_ID, COMPANIES_COLLECTION_ID, cid);
          cMap.set(cid, parseCompany(doc as unknown as Record<string, unknown>));
        } catch { /* skip inaccessible */ }
      }));
      setTeams(memberships.map(m => ({ ...m, companyDetail: cMap.get(m.companyId) ?? null })));
    } catch {
      setError("Failed to load teams. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (auth.user) loadTeams(auth.user.id);
  }, [auth.user, loadTeams]);

  const handleRefresh = async () => {
    if (!auth.user || refreshing) return;
    setRefreshing(true); setLoading(true);
    await loadTeams(auth.user.id);
    setRefreshing(false);
  };

  if (auth.loading) return null;

  const activeCount  = teams.filter(t => t.status === "active").length;
  const pendingCount = teams.filter(t => t.status === "pending").length;

  return (
    <DashboardLayout>
      <div style={{ paddingBottom: 56 }}>

        {/* ── Header ───────────────────────────────────────────────────── */}
        {!selected && (
          <div style={{
            display: "flex", alignItems: "flex-end",
            justifyContent: "space-between",
            flexWrap: "wrap", gap: 16, marginBottom: 28,
          }}>
            <div>
              <p style={{
                margin: 0, marginBottom: 4, fontSize: 10.5, fontWeight: 800,
                letterSpacing: "0.12em", textTransform: "uppercase", color: accentColor,
              }}>
                Workspace
              </p>
              <h1 style={{
                margin: 0,
                fontSize: "clamp(1.5rem, 3vw, 1.9rem)",
                fontWeight: 900, color: surface.text,
                letterSpacing: "-0.03em", lineHeight: 1.1,
              }}>
                My Teams
              </h1>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {!loading && teams.length > 0 && (
                <div style={{
                  display: "flex", alignItems: "center",
                  border: `1px solid ${surface.border}`, overflow: "hidden",
                }}>
                  {[
                    { label: "Total",   value: teams.length,  color: accentColor },
                    { label: "Active",  value: activeCount,   color: "#22c55e"   },
                    { label: "Pending", value: pendingCount,  color: "#f59e0b"   },
                  ].map(({ label, value, color }, i) => (
                    <div key={label} style={{
                      padding: "8px 14px", textAlign: "center",
                      borderRight: i < 2 ? `1px solid ${surface.border}` : "none",
                      background: surface.surface,
                    }}>
                      <p style={{ margin: 0, fontSize: 15, fontWeight: 900, color, lineHeight: 1 }}>{value}</p>
                      <p style={{ margin: "2px 0 0", fontSize: 9.5, fontWeight: 600, color: surface.subtle, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>
                        {label}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={handleRefresh}
                disabled={refreshing}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "9px 14px",
                  background: surface.surface, border: `1px solid ${surface.border}`,
                  color: surface.muted, fontSize: 12, fontWeight: 600,
                  cursor: "pointer", opacity: refreshing ? 0.5 : 1, transition: "opacity 0.2s",
                }}
              >
                <RefreshCw size={12} strokeWidth={2} className={refreshing ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>
          </div>
        )}

        {/* ── Error ────────────────────────────────────────────────────── */}
        {error && !selected && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "11px 14px", marginBottom: 16,
            background: "rgba(239,68,68,0.05)",
            border: "1px solid rgba(239,68,68,0.16)",
          }}>
            <AlertCircle size={13} style={{ color: "#ef4444", flexShrink: 0 }} />
            <p style={{ margin: 0, flex: 1, fontSize: 12, color: "#ef4444" }}>{error}</p>
            <button onClick={handleRefresh} style={{ fontSize: 11, fontWeight: 700, color: "#ef4444", background: "none", border: "none", cursor: "pointer" }}>
              Retry
            </button>
          </div>
        )}

        {/* ── Detail view ──────────────────────────────────────────────── */}
        {selected && <TeamDetail team={selected} onBack={() => setSelected(null)} />}

        {/* ── List view ────────────────────────────────────────────────── */}
        {!selected && (
          <>
            {loading && <Skeleton />}
            {!loading && teams.length === 0 && <EmptyState />}

            {!loading && teams.length > 0 && (
              <>
                {/* Column headers */}
                <div style={{
                  display: "flex", alignItems: "center",
                  padding: "8px 16px",
                  borderBottom: `1px solid ${surface.border}`,
                  background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
                }}>
                  <div style={{ width: 56, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, color: surface.subtle,
                      textTransform: "uppercase" as const, letterSpacing: "0.1em",
                    }}>
                      Organisation
                    </span>
                  </div>
                  <div style={{ paddingRight: 34, textAlign: "right" as const }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, color: surface.subtle,
                      textTransform: "uppercase" as const, letterSpacing: "0.1em",
                    }}>
                      Joined
                    </span>
                  </div>
                </div>

                {/* Rows */}
                <div style={{ border: `1px solid ${surface.border}`, borderTop: "none" }}>
                  {teams.map((team, i) => (
                    <TeamRow key={team.$id} team={team} index={i} onClick={() => setSelected(team)} />
                  ))}
                </div>

                {/* Footer */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "12px 14px", marginTop: 16,
                  background: surface.surface, border: `1px solid ${surface.border}`,
                }}>
                  <Shield size={11} style={{ color: accentColor, flexShrink: 0 }} />
                  <p style={{ margin: 0, fontSize: 11, color: surface.subtle, lineHeight: 1.6 }}>
                    HMEX never shares your health data with employers. Organisations see only team-level, anonymised risk aggregates.
                  </p>
                </div>
              </>
            )}
          </>
        )}

        <ThemeToggle />
      </div>

      <style jsx global>{`
        @keyframes rowIn {
          from { opacity: 0; transform: translateX(-6px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes detailIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </DashboardLayout>
  );
}