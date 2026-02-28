/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ChevronRight, ChevronLeft, Loader2, AlertCircle, Sparkles,
  Activity, Calendar, User, Scale, Heart, Brain, Utensils,
  Droplets, Moon, Shield, Clock, Users, Info, CheckCircle, Zap,
  Trophy, Flame, Star,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { groqService, WAIST_OPTIONS } from "@/services/GroqService";
import type { Question } from "@/services/GroqService";
import { saveAssessment } from "@/services/AppwriteService";
import { useTheme } from "@/contexts/ThemeContext";
import { useRequireAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { generateAndSaveRecommendations } from "@/services/RecommendationService";
import { createAssessmentNotifications } from "@/services/NotificationsService";
import ThemeToggle from "@/components/Themetoggle";

// ─── ICON MAP ────────────────────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ReactNode> = {
  age: <Calendar className="w-5 h-5" />,
  gender: <User className="w-5 h-5" />,
  height_weight: <Scale className="w-5 h-5" />,
  waist_circumference: <Activity className="w-5 h-5" />,
  physical_activity: <Activity className="w-5 h-5" />,
  sedentary_time: <Clock className="w-5 h-5" />,
  vegetables_fruits: <Utensils className="w-5 h-5" />,
  family_history_diabetes: <Users className="w-5 h-5" />,
  family_history_hypertension: <Users className="w-5 h-5" />,
  smoking: <Shield className="w-5 h-5" />,
  alcohol: <Droplets className="w-5 h-5" />,
  sleep_duration: <Moon className="w-5 h-5" />,
  stress_level: <Brain className="w-5 h-5" />,
  occupation: <Clock className="w-5 h-5" />,
  previous_high_glucose: <Droplets className="w-5 h-5" />,
  sugary_drinks: <Droplets className="w-5 h-5" />,
  gestational_diabetes: <Heart className="w-5 h-5" />,
  gestational_diabetes_detail: <Heart className="w-5 h-5" />,
  pcos: <Zap className="w-5 h-5" />,
  processed_foods: <Utensils className="w-5 h-5" />,
  blood_pressure_history: <Heart className="w-5 h-5" />,
  salt_intake: <Droplets className="w-5 h-5" />,
  sleep_apnea: <Moon className="w-5 h-5" />,
  kidney_disease: <Shield className="w-5 h-5" />,
  preeclampsia: <Heart className="w-5 h-5" />,
  anxiety: <Brain className="w-5 h-5" />,
  medications: <Shield className="w-5 h-5" />,
};

const SUBTITLES: Record<string, string> = {
  age: "Age is one of the strongest predictors of metabolic disease risk.",
  gender: "Biological sex influences how risk factors develop and present.",
  height_weight: "We'll calculate your BMI — a key metabolic health indicator.",
  waist_circumference: "Abdominal fat distribution is more predictive than overall weight.",
  physical_activity: "Regular movement is one of the most powerful protective factors.",
  vegetables_fruits: "Daily plant foods directly impact blood sugar and blood pressure.",
  family_history_diabetes: "Genetics play a significant role in diabetes risk.",
  family_history_hypertension: "Family history calibrates your hypertension risk accurately.",
  previous_high_glucose: "Past glucose elevations are clinically significant markers.",
  blood_pressure_history: "Previous BP readings are the strongest hypertension predictor.",
  default: "Your answer helps build a more accurate, personalised risk profile.",
};

function getCategory(step: number) {
  if (step <= 2) return "Getting to know you";
  if (step <= 4) return "Body composition";
  if (step <= 9) return "Risk factor assessment";
  return "Personalised follow-up";
}

