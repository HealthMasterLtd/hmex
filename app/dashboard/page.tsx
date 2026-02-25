"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Activity, History, TrendingUp, TrendingDown,
  Droplet, Heart, Plus, ArrowRight, Clock,
  CheckCircle, AlertTriangle, Zap, RefreshCw,
  ChevronRight, Sun, Sunset, Moon, Coffee,
  Shield, Target, Award, BarChart2, ChevronDown,
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement,
  LineElement, ArcElement, Filler, Tooltip as ChartTooltip,
  Legend,
} from "chart.js";
import { Line, Doughnut } from "react-chartjs-2";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useRequireAuth } from "@/hooks/useAuth";
import {
  fetchUserAssessments,
  fetchLatestAssessment,
  fetchUserXp,
  type StoredAssessment,
  type UserXpRecord,
} from "@/services/AppwriteService";
import { useTheme } from "@/contexts/ThemeContext";

ChartJS.register(
  CategoryScale, LinearScale, PointElement,
  LineElement, ArcElement, Filler, ChartTooltip, Legend,
);

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const RISK_ORDER: Record<string, number> = {
  "low": 1, "slightly-elevated": 2, "moderate": 3, "high": 4, "very-high": 5,
};
const RISK_COLOR: Record<string, string> = {
  "low": "#22c55e",
  "slightly-elevated": "#eab308",
  "moderate": "#f97316",
  "high": "#ef4444",
  "very-high": "#dc2626",
};
const RISK_LABEL: Record<string, string> = {
  "low": "Low",
  "slightly-elevated": "Slightly Elevated",
  "moderate": "Moderate",
  "high": "High",
  "very-high": "Very High",
};

const XP_CONSULTATION_THRESHOLD = 300;

const HERO_IMAGES = {
  morning:   "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400&q=80&auto=format",
  afternoon: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1400&q=80&auto=format",
  evening:   "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1400&q=80&auto=format",
  night:     "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1400&q=80&auto=format",
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function getTimeOfDay(): "morning" | "afternoon" | "evening" | "night" {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 17) return "afternoon";
  if (h >= 17 && h < 21) return "evening";
  return "night";
}

function getGreeting(name: string): { greeting: string; sub: string; Icon: React.ElementType } {
  const tod = getTimeOfDay();
  const first = name?.split(" ")[0] || "there";
  const greetings = {
    morning:   { greeting: `Good morning, ${first}.`,   sub: "Start the day with your health in focus.",      Icon: Coffee },
    afternoon: { greeting: `Good afternoon, ${first}.`, sub: "How are you feeling this afternoon?",           Icon: Sun },
    evening:   { greeting: `Good evening, ${first}.`,   sub: "Take a moment to check in on your health.",     Icon: Sunset },
    night:     { greeting: `Good night, ${first}.`,     sub: "Rest well — your health tomorrow starts now.",  Icon: Moon },
  };
  return greetings[tod];
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return "Yesterday";
  if (d < 7) return `${d} days ago`;
  if (d < 30) return `${Math.floor(d / 7)}w ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function capitalize(s: string): string {
  return (s || "").split("-").map(w => w[0].toUpperCase() + w.slice(1)).join(" ");
}

// ─── ANIMATION HOOK ───────────────────────────────────────────────────────────
function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVis(true); io.disconnect(); }
    }, { threshold });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, [threshold]);
  return { ref, vis };
}

// ─── COUNT-UP HOOK ────────────────────────────────────────────────────────────
function useCountUp(target: number, enabled = true) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!enabled || target === 0) { setVal(target); return; }
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 900, 1);
      setVal(Math.round((1 - (1 - p) ** 3) * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, enabled]);
  return val;
}

// ─── RISK BADGE ───────────────────────────────────────────────────────────────
function RiskBadge({ level }: { level: string }) {
  const c = RISK_COLOR[level] ?? "#22c55e";
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide"
      style={{ background: `${c}18`, color: c, borderRadius: 3 }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: c }} />
      {RISK_LABEL[level] ?? "Low"}
    </span>
  );
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────
function StatCard({
  label, value, sub, icon, accentColor = "#0d9488",
  trend, trendLabel, delay = 0,
}: {
  label: string; value: string | React.ReactNode; sub?: string;
  icon: React.ReactNode; accentColor?: string;
  trend?: "up" | "down" | "flat"; trendLabel?: string; delay?: number;
}) {
  const { isDark } = useTheme();
  const bg     = isDark ? "#0d1323" : "#ffffff";
  const border = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
  const textH  = isDark ? "#f0f4f8" : "#0f172a";
  const textM  = isDark ? "#6b7a8d" : "#64748b";
  const { ref, vis } = useInView();

  const trendClr = trend === "up" ? "#ef4444" : trend === "down" ? "#22c55e" : textM;
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : null;

  return (
    <div
      ref={ref}
      className="flex flex-col gap-3 p-5 transition-all duration-700"
      style={{
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: 4,
        opacity: vis ? 1 : 0,
        transform: vis ? "translateY(0)" : "translateY(16px)",
        transitionDelay: `${delay}ms`,
        boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.3)" : "0 4px 20px rgba(0,0,0,0.05)",
      }}
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: textM }}>{label}</p>
        <div className="w-8 h-8 flex items-center justify-center" style={{ borderRadius: 4, background: `${accentColor}15`, color: accentColor }}>
          {icon}
        </div>
      </div>
      <div>
        <div className="text-[1.65rem] font-black leading-none" style={{ color: textH, letterSpacing: "-0.03em" }}>
          {value}
        </div>
        {sub && <p className="mt-1.5 text-[11.5px]" style={{ color: textM }}>{sub}</p>}
      </div>
      {trend && trendLabel && (
        <div className="flex items-center gap-1.5 pt-2" style={{ borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}` }}>
          {TrendIcon && <TrendIcon size={11} strokeWidth={2.5} style={{ color: trendClr }} />}
          <p className="text-[11px] font-medium" style={{ color: trendClr }}>{trendLabel}</p>
        </div>
      )}
    </div>
  );
}

