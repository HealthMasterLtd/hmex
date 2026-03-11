/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import EmployerLayout from "@/components/dashboard/employer/EmployerLayout";
import ThemeToggle from "@/components/Themetoggle";
import {
  getCompanyByOwner,
  getCompanyMembers,
  type Company,
  type EmployeeDashboardRow,
} from "@/services/companyService";
import { fetchLatestAssessment, type StoredAssessment } from "@/services/AppwriteService";
import {
  BarChart3, Download, FileText, Users, Activity, Heart,
  TrendingUp, TrendingDown, AlertCircle, CheckCircle,
  RefreshCw, Building2, Calendar, Printer, FileSpreadsheet,
  ChevronDown, Minus, Loader2,
} from "lucide-react";

// ─── Chart.js ─────────────────────────────────────────────────────────────────
let _Chart: any = null;
async function getChart() {
  if (_Chart) return _Chart;
  const mod = await import("chart.js");
  mod.Chart.register(...mod.registerables);
  _Chart = mod.Chart;
  return _Chart;
}

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface MemberWithRisk extends EmployeeDashboardRow {
  assessment: StoredAssessment | null;
}

interface Analytics {
  total: number;
  active: number;
  pending: number;
  assessed: number;
  assessmentRate: number;
  diabetes: { low: number; medium: number; high: number; none: number };
  hypertension: { low: number; medium: number; high: number; none: number };
  avgDiabetesScore: number;
  avgHypertensionScore: number;
  highRiskCount: number;
  joinedByMonth: Record<string, number>;
  // Anonymous score buckets — no individual identifiers
  scoreBuckets: { diabetesRange: string; count: number; color: string }[];
  genderBreakdown: Record<string, number>;
  ageBreakdown: Record<string, number>;
  bmiBreakdown: Record<string, number>;
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function riskColor(level: string | null | undefined): string {
  switch (level?.toLowerCase()) {
    case "low":    return "#10B981";
    case "medium": return "#F59E0B";
    case "high":   return "#EF4444";
    default:       return "#94A3B8";
  }
}
function riskBg(level: string | null | undefined): string {
  switch (level?.toLowerCase()) {
    case "low":    return "rgba(16,185,129,0.12)";
    case "medium": return "rgba(245,158,11,0.12)";
    case "high":   return "rgba(239,68,68,0.12)";
    default:       return "rgba(148,163,184,0.10)";
  }
}
function capitalize(s: string | null | undefined) {
  if (!s) return "—";
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function fmt(n: number) { return n.toLocaleString(); }

function Skeleton({ w, h, radius = 4 }: { w: string | number; h: number; radius?: number }) {
  const { isDark } = useTheme();
  return (
    <div className="animate-pulse" style={{
      width: w, height: h, borderRadius: radius,
      background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)",
    }} />
  );
}

function computeAnalytics(members: MemberWithRisk[]): Analytics {
  const active = members.filter(m => m.status === "active");
  const assessed = active.filter(m => m.assessment);

  const diabetes = { low: 0, medium: 0, high: 0, none: 0 };
  const hypertension = { low: 0, medium: 0, high: 0, none: 0 };
  let diabSum = 0, hypSum = 0;
  const genderBreakdown: Record<string, number> = {};
  const ageBreakdown: Record<string, number> = {};
  const bmiBreakdown: Record<string, number> = {};

  assessed.forEach(m => {
    const a = m.assessment!;
    const dl = a.diabetesLevel?.toLowerCase();
    const hl = a.hypertensionLevel?.toLowerCase();
    if (dl === "low") diabetes.low++;
    else if (dl === "medium") diabetes.medium++;
    else if (dl === "high") diabetes.high++;
    else diabetes.none++;
    if (hl === "low") hypertension.low++;
    else if (hl === "medium") hypertension.medium++;
    else if (hl === "high") hypertension.high++;
    else hypertension.none++;
    diabSum += Number(a.diabetesScore) || 0;
    hypSum += Number(a.hypertensionScore) || 0;

    const g = a.profileGender || "Unknown";
    genderBreakdown[g] = (genderBreakdown[g] || 0) + 1;
    const age = a.profileAge || "Unknown";
    ageBreakdown[age] = (ageBreakdown[age] || 0) + 1;
    const bmi = a.profileBmi || "Unknown";
    bmiBreakdown[bmi] = (bmiBreakdown[bmi] || 0) + 1;
  });

  const joinedByMonth: Record<string, number> = {};
  active.forEach(m => {
    const d = new Date(m.$createdAt);
    const key = d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
    joinedByMonth[key] = (joinedByMonth[key] || 0) + 1;
  });

  // Anonymous score distribution buckets — no names attached
  const scoreBuckets = [
    { diabetesRange: "0–20",   count: 0, color: "#10B981" },
    { diabetesRange: "21–40",  count: 0, color: "#34D399" },
    { diabetesRange: "41–60",  count: 0, color: "#F59E0B" },
    { diabetesRange: "61–80",  count: 0, color: "#F97316" },
    { diabetesRange: "81–100", count: 0, color: "#EF4444" },
  ];
  assessed.forEach(m => {
    const s = Number(m.assessment!.diabetesScore) || 0;
    if (s <= 20) scoreBuckets[0].count++;
    else if (s <= 40) scoreBuckets[1].count++;
    else if (s <= 60) scoreBuckets[2].count++;
    else if (s <= 80) scoreBuckets[3].count++;
    else scoreBuckets[4].count++;
  });

  const n = assessed.length || 1;
  return {
    total: members.length,
    active: active.length,
    pending: members.filter(m => m.status === "pending").length,
    assessed: assessed.length,
    assessmentRate: active.length ? Math.round((assessed.length / active.length) * 100) : 0,
    diabetes, hypertension,
    avgDiabetesScore: Math.round(diabSum / n),
    avgHypertensionScore: Math.round(hypSum / n),
    highRiskCount: diabetes.high + hypertension.high,
    joinedByMonth,
    scoreBuckets,
    genderBreakdown,
    ageBreakdown,
    bmiBreakdown,
  };
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color, loading }: {
  icon: React.ReactNode; label: string; value: string | number;
  sub?: string; color: string; loading?: boolean;
}) {
  const { surface } = useTheme();
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      style={{ padding: "18px 20px", background: surface.surface, border: `1px solid ${surface.border}`, borderRadius: 2 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{ width: 34, height: 34, borderRadius: 2, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color }}>{icon}</span>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: surface.muted, textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</span>
      </div>
      {loading
        ? <Skeleton w="55%" h={28} />
        : <p style={{ margin: 0, fontSize: 26, fontWeight: 900, color: surface.text, lineHeight: 1 }}>{value}</p>
      }
      {sub && !loading && <p style={{ margin: "4px 0 0", fontSize: 11, color: surface.muted }}>{sub}</p>}
    </motion.div>
  );
}

