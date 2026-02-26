"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle, ArrowRight, RefreshCw, CheckCircle,
  AlertTriangle, Droplet, Heart, TrendingUp, Shield, Zap,
  ChevronDown, ChevronUp, MessageCircle, Lock,
  Star, Activity, CirclePlus,
} from "lucide-react";
import { groqService } from "@/services/GroqService";
import type { DualRiskAssessment } from "@/services/GroqService";
import Navbar from "@/components/landingpage/navbar";
import Footer from "@/components/ui/Footer";
import { useTheme } from "@/contexts/ThemeContext";

// ─── RISK META ────────────────────────────────────────────────────────────────
const LEVEL_META: Record<string, {
  label: string; colour: string; bg: string; bar: string; pct: number;
}> = {
  "low":               { label: "Low",               colour: "#22c55e", bg: "rgba(34,197,94,.08)",   bar: "#22c55e", pct: 15 },
  "slightly-elevated": { label: "Slightly Elevated",  colour: "#eab308", bg: "rgba(234,179,8,.08)",  bar: "#eab308", pct: 38 },
  "moderate":          { label: "Moderate",           colour: "#f97316", bg: "rgba(249,115,22,.09)", bar: "#f97316", pct: 58 },
  "high":              { label: "High",               colour: "#ef4444", bg: "rgba(239,68,68,.09)",  bar: "#ef4444", pct: 78 },
  "very-high":         { label: "Very High",          colour: "#dc2626", bg: "rgba(220,38,38,.11)",  bar: "#dc2626", pct: 95 },
};

// ─── HOOKS ────────────────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 1200, enabled = true) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setVal(Math.round((1 - (1 - p) ** 3) * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, enabled]);
  return val;
}

function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVis(true); io.disconnect(); } },
      { threshold }
    );
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, [threshold]);
  return { ref, vis };
}

