/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import EmployerLayout from "@/components/dashboard/employer/EmployerLayout";
import { StatCard, SectionHeader, Card } from "@/components/dashboard/Dashboardwidgets";
import ThemeToggle from "@/components/Themetoggle";
import {
  getCompanyByOwner,
  getCompanyMembers,
  type Company,
  type EmployeeDashboardRow,
} from "@/services/companyService";
import { fetchLatestAssessment } from "@/services/AppwriteService";
import {
  Users, Clock, CheckCircle, ChevronRight, BarChart3, Building2,
  Plus, TrendingUp, Activity, Heart, AlertCircle, RefreshCw,
  UserPlus, Shield,
} from "lucide-react";

// ─── Chart.js ────────────────────────────────────────────────────────────────
let _Chart: any = null;
async function getChart() {
  if (_Chart) return _Chart;
  const mod = await import("chart.js");
  mod.Chart.register(...mod.registerables);
  _Chart = mod.Chart;
  return _Chart;
}

// ─── TYPES ────────────────────────────────────────────────────────────────────
// Internal only — userId kept for assessment fetching, never rendered
interface MemberRisk {
  memberId:          string;
  userId:            string;
  status:            string;
  diabetesLevel:     string | null;
  hypertensionLevel: string | null;
  lastAssessment:    string | null;
  hasAssessment:     boolean;
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function Skeleton({ style }: { style?: React.CSSProperties }) {
  return <div className="animate-pulse" style={{ background: "rgba(128,128,128,0.12)", borderRadius: 2, ...style }} />;
}

function riskColor(level: string | null): string {
  switch (level?.toLowerCase()) {
    case "low":    return "#10B981";
    case "medium": return "#F59E0B";
    case "high":   return "#EF4444";
    default:       return "#94A3B8";
  }
}

function timeOfDay(): "morning" | "afternoon" | "evening" {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

const HERO_IMAGES: Record<string, string> = {
  morning:   "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1500&auto=format",
  afternoon: "https://images.unsplash.com/photo-1624864873074-4264549e5cf1?q=80&w=1500&auto=format",
  evening:   "https://images.unsplash.com/photo-1534271057238-c2c170a76672?q=80&w=1500&auto=format",
};

// ─── GREETING HERO ────────────────────────────────────────────────────────────
function GreetingCard({ userName, companyName, activeCount, pendingCount, accentColor, isDark }: {
  userName: string; companyName: string;
  activeCount: number; pendingCount: number;
  accentColor: string; isDark: boolean;
}) {
  const tod      = timeOfDay();
  const imgUrl   = HERO_IMAGES[tod];
  const first    = userName?.split(" ")[0] || "there";
  const greeting = { morning: `Good morning, ${first}`, afternoon: `Good afternoon, ${first}`, evening: `Good evening, ${first}` }[tod];
  const subtitle = { morning: "Here's your workforce health overview to start the day.", afternoon: "Here's how your team is doing right now.", evening: "Here's a summary of your workforce health today." }[tod];

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      style={{ position: "relative", borderRadius: 2, overflow: "hidden", marginBottom: 28, minHeight: 176 }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${imgUrl})`, backgroundSize: "cover", backgroundPosition: "center" }} />
      <div style={{ position: "absolute", inset: 0, background: isDark ? "linear-gradient(120deg,rgba(0,0,0,.80) 0%,rgba(0,0,0,.52) 60%,rgba(0,0,0,.28) 100%)" : "linear-gradient(120deg,rgba(8,18,28,.74) 0%,rgba(8,18,40,.50) 60%,rgba(8,18,60,.18) 100%)" }} />
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: accentColor }} />
      <div style={{ position: "relative", zIndex: 1, padding: "26px 28px 22px 32px", display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 16 }}>
        <div>
          <motion.p initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: accentColor, letterSpacing: "0.10em", textTransform: "uppercase" }}>
            {companyName}
          </motion.p>
          <motion.h2 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1.2 }}>
            {greeting}
          </motion.h2>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
            style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,.70)" }}>
            {subtitle}
          </motion.p>
        </div>
        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
          style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <div style={{ padding: "8px 14px", background: "rgba(16,185,129,.22)", borderRadius: 2, border: "1px solid rgba(16,185,129,.35)" }}>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#fff", lineHeight: 1 }}>{activeCount}</p>
            <p style={{ margin: "3px 0 0", fontSize: 10, color: "rgba(255,255,255,.70)", fontWeight: 600 }}>Active</p>
          </div>
          <div style={{ padding: "8px 14px", background: "rgba(245,158,11,.20)", borderRadius: 2, border: "1px solid rgba(245,158,11,.32)" }}>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#fff", lineHeight: 1 }}>{pendingCount}</p>
            <p style={{ margin: "3px 0 0", fontSize: 10, color: "rgba(255,255,255,.70)", fontWeight: 600 }}>Pending</p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

// ─── DONUT CHART ─────────────────────────────────────────────────────────────
function DonutChart({ low, medium, high, noData, label, icon, surface }: {
  low: number; medium: number; high: number; noData: number;
  label: string; icon: React.ReactNode; surface: any;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef  = useRef<any>(null);
  const total = low + medium + high + noData;

  useEffect(() => {
    let alive = true;
    getChart().then((Chart) => {
      if (!alive || !canvasRef.current) return;
      chartRef.current?.destroy();
      chartRef.current = new Chart(canvasRef.current, {
        type: "doughnut",
        data: {
          labels: ["Low Risk", "Medium Risk", "High Risk", "No Data"],
          datasets: [{
            data:            [low, medium, high, noData],
            backgroundColor: ["#10B981", "#F59E0B", "#EF4444", "rgba(148,163,184,0.22)"],
            borderColor:     ["#10B981", "#F59E0B", "#EF4444", "rgba(148,163,184,0.12)"],
            borderWidth: 2, hoverOffset: 4,
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: true, cutout: "70%",
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: (ctx: any) => ` ${ctx.label}: ${ctx.raw}` } },
          },
          animation: { animateRotate: true, duration: 700 },
        },
      });
    });
    return () => { alive = false; chartRef.current?.destroy(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [low, medium, high, noData]);

  const highPct = total > 0 ? Math.round((high / total) * 100) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, alignSelf: "flex-start" }}>
        <span style={{ color: surface.muted }}>{icon}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: surface.text }}>{label}</span>
      </div>
      <div style={{ position: "relative", width: 130, height: 130 }}>
        <canvas ref={canvasRef} width={130} height={130} />
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: surface.text, lineHeight: 1 }}>{total}</span>
          <span style={{ fontSize: 10, color: surface.muted, fontWeight: 600 }}>total</span>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 5, width: "100%" }}>
        {([["#10B981", "Low", low], ["#F59E0B", "Medium", medium], ["#EF4444", "High", high], ["rgba(148,163,184,0.5)", "No data", noData]] as [string, string, number][])
          .map(([color, lbl, val]) => (
            <div key={lbl} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
                <span style={{ color: surface.muted }}>{lbl}</span>
              </div>
              <span style={{ fontWeight: 700, color: surface.text }}>{val}</span>
            </div>
          ))}
      </div>
      {high > 0 && (
        <div style={{ width: "100%", padding: "6px 10px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 2, display: "flex", alignItems: "center", gap: 6 }}>
          <AlertCircle size={11} color="#EF4444" />
          <span style={{ fontSize: 10, fontWeight: 600, color: "#EF4444" }}>{high} need{high === 1 ? "s" : ""} attention ({highPct}%)</span>
        </div>
      )}
    </div>
  );
}

// ─── RISK DISTRIBUTION BAR ────────────────────────────────────────────────────
// Shows aggregate distribution as a stacked bar — no individual data
function RiskDistributionBar({ low, medium, high, noData, label, accentColor }: {
  low: number; medium: number; high: number; noData: number; label: string; accentColor: string;
}) {
  const total = low + medium + high + noData || 1;
  const pctLow    = Math.round((low    / total) * 100);
  const pctMed    = Math.round((medium / total) * 100);
  const pctHigh   = Math.round((high   / total) * 100);
  const pctNoData = 100 - pctLow - pctMed - pctHigh;

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "inherit" }}>{label}</span>
        <span style={{ fontSize: 10, opacity: 0.6 }}>{low + medium + high} assessed of {total - noData + (noData)}</span>
      </div>
      <div style={{ display: "flex", height: 10, borderRadius: 5, overflow: "hidden", gap: 1 }}>
        {pctLow    > 0 && <motion.div initial={{ width: 0 }} animate={{ width: `${pctLow}%`    }} transition={{ duration: 0.7, ease: "easeOut" }} style={{ background: "#10B981", height: "100%" }} />}
        {pctMed    > 0 && <motion.div initial={{ width: 0 }} animate={{ width: `${pctMed}%`    }} transition={{ duration: 0.7, ease: "easeOut", delay: 0.05 }} style={{ background: "#F59E0B", height: "100%" }} />}
        {pctHigh   > 0 && <motion.div initial={{ width: 0 }} animate={{ width: `${pctHigh}%`   }} transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }} style={{ background: "#EF4444", height: "100%" }} />}
        {pctNoData > 0 && <motion.div initial={{ width: 0 }} animate={{ width: `${pctNoData}%` }} transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }} style={{ background: "rgba(148,163,184,0.25)", height: "100%" }} />}
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 5, flexWrap: "wrap" }}>
        {[["#10B981", `Low ${pctLow}%`], ["#F59E0B", `Med ${pctMed}%`], ["#EF4444", `High ${pctHigh}%`], ["rgba(148,163,184,0.5)", `None ${pctNoData}%`]].map(([color, txt]) => (
          <div key={txt} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: color }} />
            <span style={{ fontSize: 10, opacity: 0.7 }}>{txt}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ASSESSMENT PROGRESS RING ─────────────────────────────────────────────────
function AssessmentRing({ assessed, total, accentColor, surface }: {
  assessed: number; total: number; accentColor: string; surface: any;
}) {
  const pct = total > 0 ? Math.round((assessed / total) * 100) : 0;
  const r   = 40;
  const circ = 2 * Math.PI * r;
  const dash  = (pct / 100) * circ;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "18px 20px" }}>
      <div style={{ position: "relative", flexShrink: 0 }}>
        <svg width={96} height={96} viewBox="0 0 96 96">
          <circle cx={48} cy={48} r={r} fill="none" stroke="rgba(148,163,184,0.15)" strokeWidth={10} />
          <motion.circle
            cx={48} cy={48} r={r} fill="none"
            stroke={pct >= 80 ? "#10B981" : pct >= 50 ? "#F59E0B" : accentColor}
            strokeWidth={10}
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ - dash }}
            transition={{ duration: 1, ease: "easeOut" }}
            strokeLinecap="round"
            transform="rotate(-90 48 48)"
          />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 18, fontWeight: 900, color: surface.text, lineHeight: 1 }}>{pct}%</span>
          <span style={{ fontSize: 9, color: surface.muted, fontWeight: 600 }}>rate</span>
        </div>
      </div>
      <div>
        <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 800, color: surface.text }}>{assessed} of {total}</p>
        <p style={{ margin: "0 0 8px", fontSize: 11, color: surface.muted }}>employees assessed</p>
        {pct < 50 && total > 0 && (
          <p style={{ margin: 0, fontSize: 10, color: "#F59E0B", fontWeight: 600 }}>
            ⚡ Encourage more to complete assessments for better insights
          </p>
        )}
        {pct >= 80 && (
          <p style={{ margin: 0, fontSize: 10, color: "#10B981", fontWeight: 600 }}>
            ✓ Excellent participation rate
          </p>
        )}
      </div>
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function EmployerDashboardPage() {
  const { user } = useAuth();
  const { isDark, surface, accentColor } = useTheme();
  const router = useRouter();

  const [company,        setCompany]        = useState<Company | null>(null);
  const [members,        setMembers]        = useState<EmployeeDashboardRow[]>([]);
  const [memberRisks,    setMemberRisks]    = useState<MemberRisk[]>([]);
  const [loadingCompany, setLoadingCompany] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [loadingRisks,   setLoadingRisks]   = useState(false);
  const [lastRefreshed,  setLastRefreshed]  = useState<Date | null>(null);

  const c = surface;

  const loadData = async (uid: string) => {
    setLoadingCompany(true);
    try {
      let co = await getCompanyByOwner(uid).catch(() => null);
      if (!co) {
        const { getUserProfile } = await import("@/services/userService");
        const profile = await getUserProfile(uid).catch(() => null);
        if (profile?.companyName) {
          co = { $id: profile.companyId || uid, $createdAt: "", name: profile.companyName, ownerId: uid, size: profile.companySize || "", industry: profile.industry || "", inviteCount: 0 } as Company;
        }
      }
      setCompany(co);

      if (co) {
        setLoadingMembers(true);
        const rows = await getCompanyMembers(co.$id).catch(() => []);
        setMembers(rows);
        setLoadingMembers(false);

        const activeRows = rows.filter((m) => m.status === "active" && m.userId);
        if (activeRows.length > 0) {
          setLoadingRisks(true);
          const risks = await Promise.all(
            activeRows.map(async (m): Promise<MemberRisk> => {
              // Only store userId + risk levels — no name, email, avatar
              const base: MemberRisk = {
                memberId: m.$id, userId: m.userId!, status: m.status,
                diabetesLevel: null, hypertensionLevel: null,
                lastAssessment: null, hasAssessment: false,
              };
              try {
                const a = await fetchLatestAssessment(m.userId!);
                if (!a) return base;
                return {
                  ...base,
                  diabetesLevel:     a.diabetesLevel?.toLowerCase()     || null,
                  hypertensionLevel: a.hypertensionLevel?.toLowerCase() || null,
                  lastAssessment:    a.$createdAt,
                  hasAssessment:     true,
                };
              } catch { return base; }
            })
          );
          setMemberRisks(risks);
          setLoadingRisks(false);
        }
      }
    } catch (e) {
      console.error("[Dashboard] load error:", e);
    } finally {
      setLoadingCompany(false);
      setLastRefreshed(new Date());
    }
  };

  useEffect(() => {
    if (!user) return;
    loadData(user.id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Aggregate counts only — no individual identity attached
  const activeCount   = members.filter((m) => m.status === "active").length;
  const pendingCount  = members.filter((m) => m.status === "pending").length;
  const totalCount    = members.length;
  const assessedCount = memberRisks.filter((m) => m.hasAssessment).length;

  const diabLow  = memberRisks.filter((m) => m.hasAssessment && m.diabetesLevel    === "low").length;
  const diabMed  = memberRisks.filter((m) => m.hasAssessment && m.diabetesLevel    === "medium").length;
  const diabHigh = memberRisks.filter((m) => m.hasAssessment && m.diabetesLevel    === "high").length;
  const diabNo   = activeCount - diabLow - diabMed - diabHigh;

  const hypLow   = memberRisks.filter((m) => m.hasAssessment && m.hypertensionLevel === "low").length;
  const hypMed   = memberRisks.filter((m) => m.hasAssessment && m.hypertensionLevel === "medium").length;
  const hypHigh  = memberRisks.filter((m) => m.hasAssessment && m.hypertensionLevel === "high").length;
  const hypNo    = activeCount - hypLow - hypMed - hypHigh;

  const isLoading = loadingCompany || loadingMembers;

  return (
    <EmployerLayout>

      {/* ── Greeting Hero ────────────────────────────────────────────────── */}
      {loadingCompany
        ? <Skeleton style={{ width: "100%", height: 176, marginBottom: 28 }} />
        : <GreetingCard
            userName={user?.name || ""} companyName={company?.name || "Your Company"}
            activeCount={activeCount} pendingCount={pendingCount}
            accentColor={accentColor} isDark={isDark}
          />
      }

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        {loadingCompany ? (
          <><Skeleton style={{ width: 240, height: 28, marginBottom: 8 }} /><Skeleton style={{ width: 160, height: 14 }} /></>
        ) : (
          <>
            <SectionHeader title={company?.name || "Dashboard"} />
            {company && (
              <p style={{ margin: "4px 0 0", fontSize: 12, color: c.muted, display: "flex", alignItems: "center", gap: 6 }}>
                <Building2 size={13} />{company.industry || "Your organisation"}
                {lastRefreshed && (
                  <span style={{ marginLeft: 8, fontSize: 10, opacity: 0.55 }}>
                    · Updated {lastRefreshed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                )}
                <button onClick={() => user && loadData(user.id)} style={{ background: "none", border: "none", cursor: "pointer", color: c.muted, padding: 0, marginLeft: 4, display: "flex", alignItems: "center" }}>
                  <RefreshCw size={11} className={isLoading ? "animate-spin" : ""} />
                </button>
              </p>
            )}
          </>
        )}
      </div>

      {/* ── Stat Cards ──────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(155px, 1fr))", gap: 16, marginBottom: 32 }}>
        {isLoading ? (
          [1,2,3,4].map((i) => (
            <div key={i} style={{ padding: 20, background: c.surface, border: `1px solid ${c.border}` }}>
              <Skeleton style={{ width: 32, height: 32, marginBottom: 12 }} />
              <Skeleton style={{ width: "55%", height: 26, marginBottom: 8 }} />
              <Skeleton style={{ width: "75%", height: 13 }} />
            </div>
          ))
        ) : (
          <>
            <StatCard icon={<Users size={18} />}       value={totalCount}    label="Total Employees"      />
            <StatCard icon={<CheckCircle size={18} />} value={activeCount}   label="Active Members"       />
            <StatCard icon={<Clock size={18} />}       value={pendingCount}  label="Pending Invites"      />
            <StatCard icon={<Activity size={18} />}    value={assessedCount} label="Assessments Complete" />
          </>
        )}
      </div>

      {/* ── Risk Overview ────────────────────────────────────────────────── */}
      {!isLoading && activeCount > 0 && (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <SectionHeader title="Workforce Health Overview" />
            {loadingRisks && (
              <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: c.muted }}>
                <RefreshCw size={12} className="animate-spin" />Loading health data…
              </span>
            )}
          </div>

          {loadingRisks ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 28 }}>
              <Skeleton style={{ height: 240 }} /><Skeleton style={{ height: 240 }} />
            </div>
          ) : assessedCount === 0 ? (
            <div style={{ padding: "32px 24px", textAlign: "center", background: c.surface, border: `1px solid ${c.border}`, borderRadius: 2, marginBottom: 28 }}>
              <Activity size={28} style={{ color: c.muted, opacity: 0.3, marginBottom: 10 }} />
              <p style={{ margin: "0 0 6px", fontWeight: 700, fontSize: 14, color: c.text }}>No assessments yet</p>
              <p style={{ margin: 0, fontSize: 12, color: c.muted, maxWidth: 300, marginInline: "auto" }}>
                Risk data appears here once employees complete their health assessments.
              </p>
            </div>
          ) : (
            <>
              {/* Assessment participation ring + distribution bars */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginBottom: 16 }}>

                {/* Assessment participation */}
                <div style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 2 }}>
                  <div style={{ padding: "16px 20px 0", borderBottom: `1px solid ${c.border}` }}>
                    <p style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 800, color: c.text, display: "flex", alignItems: "center", gap: 6 }}>
                      <CheckCircle size={13} style={{ color: accentColor }} />Assessment Participation
                    </p>
                  </div>
                  <AssessmentRing assessed={assessedCount} total={activeCount} accentColor={accentColor} surface={surface} />
                </div>

                {/* Risk distribution bars */}
                <div style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 2, padding: "16px 20px" }}>
                  <p style={{ margin: "0 0 16px", fontSize: 12, fontWeight: 800, color: c.text, display: "flex", alignItems: "center", gap: 6 }}>
                    <BarChart3 size={13} style={{ color: accentColor }} />Risk Distribution
                  </p>
                  <div style={{ color: c.text }}>
                    <RiskDistributionBar low={diabLow} medium={diabMed} high={diabHigh} noData={diabNo} label="Diabetes" accentColor={accentColor} />
                    <RiskDistributionBar low={hypLow}  medium={hypMed}  high={hypHigh}  noData={hypNo}  label="Hypertension" accentColor={accentColor} />
                  </div>
                  {(diabHigh > 0 || hypHigh > 0) && (
                    <div style={{ marginTop: 12, padding: "8px 12px", background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.18)", borderRadius: 2, display: "flex", alignItems: "center", gap: 7 }}>
                      <AlertCircle size={12} color="#EF4444" />
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#EF4444" }}>
                        {Math.max(diabHigh, hypHigh)} employees at high risk — consider sending a wellness program
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Donut charts */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 16, marginBottom: 28 }}>
                <Card>
                  <DonutChart low={diabLow} medium={diabMed} high={diabHigh} noData={diabNo}
                    label="Diabetes Risk" icon={<Activity size={14} />} surface={surface} />
                </Card>
                <Card>
                  <DonutChart low={hypLow} medium={hypMed} high={hypHigh} noData={hypNo}
                    label="Hypertension Risk" icon={<Heart size={14} />} surface={surface} />
                </Card>
              </div>
            </>
          )}
        </>
      )}

      {/* ── Team quick actions ───────────────────────────────────────────── */}
      <SectionHeader title="Team Management" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 28, marginTop: 12 }}>
        {[
          { icon: <UserPlus size={16} />, label: "Manage Team",       sub: `${totalCount} members · ${pendingCount} pending`,    color: accentColor,  action: () => router.push("/dashboard/employer/employees") },
          { icon: <BarChart3 size={16} />, label: "Full Analytics",   sub: "Detailed workforce health reports",                  color: "#8B5CF6",    action: () => router.push("/dashboard/employer/reports") },
          { icon: <TrendingUp size={16} />, label: "Health Programs", sub: "AI-generated wellness programs",                     color: "#F59E0B",    action: () => router.push("/dashboard/employer/programs") },
          { icon: <Shield size={16} />, label: "Privacy & Compliance", sub: "Consent register & data governance",                color: "#10B981",    action: () => router.push("/dashboard/employer/compliance") },
        ].map((item, i) => (
          <motion.button key={i} onClick={item.action}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
            style={{ padding: "16px 18px", background: c.surface, border: `1px solid ${c.border}`, borderRadius: 2, cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 2, background: `${item.color}14`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ color: item.color }}>{item.icon}</span>
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: c.text }}>{item.label}</p>
              <p style={{ margin: "2px 0 0", fontSize: 10, color: c.muted }}>{item.sub}</p>
            </div>
            <ChevronRight size={14} style={{ color: c.muted, marginLeft: "auto", flexShrink: 0 }} />
          </motion.button>
        ))}
      </div>

      {/* ── Empty state ──────────────────────────────────────────────────── */}
      {!isLoading && totalCount === 0 && company && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          style={{ padding: "40px 24px", textAlign: "center", background: c.surface, border: `1px solid ${c.border}`, borderRadius: 2, marginBottom: 24 }}>
          <Users size={32} style={{ color: c.muted, opacity: 0.3, marginBottom: 12 }} />
          <p style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700, color: c.text }}>No team members yet</p>
          <p style={{ margin: "0 0 20px", fontSize: 12, color: c.muted, maxWidth: 300, marginInline: "auto" }}>
            Invite employees to start. Their individual health data always stays private — you only see anonymised team insights.
          </p>
          <button onClick={() => router.push("/dashboard/employer/employees")}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 22px", fontSize: 12, fontWeight: 700, background: accentColor, color: "white", border: "none", borderRadius: 2, cursor: "pointer" }}>
            <Plus size={14} /> Add Employees
          </button>
        </motion.div>
      )}

      {/* ── Privacy notice ────────────────────────────────────────────────── */}
      {!loadingCompany && company && totalCount > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          style={{ padding: "14px 18px", display: "flex", alignItems: "flex-start", gap: 10, background: isDark ? `${accentColor}08` : `${accentColor}05`, border: `1px solid ${accentColor}18`, borderRadius: 2, marginBottom: 24 }}>
          <Shield size={13} style={{ color: accentColor, flexShrink: 0, marginTop: 1 }} />
          <p style={{ margin: 0, fontSize: 11, color: c.muted, lineHeight: 1.65 }}>
            <strong style={{ color: c.text }}>Privacy protected:</strong>{" "}
            All health data shown above is anonymised and aggregated. Individual employee health scores are never visible to employers.
          </p>
        </motion.div>
      )}

      <ThemeToggle />
    </EmployerLayout>
  );
}