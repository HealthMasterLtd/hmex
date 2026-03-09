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
  Plus, TrendingUp, TrendingDown, Minus, Activity, Heart, AlertCircle,
  RefreshCw,
} from "lucide-react";

// ─── Chart.js dynamic import (avoids SSR issues) ─────────────────────────────
let _Chart: any = null;
async function getChart() {
  if (_Chart) return _Chart;
  const mod = await import("chart.js");
  mod.Chart.register(...mod.registerables);
  _Chart = mod.Chart;
  return _Chart;
}

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface MemberRisk {
  memberId:          string;
  userId:            string;
  email:             string;
  fullName:          string | null;
  avatar:            string | null;
  status:            string;
  diabetesLevel:     string | null;
  diabetesScore:     number | null;
  hypertensionLevel: string | null;
  hypertensionScore: number | null;
  lastAssessment:    string | null;
  hasAssessment:     boolean;
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function Skeleton({ style }: { style?: React.CSSProperties }) {
  return <div className="animate-pulse" style={{ background: "rgba(128,128,128,0.12)", borderRadius: 2, ...style }} />;
}

function riskColor(level: string | null): string {
  if (!level) return "#94A3B8";
  switch (level.toLowerCase()) {
    case "low":    return "#10B981";
    case "medium": return "#F59E0B";
    case "high":   return "#EF4444";
    default:       return "#94A3B8";
  }
}

function riskBg(level: string | null): string {
  switch (level?.toLowerCase()) {
    case "low":    return "rgba(16,185,129,0.12)";
    case "medium": return "rgba(245,158,11,0.12)";
    case "high":   return "rgba(239,68,68,0.12)";
    default:       return "rgba(148,163,184,0.10)";
  }
}

function riskIcon(level: string | null) {
  switch (level?.toLowerCase()) {
    case "low":    return <TrendingDown size={11} />;
    case "high":   return <TrendingUp size={11} />;
    default:       return <Minus size={11} />;
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

// ─── AVATAR HELPERS ───────────────────────────────────────────────────────────
const APPWRITE_ENDPOINT = "https://fra.cloud.appwrite.io/v1";
const APPWRITE_PROJECT  = "hmex";
const BUCKET_ID         = "profile_images";

function buildAvatarUrl(avatar: string | null): string | null {
  if (!avatar) return null;
  if (avatar.startsWith("http")) return avatar;
  // avatar field stores the profile document $id which is also the file id
  return `${APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${avatar}/view?project=${APPWRITE_PROJECT}&mode=admin`;
}

// ─── AVATAR COMPONENT ─────────────────────────────────────────────────────────
function MemberAvatar({
  name, avatar, diabetesLevel, hypertensionLevel, hasAssessment, size = 28,
}: {
  name: string;
  avatar: string | null;
  diabetesLevel: string | null;
  hypertensionLevel: string | null;
  hasAssessment: boolean;
  size?: number;
}) {
  // appwrite → real photo, dicebear → illustrated gender-neutral, initials → last resort
  const [stage, setStage] = useState<"appwrite" | "dicebear" | "initials">(
    avatar ? "appwrite" : "dicebear"
  );

  const url = buildAvatarUrl(avatar);

  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

  const fallbackGradient = hasAssessment
    ? `linear-gradient(135deg, ${riskColor(diabetesLevel)}, ${riskColor(hypertensionLevel)})`
    : "rgba(148,163,184,0.2)";

  const circle: React.CSSProperties = { width: size, height: size, borderRadius: "50%", flexShrink: 0 };

  if (stage === "appwrite" && url) {
    return (
      <img
        src={url}
        alt={name}
        style={{ ...circle, objectFit: "cover" }}
        onError={() => setStage("dicebear")}
      />
    );
  }

  if (stage === "dicebear") {
    return (
      <img
        src={`https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(name || "user")}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf&backgroundType=gradientLinear`}
        alt={name}
        style={{ ...circle, objectFit: "cover", background: "rgba(148,163,184,0.1)" }}
        onError={() => setStage("initials")}
      />
    );
  }

  return (
    <div style={{ ...circle, background: fallbackGradient, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.36, fontWeight: 700, color: "white" }}>
      {initials}
    </div>
  );
}

// ─── GREETING HERO CARD ───────────────────────────────────────────────────────
function GreetingCard({
  userName, companyName, activeCount, pendingCount, accentColor, isDark,
}: {
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
    <motion.div
      initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      style={{ position: "relative", borderRadius: 2, overflow: "hidden", marginBottom: 28, minHeight: 176 }}
    >
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

// ─── BAR CHART ────────────────────────────────────────────────────────────────
function ScoreBarChart({ members, field, label, surface }: {
  members: MemberRisk[];
  field: "diabetesScore" | "hypertensionScore";
  label: string;
  surface: any;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef  = useRef<any>(null);

  const withData = members
    .filter((m) => m.hasAssessment && m[field] !== null)
    .sort((a, b) => ((b[field] as number) ?? 0) - ((a[field] as number) ?? 0))
    .slice(0, 8);

  useEffect(() => {
    if (!canvasRef.current || withData.length === 0) return;
    let alive = true;
    getChart().then((Chart) => {
      if (!alive || !canvasRef.current) return;
      chartRef.current?.destroy();
      const labels = withData.map((m) => m.fullName?.split(" ")[0] || m.email.split("@")[0]);
      const data   = withData.map((m) => Math.round((m[field] as number) ?? 0));
      const colors = withData.map((m) => riskColor(field === "diabetesScore" ? m.diabetesLevel : m.hypertensionLevel));
      chartRef.current = new Chart(canvasRef.current, {
        type: "bar",
        data: {
          labels,
          datasets: [{
            label,
            data,
            backgroundColor: colors.map((c) => c + "BB"),
            borderColor:     colors,
            borderWidth: 1.5,
            borderRadius: 2,
          }],
        },
        options: {
          indexAxis: "y", responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx: any) => ` Score: ${ctx.raw}` } } },
          scales: {
            x: { max: 100, grid: { color: surface.border + "33" }, ticks: { color: surface.muted, font: { size: 10 } } },
            y: { grid: { display: false },                          ticks: { color: surface.text,  font: { size: 11 } } },
          },
          animation: { duration: 600 },
        },
      });
    });
    return () => { alive = false; chartRef.current?.destroy(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [withData.length, surface]);

  if (withData.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 100, gap: 8 }}>
        <Activity size={20} style={{ color: surface.muted, opacity: 0.35 }} />
        <p style={{ margin: 0, fontSize: 11, color: surface.muted }}>No assessment data yet</p>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: Math.max(withData.length * 38 + 16, 80) }}>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}

// ─── GLOBAL RESPONSIVE STYLES (injected once) ────────────────────────────────
const RESPONSIVE_STYLES = `
  .risk-row-desktop { display: grid !important; }
  .risk-row-mobile  { display: none  !important; }
  .risk-table-header { display: grid !important; }
  @media (max-width: 600px) {
    .risk-row-desktop  { display: none  !important; }
    .risk-row-mobile   { display: block !important; }
    .risk-table-header { display: none  !important; }
  }
`;

// ─── RISK BADGE ───────────────────────────────────────────────────────────────
function RiskBadge({ level, muted }: { level: string | null; muted: string }) {
  if (!level) return <span style={{ fontSize: 10, color: muted }}>—</span>;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "3px 7px", borderRadius: 2, background: riskBg(level), color: riskColor(level), fontWeight: 700, fontSize: 10 }}>
      {riskIcon(level)}{level.charAt(0).toUpperCase() + level.slice(1)}
    </span>
  );
}