// ─── DONUT CHART ──────────────────────────────────────────────────────────────
function DonutChartWidget({ title, data, colors, surface, loading }: {
  title: string; data: { label: string; value: number }[];
  colors: string[]; surface: any; loading?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<any>(null);
  const total = data.reduce((s, d) => s + d.value, 0);

  useEffect(() => {
    if (loading || !data.some(d => d.value > 0)) return;
    let alive = true;
    getChart().then(Chart => {
      if (!alive || !canvasRef.current) return;
      chartRef.current?.destroy();
      chartRef.current = new Chart(canvasRef.current, {
        type: "doughnut",
        data: {
          labels: data.map(d => d.label),
          datasets: [{ data: data.map(d => d.value), backgroundColor: colors, borderColor: colors, borderWidth: 2, hoverOffset: 6 }],
        },
        options: {
          responsive: true, maintainAspectRatio: true, cutout: "72%",
          plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx: any) => ` ${ctx.label}: ${ctx.raw}` } } },
          animation: { animateRotate: true, duration: 600 },
        },
      });
    });
    return () => { alive = false; chartRef.current?.destroy(); };
  }, [data, loading]);

  return (
    <div style={{ padding: "20px 20px 16px", background: surface.surface, border: `1px solid ${surface.border}`, borderRadius: 2, height: "100%" }}>
      <p style={{ margin: "0 0 16px", fontSize: 13, fontWeight: 800, color: surface.text }}>{title}</p>
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
          <Skeleton w={120} h={120} radius={60} />
          {[1,2,3].map(i => <Skeleton key={i} w="80%" h={14} />)}
        </div>
      ) : total === 0 ? (
        <div style={{ textAlign: "center", padding: "24px 0" }}>
          <Activity size={24} style={{ color: surface.muted, opacity: 0.4 }} />
          <p style={{ margin: "8px 0 0", fontSize: 12, color: surface.muted }}>No data yet</p>
        </div>
      ) : (
        <>
          <div style={{ position: "relative", width: 120, height: 120, margin: "0 auto 16px" }}>
            <canvas ref={canvasRef} width={120} height={120} />
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
              <span style={{ fontSize: 20, fontWeight: 900, color: surface.text }}>{total}</span>
              <span style={{ fontSize: 9, color: surface.muted, fontWeight: 600 }}>total</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {data.map((d, i) => (
              <div key={d.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: colors[i] }} />
                  <span style={{ fontSize: 11, color: surface.muted }}>{d.label}</span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: surface.text }}>{d.value}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── HORIZONTAL BAR CHART ────────────────────────────────────────────────────
function HBarChart({ title, labels, values, colors, surface, loading, maxVal = 100 }: {
  title: string; labels: string[]; values: number[]; colors: string[];
  surface: any; loading?: boolean; maxVal?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    if (loading || values.length === 0) return;
    let alive = true;
    getChart().then(Chart => {
      if (!alive || !canvasRef.current) return;
      chartRef.current?.destroy();
      chartRef.current = new Chart(canvasRef.current, {
        type: "bar",
        data: {
          labels,
          datasets: [{ data: values, backgroundColor: colors.map(c => c + "CC"), borderColor: colors, borderWidth: 1.5, borderRadius: 3 }],
        },
        options: {
          indexAxis: "y", responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx: any) => ` ${ctx.raw}` } } },
          scales: {
            x: { max: maxVal, grid: { color: surface.border + "44" }, ticks: { color: surface.muted, font: { size: 10 } } },
            y: { grid: { display: false }, ticks: { color: surface.text, font: { size: 11 } } },
          },
          animation: { duration: 500 },
        },
      });
    });
    return () => { alive = false; chartRef.current?.destroy(); };
  }, [labels.join(), values.join(), loading]);

  return (
    <div style={{ padding: "20px", background: surface.surface, border: `1px solid ${surface.border}`, borderRadius: 2, height: "100%" }}>
      <p style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 800, color: surface.text }}>{title}</p>
      {loading
        ? <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{[1,2,3,4].map(i => <Skeleton key={i} w="100%" h={22} />)}</div>
        : values.length === 0
          ? <div style={{ textAlign: "center", padding: "24px 0" }}><p style={{ fontSize: 12, color: surface.muted }}>No data yet</p></div>
          : <div style={{ height: Math.max(values.length * 36 + 24, 100) }}><canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} /></div>
      }
    </div>
  );
}

