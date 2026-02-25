"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2, AlertCircle, ArrowRight, RefreshCw, CheckCircle,
  AlertTriangle, Droplet, Heart, TrendingUp, Shield, Zap,
  ChevronDown, ChevronUp, MessageCircle, Lock, Sparkles,
  Star, Activity,
  CirclePlus,
} from "lucide-react";
import { groqService } from "@/services/GroqService";
import type { DualRiskAssessment } from "@/services/GroqService";
import Navbar from "@/components/landingpage/navbar";
import Footer from "@/components/ui/Footer";
import { useTheme } from "@/contexts/ThemeContext";

// ─── RISK META ─────────────────────────────────────────────────────────────────
const LEVEL_META: Record<string, {
  label: string; colour: string; bg: string; bar: string; pct: number; emoji: string;
}> = {
  'low':               { label: 'Low',              colour: '#22c55e', bg: 'rgba(34,197,94,.08)',   bar: '#22c55e', pct: 15, emoji: '🟢' },
  'slightly-elevated': { label: 'Slightly Elevated', colour: '#eab308', bg: 'rgba(234,179,8,.08)',  bar: '#eab308', pct: 38, emoji: '🟡' },
  'moderate':          { label: 'Moderate',          colour: '#f97316', bg: 'rgba(249,115,22,.09)', bar: '#f97316', pct: 58, emoji: '🟠' },
  'high':              { label: 'High',              colour: '#ef4444', bg: 'rgba(239,68,68,.09)',  bar: '#ef4444', pct: 78, emoji: '🔴' },
  'very-high':         { label: 'Very High',         colour: '#dc2626', bg: 'rgba(220,38,38,.11)',  bar: '#dc2626', pct: 95, emoji: '🔴' },
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
      const ease = 1 - (1 - p) ** 3;
      setVal(Math.round(ease * target));
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
function RiskGauge({
  level, label, icon, isDark, delay = 0,
}: {
  level: string; label: string; icon: React.ReactNode; isDark: boolean; delay?: number;
}) {
  const meta = LEVEL_META[level] ?? LEVEL_META.low;
  const { ref, vis } = useInView();
  const pct = useCountUp(meta.pct, 1100, vis);

  const cardBg = isDark ? '#0e1521' : '#ffffff';
  const textH = isDark ? '#f1f5f9' : '#0f172a';
  const textM = isDark ? '#6b7a96' : '#64748b';
  const trackBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

  return (
    <div
      ref={ref}
      className="rounded-2xl p-6 transition-all duration-700"
      style={{
        background: cardBg,
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`,
        opacity: vis ? 1 : 0,
        transform: vis ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.97)',
        transitionDelay: `${delay}ms`,
        boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.3)' : '0 4px 24px rgba(0,0,0,0.05)',
      }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: meta.bg, color: meta.colour }}
          >
            {icon}
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: textM }}>{label}</p>
            <p className="text-[15px] font-bold" style={{ color: meta.colour }}>{meta.label}</p>
          </div>
        </div>
        <span className="text-[2.2rem] font-black tabular-nums" style={{ color: meta.colour }}>{pct}%</span>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full rounded-full overflow-hidden mb-4" style={{ background: trackBg }}>
        <div
          className="h-full rounded-full transition-all duration-[1.1s] ease-out"
          style={{ width: vis ? `${meta.pct}%` : '0%', background: `linear-gradient(90deg, ${meta.bar}, ${meta.bar}cc)` }}
        />
      </div>

      {/* 5-segment scale */}
      <div className="grid grid-cols-5 gap-1">
        {(['low', 'slightly-elevated', 'moderate', 'high', 'very-high'] as const).map(lvl => {
          const m = LEVEL_META[lvl];
          const active = lvl === level;
          return (
            <div key={lvl} className="flex flex-col items-center gap-1.5">
              <div
                className="h-1.5 w-full rounded-full transition-all duration-300"
                style={{ background: active ? m.bar : trackBg, opacity: active ? 1 : 0.5 }}
              />
              <span
                className="text-[8.5px] text-center leading-tight"
                style={{ color: active ? m.colour : textM, fontWeight: active ? 700 : 400 }}
              >
                {m.label.split(' ')[0]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── ANIMATED SIGNUP CTA ─────────────────────────────────────────────────────
function SignupCTA({ isDark, onSignup }: { isDark: boolean; onSignup: () => void }) {
  const { ref, vis } = useInView(0.2);
  const [hovered, setHovered] = useState(false);

  const features = [
    'Full risk score breakdown',
    'Downloadable PDF report',
    'Track progress over time',
    'Nearest health centre referral',
    'Personalised action plan',
  ];

  return (
    <div
      ref={ref}
      className="relative overflow-hidden rounded-2xl"
      style={{
        background: isDark
          ? 'linear-gradient(135deg, #0d1a2e 0%, #0e1e2e 50%, #091520 100%)'
          : 'linear-gradient(135deg, #f0fdf9 0%, #ecfdf5 50%, #f0f9ff 100%)',
        border: `1px solid ${isDark ? 'rgba(13,148,136,0.25)' : 'rgba(13,148,136,0.2)'}`,
        opacity: vis ? 1 : 0,
        transform: vis ? 'translateY(0)' : 'translateY(24px)',
        transition: 'opacity 0.8s ease, transform 0.8s ease',
        boxShadow: isDark
          ? '0 0 60px rgba(13,148,136,0.08), 0 8px 32px rgba(0,0,0,0.4)'
          : '0 0 60px rgba(13,148,136,0.06), 0 8px 32px rgba(0,0,0,0.06)',
      }}
    >
      {/* Decorative glow orbs */}
      <div
        className="absolute -top-12 -right-12 w-40 h-40 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(13,148,136,0.18) 0%, transparent 70%)' }}
      />
      <div
        className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(5,150,105,0.12) 0%, transparent 70%)' }}
      />

      <div className="relative p-7">
        {/* Lock badge */}
        <div className="flex items-center gap-2 mb-5">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg"
            style={{ background: 'rgba(13,148,136,0.15)' }}
          >
            <Lock className="w-4 h-4 text-teal-500" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-teal-500">Unlock your full report</p>
            <p className="text-[11px]" style={{ color: isDark ? '#4b6279' : '#94a3b8' }}>Free — no credit card needed</p>
          </div>
        </div>

        {/* Blurred features */}
        <div className="space-y-2.5 mb-6">
          {features.map((feat, i) => (
            <div
              key={i}
              className="flex items-center gap-2.5 transition-all duration-300"
              style={{
                filter: `blur(${i >= 2 ? 3 : 0}px)`,
                opacity: i >= 2 ? 0.4 : 0.85,
              }}
            >
              <CheckCircle className="w-4 h-4 shrink-0" style={{ color: i < 2 ? '#0d9488' : isDark ? '#334155' : '#94a3b8' }} />
              <p
                className="text-[13px]"
                style={{ color: i < 2 ? (isDark ? '#e2e8f0' : '#0f172a') : (isDark ? '#334155' : '#94a3b8') }}
              >
                {feat}
              </p>
            </div>
          ))}
        </div>

        {/* Stars */}
        <div className="flex items-center gap-1 mb-5">
          {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
          <span className="text-[11px] font-semibold ml-1.5" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>
            Trusted by thousands across East Africa
          </span>
        </div>

        {/* CTA button */}
        <button
          onClick={onSignup}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className="w-full flex items-center justify-center gap-2.5 py-4 rounded-xl text-base font-bold text-white transition-all duration-300"
          style={{
            background: 'linear-gradient(135deg, #0d9488, #059669)',
            boxShadow: hovered
              ? '0 8px 30px rgba(13,148,136,0.5), 0 0 0 4px rgba(13,148,136,0.15)'
              : '0 4px 16px rgba(13,148,136,0.3)',
            transform: hovered ? 'translateY(-1px)' : 'translateY(0)',
          }}
        >
          <CirclePlus className="w-4 h-4" />
          Create free account
          <ArrowRight className={`w-4 h-4 transition-transform duration-200 ${hovered ? 'translate-x-1' : ''}`} />
        </button>

        <p className="text-center text-[11px] mt-3" style={{ color: isDark ? '#334155' : '#94a3b8' }}>
          Save results · Track over time · Unlock full insights
        </p>
      </div>
    </div>
  );
}

// ─── SECTION CARD ─────────────────────────────────────────────────────────────
function SectionCard({
  icon, accentColor, label, children, isDark, delay = 0,
}: {
  icon: React.ReactNode;
  accentColor: string;
  label: string;
  children: React.ReactNode;
  isDark: boolean;
  delay?: number;
}) {
  const { ref, vis } = useInView(0.08);
  return (
    <div
      ref={ref}
      className="rounded-2xl p-5 transition-all duration-700"
      style={{
        background: isDark ? '#0e1521' : '#ffffff',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`,
        boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.25)' : '0 4px 24px rgba(0,0,0,0.04)',
        opacity: vis ? 1 : 0,
        transform: vis ? 'translateY(0)' : 'translateY(16px)',
        transitionDelay: `${delay}ms`,
      }}
    >
      <div className="flex items-center gap-2.5 mb-4">
        <div className="flex items-center justify-center w-7 h-7 rounded-lg" style={{ background: `${accentColor}18`, color: accentColor }}>
          {icon}
        </div>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: isDark ? 'rgba(255,255,255,0.3)' : '#94a3b8' }}>{label}</p>
      </div>
      {children}
    </div>
  );
}

