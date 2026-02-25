"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ChevronRight, ChevronLeft, Loader2, AlertCircle, Sparkles,
  Activity, Calendar, User, Scale, Heart, Brain, Utensils,
  Droplets, Moon, Shield, Clock, Users, Info, CheckCircle, Zap,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { groqService, WAIST_OPTIONS } from "@/services/GroqService";
import type { Question } from "@/services/GroqService";
import { holdAssessmentLocally } from "@/services/AppwriteService";
import { holdRecommendationsLocally } from "@/services/RecommendationService";
import Navbar from "@/components/landingpage/navbar";
import { useTheme } from "@/contexts/ThemeContext";

// ─── ICON MAPPING ─────────────────────────────────────────────────────────────
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
  waist_circumference: "Abdominal fat distribution is more predictive than overall weight alone.",
  physical_activity: "Regular movement is one of the most powerful protective factors.",
  vegetables_fruits: "Daily plant foods directly impact blood sugar and blood pressure.",
  family_history_diabetes: "Genetics play a significant role in diabetes risk.",
  family_history_hypertension: "Family history helps calibrate your hypertension risk accurately.",
  previous_high_glucose: "Past glucose elevations are clinically significant markers.",
  blood_pressure_history: "Previous blood pressure readings are the strongest hypertension predictor.",
  default: "Your answer helps build a more accurate, personalised risk profile.",
};

function getCategoryLabel(step: number): string {
  if (step <= 2) return "Getting to know you";
  if (step <= 4) return "Body composition";
  if (step <= 9) return "Risk factor assessment";
  return "Personalised follow-up";
}

// ─── PROGRESS DOTS ────────────────────────────────────────────────────────────
function ProgressDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {Array.from({ length: Math.min(total, 15) }).map((_, i) => (
        <div
          key={i}
          className="rounded-full transition-all duration-500"
          style={{
            width: i < current ? 20 : 6,
            height: 6,
            backgroundColor:
              i < current
                ? "#0FBB7D"
                : i === current
                ? "rgba(15,187,125,0.4)"
                : "rgba(15,187,125,0.15)",
          }}
        />
      ))}
    </div>
  );
}

