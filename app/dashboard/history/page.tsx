/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/static-components */
"use client";

/**
 * /app/dashboard/history/page.tsx
 *
 * A rich health history & analytics page featuring:
 * - Summary KPI strip
 * - Risk river (animated SVG timeline)
 * - Activity heat-map calendar
 * - Radar / spider chart (current risk profile)
 * - Assessment-by-assessment timeline with expandable cards
 * - Side-by-side comparison mode
 * - Streak & achievement badges
 */

import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Activity, TrendingUp, TrendingDown, Minus,
  Calendar, Flame, Award, Target,
  ChevronDown, ChevronRight, ArrowRight,
  Droplet, Heart, Plus, BarChart2,
  RefreshCw, GitCompare, CheckCircle,
  Shield, Zap, Clock, Info, Star,
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useRequireAuth } from "@/hooks/useAuth";
import { fetchUserAssessments, type StoredAssessment } from "@/services/AppwriteService";
import { useTheme } from "@/contexts/ThemeContext";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const RISK_ORDER: Record<string, number> = {
  low: 1, "slightly-elevated": 2, moderate: 3, high: 4, "very-high": 5,
};
const RISK_COLOR: Record<string, string> = {
  low: "#22c55e", "slightly-elevated": "#84cc16", moderate: "#f97316", high: "#ef4444", "very-high": "#dc2626",
};
const RISK_LABEL: Record<string, string> = {
  low: "Low", "slightly-elevated": "Slight", moderate: "Moderate", high: "High", "very-high": "Very High",
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtShort(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}
function timeAgo(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d === 0) return "Today";
  if (d === 1) return "Yesterday";
  if (d < 7) return `${d}d ago`;
  if (d < 30) return `${Math.floor(d / 7)}w ago`;
  return `${Math.floor(d / 30)}mo ago`;
}
function capitalize(s: string) {
  return (s || "").split("-").map(w => w[0]?.toUpperCase() + w.slice(1)).join(" ");
}
function parseList(s: string): string[] {
  try { return JSON.parse(s || "[]"); } catch { return []; }
}

// ─── HOOKS ────────────────────────────────────────────────────────────────────
function useInView(threshold = 0.08) {
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

function useCountUp(target: number, enabled = true, duration = 900) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!enabled || target === 0) { setVal(target); return; }
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setVal(Math.round((1 - (1 - p) ** 3) * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, enabled, duration]);
  return val;
}

// ─── RISK BADGE ───────────────────────────────────────────────────────────────
function RiskBadge({ level, size = "sm" }: { level: string; size?: "xs" | "sm" }) {
  const c = RISK_COLOR[level] ?? "#22c55e";
  return (
    <span
      className="inline-flex items-center gap-1"
      style={{
        background: `${c}18`, color: c, borderRadius: 3,
        padding: size === "xs" ? "1px 6px" : "2px 8px",
        fontSize: size === "xs" ? 9 : 11,
        fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase",
      }}
    >
      <span style={{ width: size === "xs" ? 5 : 6, height: size === "xs" ? 5 : 6, borderRadius: "50%", background: c, flexShrink: 0, display: "inline-block" }} />
      {RISK_LABEL[level] ?? "Low"}
    </span>
  );
}

// ─── SHELL CARD ───────────────────────────────────────────────────────────────
function Card({ children, delay = 0, className = "", style = {} }: {
  children: React.ReactNode; delay?: number; className?: string; style?: React.CSSProperties;
}) {
  const { isDark } = useTheme();
  const { ref, vis } = useInView();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${className}`}
      style={{
        background: isDark ? "#0d1323" : "#ffffff",
        border: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"}`,
        borderRadius: 6,
        boxShadow: isDark ? "0 4px 24px rgba(0,0,0,0.35)" : "0 4px 24px rgba(0,0,0,0.06)",
        opacity: vis ? 1 : 0,
        transform: vis ? "translateY(0)" : "translateY(18px)",
        transitionDelay: `${delay}ms`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function SLabel({ children }: { children: React.ReactNode }) {
  const { isDark } = useTheme();
  return (
    <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: isDark ? "#3d4f63" : "#94a3b8", marginBottom: 16 }}>
      {children}
    </p>
  );
}