// ─── LINE / AREA CHART ────────────────────────────────────────────────────────
function LineAreaChart({ title, labels, datasets, surface, loading }: {
  title: string;
  labels: string[];
  datasets: { label: string; data: number[]; color: string }[];
  surface: any; loading?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    if (loading || labels.length === 0) return;
    let alive = true;
    getChart().then(Chart => {
      if (!alive || !canvasRef.current) return;
      chartRef.current?.destroy();
      chartRef.current = new Chart(canvasRef.current, {
        type: "line",
        data: {
          labels,
          datasets: datasets.map(ds => ({
            label: ds.label,
            data: ds.data,
            borderColor: ds.color,
            backgroundColor: ds.color + "18",
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: ds.color,
            borderWidth: 2,
          })),
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { display: true, position: "top", labels: { color: surface.muted, font: { size: 11 }, boxWidth: 12 } },
            tooltip: { mode: "index", intersect: false },
          },
          scales: {
            x: { grid: { color: surface.border + "33" }, ticks: { color: surface.muted, font: { size: 10 } } },
            y: { grid: { color: surface.border + "33" }, ticks: { color: surface.muted, font: { size: 10 } } },
          },
          animation: { duration: 700 },
        },
      });
    });
    return () => { alive = false; chartRef.current?.destroy(); };
  }, [labels.join(), loading]);

  return (
    <div style={{ padding: "20px", background: surface.surface, border: `1px solid ${surface.border}`, borderRadius: 2 }}>
      <p style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 800, color: surface.text }}>{title}</p>
      {loading
        ? <Skeleton w="100%" h={180} />
        : labels.length < 2
          ? <div style={{ textAlign: "center", padding: "32px 0" }}><p style={{ fontSize: 12, color: surface.muted }}>Not enough data yet</p></div>
          : <div style={{ height: 200 }}><canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} /></div>
      }
    </div>
  );
}