// ─── XP POPUP ────────────────────────────────────────────────────────────────
function XpFloat({ xp, visible }: { xp: number; visible: boolean }) {
  return (
    <div style={{
      position: "fixed", top: 72, right: 20, zIndex: 9999,
      pointerEvents: "none",
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0) scale(1)" : "translateY(10px) scale(0.88)",
      transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
    }}>
      <div className="flex items-center gap-1.5 px-3 py-2 font-black text-sm"
        style={{ background: "linear-gradient(135deg,#f59e0b,#ef4444)", color: "#fff", boxShadow: "0 6px 20px rgba(245,158,11,0.4)" }}>
        <Star size={12} fill="white" strokeWidth={0} />+{xp} XP
      </div>
    </div>
  );
}

// ─── RING ─────────────────────────────────────────────────────────────────────
function RingProgress({ pct, step, total, isDark }: { pct: number; step: number; total: number; isDark: boolean }) {
  const r = 24, circ = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: 60, height: 60 }}>
      <svg width="60" height="60" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="30" cy="30" r={r} fill="none" stroke={isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"} strokeWidth="4" />
        <circle cx="30" cy="30" r={r} fill="none" stroke="url(#rpg)" strokeWidth="4" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={circ - (pct / 100) * circ}
          style={{ transition: "stroke-dashoffset 0.5s ease" }} />
        <defs>
          <linearGradient id="rpg" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0FBB7D" /><stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 13, fontWeight: 900, color: "#0FBB7D", lineHeight: 1 }}>{step}</span>
        <span style={{ fontSize: 9, fontWeight: 600, color: isDark ? "#4a5568" : "#94a3b8" }}>/{total}</span>
      </div>
    </div>
  );
}

// ─── DOTS ─────────────────────────────────────────────────────────────────────
function Dots({ total, current }: { total: number; current: number }) {
  const { isDark } = useTheme();
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {Array.from({ length: Math.min(total, 16) }).map((_, i) => (
        <div key={i} className="transition-all duration-500" style={{
          width: i < current ? 16 : i === current ? 7 : 5, height: 5,
          background: i < current ? "linear-gradient(90deg,#0FBB7D,#059669)"
            : i === current ? "rgba(15,187,125,0.5)" : isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
        }} />
      ))}
    </div>
  );
}