// ─── GENERATING SCREEN (shown while AI builds recommendations) ────────────────
function GeneratingScreen({ isDark }: { isDark: boolean }) {
  const C = {
    bg: isDark ? "#0A0F1C" : "#F4F7FB",
    text: isDark ? "#F9FAFB" : "#0F172A",
    muted: isDark ? "#8B95A8" : "#64748B",
    primary: "#0FBB7D",
  };

  const steps = [
    "Analysing your risk profile…",
    "Generating personalised recommendations…",
    "Preparing your health report…",
  ];
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setStepIdx(i => Math.min(i + 1, steps.length - 1)), 2000);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      className="min-h-screen flex items-center justify-center transition-colors duration-300"
      style={{ backgroundColor: C.bg }}
    >
      <div className="text-center space-y-6 max-w-xs">
        <div className="relative inline-flex">
          <div
            className="w-16 h-16 rounded-full border-4 animate-spin"
            style={{
              borderColor: "transparent",
              borderTopColor: C.primary,
              borderRightColor: `${C.primary}33`,
            }}
          />
          <Heart className="absolute inset-0 m-auto w-6 h-6" style={{ color: C.primary }} />
        </div>
        <div>
          <p
            className="text-xs font-bold uppercase tracking-widest mb-2"
            style={{ color: C.primary }}
          >
            Almost Done
          </p>
          <h2 className="text-xl font-bold mb-1" style={{ color: C.text }}>
            {steps[stepIdx]}
          </h2>
          <p className="text-sm" style={{ color: C.muted }}>
            Your personalised health report is being generated.
          </p>
        </div>
        {/* Progress bar */}
        <div
          className="h-1.5 rounded-full overflow-hidden mx-auto w-48"
          style={{ backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-[2000ms] ease-out"
            style={{
              width: stepIdx === 0 ? "30%" : stepIdx === 1 ? "65%" : "90%",
              background: "linear-gradient(90deg, #0FBB7D, #059669)",
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function PreLoginAssessmentPage() {
  const { isDark } = useTheme();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [question, setQuestion] = useState<Question | null>(null);
  const [answers, setAnswers] = useState<Record<string, string | number | boolean>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  // "generating" = assessment done, now building AI recommendations in background
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  const C = {
    bg: isDark ? "#0A0F1C" : "#F4F7FB",
    cardBg: isDark ? "#141928" : "#FFFFFF",
    border: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)",
    text: isDark ? "#F9FAFB" : "#0F172A",
    muted: isDark ? "#8B95A8" : "#64748B",
    primary: "#0FBB7D",
    primaryFaint: isDark ? "rgba(15,187,125,0.10)" : "rgba(15,187,125,0.07)",
  };

  useEffect(() => {
    groqService.reset();
    loadQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadQuestion = async () => {
    setLoading(true);
    setVisible(false);
    try {
      const next = await groqService.getNextQuestion();

      if (!next) {
        // ── ASSESSMENT COMPLETE ─────────────────────────────────────────────
        // Show "generating" screen immediately so user doesn't see a blank
        setGenerating(true);
        setLoading(false);
      
        const assessment = await groqService.generateRiskAssessment();
        const allAnswers = groqService.getAnswers();
      
        // Save assessment to localStorage (0 XP — pre-login users earn no XP)
        holdAssessmentLocally(assessment, allAnswers, 0);
      
        // Generate recommendations first, then store them
        try {
          // First generate recommendations from the assessment
          const recommendations = await groqService.generateRecommendations(assessment);
          
          // Then store them with the assessment and answers
          await holdRecommendationsLocally(assessment, allAnswers, recommendations);
        } catch (error) {
          console.error("Failed to generate recommendations:", error);
          // Still proceed even if recommendations fail - user can regenerate later
        }
      
        // Navigate to review — the review page reads from sessionStorage/localStorage
        try {
          sessionStorage.setItem(
            "hmex_review",
            JSON.stringify({ 
              assessment, 
              answers: allAnswers, 
              xpEarned: 0 
            })
          );
        } catch { /* private mode */ }
      
        router.push("/review");
        return;
      }

      const patched =
        next.type === "yesno" && !next.options
          ? { ...next, options: ["Yes", "No"] }
          : next;

      setQuestion(patched);
      setTimeout(() => {
        setLoading(false);
        setVisible(true);
      }, 80);
    } catch {
      setError("Could not load the next question. Please try again.");
      setLoading(false);
    }
  };

  const currentAnswer = question ? answers[question.id] : undefined;
  const hasAnswer =
    currentAnswer !== undefined && currentAnswer !== "" && currentAnswer !== null;
  const progress = Math.min(
    100,
    Math.round((step / groqService.getMaxQuestions()) * 100)
  );

  const handleSelect = (value: string | number | boolean) => {
    if (!question) return;
    setAnswers(prev => ({ ...prev, [question.id]: value }));
    setError(null);
  };

  const handleNext = async () => {
    if (!question) return;
    if (question.id === "height_weight") {
      const h = answers["_height"];
      const w = answers["_weight"];
      if (!h || !w) {
        setError("Please enter both your height and weight.");
        return;
      }
      groqService.saveAnswer(question, `${h}/${w}`);
    } else {
      if (question.required && !hasAnswer) {
        setError("Please answer this question to continue.");
        return;
      }
      groqService.saveAnswer(question, currentAnswer ?? "");
    }
    setVisible(false);
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 280));
    setStep(s => s + 1);
    await loadQuestion();
    setSubmitting(false);
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(s => s - 1);
      setError(null);
    }
  };

  // ── WAIST ─────────────────────────────────────────────────────────────────
  const renderWaistCircumference = () => (
    <div className="space-y-4">
      <p className="text-sm text-center pb-1" style={{ color: C.muted }}>
        Pick the body shape that most closely matches yours
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {WAIST_OPTIONS.map(opt => {
          const sel = currentAnswer === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              className="flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
              style={{
                backgroundColor: sel ? C.primaryFaint : C.cardBg,
                borderColor: sel ? C.primary : C.border,
                boxShadow: sel ? `0 0 0 3px ${C.primary}22` : "none",
              }}
            >
              <div className="relative w-full h-28 rounded-xl overflow-hidden">
                <Image src={opt.img} alt={opt.label} fill className="object-contain" />
              </div>
              <div className="text-center">
                <p className="text-xs font-bold" style={{ color: sel ? C.primary : C.text }}>
                  {opt.label}
                </p>
                <p className="text-[10px] leading-tight mt-0.5" style={{ color: C.muted }}>
                  {opt.hint}
                </p>
              </div>
              {sel && <CheckCircle size={16} style={{ color: C.primary }} />}
            </button>
          );
        })}
      </div>
    </div>
  );

  // ── HEIGHT / WEIGHT ───────────────────────────────────────────────────────
  const renderHeightWeight = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        {[
          { key: "_height", label: "Height", unit: "cm", placeholder: "e.g. 170" },
          { key: "_weight", label: "Weight", unit: "kg", placeholder: "e.g. 72" },
        ].map(({ key, label, unit, placeholder }) => (
          <div key={key}>
            <label
              className="block mb-2 text-xs font-bold uppercase tracking-widest"
              style={{ color: C.muted }}
            >
              {label}
            </label>
            <div className="relative">
              <input
                type="number"
                placeholder={placeholder}
                value={String(answers[key] ?? "")}
                onChange={e => {
                  setAnswers(prev => ({ ...prev, [key]: e.target.value }));
                  setError(null);
                }}
                className="w-full px-4 py-3.5 pr-12 rounded-xl border-2 text-base focus:outline-none transition-all"
                style={{
                  backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#F8FAFC",
                  borderColor: C.border,
                  color: C.text,
                }}
              />
              <span
                className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold"
                style={{ color: C.muted }}
              >
                {unit}
              </span>
            </div>
          </div>
        ))}
      </div>
      <p className="text-center text-sm" style={{ color: C.muted }}>
        We&apos;ll calculate your BMI automatically.
      </p>
    </div>
  );

  // ── DIET IMAGES ───────────────────────────────────────────────────────────
  const renderDietImages = () => {
    if (question?.id !== "vegetables_fruits") return null;
    return (
      <div className="grid grid-cols-2 gap-3 mb-5">
        {[
          {
            src: "/assets/images/diets.png",
            caption: "Vegetables, fruits & berries protect blood sugar and blood pressure.",
          },
          {
            src: "/assets/images/drinks.png",
            caption: "What you drink matters too — water and low-sugar drinks protect metabolic health.",
          },
        ].map(({ src, caption }) => (
          <div
            key={src}
            className="overflow-hidden rounded-xl border"
            style={{ borderColor: C.border }}
          >
            <div className="relative w-full h-32">
              <Image src={src} alt={caption} fill className="object-cover" />
            </div>
            <div className="p-3">
              <p className="text-[11px] leading-relaxed" style={{ color: C.muted }}>
                {caption}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // ── OPTIONS ───────────────────────────────────────────────────────────────
  const renderOptions = () => {
    if (!question?.options) return null;
    const isYesNo = question.type === "yesno";
    return (
      <div className={`grid gap-2.5 ${isYesNo ? "grid-cols-2" : "grid-cols-1"}`}>
        {question.options.map((opt, i) => {
          const sel = currentAnswer === opt;
          const isYes = opt === "Yes" || opt === "yes";
          return (
            <button
              key={i}
              onClick={() => handleSelect(opt)}
              className="flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 text-left transition-all duration-200 hover:scale-[1.01] active:scale-[0.98]"
              style={{
                backgroundColor: sel
                  ? C.primaryFaint
                  : isDark
                  ? "rgba(255,255,255,0.02)"
                  : "#FAFBFC",
                borderColor: sel ? C.primary : C.border,
                boxShadow: sel ? `0 0 0 3px ${C.primary}18` : "none",
              }}
            >
              {isYesNo ? (
                <div
                  className="flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold shrink-0"
                  style={{
                    backgroundColor: sel
                      ? C.primary
                      : isDark
                      ? "rgba(255,255,255,0.08)"
                      : "rgba(0,0,0,0.05)",
                    color: sel ? "#fff" : C.muted,
                  }}
                >
                  {isYes ? "✓" : "✕"}
                </div>
              ) : (
                <div
                  className="w-4 h-4 rounded-full border-2 shrink-0 transition-all"
                  style={{
                    borderColor: sel ? C.primary : C.border,
                    backgroundColor: sel ? C.primary : "transparent",
                  }}
                />
              )}
              <span
                className="text-sm leading-snug"
                style={{ color: sel ? C.primary : C.text, fontWeight: sel ? 600 : 400 }}
              >
                {opt}
              </span>
            </button>
          );
        })}
      </div>
    );
  };

  // ── SLIDER ────────────────────────────────────────────────────────────────
  const renderSlider = () => {
    if (question?.type !== "slider") return null;
    const val = Number(currentAnswer ?? question.min ?? 0);
    const min = question.min ?? 0;
    const max = question.max ?? 100;
    const pct = ((val - min) / (max - min)) * 100;

    return (
      <div className="space-y-6">
        <div className="text-center space-y-1">
          <div className="text-6xl font-black tabular-nums" style={{ color: C.primary }}>
            {val}
          </div>
          <div
            className="text-sm font-semibold uppercase tracking-wider"
            style={{ color: C.muted }}
          >
            {question.unit}
          </div>
        </div>
        <div className="relative pt-2 pb-8 px-2">
          <div
            className="h-3 rounded-full overflow-hidden"
            style={{
              backgroundColor: isDark
                ? "rgba(255,255,255,0.06)"
                : "rgba(0,0,0,0.06)",
            }}
          >
            <div
              className="h-full rounded-full transition-all duration-100"
              style={{
                width: `${pct}%`,
                background: "linear-gradient(90deg, #0FBB7D, #059669)",
              }}
            />
          </div>
          <input
            type="range"
            min={min}
            max={max}
            value={val}
            onChange={e => handleSelect(Number(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div
            className="absolute top-0.5 w-7 h-7 rounded-full shadow-lg border-4 border-white pointer-events-none transition-all duration-100"
            style={{ left: `calc(${pct}% - 14px)`, backgroundColor: C.primary }}
          />
        </div>
        <div
          className="flex justify-between text-xs font-semibold"
          style={{ color: C.muted }}
        >
          <span>
            {min} {question.unit}
          </span>
          <span>
            {max} {question.unit}
          </span>
        </div>
      </div>
    );
  };

  // ── GENERATING SCREEN ─────────────────────────────────────────────────────
  if (generating) {
    return <GeneratingScreen isDark={isDark} />;
  }

  // ── INITIAL LOADING ───────────────────────────────────────────────────────
  if (loading && !question) {
    return (
      <div
        className="min-h-screen flex items-center justify-center transition-colors duration-300"
        style={{ backgroundColor: C.bg }}
      >
        <div className="text-center space-y-6">
          <div className="relative inline-flex">
            <div
              className="w-16 h-16 rounded-full border-4 animate-spin"
              style={{
                borderColor: "transparent",
                borderTopColor: C.primary,
                borderRightColor: `${C.primary}33`,
              }}
            />
            <Heart className="absolute inset-0 m-auto w-6 h-6" style={{ color: C.primary }} />
          </div>
          <div>
            <p
              className="text-xs font-bold uppercase tracking-widest mb-2"
              style={{ color: C.primary }}
            >
              Preparing Assessment
            </p>
            <h2 className="text-xl font-bold" style={{ color: C.text }}>
              Personalising your questions…
            </h2>
            <p className="text-sm mt-1" style={{ color: C.muted }}>
              This takes just a moment
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!question && !loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-6"
        style={{ backgroundColor: C.bg }}
      >
        <div className="text-center space-y-4">
          <AlertCircle className="mx-auto w-12 h-12 text-red-500" />
          <h2 className="text-xl font-bold" style={{ color: C.text }}>
            Something went wrong
          </h2>
          <p className="text-sm" style={{ color: C.muted }}>
            Unable to load questions. Please refresh and try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 rounded-xl font-semibold text-white"
            style={{ background: `linear-gradient(135deg, ${C.primary}, #059669)` }}
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  // ── MAIN RENDER ───────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen transition-colors duration-300"
      style={{ backgroundColor: C.bg }}
    >
      <Navbar />

      <div className="max-w-2xl mx-auto px-5 py-10 lg:px-8">
        {/* Header */}
        <div className="mb-7 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p
                className="text-[11px] font-bold uppercase tracking-widest mb-0.5"
                style={{ color: question?.aiGenerated ? "#8B5CF6" : C.primary }}
              >
                {question?.aiGenerated ? "✦ AI Personalised" : getCategoryLabel(step)}
              </p>
              <p className="text-sm" style={{ color: C.muted }}>
                Question {step} of {groqService.getMaxQuestions()}
              </p>
            </div>
            <span
              className="text-sm font-bold tabular-nums"
              style={{ color: C.muted }}
            >
              {progress}%
            </span>
          </div>
          <ProgressDots total={groqService.getMaxQuestions()} current={step - 1} />
        </div>

        {/* Card */}
        <div
          className="rounded-2xl border overflow-hidden transition-all duration-300"
          style={{
            backgroundColor: C.cardBg,
            borderColor: C.border,
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(18px)",
            boxShadow: isDark
              ? "0 8px 32px rgba(0,0,0,0.4)"
              : "0 8px 32px rgba(0,0,0,0.06)",
          }}
        >
          {/* Card header */}
          <div
            className="flex items-start gap-4 p-6 border-b"
            style={{ borderColor: C.border }}
          >
            <div
              className="flex items-center justify-center w-11 h-11 rounded-xl shrink-0"
              style={{
                backgroundColor: question?.aiGenerated
                  ? "rgba(139,92,246,0.12)"
                  : C.primaryFaint,
                color: question?.aiGenerated ? "#8B5CF6" : C.primary,
              }}
            >
              {ICON_MAP[question?.id ?? ""] ?? <Activity className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <h2
                className="text-[17px] font-bold leading-snug mb-1.5"
                style={{ color: C.text }}
              >
                {question?.question}
              </h2>
              <p className="text-[13px] leading-relaxed" style={{ color: C.muted }}>
                {SUBTITLES[question?.id ?? ""] ?? SUBTITLES.default}
              </p>
            </div>
            {question?.aiGenerated && (
              <span
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider shrink-0"
                style={{ backgroundColor: "rgba(139,92,246,0.12)", color: "#8B5CF6" }}
              >
                <Sparkles className="w-3 h-3" />
                AI
              </span>
            )}
          </div>

          {/* Card body */}
          <div className="p-6 space-y-4">
            {error && (
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm"
                style={{
                  backgroundColor: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  color: "#EF4444",
                }}
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            {question?.aiGenerated && (
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm"
                style={{
                  backgroundColor: "rgba(139,92,246,0.07)",
                  border: "1px solid rgba(139,92,246,0.15)",
                  color: "#8B5CF6",
                }}
              >
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>This question was tailored to your personal risk profile.</span>
              </div>
            )}

            {renderDietImages()}

            {question?.id === "waist_circumference" && renderWaistCircumference()}
            {question?.id === "height_weight" && renderHeightWeight()}
            {question?.type === "slider" &&
              question.id !== "height_weight" &&
              renderSlider()}
            {question?.options &&
              question.id !== "waist_circumference" &&
              renderOptions()}
            {question?.type === "text" && question.id !== "height_weight" && (
              <input
                type="text"
                placeholder="Type your answer…"
                value={String(currentAnswer ?? "")}
                onChange={e => handleSelect(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl border-2 text-base focus:outline-none transition-all"
                style={{
                  backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#F8FAFC",
                  borderColor: C.border,
                  color: C.text,
                }}
              />
            )}

            {question?.tooltip && (
              <div
                className="flex items-start gap-3 px-4 py-3 rounded-xl text-[12px] leading-relaxed"
                style={{
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.03)"
                    : "rgba(0,0,0,0.02)",
                  color: C.muted,
                }}
              >
                <Info className="w-4 h-4 mt-0.5 shrink-0" />
                {question.tooltip}
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-7 flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={step === 1}
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-0 disabled:pointer-events-none"
            style={{
              color: C.muted,
              backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
            }}
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          <button
            onClick={handleNext}
            disabled={submitting}
            className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-50"
            style={{
              background: `linear-gradient(135deg, ${C.primary}, #059669)`,
              boxShadow: "0 4px 16px rgba(15,187,125,0.28)",
            }}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analysing…
              </>
            ) : groqService.getQuestionCount() >= groqService.getMaxQuestions() ? (
              "View Results"
            ) : (
              <>
                Continue
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        <p
          className="mt-8 text-center text-[11px]"
          style={{
            color: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.25)",
          }}
        >
          Based on FINDRISC & Framingham validated frameworks · Private & confidential
        </p>
      </div>
    </div>
  );
}