// ─── RADAR CHART ─────────────────────────────────────────────────────────────
function RadarChartWidget({ title, labels, values, color, surface, loading }: {
  title: string; labels: string[]; values: number[]; color: string; surface: any; loading?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    if (loading || values.length === 0) return;
    let alive = true;
    getChart().then(Chart => {
      if (!alive || !canvasRef.current) return;
      chartRef.current?.destroy();
      chartRef.current = new Chart(canvasRef.current, {
        type: "radar",
        data: {
          labels,
          datasets: [{
            data: values,
            backgroundColor: color + "22",
            borderColor: color,
            borderWidth: 2,
            pointBackgroundColor: color,
            pointRadius: 4,
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: true,
          plugins: { legend: { display: false } },
          scales: {
            r: {
              max: 100, min: 0,
              ticks: { stepSize: 25, color: surface.muted, font: { size: 9 } },
              grid: { color: surface.border + "55" },
              pointLabels: { color: surface.text, font: { size: 10, weight: "bold" } },
            },
          },
          animation: { duration: 600 },
        },
      });
    });
    return () => { alive = false; chartRef.current?.destroy(); };
  }, [values.join(), loading]);

  return (
    <div style={{ padding: "20px", background: surface.surface, border: `1px solid ${surface.border}`, borderRadius: 2 }}>
      <p style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 800, color: surface.text }}>{title}</p>
      {loading
        ? <Skeleton w="100%" h={200} radius={8} />
        : values.every(v => v === 0)
          ? <div style={{ textAlign: "center", padding: "32px 0" }}><p style={{ fontSize: 12, color: surface.muted }}>No data yet</p></div>
          : <div style={{ maxWidth: 240, margin: "0 auto" }}><canvas ref={canvasRef} /></div>
      }
    </div>
  );
}