// ─── SKELETON ─────────────────────────────────────────────────────────────────
function Skeleton({ h = 16, w = "100%", r = 3 }: { h?: number; w?: string | number; r?: number }) {
  const { isDark } = useTheme();
  return (
    <div
      className="animate-pulse"
      style={{ height: h, width: w, borderRadius: r, background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}
    />
  );
}

function CardShell({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { isDark } = useTheme();
  const { ref, vis } = useInView();
  const bg     = isDark ? "#0d1323" : "#ffffff";
  const border = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
  return (
    <div
      ref={ref}
      className={`p-5 transition-all duration-700 ${className}`}
      style={{
        background: bg, border: `1px solid ${border}`, borderRadius: 4,
        boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.3)" : "0 4px 20px rgba(0,0,0,0.05)",
        opacity: vis ? 1 : 0,
        transform: vis ? "translateY(0)" : "translateY(16px)",
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ─── SECTION LABEL ────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  const { isDark } = useTheme();
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-4"
       style={{ color: isDark ? "#3d4f63" : "#94a3b8" }}>
      {children}
    </p>
  );
}

// ─── RISK GAUGE RING ──────────────────────────────────────────────────────────
function RiskGaugeRing({ level, label, isDark }: { level: string; label: string; isDark: boolean }) {
  const color = RISK_COLOR[level] ?? "#22c55e";
  const pct = (RISK_ORDER[level] ?? 1) / 5;
  const r = 36, cx = 44, cy = 44;
  const circumference = 2 * Math.PI * r;
  const strokeDash = circumference * pct;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <svg width={88} height={88} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={cx} cy={cy} r={r} fill="none" strokeWidth={8}
            stroke={isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"} />
          <circle cx={cx} cy={cy} r={r} fill="none" strokeWidth={8}
            stroke={color} strokeLinecap="round"
            strokeDasharray={`${strokeDash} ${circumference}`}
            style={{ transition: "stroke-dasharray 1.2s cubic-bezier(.4,0,.2,1)" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[13px] font-black" style={{ color }}>{Math.round(pct * 100)}%</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: isDark ? "#4a5568" : "#94a3b8" }}>{label}</p>
        <p className="text-[11px] font-semibold" style={{ color }}>{RISK_LABEL[level] ?? "Low"}</p>
      </div>
    </div>
  );
}

// ─── LINE CHART ───────────────────────────────────────────────────────────────
function RiskTrendChart({ assessments, isDark }: { assessments: StoredAssessment[]; isDark: boolean }) {
  const sorted = [...assessments].reverse().slice(-10);
  if (sorted.length < 2) return (
    <div className="flex items-center justify-center h-32" style={{ color: isDark ? "#3d4f63" : "#cbd5e1" }}>
      <p className="text-[12px]">Need at least 2 assessments to show trend</p>
    </div>
  );

  const labels = sorted.map(a => fmtDate(a.$createdAt));
  const dData  = sorted.map(a => RISK_ORDER[a.diabetesLevel] ?? 1);
  const hData  = sorted.map(a => RISK_ORDER[a.hypertensionLevel] ?? 1);
  const gridClr = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";
  const tickClr = isDark ? "#3d4f63" : "#94a3b8";

  const data = {
    labels,
    datasets: [
      {
        label: "Diabetes",
        data: dData,
        borderColor: "#0d9488",
        backgroundColor: "rgba(13,148,136,0.08)",
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: "#0d9488",
        pointBorderColor: isDark ? "#0d1323" : "#ffffff",
        pointBorderWidth: 2,
        borderWidth: 2,
      },
      {
        label: "Hypertension",
        data: hData,
        borderColor: "#6366f1",
        backgroundColor: "rgba(99,102,241,0.06)",
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: "#6366f1",
        pointBorderColor: isDark ? "#0d1323" : "#ffffff",
        pointBorderWidth: 2,
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: tickClr,
          font: { size: 11, weight: "600" as const },
          boxWidth: 10,
          boxHeight: 3,
          padding: 16,
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: isDark ? "#1a2236" : "#0f172a",
        titleColor: "#f0f4f8",
        bodyColor: "#8b9cb5",
        borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)",
        borderWidth: 1,
        padding: 10,
        cornerRadius: 4,
        callbacks: {
          label: (ctx: any) => {
            const lvls = ["", "Low", "Slightly Elevated", "Moderate", "High", "Very High"];
            return ` ${ctx.dataset.label}: ${lvls[ctx.raw] || ctx.raw}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: gridClr },
        ticks: { color: tickClr, font: { size: 10 }, maxRotation: 30 },
        border: { display: false },
      },
      y: {
        min: 0, max: 6,
        grid: { color: gridClr },
        ticks: {
          color: tickClr,
          font: { size: 10 },
          stepSize: 1,
          callback: (v: any) => ["", "Low", "S.Elev.", "Moderate", "High", "V.High"][v] || "",
        },
        border: { display: false },
      },
    },
  };

  return (
    <div style={{ height: 200 }}>
      <Line data={data} options={options} />
    </div>
  );
}

// ─── DOUGHNUT CHART ───────────────────────────────────────────────────────────
function RiskDonut({ level, label, isDark }: { level: string; label: string; isDark: boolean }) {
  const pct = (RISK_ORDER[level] ?? 1) / 5 * 100;
  const color = RISK_COLOR[level] ?? "#22c55e";
  const trackColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";

  const data = {
    datasets: [{
      data: [pct, 100 - pct],
      backgroundColor: [color, trackColor],
      borderWidth: 0,
      circumference: 240,
      rotation: -120,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
    cutout: "72%",
  };

  return (
    <div className="relative flex items-center justify-center" style={{ width: 100, height: 100 }}>
      <Doughnut data={data} options={options} />
      <div className="absolute inset-0 flex flex-col items-center justify-center mt-2">
        <span className="text-[15px] font-black leading-none" style={{ color }}>{Math.round(pct)}%</span>
        <span className="text-[9px] font-bold uppercase tracking-wide mt-0.5" style={{ color: isDark ? "#3d4f63" : "#94a3b8" }}>{label}</span>
      </div>
    </div>
  );
}

// ─── HERO GREETING CARD ───────────────────────────────────────────────────────
function HeroCard({ user, latest, isDark }: { user: any; latest: StoredAssessment | null; isDark: boolean }) {
  const tod = getTimeOfDay();
  const imgUrl = HERO_IMAGES[tod];
  const { greeting, sub, Icon } = getGreeting(user?.name || "");
  const { ref, vis } = useInView();

  return (
    <div
      ref={ref}
      className="relative overflow-hidden col-span-full"
      style={{
        borderRadius: 4,
        minHeight: 200,
        opacity: vis ? 1 : 0,
        transform: vis ? "translateY(0)" : "translateY(-12px)",
        transition: "opacity 0.8s ease, transform 0.8s ease",
      }}
    >
      <div className="absolute inset-0 bg-center bg-cover" style={{ backgroundImage: `url(${imgUrl})` }} />
      <div
        className="absolute inset-0"
        style={{
          background: isDark
            ? "linear-gradient(120deg, rgba(8,12,22,0.92) 0%, rgba(8,12,22,0.75) 50%, rgba(8,12,22,0.4) 100%)"
            : "linear-gradient(120deg, rgba(5,30,25,0.88) 0%, rgba(5,30,25,0.65) 50%, rgba(5,30,25,0.3) 100%)",
        }}
      />
      <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Icon size={14} className="text-teal-400" />
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-teal-400">
              {tod.charAt(0).toUpperCase() + tod.slice(1)}
            </p>
          </div>
          <h1
            className="text-[clamp(1.4rem,4vw,2rem)] font-black leading-tight tracking-tight text-white mb-1.5"
            style={{ letterSpacing: "-0.03em" }}
          >
            {greeting}
          </h1>
          <p className="text-[13px] text-white/60 max-w-[40ch]">{sub}</p>
        </div>

        {latest ? (
          <div
            className="flex items-center gap-5 px-5 py-4 shrink-0"
            style={{ background: "rgba(255,255,255,0.08)", borderRadius: 4, backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.12)" }}
          >
            <div className="text-center">
              <p className="text-[9px] font-bold uppercase tracking-widest text-white/40 mb-1">Diabetes</p>
              <p className="text-[13px] font-bold" style={{ color: RISK_COLOR[latest.diabetesLevel] ?? "#22c55e" }}>
                {RISK_LABEL[latest.diabetesLevel] ?? "Low"}
              </p>
            </div>
            <div className="w-px h-8" style={{ background: "rgba(255,255,255,0.12)" }} />
            <div className="text-center">
              <p className="text-[9px] font-bold uppercase tracking-widest text-white/40 mb-1">Hypertension</p>
              <p className="text-[13px] font-bold" style={{ color: RISK_COLOR[latest.hypertensionLevel] ?? "#22c55e" }}>
                {RISK_LABEL[latest.hypertensionLevel] ?? "Low"}
              </p>
            </div>
            <div className="w-px h-8" style={{ background: "rgba(255,255,255,0.12)" }} />
            <div className="text-center">
              <p className="text-[9px] font-bold uppercase tracking-widest text-white/40 mb-1">Last Check</p>
              <p className="text-[13px] font-bold text-white/80">{timeAgo(latest.$createdAt)}</p>
            </div>
          </div>
        ) : (
          <div
            className="px-5 py-4 shrink-0"
            style={{ background: "rgba(13,148,136,0.2)", borderRadius: 4, border: "1px solid rgba(13,148,136,0.4)" }}
          >
            <p className="text-[12px] font-semibold text-teal-300 mb-2">No assessments yet</p>
            <p className="text-[11px] text-white/50">Take your first screening to see your risk profile.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ASSESSMENT SELECTOR DROPDOWN ─────────────────────────────────────────────
function AssessmentSelector({
  history,
  selected,
  onSelect,
  isDark,
}: {
  history: StoredAssessment[];
  selected: StoredAssessment | null;
  onSelect: (a: StoredAssessment) => void;
  isDark: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (history.length === 0) return null;

  const bg     = isDark ? "#0d1323" : "#ffffff";
  const border = isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.09)";
  const txt    = isDark ? "#e2e8f0" : "#0f172a";
  const muted  = isDark ? "#4a5568" : "#94a3b8";
  const hover  = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";
  const activeBg = isDark ? "rgba(13,148,136,0.12)" : "rgba(13,148,136,0.08)";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-3 py-2 text-[12px] font-semibold transition-all duration-150 hover:opacity-80"
        style={{
          background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
          border: `1px solid ${open ? "rgba(13,148,136,0.4)" : border}`,
          borderRadius: 4,
          color: txt,
          minWidth: 220,
          justifyContent: "space-between",
        }}
      >
        <span className="flex items-center gap-2 min-w-0">
          <History size={12} strokeWidth={2} style={{ color: "#0d9488", shrink: 0 }} />
          <span className="truncate">
            {selected
              ? `#${selected.assessmentNumber ?? "?"} — ${fmtDate(selected.$createdAt)}`
              : "Select assessment"}
          </span>
          {selected?.assessmentNumber === history[0]?.assessmentNumber && (
            <span
              className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 shrink-0"
              style={{ background: "rgba(13,148,136,0.15)", color: "#0d9488", borderRadius: 3 }}
            >
              Latest
            </span>
          )}
        </span>
        <ChevronDown
          size={12}
          strokeWidth={2}
          style={{
            color: muted,
            transition: "transform 0.15s ease",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            flexShrink: 0,
          }}
        />
      </button>

      {open && (
        <div
          className="absolute left-0 top-full mt-1.5 z-50 py-1.5 w-full min-w-[260px]"
          style={{
            background: bg,
            border: `1px solid ${border}`,
            borderRadius: 6,
            boxShadow: isDark ? "0 8px 32px rgba(0,0,0,0.5)" : "0 8px 32px rgba(0,0,0,0.12)",
            maxHeight: 280,
            overflowY: "auto",
            animation: "dropdownIn 0.12s ease",
          }}
        >
          <p
            className="px-3 pt-1 pb-2 text-[9px] font-bold uppercase tracking-[0.15em]"
            style={{ color: muted, borderBottom: `1px solid ${border}` }}
          >
            {history.length} assessment{history.length !== 1 ? "s" : ""} — newest first
          </p>
          {history.map((a, i) => {
            const isSelected = selected?.$id === a.$id;
            return (
              <button
                key={a.$id}
                onClick={() => { onSelect(a); setOpen(false); }}
                className="flex items-center gap-3 w-full px-3 py-2.5 text-left transition-colors duration-100"
                style={{ background: isSelected ? activeBg : "transparent" }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = hover; }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
              >
                {/* Assessment number badge */}
                <div
                  className="flex items-center justify-center text-[10px] font-black shrink-0"
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 4,
                    background: isSelected ? "rgba(13,148,136,0.2)" : isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
                    color: isSelected ? "#0d9488" : muted,
                  }}
                >
                  {a.assessmentNumber ?? i + 1}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[12px] font-semibold" style={{ color: txt }}>{fmtDate(a.$createdAt)}</p>
                    {i === 0 && (
                      <span
                        className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5"
                        style={{ background: "rgba(13,148,136,0.12)", color: "#0d9488", borderRadius: 3 }}
                      >
                        Latest
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px]" style={{ color: RISK_COLOR[a.diabetesLevel] ?? "#22c55e" }}>
                      D: {RISK_LABEL[a.diabetesLevel] ?? "Low"}
                    </span>
                    <span className="text-[10px]" style={{ color: muted }}>·</span>
                    <span className="text-[10px]" style={{ color: RISK_COLOR[a.hypertensionLevel] ?? "#22c55e" }}>
                      BP: {RISK_LABEL[a.hypertensionLevel] ?? "Low"}
                    </span>
                  </div>
                </div>
                <p className="text-[10px] shrink-0" style={{ color: muted }}>{timeAgo(a.$createdAt)}</p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── XP PROGRESS CARD ─────────────────────────────────────────────────────────
function XpProgressCard({ xpRecord, isDark, delay = 0 }: { xpRecord: UserXpRecord | null; isDark: boolean; delay?: number }) {
  const { ref, vis } = useInView();
  const router = useRouter();

  const totalXp   = xpRecord?.totalXp ?? 0;
  const redeemed  = xpRecord?.redeemedXp ?? 0;
  const available = totalXp - redeemed;
  const pct       = Math.min((available / XP_CONSULTATION_THRESHOLD) * 100, 100);
  const unlocked  = available >= XP_CONSULTATION_THRESHOLD;
  const remaining = Math.max(XP_CONSULTATION_THRESHOLD - available, 0);
  const taken     = xpRecord?.assessmentsTaken ?? 0;

  const bg     = isDark ? "#0d1323" : "#ffffff";
  const border = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
  const txt    = isDark ? "#f0f4f8" : "#0f172a";
  const muted  = isDark ? "#6b7a8d" : "#64748b";
  const sub    = isDark ? "#3d4f63" : "#94a3b8";
  const trackBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";

  const animatedXp = useCountUp(available, vis);

  return (
    <div
      ref={ref}
      className="flex flex-col gap-3 p-5 transition-all duration-700"
      style={{
        background: bg,
        border: `1px solid ${unlocked ? "rgba(13,148,136,0.3)" : border}`,
        borderRadius: 4,
        opacity: vis ? 1 : 0,
        transform: vis ? "translateY(0)" : "translateY(16px)",
        transitionDelay: `${delay}ms`,
        boxShadow: unlocked
          ? "0 4px 20px rgba(13,148,136,0.12)"
          : isDark ? "0 4px 20px rgba(0,0,0,0.3)" : "0 4px 20px rgba(0,0,0,0.05)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: muted }}>Health XP</p>
        <div
          className="w-8 h-8 flex items-center justify-center"
          style={{ borderRadius: 4, background: unlocked ? "rgba(13,148,136,0.15)" : "rgba(139,92,246,0.1)", color: unlocked ? "#0d9488" : "#8b5cf6" }}
        >
          <Zap size={15} strokeWidth={1.8} fill={unlocked ? "#0d9488" : "none"} />
        </div>
      </div>

      {/* XP value */}
      <div>
        <div className="flex items-end gap-2">
          <div className="text-[1.65rem] font-black leading-none" style={{ color: unlocked ? "#0d9488" : txt, letterSpacing: "-0.03em" }}>
            {animatedXp.toLocaleString()}
          </div>
          <span className="text-[13px] font-bold pb-0.5" style={{ color: muted }}>XP</span>
        </div>
        <p className="mt-1.5 text-[11.5px]" style={{ color: muted }}>
          {taken} assessment{taken !== 1 ? "s" : ""} completed
        </p>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <p className="text-[10px] font-semibold" style={{ color: sub }}>Free consultation</p>
          <p className="text-[10px] font-bold" style={{ color: unlocked ? "#0d9488" : txt }}>
            {available} / {XP_CONSULTATION_THRESHOLD}
          </p>
        </div>
        <div className="w-full h-1.5 overflow-hidden" style={{ background: trackBg, borderRadius: 99 }}>
          <div
            className="h-full transition-all duration-1000"
            style={{
              width: `${pct}%`,
              background: unlocked
                ? "linear-gradient(90deg,#0d9488,#059669)"
                : "linear-gradient(90deg,#6366f1,#8b5cf6)",
              borderRadius: 99,
            }}
          />
        </div>
      </div>

      {/* CTA */}
      <div
        className="flex items-center gap-2 pt-2"
        style={{ borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}` }}
      >
        {unlocked ? (
          <button
            onClick={() => window.open("https://wa.me/250789399765", "_blank")}
            className="flex items-center gap-1.5 text-[11px] font-bold transition-opacity hover:opacity-70"
            style={{ color: "#0d9488" }}
          >
            <span>🎉 Redeem free consultation</span>
            <ArrowRight size={11} strokeWidth={2.5} />
          </button>
        ) : (
          <p className="text-[11px]" style={{ color: sub }}>
            Earn <strong style={{ color: txt }}>{remaining} more XP</strong> for a free consultation
          </p>
        )}
      </div>
    </div>
  );
}

// ─── MAIN DASHBOARD PAGE ──────────────────────────────────────────────────────
export default function DashboardPage() {
  const auth = useRequireAuth();
  const router = useRouter();
  const { isDark } = useTheme();

  const [latest, setLatest]           = useState<StoredAssessment | null>(null);
  const [selected, setSelected]       = useState<StoredAssessment | null>(null);
  const [history, setHistory]         = useState<StoredAssessment[]>([]);
  const [xpRecord, setXpRecord]       = useState<UserXpRecord | null>(null);
  const [loadingLatest, setLoadingLatest]   = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [refreshing, setRefreshing]   = useState(false);

  const bg      = isDark ? "#060c18" : "#ffffff";
  const cardBg  = isDark ? "#0d1323" : "#ffffff";
  const border  = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
  const textH   = isDark ? "#f0f4f8" : "#0f172a";
  const textM   = isDark ? "#6b7a8d" : "#64748b";
  const textS   = isDark ? "#3d4f63" : "#94a3b8";

  const totalCount = useCountUp(history.length, !loadingHistory);

  const loadData = useCallback(async (uid: string) => {
    try {
      const [lat, hist, xp] = await Promise.all([
        fetchLatestAssessment(uid),
        fetchUserAssessments(uid),
        fetchUserXp(uid),
      ]);
      setLatest(lat);
      // Default selected to latest
      setSelected(lat);
      setHistory(hist);
      setXpRecord(xp);
      setError(null);
    } catch {
      setError("Could not load your data. Check your connection and refresh.");
    } finally {
      setLoadingLatest(false);
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    if (auth.user) loadData(auth.user.id);
  }, [auth.user, loadData]);

  const handleRefresh = async () => {
    if (!auth.user || refreshing) return;
    setRefreshing(true);
    await loadData(auth.user.id);
    setRefreshing(false);
  };

  if (auth.loading) return null;

  // Use selected assessment for display (falls back to latest)
  const display = selected ?? latest;

  // Risk trend comparison — compare display against the one before it in history
  const displayIdx = history.findIndex(a => a.$id === display?.$id);
  const prev = displayIdx >= 0 ? history[displayIdx + 1] ?? null : null;

  const dTrend: "up" | "down" | "flat" = !prev ? "flat"
    : (RISK_ORDER[display?.diabetesLevel ?? "low"] ?? 1) > (RISK_ORDER[prev.diabetesLevel ?? "low"] ?? 1) ? "up"
    : (RISK_ORDER[display?.diabetesLevel ?? "low"] ?? 1) < (RISK_ORDER[prev.diabetesLevel ?? "low"] ?? 1) ? "down"
    : "flat";
  const hTrend: "up" | "down" | "flat" = !prev ? "flat"
    : (RISK_ORDER[display?.hypertensionLevel ?? "low"] ?? 1) > (RISK_ORDER[prev.hypertensionLevel ?? "low"] ?? 1) ? "up"
    : (RISK_ORDER[display?.hypertensionLevel ?? "low"] ?? 1) < (RISK_ORDER[prev.hypertensionLevel ?? "low"] ?? 1) ? "down"
    : "flat";

  const isHighRisk = display && (
    display.diabetesLevel === "high" || display.diabetesLevel === "very-high" ||
    display.hypertensionLevel === "high" || display.hypertensionLevel === "very-high"
  );

  const keyFindings: string[]    = display ? (() => { try { return JSON.parse(display.keyFindings || "[]"); } catch { return []; } })() : [];
  const recommendations: string[] = display ? (() => { try { return JSON.parse(display.recommendations || "[]"); } catch { return []; } })() : [];
  const urgentActions: string[]  = display ? (() => { try { return JSON.parse(display.urgentActions || "[]"); } catch { return []; } })() : [];

  return (
    <DashboardLayout>
      <div style={{ background: bg, minHeight: "100%" }}>

        {/* ── TOP ACTION BAR ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-0.5" style={{ color: "#0d9488" }}>
              Health Dashboard
            </p>
            <p className="text-[12px]" style={{ color: textS }}>
              {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Assessment selector */}
            {!loadingHistory && history.length > 0 && (
              <AssessmentSelector
                history={history}
                selected={selected}
                onSelect={setSelected}
                isDark={isDark}
              />
            )}
            <button
              onClick={handleRefresh}
              className="flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold transition-all duration-150 hover:opacity-80 active:scale-95"
              style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)", borderRadius: 4, color: textM, border: `1px solid ${border}` }}
            >
              <RefreshCw size={12} strokeWidth={2} className={refreshing ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={() => router.push("/dashboard/assessment")}
              className="flex items-center gap-1.5 px-4 py-2 text-[12px] font-bold text-white transition-all duration-150 hover:opacity-90 active:scale-95"
              style={{ background: "linear-gradient(135deg,#0d9488,#059669)", borderRadius: 4, boxShadow: "0 4px 14px rgba(13,148,136,0.3)" }}
            >
              <Plus size={13} strokeWidth={2.5} />
              New Assessment
            </button>
          </div>
        </div>

        {/* Viewing non-latest banner */}
        {display && latest && display.$id !== latest.$id && (
          <div
            className="flex items-center justify-between px-4 py-2.5 mb-4"
            style={{ background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 4 }}
          >
            <div className="flex items-center gap-2">
              <History size={13} strokeWidth={2} style={{ color: "#6366f1" }} />
              <p className="text-[12px] font-semibold" style={{ color: "#6366f1" }}>
                Viewing assessment #{display.assessmentNumber ?? "?"} from {fmtDate(display.$createdAt)}
              </p>
            </div>
            <button
              onClick={() => setSelected(latest)}
              className="text-[11px] font-bold transition-opacity hover:opacity-70"
              style={{ color: "#6366f1" }}
            >
              Back to latest →
            </button>
          </div>
        )}

        {/* ── ERROR BANNER ── */}
        {error && (
          <div className="flex items-center gap-3 px-4 py-3 mb-5" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 4 }}>
            <AlertTriangle size={14} className="text-red-400 shrink-0" />
            <p className="text-[12px] flex-1 text-red-400">{error}</p>
            <button onClick={handleRefresh} className="text-[11px] font-bold text-red-400 hover:opacity-70">Retry</button>
          </div>
        )}

        {/* ── URGENT ALERT ── */}
        {isHighRisk && urgentActions.length > 0 && (
          <div
            className="flex items-start gap-3 px-4 py-3.5 mb-5"
            style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.18)", borderRadius: 4 }}
          >
            <AlertTriangle size={15} className="text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wide text-red-400 mb-1.5">Action Recommended</p>
              {urgentActions.map((a, i) => (
                <p key={i} className="text-[12.5px] text-red-300/80 leading-relaxed">{a}</p>
              ))}
            </div>
          </div>
        )}

        {/* ── HERO CARD ── */}
        {(loadingLatest || !auth.loading) && (
          <div className="mb-5">
            {loadingLatest ? (
              <div className="w-full h-48 animate-pulse" style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)", borderRadius: 4 }} />
            ) : (
              <HeroCard user={auth.user} latest={latest} isDark={isDark} />
            )}
          </div>
        )}

        {/* ── STAT CARDS ROW ── */}
        <div className="grid grid-cols-2 xl:grid-cols-5 gap-3 mb-5">
          {loadingLatest ? (
            [0,1,2,3,4].map(i => (
              <div key={i} className="p-5" style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 4 }}>
                <div className="space-y-3">
                  <Skeleton h={11} w={80} />
                  <Skeleton h={36} w={100} />
                  <Skeleton h={11} w={120} />
                </div>
              </div>
            ))
          ) : (
            <>
              <StatCard
                label="Diabetes Risk"
                value={display ? <RiskBadge level={display.diabetesLevel} /> : <span style={{ color: textS }}>—</span>}
                sub={display ? display.diabetesPct : "No assessment yet"}
                icon={<Droplet size={15} strokeWidth={1.8} />}
                accentColor={RISK_COLOR[display?.diabetesLevel ?? "low"] ?? "#22c55e"}
                trend={dTrend}
                trendLabel={dTrend === "flat" ? "No change vs prev" : dTrend === "up" ? "Risk increased" : "Risk improved"}
                delay={0}
              />
              <StatCard
                label="Hypertension Risk"
                value={display ? <RiskBadge level={display.hypertensionLevel} /> : <span style={{ color: textS }}>—</span>}
                sub={display ? display.hypertensionPct : "No assessment yet"}
                icon={<Heart size={15} strokeWidth={1.8} />}
                accentColor={RISK_COLOR[display?.hypertensionLevel ?? "low"] ?? "#22c55e"}
                trend={hTrend}
                trendLabel={hTrend === "flat" ? "No change vs prev" : hTrend === "up" ? "Risk increased" : "Risk improved"}
                delay={60}
              />
              <StatCard
                label="Total Assessments"
                value={totalCount}
                sub={history.length > 0 ? `First: ${fmtDate(history[history.length - 1]?.$createdAt ?? "")}` : "Get started below"}
                icon={<BarChart2 size={15} strokeWidth={1.8} />}
                accentColor="#6366f1"
                delay={120}
              />
              <StatCard
                label="Last Assessment"
                value={latest ? timeAgo(latest.$createdAt) : "Never"}
                sub={latest ? fmtDate(latest.$createdAt) : "Take your first screening"}
                icon={<Clock size={15} strokeWidth={1.8} />}
                accentColor="#f59e0b"
                delay={180}
              />
              {/* XP stat card */}
              <XpProgressCard xpRecord={xpRecord} isDark={isDark} delay={240} />
            </>
          )}
        </div>

        {/* ── MAIN GRID ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">

          {/* Risk Trend Chart — 2 cols */}
          <CardShell delay={100} className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <SectionLabel>Risk Trend Over Time</SectionLabel>
              </div>
              {history.length > 0 && (
                <button
                  onClick={() => router.push("/dashboard/history")}
                  className="flex items-center gap-1 text-[11px] font-semibold transition-opacity hover:opacity-70"
                  style={{ color: "#0d9488" }}
                >
                  All history <ChevronRight size={12} />
                </button>
              )}
            </div>
            {loadingHistory ? (
              <div className="space-y-2" style={{ height: 200 }}>
                <Skeleton h={200} />
              </div>
            ) : history.length < 2 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <BarChart2 size={28} strokeWidth={1.2} style={{ color: textS }} />
                <p className="text-[12px]" style={{ color: textM }}>Complete more assessments to see your trend chart.</p>
                <button
                  onClick={() => router.push("/dashboard/assessment")}
                  className="px-4 py-2 text-[11px] font-bold text-white"
                  style={{ background: "linear-gradient(135deg,#0d9488,#059669)", borderRadius: 4 }}
                >
                  Take Assessment
                </button>
              </div>
            ) : (
              <RiskTrendChart assessments={history} isDark={isDark} />
            )}
          </CardShell>

          {/* Risk Gauges — 1 col */}
          <CardShell delay={200}>
            <SectionLabel>
              {display && display.$id !== latest?.$id
                ? `Risk Profile — Assessment #${display.assessmentNumber ?? "?"}`
                : "Current Risk Profile"}
            </SectionLabel>
            {loadingLatest ? (
              <div className="flex justify-around py-4">
                <Skeleton h={100} w={100} r={50} />
                <Skeleton h={100} w={100} r={50} />
              </div>
            ) : display ? (
              <>
                <div className="flex justify-around py-3">
                  <RiskDonut level={display.diabetesLevel} label="Diabetes" isDark={isDark} />
                  <RiskDonut level={display.hypertensionLevel} label="BP" isDark={isDark} />
                </div>
                <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${border}` }}>
                  <p className="text-[11.5px] leading-relaxed" style={{ color: textM }}>
                    {display.summary.replace(/^[⚠️🟢]\s*/, "").slice(0, 120)}…
                  </p>
                  <button
                    onClick={() => router.push("/dashboard/review")}
                    className="flex items-center gap-1.5 mt-3 text-[11px] font-bold"
                    style={{ color: "#0d9488" }}
                  >
                    Full report <ArrowRight size={11} strokeWidth={2.5} />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <Target size={24} strokeWidth={1.2} style={{ color: textS }} />
                <p className="text-[12px] text-center" style={{ color: textM }}>No risk data yet. Take your first assessment.</p>
              </div>
            )}
          </CardShell>
        </div>

        {/* ── SECOND GRID: Findings + Recommendations ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">

          {/* Key Findings */}
          <CardShell delay={150}>
            <SectionLabel>Key Findings</SectionLabel>
            {loadingLatest ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <Skeleton key={i} h={13} w={`${60 + i * 10}%`} />)}
              </div>
            ) : keyFindings.length > 0 ? (
              <div className="space-y-3">
                {keyFindings.map((f, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Shield size={14} strokeWidth={1.8} className="shrink-0 mt-0.5" style={{ color: "#6366f1" }} />
                    <p className="text-[12.5px] leading-relaxed" style={{ color: textM }}>{f}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[12px] py-6 text-center" style={{ color: textS }}>
                Complete an assessment to see personalised findings.
              </p>
            )}
          </CardShell>

          {/* Recommendations */}
          <CardShell delay={200}>
            <SectionLabel>Recommendations</SectionLabel>
            {loadingLatest ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <Skeleton key={i} h={13} w={`${70 + i * 5}%`} />)}
              </div>
            ) : recommendations.length > 0 ? (
              <div className="space-y-3">
                {recommendations.slice(0, 5).map((r, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle size={14} strokeWidth={1.8} className="shrink-0 mt-0.5" style={{ color: "#22c55e" }} />
                    <p className="text-[12.5px] leading-relaxed" style={{ color: textM }}>{r}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[12px] py-6 text-center" style={{ color: textS }}>
                Recommendations will appear after your first assessment.
              </p>
            )}
          </CardShell>
        </div>

        {/* ── HISTORY TABLE ── */}
        <CardShell delay={250}>
          <div className="flex items-center justify-between mb-4">
            <SectionLabel>Assessment History</SectionLabel>
            {history.length > 5 && (
              <button
                onClick={() => router.push("/dashboard/history")}
                className="flex items-center gap-1 text-[11px] font-semibold"
                style={{ color: "#0d9488" }}
              >
                View all <ChevronRight size={12} />
              </button>
            )}
          </div>

          {loadingHistory ? (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="flex gap-4">
                  <Skeleton h={13} w={90} />
                  <Skeleton h={13} w={70} />
                  <Skeleton h={13} w={70} />
                  <Skeleton h={13} w={60} />
                </div>
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <History size={28} strokeWidth={1.2} style={{ color: textS }} />
              <p className="text-[13px] font-semibold" style={{ color: textH }}>No assessments recorded yet</p>
              <p className="text-[12px]" style={{ color: textM }}>Take your first risk screening to start tracking your health over time.</p>
              <button
                onClick={() => router.push("/dashboard/assessment")}
                className="mt-2 flex items-center gap-1.5 px-4 py-2.5 text-[12px] font-bold text-white"
                style={{ background: "linear-gradient(135deg,#0d9488,#059669)", borderRadius: 4, boxShadow: "0 4px 14px rgba(13,148,136,0.28)" }}
              >
                <Plus size={13} strokeWidth={2.5} /> Take First Assessment
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-5 px-5">
              <table className="w-full min-w-[480px]">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${border}` }}>
                    {["#", "Date", "Diabetes", "Hypertension", "BMI Category", "Profile"].map(col => (
                      <th key={col} className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: textS }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.slice(0, 8).map((a, i) => {
                    const isActive = selected?.$id === a.$id;
                    return (
                      <tr
                        key={a.$id}
                        className="transition-colors duration-100 cursor-pointer"
                        style={{
                          borderBottom: `1px solid ${border}`,
                          background: isActive
                            ? isDark ? "rgba(13,148,136,0.06)" : "rgba(13,148,136,0.04)"
                            : "transparent",
                        }}
                        onMouseEnter={e => {
                          if (!isActive) e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)";
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = isActive
                            ? isDark ? "rgba(13,148,136,0.06)" : "rgba(13,148,136,0.04)"
                            : "transparent";
                        }}
                        onClick={() => setSelected(a)}
                      >
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="text-[10px] font-black"
                              style={{
                                color: isActive ? "#0d9488" : textS,
                                background: isActive ? "rgba(13,148,136,0.12)" : isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                                padding: "2px 5px",
                                borderRadius: 3,
                              }}
                            >
                              #{a.assessmentNumber ?? i + 1}
                            </span>
                            {i === 0 && (
                              <span className="text-[8px] font-bold uppercase tracking-wide px-1 py-0.5" style={{ background: "rgba(13,148,136,0.1)", color: "#0d9488", borderRadius: 2 }}>
                                latest
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <p className="text-[12px] font-semibold" style={{ color: textH }}>{fmtDate(a.$createdAt)}</p>
                          <p className="text-[10px]" style={{ color: textS }}>{timeAgo(a.$createdAt)}</p>
                        </td>
                        <td className="px-3 py-3"><RiskBadge level={a.diabetesLevel || "low"} /></td>
                        <td className="px-3 py-3"><RiskBadge level={a.hypertensionLevel || "low"} /></td>
                        <td className="px-3 py-3">
                          <span className="text-[11.5px]" style={{ color: textM }}>{capitalize(a.profileBmi || "—")}</span>
                        </td>
                        <td className="px-3 py-3">
                          <span className="text-[11.5px]" style={{ color: textM }}>{capitalize(a.profileAge || "—")}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardShell>

        {/* ── AI DETAILED ANALYSIS ── */}
        {display && display.detailedAnalysis && (
          <CardShell delay={300} className="mt-4">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 flex items-center justify-center" style={{ background: "rgba(139,92,246,0.12)", borderRadius: 4 }}>
                <Zap size={14} strokeWidth={1.8} style={{ color: "#8b5cf6" }} />
              </div>
              <SectionLabel>AI Detailed Analysis</SectionLabel>
            </div>
            <div className="space-y-3">
              {display.detailedAnalysis.split("\n").map((para, i) =>
                para.trim() ? (
                  <p key={i} className="text-[12.5px] leading-[1.85]" style={{ color: textM }}>{para}</p>
                ) : null
              )}
            </div>
          </CardShell>
        )}

        {/* ── QUICK ACTION STRIP ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          {[
            { icon: Activity,         label: "New Assessment",   sub: "Retake to track progress",     color: "#0d9488", action: () => router.push("/dashboard/assessment") },
            { icon: Award,            label: "View Full Report", sub: "Your last detailed results",   color: "#6366f1", action: () => router.push("/dashboard/review") },
            { icon: MessageCircleIcon, label: "Talk to a Doctor", sub: "WhatsApp consultation",        color: "#25d366", action: () => window.open("https://wa.me/250789399765","_blank") },
          ].map(({ icon: Icon, label, sub, color, action }, i) => (
            <button
              key={i}
              onClick={action}
              className="flex items-center gap-4 p-4 text-left transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] group"
              style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 4, boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.3)" : "0 4px 20px rgba(0,0,0,0.05)" }}
            >
              <div className="w-10 h-10 flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110" style={{ background: `${color}14`, borderRadius: 4 }}>
                <Icon size={18} strokeWidth={1.8} style={{ color }} />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-bold" style={{ color: textH }}>{label}</p>
                <p className="text-[11px]" style={{ color: textM }}>{sub}</p>
              </div>
              <ChevronRight size={14} style={{ color: textS, marginLeft: "auto" }} className="group-hover:translate-x-0.5 transition-transform duration-150" />
            </button>
          ))}
        </div>

        {/* Disclaimer */}
        <p className="text-center text-[11px] mt-8 pb-4" style={{ color: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.2)" }}>
          This dashboard is for educational screening purposes only — not a medical diagnosis. Always consult a qualified healthcare professional.
        </p>
      </div>
    </DashboardLayout>
  );
}

// Small inline icon to avoid import issue
function MessageCircleIcon({ size = 18, strokeWidth = 1.8, style }: { size?: number; strokeWidth?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}