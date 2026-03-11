/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import EmployerLayout from "@/components/dashboard/employer/EmployerLayout";
import ThemeToggle from "@/components/Themetoggle";
import {
  getCompanyByOwner,
  getCompanyMembers,
  type Company,
} from "@/services/companyService";
import { fetchLatestAssessment } from "@/services/AppwriteService";
import {
  employerProgramsAiService,
  checkRefreshEligibility,
  type WorkforceSnapshot,
  type ProgramsAiResponse,
  type AiProgramSuggestion,
} from "@/services/employerProgramsAiService";
import {
  Sparkles, RefreshCw, ChevronDown, ChevronUp,
  Target, Users, Activity, Heart, Brain, Salad, Dumbbell,
  AlertTriangle, CheckCircle, Clock, Building2, Loader2,
  MessageSquare, Send, X, Lightbulb, TrendingUp, BarChart3,
  Shield, Zap, Trophy, Star, Megaphone, Gift, Award, Handshake,
  Stethoscope, Apple, PersonStanding, Bike, FlaskConical, Scale,
  Wind, Smile, Pill, Thermometer, Eye, Clipboard, Moon, Coffee,
  Ban, Droplets, ShieldCheck, Radio,
} from "lucide-react";

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface MemberWithRisk {
  $id: string; email: string; fullName: string | null; status: string;
  userId: string | null; $createdAt: string;
  assessment: {
    diabetesLevel: string; diabetesScore: number;
    hypertensionLevel: string; hypertensionScore: number;
    profileGender: string; profileAge: string; profileBmi: string; $createdAt: string;
  } | null;
}

