"use client";
/**
 * /app/dashboard/teams/page.tsx
 *
 * Employee "My Teams" page.
 * - Lists all teams the user belongs to
 * - Clicking a team opens a detail view with wellness programs
 * - Programs show full plan: steps (with check/cross per step), KPIs, resources
 * - Marking a program complete awards XP via UserXpService
 */

import React, { useEffect, useState, useCallback } from "react";
import {
  Users, CheckCircle2, Clock, AlertCircle,
  RefreshCw, Briefcase, Shield, ChevronRight,
  ArrowLeft, Sparkles, Globe, BarChart3, CalendarDays,
  UserCheck, Lock, Zap, Package, Building2,
  CheckCircle, Activity, Heart, Brain,
  Stethoscope, Apple, PersonStanding, Target,
  Loader2, ChevronDown, ChevronUp, TrendingUp,
  Star, Trophy, X as XIcon,
} from "lucide-react";
import { Client, Databases, Query } from "appwrite";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useRequireAuth } from "@/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import ThemeToggle from "@/components/Themetoggle";
import { addUserXp } from "@/services/UserXpService";

// ─── APPWRITE CLIENT ─────────────────────────────────────────────────────────
const ENDPOINT   = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
const client = new Client().setEndpoint(ENDPOINT.replace(/\/$/, "")).setProject(PROJECT_ID);
const db = new Databases(client);

const USERS_DB_ID                   = "hmex_db";
const COMPANY_MEMBERS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_COMPANY_MEMBERS_COLLECTION_ID!;
const COMPANIES_COLLECTION_ID       = process.env.NEXT_PUBLIC_APPWRITE_COMPANIES_COLLECTION_ID!;
const ENROLLMENTS_COLLECTION_ID     = "program_enrollments";

// ─── XP CONFIG ────────────────────────────────────────────────────────────────
// XP awarded per priority level when marking a program complete
const XP_BY_PRIORITY: Record<string, number> = {
  critical: 4,
  high:     3,
  medium:   2,
  low:      1,
};

// ─── TYPES ────────────────────────────────────────────────────────────────────
type MemberStatus  = "pending" | "active" | "declined" | "removed";
type ProgramStatus = "active" | "completed";

interface ProgramStep {
  week:        string;
  action:      string;
  responsible: string;
}

interface TeamMembership {
  $id: string; $createdAt: string;
  companyId: string; companyName: string; email: string;
  status: MemberStatus; invitedAt: string; acceptedAt: string | null; invitedBy: string;
}
interface CompanyDetail {
  $id: string; name: string; size: string; industry: string; inviteCount: number; ownerId: string;
}
interface TeamCard extends TeamMembership { companyDetail: CompanyDetail | null; }

