/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

/**
 * /app/dashboard/review/page.tsx
 *
 * Includes beautiful print/PDF styling — properly hides the dashboard shell
 * and renders a polished, well-structured medical report.
 */

import React, { useState, useEffect, useRef } from "react";
import {
  ChevronDown, Printer, Download, Copy, CheckCircle,
  AlertTriangle, AlertCircle, ShieldCheck,
  Heart, Activity, FileText, Zap, Star,
  ClipboardList, Lightbulb, Siren, ArrowUpRight, BarChart3, Info,
} from "lucide-react";
import {
  fetchUserAssessments,
  parseStoredAssessment,
  type StoredAssessment,
} from "@/services/AppwriteService";
import type { DualRiskAssessment } from "@/services/GroqService";
import { useTheme } from "@/contexts/ThemeContext";
import { useRequireAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

// ─── RISK CONFIG ──────────────────────────────────────────────────────────────
type RiskLevel = "low" | "slightly-elevated" | "moderate" | "high" | "very-high";
const RISK_CONFIG: Record<RiskLevel, { label: string; color: string; bg: string; printColor: string; icon: React.ElementType; gauge: number }> = {
  "low":              { label: "Low Risk",              color: "#10b981", bg: "rgba(16,185,129,0.12)",  printColor: "#059669", icon: ShieldCheck,   gauge: 15 },
  "slightly-elevated":{ label: "Slightly Elevated",     color: "#84cc16", bg: "rgba(132,204,22,0.12)",  printColor: "#65a30d", icon: AlertTriangle, gauge: 30 },
  "moderate":         { label: "Moderate Risk",         color: "#f59e0b", bg: "rgba(245,158,11,0.12)",  printColor: "#d97706", icon: AlertTriangle, gauge: 50 },
  "high":             { label: "High Risk",             color: "#ef4444", bg: "rgba(239,68,68,0.12)",   printColor: "#dc2626", icon: AlertCircle,   gauge: 75 },
  "very-high":        { label: "Very High Risk",        color: "#dc2626", bg: "rgba(220,38,38,0.14)",   printColor: "#b91c1c", icon: AlertCircle,   gauge: 92 },
};
function riskCfg(level: string) {
  return RISK_CONFIG[level as RiskLevel] ?? RISK_CONFIG["low"];
}

// ─── ARC GAUGE ────────────────────────────────────────────────────────────────
function RiskGauge({ level, score, pct, label, isDark }: {
  level: string; score: number; pct: string; label: string; isDark: boolean;
}) {
  const cfg = riskCfg(level);
  const Icon = cfg.icon;
  const fillLen = (cfg.gauge / 100) * 188.5;
  return (
    <div className="risk-gauge-card flex flex-col items-center gap-3 p-6 rounded-2xl border"
      style={{ background: isDark ? "#111827" : "#ffffff", borderColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)" }}>
      <div style={{ position: "relative", width: 140, height: 80 }}>
        <svg viewBox="0 0 140 80" width="140" height="80">
          <path d="M 10 70 A 60 60 0 0 1 130 70" fill="none"
            stroke={isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"} strokeWidth="10" strokeLinecap="round" />
          <path d="M 10 70 A 60 60 0 0 1 130 70" fill="none"
            stroke={cfg.color} strokeWidth="10" strokeLinecap="round"
            strokeDasharray="188.5" strokeDashoffset={188.5 - fillLen}
            style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)" }} />
          {[0, 45, 90, 135, 180].map((deg, i) => {
            const rad = (deg - 180) * (Math.PI / 180);
            const x1 = 70 + 52 * Math.cos(rad), y1 = 70 + 52 * Math.sin(rad);
            const x2 = 70 + 63 * Math.cos(rad), y2 = 70 + 63 * Math.sin(rad);
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)"} strokeWidth="1.5" />;
          })}
        </svg>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, textAlign: "center" }}>
          <span style={{ fontSize: 28, fontWeight: 900, color: cfg.color, letterSpacing: "-0.03em", lineHeight: 1 }}>{score}</span>
          <span style={{ fontSize: 11, color: isDark ? "#4a5568" : "#94a3b8", display: "block", fontWeight: 600 }}>pts</span>
        </div>
      </div>
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold" style={{ background: cfg.bg, color: cfg.color }}>
        <Icon size={12} strokeWidth={2.2} />{cfg.label}
      </div>
      <div className="text-center">
        <p className="text-[13px] font-black" style={{ color: isDark ? "#f9fafb" : "#0f172a" }}>{label}</p>
        <p className="text-xs mt-0.5" style={{ color: isDark ? "#4a5568" : "#94a3b8" }}>Lifetime risk: {pct}</p>
      </div>
    </div>
  );
}