// ─── ICON RESOLVER ────────────────────────────────────────────────────────────
function resolveIcon(name: string, size = 20, color?: string): React.ReactNode {
  const iconMap: Record<string, React.ComponentType<any>> = {
    Heart, Activity, Stethoscope, Brain, Apple, Dumbbell, ShieldCheck, TrendingUp,
    Users, Clipboard, FlaskConical, Scale, Wind, Salad, Bike, PersonStanding,
    Pill, Thermometer, Eye, Smile, Trophy, Target, Zap, Moon, Coffee, Ban,
    Droplets, Star, Megaphone, Gift, Award, Handshake, Shield, CheckCircle,
    BarChart3, MessageSquare, Lightbulb,
  };
  const Comp = iconMap[name] || Sparkles;
  return <Comp size={size} color={color} />;
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function Skeleton({ w, h, r = 4 }: { w: string | number; h: number; r?: number }) {
  const { isDark } = useTheme();
  return (
    <div className="animate-pulse" style={{
      width: w, height: h, borderRadius: r,
      background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"
    }} />
  );
}

function priorityColor(p: string) {
  switch (p) {
    case "critical": return "#EF4444";
    case "high":     return "#F59E0B";
    case "medium":   return "#3B82F6";
    default:         return "#94A3B8";
  }
}
function priorityBg(p: string) {
  switch (p) {
    case "critical": return "rgba(239,68,68,0.10)";
    case "high":     return "rgba(245,158,11,0.10)";
    case "medium":   return "rgba(59,130,246,0.10)";
    default:         return "rgba(148,163,184,0.10)";
  }
}

function buildSnapshot(company: Company | null, members: MemberWithRisk[]): WorkforceSnapshot {
  const active   = members.filter(m => m.status === "active");
  const assessed = active.filter(m => m.assessment);
  const diab = { low: 0, medium: 0, high: 0, none: 0 };
  const hyp  = { low: 0, medium: 0, high: 0, none: 0 };
  let dSum = 0, hSum = 0;
  const gender: Record<string, number> = {};
  const age:    Record<string, number> = {};
  const bmi:    Record<string, number> = {};
  assessed.forEach(m => {
    const a  = m.assessment!;
    const dl = a.diabetesLevel?.toLowerCase();
    const hl = a.hypertensionLevel?.toLowerCase();
    if (dl === "low") diab.low++;        else if (dl === "medium") diab.medium++;
    else if (dl === "high") diab.high++; else diab.none++;
    if (hl === "low") hyp.low++;         else if (hl === "medium") hyp.medium++;
    else if (hl === "high") hyp.high++;  else hyp.none++;
    dSum += a.diabetesScore || 0;
    hSum += a.hypertensionScore || 0;
    if (a.profileGender) gender[a.profileGender] = (gender[a.profileGender] || 0) + 1;
    if (a.profileAge)    age[a.profileAge]        = (age[a.profileAge]       || 0) + 1;
    if (a.profileBmi)    bmi[a.profileBmi]        = (bmi[a.profileBmi]       || 0) + 1;
  });
  const n = assessed.length || 1;
  return {
    companyName:          company?.name     || "Your Company",
    industry:             company?.industry || "General",
    totalEmployees:       members.length,
    activeEmployees:      active.length,
    assessedEmployees:    assessed.length,
    assessmentRate:       active.length ? Math.round((assessed.length / active.length) * 100) : 0,
    avgDiabetesScore:     Math.round(dSum / n),
    avgHypertensionScore: Math.round(hSum / n),
    diabetesBreakdown:    diab,
    hypertensionBreakdown: hyp,
    highRiskCount:        diab.high + hyp.high,
    genderBreakdown:      gender,
    ageBreakdown:         age,
    bmiBreakdown:         bmi,
  };
}

// ─── BROADCAST RESULT TOAST ───────────────────────────────────────────────────
interface BroadcastResult {
  sent:       number;
  skipped:    number;
  targetRisk: string;
  programTitle: string;
}

function riskLabel(risk: string): string {
  switch (risk) {
    case "high_diabetes":    return "high diabetes risk";
    case "high_hypertension": return "high hypertension risk";
    case "high_any":         return "high-risk employees";
    case "moderate":         return "moderate-risk employees";
    default:                 return "all employees";
  }
}

function BroadcastToast({ result, onClose, accentColor, c }: {
  result: BroadcastResult; onClose: () => void; accentColor: string; c: any;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 6000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
      style={{
        position: "fixed", bottom: 90, right: 24, zIndex: 200,
        maxWidth: 360, width: "calc(100vw - 48px)",
        background: c.surface, border: `1px solid ${accentColor}40`,
        borderLeft: `3px solid ${accentColor}`,
        padding: "14px 16px",
        boxShadow: `0 8px 32px rgba(0,0,0,0.15)`,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div style={{
          width: 28, height: 28, background: `${accentColor}15`,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <Radio size={14} style={{ color: accentColor }} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: "0 0 3px", fontSize: 12, fontWeight: 800, color: c.text }}>
            Program Broadcast Complete
          </p>
          <p style={{ margin: 0, fontSize: 11.5, color: c.muted, lineHeight: 1.6 }}>
            <strong style={{ color: c.text }}>{result.sent}</strong> employee{result.sent !== 1 ? "s" : ""} with{" "}
            {riskLabel(result.targetRisk)} received <strong style={{ color: c.text }}>&quot;{result.programTitle}&quot;</strong>.
            {result.skipped > 0 && ` ${result.skipped} skipped (no matching risk or already enrolled).`}
          </p>
        </div>
        <button
          onClick={onClose}
          style={{ background: "none", border: "none", cursor: "pointer", color: c.muted, padding: 2, flexShrink: 0 }}
        >
          <X size={13} />
        </button>
      </div>
    </motion.div>
  );
}

// ─── PROGRAM CARD ─────────────────────────────────────────────────────────────
function ProgramCard({ prog, c, accentColor, companyId, companyName, sentBy, onBroadcastSuccess }: {
  prog: AiProgramSuggestion;
  c: any;
  accentColor: string;
  companyId: string;
  companyName: string;
  sentBy: string;
  onBroadcastSuccess: (result: BroadcastResult) => void;
}) {
  const [expanded,      setExpanded]      = useState(false);
  const [broadcasting,  setBroadcasting]  = useState(false);
  const [alreadySent,   setAlreadySent]   = useState(false);
  const [broadcastError, setBroadcastError] = useState<string | null>(null);

  const handleBroadcast = async () => {
    if (broadcasting || alreadySent) return;
    setBroadcasting(true);
    setBroadcastError(null);

    try {
      const res = await fetch("/api/broadcast-programs", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId,
          companyName,
          sentBy,
          program: {
            id:          prog.id,
            title:       prog.title,
            description: prog.description,
            category:    prog.category,
            priority:    prog.priority,
            tagline:     prog.tagline,
            targetGroup: prog.targetGroup,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          setAlreadySent(true);
          setBroadcastError("Already sent to your team.");
        } else {
          setBroadcastError(data.error || "Broadcast failed. Please try again.");
        }
        return;
      }

      setAlreadySent(true);
      onBroadcastSuccess({
        sent:         data.sent,
        skipped:      data.skipped,
        targetRisk:   data.targetRisk,
        programTitle: prog.title,
      });
    } catch {
      setBroadcastError("Network error. Please try again.");
    } finally {
      setBroadcasting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      style={{
        background: c.surface,
        border: `1px solid ${c.border}`,
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      <div style={{ padding: "18px 20px" }}>
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 2,
            background: `${prog.color}15`,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, color: prog.color,
          }}>
            {resolveIcon(prog.iconName, 20, prog.color)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 3 }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: c.text, lineHeight: 1.3 }}>
                {prog.title}
              </p>
              <span style={{
                padding: "3px 8px", borderRadius: 2,
                background: priorityBg(prog.priority),
                color: priorityColor(prog.priority),
                fontSize: 10, fontWeight: 800, textTransform: "uppercase",
                letterSpacing: "0.07em", flexShrink: 0,
              }}>
                {prog.priority}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 11, color: accentColor, fontWeight: 700, fontStyle: "italic" }}>
              {prog.tagline}
            </p>
          </div>
        </div>

        <p style={{ margin: "0 0 12px", fontSize: 12, color: c.muted, lineHeight: 1.6 }}>
          {prog.description}
        </p>

        {/* Meta row */}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Users size={11} style={{ color: c.muted }} />
            <span style={{ fontSize: 11, color: c.muted }}>{prog.targetGroup}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Clock size={11} style={{ color: c.muted }} />
            <span style={{ fontSize: 11, color: c.muted }}>{prog.duration}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <TrendingUp size={11} style={{ color: prog.color }} />
            <span style={{ fontSize: 11, color: prog.color, fontWeight: 600 }}>{prog.estimatedImpact}</span>
          </div>
        </div>

        {/* Urgency */}
        <div style={{
          padding: "7px 10px",
          background: `${prog.color}0C`,
          border: `1px solid ${prog.color}22`,
          borderRadius: 2, marginBottom: 14,
        }}>
          <p style={{ margin: 0, fontSize: 11, color: prog.color, fontWeight: 600 }}>
            <Zap size={11} style={{ display: "inline", marginRight: 4 }} />
            Why now: {prog.urgency}
          </p>
        </div>

        {/* ── SEND TO TEAM BUTTON ─────────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          {/* Expand toggle */}
          <button
            onClick={() => setExpanded(v => !v)}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              fontSize: 12, fontWeight: 700, color: accentColor,
              background: "none", border: "none", cursor: "pointer", padding: 0,
            }}
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {expanded ? "Hide" : "Show"} Plan
          </button>

          {/* Broadcast button */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
            <button
              onClick={handleBroadcast}
              disabled={broadcasting || alreadySent}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "7px 14px",
                background: alreadySent
                  ? "rgba(34,197,94,0.10)"
                  : accentColor,
                border: alreadySent
                  ? "1px solid rgba(34,197,94,0.30)"
                  : "none",
                color: alreadySent ? "#22c55e" : "white",
                fontSize: 11, fontWeight: 700,
                cursor: alreadySent || broadcasting ? "default" : "pointer",
                opacity: broadcasting ? 0.7 : 1,
                transition: "all 0.2s",
              }}
            >
              {broadcasting ? (
                <>
                  <Loader2 size={11} className="animate-spin" />
                  Sending…
                </>
              ) : alreadySent ? (
                <>
                  <CheckCircle size={11} />
                  Sent to Team
                </>
              ) : (
                <>
                  <Radio size={11} />
                  Send to Team
                </>
              )}
            </button>
            {broadcastError && (
              <p style={{ margin: 0, fontSize: 10, color: broadcastError.includes("Already") ? "#22c55e" : "#EF4444", textAlign: "right" }}>
                {broadcastError}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Expanded: steps + KPIs + resources */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ padding: "0 20px 20px", borderTop: `1px solid ${c.border}` }}>
              {/* Steps */}
              <p style={{ margin: "16px 0 10px", fontSize: 11, fontWeight: 800, color: c.muted, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                Implementation Steps
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {prog.steps.map((step, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: "50%",
                      background: `${prog.color}18`, border: `1.5px solid ${prog.color}44`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 10, fontWeight: 800, color: prog.color, flexShrink: 0,
                    }}>{i + 1}</div>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: prog.color }}>
                        {step.week} · {step.responsible}
                      </span>
                      <p style={{ margin: "2px 0 0", fontSize: 12, color: c.text }}>{step.action}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* KPIs */}
              <p style={{ margin: "14px 0 8px", fontSize: 11, fontWeight: 800, color: c.muted, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                Success Metrics
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {prog.kpis.map((k, i) => (
                  <span key={i} style={{
                    padding: "4px 10px", background: `${prog.color}10`,
                    color: prog.color, borderRadius: 2, fontSize: 11, fontWeight: 600,
                  }}>{k}</span>
                ))}
              </div>

              {/* Resources */}
              <p style={{ margin: "14px 0 8px", fontSize: 11, fontWeight: 800, color: c.muted, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                Resources Needed
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {prog.resources.map((r, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <CheckCircle size={11} style={{ color: "#10B981", flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: c.muted }}>{r}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── AI CHAT PANEL ────────────────────────────────────────────────────────────
function AiChatPanel({ snapshot, c, accentColor, onClose }: {
  snapshot: WorkforceSnapshot; c: any; accentColor: string; onClose: () => void;
}) {
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([
    { role: "ai", text: `Hi! I'm your workforce health AI. Ask me anything about ${snapshot.companyName}'s health data, what programs to prioritise, or how to engage your team.` },
  ]);
  const [input,   setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const q = input.trim();
    setInput("");
    setMessages(m => [...m, { role: "user", text: q }]);
    setLoading(true);
    try {
      const answer = await employerProgramsAiService.askAboutWorkforce(q, snapshot);
      setMessages(m => [...m, { role: "ai", text: answer }]);
    } catch {
      setMessages(m => [...m, { role: "ai", text: "Sorry, I couldn't reach the AI right now. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }}
      style={{
        position: "fixed", right: 16, bottom: 80,
        width: 360, maxHeight: 520,
        background: c.surface, border: `1px solid ${c.border}`,
        borderRadius: 4, boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
        display: "flex", flexDirection: "column", zIndex: 100, overflow: "hidden",
      }}
    >
      <div style={{
        padding: "12px 16px", borderBottom: `1px solid ${c.border}`,
        display: "flex", alignItems: "center", gap: 8, background: `${accentColor}0C`,
      }}>
        <Sparkles size={15} style={{ color: accentColor }} />
        <span style={{ fontSize: 13, fontWeight: 800, color: c.text, flex: 1 }}>AI Health Advisor</span>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: c.muted, padding: 2 }}>
          <X size={15} />
        </button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{
              maxWidth: "85%", padding: "9px 12px",
              borderRadius: msg.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
              background: msg.role === "user" ? accentColor : (c.bg || "rgba(0,0,0,0.04)"),
              color: msg.role === "user" ? "white" : c.text,
              fontSize: 12, lineHeight: 1.6,
            }}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", gap: 4, padding: "8px 12px" }}>
            {[0, 1, 2].map(i => (
              <motion.div key={i}
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }}
                style={{ width: 6, height: 6, borderRadius: "50%", background: accentColor }}
              />
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div style={{ padding: "10px 12px", borderTop: `1px solid ${c.border}`, display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          placeholder="Ask about your workforce health..."
          style={{
            flex: 1, padding: "8px 12px", fontSize: 12,
            border: `1px solid ${c.border}`, borderRadius: 2,
            background: "transparent", color: c.text, outline: "none",
          }}
        />
        <button
          onClick={send} disabled={!input.trim() || loading}
          style={{
            padding: "8px 12px", background: accentColor, border: "none",
            borderRadius: 2, cursor: "pointer", color: "white",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <Send size={13} />
        </button>
      </div>
    </motion.div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function EmployerProgramsPage() {
  const { user }                         = useAuth();
  const { isDark, surface, accentColor } = useTheme();
  const c = surface;

  const [company,        setCompany]        = useState<Company | null>(null);
  const [members,        setMembers]        = useState<MemberWithRisk[]>([]);
  const [snapshot,       setSnapshot]       = useState<WorkforceSnapshot | null>(null);
  const [aiData,         setAiData]         = useState<ProgramsAiResponse | null>(null);
  const [loading,        setLoading]        = useState(true);
  const [aiLoading,      setAiLoading]      = useState(false);
  const [aiError,        setAiError]        = useState<string | null>(null);
  const [tab,            setTab]            = useState<"programs" | "interventions" | "engagement">("programs");
  const [chatOpen,       setChatOpen]       = useState(false);
  const [lastRefresh,    setLastRefresh]    = useState<Date | null>(null);
  const [refreshAllowed, setRefreshAllowed] = useState(false);
  const [nextRefreshAt,  setNextRefreshAt]  = useState<Date | null>(null);
  const [refreshCooldownMsg, setRefreshCooldownMsg] = useState<string | null>(null);
  const [broadcastResult,    setBroadcastResult]    = useState<BroadcastResult | null>(null);

  const loadData = useCallback(async (uid: string) => {
    setLoading(true);
    try {
      let co = await getCompanyByOwner(uid).catch(() => null);
      if (!co) {
        const { getUserProfile } = await import("@/services/userService");
        const p = await getUserProfile(uid).catch(() => null);
        if (p?.companyName) {
          co = {
            $id: p.companyId || uid, $createdAt: "",
            name: p.companyName, ownerId: uid,
            size: p.companySize || "", industry: p.industry || "",
            inviteCount: 0,
          } as Company;
        }
      }
      setCompany(co);
      if (!co) { setLoading(false); return; }

      const rows = await getCompanyMembers(co.$id).catch(() => []);
      const withRisks: MemberWithRisk[] = await Promise.all(
        rows.map(async (m) => {
          if (m.status !== "active" || !m.userId) return { ...m, assessment: null };
          const a = await fetchLatestAssessment(m.userId).catch(() => null);
          return {
            ...m,
            assessment: a ? {
              diabetesLevel:     a.diabetesLevel,
              diabetesScore:     Number(a.diabetesScore),
              hypertensionLevel: a.hypertensionLevel,
              hypertensionScore: Number(a.hypertensionScore),
              profileGender:     a.profileGender,
              profileAge:        a.profileAge,
              profileBmi:        a.profileBmi,
              $createdAt:        a.$createdAt,
            } : null,
          };
        })
      );
      setMembers(withRisks);

      const snap = buildSnapshot(co, withRisks);
      setSnapshot(snap);
      setLoading(false);
      setLastRefresh(new Date());

      const { allowed, nextAllowedAt } = await checkRefreshEligibility(co.$id);
      setRefreshAllowed(allowed);
      setNextRefreshAt(nextAllowedAt);

      setAiLoading(true);
      setAiError(null);
      try {
        const result = await employerProgramsAiService.getOrGenerateAnalysis(co.$id, snap);
        setAiData(result);
      } catch (e: any) {
        setAiError("AI analysis failed. Please retry.");
        console.error("[Programs] AI error:", e);
      } finally {
        setAiLoading(false);
      }
    } catch (e) {
      console.error("[Programs] load error:", e);
      setLoading(false);
    }
  }, []);

  const handleRefresh = async () => {
    if (!user || !company || !snapshot) return;
    const { allowed, nextAllowedAt } = await checkRefreshEligibility(company.$id);
    if (!allowed && nextAllowedAt) {
      const diff    = nextAllowedAt.getTime() - Date.now();
      const hours   = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      setRefreshCooldownMsg(`Programs were recently updated. You can refresh again in ${hours}h ${minutes}m.`);
      setTimeout(() => setRefreshCooldownMsg(null), 5000);
      return;
    }
    setAiLoading(true);
    setAiError(null);
    try {
      const result = await employerProgramsAiService.generateAndSave(company.$id, snapshot);
      setAiData(result);
      setLastRefresh(new Date());
      setRefreshAllowed(false);
      setNextRefreshAt(new Date(Date.now() + 3 * 60 * 60 * 1000));
    } catch (e: any) {
      setAiError("AI refresh failed. Please try again later.");
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => { if (user) loadData(user.id); }, [user]);

  const cooldownLabel = (() => {
    if (!nextRefreshAt) return null;
    const diff = nextRefreshAt.getTime() - Date.now();
    if (diff <= 0) return null;
    const hours   = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    return `Next refresh in ${hours}h ${minutes}m`;
  })();

  return (
    <EmployerLayout>
      <div style={{ paddingBottom: 80 }}>

        {/* ── Page Header ─────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          style={{
            display: "flex", alignItems: "flex-start", justifyContent: "space-between",
            flexWrap: "wrap", gap: 16, marginBottom: 28,
          }}
        >
          <div>
            <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 800, color: accentColor, letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Wellness Initiatives
            </p>
            <h1 style={{ margin: 0, fontSize: "clamp(1.35rem,3vw,1.7rem)", fontWeight: 900, color: c.text, letterSpacing: "-0.03em", lineHeight: 1.15 }}>
              AI Health Programs
            </h1>
            {company && (
              <p style={{ margin: "4px 0 0", fontSize: 12, color: c.muted, display: "flex", alignItems: "center", gap: 5 }}>
                <Building2 size={12} />{company.name} · {company.industry || "Workforce Health"}
                {lastRefresh && (
                  <span style={{ fontSize: 10, opacity: 0.55 }}>
                    {" "}· {lastRefresh.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                )}
              </p>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button
                onClick={handleRefresh}
                disabled={loading || aiLoading || (!refreshAllowed && !!nextRefreshAt)}
                title={!refreshAllowed && cooldownLabel ? cooldownLabel : "Refresh AI programs"}
                style={{
                  padding: "8px 14px", background: "transparent",
                  border: `1px solid ${c.border}`,
                  color: (!refreshAllowed && !!nextRefreshAt) ? c.muted : c.text,
                  borderRadius: 2,
                  cursor: (!refreshAllowed && !!nextRefreshAt) ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", gap: 6,
                  fontSize: 12, fontWeight: 600,
                  opacity: (!refreshAllowed && !!nextRefreshAt) ? 0.5 : 1,
                }}
              >
                <RefreshCw size={13} className={aiLoading ? "animate-spin" : ""} />
                Refresh Programs
              </button>
              <button
                onClick={() => setChatOpen(v => !v)}
                style={{
                  padding: "8px 16px", background: accentColor, border: "none",
                  color: "white", borderRadius: 2, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700,
                }}
              >
                <MessageSquare size={13} />Ask AI
              </button>
            </div>
            {cooldownLabel && !refreshAllowed && (
              <p style={{ margin: 0, fontSize: 10, color: c.muted, textAlign: "right" }}>{cooldownLabel}</p>
            )}
          </div>
        </motion.div>

        {/* ── Cooldown toast ──────────────────────────────────────────────── */}
        <AnimatePresence>
          {refreshCooldownMsg && (
            <motion.div
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 16px", background: "rgba(245,158,11,0.06)",
                border: "1px solid rgba(245,158,11,0.25)", borderRadius: 2, marginBottom: 16,
              }}
            >
              <Clock size={16} style={{ color: "#F59E0B", flexShrink: 0 }} />
              <p style={{ margin: 0, fontSize: 12, color: "#F59E0B", fontWeight: 600 }}>{refreshCooldownMsg}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Urgent Alert ─────────────────────────────────────────────────── */}
        <AnimatePresence>
          {!loading && aiData?.urgentMessage && (
            <motion.div
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 16px", background: "rgba(239,68,68,0.06)",
                border: "1px solid rgba(239,68,68,0.25)", borderRadius: 2, marginBottom: 20,
              }}
            >
              <AlertTriangle size={16} style={{ color: "#EF4444", flexShrink: 0 }} />
              <p style={{ margin: 0, fontSize: 12, color: "#EF4444", fontWeight: 600 }}>{aiData.urgentMessage}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Snapshot Stats ───────────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12, marginBottom: 24 }}>
          {[
            { icon: <Users size={15} />,       label: "Total",     value: snapshot?.totalEmployees      ?? "—", color: accentColor },
            { icon: <CheckCircle size={15} />, label: "Active",    value: snapshot?.activeEmployees     ?? "—", color: "#10B981"  },
            { icon: <Activity size={15} />,    label: "Assessed",  value: `${snapshot?.assessmentRate   ?? 0}%`, color: "#8B5CF6" },
            { icon: <Heart size={15} />,       label: "High Risk", value: snapshot?.highRiskCount       ?? "—", color: "#EF4444"  },
            { icon: <BarChart3 size={15} />,   label: "Avg Diab",  value: snapshot?.avgDiabetesScore    ?? "—", color: "#F59E0B"  },
            { icon: <Shield size={15} />,      label: "Avg BP",    value: snapshot?.avgHypertensionScore ?? "—", color: "#3B82F6" },
          ].map((s, i) => (
            <motion.div
              key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              style={{ padding: "14px 16px", background: c.surface, border: `1px solid ${c.border}`, borderRadius: 2 }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
                <span style={{ color: s.color }}>{s.icon}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: c.muted, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                  {s.label}
                </span>
              </div>
              {loading
                ? <Skeleton w="60%" h={24} />
                : <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color: c.text, lineHeight: 1 }}>{s.value}</p>
              }
            </motion.div>
          ))}
        </div>

        {/* ── AI Headline ──────────────────────────────────────────────────── */}
        {!loading && (
          <div style={{
            padding: "14px 18px",
            background: isDark ? `${accentColor}0A` : `${accentColor}06`,
            border: `1px solid ${accentColor}20`,
            borderRadius: 2, marginBottom: 24,
            display: "flex", alignItems: "flex-start", gap: 12,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 2,
              background: `${accentColor}18`,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <Sparkles size={15} style={{ color: accentColor }} />
            </div>
            <div>
              <p style={{ margin: "0 0 2px", fontSize: 11, fontWeight: 800, color: accentColor, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                AI Analysis
              </p>
              {aiLoading ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Loader2 size={13} className="animate-spin" style={{ color: accentColor }} />
                  <span style={{ fontSize: 12, color: c.muted }}>Analysing your workforce data…</span>
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: 13, color: c.text, lineHeight: 1.5 }}>
                  {aiData?.headline || "Building your personalised health program recommendations…"}
                </p>
              )}
              {aiData?.generatedAt && !aiLoading && (
                <p style={{ margin: "4px 0 0", fontSize: 10, color: c.muted, opacity: 0.6 }}>
                  Programs generated {new Date(aiData.generatedAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── Tabs ─────────────────────────────────────────────────────────── */}
        {!loading && (
          <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: `1px solid ${c.border}`, paddingBottom: 0 }}>
            {([
              { key: "programs",      label: "AI Programs", icon: <Sparkles size={13} /> },
              { key: "interventions", label: "Quick Wins",  icon: <Lightbulb size={13} /> },
              { key: "engagement",    label: "Engagement",  icon: <Target size={13} /> },
            ] as const).map(t => (
              <button
                key={t.key} onClick={() => setTab(t.key)}
                style={{
                  padding: "8px 16px", background: "none", border: "none",
                  borderBottom: tab === t.key ? `2px solid ${accentColor}` : "2px solid transparent",
                  marginBottom: -1, cursor: "pointer", fontSize: 12,
                  fontWeight: tab === t.key ? 800 : 600,
                  color: tab === t.key ? accentColor : c.muted,
                  display: "flex", alignItems: "center", gap: 5, transition: "color 0.15s",
                }}
              >
                {t.icon}{t.label}
              </button>
            ))}
          </div>
        )}

        {/* ── TAB: AI Programs ─────────────────────────────────────────────── */}
        {tab === "programs" && (
          <>
            {aiLoading || loading ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(340px,1fr))", gap: 14 }}>
                {[1, 2, 3, 4].map(i => (
                  <div key={i} style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 2, padding: 20 }}>
                    <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                      <Skeleton w={44} h={44} r={2} />
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                        <Skeleton w="70%" h={16} />
                        <Skeleton w="45%" h={12} />
                      </div>
                    </div>
                    <Skeleton w="100%" h={48} />
                    <div style={{ height: 8 }} />
                    <Skeleton w="60%" h={12} />
                  </div>
                ))}
              </div>
            ) : aiError ? (
              <div style={{ padding: "32px 24px", textAlign: "center", background: c.surface, border: `1px solid ${c.border}`, borderRadius: 2 }}>
                <AlertTriangle size={24} style={{ color: "#F59E0B", marginBottom: 10 }} />
                <p style={{ margin: "0 0 16px", fontSize: 14, color: c.text, fontWeight: 700 }}>{aiError}</p>
                <button
                  onClick={() => snapshot && company && employerProgramsAiService.generateAndSave(company.$id, snapshot).then(setAiData)}
                  style={{ padding: "9px 20px", background: accentColor, border: "none", color: "white", borderRadius: 2, cursor: "pointer", fontSize: 12, fontWeight: 700 }}
                >
                  Retry AI Analysis
                </button>
              </div>
            ) : !aiData?.programs?.length ? (
              <div style={{ padding: "48px 24px", textAlign: "center" }}>
                <Sparkles size={28} style={{ color: c.muted, opacity: 0.3, marginBottom: 12 }} />
                <p style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 700, color: c.text }}>No programs generated yet</p>
                <p style={{ margin: 0, fontSize: 12, color: c.muted }}>Add employees and complete assessments to unlock AI recommendations.</p>
              </div>
            ) : (
              <>
                {/* Broadcast hint */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "9px 14px", marginBottom: 16,
                  background: `${accentColor}08`, border: `1px solid ${accentColor}20`,
                }}>
                  <Radio size={12} style={{ color: accentColor, flexShrink: 0 }} />
                  <p style={{ margin: 0, fontSize: 11, color: accentColor, fontWeight: 600 }}>
                    Click <strong>Send to Team</strong> on any program to automatically route it to the right employees based on their health risk — without revealing individual data.
                  </p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(340px,1fr))", gap: 14 }}>
                  {(aiData?.programs || []).map((prog, i) => (
                    <ProgramCard
                      key={prog.id || i}
                      prog={prog}
                      c={c}
                      accentColor={accentColor}
                      companyId={company?.$id  || ""}
                      companyName={company?.name || ""}
                      sentBy={user?.id || ""}
                      onBroadcastSuccess={setBroadcastResult}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* ── TAB: Quick Win Interventions ─────────────────────────────────── */}
        {tab === "interventions" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 12 }}>
            {aiLoading || loading
              ? [1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} style={{ padding: 18, background: c.surface, border: `1px solid ${c.border}`, borderRadius: 2 }}>
                    <Skeleton w={36} h={36} r={2} />
                    <div style={{ height: 10 }} />
                    <Skeleton w="60%" h={14} />
                    <div style={{ height: 8 }} />
                    <Skeleton w="100%" h={40} />
                  </div>
                ))
              : (aiData?.interventions || []).map((tip, i) => (
                <motion.div
                  key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  style={{ padding: "18px 18px 16px", background: c.surface, border: `1px solid ${c.border}`, borderRadius: 2 }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <div style={{ color: accentColor, flexShrink: 0 }}>
                      {resolveIcon(tip.iconName, 20, accentColor)}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: c.text }}>{tip.title}</p>
                      <span style={{ fontSize: 10, fontWeight: 700, color: accentColor, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        {tip.category.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                  <p style={{ margin: "0 0 12px", fontSize: 12, color: c.muted, lineHeight: 1.6 }}>{tip.body}</p>
                  <div style={{ padding: "8px 10px", background: `${accentColor}0C`, border: `1px solid ${accentColor}20`, borderRadius: 2 }}>
                    <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: accentColor }}>
                      <Zap size={11} style={{ display: "inline", marginRight: 4 }} />
                      Do this today: {tip.actionable}
                    </p>
                  </div>
                </motion.div>
              ))
            }
          </div>
        )}

        {/* ── TAB: Engagement Strategies ───────────────────────────────────── */}
        {tab === "engagement" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 12 }}>
            {aiLoading || loading
              ? [1, 2, 3, 4].map(i => (
                  <div key={i} style={{ padding: 20, background: c.surface, border: `1px solid ${c.border}`, borderRadius: 2 }}>
                    <Skeleton w="55%" h={16} />
                    <div style={{ height: 10 }} />
                    <Skeleton w="100%" h={32} />
                  </div>
                ))
              : (aiData?.engagement || []).map((strat, i) => (
                <motion.div
                  key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  style={{ padding: "18px 20px", background: c.surface, border: `1px solid ${c.border}`, borderRadius: 2 }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <div style={{ color: accentColor, flexShrink: 0 }}>
                      {resolveIcon(strat.iconName, 20, accentColor)}
                    </div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: c.text }}>{strat.title}</p>
                  </div>
                  <p style={{ margin: "0 0 12px", fontSize: 12, color: c.muted, lineHeight: 1.6 }}>{strat.why}</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
                    {strat.how.map((step, j) => (
                      <div key={j} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                        <div style={{
                          width: 18, height: 18, borderRadius: "50%",
                          background: `${accentColor}18`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 9, fontWeight: 800, color: accentColor, flexShrink: 0, marginTop: 1,
                        }}>{j + 1}</div>
                        <p style={{ margin: 0, fontSize: 12, color: c.text }}>{step}</p>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 10px", background: `${accentColor}08`, borderRadius: 2 }}>
                    <TrendingUp size={11} style={{ color: accentColor }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: accentColor }}>Measure: {strat.metric}</span>
                  </div>
                </motion.div>
              ))
            }
          </div>
        )}

        <ThemeToggle />
      </div>

      {/* ── Broadcast result toast ────────────────────────────────────────────── */}
      <AnimatePresence>
        {broadcastResult && (
          <BroadcastToast
            result={broadcastResult}
            c={c}
            accentColor={accentColor}
            onClose={() => setBroadcastResult(null)}
          />
        )}
      </AnimatePresence>

      {/* ── Floating AI Chat ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {chatOpen && snapshot && (
          <AiChatPanel snapshot={snapshot} c={c} accentColor={accentColor} onClose={() => setChatOpen(false)} />
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}
        onClick={() => setChatOpen(v => !v)}
        style={{
          position: "fixed", bottom: 24, right: 24,
          width: 52, height: 52, borderRadius: "50%",
          background: accentColor, border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 8px 24px ${accentColor}55`, zIndex: 99,
        }}
      >
        {chatOpen ? <X size={20} color="white" /> : <MessageSquare size={20} color="white" />}
      </motion.button>
    </EmployerLayout>
  );
}