// ─── RISK RIVER CHART ─────────────────────────────────────────────────────────
// A dual-line SVG chart that animates on mount — shows risk over time like a river
function RiskRiver({ assessments, isDark }: { assessments: StoredAssessment[]; isDark: boolean }) {
  const sorted = useMemo(() => [...assessments].reverse().slice(-12), [assessments]);
  const [drawn, setDrawn] = useState(false);
  const { ref, vis } = useInView();

  useEffect(() => { if (vis) setTimeout(() => setDrawn(true), 100); }, [vis]);

  if (sorted.length < 2) return (
    <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center", color: isDark ? "#3d4f63" : "#cbd5e1", fontSize: 12 }}>
      Need at least 2 assessments to show the risk river.
    </div>
  );

  const W = 640, H = 160, PAD_X = 32, PAD_Y = 16;
  const iW = W - PAD_X * 2, iH = H - PAD_Y * 2;

  const pts = (key: "diabetesLevel" | "hypertensionLevel") =>
    sorted.map((a, i) => {
      const x = PAD_X + (i / (sorted.length - 1)) * iW;
      const y = PAD_Y + iH - ((RISK_ORDER[a[key]] ?? 1) - 1) / 4 * iH;
      return [x, y] as [number, number];
    });

  function catmull(pts: [number, number][]): string {
    if (pts.length < 2) return "";
    let d = `M ${pts[0][0]},${pts[0][1]}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(i - 1, 0)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(i + 2, pts.length - 1)];
      const cp1x = p1[0] + (p2[0] - p0[0]) / 6, cp1y = p1[1] + (p2[1] - p0[1]) / 6;
      const cp2x = p2[0] - (p3[0] - p1[0]) / 6, cp2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2[0]},${p2[1]}`;
    }
    return d;
  }

  function areaPath(pts: [number, number][], bottom: number): string {
    return `${catmull(pts)} L ${pts[pts.length - 1][0]},${bottom} L ${pts[0][0]},${bottom} Z`;
  }

  const dPts = pts("diabetesLevel"), hPts = pts("hypertensionLevel");
  const gridY = [0, 1, 2, 3, 4].map(i => PAD_Y + iH - i / 4 * iH);
  const gridLabels = ["Low", "Slight", "Moderate", "High", "V.High"];
  const gridColors = ["#22c55e", "#84cc16", "#f97316", "#ef4444", "#dc2626"];

  const pathLen = 1200; // rough estimate
  const totalLen = drawn ? 0 : pathLen;

  return (
    <div ref={ref} style={{ width: "100%", overflowX: "auto" }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", minWidth: 320, height: "auto", display: "block" }}>
        <defs>
          <linearGradient id="dGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0d9488" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#0d9488" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="hGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {gridY.map((y, i) => (
          <g key={i}>
            <line x1={PAD_X} y1={y} x2={W - PAD_X} y2={y}
              stroke={isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.05)"} strokeWidth={1} />
            <text x={PAD_X - 4} y={y + 4} textAnchor="end" fontSize={8} fill={gridColors[i]} fontWeight={700}>{gridLabels[i]}</text>
          </g>
        ))}

        {/* Vertical date lines */}
        {sorted.map((a, i) => {
          const x = PAD_X + (i / (sorted.length - 1)) * iW;
          return (
            <g key={i}>
              <line x1={x} y1={PAD_Y} x2={x} y2={H - PAD_Y}
                stroke={isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.04)"} strokeWidth={1} strokeDasharray="3 3" />
              {(i === 0 || i === sorted.length - 1 || (sorted.length <= 6)) && (
                <text x={x} y={H - 2} textAnchor="middle" fontSize={8}
                  fill={isDark ? "#3d4f63" : "#94a3b8"}>{fmtShort(a.$createdAt)}</text>
              )}
            </g>
          );
        })}

        {/* Area fills */}
        <path d={areaPath(dPts, H - PAD_Y)} fill="url(#dGrad)" />
        <path d={areaPath(hPts, H - PAD_Y)} fill="url(#hGrad)" />

        {/* Lines */}
        <path d={catmull(dPts)} fill="none" stroke="#0d9488" strokeWidth={2.5} strokeLinecap="round"
          style={{
            strokeDasharray: pathLen,
            strokeDashoffset: drawn ? 0 : pathLen,
            transition: "stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)",
          }} />
        <path d={catmull(hPts)} fill="none" stroke="#6366f1" strokeWidth={2.5} strokeLinecap="round"
          style={{
            strokeDasharray: pathLen,
            strokeDashoffset: drawn ? 0 : pathLen,
            transition: "stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1) 0.2s",
          }} />

        {/* Dots — diabetes */}
        {dPts.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={drawn ? 4 : 0} fill="#0d9488"
            stroke={isDark ? "#0d1323" : "#fff"} strokeWidth={2}
            style={{ transition: `r 0.3s ease ${0.8 + i * 0.06}s` }} />
        ))}
        {/* Dots — hypertension */}
        {hPts.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={drawn ? 4 : 0} fill="#6366f1"
            stroke={isDark ? "#0d1323" : "#fff"} strokeWidth={2}
            style={{ transition: `r 0.3s ease ${0.9 + i * 0.06}s` }} />
        ))}
      </svg>

      {/* Legend */}
      <div style={{ display: "flex", gap: 16, marginTop: 8, justifyContent: "center" }}>
        {[["#0d9488", "Diabetes Risk"], ["#6366f1", "Hypertension Risk"]].map(([color, label]) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600, color: isDark ? "#6b7a8d" : "#64748b" }}>
            <span style={{ display: "block", width: 24, height: 3, background: color, borderRadius: 99 }} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── RADAR / SPIDER CHART ─────────────────────────────────────────────────────
