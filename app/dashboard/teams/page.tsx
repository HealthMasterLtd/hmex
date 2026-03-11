"use client";
/**
 * /app/dashboard/teams/page.tsx
 *
 * Employee "My Teams" page.
 * Shows every company_members record linked to the current user.
 * Data comes from Appwrite — company_members collection (filtered by userId).
 * No border-radius (sharp corners throughout). Theme-aware via ThemeContext.
 */

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  Briefcase,
  CalendarCheck,
  UserCheck,
  Shield,
  Info,
  LayoutGrid,
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
const COMPANY_MEMBERS_COLLECTION_ID =
  process.env.NEXT_PUBLIC_APPWRITE_COMPANY_MEMBERS_COLLECTION_ID!;
const COMPANIES_COLLECTION_ID =
  process.env.NEXT_PUBLIC_APPWRITE_COMPANIES_COLLECTION_ID!;

// ─── TYPES ────────────────────────────────────────────────────────────────────

type MemberStatus = "pending" | "active" | "declined" | "removed";

interface TeamMembership {
  $id:         string;
  $createdAt:  string;
  companyId:   string;
  companyName: string;
  email:       string;
  status:      MemberStatus;
  invitedAt:   string;
  acceptedAt:  string | null;
  invitedBy:   string;
}

interface CompanyDetail {
  $id:         string;
  name:        string;
  size:        string;
  industry:    string;
  inviteCount: number;
  ownerId:     string;
}

interface TeamCard extends TeamMembership {
  companyDetail: CompanyDetail | null;
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function parseMembership(doc: Record<string, unknown>): TeamMembership {
  return {
    $id:         doc.$id as string,
    $createdAt:  doc.$createdAt as string,
    companyId:   (doc.companyId as string) || "",
    companyName: (doc.companyName as string) || "",
    email:       (doc.email as string) || "",
    status:      ((doc.status as MemberStatus) || "pending"),
    invitedAt:   (doc.invitedAt as string) || "",
    acceptedAt:  (doc.acceptedAt as string) || null,
    invitedBy:   (doc.invitedBy as string) || "",
  };
}

function parseCompany(doc: Record<string, unknown>): CompanyDetail {
  return {
    $id:         doc.$id as string,
    name:        (doc.name as string) || "",
    size:        (doc.size as string) || "",
    industry:    (doc.industry as string) || "",
    inviteCount: (doc.inviteCount as number) || 0,
    ownerId:     (doc.ownerId as string) || "",
  };
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: MemberStatus }) {
  const configs: Record<MemberStatus, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
    active:   { label: "Active",   color: "#22c55e", bg: "rgba(34,197,94,0.1)",  Icon: CheckCircle2  },
    pending:  { label: "Pending",  color: "#f59e0b", bg: "rgba(245,158,11,0.1)", Icon: Clock         },
    declined: { label: "Declined", color: "#ef4444", bg: "rgba(239,68,68,0.1)",  Icon: AlertCircle   },
    removed:  { label: "Removed",  color: "#64748b", bg: "rgba(100,116,139,0.1)",Icon: AlertCircle   },
  };
  const { label, color, bg, Icon } = configs[status] ?? configs.pending;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 8px",
      fontSize: 10.5, fontWeight: 700,
      letterSpacing: "0.04em",
      background: bg, color,
      border: `1px solid ${color}30`,
    }}>
      <Icon size={10} strokeWidth={2.5} />
      {label}
    </span>
  );
}

// ─── TEAM CARD ────────────────────────────────────────────────────────────────