// ─── RISK GAUGE CARD ─────────────────────────────────────────────────────────
function RiskGauge({ level, label, icon, delay = 0 }: {
  level: string; label: string; icon: React.ReactNode; delay?: number;
}) {
  const { surface: S } = useTheme();
  const meta = LEVEL_META[level] ?? LEVEL_META.low;
  const { ref, vis } = useInView();
  const pct = useCountUp(meta.pct, 1100, vis);

  return (
    <div
      ref={ref}
      style={{
        background: S.surface,
        border: `1px solid ${S.border}`,
        padding: 24, borderRadius: 16,
        opacity: vis ? 1 : 0,
        transform: vis ? "translateY(0) scale(1)" : "translateY(20px) scale(0.97)",
        transition: "opacity 0.7s ease, transform 0.7s ease, box-shadow 0.2s ease",
        transitionDelay: `${delay}ms`,
        boxShadow: `0 4px 24px rgba(0,0,0,0.08)`,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", background: meta.bg, color: meta.colour, borderRadius: 12 }}>
            {icon}
          </div>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em", color: S.muted, margin: 0 }}>{label}</p>
            <p style={{ fontSize: 15, fontWeight: 700, color: meta.colour, margin: 0 }}>{meta.label}</p>
          </div>
        </div>
        <span style={{ fontSize: 36, fontWeight: 900, color: meta.colour, fontVariantNumeric: "tabular-nums" }}>{pct}%</span>
      </div>

      {/* Bar */}
      <div style={{ height: 8, background: S.surfaceAlt, borderRadius: 99, overflow: "hidden", marginBottom: 16 }}>
        <div style={{
          height: "100%", borderRadius: 99,
          width: vis ? `${meta.pct}%` : "0%",
          background: `linear-gradient(90deg, ${meta.bar}, ${meta.bar}cc)`,
          transition: "width 1.1s ease-out",
        }} />
      </div>

      {/* 5-segment scale */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 4 }}>
        {(["low", "slightly-elevated", "moderate", "high", "very-high"] as const).map(lvl => {
          const m = LEVEL_META[lvl];
          const active = lvl === level;
          return (
            <div key={lvl} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
              <div style={{ height: 5, width: "100%", borderRadius: 99, background: active ? m.bar : S.surfaceAlt, opacity: active ? 1 : 0.5, transition: "all 0.3s" }} />
              <span style={{ fontSize: 8.5, textAlign: "center", lineHeight: 1.3, color: active ? m.colour : S.muted, fontWeight: active ? 700 : 400 }}>
                {m.label.split(" ")[0]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── SIGNUP CTA ──────────────────────────────────────────────────────────────
function SignupCTA({ onSignup }: { onSignup: () => void }) {
  const { isDark, surface: S, accentColor, accentSecondary, accentFaint } = useTheme();
  const { ref, vis } = useInView(0.2);
  const [hovered, setHovered] = useState(false);

  const features = [
    "Full risk score breakdown",
    "Downloadable PDF report",
    "Track progress over time",
    "Nearest health centre referral",
    "Personalised action plan",
  ];

  return (
    <div
      ref={ref}
      style={{
        position: "relative", overflow: "hidden", borderRadius: 20,
        background: isDark
          ? "linear-gradient(135deg, #0d1a2e 0%, #0e1e2e 50%, #091520 100%)"
          : `linear-gradient(135deg, ${accentFaint} 0%, ${accentColor}0a 50%, rgba(240,249,255,0.6) 100%)`,
        border: `1px solid ${accentColor}30`,
        opacity: vis ? 1 : 0,
        transform: vis ? "translateY(0)" : "translateY(24px)",
        transition: "opacity 0.8s ease, transform 0.8s ease",
        boxShadow: isDark ? `0 0 60px ${accentColor}10, 0 8px 32px rgba(0,0,0,0.4)` : `0 0 60px ${accentColor}08, 0 8px 32px rgba(0,0,0,0.06)`,
      }}
    >
      {/* Decorative orbs */}
      <div style={{ position: "absolute", top: -48, right: -48, width: 160, height: 160, borderRadius: "50%", background: `radial-gradient(circle, ${accentColor}22 0%, transparent 70%)`, pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -40, left: -40, width: 128, height: 128, borderRadius: "50%", background: `radial-gradient(circle, ${accentSecondary}18 0%, transparent 70%)`, pointerEvents: "none" }} />

      <div style={{ position: "relative", padding: 28 }}>
        {/* Lock badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <div style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", background: accentFaint, borderRadius: 8 }}>
            <Lock size={14} color={accentColor} />
          </div>
          <div>
            <p style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", color: accentColor, margin: 0 }}>Unlock your full report</p>
            <p style={{ fontSize: 11, color: S.muted, margin: 0 }}>Free — no credit card needed</p>
          </div>
        </div>

        {/* Features */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
          {features.map((feat, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, filter: i >= 2 ? "blur(3px)" : "none", opacity: i >= 2 ? 0.35 : 0.9, transition: "all 0.3s" }}>
              <CheckCircle size={15} style={{ flexShrink: 0, color: i < 2 ? accentColor : S.muted }} />
              <p style={{ fontSize: 13, color: i < 2 ? S.text : S.muted, margin: 0 }}>{feat}</p>
            </div>
          ))}
        </div>

        {/* Stars */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 20 }}>
          {[...Array(5)].map((_, i) => (
            <Star key={i} size={13} style={{ fill: "#f59e0b", color: "#f59e0b" }} />
          ))}
          <span style={{ fontSize: 11, fontWeight: 600, marginLeft: 6, color: S.muted }}>
            Trusted by thousands across East Africa
          </span>
        </div>

        {/* CTA */}
        <button
          onClick={onSignup}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            padding: "15px 20px", borderRadius: 12,
            background: `linear-gradient(135deg, ${accentColor}, ${accentSecondary})`,
            border: "none", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer",
            boxShadow: hovered ? `0 8px 30px ${accentColor}55, 0 0 0 4px ${accentColor}20` : `0 4px 16px ${accentColor}40`,
            transform: hovered ? "translateY(-2px)" : "translateY(0)",
            transition: "all 0.2s ease",
          }}
        >
          <CirclePlus size={16} />
          Create free account
          <ArrowRight size={15} style={{ transform: hovered ? "translateX(3px)" : "translateX(0)", transition: "transform 0.2s" }} />
        </button>

        <p style={{ textAlign: "center", fontSize: 11, marginTop: 12, color: S.muted }}>
          Save results · Track over time · Unlock full insights
        </p>
      </div>
    </div>
  );
}

// ─── SECTION CARD ─────────────────────────────────────────────────────────────
function SectionCard({ icon, accentColor, label, children, delay = 0 }: {
  icon: React.ReactNode; accentColor: string; label: string;
  children: React.ReactNode; delay?: number;
}) {
  const { surface: S } = useTheme();
  const { ref, vis } = useInView(0.08);
  return (
    <div
      ref={ref}
      style={{
        background: S.surface, border: `1px solid ${S.border}`,
        borderRadius: 16, padding: 20,
        boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
        opacity: vis ? 1 : 0,
        transform: vis ? "translateY(0)" : "translateY(16px)",
        transition: "opacity 0.7s ease, transform 0.7s ease",
        transitionDelay: `${delay}ms`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: `${accentColor}18`, color: accentColor, borderRadius: 8 }}>
          {icon}
        </div>
        <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em", color: S.muted, margin: 0 }}>
          {label}
        </p>
      </div>
      {children}
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function ReviewPage() {
  const { isDark, surface: S, accentColor } = useTheme();
  const router = useRouter();

  const [assessment, setAssessment] = useState<DualRiskAssessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => { generate(); }, []);

  const generate = async () => {
    setLoading(true); setError(null);
    try { setAssessment(await groqService.generateRiskAssessment()); }
    catch { setError("Failed to generate your assessment. Please try again."); }
    finally { setLoading(false); }
  };

  // ── LOADING ──────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display: "flex", minHeight: "100vh", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 32, background: S.bg, transition: "background 0.4s ease" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, textAlign: "center" }}>
        <div style={{ position: "relative", width: 80, height: 80 }}>
          <div style={{
            width: 80, height: 80, borderRadius: "50%",
            border: `4px solid ${accentColor}22`,
            borderTopColor: accentColor,
            animation: "spin 0.9s linear infinite",
          }} />
          <Activity size={28} color={accentColor} style={{ position: "absolute", inset: 0, margin: "auto" }} />
        </div>
        <div>
          <p style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.22em", color: accentColor, margin: "0 0 8px" }}>
            Analysing your responses
          </p>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: S.text, margin: "0 0 8px", letterSpacing: "-0.02em" }}>
            Generating your personalised report…
          </h2>
          <p style={{ fontSize: 13, color: S.muted, margin: 0 }}>Our AI is reviewing your risk factors</p>
        </div>
        <div style={{ width: 192, height: 4, background: `${accentColor}18`, borderRadius: 99, overflow: "hidden" }}>
          <div style={{
            height: "100%", width: "70%", borderRadius: 99,
            background: `linear-gradient(90deg, ${accentColor}, ${accentColor}cc)`,
            animation: "pulse 1.5s ease-in-out infinite",
          }} />
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.5} }`}</style>
    </div>
  );

  // ── ERROR ────────────────────────────────────────────────────────────────
  if (error || !assessment) return (
    <div style={{ display: "flex", minHeight: "100vh", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, padding: "0 24px", textAlign: "center", background: S.bg }}>
      <div style={{ width: 64, height: 64, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(239,68,68,0.1)", borderRadius: 16 }}>
        <AlertCircle size={32} color="#ef4444" />
      </div>
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: S.text, margin: "0 0 6px" }}>Assessment failed</h2>
        <p style={{ fontSize: 13.5, color: S.muted, margin: 0 }}>{error || "Unable to generate your report."}</p>
      </div>
      <button
        onClick={() => router.push("/questions")}
        style={{ padding: "12px 28px", borderRadius: 12, background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`, border: "none", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", boxShadow: `0 4px 16px ${accentColor}40` }}
      >
        Start over
      </button>
    </div>
  );

  const dLevel = assessment.diabetesRisk.level;
  const hLevel = assessment.hypertensionRisk.level;
  const anyUrgent = !!assessment.urgentActions?.length;

  return (
    <div style={{ minHeight: "100vh", background: S.bg, transition: "background 0.4s ease" }}>
      <Navbar />

      <div style={{ maxWidth: 672, margin: "0 auto", padding: "48px 20px 112px" }}>

        {/* ── HERO ── */}
        <div style={{ marginBottom: 40, textAlign: "center" }}>
          <p style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.22em", color: accentColor, margin: "0 0 12px" }}>
            Your Risk Snapshot
          </p>
          <h1 style={{ fontSize: "clamp(1.7rem, 4vw, 2.5rem)", fontWeight: 900, letterSpacing: "-0.04em", color: S.text, lineHeight: 1.15, margin: "0 0 12px" }}>
            Your personalised<br />health risk report.
          </h1>
          <p style={{ fontSize: 13.5, color: S.muted, maxWidth: "38ch", margin: "0 auto", lineHeight: 1.65 }}>
            Based on your answers and validated clinical frameworks (FINDRISC & Framingham).
            This is a screening tool — not a medical diagnosis.
          </p>
        </div>

        {/* ── URGENT ── */}
        {anyUrgent && (
          <div style={{
            marginBottom: 24, padding: "16px 20px", borderRadius: 16,
            background: isDark ? "rgba(239,68,68,0.06)" : "rgba(239,68,68,0.04)",
            border: "1px solid rgba(239,68,68,0.2)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <AlertTriangle size={15} color="#ef4444" style={{ flexShrink: 0 }} />
              <p style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.16em", color: "#ef4444", margin: 0 }}>Action recommended</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {assessment.urgentActions!.map((a, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444", flexShrink: 0, marginTop: 6 }} />
                  <p style={{ fontSize: 13, lineHeight: 1.6, color: isDark ? "#fca5a5" : "#b91c1c", margin: 0 }}>{a}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── GAUGES ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginBottom: 24 }}>
          <RiskGauge level={dLevel} label="Diabetes Risk"     icon={<Droplet size={18} />} delay={0} />
          <RiskGauge level={hLevel} label="Hypertension Risk" icon={<Heart   size={18} />} delay={120} />
        </div>

        {/* ── SUMMARY ── */}
        <SectionCard icon={<TrendingUp size={14} />} accentColor={accentColor} label="Summary" delay={100}>
          <p style={{ fontSize: 13.5, lineHeight: 1.7, color: S.text, margin: 0 }}>{assessment.summary}</p>
        </SectionCard>

        <div style={{ height: 16 }} />

        {/* ── KEY FINDINGS ── */}
        <SectionCard icon={<Shield size={14} />} accentColor="#6366f1" label="Key Findings" delay={150}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {assessment.keyFindings.map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#6366f1", flexShrink: 0, marginTop: 7 }} />
                <p style={{ fontSize: 13, lineHeight: 1.6, color: S.text, margin: 0 }}>{f}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        <div style={{ height: 16 }} />

        {/* ── RECOMMENDATIONS ── */}
        <SectionCard icon={<CheckCircle size={14} />} accentColor="#10b981" label="Recommendations" delay={200}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {assessment.recommendations.map((r, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <CheckCircle size={15} color="#10b981" style={{ flexShrink: 0, marginTop: 2 }} />
                <p style={{ fontSize: 13, lineHeight: 1.6, color: S.text, margin: 0 }}>{r}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        <div style={{ height: 16 }} />

        {/* ── AI DETAILED ANALYSIS ── */}
        {assessment.detailedAnalysis && (
          <div style={{
            borderRadius: 16, overflow: "hidden",
            background: S.surface, border: `1px solid ${S.border}`,
            boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
            marginBottom: 16,
          }}>
            <button
              onClick={() => setShowDetail(v => !v)}
              style={{
                display: "flex", width: "100%", alignItems: "center", justifyContent: "space-between",
                padding: "16px 20px", background: "none", border: "none", cursor: "pointer",
                color: S.text, transition: "background 0.15s",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = S.surfaceAlt; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none"; }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(139,92,246,0.12)", borderRadius: 8 }}>
                  <Zap size={14} color="#8b5cf6" />
                </div>
                <p style={{ fontSize: 13, fontWeight: 600, color: S.text, margin: 0 }}>AI Detailed Analysis</p>
              </div>
              {showDetail
                ? <ChevronUp size={15} color={S.muted} />
                : <ChevronDown size={15} color={S.muted} />
              }
            </button>
            {showDetail && (
              <div style={{
                borderTop: `1px solid ${S.border}`,
                padding: "20px",
                display: "flex", flexDirection: "column", gap: 12,
              }}>
                {assessment.detailedAnalysis.split("\n").map((para, i) =>
                  para.trim()
                    ? <p key={i} style={{ fontSize: 13, lineHeight: 1.85, color: S.muted, margin: 0 }}>{para}</p>
                    : null
                )}
              </div>
            )}
          </div>
        )}

        {/* ── SIGNUP CTA ── */}
        <div style={{ margin: "24px 0" }}>
          <SignupCTA onSignup={() => router.push("/login")} />
        </div>

        {/* ── ACTION STRIP ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
          <button
            onClick={() => router.push("/questions")}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "14px 20px", borderRadius: 12,
              background: S.surface, border: `1px solid ${S.border}`,
              color: S.text, fontSize: 13, fontWeight: 600, cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              transition: "all 0.15s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = S.surfaceAlt; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = S.surface; }}
          >
            <RefreshCw size={14} />
            Retake assessment
          </button>
          <button
            onClick={() => window.open("https://wa.me/250789399765", "_blank")}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "14px 20px", borderRadius: 12,
              background: "#25d366", border: "none",
              color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
              boxShadow: "0 4px 16px rgba(37,211,102,0.3)",
              transition: "opacity 0.15s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = "0.88"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
          >
            <MessageCircle size={14} />
            Chat with a doctor
          </button>
        </div>

        {/* ── DISCLAIMER ── */}
        <p style={{ marginTop: 32, textAlign: "center", fontSize: 11, lineHeight: 1.65, color: S.subtle }}>
          This tool is for educational screening purposes only and does not constitute medical advice.
          Always consult a qualified healthcare professional for diagnosis and treatment.
        </p>
      </div>

      <Footer />
    </div>
  );
}