// ─── COMPLETION SCREEN ────────────────────────────────────────────────────────
function CompletionScreen({ isDark, totalXp, saveError }: { isDark: boolean; totalXp: number; saveError: string | null }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 space-y-7 text-center">
      <div className="flex items-center justify-center w-24 h-24"
        style={{ background: "linear-gradient(135deg,#f59e0b,#ef4444)", boxShadow: "0 16px 48px rgba(245,158,11,0.4)", animation: "bounceIn 0.65s cubic-bezier(0.34,1.56,0.64,1)" }}>
        <Trophy size={44} color="#fff" strokeWidth={1.5} />
      </div>
      <div>
        <h2 className="text-3xl font-black mb-2" style={{ color: isDark ? "#f9fafb" : "#0f172a", letterSpacing: "-0.03em" }}>
          Assessment Complete!
        </h2>
        <p className="text-sm mb-4" style={{ color: isDark ? "#8b95a8" : "#64748b" }}>
          Saving your results and generating your report…
        </p>
        <div className="inline-flex items-center gap-2 px-5 py-2.5 font-black text-sm"
          style={{ background: "linear-gradient(135deg,rgba(245,158,11,0.15),rgba(239,68,68,0.1))", border: "1px solid rgba(245,158,11,0.3)", color: "#f59e0b" }}>
          <Zap size={14} fill="#f59e0b" strokeWidth={0} />{totalXp} XP earned
        </div>
      </div>
      {saveError ? (
        <div className="flex items-center gap-2 px-4 py-3 text-sm max-w-sm"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444" }}>
          <AlertCircle size={15} className="shrink-0" />{saveError}
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 border-4 animate-spin"
            style={{ borderColor: "transparent", borderTopColor: "#0FBB7D", borderRightColor: "rgba(15,187,125,0.3)" }} />
          <span className="text-sm font-semibold" style={{ color: "#0FBB7D" }}>Saving to your account…</span>
        </div>
      )}
      <style jsx>{`
        @keyframes bounceIn {
          0%   { transform: scale(0) rotate(-14deg); opacity: 0; }
          60%  { transform: scale(1.18) rotate(4deg); opacity: 1; }
          100% { transform: scale(1) rotate(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function DashboardAssessmentPage() {
  const { isDark, surface, accentColor, accentFaint } = useTheme();
  const auth = useRequireAuth();
  const router = useRouter();

  const [step, setStep]             = useState(1);
  const [question, setQuestion]     = useState<Question | null>(null);
  const [answers, setAnswers]       = useState<Record<string, string | number | boolean>>({});
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [saveError, setSaveError]   = useState<string | null>(null);
  const [visible, setVisible]       = useState(false);

  // Gamification
  const [totalXp, setTotalXp]     = useState(0);
  const [lastXp, setLastXp]       = useState(1);
  const [xpVisible, setXpVisible] = useState(false);
  const [streak, setStreak]       = useState(0);

  // Refs so async closures always read the latest values
  const userIdRef  = useRef<string | null>(null);
  const totalXpRef = useRef<number>(0);
  const qStartRef  = useRef<number>(Date.now());
  const streakRef  = useRef<number>(0);

  useEffect(() => {
    userIdRef.current = auth.user?.id ?? null;
  }, [auth.user]);

  useEffect(() => {
    totalXpRef.current = totalXp;
  }, [totalXp]);

  useEffect(() => {
    streakRef.current = streak;
  }, [streak]);

  const C = {
    card:         surface.surface,
    border:       surface.border,
    text:         surface.text,
    muted:        surface.muted,
    primary:      accentColor,
    primaryFaint: accentFaint,
  };

  // ── LOAD QUESTION ──────────────────────────────────────────────────────────
  const loadQuestion = useCallback(async () => {
    setLoading(true);
    setVisible(false);
    qStartRef.current = Date.now();

    try {
      const next = await groqService.getNextQuestion();

      if (!next) {
        // ── ALL QUESTIONS ANSWERED — generate assessment ───────────────────
        setCompleting(true);

        const assessment  = await groqService.generateRiskAssessment();
        const allAnswers  = groqService.getAnswers();

        // +5 XP completion bonus
        const finalXp = totalXpRef.current + 5;
        setTotalXp(finalXp);
        totalXpRef.current = finalXp;

        const uid = userIdRef.current;
        console.log("[Assessment] Complete. userId from ref:", uid, "| XP:", finalXp);

        if (uid) {
          try {
            const saved = await saveAssessment(uid, assessment, allAnswers, finalXp);
            console.log("[Assessment] Saved OK. doc:", saved.$id);

            // ── Fire notifications based on risk levels (non-blocking) ────
            createAssessmentNotifications(
              uid,
              assessment.diabetesRisk.level,
              assessment.hypertensionRisk.level,
              saved.assessmentNumber,
              finalXp
            ).catch(e =>
              console.error("[Notifications] createAssessmentNotifications failed:", e)
            );

            // ── Generate AI recommendations in background ─────────────────
            generateAndSaveRecommendations(saved, uid).catch(e =>
              console.error("[Recommendations] background generation failed:", e)
            );
          } catch (e: any) {
            console.error("[Assessment] Appwrite save error:", e);
            setSaveError(
              `Could not save: ${e?.message ?? "unknown error"}. Your results are still shown below.`
            );
          }
        } else {
          console.error("[Assessment] No userId in ref — user was null at save time");
          setSaveError("Session error — please refresh and try again.");
        }

        // Cache for the review page
        try {
          sessionStorage.setItem("hmex_review", JSON.stringify({
            assessment,
            answers: allAnswers,
            xpEarned: finalXp,
          }));
        } catch { /* private mode or storage full */ }

        await new Promise(r => setTimeout(r, 1200));
        router.push("/dashboard/review");
        return;
      }

      // Patch yesno questions that have no options set
      const patched = next.type === "yesno" && !next.options
        ? { ...next, options: ["Yes", "No"] }
        : next;

      setQuestion(patched);
      setTimeout(() => { setLoading(false); setVisible(true); }, 80);
    } catch (e) {
      console.error("[Assessment] loadQuestion error:", e);
      setError("Could not load next question. Please try again.");
      setLoading(false);
    }
  }, []); // intentionally empty — all values read via refs

  useEffect(() => {
    groqService.reset();
    loadQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const maxQ          = groqService.getMaxQuestions();
  const progress      = Math.min(100, Math.round((step / maxQ) * 100));
  const currentAnswer = question ? answers[question.id] : undefined;
  const hasAnswer     = currentAnswer !== undefined && currentAnswer !== "" && currentAnswer !== null;

  // ── XP AWARD ──────────────────────────────────────────────────────────────
  const awardXp = useCallback((currentStreak: number) => {
    const elapsed = (Date.now() - qStartRef.current) / 1000;
    let earned = 1;
    if (elapsed <= 5) earned = Math.min(earned + 1, 3);
    if (currentStreak > 0 && currentStreak % 5 === 0) earned = Math.min(earned + 1, 3);
    setLastXp(earned);
    setTotalXp(prev => {
      const next = prev + earned;
      totalXpRef.current = next;
      return next;
    });
    setXpVisible(true);
    setTimeout(() => setXpVisible(false), 1400);
  }, []);

  // ── NEXT ──────────────────────────────────────────────────────────────────
  const handleNext = async () => {
    if (!question) return;
    if (question.id === "height_weight") {
      const h = answers["_height"], w = answers["_weight"];
      if (!h || !w) { setError("Please enter both height and weight."); return; }
      groqService.saveAnswer(question, `${h}/${w}`);
    } else {
      if (question.required && !hasAnswer) { setError("Please answer this question to continue."); return; }
      groqService.saveAnswer(question, currentAnswer ?? "");
    }

    const newStreak = streak + 1;
    setStreak(newStreak);
    streakRef.current = newStreak;
    awardXp(newStreak);
    setVisible(false);
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 260));
    setStep(s => s + 1);
    await loadQuestion();
    setSubmitting(false);
  };

  const handleBack = () => {
    if (step > 1) { setStep(s => s - 1); setError(null); setStreak(0); }
  };

  const handleSelect = (value: string | number | boolean) => {
    if (!question) return;
    setAnswers(prev => ({ ...prev, [question.id]: value }));
    setError(null);
  };

  // ── WAIST ──────────────────────────────────────────────────────────────────
  const renderWaist = () => (
    <div className="space-y-4">
      <p className="text-sm text-center pb-1" style={{ color: C.muted }}>Pick the body shape that most closely matches yours</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {WAIST_OPTIONS.map(opt => {
          const sel = currentAnswer === opt.value;
          return (
            <button key={opt.value} onClick={() => handleSelect(opt.value)}
              className="flex flex-col items-center gap-2 p-3 transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
              style={{
                backgroundColor: sel ? C.primaryFaint : "transparent",
                border: `1px solid ${sel ? C.primary : C.border}`,
                boxShadow: sel ? `0 0 0 3px ${C.primary}22` : "none",
              }}>
              <div className="relative w-full h-28 overflow-hidden">
                <Image src={opt.img} alt={opt.label} fill className="object-contain" />
              </div>
              <div className="text-center">
                <p className="text-xs font-bold" style={{ color: sel ? C.primary : C.text }}>{opt.label}</p>
                <p className="text-[10px] leading-tight mt-0.5" style={{ color: C.muted }}>{opt.hint}</p>
              </div>
              {sel && <CheckCircle size={16} style={{ color: C.primary }} />}
            </button>
          );
        })}
      </div>
    </div>
  );

  // ── HEIGHT / WEIGHT ────────────────────────────────────────────────────────
  const renderHW = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        {([
          { key: "_height", label: "Height", unit: "cm", placeholder: "e.g. 170" },
          { key: "_weight", label: "Weight", unit: "kg", placeholder: "e.g. 72" },
        ] as const).map(({ key, label, unit, placeholder }) => (
          <div key={key}>
            <label className="block mb-2 text-xs font-bold uppercase tracking-widest" style={{ color: C.muted }}>{label}</label>
            <div className="relative">
              <input
                type="number"
                placeholder={placeholder}
                value={String(answers[key] ?? "")}
                onChange={e => { setAnswers(prev => ({ ...prev, [key]: e.target.value })); setError(null); }}
                className="w-full px-4 py-3.5 pr-12 text-base focus:outline-none"
                style={{ backgroundColor: surface.surfaceAlt, border: `1px solid ${C.border}`, color: C.text }}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: C.muted }}>{unit}</span>
            </div>
          </div>
        ))}
      </div>
      <p className="text-center text-sm" style={{ color: C.muted }}>BMI will be calculated automatically.</p>
    </div>
  );

  // ── OPTIONS ────────────────────────────────────────────────────────────────
  const renderOptions = () => {
    if (!question?.options) return null;
    const isYesNo = question.type === "yesno";
    return (
      <div className={`grid gap-2.5 ${isYesNo ? "grid-cols-2" : "grid-cols-1"}`}>
        {question.options.map((opt, i) => {
          const sel = currentAnswer === opt;
          return (
            <button key={i} onClick={() => handleSelect(opt)}
              className="flex items-center gap-3 px-4 py-3.5 text-left transition-all duration-200 hover:scale-[1.01] active:scale-[0.98]"
              style={{
                backgroundColor: sel ? C.primaryFaint : "transparent",
                border: `1px solid ${sel ? C.primary : C.border}`,
                boxShadow: sel ? `0 0 0 3px ${C.primary}18` : "none",
              }}>
              {isYesNo ? (
                <div className="flex items-center justify-center w-7 h-7 text-sm font-bold shrink-0"
                  style={{ backgroundColor: sel ? C.primary : surface.surfaceAlt, color: sel ? "#fff" : C.muted }}>
                  {(opt === "Yes" || opt === "yes") ? "✓" : "✕"}
                </div>
              ) : (
                <div className="w-4 h-4 border-2 shrink-0"
                  style={{ borderColor: sel ? C.primary : C.border, backgroundColor: sel ? C.primary : "transparent" }} />
              )}
              <span className="text-sm leading-snug" style={{ color: sel ? C.primary : C.text, fontWeight: sel ? 600 : 400 }}>{opt}</span>
              {sel && !isYesNo && <CheckCircle size={14} className="ml-auto shrink-0" style={{ color: C.primary }} />}
            </button>
          );
        })}
      </div>
    );
  };

  // ── SLIDER ─────────────────────────────────────────────────────────────────
  const renderSlider = () => {
    if (question?.type !== "slider") return null;
    const val = Number(currentAnswer ?? question.min ?? 0);
    const min = question.min ?? 0, max = question.max ?? 100;
    const pct = ((val - min) / (max - min)) * 100;
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="text-6xl font-black tabular-nums" style={{ color: C.primary }}>{val}</div>
          <div className="text-sm font-semibold uppercase tracking-wider mt-1" style={{ color: C.muted }}>{question.unit}</div>
        </div>
        <div className="relative pt-2 pb-8 px-2">
          <div className="h-3 overflow-hidden" style={{ backgroundColor: surface.surfaceAlt }}>
            <div className="h-full" style={{ width: `${pct}%`, background: `linear-gradient(90deg,${C.primary},#059669)` }} />
          </div>
          <input
            type="range" min={min} max={max} value={val}
            onChange={e => handleSelect(Number(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="absolute top-0.5 w-7 h-7 shadow-lg border-4 border-white pointer-events-none"
            style={{ left: `calc(${pct}% - 14px)`, backgroundColor: C.primary }} />
        </div>
        <div className="flex justify-between text-xs font-semibold" style={{ color: C.muted }}>
          <span>{min} {question.unit}</span><span>{max} {question.unit}</span>
        </div>
      </div>
    );
  };

  // ── RENDER ────────────────────────────────────────────────────────────────
  if (auth.loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-10 h-10 border-4 animate-spin"
            style={{ borderColor: "transparent", borderTopColor: C.primary, borderRightColor: `${C.primary}33` }} />
        </div>
      </DashboardLayout>
    );
  }

  if (completing) {
    return (
      <DashboardLayout>
        <CompletionScreen isDark={isDark} totalXp={totalXp} saveError={saveError} />
      </DashboardLayout>
    );
  }

  if (loading && !question) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-5">
            <div className="relative inline-flex">
              <div className="w-14 h-14 border-4 animate-spin"
                style={{ borderColor: "transparent", borderTopColor: C.primary, borderRightColor: `${C.primary}33` }} />
              <Heart className="absolute inset-0 m-auto w-5 h-5" style={{ color: C.primary }} />
            </div>
            <p className="text-sm font-semibold" style={{ color: C.muted }}>Personalising your questions…</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!question && !loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <AlertCircle className="mx-auto w-11 h-11 text-red-500" />
            <h2 className="text-xl font-bold" style={{ color: C.text }}>Something went wrong</h2>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 font-semibold text-white"
              style={{ background: `linear-gradient(135deg,${C.primary},#059669)` }}
            >
              Try Again
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto pb-12">
        <XpFloat xp={lastXp} visible={xpVisible} />

        {/* Stats bar */}
        <div className="flex items-center gap-4 mb-7 px-4 py-3"
          style={{ backgroundColor: surface.surfaceAlt, border: `1px solid ${C.border}` }}>
          <RingProgress pct={progress} step={step} total={maxQ} isDark={isDark} />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-widest"
                style={{ color: question?.aiGenerated ? "#8B5CF6" : C.primary }}>
                {question?.aiGenerated ? "✦ AI Personalised" : getCategory(step)}
              </span>
              {streak >= 3 && (
                <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-black"
                  style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444" }}>
                  <Flame size={10} fill="#ef4444" strokeWidth={0} />{streak}
                </span>
              )}
            </div>
            <Dots total={maxQ} current={step - 1} />
          </div>
          <div className="text-right shrink-0">
            <div className="flex items-center gap-1.5 justify-end">
              <Zap size={12} fill="#f59e0b" strokeWidth={0} style={{ color: "#f59e0b" }} />
              <span className="text-lg font-black tabular-nums" style={{ color: C.text, letterSpacing: "-0.02em" }}>{totalXp}</span>
            </div>
            <p className="text-[9px] font-bold uppercase" style={{ color: C.muted, letterSpacing: "0.08em" }}>XP</p>
          </div>
        </div>

        {/* Question card */}
        <div style={{
          backgroundColor: C.card,
          border: `1px solid ${C.border}`,
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(20px)",
          transition: "all 0.3s ease",
        }}>
          {/* Header */}
          <div className="flex items-start gap-4 p-6 border-b" style={{ borderColor: C.border }}>
            <div className="flex items-center justify-center w-11 h-11 shrink-0"
              style={{
                background: question?.aiGenerated
                  ? "linear-gradient(135deg,rgba(139,92,246,0.15),rgba(139,92,246,0.08))"
                  : `linear-gradient(135deg,${C.primaryFaint},rgba(5,150,105,0.06))`,
                color: question?.aiGenerated ? "#8B5CF6" : C.primary,
                border: `1px solid ${question?.aiGenerated ? "rgba(139,92,246,0.2)" : "rgba(15,187,125,0.2)"}`,
              }}>
              {ICON_MAP[question?.id ?? ""] ?? <Activity className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-[17px] font-bold leading-snug mb-1.5" style={{ color: C.text }}>
                {question?.question}
              </h2>
              <p className="text-[13px] leading-relaxed" style={{ color: C.muted }}>
                {SUBTITLES[question?.id ?? ""] ?? SUBTITLES.default}
              </p>
            </div>
            {question?.aiGenerated && (
              <span className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider shrink-0"
                style={{ backgroundColor: "rgba(139,92,246,0.12)", color: "#8B5CF6", border: "1px solid rgba(139,92,246,0.2)" }}>
                <Sparkles className="w-3 h-3" />AI
              </span>
            )}
          </div>

          {/* Body */}
          <div className="p-6 space-y-4">
            {error && (
              <div className="flex items-center gap-3 px-4 py-3 text-sm"
                style={{ backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444" }}>
                <AlertCircle className="w-4 h-4 shrink-0" />{error}
              </div>
            )}
            {question?.aiGenerated && (
              <div className="flex items-center gap-3 px-4 py-3 text-sm"
                style={{ backgroundColor: "rgba(139,92,246,0.07)", border: "1px solid rgba(139,92,246,0.15)", color: "#8B5CF6" }}>
                <Sparkles className="w-4 h-4 shrink-0" />This question was tailored to your risk profile.
              </div>
            )}
            {question?.id === "waist_circumference" && renderWaist()}
            {question?.id === "height_weight" && renderHW()}
            {question?.type === "slider" && question.id !== "height_weight" && renderSlider()}
            {question?.options && question.id !== "waist_circumference" && renderOptions()}
            {question?.type === "text" && question.id !== "height_weight" && (
              <input
                type="text"
                placeholder="Type your answer…"
                value={String(currentAnswer ?? "")}
                onChange={e => handleSelect(e.target.value)}
                className="w-full px-4 py-3.5 text-base focus:outline-none"
                style={{ backgroundColor: surface.surfaceAlt, border: `1px solid ${C.border}`, color: C.text }}
              />
            )}
            {question?.tooltip && (
              <div className="flex items-start gap-3 px-4 py-3 text-[12px] leading-relaxed"
                style={{ backgroundColor: surface.surfaceAlt, color: C.muted }}>
                <Info className="w-4 h-4 mt-0.5 shrink-0" />{question.tooltip}
              </div>
            )}
          </div>
        </div>

        {/* Nav */}
        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            onClick={handleBack}
            disabled={step === 1}
            className="flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-all disabled:opacity-0 disabled:pointer-events-none hover:scale-[1.02] active:scale-[0.98]"
            style={{ color: C.muted, backgroundColor: surface.surfaceAlt, border: `1px solid ${C.border}` }}
          >
            <ChevronLeft className="w-4 h-4" />Back
          </button>
          <p className="hidden sm:block text-[11px]" style={{ color: C.muted }}>
            <Zap size={10} className="inline mr-1" style={{ color: "#f59e0b" }} />
            Fast answers · streaks · finish = XP
          </p>
          <button
            onClick={handleNext}
            disabled={submitting}
            className="flex items-center gap-2 px-8 py-3 text-sm font-black text-white transition-all active:scale-[0.97] disabled:opacity-50 hover:scale-[1.02]"
            style={{ background: `linear-gradient(135deg,${C.primary},#059669)`, boxShadow: "0 4px 20px rgba(15,187,125,0.32)" }}
          >
            {submitting
              ? <><Loader2 className="w-4 h-4 animate-spin" />Loading…</>
              : groqService.getQuestionCount() >= maxQ
              ? <><Trophy size={15} />View Results</>
              : <>Continue<ChevronRight className="w-4 h-4" /></>}
          </button>
        </div>

        <p className="mt-8 text-center text-[11px]" style={{ color: isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.22)" }}>
          FINDRISC & Framingham validated · Private & confidential
        </p>
      </div>
      <ThemeToggle />
    </DashboardLayout>
  );
}