function TeamCard({ team, index }: { team: TeamCard; index: number }) {
  const { isDark, surface, accentColor } = useTheme();
  const cd = team.companyDetail;

  const initials = team.companyName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div
      style={{
        background: surface.surface,
        border: `1px solid ${surface.border}`,
        overflow: "hidden",
        animation: `fadeSlideUp 0.4s ease both`,
        animationDelay: `${index * 80}ms`,
      }}
    >
      {/* Top accent bar — colour based on status */}
      <div style={{
        height: 3,
        background: team.status === "active"
          ? `linear-gradient(90deg, ${accentColor}, #22c55e)`
          : team.status === "pending"
          ? "linear-gradient(90deg, #f59e0b, #fbbf24)"
          : "#64748b",
      }} />

      <div style={{ padding: "20px 20px 18px" }}>
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 16 }}>
          {/* Company avatar */}
          <div style={{
            width: 46, height: 46, flexShrink: 0,
            background: isDark ? "rgba(13,148,136,0.12)" : "rgba(13,148,136,0.08)",
            border: `1px solid ${accentColor}30`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 15, fontWeight: 900, color: accentColor,
            letterSpacing: "-0.02em",
          }}>
            {initials || <Building2 size={20} strokeWidth={1.5} />}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <h3 style={{
                margin: 0, fontSize: 14.5, fontWeight: 800,
                color: surface.text, letterSpacing: "-0.02em",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>
                {team.companyName}
              </h3>
              <StatusBadge status={team.status} />
            </div>

            {cd?.industry && (
              <p style={{
                margin: "3px 0 0", fontSize: 11.5, color: surface.muted,
                display: "flex", alignItems: "center", gap: 4,
              }}>
                <Briefcase size={10} strokeWidth={2} />
                {cd.industry}
              </p>
            )}
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: surface.border, marginBottom: 14 }} />

        {/* Meta grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10, marginBottom: 14,
        }}>
          {[
            {
              label: "Team Size",
              value: cd?.inviteCount ? `${cd.inviteCount} members` : "—",
              Icon: Users,
              color: accentColor,
            },
            {
              label: "Company Size",
              value: cd?.size || "—",
              Icon: LayoutGrid,
              color: "#8b5cf6",
            },
            {
              label: "Joined",
              value: fmtDate(team.acceptedAt),
              Icon: CalendarCheck,
              color: "#22c55e",
            },
            {
              label: "Invited",
              value: fmtDate(team.invitedAt),
              Icon: UserCheck,
              color: "#f59e0b",
            },
          ].map(({ label, value, Icon, color }) => (
            <div
              key={label}
              style={{
                padding: "10px 12px",
                background: surface.surfaceAlt,
                border: `1px solid ${surface.border}`,
              }}
            >
              <div style={{
                display: "flex", alignItems: "center", gap: 5, marginBottom: 5,
              }}>
                <Icon size={10} strokeWidth={2} color={color} />
                <p style={{
                  margin: 0, fontSize: 9, fontWeight: 700,
                  textTransform: "uppercase", letterSpacing: "0.08em",
                  color: surface.subtle,
                }}>
                  {label}
                </p>
              </div>
              <p style={{
                margin: 0, fontSize: 12, fontWeight: 700,
                color: surface.text,
              }}>
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Privacy notice */}
        <div style={{
          display: "flex", alignItems: "flex-start", gap: 7,
          padding: "9px 11px",
          background: isDark ? "rgba(13,148,136,0.05)" : "rgba(13,148,136,0.04)",
          border: `1px solid ${accentColor}20`,
        }}>
          <Shield size={11} strokeWidth={2} style={{ color: accentColor, flexShrink: 0, marginTop: 1 }} />
          <p style={{
            margin: 0, fontSize: 10.5, color: surface.subtle, lineHeight: 1.65,
          }}>
            Your employer sees only anonymised risk aggregates — never your individual health data.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── LOADING SKELETON ─────────────────────────────────────────────────────────