// ─── MAIN REVIEW PAGE ─────────────────────────────────────────────────────────
export default function ReviewPage() {
  const { isDark } = useTheme();
  const router = useRouter();

  const [assessment, setAssessment] = useState<DualRiskAssessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const textH = isDark ? '#f1f5f9' : '#0f172a';
  const textM = isDark ? '#6b7a96' : '#64748b';
  const bg = isDark ? '#080d18' : '#f1f5fb';

  useEffect(() => { generate(); }, []);

  const generate = async () => {
    setLoading(true); setError(null);
    try {
      const r = await groqService.generateRiskAssessment();
      setAssessment(r);
    } catch {
      setError("Failed to generate your assessment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Loading
  if (loading) return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 transition-colors duration-500" style={{ background: bg }}>
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="relative">
          <div
            className="h-20 w-20 animate-spin rounded-full border-4"
            style={{ borderColor: 'transparent', borderTopColor: '#0d9488', borderRightColor: 'rgba(13,148,136,0.2)' }}
          />
          <Activity className="absolute inset-0 m-auto h-7 w-7 text-teal-500" />
        </div>
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-teal-500">Analysing your responses</p>
          <h2 className="text-[1.15rem] font-bold" style={{ color: textH }}>Generating your personalised report…</h2>
          <p className="text-[13px] mt-2" style={{ color: textM }}>Our AI is reviewing your risk factors</p>
        </div>
        {/* Loading progress bar */}
        <div className="w-48 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(13,148,136,0.15)' }}>
          <div
            className="h-full rounded-full animate-pulse"
            style={{ width: '70%', background: 'linear-gradient(90deg, #0d9488, #059669)' }}
          />
        </div>
      </div>
    </div>
  );

  // Error
  if (error || !assessment) return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 px-6 text-center" style={{ background: bg }}>
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.1)' }}>
        <AlertCircle className="h-8 w-8 text-red-500" />
      </div>
      <div>
        <h2 className="text-[1.15rem] font-bold mb-1" style={{ color: textH }}>Assessment failed</h2>
        <p className="text-[13.5px]" style={{ color: textM }}>{error || "Unable to generate your report."}</p>
      </div>
      <button
        onClick={() => router.push('/questions')}
        className="rounded-xl px-7 py-3 text-sm font-bold text-white"
        style={{ background: 'linear-gradient(135deg,#0d9488,#059669)', boxShadow: '0 4px 16px rgba(13,148,136,0.3)' }}
      >
        Start over
      </button>
    </div>
  );

  const dLevel = assessment.diabetesRisk.level;
  const hLevel = assessment.hypertensionRisk.level;
  const anyUrgent = !!assessment.urgentActions?.length;

  return (
    <div className="min-h-screen transition-colors duration-500" style={{ background: bg }}>
      <Navbar />

      <div className="mx-auto max-w-2xl px-5 pb-28 pt-12 lg:px-8">

        {/* ── HERO ── */}
        <div className="mb-10 text-center space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-teal-500">Your Risk Snapshot</p>
          <h1 className="text-[clamp(1.7rem,4vw,2.5rem)] font-black leading-tight tracking-tight" style={{ color: textH }}>
            Your personalised<br />health risk report.
          </h1>
          <p className="mx-auto max-w-[38ch] text-[13.5px] leading-relaxed" style={{ color: textM }}>
            Based on your answers and validated clinical frameworks (FINDRISC & Framingham).
            This is a screening tool — not a medical diagnosis.
          </p>
        </div>

        {/* ── URGENT ACTIONS ── */}
        {anyUrgent && (
          <div
            className="mb-6 rounded-2xl px-5 py-4"
            style={{
              background: isDark ? 'rgba(239,68,68,0.06)' : 'rgba(239,68,68,0.04)',
              border: '1px solid rgba(239,68,68,0.2)',
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-red-500">Action recommended</p>
            </div>
            <div className="flex flex-col gap-2">
              {assessment.urgentActions!.map((a, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                  <p className="text-[13px] leading-relaxed" style={{ color: isDark ? '#fca5a5' : '#b91c1c' }}>{a}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── RISK GAUGES ── */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <RiskGauge level={dLevel} label="Diabetes Risk" icon={<Droplet className="h-5 w-5" />} isDark={isDark} delay={0} />
          <RiskGauge level={hLevel} label="Hypertension Risk" icon={<Heart className="h-5 w-5" />} isDark={isDark} delay={120} />
        </div>

        {/* ── SUMMARY ── */}
        <SectionCard icon={<TrendingUp className="w-4 h-4" />} accentColor="#0d9488" label="Summary" isDark={isDark} delay={100}>
          <p className="text-[13.5px] leading-relaxed" style={{ color: textH }}>{assessment.summary}</p>
        </SectionCard>

        <div className="my-4" />

        {/* ── KEY FINDINGS ── */}
        <SectionCard icon={<Shield className="w-4 h-4" />} accentColor="#6366f1" label="Key Findings" isDark={isDark} delay={150}>
          <div className="flex flex-col gap-3">
            {assessment.keyFindings.map((f, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: '#6366f1' }} />
                <p className="text-[13px] leading-relaxed" style={{ color: textH }}>{f}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        <div className="my-4" />

        {/* ── RECOMMENDATIONS ── */}
        <SectionCard icon={<CheckCircle className="w-4 h-4" />} accentColor="#10b981" label="Recommendations" isDark={isDark} delay={200}>
          <div className="flex flex-col gap-3">
            {assessment.recommendations.map((r, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                <p className="text-[13px] leading-relaxed" style={{ color: textH }}>{r}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        <div className="my-4" />

        {/* ── AI DETAILED ANALYSIS ── */}
        {assessment.detailedAnalysis && (
          <div
            className="mb-4 rounded-2xl overflow-hidden"
            style={{
              background: isDark ? '#0e1521' : '#ffffff',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`,
              boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.25)' : '0 4px 24px rgba(0,0,0,0.04)',
            }}
          >
            <button
              onClick={() => setShowDetail(v => !v)}
              className="flex w-full items-center justify-between px-5 py-4 transition-colors"
              style={{ color: textH }}
            >
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center w-7 h-7 rounded-lg" style={{ background: 'rgba(139,92,246,0.12)' }}>
                  <Zap className="h-4 w-4 text-violet-500" />
                </div>
                <p className="text-[13px] font-semibold">AI Detailed Analysis</p>
              </div>
              {showDetail
                ? <ChevronUp className="h-4 w-4" style={{ color: textM }} />
                : <ChevronDown className="h-4 w-4" style={{ color: textM }} />
              }
            </button>
            {showDetail && (
              <div
                className="border-t px-5 py-5 text-[13px] leading-[1.9] space-y-3"
                style={{ borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)', color: textM }}
              >
                {assessment.detailedAnalysis.split('\n').map((para, i) =>
                  para.trim() ? <p key={i}>{para}</p> : null
                )}
              </div>
            )}
          </div>
        )}

        {/* ── SIGNUP CTA ── */}
        <div className="my-6">
          <SignupCTA isDark={isDark} onSignup={() => router.push('/login')} />
        </div>

        {/* ── ACTION STRIP ── */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            onClick={() => router.push('/questions')}
            className="flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-[13px] font-semibold transition-all hover:opacity-80"
            style={{
              background: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
              color: textH,
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)'}`,
              boxShadow: isDark ? 'none' : '0 2px 8px rgba(0,0,0,0.05)',
            }}
          >
            <RefreshCw className="h-4 w-4" />
            Retake assessment
          </button>
          <button
            onClick={() => window.open('https://wa.me/250789399765', '_blank')}
            className="flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-[13px] font-bold text-white transition-all hover:opacity-90 active:scale-95"
            style={{ background: '#25d366', boxShadow: '0 4px 16px rgba(37,211,102,0.28)' }}
          >
            <MessageCircle className="h-4 w-4" />
            Chat with a doctor
          </button>
        </div>

        {/* ── DISCLAIMER ── */}
        <p className="mt-8 text-center text-[11px] leading-relaxed" style={{ color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.3)' }}>
          This tool is for educational screening purposes only and does not constitute medical advice.
          Always consult a qualified healthcare professional for diagnosis and treatment.
        </p>
      </div>

      <Footer />
    </div>
  );
}