interface ProgramEnrollment {
  $id: string; $createdAt: string;
  programId:         string;
  companyId:         string;
  userId:            string;
  programTitle:      string;
  programDesc:       string;
  programCategory:   string;
  programPriority:   string;
  targetRisk:        string;
  enrolledAt:        string;
  status:            ProgramStatus;
  // Full plan fields
  programTagline:    string;
  programTargetGroup: string;
  programImpact:     string;
  programDuration:   string;
  programUrgency:    string;
  programIconName:   string;
  programColor:      string;
  programSteps:      ProgramStep[];
  programKpis:       string[];
  programResources:  string[];
  evidenceBased:     boolean;
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function parseMembership(d: Record<string, unknown>): TeamMembership {
  return {
    $id: d.$id as string, $createdAt: d.$createdAt as string,
    companyId:   (d.companyId   as string) || "",
    companyName: (d.companyName as string) || "",
    email:       (d.email       as string) || "",
    status:      ((d.status as MemberStatus) || "pending"),
    invitedAt:   (d.invitedAt  as string) || "",
    acceptedAt:  (d.acceptedAt as string) || null,
    invitedBy:   (d.invitedBy  as string) || "",
  };
}

function parseCompany(d: Record<string, unknown>): CompanyDetail {
  return {
    $id:         d.$id         as string,
    name:        (d.name        as string) || "",
    size:        (d.size        as string) || "",
    industry:    (d.industry    as string) || "",
    inviteCount: (d.inviteCount as number) || 0,
    ownerId:     (d.ownerId     as string) || "",
  };
}

function safeJsonParse<T>(raw: unknown, fallback: T): T {
  if (!raw) return fallback;
  if (typeof raw !== "string") return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

function parseEnrollment(d: Record<string, unknown>): ProgramEnrollment {
  return {
    $id:             d.$id             as string,
    $createdAt:      d.$createdAt      as string,
    programId:       (d.programId       as string) || "",
    companyId:       (d.companyId       as string) || "",
    userId:          (d.userId          as string) || "",
    programTitle:    (d.programTitle    as string) || "",
    programDesc:     (d.programDesc     as string) || "",
    programCategory: (d.programCategory as string) || "",
    programPriority: (d.programPriority as string) || "",
    targetRisk:      (d.targetRisk      as string) || "",
    enrolledAt:      (d.enrolledAt      as string) || "",
    status:          ((d.status         as ProgramStatus) || "active"),
    // Full plan
    programTagline:     (d.programTagline     as string) || "",
    programTargetGroup: (d.programTargetGroup as string) || "",
    programImpact:      (d.programImpact      as string) || "",
    programDuration:    (d.programDuration    as string) || "",
    programUrgency:     (d.programUrgency     as string) || "",
    programIconName:    (d.programIconName    as string) || "Sparkles",
    programColor:       (d.programColor       as string) || "#0d9488",
    programSteps:    safeJsonParse<ProgramStep[]>(d.programSteps,    []),
    programKpis:     safeJsonParse<string[]>(d.programKpis,          []),
    programResources: safeJsonParse<string[]>(d.programResources,    []),
    evidenceBased:   (d.evidenceBased as boolean) ?? true,
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
function dicebearUrl(seed: string, size = 40): string {
  return `https://api.dicebear.com/9.x/pixel-art-neutral/svg?seed=${encodeURIComponent(seed)}&size=${size}&backgroundColor=transparent`;
}
function categoryColor(cat: string): string {
  const map: Record<string, string> = {
    screening:       "#EF4444",
    fitness:         "#10B981",
    nutrition:       "#F59E0B",
    education:       "#3B82F6",
    mental_health:   "#8B5CF6",
    chronic_disease: "#EC4899",
    preventive:      "#0D9488",
  };
  return map[cat] || "#6366F1";
}
function priorityColor(p: string): string {
  const map: Record<string, string> = { critical: "#EF4444", high: "#F59E0B", medium: "#3B82F6" };
  return map[p] || "#94A3B8";
}
function responsibleColor(r: string): string {
  const map: Record<string, string> = {
    "HR":           "#6366F1",
    "Health Coach": "#0D9488",
    "Manager":      "#F59E0B",
    "Employee":     "#10B981",
    "Medical Team": "#EF4444",
  };
  return map[r] || "#94A3B8";
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function categoryIcon(cat: string, size = 14): React.ReactNode {
  const color = categoryColor(cat);
  const props = { size, color };
  switch (cat) {
    case "screening":       return <Stethoscope   {...props} />;
    case "fitness":         return <PersonStanding {...props} />;
    case "nutrition":       return <Apple          {...props} />;
    case "education":       return <Brain          {...props} />;
    case "mental_health":   return <Heart          {...props} />;
    case "chronic_disease": return <Activity       {...props} />;
    case "preventive":      return <Shield         {...props} />;
    default:                return <Target         {...props} />;
  }
}

// ─── XP TOAST ────────────────────────────────────────────────────────────────
function XpToast({ xp, onDone }: { xp: number; onDone: () => void }) {
  const { accentColor } = useTheme();
  useEffect(() => {
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div style={{
      position:   "fixed",
      bottom:     90,
      right:      24,
      zIndex:     200,
      display:    "flex",
      alignItems: "center",
      gap:        10,
      padding:    "12px 18px",
      background: `linear-gradient(135deg, ${accentColor}EE, ${accentColor}CC)`,
      color:      "white",
      boxShadow:  `0 8px 32px ${accentColor}55`,
      animation:  "xpPop 0.4s cubic-bezier(0.34,1.56,0.64,1) both",
    }}>
      <Star size={16} fill="white" />
      <div>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 900, lineHeight: 1 }}>+{xp} XP Earned!</p>
        <p style={{ margin: "2px 0 0", fontSize: 10, fontWeight: 600, opacity: 0.85 }}>Program marked complete</p>
      </div>
      <Trophy size={20} style={{ opacity: 0.7 }} />
    </div>
  );
}

// ─── COMPANY AVATAR ────────────────────────────────────────────────────────────
function CompanyAvatar({ name, size = 40 }: { name: string; size?: number }) {
  const { surface } = useTheme();
  const [loaded,  setLoaded]  = useState(false);
  const [errored, setErrored] = useState(false);
  return (
    <div style={{
      width: size, height: size, flexShrink: 0,
      background: surface.surfaceAlt, border: `1px solid ${surface.border}`,
      overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", position: "relative",
    }}>
      {(!loaded || errored) && <Building2 size={size * 0.4} strokeWidth={1.5} style={{ color: surface.subtle, position: "absolute" }} />}
      {!errored && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={dicebearUrl(name, size)} alt={name} width={size} height={size}
          onLoad={() => setLoaded(true)} onError={() => setErrored(true)}
          style={{ width: size, height: size, opacity: loaded ? 1 : 0, transition: "opacity 0.2s ease", imageRendering: "pixelated" }}
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
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", fontSize: 11, fontWeight: 600, background: bg, color: dot, letterSpacing: "0.02em", flexShrink: 0 }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: dot, flexShrink: 0, boxShadow: status === "active" ? `0 0 0 2px ${dot}40` : "none" }} />
      {label}
    </span>
  );
}

// ─── PROGRAM CARD ─────────────────────────────────────────────────────────────
function ProgramCard({
  enrollment,
  onMarkComplete,
}: {
  enrollment:     ProgramEnrollment;
  onMarkComplete: (id: string, xpEarned: number) => void;
}) {
  const { surface, accentColor } = useTheme();
  const [expanded,   setExpanded]   = useState(false);
  const [completing, setCompleting] = useState(false);
  // Per-step check state — start all unchecked; restored from localStorage key
  const [checkedSteps, setCheckedSteps] = useState<boolean[]>(() =>
    enrollment.programSteps.map(() => false)
  );

  const color       = enrollment.programColor || categoryColor(enrollment.programCategory);
  const isCompleted = enrollment.status === "completed";
  const stepsTotal  = enrollment.programSteps.length;
  const stepsDone   = checkedSteps.filter(Boolean).length;
  const allChecked  = stepsTotal > 0 && stepsDone === stepsTotal;

  // XP = based on priority, 1–4 range
  const xpReward = XP_BY_PRIORITY[enrollment.programPriority] ?? 1;

  const toggleStep = (i: number) => {
    if (isCompleted) return;
    setCheckedSteps(prev => {
      const next = [...prev];
      next[i] = !next[i];
      return next;
    });
  };

  const handleComplete = async () => {
    if (completing || isCompleted) return;
    setCompleting(true);
    try {
      await db.updateDocument(USERS_DB_ID, ENROLLMENTS_COLLECTION_ID, enrollment.$id, { status: "completed" });
      // Award XP
      if (enrollment.userId) {
        await addUserXp(enrollment.userId, xpReward).catch(e =>
          console.error("[TeamsPage] addUserXp error:", e)
        );
      }
      onMarkComplete(enrollment.$id, xpReward);
    } catch (e) {
      console.error("[TeamsPage] markComplete error:", e);
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div style={{
      background:   surface.surface,
      border:       `1px solid ${surface.border}`,
      borderLeft:   `3px solid ${color}`,
      opacity:      isCompleted ? 0.72 : 1,
      transition:   "opacity 0.2s",
    }}>
      {/* ── Top section ────────────────────────────────────────────────────── */}
      <div style={{ padding: "16px 18px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
          <div style={{ width: 34, height: 34, background: `${color}12`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {categoryIcon(enrollment.programCategory, 16)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 2 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: isCompleted ? surface.muted : surface.text, lineHeight: 1.3, textDecoration: isCompleted ? "line-through" : "none" }}>
                {enrollment.programTitle}
              </p>
              {isCompleted ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", fontSize: 10, fontWeight: 700, background: "rgba(34,197,94,0.10)", color: "#22c55e", flexShrink: 0 }}>
                  <CheckCircle size={9} />Done
                </span>
              ) : (
                <span style={{ padding: "2px 8px", fontSize: 10, fontWeight: 700, background: `${priorityColor(enrollment.programPriority)}18`, color: priorityColor(enrollment.programPriority), flexShrink: 0 }}>
                  {enrollment.programPriority}
                </span>
              )}
            </div>
            {enrollment.programTagline && (
              <p style={{ margin: "0 0 2px", fontSize: 11, color: color, fontWeight: 700, fontStyle: "italic" }}>
                {enrollment.programTagline}
              </p>
            )}
            <span style={{ fontSize: 10, fontWeight: 700, color, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>
              {enrollment.programCategory.replace("_", " ")}
            </span>
          </div>
        </div>

        {/* Description */}
        <p style={{ margin: "0 0 10px", fontSize: 12, color: surface.muted, lineHeight: 1.65 }}>
          {enrollment.programDesc}
        </p>

        {/* Meta row */}
        {(enrollment.programTargetGroup || enrollment.programDuration || enrollment.programImpact) && (
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 10 }}>
            {enrollment.programTargetGroup && (
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Users size={10} style={{ color: surface.muted }} />
                <span style={{ fontSize: 11, color: surface.muted }}>{enrollment.programTargetGroup}</span>
              </div>
            )}
            {enrollment.programDuration && (
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Clock size={10} style={{ color: surface.muted }} />
                <span style={{ fontSize: 11, color: surface.muted }}>{enrollment.programDuration}</span>
              </div>
            )}
            {enrollment.programImpact && (
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <TrendingUp size={10} style={{ color }} />
                <span style={{ fontSize: 11, color, fontWeight: 600 }}>{enrollment.programImpact}</span>
              </div>
            )}
          </div>
        )}

        {/* Why now urgency */}
        {enrollment.programUrgency && (
          <div style={{ padding: "7px 10px", background: `${color}0C`, border: `1px solid ${color}22`, marginBottom: 12 }}>
            <p style={{ margin: 0, fontSize: 11, color: color, fontWeight: 600 }}>
              <Zap size={10} style={{ display: "inline", marginRight: 4 }} />
              Why now: {enrollment.programUrgency}
            </p>
          </div>
        )}

        {/* Step progress bar (only if steps exist) */}
        {stepsTotal > 0 && !isCompleted && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: surface.subtle, textTransform: "uppercase" as const, letterSpacing: "0.07em" }}>
                Steps Progress
              </span>
              <span style={{ fontSize: 10, fontWeight: 700, color: allChecked ? "#22c55e" : color }}>
                {stepsDone}/{stepsTotal}
              </span>
            </div>
            <div style={{ height: 4, background: surface.border, overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width:  `${stepsTotal > 0 ? (stepsDone / stepsTotal) * 100 : 0}%`,
                background: allChecked ? "#22c55e" : color,
                transition: "width 0.3s ease",
              }} />
            </div>
          </div>
        )}

        {/* XP reward badge */}
        {!isCompleted && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", background: `${accentColor}10`, border: `1px solid ${accentColor}25`, marginBottom: 12 }}>
            <Star size={9} style={{ color: accentColor }} fill={accentColor} />
            <span style={{ fontSize: 10, fontWeight: 700, color: accentColor }}>+{xpReward} XP on completion</span>
          </div>
        )}

        {/* Footer row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 10, color: surface.subtle }}>Received {fmtDate(enrollment.enrolledAt)}</span>
            {stepsTotal > 0 && (
              <button
                onClick={() => setExpanded(v => !v)}
                style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: accentColor, background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {expanded ? "Hide" : "View"} Plan
              </button>
            )}
          </div>

          {!isCompleted && (
            <button
              onClick={handleComplete}
              disabled={completing}
              style={{
                display:     "flex",
                alignItems:  "center",
                gap:         5,
                padding:     "6px 14px",
                background:  allChecked ? accentColor : "transparent",
                border:      `1px solid ${allChecked ? accentColor : accentColor + "50"}`,
                color:       allChecked ? "white" : accentColor,
                fontSize:    11,
                fontWeight:  700,
                cursor:      completing ? "default" : "pointer",
                opacity:     completing ? 0.6 : 1,
                transition:  "all 0.2s",
              }}
            >
              {completing
                ? <><Loader2 size={10} className="animate-spin" />Saving…</>
                : <><CheckCircle size={10} />Mark Complete</>
              }
            </button>
          )}
        </div>
      </div>

      {/* ── Expanded plan section ────────────────────────────────────────────── */}
      {expanded && (
        <div style={{ borderTop: `1px solid ${surface.border}`, padding: "16px 18px 18px" }}>

          {/* Implementation Steps */}
          {enrollment.programSteps.length > 0 && (
            <>
              <p style={{ margin: "0 0 12px", fontSize: 10, fontWeight: 800, color: surface.muted, textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>
                Implementation Steps
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
                {enrollment.programSteps.map((step, i) => {
                  const checked = isCompleted || checkedSteps[i];
                  const rColor  = responsibleColor(step.responsible);
                  return (
                    <div
                      key={i}
                      onClick={() => toggleStep(i)}
                      style={{
                        display:     "flex",
                        alignItems:  "flex-start",
                        gap:         10,
                        padding:     "10px 12px",
                        border:      `1px solid ${checked ? color + "40" : surface.border}`,
                        background:  checked ? `${color}08` : "transparent",
                        cursor:      isCompleted ? "default" : "pointer",
                        transition:  "all 0.18s",
                        userSelect:  "none",
                      }}
                    >
                      {/* Check / unchecked circle */}
                      <div style={{
                        width:          22,
                        height:         22,
                        borderRadius:   "50%",
                        border:         `2px solid ${checked ? color : surface.border}`,
                        background:     checked ? color : "transparent",
                        display:        "flex",
                        alignItems:     "center",
                        justifyContent: "center",
                        flexShrink:     0,
                        marginTop:      1,
                        transition:     "all 0.18s",
                      }}>
                        {checked && <CheckCircle2 size={12} color="white" strokeWidth={2.5} />}
                        {!checked && (
                          <span style={{ fontSize: 9, fontWeight: 800, color: surface.subtle }}>{i + 1}</span>
                        )}
                      </div>

                      <div style={{ flex: 1 }}>
                        {/* Week + responsible */}
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: color }}>{step.week}</span>
                          <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 6px", background: `${rColor}15`, color: rColor, letterSpacing: "0.04em" }}>
                            {step.responsible}
                          </span>
                        </div>
                        <p style={{
                          margin:      0,
                          fontSize:    12,
                          color:       checked ? surface.muted : surface.text,
                          lineHeight:  1.55,
                          textDecoration: (checked && !isCompleted) ? "line-through" : "none",
                          transition:  "all 0.18s",
                        }}>
                          {step.action}
                        </p>
                      </div>

                      {/* X button to uncheck — only when checked & not fully completed */}
                      {checked && !isCompleted && (
                        <div style={{ flexShrink: 0, color: surface.subtle, marginTop: 2 }}>
                          <XIcon size={12} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Success Metrics / KPIs */}
          {enrollment.programKpis.length > 0 && (
            <>
              <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 800, color: surface.muted, textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>
                Success Metrics
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
                {enrollment.programKpis.map((k, i) => (
                  <span key={i} style={{ padding: "4px 10px", background: `${color}10`, color, fontSize: 11, fontWeight: 600 }}>
                    {k}
                  </span>
                ))}
              </div>
            </>
          )}

          {/* Resources Needed */}
          {enrollment.programResources.length > 0 && (
            <>
              <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 800, color: surface.muted, textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>
                Resources
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {enrollment.programResources.map((r, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <CheckCircle size={11} style={{ color: "#10B981", flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: 12, color: surface.muted, lineHeight: 1.5 }}>{r}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Evidence badge */}
          {enrollment.evidenceBased && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 14, padding: "4px 10px", background: `${accentColor}08`, border: `1px solid ${accentColor}20` }}>
              <Shield size={10} style={{ color: accentColor }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: accentColor }}>Evidence-based program</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── TEAM ROW ─────────────────────────────────────────────────────────────────
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
        display:       "flex",
        alignItems:    "center",
        background:    hovered ? (isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.018)") : surface.surface,
        borderBottom:  `1px solid ${surface.border}`,
        cursor:        "pointer",
        transition:    "background 0.15s ease",
        animation:     "rowIn 0.35s ease both",
        animationDelay: `${index * 55}ms`,
      }}
    >
      <div style={{ padding: "12px 14px 12px 16px", flexShrink: 0 }}>
        <CompanyAvatar name={team.companyName} size={40} />
      </div>
      <div style={{ flex: 1, minWidth: 0, padding: "14px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: surface.text, letterSpacing: "-0.02em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {team.companyName}
          </span>
          <StatusChip status={team.status} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          {cd?.industry    && <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, color: surface.muted }}><Briefcase size={10} strokeWidth={2} />{cd.industry}</span>}
          {cd?.inviteCount ? <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, color: surface.muted }}><Users     size={10} strokeWidth={2} />{cd.inviteCount} members</span> : null}
          {cd?.size        && <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, color: surface.muted }}><BarChart3 size={10} strokeWidth={2} />{cd.size}</span>}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "0 20px", flexShrink: 0 }}>
        <div style={{ textAlign: "right" }}>
          <p style={{ margin: 0, fontSize: 10, fontWeight: 600, color: surface.subtle, letterSpacing: "0.06em", textTransform: "uppercase" as const }}>Joined</p>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: surface.muted }}>{fmtDateShort(team.acceptedAt)}</p>
        </div>
        <ChevronRight size={15} strokeWidth={2} style={{ color: hovered ? accentColor : surface.subtle, transform: hovered ? "translateX(2px)" : "none", transition: "all 0.15s ease" }} />
      </div>
    </div>
  );
}

// ─── TEAM DETAIL ─────────────────────────────────────────────────────────────
function TeamDetail({ team, userId, onBack }: { team: TeamCard; userId: string; onBack: () => void }) {
  const { isDark, surface, accentColor } = useTheme();
  const cd = team.companyDetail;

  const [programs,        setPrograms]        = useState<ProgramEnrollment[]>([]);
  const [programsLoading, setProgramsLoading] = useState(true);
  const [xpToast,         setXpToast]         = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      setProgramsLoading(true);
      try {
        const res = await db.listDocuments(USERS_DB_ID, ENROLLMENTS_COLLECTION_ID, [
          Query.equal("userId",    userId),
          Query.equal("companyId", team.companyId),
          Query.orderDesc("$createdAt"),
          Query.limit(50),
        ]);
        setPrograms(res.documents.map(d => parseEnrollment(d as unknown as Record<string, unknown>)));
      } catch (e) {
        console.error("[TeamsPage] programs error:", e);
      } finally {
        setProgramsLoading(false);
      }
    };
    load();
  }, [userId, team.companyId]);

  const handleMarkComplete = (id: string, xpEarned: number) => {
    setPrograms(prev => prev.map(p => p.$id === id ? { ...p, status: "completed" } : p));
    setXpToast(xpEarned);
  };

  const activePrograms    = programs.filter(p => p.status === "active");
  const completedPrograms = programs.filter(p => p.status === "completed");

  return (
    <>
      <div style={{ animation: "detailIn 0.25s ease both" }}>
        {/* Back */}
        <button
          onClick={onBack}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 12px", marginBottom: 24, background: surface.surface, border: `1px solid ${surface.border}`, color: surface.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "color 0.15s" }}
          onMouseEnter={e => (e.currentTarget.style.color = accentColor)}
          onMouseLeave={e => (e.currentTarget.style.color = surface.muted)}
        >
          <ArrowLeft size={12} strokeWidth={2.5} />All Teams
        </button>

        {/* Hero */}
        <div style={{ position: "relative", overflow: "hidden", background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.015)", border: `1px solid ${surface.border}`, borderBottom: "none", padding: "28px 28px 24px" }}>
          <div style={{ position: "absolute", inset: 0, opacity: isDark ? 0.06 : 0.04, backgroundImage: `radial-gradient(circle, ${surface.border} 1px, transparent 1px)`, backgroundSize: "20px 20px", pointerEvents: "none" }} />
          <div style={{ display: "flex", alignItems: "flex-start", gap: 18, position: "relative" }}>
            <CompanyAvatar name={team.companyName} size={64} />
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                <h1 style={{ margin: 0, fontSize: "clamp(1.25rem, 2.5vw, 1.55rem)", fontWeight: 900, color: surface.text, letterSpacing: "-0.03em" }}>{team.companyName}</h1>
                <StatusChip status={team.status} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                {cd?.industry && <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: surface.muted }}><Briefcase size={11} strokeWidth={2} />{cd.industry}</span>}
                {cd?.size     && <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: surface.muted }}><Globe     size={11} strokeWidth={2} />{cd.size} company</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", border: `1px solid ${surface.border}`, borderTop: `2px solid ${accentColor}`, marginBottom: 24, background: surface.surface }}>
          {[
            { label: "Team Members", value: cd?.inviteCount ? `${cd.inviteCount}` : "—", sub: "total invited",    Icon: Users,        color: accentColor },
            { label: "Your Status",  value: team.status.charAt(0).toUpperCase() + team.status.slice(1), sub: "membership", Icon: UserCheck, color: team.status === "active" ? "#22c55e" : "#f59e0b" },
            { label: "Member Since", value: fmtDateShort(team.acceptedAt), sub: team.invitedAt ? `Invited ${fmtDate(team.invitedAt)}` : "pending", Icon: CalendarDays, color: "#6366f1" },
            { label: "Programs",     value: programs.length > 0 ? `${completedPrograms.length}/${programs.length}` : "—", sub: "completed", Icon: Package, color: accentColor },
          ].map(({ label, value, sub, Icon, color }, i) => (
            <div key={label} style={{ padding: "18px 20px", borderRight: i < 3 ? `1px solid ${surface.border}` : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
                <div style={{ width: 24, height: 24, background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={12} strokeWidth={2} color={color} />
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em", color: surface.subtle }}>{label}</span>
              </div>
              <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color, letterSpacing: "-0.02em", lineHeight: 1 }}>{value}</p>
              <p style={{ margin: "4px 0 0", fontSize: 11, color: surface.subtle }}>{sub}</p>
            </div>
          ))}
        </div>

        {/* Programs section */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <Package size={14} strokeWidth={2} style={{ color: accentColor }} />
            <h2 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: surface.text, letterSpacing: "-0.02em" }}>Wellness Programs</h2>
            {programs.length > 0 && (
              <span style={{ padding: "2px 8px", fontSize: 10, fontWeight: 700, background: `${accentColor}12`, color: accentColor }}>{programs.length}</span>
            )}
          </div>

          {programsLoading && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "24px 0" }}>
              <Loader2 size={14} className="animate-spin" style={{ color: accentColor }} />
              <span style={{ fontSize: 12, color: surface.muted }}>Loading programs…</span>
            </div>
          )}

          {!programsLoading && programs.length === 0 && (
            <div style={{ border: `1px dashed ${surface.border}`, padding: "48px 32px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 14, background: isDark ? "rgba(255,255,255,0.01)" : "rgba(0,0,0,0.008)" }}>
              <div style={{ width: 52, height: 52, background: `${accentColor}12`, border: `1px solid ${accentColor}25`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Sparkles size={22} strokeWidth={1.5} style={{ color: accentColor }} />
              </div>
              <div>
                <p style={{ margin: 0, marginBottom: 6, fontSize: 14, fontWeight: 800, color: surface.text, letterSpacing: "-0.02em" }}>No programs yet</p>
                <p style={{ margin: 0, fontSize: 12.5, color: surface.muted, maxWidth: 340, lineHeight: 1.75 }}>
                  When your employer broadcasts a wellness program to your team, it will appear here. Programs are matched to you based on your health profile.
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: `${accentColor}10`, border: `1px solid ${accentColor}25` }}>
                <Zap size={11} strokeWidth={2} style={{ color: accentColor }} />
                <span style={{ fontSize: 11.5, fontWeight: 600, color: accentColor }}>Completing programs earns you Health XP</span>
              </div>
            </div>
          )}

          {!programsLoading && activePrograms.length > 0 && (
            <>
              {completedPrograms.length > 0 && (
                <p style={{ margin: "0 0 10px", fontSize: 10, fontWeight: 700, color: surface.subtle, textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>Active</p>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: completedPrograms.length > 0 ? 20 : 0 }}>
                {activePrograms.map(e => (
                  <ProgramCard
                    key={e.$id}
                    enrollment={{ ...e, userId }}
                    onMarkComplete={handleMarkComplete}
                  />
                ))}
              </div>
            </>
          )}

          {!programsLoading && completedPrograms.length > 0 && (
            <>
              <p style={{ margin: "0 0 10px", fontSize: 10, fontWeight: 700, color: surface.subtle, textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>Completed</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {completedPrograms.map(e => (
                  <ProgramCard
                    key={e.$id}
                    enrollment={{ ...e, userId }}
                    onMarkComplete={handleMarkComplete}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Privacy notice */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "14px 16px", background: isDark ? "rgba(13,148,136,0.05)" : "rgba(13,148,136,0.03)", border: `1px solid ${accentColor}20` }}>
          <Lock size={12} strokeWidth={2} style={{ color: accentColor, flexShrink: 0, marginTop: 2 }} />
          <div>
            <p style={{ margin: 0, marginBottom: 3, fontSize: 11.5, fontWeight: 700, color: accentColor }}>Your data is private</p>
            <p style={{ margin: 0, fontSize: 11, color: surface.subtle, lineHeight: 1.7 }}>
              Your employer sees only anonymised, aggregated risk data — never your individual results. Programs are matched to you automatically by the system.
            </p>
          </div>
        </div>
      </div>

      {/* XP earned toast */}
      {xpToast !== null && (
        <XpToast xp={xpToast} onDone={() => setXpToast(null)} />
      )}
    </>
  );
}

// ─── SKELETON ────────────────────────────────────────────────────────────────
function ListSkeleton() {
  const { surface } = useTheme();
  return (
    <div style={{ border: `1px solid ${surface.border}` }}>
      {[0, 1, 2].map(i => (
        <div key={i} className="animate-pulse" style={{ height: 72, background: surface.surface, borderBottom: `1px solid ${surface.border}`, animationDelay: `${i * 80}ms` }} />
      ))}
    </div>
  );
}

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────
function EmptyState() {
  const { isDark, surface, accentColor } = useTheme();
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "80px 24px", textAlign: "center", gap: 18, border: `1px solid ${surface.border}`, background: surface.surface }}>
      <div style={{ width: 64, height: 64, background: isDark ? "rgba(13,148,136,0.08)" : "rgba(13,148,136,0.05)", border: `1px solid ${accentColor}25`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={dicebearUrl("hmex-placeholder", 48)} alt="No teams" width={48} height={48} style={{ imageRendering: "pixelated", opacity: 0.5 }} />
      </div>
      <div>
        <h2 style={{ fontSize: 17, fontWeight: 800, color: surface.text, margin: 0, marginBottom: 7, letterSpacing: "-0.02em" }}>Not part of any team yet</h2>
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

  const [teams,      setTeams]      = useState<TeamCard[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [selected,   setSelected]   = useState<TeamCard | null>(null);

  const loadTeams = useCallback(async (userId: string) => {
    try {
      setError(null);
      const res = await db.listDocuments(USERS_DB_ID, COMPANY_MEMBERS_COLLECTION_ID, [
        Query.equal("userId", userId),
        Query.notEqual("status", "removed"),
        Query.orderDesc("$createdAt"),
        Query.limit(20),
      ]);
      const memberships = res.documents.map(d => parseMembership(d as unknown as Record<string, unknown>));
      const uniqueIds   = [...new Set(memberships.map(m => m.companyId))];
      const cMap        = new Map<string, CompanyDetail>();
      await Promise.all(uniqueIds.map(async cid => {
        if (!cid) return;
        try {
          const doc = await db.getDocument(USERS_DB_ID, COMPANIES_COLLECTION_ID, cid);
          cMap.set(cid, parseCompany(doc as unknown as Record<string, unknown>));
        } catch { /* skip */ }
      }));
      setTeams(memberships.map(m => ({ ...m, companyDetail: cMap.get(m.companyId) ?? null })));
    } catch {
      setError("Failed to load teams. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (auth.user) loadTeams(auth.user.id); }, [auth.user, loadTeams]);

  const handleRefresh = async () => {
    if (!auth.user || refreshing) return;
    setRefreshing(true);
    setLoading(true);
    await loadTeams(auth.user.id);
    setRefreshing(false);
  };

  if (auth.loading) return null;

  const activeCount  = teams.filter(t => t.status === "active").length;
  const pendingCount = teams.filter(t => t.status === "pending").length;

  return (
    <DashboardLayout>
      <div style={{ paddingBottom: 56 }}>
        {!selected && (
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 28 }}>
            <div>
              <p style={{ margin: 0, marginBottom: 4, fontSize: 10.5, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: accentColor }}>Workspace</p>
              <h1 style={{ margin: 0, fontSize: "clamp(1.5rem, 3vw, 1.9rem)", fontWeight: 900, color: surface.text, letterSpacing: "-0.03em", lineHeight: 1.1 }}>My Teams</h1>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {!loading && teams.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", border: `1px solid ${surface.border}`, overflow: "hidden" }}>
                  {[
                    { label: "Total",   value: teams.length,  color: accentColor },
                    { label: "Active",  value: activeCount,   color: "#22c55e"   },
                    { label: "Pending", value: pendingCount,  color: "#f59e0b"   },
                  ].map(({ label, value, color }, i) => (
                    <div key={label} style={{ padding: "8px 14px", textAlign: "center", borderRight: i < 2 ? `1px solid ${surface.border}` : "none", background: surface.surface }}>
                      <p style={{ margin: 0, fontSize: 15, fontWeight: 900, color, lineHeight: 1 }}>{value}</p>
                      <p style={{ margin: "2px 0 0", fontSize: 9.5, fontWeight: 600, color: surface.subtle, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>{label}</p>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", background: surface.surface, border: `1px solid ${surface.border}`, color: surface.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", opacity: refreshing ? 0.5 : 1, transition: "opacity 0.2s" }}
              >
                <RefreshCw size={12} strokeWidth={2} className={refreshing ? "animate-spin" : ""} />Refresh
              </button>
            </div>
          </div>
        )}

        {error && !selected && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", marginBottom: 16, background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.16)" }}>
            <AlertCircle size={13} style={{ color: "#ef4444", flexShrink: 0 }} />
            <p style={{ margin: 0, flex: 1, fontSize: 12, color: "#ef4444" }}>{error}</p>
            <button onClick={handleRefresh} style={{ fontSize: 11, fontWeight: 700, color: "#ef4444", background: "none", border: "none", cursor: "pointer" }}>Retry</button>
          </div>
        )}

        {selected && auth.user && (
          <TeamDetail team={selected} userId={auth.user.id} onBack={() => setSelected(null)} />
        )}

        {!selected && (
          <>
            {loading && <ListSkeleton />}
            {!loading && teams.length === 0 && <EmptyState />}
            {!loading && teams.length > 0 && (
              <>
                <div style={{ display: "flex", alignItems: "center", padding: "8px 16px", borderBottom: `1px solid ${surface.border}`, background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)" }}>
                  <div style={{ width: 56, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: surface.subtle, textTransform: "uppercase" as const, letterSpacing: "0.1em" }}>Organisation</span>
                  </div>
                  <div style={{ paddingRight: 34, textAlign: "right" as const }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: surface.subtle, textTransform: "uppercase" as const, letterSpacing: "0.1em" }}>Joined</span>
                  </div>
                </div>
                <div style={{ border: `1px solid ${surface.border}`, borderTop: "none" }}>
                  {teams.map((team, i) => (
                    <TeamRow key={team.$id} team={team} index={i} onClick={() => setSelected(team)} />
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 14px", marginTop: 16, background: surface.surface, border: `1px solid ${surface.border}` }}>
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
        @keyframes rowIn    { from { opacity: 0; transform: translateX(-6px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes detailIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes xpPop    { from { opacity: 0; transform: translateY(16px) scale(0.85); } to { opacity: 1; transform: translateY(0) scale(1); } }
      `}</style>
    </DashboardLayout>
  );
}