function Skeleton() {
  const { surface } = useTheme();
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
      gap: 14,
    }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="animate-pulse"
          style={{
            height: 260,
            background: surface.surface,
            border: `1px solid ${surface.border}`,
            animationDelay: `${i * 100}ms`,
          }}
        />
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
      padding: "80px 24px", textAlign: "center", gap: 20,
    }}>
      <div style={{
        width: 60, height: 60,
        background: isDark ? "rgba(13,148,136,0.1)" : "rgba(13,148,136,0.07)",
        border: "1px solid rgba(13,148,136,0.15)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Building2 size={26} strokeWidth={1.5} style={{ color: accentColor }} />
      </div>
      <div>
        <h2 style={{
          fontSize: 18, fontWeight: 800, color: surface.text,
          margin: 0, marginBottom: 8, letterSpacing: "-0.02em",
        }}>
          No Teams Yet
        </h2>
        <p style={{
          fontSize: 13, color: surface.muted, margin: 0,
          maxWidth: 320, lineHeight: 1.75,
        }}>
          You haven&apos;t been added to any organisation yet. Ask your employer to send you an invite link.
        </p>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function TeamsPage() {
  const auth   = useRequireAuth();
  const router = useRouter();
  const { isDark, surface, accentColor } = useTheme();

  const [teams, setTeams]         = useState<TeamCard[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const loadTeams = useCallback(async (userId: string) => {
    try {
      setError(null);

      // 1. Fetch all company_members records for this user
      const res = await db.listDocuments(
        USERS_DB_ID,
        COMPANY_MEMBERS_COLLECTION_ID,
        [
          Query.equal("userId", userId),
          Query.notEqual("status", "removed"),
          Query.orderDesc("$createdAt"),
          Query.limit(20),
        ]
      );

      const memberships: TeamMembership[] = res.documents.map((d) =>
        parseMembership(d as unknown as Record<string, unknown>)
      );

      // 2. Fetch company details for each unique companyId
      const uniqueCompanyIds = [...new Set(memberships.map((m) => m.companyId))];
      const companyMap = new Map<string, CompanyDetail>();

      await Promise.all(
        uniqueCompanyIds.map(async (cid) => {
          if (!cid) return;
          try {
            const doc = await db.getDocument(USERS_DB_ID, COMPANIES_COLLECTION_ID, cid);
            companyMap.set(cid, parseCompany(doc as unknown as Record<string, unknown>));
          } catch {
            // company may not be accessible — skip gracefully
          }
        })
      );

      // 3. Merge
      const cards: TeamCard[] = memberships.map((m) => ({
        ...m,
        companyDetail: companyMap.get(m.companyId) ?? null,
      }));

      setTeams(cards);
    } catch (e) {
      console.error("[TeamsPage] loadTeams error:", e);
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
    setRefreshing(true);
    setLoading(true);
    await loadTeams(auth.user.id);
    setRefreshing(false);
  };

  if (auth.loading) return null;

  const activeCount  = teams.filter((t) => t.status === "active").length;
  const pendingCount = teams.filter((t) => t.status === "pending").length;

  return (
    <DashboardLayout>
      <div style={{ paddingBottom: 48 }}>

        {/* ── Page Header ──────────────────────────────────────────────── */}
        <div style={{
          display: "flex", alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap", gap: 16, marginBottom: 28,
        }}>
          <div>
            <p style={{
              margin: 0, marginBottom: 5,
              fontSize: 10.5, fontWeight: 800,
              letterSpacing: "0.1em", textTransform: "uppercase",
              color: accentColor,
            }}>
              Organisations
            </p>
            <h1 style={{
              margin: 0,
              fontSize: "clamp(1.4rem, 3vw, 1.75rem)",
              fontWeight: 900, color: surface.text,
              letterSpacing: "-0.025em", lineHeight: 1.15,
            }}>
              My Teams
            </h1>
            <p style={{ margin: 0, marginTop: 5, fontSize: 11, color: surface.subtle }}>
              Organisations you&apos;re a member of
            </p>
          </div>

          {/* Refresh */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 14px",
              background: surface.surface, border: `1px solid ${surface.border}`,
              color: surface.muted, fontSize: 12, fontWeight: 600,
              cursor: "pointer", transition: "opacity 0.2s",
              opacity: refreshing ? 0.5 : 1,
            }}
          >
            <RefreshCw size={12} strokeWidth={2} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* ── Error Banner ──────────────────────────────────────────────── */}
        {error && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "11px 14px", marginBottom: 16,
            background: "rgba(239,68,68,0.05)",
            border: "1px solid rgba(239,68,68,0.16)",
          }}>
            <AlertCircle size={13} style={{ color: "#ef4444", flexShrink: 0 }} />
            <p style={{ margin: 0, flex: 1, fontSize: 12, color: "#ef4444" }}>{error}</p>
            <button
              onClick={handleRefresh}
              style={{
                fontSize: 11, fontWeight: 700, color: "#ef4444",
                background: "none", border: "none", cursor: "pointer",
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Loading ──────────────────────────────────────────────────── */}
        {loading && <Skeleton />}

        {/* ── Empty ────────────────────────────────────────────────────── */}
        {!loading && teams.length === 0 && <EmptyState />}

        {/* ── Stats Row + Cards ─────────────────────────────────────────── */}
        {!loading && teams.length > 0 && (
          <>
            {/* Summary stats */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
              gap: 10, marginBottom: 20,
            }}>
              {[
                { label: "Teams",   value: teams.length,  color: accentColor, Icon: Building2     },
                { label: "Active",  value: activeCount,   color: "#22c55e",   Icon: CheckCircle2  },
                { label: "Pending", value: pendingCount,  color: "#f59e0b",   Icon: Clock         },
              ].map(({ label, value, color, Icon }) => (
                <div
                  key={label}
                  style={{
                    padding: "14px 16px",
                    background: surface.surface, border: `1px solid ${surface.border}`,
                  }}
                >
                  <div style={{
                    display: "flex", alignItems: "center",
                    justifyContent: "space-between", marginBottom: 10,
                  }}>
                    <p style={{
                      margin: 0, fontSize: 10, fontWeight: 700,
                      textTransform: "uppercase", letterSpacing: "0.07em",
                      color: surface.muted,
                    }}>
                      {label}
                    </p>
                    <div style={{
                      width: 26, height: 26,
                      background: `${color}12`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Icon size={13} color={color} strokeWidth={2} />
                    </div>
                  </div>
                  <p style={{
                    margin: 0, fontSize: 26, fontWeight: 900,
                    color, lineHeight: 1,
                  }}>
                    {value}
                  </p>
                </div>
              ))}
            </div>

            {/* Team cards grid */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: 14,
            }}>
              {teams.map((team, i) => (
                <TeamCard key={team.$id} team={team} index={i} />
              ))}
            </div>

            {/* Privacy footer */}
            <div style={{
              display: "flex", alignItems: "flex-start", gap: 8,
              padding: "12px 14px", marginTop: 24,
              background: surface.surface, border: `1px solid ${surface.border}`,
            }}>
              <Info size={12} style={{ color: surface.subtle, flexShrink: 0, marginTop: 1 }} />
              <p style={{
                margin: 0, fontSize: 11, color: surface.subtle, lineHeight: 1.7,
              }}>
                HMEX protects your health privacy. Employers only see anonymised, aggregated risk data
                — individual assessment results are never shared with your organisation.
              </p>
            </div>
          </>
        )}

        <ThemeToggle />
      </div>

      {/* Animations */}
      <style jsx global>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
      `}</style>
    </DashboardLayout>
  );
}