// ─── SCORE BUCKET CHART ──────────────────────────────────────────────────────
// Anonymous — shows how many employees fall in each score range, no names
function ScoreBucketChart({ buckets, title, surface, loading }: {
  buckets: { diabetesRange: string; count: number; color: string }[];
  title: string; surface: any; loading?: boolean;
}) {
  const max = Math.max(...buckets.map(b => b.count), 1);
  return (
    <div style={{ padding: "20px", background: surface.surface, border: `1px solid ${surface.border}`, borderRadius: 2 }}>
      <p style={{ margin: "0 0 16px", fontSize: 13, fontWeight: 800, color: surface.text }}>{title}</p>
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[1,2,3,4,5].map(i => <Skeleton key={i} w="100%" h={28} />)}
        </div>
      ) : buckets.every(b => b.count === 0) ? (
        <div style={{ textAlign: "center", padding: "24px 0" }}>
          <p style={{ margin: 0, fontSize: 12, color: surface.muted }}>No data yet</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {buckets.map(b => (
            <div key={b.diabetesRange}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: surface.text, fontWeight: 600 }}>Score {b.diabetesRange}</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: b.color }}>{b.count} employees</span>
              </div>
              <div style={{ height: 8, background: surface.border, borderRadius: 4 }}>
                <motion.div
                  initial={{ width: 0 }} animate={{ width: `${(b.count / max) * 100}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  style={{ height: "100%", background: b.color, borderRadius: 4 }}
                />
              </div>
            </div>
          ))}
          <p style={{ margin: "8px 0 0", fontSize: 10, color: surface.muted, fontStyle: "italic" }}>
            Anonymous distribution — individual scores are not visible to employers
          </p>
        </div>
      )}
    </div>
  );
}

// ─── PDF / CSV EXPORT ────────────────────────────────────────────────────────
function buildCSV(company: Company | null, analytics: Analytics): string {
  const rows: string[][] = [];
  rows.push(["HMEX Workforce Health Report"]);
  rows.push(["Company", company?.name || "—"]);
  rows.push(["Industry", company?.industry || "—"]);
  rows.push(["Generated", new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })]);
  rows.push([]);
  rows.push(["SUMMARY"]);
  rows.push(["Total Employees", String(analytics.total)]);
  rows.push(["Active Members", String(analytics.active)]);
  rows.push(["Assessments Completed", String(analytics.assessed)]);
  rows.push(["Assessment Rate", `${analytics.assessmentRate}%`]);
  rows.push(["Avg Diabetes Score", String(analytics.avgDiabetesScore)]);
  rows.push(["Avg Hypertension Score", String(analytics.avgHypertensionScore)]);
  rows.push(["High Risk Count", String(analytics.highRiskCount)]);
  rows.push([]);
  rows.push(["DIABETES RISK DISTRIBUTION"]);
  rows.push(["Low", String(analytics.diabetes.low)]);
  rows.push(["Medium", String(analytics.diabetes.medium)]);
  rows.push(["High", String(analytics.diabetes.high)]);
  rows.push(["Not Assessed", String(analytics.diabetes.none)]);
  rows.push([]);
  rows.push(["HYPERTENSION RISK DISTRIBUTION"]);
  rows.push(["Low", String(analytics.hypertension.low)]);
  rows.push(["Medium", String(analytics.hypertension.medium)]);
  rows.push(["High", String(analytics.hypertension.high)]);
  rows.push(["Not Assessed", String(analytics.hypertension.none)]);
  rows.push([]);
  rows.push(["DIABETES SCORE DISTRIBUTION (ANONYMOUS)"]);
  rows.push(["Score Range", "Employees"]);
  analytics.scoreBuckets.forEach(b => rows.push([`Score ${b.diabetesRange}`, String(b.count)]));
  rows.push([]);
  rows.push(["NOTE: Individual employee health data is not included in this export to protect employee privacy."]);
  return rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
}

function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function printReport(company: Company | null, analytics: Analytics) {
  const w = window.open("", "_blank");
  if (!w) return;
  const ts = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  w.document.write(`<!DOCTYPE html><html><head><title>HMEX Health Report — ${company?.name}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', sans-serif; font-size: 13px; color: #0f172a; padding: 40px; background: #fff; }
  h1 { font-size: 22px; font-weight: 900; margin-bottom: 4px; }
  h2 { font-size: 14px; font-weight: 800; margin: 28px 0 12px; text-transform: uppercase; letter-spacing: 0.06em; color: #64748b; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
  .meta { font-size: 11px; color: #64748b; margin-bottom: 28px; }
  .grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin-bottom: 24px; }
  .card { padding: 14px 16px; border: 1px solid #e2e8f0; border-radius: 4px; }
  .card-val { font-size: 24px; font-weight: 900; }
  .card-lbl { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { text-align: left; padding: 8px 10px; background: #f8fafc; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: #64748b; border-bottom: 1px solid #e2e8f0; }
  td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; }
  .badge { display: inline-block; padding: 2px 7px; border-radius: 3px; font-size: 10px; font-weight: 700; }
  .low { background: rgba(16,185,129,0.12); color: #10B981; }
  .medium { background: rgba(245,158,11,0.12); color: #F59E0B; }
  .high { background: rgba(239,68,68,0.12); color: #EF4444; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between; }
  @media print { body { padding: 20px; } }
</style></head><body>
<h1>Workforce Health Report</h1>
<p class="meta">${company?.name || "—"} &nbsp;·&nbsp; ${company?.industry || "—"} &nbsp;·&nbsp; Generated ${ts}</p>
<h2>Summary</h2>
<div class="grid">
  <div class="card"><div class="card-lbl">Total Employees</div><div class="card-val">${analytics.total}</div></div>
  <div class="card"><div class="card-lbl">Active Members</div><div class="card-val">${analytics.active}</div></div>
  <div class="card"><div class="card-lbl">Assessments</div><div class="card-val">${analytics.assessed}</div></div>
  <div class="card"><div class="card-lbl">Assessment Rate</div><div class="card-val">${analytics.assessmentRate}%</div></div>
  <div class="card"><div class="card-lbl">Avg Diabetes Score</div><div class="card-val">${analytics.avgDiabetesScore}</div></div>
  <div class="card"><div class="card-lbl">Avg Hypertension Score</div><div class="card-val">${analytics.avgHypertensionScore}</div></div>
  <div class="card"><div class="card-lbl">High Risk Count</div><div class="card-val" style="color:#EF4444">${analytics.highRiskCount}</div></div>
  <div class="card"><div class="card-lbl">Pending Invites</div><div class="card-val">${analytics.pending}</div></div>
</div>
<h2>Diabetes Risk Distribution</h2>
<table><tr><th>Level</th><th>Count</th><th>%</th></tr>
  <tr><td><span class="badge low">Low</span></td><td>${analytics.diabetes.low}</td><td>${analytics.assessed ? Math.round(analytics.diabetes.low/analytics.assessed*100) : 0}%</td></tr>
  <tr><td><span class="badge medium">Medium</span></td><td>${analytics.diabetes.medium}</td><td>${analytics.assessed ? Math.round(analytics.diabetes.medium/analytics.assessed*100) : 0}%</td></tr>
  <tr><td><span class="badge high">High</span></td><td>${analytics.diabetes.high}</td><td>${analytics.assessed ? Math.round(analytics.diabetes.high/analytics.assessed*100) : 0}%</td></tr>
</table>
<h2>Hypertension Risk Distribution</h2>
<table><tr><th>Level</th><th>Count</th><th>%</th></tr>
  <tr><td><span class="badge low">Low</span></td><td>${analytics.hypertension.low}</td><td>${analytics.assessed ? Math.round(analytics.hypertension.low/analytics.assessed*100) : 0}%</td></tr>
  <tr><td><span class="badge medium">Medium</span></td><td>${analytics.hypertension.medium}</td><td>${analytics.assessed ? Math.round(analytics.hypertension.medium/analytics.assessed*100) : 0}%</td></tr>
  <tr><td><span class="badge high">High</span></td><td>${analytics.hypertension.high}</td><td>${analytics.assessed ? Math.round(analytics.hypertension.high/analytics.assessed*100) : 0}%</td></tr>
</table>
<div class="footer"><span>HMEX Workforce Health Platform</span><span>Confidential — For Internal Use Only</span></div>
</body></html>`);
  w.document.close();
  w.focus();
  setTimeout(() => { w.print(); }, 400);
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function EmployerReportsPage() {
  const { user } = useAuth();
  const { isDark, surface, accentColor } = useTheme();

  const [company, setCompany] = useState<Company | null>(null);
  const [members, setMembers] = useState<MemberWithRisk[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingRisks, setLoadingRisks] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  const c = surface;

  const load = useCallback(async (uid: string) => {
    setLoading(true);
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
      if (!co) { setLoading(false); return; }

      const rows = await getCompanyMembers(co.$id).catch(() => []);
      setLoading(false);

      // Fetch assessments for active members
      const active = rows.filter(m => m.status === "active" && m.userId);
      if (active.length > 0) {
        setLoadingRisks(true);
        const withRisks: MemberWithRisk[] = await Promise.all(
          rows.map(async (m): Promise<MemberWithRisk> => {
            if (m.status !== "active" || !m.userId) return { ...m, assessment: null };
            const a = await fetchLatestAssessment(m.userId).catch(() => null);
            return { ...m, assessment: a };
          })
        );
        setMembers(withRisks);
        setAnalytics(computeAnalytics(withRisks));
        setLoadingRisks(false);
      } else {
        const plain = rows.map(m => ({ ...m, assessment: null }));
        setMembers(plain);
        setAnalytics(computeAnalytics(plain));
      }
    } catch (e) {
      console.error("[Reports] load error:", e);
      setLoading(false);
    } finally {
      setLastRefreshed(new Date());
    }
  }, []);

  useEffect(() => { if (user) load(user.id); }, [user]);

  // Build chart data from analytics
  const a = analytics;

  const joinedLabels = a ? Object.keys(a.joinedByMonth).slice(-6) : [];
  const joinedValues = a ? joinedLabels.map(k => a.joinedByMonth[k]) : [];

  // Anonymous score distribution — no individual names
  const scoreBuckets = a?.scoreBuckets ?? [];

  const gLabels = a ? Object.keys(a.genderBreakdown) : [];
  const gValues = a ? gLabels.map(k => a.genderBreakdown[k]) : [];

  const ageLabels = a ? Object.keys(a.ageBreakdown) : [];
  const ageValues = a ? ageLabels.map(k => a.ageBreakdown[k]) : [];

  // Radar data: overall risk spread
  const radarLabels = ["Low Diab", "Med Diab", "High Diab", "Low BP", "Med BP", "High BP"];
  const radarValues = a ? [
    a.assessed ? Math.round(a.diabetes.low    / a.assessed * 100) : 0,
    a.assessed ? Math.round(a.diabetes.medium / a.assessed * 100) : 0,
    a.assessed ? Math.round(a.diabetes.high   / a.assessed * 100) : 0,
    a.assessed ? Math.round(a.hypertension.low    / a.assessed * 100) : 0,
    a.assessed ? Math.round(a.hypertension.medium / a.assessed * 100) : 0,
    a.assessed ? Math.round(a.hypertension.high   / a.assessed * 100) : 0,
  ] : [0,0,0,0,0,0];

  const handleExportCSV = async () => {
    if (!analytics) return;
    setExporting(true);
    setExportMenuOpen(false);
    await new Promise(r => setTimeout(r, 400));
    const csv = buildCSV(company, analytics);
    downloadCSV(csv, `hmex-health-report-${company?.name?.replace(/\s+/g, "-") || "company"}-${new Date().toISOString().slice(0,10)}.csv`);
    setExporting(false);
  };

  const handlePrint = () => {
    if (!analytics) return;
    setExportMenuOpen(false);
    printReport(company, analytics);
  };

  const isLoading = loading || loadingRisks;

  return (
    <EmployerLayout>
      <div style={{ paddingBottom: 48 }} onClick={() => setExportMenuOpen(false)}>

        {/* ── Page Header ─────────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 32 }}>
          <div>
            <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 800, color: accentColor, letterSpacing: "0.12em", textTransform: "uppercase" }}>Analytics</p>
            <h1 style={{ margin: 0, fontSize: "clamp(1.35rem,3vw,1.7rem)", fontWeight: 900, color: c.text, letterSpacing: "-0.03em", lineHeight: 1.15 }}>
              Reports & Analytics
            </h1>
            {company && (
              <p style={{ margin: "4px 0 0", fontSize: 12, color: c.muted, display: "flex", alignItems: "center", gap: 5 }}>
                <Building2 size={12} />{company.name} · {company.industry || "Workforce Health"}
                {lastRefreshed && <span style={{ marginLeft: 6, fontSize: 10, opacity: 0.55 }}>· {lastRefreshed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>}
              </p>
            )}
          </div>

          {/* Export Button */}
          <div style={{ position: "relative" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button onClick={() => load(user!.id)}
                style={{ padding: "8px 12px", background: "transparent", border: `1px solid ${c.border}`, color: c.muted, borderRadius: 2, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600 }}>
                <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
                Refresh
              </button>

              <button onClick={() => setExportMenuOpen(v => !v)} disabled={exporting || !analytics}
                style={{ padding: "8px 16px", background: analytics ? accentColor : c.border, border: "none", color: analytics ? "white" : c.muted, borderRadius: 2, cursor: analytics ? "pointer" : "not-allowed", display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700 }}>
                {exporting ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                Export
                <ChevronDown size={12} />
              </button>
            </div>

            <AnimatePresence>
              {exportMenuOpen && (
                <motion.div initial={{ opacity: 0, y: 6, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 4, scale: 0.96 }} transition={{ duration: 0.15 }}
                  style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", zIndex: 50, background: c.surface, border: `1px solid ${c.border}`, borderRadius: 2, overflow: "hidden", minWidth: 180, boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}>
                  <button onClick={handleExportCSV}
                    style={{ width: "100%", padding: "10px 16px", background: "none", border: "none", textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 600, color: c.text }}
                    onMouseEnter={e => (e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                    <FileSpreadsheet size={14} color={accentColor} />
                    Download CSV
                  </button>
                  <button onClick={handlePrint}
                    style={{ width: "100%", padding: "10px 16px", background: "none", border: "none", textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 600, color: c.text }}
                    onMouseEnter={e => (e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                    <Printer size={14} color={accentColor} />
                    Print / Save PDF
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* ── Stat Cards ──────────────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginBottom: 28 }}>
          <StatCard icon={<Users size={16} />}       label="Total Employees"  value={fmt(a?.total ?? 0)}           sub={`${a?.pending ?? 0} pending`}             color={accentColor}  loading={loading} />
          <StatCard icon={<CheckCircle size={16} />} label="Active Members"   value={fmt(a?.active ?? 0)}          sub="joined your plan"                         color="#10B981"      loading={loading} />
          <StatCard icon={<Activity size={16} />}    label="Assessed"         value={`${a?.assessmentRate ?? 0}%`} sub={`${a?.assessed ?? 0} completed`}          color="#8B5CF6"      loading={loading} />
          <StatCard icon={<Heart size={16} />}       label="Avg Diabetes"     value={a?.avgDiabetesScore ?? "—"}   sub="avg risk score"                           color="#F59E0B"      loading={isLoading} />
          <StatCard icon={<TrendingUp size={16} />}  label="Avg Hypertension" value={a?.avgHypertensionScore ?? "—"} sub="avg risk score"                         color="#EF4444"      loading={isLoading} />
          <StatCard icon={<AlertCircle size={16} />} label="High Risk"        value={fmt(a?.highRiskCount ?? 0)}   sub="need attention"                           color="#EF4444"      loading={isLoading} />
        </div>

        {/* ── No data state ───────────────────────────────────────────────── */}
        {!loading && a && a.active === 0 && (
          <div style={{ padding: "48px 24px", textAlign: "center", background: c.surface, border: `1px solid ${c.border}`, borderRadius: 2, marginBottom: 28 }}>
            <BarChart3 size={32} style={{ color: c.muted, opacity: 0.3, marginBottom: 12 }} />
            <p style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700, color: c.text }}>No employee data yet</p>
            <p style={{ margin: 0, fontSize: 12, color: c.muted }}>Invite your team to start seeing analytics here.</p>
          </div>
        )}

        {/* ── Row 1: Donuts + Line chart ─────────────────────────────────── */}
        {(!loading || isLoading) && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14, marginBottom: 14 }}>
              <DonutChartWidget
                title="Diabetes Risk Distribution"
                data={[
                  { label: "Low", value: a?.diabetes.low ?? 0 },
                  { label: "Medium", value: a?.diabetes.medium ?? 0 },
                  { label: "High", value: a?.diabetes.high ?? 0 },
                  { label: "Not Assessed", value: a?.diabetes.none ?? 0 },
                ]}
                colors={["#10B981", "#F59E0B", "#EF4444", "rgba(148,163,184,0.3)"]}
                surface={c} loading={isLoading}
              />
              <DonutChartWidget
                title="Hypertension Risk Distribution"
                data={[
                  { label: "Low", value: a?.hypertension.low ?? 0 },
                  { label: "Medium", value: a?.hypertension.medium ?? 0 },
                  { label: "High", value: a?.hypertension.high ?? 0 },
                  { label: "Not Assessed", value: a?.hypertension.none ?? 0 },
                ]}
                colors={["#10B981", "#F59E0B", "#EF4444", "rgba(148,163,184,0.3)"]}
                surface={c} loading={isLoading}
              />
              <RadarChartWidget
                title="Risk Profile Overview"
                labels={radarLabels}
                values={radarValues}
                color={accentColor}
                surface={c}
                loading={isLoading}
              />
            </div>

            {/* ── Row 2: Employee growth + score distribution ────────────── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 14, marginBottom: 14 }}>
              <LineAreaChart
                title="Employee Onboarding Timeline"
                labels={joinedLabels}
                datasets={[{ label: "New Members", data: joinedValues, color: accentColor }]}
                surface={c}
                loading={loading}
              />
              <ScoreBucketChart
                title="Diabetes Score Distribution (Anonymous)"
                buckets={scoreBuckets}
                surface={c}
                loading={isLoading}
              />
            </div>

            {/* ── Row 3: Gender + Age ────────────────────────────────────── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 14, marginBottom: 28 }}>
              <DonutChartWidget
                title="Gender Distribution"
                data={gLabels.map((l, i) => ({ label: capitalize(l), value: gValues[i] }))}
                colors={["#6366F1", "#EC4899", "#10B981", "#F59E0B", "#94A3B8"]}
                surface={c}
                loading={isLoading}
              />
              <HBarChart
                title="Age Category Breakdown"
                labels={ageLabels.map(capitalize)}
                values={ageValues}
                colors={ageLabels.map((_, i) => ["#6366F1","#0EA5E9","#10B981","#F59E0B","#EF4444"][i % 5])}
                surface={c}
                loading={isLoading}
                maxVal={Math.max(...ageValues, 1)}
              />
            </div>

            {/* ── Report summary card ───────────────────────────────────── */}
            {a && !isLoading && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                style={{ padding: "20px 24px", background: isDark ? `${accentColor}0A` : `${accentColor}06`, border: `1px solid ${accentColor}22`, borderRadius: 2, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, flexWrap: "wrap", marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 42, height: 42, background: `${accentColor}18`, borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <FileText size={18} style={{ color: accentColor }} />
                  </div>
                  <div>
                    <p style={{ margin: "0 0 3px", fontSize: 14, fontWeight: 800, color: c.text }}>Workforce Health Summary</p>
                    <p style={{ margin: 0, fontSize: 11, color: c.muted, lineHeight: 1.5 }}>
                      {a.assessed}/{a.active} active members assessed &nbsp;·&nbsp;
                      {a.diabetes.high + a.hypertension.high} high-risk &nbsp;·&nbsp;
                      Avg diabetes score: {a.avgDiabetesScore} &nbsp;·&nbsp;
                      Avg BP score: {a.avgHypertensionScore}
                      {a.assessmentRate < 60 && <span style={{ color: "#F59E0B", marginLeft: 8, fontWeight: 700 }}>⚠ Low assessment rate</span>}
                      {a.highRiskCount > 0 && <span style={{ color: "#EF4444", marginLeft: 8, fontWeight: 700 }}>· {a.highRiskCount} need follow-up</span>}
                    </p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={handlePrint}
                    style={{ padding: "9px 16px", background: "transparent", border: `1px solid ${accentColor}40`, color: accentColor, borderRadius: 2, cursor: "pointer", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                    <Printer size={13} />Print PDF
                  </button>
                  <button onClick={handleExportCSV}
                    style={{ padding: "9px 16px", background: accentColor, border: "none", color: "white", borderRadius: 2, cursor: "pointer", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                    <Download size={13} />Export CSV
                  </button>
                </div>
              </motion.div>
            )}
          </>
        )}

        <ThemeToggle />
      </div>
    </EmployerLayout>
  );
}