// ─── ASSESSMENT PICKER ────────────────────────────────────────────────────────
function AssessmentPicker({ assessments, selected, onSelect, isDark }: {
  assessments: StoredAssessment[];
  selected: StoredAssessment | null;
  onSelect: (a: StoredAssessment) => void;
  isDark: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const border = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
  const bg = isDark ? "#111827" : "#fff";
  const muted = isDark ? "#8b95a8" : "#64748b";
  const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    if (open) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(v => !v)}
        className="flex items-center gap-3 px-4 py-3 rounded-xl border"
        style={{ background: bg, borderColor: border, minWidth: 260 }}>
        {selected ? (
          <div className="flex-1 text-left">
            <p className="text-[13px] font-bold" style={{ color: isDark ? "#f9fafb" : "#0f172a" }}>
              Assessment #{selected.assessmentNumber ?? 1}
              {selected.isRetake && (
                <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded"
                  style={{ background: "rgba(139,92,246,0.15)", color: "#8b5cf6" }}>Retake</span>
              )}
            </p>
            <p className="text-[11px]" style={{ color: muted }}>{fmt(selected.$createdAt)}</p>
          </div>
        ) : (
          <p className="text-[13px] flex-1 text-left" style={{ color: muted }}>Select assessment…</p>
        )}
        <ChevronDown size={15} style={{ color: muted, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
      </button>
      {open && (
        <div className="absolute top-full mt-1.5 left-0 right-0 z-50 rounded-xl border py-1"
          style={{ background: bg, borderColor: border, boxShadow: isDark ? "0 8px 32px rgba(0,0,0,0.55)" : "0 8px 32px rgba(0,0,0,0.12)", animation: "ddIn 0.12s ease" }}>
          {assessments.map(a => (
            <button key={a.$id} onClick={() => { onSelect(a); setOpen(false); }}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-left"
              style={{ background: selected?.$id === a.$id ? (isDark ? "rgba(15,187,125,0.1)" : "rgba(15,187,125,0.07)") : "transparent" }}
              onMouseEnter={e => { if (selected?.$id !== a.$id) (e.currentTarget as HTMLElement).style.background = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)"; }}
              onMouseLeave={e => { if (selected?.$id !== a.$id) (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
              <div className="flex items-center justify-center w-8 h-8 rounded-lg text-xs font-black"
                style={{ background: isDark ? "rgba(15,187,125,0.12)" : "rgba(15,187,125,0.08)", color: "#0fbb7d" }}>
                #{a.assessmentNumber ?? 1}
              </div>
              <div className="flex-1">
                <p className="text-[12px] font-semibold" style={{ color: isDark ? "#e2e8f0" : "#0f172a" }}>
                  {a.isRetake ? "Retake" : "Initial Assessment"} · {fmt(a.$createdAt)}
                </p>
                <p className="text-[10px]" style={{ color: muted }}>
                  Diabetes: {a.diabetesLevel} · HTN: {a.hypertensionLevel}
                  {a.xpEarned ? ` · ${a.xpEarned} XP` : ""}
                </p>
              </div>
              {selected?.$id === a.$id && <CheckCircle size={14} style={{ color: "#0fbb7d" }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── SECTION ─────────────────────────────────────────────────────────────────
function Section({ icon: Icon, title, color = "#0fbb7d", isDark, children }: {
  icon: React.ElementType; title: string; color?: string; isDark: boolean; children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border p-6 space-y-4"
      style={{ background: isDark ? "#111827" : "#ffffff", borderColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)" }}>
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl" style={{ background: `${color}18`, color }}>
          <Icon size={17} strokeWidth={2} />
        </div>
        <h3 className="text-[15px] font-black" style={{ color: isDark ? "#f9fafb" : "#0f172a", letterSpacing: "-0.02em" }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function DashboardReviewPage() {
  const { isDark } = useTheme();
  const auth = useRequireAuth();

  const [assessments, setAssessments] = useState<StoredAssessment[]>([]);
  const [selected, setSelected]       = useState<StoredAssessment | null>(null);
  const [report, setReport]           = useState<DualRiskAssessment | null>(null);
  const [loading, setLoading]         = useState(true);
  const [copied, setCopied]           = useState(false);

  const C = {
    card:   isDark ? "#111827" : "#ffffff",
    border: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)",
    text:   isDark ? "#f9fafb" : "#0f172a",
    muted:  isDark ? "#8b95a8" : "#64748b",
  };

  useEffect(() => {
    const uid = auth.user?.id;
    if (!uid) return;
    (async () => {
      try {
        const all = await fetchUserAssessments(uid);
        setAssessments(all);
        try { sessionStorage.removeItem("hmex_review"); } catch { /* */ }
        if (all.length > 0) {
          setSelected(all[0]);
          setReport(parseStoredAssessment(all[0]));
        }
      } catch (e) {
        console.error("[Review] fetch error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [auth.user?.id]);

  const handleSelect = (a: StoredAssessment) => {
    setSelected(a);
    setReport(parseStoredAssessment(a));
  };

  const handleCopy = async () => {
    if (!report || !selected) return;
    const lines = [
      "HealthMex Risk Assessment Report",
      `Date: ${new Date(selected.$createdAt).toLocaleDateString()}`,
      "",
      `DIABETES RISK: ${report.diabetesRisk.level.toUpperCase()} (${report.diabetesRisk.percentage})`,
      `HYPERTENSION RISK: ${report.hypertensionRisk.level.toUpperCase()} (${report.hypertensionRisk.percentage})`,
      "",
      "SUMMARY", report.summary,
      "",
      "KEY FINDINGS",
      ...(report.keyFindings ?? []).map((f, i) => `${i + 1}. ${f}`),
      "",
      "RECOMMENDATIONS",
      ...(report.recommendations ?? []).map((r, i) => `${i + 1}. ${r}`),
    ];
    await navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  const dCfg = report ? riskCfg(report.diabetesRisk.level) : null;
  const hCfg = report ? riskCfg(report.hypertensionRisk.level) : null;

  // ── LOADING ────────────────────────────────────────────────────────────────
  if (auth.loading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="relative inline-flex">
              <div className="w-12 h-12 rounded-full border-4 animate-spin"
                style={{ borderColor: "transparent", borderTopColor: "#0fbb7d", borderRightColor: "rgba(15,187,125,0.3)" }} />
              <Heart className="absolute inset-0 m-auto w-4 h-4" style={{ color: "#0fbb7d" }} />
            </div>
            <p className="text-sm" style={{ color: C.muted }}>Loading your assessments…</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── EMPTY ──────────────────────────────────────────────────────────────────
  if (!assessments.length) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-5 max-w-sm">
            <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-2xl"
              style={{ background: "rgba(15,187,125,0.1)", color: "#0fbb7d" }}>
              <ClipboardList size={28} strokeWidth={1.5} />
            </div>
            <h2 className="text-xl font-black" style={{ color: C.text }}>No assessments yet</h2>
            <p className="text-sm" style={{ color: C.muted }}>
              Complete your first health risk assessment to see your personalised report.
            </p>
            <a href="/dashboard/assessment"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white"
              style={{ background: "linear-gradient(135deg,#0fbb7d,#059669)", boxShadow: "0 4px 16px rgba(15,187,125,0.3)" }}>
              <Activity size={15} />Start Assessment
            </a>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── MAIN ──────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>

      {/* ── PRINT STYLES ─────────────────────────────────────────────────── */}
      <style jsx global>{`
        @keyframes ddIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── Print / Save as PDF ─────────────────────────── */
        @media print {
          /* Force white background, no color-scheme weirdness */
          html, body {
            background: #ffffff !important;
            color: #0f172a !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }

          /* Hide EVERYTHING by default */
          body * { visibility: hidden !important; }

          /* Then show only the print container and its children */
          #hmex-print-root,
          #hmex-print-root * { visibility: visible !important; }

          /* Position the print root to fill the page */
          #hmex-print-root {
            position: absolute !important;
            inset: 0 !important;
            padding: 32px 40px !important;
            background: #ffffff !important;
          }

          /* Hide UI controls */
          .no-print { display: none !important; }

          /* Reset card backgrounds to white */
          #hmex-print-root .rounded-2xl {
            background: #ffffff !important;
            border-color: #e2e8f0 !important;
            box-shadow: none !important;
          }

          /* Keep risk gauge card backgrounds slightly tinted */
          #hmex-print-root .risk-gauge-card {
            border: 1.5px solid #e2e8f0 !important;
          }

          /* Typography resets */
          #hmex-print-root * {
            color: inherit !important;
          }

          /* Page breaks */
          #hmex-print-root .page-break-before { page-break-before: always !important; }
          #hmex-print-root .avoid-break { page-break-inside: avoid !important; }

          /* Ensure SVGs render */
          #hmex-print-root svg { overflow: visible !important; }
        }
      `}</style>

      {/* ── SCREEN UI (hidden in print) ──────────────────────────────────── */}
      <div className="max-w-4xl mx-auto pb-12 space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
          <div>
            <h1 className="text-2xl font-black" style={{ color: C.text, letterSpacing: "-0.03em" }}>Health Risk Report</h1>
            <p className="text-sm mt-0.5" style={{ color: C.muted }}>
              {assessments.length} assessment{assessments.length !== 1 ? "s" : ""} on record
            </p>
          </div>
          <AssessmentPicker assessments={assessments} selected={selected} onSelect={handleSelect} isDark={isDark} />
        </div>

        {/* Action buttons */}
        {report && selected && (
          <div className="flex items-center gap-2 flex-wrap no-print">
            <button onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: C.card, borderColor: C.border, color: C.text }}>
              <Printer size={14} />Print / Save PDF
            </button>
            <button onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: copied ? "rgba(15,187,125,0.1)" : C.card, borderColor: copied ? "#0fbb7d" : C.border, color: copied ? "#0fbb7d" : C.text }}>
              {copied ? <><CheckCircle size={14} />Copied!</> : <><Copy size={14} />Copy Summary</>}
            </button>
          </div>
        )}

        {/* ── SCREEN CONTENT (also serves as print source via #hmex-print-root) */}
        {report && selected && (
          <>
            {/* Report banner */}
            <div className="flex items-center justify-between px-6 py-4 rounded-2xl border"
              style={{ background: isDark ? "linear-gradient(135deg,#111827,#0f172a)" : "linear-gradient(135deg,#f0fdf4,#ecfdf5)", borderColor: C.border }}>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl"
                  style={{ background: "linear-gradient(135deg,#0fbb7d,#059669)", boxShadow: "0 4px 14px rgba(15,187,125,0.3)" }}>
                  <Heart size={18} color="#fff" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-[15px] font-black" style={{ color: C.text, letterSpacing: "-0.02em" }}>HealthMex</p>
                  <p className="text-[10px] font-bold uppercase" style={{ color: C.muted, letterSpacing: "0.1em" }}>Risk Screening Report</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[12px] font-semibold" style={{ color: C.text }}>
                  Assessment #{selected.assessmentNumber ?? 1}
                  {selected.isRetake && (
                    <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded"
                      style={{ background: "rgba(139,92,246,0.15)", color: "#8b5cf6" }}>Retake</span>
                  )}
                </p>
                <p className="text-[11px]" style={{ color: C.muted }}>{fmt(selected.$createdAt)}</p>
                {selected.xpEarned > 0 && (
                  <p className="text-[11px] flex items-center gap-1 justify-end mt-0.5" style={{ color: "#f59e0b" }}>
                    <Zap size={10} fill="#f59e0b" strokeWidth={0} />{selected.xpEarned} XP
                  </p>
                )}
              </div>
            </div>

            {/* Risk gauges */}
            <div className="grid sm:grid-cols-2 gap-5 avoid-break">
              <RiskGauge level={report.diabetesRisk.level} score={report.diabetesRisk.score} pct={report.diabetesRisk.percentage} label="Diabetes Risk" isDark={isDark} />
              <RiskGauge level={report.hypertensionRisk.level} score={report.hypertensionRisk.score} pct={report.hypertensionRisk.percentage} label="Hypertension Risk" isDark={isDark} />
            </div>

            {/* Profile chips */}
            {(report.profile?.ageCategory || report.profile?.gender || report.profile?.bmiCategory) && (
              <div className="flex items-center gap-2 flex-wrap avoid-break">
                {[
                  { label: "Age", value: report.profile?.ageCategory },
                  { label: "Gender", value: report.profile?.gender },
                  { label: "BMI", value: report.profile?.bmiCategory },
                  { label: "Waist", value: report.profile?.waistCategory },
                ].filter(c => c.value).map(chip => (
                  <div key={chip.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                    style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)", color: C.muted, border: `1px solid ${C.border}` }}>
                    <span style={{ fontWeight: 700, color: isDark ? "#94a3b8" : "#374151" }}>{chip.label}:</span>{chip.value}
                  </div>
                ))}
              </div>
            )}

            {/* Summary */}
            <div className="avoid-break">
              <Section icon={FileText} title="Summary" isDark={isDark}>
                <p className="text-[14px] leading-relaxed" style={{ color: C.muted }}>{report.summary}</p>
              </Section>
            </div>

            {/* Urgent Actions */}
            {report.urgentActions && report.urgentActions.length > 0 && (
              <div className="rounded-2xl border p-6 space-y-4 avoid-break"
                style={{ background: "rgba(239,68,68,0.06)", borderColor: "rgba(239,68,68,0.25)" }}>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-xl"
                    style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444" }}>
                    <Siren size={17} strokeWidth={2} />
                  </div>
                  <h3 className="text-[15px] font-black" style={{ color: "#ef4444" }}>Urgent Actions Required</h3>
                </div>
                <ul className="space-y-3">
                  {report.urgentActions.map((action, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full shrink-0 mt-0.5 text-[11px] font-black"
                        style={{ background: "rgba(239,68,68,0.2)", color: "#ef4444" }}>{i + 1}</span>
                      <p className="text-[14px] leading-relaxed" style={{ color: "#ef4444" }}>{action}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Key Findings */}
            {report.keyFindings && report.keyFindings.length > 0 && (
              <div className="avoid-break">
                <Section icon={BarChart3} title="Key Findings" color="#8b5cf6" isDark={isDark}>
                  <ul className="space-y-3">
                    {report.keyFindings.map((f, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full shrink-0 mt-0.5 text-[11px] font-black"
                          style={{ background: "rgba(139,92,246,0.15)", color: "#8b5cf6" }}>{i + 1}</span>
                        <p className="text-[14px] leading-relaxed" style={{ color: C.muted }}>{f}</p>
                      </li>
                    ))}
                  </ul>
                </Section>
              </div>
            )}

            {/* Recommendations */}
            {report.recommendations && report.recommendations.length > 0 && (
              <div className="avoid-break">
                <Section icon={Lightbulb} title="Recommendations" color="#0fbb7d" isDark={isDark}>
                  <ul className="space-y-3">
                    {report.recommendations.map((r, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full shrink-0 mt-0.5"
                          style={{ background: "rgba(15,187,125,0.15)", color: "#0fbb7d" }}>
                          <CheckCircle size={13} strokeWidth={2.5} />
                        </div>
                        <p className="text-[14px] leading-relaxed" style={{ color: C.muted }}>{r}</p>
                      </li>
                    ))}
                  </ul>
                </Section>
              </div>
            )}

            {/* Detailed Analysis */}
            {report.detailedAnalysis && (
              <div className="avoid-break page-break-before">
                <Section icon={Activity} title="Detailed Analysis" color="#f59e0b" isDark={isDark}>
                  <p className="text-[14px] leading-relaxed whitespace-pre-line" style={{ color: C.muted }}>
                    {report.detailedAnalysis}
                  </p>
                </Section>
              </div>
            )}

            {/* XP callout */}
            {selected.xpEarned > 0 && (
              <div className="flex items-center gap-4 px-6 py-4 rounded-2xl border avoid-break"
                style={{ background: "linear-gradient(135deg,rgba(245,158,11,0.08),rgba(239,68,68,0.06))", borderColor: "rgba(245,158,11,0.25)" }}>
                <div className="flex items-center justify-center w-11 h-11 rounded-xl"
                  style={{ background: "linear-gradient(135deg,rgba(245,158,11,0.2),rgba(239,68,68,0.15))", color: "#f59e0b" }}>
                  <Star size={20} fill="#f59e0b" strokeWidth={0} />
                </div>
                <div>
                  <p className="text-[14px] font-black" style={{ color: isDark ? "#fbbf24" : "#d97706" }}>
                    {selected.xpEarned} XP earned this session
                  </p>
                  <p className="text-[12px]" style={{ color: C.muted }}>
                    Accumulate 300 XP to redeem a free expert consultation.
                  </p>
                </div>
                <ArrowUpRight size={18} style={{ color: "#f59e0b", marginLeft: "auto", flexShrink: 0 }} />
              </div>
            )}

            {/* Disclaimer */}
            <div className="flex items-start gap-3 px-5 py-4 rounded-xl avoid-break"
              style={{ background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)", border: `1px solid ${C.border}` }}>
              <Info size={14} className="shrink-0 mt-0.5" style={{ color: C.muted }} />
              <p className="text-[11px] leading-relaxed" style={{ color: C.muted }}>
                This report uses FINDRISC and Framingham-validated frameworks for educational purposes only.
                It is not a medical diagnosis. Always consult a qualified healthcare professional.
              </p>
            </div>
          </>
        )}
      </div>

      {/* ─── PRINT-ONLY BEAUTIFULLY STYLED DOCUMENT ─────────────────────────
          This node is invisible on screen but becomes the printed document.
          It's self-contained HTML with inline styles so nothing depends on
          Tailwind classes or the dark-mode theme context.
      ────────────────────────────────────────────────────────────────────── */}
      {report && selected && (
        <div id="hmex-print-root" style={{ display: "none" }}>
          <PrintReport report={report} selected={selected} />
        </div>
      )}
    </DashboardLayout>
  );
}

// ─── PRINT REPORT — fully self-contained, inline styles only ─────────────────
function PrintReport({ report, selected }: { report: DualRiskAssessment; selected: StoredAssessment }) {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  const dCfg = riskCfg(report.diabetesRisk.level);
  const hCfg = riskCfg(report.hypertensionRisk.level);

  const urgentActions: string[] = (() => { try { return JSON.parse((selected as any).urgentActions || "[]"); } catch { return report.urgentActions ?? []; } })();
  const keyFindings: string[]   = report.keyFindings ?? [];
  const recommendations: string[] = report.recommendations ?? [];

  // SVG arc gauge — print-safe (no animation)
  function ArcGauge({ cfg, score, pct, label }: { cfg: ReturnType<typeof riskCfg>; score: number; pct: string; label: string }) {
    const fillLen = (cfg.gauge / 100) * 188.5;
    return (
      <div style={{ textAlign: "center", padding: "16px 0" }}>
        <svg viewBox="0 0 140 80" width="130" height="74" style={{ display: "block", margin: "0 auto" }}>
          <path d="M 10 70 A 60 60 0 0 1 130 70" fill="none" stroke="#e2e8f0" strokeWidth="10" strokeLinecap="round" />
          <path d="M 10 70 A 60 60 0 0 1 130 70" fill="none" stroke={cfg.printColor}
            strokeWidth="10" strokeLinecap="round"
            strokeDasharray="188.5"
            strokeDashoffset={188.5 - fillLen} />
        </svg>
        <div style={{ marginTop: 4 }}>
          <span style={{ fontSize: 26, fontWeight: 900, color: cfg.printColor, letterSpacing: "-0.03em" }}>{score}</span>
          <span style={{ fontSize: 10, color: "#94a3b8", marginLeft: 3 }}>pts</span>
        </div>
        <div style={{
          display: "inline-block", marginTop: 6, padding: "3px 10px", borderRadius: 99,
          background: `${cfg.printColor}18`, color: cfg.printColor,
          fontSize: 10, fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase",
        }}>
          {cfg.label}
        </div>
        <p style={{ margin: "6px 0 0", fontSize: 13, fontWeight: 800, color: "#0f172a" }}>{label}</p>
        <p style={{ margin: "2px 0 0", fontSize: 10, color: "#64748b" }}>Lifetime risk: {pct}</p>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif", color: "#0f172a", background: "#ffffff", maxWidth: 760, margin: "0 auto", padding: "0 8px" }}>

      {/* ── HEADER ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 20, borderBottom: "2.5px solid #0fbb7d", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg,#0fbb7d,#059669)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: "-0.03em", color: "#0f172a" }}>HealthMex</div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#94a3b8" }}>Health Risk Screening Report</div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#0f172a" }}>
            Assessment #{selected.assessmentNumber ?? 1}
            {selected.isRetake && <span style={{ marginLeft: 6, padding: "2px 6px", borderRadius: 4, background: "rgba(139,92,246,0.12)", color: "#8b5cf6", fontSize: 9 }}>RETAKE</span>}
          </div>
          <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>{fmt(selected.$createdAt)}</div>
          <div style={{ fontSize: 9, color: "#94a3b8", marginTop: 2 }}>Confidential — Not a Medical Diagnosis</div>
        </div>
      </div>

      {/* ── RISK GAUGES ── */}
      <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
        {[
          { cfg: dCfg, score: report.diabetesRisk.score, pct: report.diabetesRisk.percentage, label: "Diabetes Risk" },
          { cfg: hCfg, score: report.hypertensionRisk.score, pct: report.hypertensionRisk.percentage, label: "Hypertension Risk" },
        ].map(({ cfg, score, pct, label }) => (
          <div key={label} style={{ flex: 1, border: `1.5px solid ${cfg.printColor}30`, borderRadius: 12, padding: "12px 8px", textAlign: "center", background: `${cfg.printColor}06` }}>
            <ArcGauge cfg={cfg} score={score} pct={pct} label={label} />
          </div>
        ))}
      </div>

      {/* ── PATIENT PROFILE ── */}
      {(report.profile?.ageCategory || report.profile?.gender || report.profile?.bmiCategory) && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
          {[
            { label: "Age Group", value: report.profile?.ageCategory },
            { label: "Gender", value: report.profile?.gender },
            { label: "BMI Category", value: report.profile?.bmiCategory },
            { label: "Waist", value: report.profile?.waistCategory },
          ].filter(c => c.value).map(chip => (
            <div key={chip.label} style={{ padding: "4px 12px", borderRadius: 99, border: "1px solid #e2e8f0", fontSize: 10, color: "#374151" }}>
              <span style={{ fontWeight: 700, color: "#64748b" }}>{chip.label}: </span>{chip.value}
            </div>
          ))}
        </div>
      )}

      {/* ── SUMMARY ── */}
      <PrintSection title="Summary" accentColor="#0fbb7d" icon="📋">
        <p style={{ fontSize: 13, lineHeight: 1.75, color: "#334155", margin: 0 }}>{report.summary}</p>
      </PrintSection>

      {/* ── URGENT ACTIONS ── */}
      {urgentActions.length > 0 && (
        <div style={{ border: "1.5px solid #fca5a5", borderRadius: 10, padding: "16px 20px", marginBottom: 16, background: "#fff5f5" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 15 }}>⚠️</span>
            <span style={{ fontSize: 13, fontWeight: 900, color: "#dc2626", letterSpacing: "-0.01em" }}>Urgent Actions Required</span>
          </div>
          {urgentActions.map((action, i) => (
            <div key={i} style={{ display: "flex", gap: 10, marginBottom: i < urgentActions.length - 1 ? 8 : 0 }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(220,38,38,0.15)", color: "#dc2626", fontSize: 10, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
              <p style={{ fontSize: 12, lineHeight: 1.65, color: "#dc2626", margin: 0 }}>{action}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── KEY FINDINGS ── */}
      {keyFindings.length > 0 && (
        <PrintSection title="Key Findings" accentColor="#8b5cf6" icon="📊">
          {keyFindings.map((f, i) => (
            <div key={i} style={{ display: "flex", gap: 10, marginBottom: i < keyFindings.length - 1 ? 8 : 0 }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(139,92,246,0.12)", color: "#8b5cf6", fontSize: 10, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
              <p style={{ fontSize: 12, lineHeight: 1.65, color: "#334155", margin: 0 }}>{f}</p>
            </div>
          ))}
        </PrintSection>
      )}

      {/* ── RECOMMENDATIONS ── */}
      {recommendations.length > 0 && (
        <PrintSection title="Recommendations" accentColor="#0fbb7d" icon="✅">
          {recommendations.map((r, i) => (
            <div key={i} style={{ display: "flex", gap: 10, marginBottom: i < recommendations.length - 1 ? 8 : 0 }}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(15,187,125,0.15)", color: "#0fbb7d", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>✓</div>
              <p style={{ fontSize: 12, lineHeight: 1.65, color: "#334155", margin: 0 }}>{r}</p>
            </div>
          ))}
        </PrintSection>
      )}

      {/* ── DETAILED ANALYSIS ── */}
      {report.detailedAnalysis && (
        <PrintSection title="Detailed Analysis" accentColor="#f59e0b" icon="🔬">
          <p style={{ fontSize: 12, lineHeight: 1.8, color: "#334155", margin: 0, whiteSpace: "pre-line" }}>
            {report.detailedAnalysis}
          </p>
        </PrintSection>
      )}

      {/* ── FOOTER ── */}
      <div style={{ marginTop: 28, paddingTop: 14, borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
        <p style={{ fontSize: 9, lineHeight: 1.6, color: "#94a3b8", maxWidth: 480, margin: 0 }}>
          <strong style={{ color: "#64748b" }}>Disclaimer:</strong> This report is generated using FINDRISC and Framingham-validated risk frameworks for educational and screening purposes only.
          It does not constitute a medical diagnosis or professional medical advice. Please consult a qualified healthcare professional for diagnosis and treatment.
        </p>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 9, color: "#94a3b8" }}>Generated by HealthMex</div>
          <div style={{ fontSize: 9, color: "#94a3b8" }}>{fmt(selected.$createdAt)}</div>
          {selected.xpEarned > 0 && (
            <div style={{ fontSize: 9, color: "#d97706", marginTop: 2 }}>⚡ {selected.xpEarned} XP earned</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── PRINT SECTION HELPER ─────────────────────────────────────────────────────
function PrintSection({ title, accentColor, icon, children }: {
  title: string;
  accentColor: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ border: `1.5px solid ${accentColor}22`, borderLeft: `4px solid ${accentColor}`, borderRadius: 10, padding: "14px 18px", marginBottom: 16, background: "#fafafa" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
        <span style={{ fontSize: 14 }}>{icon}</span>
        <span style={{ fontSize: 13, fontWeight: 900, color: "#0f172a", letterSpacing: "-0.01em" }}>{title}</span>
      </div>
      {children}
    </div>
  );
}