// ─── RISK TABLE ROW ───────────────────────────────────────────────────────────
function RiskRow({ m, idx, c }: { m: MemberRisk; idx: number; c: any }) {
  const name = m.fullName || m.email.split("@")[0];
  const dateStr = m.lastAssessment
    ? new Date(m.lastAssessment).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
    : "No data";

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
      style={{ borderBottom: `1px solid ${c.border}` }}
    >
      {/* ── Desktop row ── */}
      <div className="risk-row-desktop" style={{ gridTemplateColumns: "1fr 90px 110px 80px", alignItems: "center", gap: 8, fontSize: 12, padding: "10px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <MemberAvatar name={name} avatar={m.avatar} diabetesLevel={m.diabetesLevel} hypertensionLevel={m.hypertensionLevel} hasAssessment={m.hasAssessment} size={28} />
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontWeight: 600, color: c.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</p>
            <p style={{ margin: 0, fontSize: 10, color: c.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.email}</p>
          </div>
        </div>
        <div><RiskBadge level={m.hasAssessment ? m.diabetesLevel : null} muted={c.muted} /></div>
        <div><RiskBadge level={m.hasAssessment ? m.hypertensionLevel : null} muted={c.muted} /></div>
        <div style={{ textAlign: "right", fontSize: 10, color: c.muted }}>{dateStr}</div>
      </div>

      {/* ── Mobile card ── */}
      <div className="risk-row-mobile" style={{ padding: "12px 14px" }}>
        {/* Top: avatar + name + date */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <MemberAvatar name={name} avatar={m.avatar} diabetesLevel={m.diabetesLevel} hypertensionLevel={m.hypertensionLevel} hasAssessment={m.hasAssessment} size={38} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: c.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</p>
            <p style={{ margin: "1px 0 0", fontSize: 10, color: c.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.email}</p>
          </div>
          <span style={{ fontSize: 10, color: c.muted, flexShrink: 0, marginLeft: 4 }}>{dateStr}</span>
        </div>
        {/* Bottom: risk badges */}
        <div style={{ display: "flex", gap: 10, marginTop: 8, paddingLeft: 48, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: c.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Diabetes</span>
            <RiskBadge level={m.hasAssessment ? m.diabetesLevel : null} muted={c.muted} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: c.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>BP</span>
            <RiskBadge level={m.hasAssessment ? m.hypertensionLevel : null} muted={c.muted} />
          </div>
        </div>
      </div>
    </motion.div>
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

  const c = { text: surface.text, muted: surface.muted, border: surface.border, surface: surface.surface, primary: accentColor };

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
              const base: MemberRisk = { memberId: m.$id, userId: m.userId!, email: m.email, fullName: m.fullName, avatar: m.avatar, status: m.status, diabetesLevel: null, diabetesScore: null, hypertensionLevel: null, hypertensionScore: null, lastAssessment: null, hasAssessment: false };
              try {
                const a = await fetchLatestAssessment(m.userId!);
                if (!a) return base;
                return { ...base, diabetesLevel: a.diabetesLevel?.toLowerCase() || null, diabetesScore: Number(a.diabetesScore) || null, hypertensionLevel: a.hypertensionLevel?.toLowerCase() || null, hypertensionScore: Number(a.hypertensionScore) || null, lastAssessment: a.$createdAt, hasAssessment: true };
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

  const activeCount   = members.filter((m) => m.status === "active").length;
  const pendingCount  = members.filter((m) => m.status === "pending").length;
  const totalCount    = members.length;
  const assessedCount = memberRisks.filter((m) => m.hasAssessment).length;

  const diabLow  = memberRisks.filter((m) => m.hasAssessment && m.diabetesLevel === "low").length;
  const diabMed  = memberRisks.filter((m) => m.hasAssessment && m.diabetesLevel === "medium").length;
  const diabHigh = memberRisks.filter((m) => m.hasAssessment && m.diabetesLevel === "high").length;
  const diabNo   = activeCount - diabLow - diabMed - diabHigh;

  const hypLow  = memberRisks.filter((m) => m.hasAssessment && m.hypertensionLevel === "low").length;
  const hypMed  = memberRisks.filter((m) => m.hasAssessment && m.hypertensionLevel === "medium").length;
  const hypHigh = memberRisks.filter((m) => m.hasAssessment && m.hypertensionLevel === "high").length;
  const hypNo   = activeCount - hypLow - hypMed - hypHigh;

  const isLoading = loadingCompany || loadingMembers;
  const goToEmployees = () => router.push("/dashboard/employer/employees");

  return (
    <EmployerLayout>
      <style>{RESPONSIVE_STYLES}</style>

      {/* ── Greeting Hero ────────────────────────────────────────────────────── */}
      {loadingCompany
        ? <Skeleton style={{ width: "100%", height: 176, marginBottom: 28 }} />
        : <GreetingCard
            userName={user?.name || ""} companyName={company?.name || "Your Company"}
            activeCount={activeCount} pendingCount={pendingCount}
            accentColor={accentColor} isDark={isDark}
          />
      }

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        {loadingCompany ? (
          <><Skeleton style={{ width: 240, height: 28, marginBottom: 8 }} /><Skeleton style={{ width: 160, height: 14 }} /></>
        ) : (
          <>
            <SectionHeader title={company?.name || "Dashboard"} />
            {company && (
              <p style={{ margin: "4px 0 0", fontSize: 12, color: c.muted, display: "flex", alignItems: "center", gap: 6 }}>
                <Building2 size={13} />{company.industry || "Your organisation"}
                {lastRefreshed && <span style={{ marginLeft: 8, fontSize: 10, opacity: 0.55 }}>· Updated {lastRefreshed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>}
              </p>
            )}
          </>
        )}
      </div>

      {/* ── Stat Cards ──────────────────────────────────────────────────────── */}
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

      {/* ── Risk Charts ─────────────────────────────────────────────────────── */}
      {!isLoading && activeCount > 0 && (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <SectionHeader title="Risk Overview" />
            {loadingRisks && (
              <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: c.muted }}>
                <RefreshCw size={12} className="animate-spin" />Fetching…
              </span>
            )}
          </div>

          {loadingRisks ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>
              <Skeleton style={{ height: 260 }} /><Skeleton style={{ height: 260 }} />
            </div>
          ) : assessedCount === 0 ? (
            <Card className="mb-8">
              <div style={{ padding: "36px 24px", textAlign: "center" }}>
                <Activity size={28} style={{ color: c.muted, opacity: 0.35, marginBottom: 10 }} />
                <p style={{ margin: "0 0 6px", fontWeight: 700, fontSize: 14, color: c.text }}>No assessments yet</p>
                <p style={{ margin: 0, fontSize: 12, color: c.muted, maxWidth: 300, marginInline: "auto" }}>
                  Risk data appears here once employees complete their health assessments.
                </p>
              </div>
            </Card>
          ) : (
            <>
              {/* Donuts */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 16, marginBottom: 20 }}>
                <Card className="custom-card">
                  <DonutChart low={diabLow} medium={diabMed} high={diabHigh} noData={diabNo}
                    label="Diabetes Risk" icon={<Activity size={14} />} surface={surface} />
                </Card>
                <Card className="custom-card">
                  <DonutChart low={hypLow} medium={hypMed} high={hypHigh} noData={hypNo}
                    label="Hypertension Risk" icon={<Heart size={14} />} surface={surface} />
                </Card>
              </div>

              {/* Bars */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))", gap: 16, marginBottom: 32 }}>
                <Card className="p-4">
                  <p style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 700, color: c.text, display: "flex", alignItems: "center", gap: 6 }}>
                    <Activity size={13} style={{ color: c.primary }} />Diabetes Scores
                  </p>
                  <ScoreBarChart members={memberRisks} field="diabetesScore" label="Diabetes" surface={surface} />
                </Card>
                <Card className="custom-card">
                  <p style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 700, color: c.text, display: "flex", alignItems: "center", gap: 6 }}>
                    <Heart size={13} style={{ color: "#EF4444" }} />Hypertension Scores
                  </p>
                  <ScoreBarChart members={memberRisks} field="hypertensionScore" label="Hypertension" surface={surface} />
                </Card>
              </div>
            </>
          )}
        </>
      )}

      {/* ── Employees Card ──────────────────────────────────────────────────── */}
      <SectionHeader title="Employees" />
      <Card className="mt-3 mb-4">
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${c.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Users size={16} style={{ color: c.primary }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: c.text }}>Your Team</span>
            {totalCount > 0 && <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", background: `${c.primary}18`, color: c.primary, borderRadius: 2 }}>{totalCount}</span>}
          </div>
          <button onClick={goToEmployees} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: c.primary, background: "none", border: "none", cursor: "pointer" }}>
            View all <ChevronRight size={14} />
          </button>
        </div>

        {/* Body */}
        {isLoading ? (
          <div>
            {[1,2,3].map((i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px" }}>
                <Skeleton style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <Skeleton style={{ width: "40%", height: 13, marginBottom: 6 }} />
                  <Skeleton style={{ width: "28%", height: 11 }} />
                </div>
                <Skeleton style={{ width: 60, height: 22 }} />
              </div>
            ))}
          </div>
        ) : members.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 24px", textAlign: "center" }}>
            <div style={{ width: 56, height: 56, display: "flex", alignItems: "center", justifyContent: "center", background: isDark ? "rgba(15,187,125,0.10)" : "rgba(15,187,125,0.08)", borderRadius: 2, marginBottom: 16 }}>
              <Users size={26} style={{ color: c.primary }} />
            </div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: c.text, marginBottom: 6 }}>No employees yet</p>
            <p style={{ margin: "0 0 20px", fontSize: 12, color: c.muted, lineHeight: 1.6, maxWidth: 260 }}>
              Invite your team to join your health programme. Their individual data stays private.
            </p>
            <button onClick={goToEmployees} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 20px", fontSize: 12, fontWeight: 700, background: `linear-gradient(135deg, ${c.primary}, #0FB6C8)`, color: "white", border: "none", borderRadius: 2, cursor: "pointer" }}>
              <Plus size={14} /> Add Employees
            </button>
          </motion.div>
        ) : (
          <>
            {/* Risk table header — hidden on mobile via RESPONSIVE_STYLES */}
            <div className="risk-table-header" style={{ gridTemplateColumns: "1fr 90px 110px 80px", gap: 8, padding: "8px 16px", background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.025)", borderBottom: `1px solid ${c.border}`, fontSize: 10, fontWeight: 700, color: c.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              <span>Employee</span><span>Diabetes</span><span>Hypertension</span><span style={{ textAlign: "right" }}>Assessment</span>
            </div>

            {members.slice(0, 5).map((m, idx) => {
              const risk = memberRisks.find((r) => r.userId === m.userId);
              const row: MemberRisk = risk || { memberId: m.$id, userId: m.userId || "", email: m.email, fullName: m.fullName, avatar: m.avatar, status: m.status, diabetesLevel: null, diabetesScore: null, hypertensionLevel: null, hypertensionScore: null, lastAssessment: null, hasAssessment: false };
              return <RiskRow key={m.$id} m={row} idx={idx} c={c} />;
            })}

            {totalCount > 5 && (
              <button onClick={goToEmployees} style={{ width: "100%", padding: "12px 20px", background: "transparent", border: "none", borderTop: `1px solid ${c.border}`, fontSize: 12, fontWeight: 600, color: c.primary, cursor: "pointer", textAlign: "center" }}>
                See all {totalCount} employees →
              </button>
            )}
          </>
        )}
      </Card>

      {/* ── Insights teaser ─────────────────────────────────────────────────── */}
      {!loadingCompany && company && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, background: isDark ? `${accentColor}0A` : `${accentColor}06`, border: `1px solid ${accentColor}20`, marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", background: `${accentColor}18`, borderRadius: 2, flexShrink: 0 }}>
              <BarChart3 size={16} style={{ color: accentColor }} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: c.text }}>Team Health Insights</p>
              <p style={{ margin: 0, fontSize: 11, color: c.muted }}>Anonymised workforce analytics — coming soon</p>
            </div>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: accentColor, flexShrink: 0 }}>Coming soon →</span>
        </motion.div>
      )}

      <ThemeToggle />
    </EmployerLayout>
  );
}