function RadarChart({ assessment, isDark }: { assessment: StoredAssessment; isDark: boolean }) {
  const axes = [
    { label: "Diabetes",    value: (RISK_ORDER[assessment.diabetesLevel] ?? 1) / 5 },
    { label: "Hypertension",value: (RISK_ORDER[assessment.hypertensionLevel] ?? 1) / 5 },
    { label: "BMI",         value: assessment.profileBmi === "obese" ? 0.9 : assessment.profileBmi === "overweight" ? 0.6 : assessment.profileBmi === "underweight" ? 0.4 : 0.2 },
    { label: "Age Risk",    value: assessment.profileAge === "elderly" ? 0.85 : assessment.profileAge === "senior" ? 0.65 : assessment.profileAge === "middle-aged" ? 0.45 : 0.2 },
    { label: "Waist",       value: assessment.profileWaist === "high" ? 0.8 : assessment.profileWaist === "borderline" ? 0.5 : 0.2 },
  ];

  const [drawn, setDrawn] = useState(false);
  const { ref, vis } = useInView();
  useEffect(() => { if (vis) setTimeout(() => setDrawn(true), 200); }, [vis]);

  const CX = 120, CY = 110, R = 80;
  const n = axes.length;
  const angle = (i: number) => (i / n) * 2 * Math.PI - Math.PI / 2;

  const pts = (scale: number) =>
    axes.map((a, i) => {
      const r = a.value * R * scale;
      return [CX + r * Math.cos(angle(i)), CY + r * Math.sin(angle(i))];
    });

  const polyPts = (pts: number[][]) => pts.map(([x, y]) => `${x},${y}`).join(" ");

  // Grid rings
  const rings = [0.25, 0.5, 0.75, 1];
  const gridColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const axisColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";

  const filledPts = pts(drawn ? 1 : 0.01);

  return (
    <div ref={ref}>
      <svg viewBox="0 0 240 220" style={{ width: "100%", maxWidth: 240, display: "block", margin: "0 auto" }}>
        {/* Grid rings */}
        {rings.map((r, ri) => (
          <polygon key={ri}
            points={polyPts(axes.map((_, i) => {
              const rr = r * R;
              return [CX + rr * Math.cos(angle(i)), CY + rr * Math.sin(angle(i))];
            }))}
            fill="none" stroke={gridColor} strokeWidth={1} />
        ))}
        {/* Axes */}
        {axes.map((_, i) => (
          <line key={i}
            x1={CX} y1={CY}
            x2={CX + R * Math.cos(angle(i))} y2={CY + R * Math.sin(angle(i))}
            stroke={axisColor} strokeWidth={1} />
        ))}
        {/* Filled area */}
        <polygon
          points={polyPts(filledPts)}
          fill="rgba(13,148,136,0.15)" stroke="#0d9488" strokeWidth={2}
          style={{ transition: "all 1s cubic-bezier(0.4,0,0.2,1)" }}
        />
        {/* Dots */}
        {filledPts.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={3} fill="#0d9488"
            stroke={isDark ? "#0d1323" : "#fff"} strokeWidth={1.5}
            style={{ transition: `all 1s cubic-bezier(0.4,0,0.2,1) ${i * 0.1}s` }} />
        ))}
        {/* Labels */}
        {axes.map((a, i) => {
          const lx = CX + (R + 18) * Math.cos(angle(i));
          const ly = CY + (R + 18) * Math.sin(angle(i));
          const textAnchor = lx < CX - 5 ? "end" : lx > CX + 5 ? "start" : "middle";
          return (
            <text key={i} x={lx} y={ly + 3} textAnchor={textAnchor}
              fontSize={9} fontWeight={700} fill={isDark ? "#4a5568" : "#94a3b8"}>
              {a.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

// ─── ACTIVITY HEATMAP CALENDAR ────────────────────────────────────────────────
function HeatmapCalendar({ assessments, isDark }: { assessments: StoredAssessment[]; isDark: boolean }) {
  const dateSet = useMemo(() => {
    const m: Record<string, number> = {};
    assessments.forEach(a => {
      const d = new Date(a.$createdAt);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      m[key] = (m[key] ?? 0) + 1;
    });
    return m;
  }, [assessments]);

  // Build last 28 weeks (196 days)
  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - 195);
  // Align to Sunday
  start.setDate(start.getDate() - start.getDay());

  const weeks: Date[][] = [];
  const cur = new Date(start);
  while (cur <= today) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(week);
  }

  const months: { label: string; col: number }[] = [];
  weeks.forEach((week, wi) => {
    const first = week[0];
    if (wi === 0 || first.getDate() <= 7) {
      months.push({ label: first.toLocaleDateString("en-GB", { month: "short" }), col: wi });
    }
  });

  const dayLabels = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  function cellColor(date: Date) {
    if (date > today) return "transparent";
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    const count = dateSet[key] ?? 0;
    if (count === 0) return isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.05)";
    if (count === 1) return "rgba(13,148,136,0.4)";
    if (count === 2) return "rgba(13,148,136,0.7)";
    return "#0d9488";
  }

  const { ref, vis } = useInView();

  return (
    <div ref={ref} style={{ overflowX: "auto" }}>
      <div style={{ minWidth: 520 }}>
        {/* Month labels */}
        <div style={{ display: "flex", marginLeft: 28, marginBottom: 4, position: "relative", height: 14 }}>
          {months.map(({ label, col }) => (
            <div key={`${label}-${col}`} style={{ position: "absolute", left: col * 14, fontSize: 9, fontWeight: 700, color: isDark ? "#3d4f63" : "#94a3b8", letterSpacing: "0.06em" }}>
              {label}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 0 }}>
          {/* Day labels */}
          <div style={{ display: "flex", flexDirection: "column", gap: 2, marginRight: 4 }}>
            {dayLabels.map((d, i) => (
              <div key={d} style={{ height: 11, fontSize: 8, fontWeight: 600, color: isDark ? "#3d4f63" : "#94a3b8", display: i % 2 === 1 ? "block" : "none" }}>
                {d}
              </div>
            ))}
          </div>

          {/* Cells */}
          {weeks.map((week, wi) => (
            <div key={wi} style={{ display: "flex", flexDirection: "column", gap: 2, marginRight: 2 }}>
              {week.map((date, di) => {
                const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
                const count = dateSet[key] ?? 0;
                const isFuture = date > today;
                return (
                  <div key={di}
                    title={!isFuture ? `${fmtDate(date.toISOString())}${count > 0 ? ` — ${count} assessment${count > 1 ? "s" : ""}` : ""}` : ""}
                    style={{
                      width: 11, height: 11, borderRadius: 2,
                      background: isFuture ? "transparent" : cellColor(date),
                      opacity: vis ? 1 : 0,
                      transition: `opacity 0.4s ease ${(wi * 7 + di) * 3}ms`,
                      cursor: count > 0 ? "pointer" : "default",
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8, justifyContent: "flex-end" }}>
          <span style={{ fontSize: 9, color: isDark ? "#3d4f63" : "#94a3b8" }}>Less</span>
          {[0, 1, 2, 3].map(v => (
            <div key={v} style={{ width: 11, height: 11, borderRadius: 2, background: v === 0 ? (isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.05)") : v === 1 ? "rgba(13,148,136,0.35)" : v === 2 ? "rgba(13,148,136,0.65)" : "#0d9488" }} />
          ))}
          <span style={{ fontSize: 9, color: isDark ? "#3d4f63" : "#94a3b8" }}>More</span>
        </div>
      </div>
    </div>
  );
}

// ─── STREAK BADGE ─────────────────────────────────────────────────────────────
function StreakCard({ assessments, isDark }: { assessments: StoredAssessment[]; isDark: boolean }) {
  const { ref, vis } = useInView();

  const stats = useMemo(() => {
    if (assessments.length === 0) return { current: 0, longest: 0, total: 0, thisMonth: 0 };
    const total = assessments.length;
    // Month streak: count how many consecutive months have at least one assessment
    const months = new Set(assessments.map(a => {
      const d = new Date(a.$createdAt);
      return `${d.getFullYear()}-${d.getMonth()}`;
    }));
    const now = new Date();
    let streak = 0;
    for (let i = 0; i < 24; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      if (months.has(`${d.getFullYear()}-${d.getMonth()}`)) streak++;
      else break;
    }
    const thisMonth = assessments.filter(a => {
      const d = new Date(a.$createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    return { current: streak, longest: streak, total, thisMonth };
  }, [assessments]);

  const countTotal = useCountUp(stats.total, vis);
  const countStreak = useCountUp(stats.current, vis);
  const countMonth = useCountUp(stats.thisMonth, vis);

  const items = [
    { icon: BarChart2, label: "Total", value: countTotal, color: "#6366f1", sub: "assessments" },
    { icon: Flame,     label: "Month Streak", value: countStreak, color: "#f97316", sub: "months active" },
    { icon: Calendar,  label: "This Month", value: countMonth, color: "#0d9488", sub: "this month" },
  ];

  const bg = isDark ? "#0d1323" : "#ffffff";
  const border = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
  const txt = isDark ? "#f0f4f8" : "#0f172a";
  const muted = isDark ? "#6b7a8d" : "#64748b";

  return (
    <div ref={ref} style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
      {items.map(({ icon: Icon, label, value, color, sub }, i) => (
        <div key={i}
          style={{
            background: bg, border: `1px solid ${border}`, borderRadius: 6, padding: "16px 14px",
            opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(14px)",
            transition: `all 0.6s ease ${i * 80}ms`,
            boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.3)" : "0 4px 20px rgba(0,0,0,0.05)",
          }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
            <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", color: muted }}>{label}</p>
            <div style={{ width: 28, height: 28, borderRadius: 4, background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center", color }}>
              <Icon size={13} strokeWidth={1.8} />
            </div>
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 900, color: txt, letterSpacing: "-0.04em", lineHeight: 1 }}>{value}</div>
          <p style={{ fontSize: 10, color: muted, marginTop: 4 }}>{sub}</p>
        </div>
      ))}
    </div>
  );
}

// ─── ACHIEVEMENT BADGES ───────────────────────────────────────────────────────
function AchievementBadges({ assessments, isDark }: { assessments: StoredAssessment[]; isDark: boolean }) {
  const badges = useMemo(() => {
    const n = assessments.length;
    const hasLow = assessments.some(a => a.diabetesLevel === "low" && a.hypertensionLevel === "low");
    const months = new Set(assessments.map(a => { const d = new Date(a.$createdAt); return `${d.getFullYear()}-${d.getMonth()}`; })).size;
    const improving = n >= 2 && (
      RISK_ORDER[assessments[0].diabetesLevel] < RISK_ORDER[assessments[1].diabetesLevel] ||
      RISK_ORDER[assessments[0].hypertensionLevel] < RISK_ORDER[assessments[1].hypertensionLevel]
    );

    return [
      { icon: "🩺", label: "First Check",  desc: "Completed first assessment", unlocked: n >= 1 },
      { icon: "🔁", label: "Consistent",    desc: "3+ assessments done",         unlocked: n >= 3 },
      { icon: "📅", label: "Monthly",       desc: "Active for 2+ months",         unlocked: months >= 2 },
      { icon: "💚", label: "All Clear",     desc: "Low risk on both metrics",     unlocked: hasLow },
      { icon: "📈", label: "Improving",     desc: "Risk reduced vs last check",   unlocked: improving },
      { icon: "🏆", label: "Dedicated",    desc: "10+ assessments completed",    unlocked: n >= 10 },
    ];
  }, [assessments]);

  const border = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
  const muted = isDark ? "#3d4f63" : "#94a3b8";
  const { ref, vis } = useInView();

  return (
    <div ref={ref} style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
      {badges.map((b, i) => (
        <div key={i} style={{
          padding: "12px 10px", borderRadius: 6, textAlign: "center",
          border: `1px solid ${b.unlocked ? "rgba(13,148,136,0.25)" : border}`,
          background: b.unlocked ? (isDark ? "rgba(13,148,136,0.06)" : "rgba(13,148,136,0.04)") : (isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)"),
          opacity: vis ? (b.unlocked ? 1 : 0.45) : 0,
          transition: `opacity 0.5s ease ${i * 60}ms, transform 0.5s ease ${i * 60}ms`,
          transform: vis ? "scale(1)" : "scale(0.94)",
          filter: b.unlocked ? "none" : "grayscale(1)",
        }}>
          <div style={{ fontSize: 22, marginBottom: 4 }}>{b.icon}</div>
          <p style={{ fontSize: 10, fontWeight: 800, color: b.unlocked ? (isDark ? "#e2e8f0" : "#0f172a") : muted, letterSpacing: "-0.01em" }}>{b.label}</p>
          <p style={{ fontSize: 9, color: muted, marginTop: 2, lineHeight: 1.4 }}>{b.desc}</p>
        </div>
      ))}
    </div>
  );
}

// ─── COMPARISON MODE ──────────────────────────────────────────────────────────
function ComparisonPanel({ assessments, isDark, onClose }: {
  assessments: StoredAssessment[]; isDark: boolean; onClose: () => void;
}) {
  const [aIdx, setAIdx] = useState(0);
  const [bIdx, setBIdx] = useState(Math.min(1, assessments.length - 1));

  const A = assessments[aIdx], B = assessments[bIdx];
  const bg = isDark ? "#0d1323" : "#ffffff";
  const border = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
  const txt = isDark ? "#f0f4f8" : "#0f172a";
  const muted = isDark ? "#6b7a8d" : "#64748b";

  function SelectDropdown({ idx, setIdx, label }: { idx: number; setIdx: (i: number) => void; label: string }) {
    return (
      <div>
        <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", color: muted, marginBottom: 6 }}>{label}</p>
        <select
          value={idx}
          onChange={e => setIdx(Number(e.target.value))}
          style={{ background: isDark ? "#111827" : "#f8fafc", border: `1px solid ${border}`, borderRadius: 4, color: txt, fontSize: 11, fontWeight: 600, padding: "6px 10px", width: "100%", cursor: "pointer" }}
        >
          {assessments.map((a, i) => (
            <option key={a.$id} value={i}>#{a.assessmentNumber ?? i + 1} — {fmtDate(a.$createdAt)}</option>
          ))}
        </select>
      </div>
    );
  }

  function DiffBadge({ levelA, levelB, metric }: { levelA: string; levelB: string; metric: string }) {
    const oA = RISK_ORDER[levelA] ?? 1, oB = RISK_ORDER[levelB] ?? 1;
    const diff = oA - oB;
    const color = diff < 0 ? "#22c55e" : diff > 0 ? "#ef4444" : muted;
    const Icon = diff < 0 ? TrendingDown : diff > 0 ? TrendingUp : Minus;
    const label = diff < 0 ? "Improved" : diff > 0 ? "Worsened" : "Unchanged";
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 700, color }}>
        <Icon size={11} strokeWidth={2.5} />
        {label}
      </div>
    );
  }

  const rows = [
    { label: "Diabetes",     a: A?.diabetesLevel,     b: B?.diabetesLevel },
    { label: "Hypertension", a: A?.hypertensionLevel,  b: B?.hypertensionLevel },
  ];

  return (
    <Card style={{ padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 4, background: "rgba(99,102,241,0.12)", display: "flex", alignItems: "center", justifyContent: "center", color: "#6366f1" }}>
            <GitCompare size={13} strokeWidth={1.8} />
          </div>
          <p style={{ fontSize: 13, fontWeight: 800, color: txt, letterSpacing: "-0.01em" }}>Assessment Comparison</p>
        </div>
        <button onClick={onClose} style={{ fontSize: 11, fontWeight: 600, color: muted, background: "none", border: "none", cursor: "pointer" }}>Close ×</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 12, alignItems: "start" }}>
        <SelectDropdown idx={aIdx} setIdx={setAIdx} label="Assessment A" />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 28 }}>
          <div style={{ width: 1, height: 20, background: border }} />
        </div>
        <SelectDropdown idx={bIdx} setIdx={setBIdx} label="Assessment B" />
      </div>

      {/* Metric comparison table */}
      <div style={{ marginTop: 16, border: `1px solid ${border}`, borderRadius: 6, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 80px 1fr", background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)", padding: "8px 12px" }}>
          {["Metric", "Assessment A", "Change", "Assessment B"].map(h => (
            <span key={h} style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: muted }}>{h}</span>
          ))}
        </div>
        {rows.map((row, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 80px 1fr", padding: "10px 12px", borderTop: `1px solid ${border}` }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: muted }}>{row.label}</span>
            <span><RiskBadge level={row.a ?? "low"} size="xs" /></span>
            <span><DiffBadge levelA={row.b ?? "low"} levelB={row.a ?? "low"} metric={row.label} /></span>
            <span><RiskBadge level={row.b ?? "low"} size="xs" /></span>
          </div>
        ))}
      </div>

      {/* Date diff */}
      {A && B && (
        <p style={{ fontSize: 10, color: muted, marginTop: 10, textAlign: "center" }}>
          {Math.abs(Math.round((new Date(A.$createdAt).getTime() - new Date(B.$createdAt).getTime()) / 86400000))} days between assessments
        </p>
      )}
    </Card>
  );
}

// ─── TIMELINE CARD ────────────────────────────────────────────────────────────
function TimelineCard({ assessment, index, total, isDark, isLast }: {
  assessment: StoredAssessment; index: number; total: number; isDark: boolean; isLast: boolean;
}) {
  const [open, setOpen] = useState(false);
  const { ref, vis } = useInView();
  const findings = parseList(assessment.keyFindings);
  const recs = parseList(assessment.recommendations);

  const bg = isDark ? "#0d1323" : "#ffffff";
  const border = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
  const txt = isDark ? "#f0f4f8" : "#0f172a";
  const muted = isDark ? "#6b7a8d" : "#64748b";
  const sub = isDark ? "#3d4f63" : "#94a3b8";
  const dColor = RISK_COLOR[assessment.diabetesLevel] ?? "#22c55e";
  const hColor = RISK_COLOR[assessment.hypertensionLevel] ?? "#22c55e";

  const isLatest = index === 0;
  const num = assessment.assessmentNumber ?? (total - index);

  return (
    <div ref={ref} style={{ display: "flex", gap: 0, opacity: vis ? 1 : 0, transform: vis ? "translateX(0)" : "translateX(-16px)", transition: `all 0.6s ease ${index * 60}ms` }}>
      {/* Timeline spine */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 40, flexShrink: 0 }}>
        {/* Node */}
        <div style={{
          width: 28, height: 28, borderRadius: "50%", flexShrink: 0, zIndex: 1,
          background: isLatest ? "linear-gradient(135deg,#0d9488,#059669)" : (isDark ? "#111827" : "#f8fafc"),
          border: `2px solid ${isLatest ? "#0d9488" : border}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: isLatest ? "0 0 0 4px rgba(13,148,136,0.15)" : "none",
        }}>
          <span style={{ fontSize: 9, fontWeight: 900, color: isLatest ? "#fff" : muted }}>#{num}</span>
        </div>
        {/* Line */}
        {!isLast && (
          <div style={{ flex: 1, width: 1, background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)", marginTop: 4, minHeight: 32 }} />
        )}
      </div>

      {/* Card */}
      <div style={{ flex: 1, marginBottom: isLast ? 0 : 16, marginLeft: 12 }}>
        <div
          style={{
            background: bg,
            border: `1px solid ${isLatest ? "rgba(13,148,136,0.3)" : border}`,
            borderRadius: 6,
            overflow: "hidden",
            boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.3)" : "0 4px 20px rgba(0,0,0,0.05)",
            cursor: "pointer",
          }}
          onClick={() => setOpen(v => !v)}
        >
          {/* Header */}
          <div style={{ padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: txt }}>{fmtDate(assessment.$createdAt)}</span>
                  {isLatest && (
                    <span style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", padding: "2px 7px", borderRadius: 3, background: "rgba(13,148,136,0.12)", color: "#0d9488" }}>Latest</span>
                  )}
                  {assessment.isRetake && (
                    <span style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", padding: "2px 7px", borderRadius: 3, background: "rgba(139,92,246,0.1)", color: "#8b5cf6" }}>Retake</span>
                  )}
                </div>
                <p style={{ fontSize: 10, color: sub, marginTop: 3 }}>{timeAgo(assessment.$createdAt)}</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                {assessment.xpEarned > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10, fontWeight: 700, color: "#f59e0b" }}>
                    <Zap size={10} strokeWidth={2} />
                    {assessment.xpEarned} XP
                  </div>
                )}
                <ChevronDown size={14} strokeWidth={2} style={{ color: muted, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
              </div>
            </div>

            {/* Risk pills row */}
            <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 4, background: `${dColor}10`, border: `1px solid ${dColor}25` }}>
                <Droplet size={11} strokeWidth={1.8} style={{ color: dColor }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: dColor }}>Diabetes: {RISK_LABEL[assessment.diabetesLevel] ?? "Low"}</span>
                <span style={{ fontSize: 9, color: muted }}>· {assessment.diabetesPct}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 4, background: `${hColor}10`, border: `1px solid ${hColor}25` }}>
                <Heart size={11} strokeWidth={1.8} style={{ color: hColor }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: hColor }}>BP: {RISK_LABEL[assessment.hypertensionLevel] ?? "Low"}</span>
                <span style={{ fontSize: 9, color: muted }}>· {assessment.hypertensionPct}</span>
              </div>
              {assessment.profileBmi && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 4, background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)", border: `1px solid ${border}` }}>
                  <Target size={11} strokeWidth={1.8} style={{ color: muted }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: muted }}>BMI: {capitalize(assessment.profileBmi)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Expandable detail */}
          <div style={{
            maxHeight: open ? 800 : 0, overflow: "hidden",
            transition: "max-height 0.4s cubic-bezier(0.4,0,0.2,1)",
          }}>
            <div style={{ padding: "0 16px 16px", borderTop: `1px solid ${border}` }}>
              {/* Summary */}
              {assessment.summary && (
                <div style={{ marginTop: 14 }}>
                  <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", color: sub, marginBottom: 6 }}>Summary</p>
                  <p style={{ fontSize: 12, lineHeight: 1.75, color: muted }}>{assessment.summary}</p>
                </div>
              )}

              {/* Findings & Recs side by side */}
              <div style={{ display: "grid", gridTemplateColumns: findings.length > 0 && recs.length > 0 ? "1fr 1fr" : "1fr", gap: 16, marginTop: 14 }}>
                {findings.length > 0 && (
                  <div>
                    <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", color: sub, marginBottom: 8 }}>Key Findings</p>
                    {findings.slice(0, 3).map((f, i) => (
                      <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                        <Shield size={11} strokeWidth={1.8} style={{ color: "#6366f1", flexShrink: 0, marginTop: 2 }} />
                        <p style={{ fontSize: 11, lineHeight: 1.6, color: muted, margin: 0 }}>{f}</p>
                      </div>
                    ))}
                  </div>
                )}
                {recs.length > 0 && (
                  <div>
                    <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", color: sub, marginBottom: 8 }}>Recommendations</p>
                    {recs.slice(0, 3).map((r, i) => (
                      <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                        <CheckCircle size={11} strokeWidth={1.8} style={{ color: "#22c55e", flexShrink: 0, marginTop: 2 }} />
                        <p style={{ fontSize: 11, lineHeight: 1.6, color: muted, margin: 0 }}>{r}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function HistoryPage() {
  const auth = useRequireAuth();
  const router = useRouter();
  const { isDark } = useTheme();

  const [assessments, setAssessments] = useState<StoredAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comparing, setComparing] = useState(false);
  const [tab, setTab] = useState<"timeline" | "analytics">("timeline");

  const bg     = isDark ? "#060c18" : "#ffffff";
  const border = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
  const txt    = isDark ? "#f0f4f8" : "#0f172a";
  const muted  = isDark ? "#6b7a8d" : "#64748b";
  const sub    = isDark ? "#3d4f63" : "#94a3b8";

  const load = useCallback(async (uid: string) => {
    try {
      const data = await fetchUserAssessments(uid);
      setAssessments(data);
      setError(null);
    } catch {
      setError("Failed to load history. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (auth.user) load(auth.user.id); }, [auth.user, load]);

  const handleRefresh = async () => {
    if (!auth.user || refreshing) return;
    setRefreshing(true);
    await load(auth.user.id);
    setRefreshing(false);
  };

  if (auth.loading) return null;

  const latest = assessments[0] ?? null;

  // Trend — compare latest vs previous
  const dTrend = assessments.length < 2 ? "flat"
    : RISK_ORDER[assessments[0].diabetesLevel] < RISK_ORDER[assessments[1].diabetesLevel] ? "down"
    : RISK_ORDER[assessments[0].diabetesLevel] > RISK_ORDER[assessments[1].diabetesLevel] ? "up" : "flat";
  const hTrend = assessments.length < 2 ? "flat"
    : RISK_ORDER[assessments[0].hypertensionLevel] < RISK_ORDER[assessments[1].hypertensionLevel] ? "down"
    : RISK_ORDER[assessments[0].hypertensionLevel] > RISK_ORDER[assessments[1].hypertensionLevel] ? "up" : "flat";

  return (
    <DashboardLayout>
      <style jsx global>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .tab-btn {
          transition: all 0.15s ease;
        }
        .tab-btn:hover { opacity: 0.8; }
      `}</style>

      <div style={{ background: bg, minHeight: "100%" }}>

        {/* ── PAGE HEADER ── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, gap: 12, flexWrap: "wrap" }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: "#0d9488", marginBottom: 4 }}>
              Assessment History
            </p>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 900, color: txt, letterSpacing: "-0.03em", margin: 0 }}>
              Your Health Journey
            </h1>
            <p style={{ fontSize: 12, color: sub, marginTop: 4 }}>
              {assessments.length > 0
                ? `${assessments.length} assessment${assessments.length !== 1 ? "s" : ""} — tracking since ${fmtDate(assessments[assessments.length - 1].$createdAt)}`
                : "No assessments recorded yet"}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {assessments.length >= 2 && (
              <button
                onClick={() => setComparing(v => !v)}
                style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 4,
                  background: comparing ? "rgba(99,102,241,0.12)" : (isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"),
                  border: `1px solid ${comparing ? "rgba(99,102,241,0.35)" : border}`,
                  color: comparing ? "#6366f1" : muted, fontSize: 12, fontWeight: 600, cursor: "pointer",
                }}
              >
                <GitCompare size={13} strokeWidth={2} /> Compare
              </button>
            )}
            <button
              onClick={handleRefresh}
              style={{
                display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 4,
                background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                border: `1px solid ${border}`, color: muted, fontSize: 12, fontWeight: 600, cursor: "pointer",
              }}
            >
              <RefreshCw size={12} strokeWidth={2} className={refreshing ? "animate-spin" : ""} />
              Refresh
            </button>
            <button
              onClick={() => router.push("/dashboard/assessment")}
              style={{
                display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 4,
                background: "linear-gradient(135deg,#0d9488,#059669)",
                boxShadow: "0 4px 14px rgba(13,148,136,0.3)",
                color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer", border: "none",
              }}
            >
              <Plus size={13} strokeWidth={2.5} /> New Assessment
            </button>
          </div>
        </div>

        {/* ── ERROR ── */}
        {error && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", marginBottom: 16, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 4 }}>
            <Info size={14} style={{ color: "#ef4444", flexShrink: 0 }} />
            <p style={{ fontSize: 12, color: "#ef4444", flex: 1 }}>{error}</p>
            <button onClick={handleRefresh} style={{ fontSize: 11, fontWeight: 700, color: "#ef4444", background: "none", border: "none", cursor: "pointer" }}>Retry</button>
          </div>
        )}

        {/* ── COMPARE PANEL ── */}
        {comparing && assessments.length >= 2 && (
          <div style={{ marginBottom: 20, animation: "fadeSlideUp 0.3s ease" }}>
            <ComparisonPanel assessments={assessments} isDark={isDark} onClose={() => setComparing(false)} />
          </div>
        )}

        {/* ── EMPTY STATE ── */}
        {!loading && assessments.length === 0 && (
          <Card style={{ padding: 48, textAlign: "center", margin: "40px auto", maxWidth: 420 }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: "rgba(13,148,136,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Activity size={28} strokeWidth={1.3} style={{ color: "#0d9488" }} />
            </div>
            <p style={{ fontSize: 16, fontWeight: 900, color: txt, marginBottom: 8, letterSpacing: "-0.02em" }}>No history yet</p>
            <p style={{ fontSize: 13, color: muted, lineHeight: 1.6, marginBottom: 20 }}>Complete your first assessment and your health journey will appear here — with charts, trends, and insights.</p>
            <button onClick={() => router.push("/dashboard/assessment")}
              style={{ padding: "10px 24px", borderRadius: 4, background: "linear-gradient(135deg,#0d9488,#059669)", color: "#fff", fontSize: 13, fontWeight: 800, border: "none", cursor: "pointer", boxShadow: "0 4px 14px rgba(13,148,136,0.3)" }}>
              Take First Assessment
            </button>
          </Card>
        )}

        {/* ── MAIN CONTENT ── */}
        {!loading && assessments.length > 0 && (
          <>
            {/* ── KPI STRIP ── */}
            <StreakCard assessments={assessments} isDark={isDark} />

            {/* ── TAB STRIP ── */}
            <div style={{ display: "flex", gap: 4, margin: "20px 0", background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)", borderRadius: 6, padding: 4, width: "fit-content" }}>
              {(["timeline", "analytics"] as const).map(t => (
                <button
                  key={t}
                  className="tab-btn"
                  onClick={() => setTab(t)}
                  style={{
                    padding: "7px 18px", borderRadius: 4, fontSize: 12, fontWeight: 700, cursor: "pointer", border: "none",
                    background: tab === t ? (isDark ? "#0d9488" : "#0d9488") : "transparent",
                    color: tab === t ? "#fff" : muted,
                    textTransform: "capitalize",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* ── TIMELINE TAB ── */}
            {tab === "timeline" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20 }}>

                {/* Risk River chart */}
                <Card style={{ padding: 20 }}>
                  <SLabel>Risk Over Time</SLabel>
                  <RiskRiver assessments={assessments} isDark={isDark} />
                </Card>

                {/* Timeline list */}
                <Card style={{ padding: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                    <SLabel>Assessment Timeline</SLabel>
                    {assessments.length > 0 && (
                      <button
                        onClick={() => router.push("/dashboard/review")}
                        style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: "#0d9488", background: "none", border: "none", cursor: "pointer" }}
                      >
                        Full report <ArrowRight size={11} strokeWidth={2.5} />
                      </button>
                    )}
                  </div>
                  <div>
                    {assessments.map((a, i) => (
                      <TimelineCard
                        key={a.$id}
                        assessment={a}
                        index={i}
                        total={assessments.length}
                        isDark={isDark}
                        isLast={i === assessments.length - 1}
                      />
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {/* ── ANALYTICS TAB ── */}
            {tab === "analytics" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20 }}>

                {/* Top row: radar + heatmap */}
                <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,2fr)", gap: 20 }}>
                  {/* Radar */}
                  <Card style={{ padding: 20, display: "flex", flexDirection: "column" }}>
                    <SLabel>Risk Profile — Latest</SLabel>
                    {latest ? (
                      <>
                        <RadarChart assessment={latest} isDark={isDark} />
                        <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 4, background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)", border: `1px solid ${border}` }}>
                          <p style={{ fontSize: 10, color: muted, lineHeight: 1.6, margin: 0 }}>
                            Radar shows relative risk across 5 health dimensions based on your latest assessment.
                          </p>
                        </div>
                      </>
                    ) : (
                      <p style={{ fontSize: 12, color: sub, textAlign: "center", paddingTop: 24 }}>No data</p>
                    )}
                  </Card>

                  {/* Heatmap */}
                  <Card style={{ padding: 20 }}>
                    <SLabel>Assessment Activity — Last 6 Months</SLabel>
                    <HeatmapCalendar assessments={assessments} isDark={isDark} />
                    <div style={{ marginTop: 16, padding: "10px 12px", borderRadius: 4, background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)", border: `1px solid ${border}` }}>
                      <p style={{ fontSize: 10, color: muted, lineHeight: 1.6, margin: 0 }}>
                        Each cell is a day. Darker green = more assessments that day. Hover a cell for the date.
                      </p>
                    </div>
                  </Card>
                </div>

                {/* Trend stats */}
                <Card style={{ padding: 20 }}>
                  <SLabel>Risk Trend Analysis</SLabel>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16 }}>
                    {[
                      {
                        label: "Diabetes Trend",
                        current: assessments[0]?.diabetesLevel,
                        prev: assessments[1]?.diabetesLevel,
                        trend: dTrend,
                        Icon: Droplet,
                        color: "#0d9488",
                      },
                      {
                        label: "Hypertension Trend",
                        current: assessments[0]?.hypertensionLevel,
                        prev: assessments[1]?.hypertensionLevel,
                        trend: hTrend,
                        Icon: Heart,
                        color: "#6366f1",
                      },
                    ].map(({ label, current, prev, trend, Icon, color }) => {
                      const TIcon = trend === "down" ? TrendingDown : trend === "up" ? TrendingUp : Minus;
                      const tColor = trend === "down" ? "#22c55e" : trend === "up" ? "#ef4444" : muted;
                      const tLabel = trend === "down" ? "Improving" : trend === "up" ? "Worsening" : assessments.length < 2 ? "Need more data" : "Stable";
                      return (
                        <div key={label} style={{ padding: 16, borderRadius: 6, border: `1px solid ${border}`, background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                            <div style={{ width: 28, height: 28, borderRadius: 4, background: `${color}12`, display: "flex", alignItems: "center", justifyContent: "center", color }}>
                              <Icon size={13} strokeWidth={1.8} />
                            </div>
                            <p style={{ fontSize: 11, fontWeight: 700, color: muted }}>{label}</p>
                          </div>
                          {current && <RiskBadge level={current} />}
                          {prev && current && (
                            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 8, fontSize: 11, fontWeight: 700, color: tColor }}>
                              <TIcon size={13} strokeWidth={2.5} />
                              {tLabel} vs previous
                            </div>
                          )}
                          {prev && (
                            <p style={{ fontSize: 10, color: sub, marginTop: 4 }}>
                              Was: {RISK_LABEL[prev] ?? "Low"} → Now: {RISK_LABEL[current ?? "low"] ?? "Low"}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Risk river */}
                  <div style={{ marginTop: 20 }}>
                    <RiskRiver assessments={assessments} isDark={isDark} />
                  </div>
                </Card>

                {/* Achievements */}
                <Card style={{ padding: 20 }}>
                  <SLabel>Achievements</SLabel>
                  <AchievementBadges assessments={assessments} isDark={isDark} />
                </Card>

                {/* Data table */}
                <Card style={{ padding: 20 }}>
                  <SLabel>All Assessments — Data Table</SLabel>
                  <div style={{ overflowX: "auto", margin: "0 -20px", padding: "0 20px" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 540 }}>
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${border}` }}>
                          {["#", "Date", "Diabetes", "BP", "D Score", "H Score", "BMI", "XP"].map(h => (
                            <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: sub }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {assessments.map((a, i) => (
                          <tr key={a.$id}
                            style={{ borderBottom: `1px solid ${border}` }}
                            onMouseEnter={e => (e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)")}
                            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                          >
                            <td style={{ padding: "10px", fontSize: 10, fontWeight: 900, color: sub }}>#{a.assessmentNumber ?? assessments.length - i}</td>
                            <td style={{ padding: "10px" }}>
                              <p style={{ fontSize: 11, fontWeight: 700, color: txt, margin: 0 }}>{fmtDate(a.$createdAt)}</p>
                              <p style={{ fontSize: 9, color: sub, margin: 0 }}>{timeAgo(a.$createdAt)}</p>
                            </td>
                            <td style={{ padding: "10px" }}><RiskBadge level={a.diabetesLevel ?? "low"} size="xs" /></td>
                            <td style={{ padding: "10px" }}><RiskBadge level={a.hypertensionLevel ?? "low"} size="xs" /></td>
                            <td style={{ padding: "10px", fontSize: 11, color: muted }}>{a.diabetesScore ?? "—"}</td>
                            <td style={{ padding: "10px", fontSize: 11, color: muted }}>{a.hypertensionScore ?? "—"}</td>
                            <td style={{ padding: "10px", fontSize: 11, color: muted }}>{capitalize(a.profileBmi || "—")}</td>
                            <td style={{ padding: "10px" }}>
                              {a.xpEarned > 0
                                ? <span style={{ fontSize: 10, fontWeight: 700, color: "#f59e0b", display: "flex", alignItems: "center", gap: 3 }}><Zap size={9} strokeWidth={2} />{a.xpEarned}</span>
                                : <span style={{ fontSize: 10, color: sub }}>—</span>
                              }
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}
          </>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div style={{ display: "grid", gap: 16 }}>
            {[280, 180, 120].map((h, i) => (
              <div key={i} className="animate-pulse" style={{ height: h, borderRadius: 6, background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" }} />
            ))}
          </div>
        )}

        {/* Disclaimer */}
        <p style={{ textAlign: "center", fontSize: 11, marginTop: 32, paddingBottom: 16, color: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.18)" }}>
          History data is for personal tracking only — not a medical record or diagnosis.
        </p>
      </div>
    </DashboardLayout>
  );
}