"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle, ArrowRight, RefreshCw, CheckCircle,
  AlertTriangle, Droplet, Heart, TrendingUp, Shield, Zap,
  ChevronDown, ChevronUp, MessageCircle, Lock,
  Star, Activity, CirclePlus, Share2, X,
} from "lucide-react";
import { groqService } from "@/services/GroqService";
import type { DualRiskAssessment } from "@/services/GroqService";
import Navbar from "@/components/landingpage/navbar";
import Footer from "@/components/ui/Footer";
import { useTheme } from "@/contexts/ThemeContext";
import ShareableRiskCard from "@/components/ShareableRiskCard";

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

      <div style={{ height: 8, background: S.surfaceAlt, borderRadius: 99, overflow: "hidden", marginBottom: 16 }}>
        <div style={{
          height: "100%", borderRadius: 99,
          width: vis ? `${meta.pct}%` : "0%",
          background: `linear-gradient(90deg, ${meta.bar}, ${meta.bar}cc)`,
          transition: "width 1.1s ease-out",
        }} />
      </div>

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

// ─── SIGNUP CTA ───────────────────────────────────────────────────────────────
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
        boxShadow: isDark
          ? `0 0 60px ${accentColor}10, 0 8px 32px rgba(0,0,0,0.4)`
          : `0 0 60px ${accentColor}08, 0 8px 32px rgba(0,0,0,0.06)`,
      }}
    >
      <div style={{ position: "absolute", top: -48, right: -48, width: 160, height: 160, borderRadius: "50%", background: `radial-gradient(circle, ${accentColor}22 0%, transparent 70%)`, pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -40, left: -40, width: 128, height: 128, borderRadius: "50%", background: `radial-gradient(circle, ${accentSecondary}18 0%, transparent 70%)`, pointerEvents: "none" }} />

      <div style={{ position: "relative", padding: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <div style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", background: accentFaint, borderRadius: 8 }}>
            <Lock size={14} color={accentColor} />
          </div>
          <div>
            <p style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", color: accentColor, margin: 0 }}>Unlock your full report</p>
            <p style={{ fontSize: 11, color: S.muted, margin: 0 }}>Free — no credit card needed</p>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
          {features.map((feat, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, filter: i >= 2 ? "blur(3px)" : "none", opacity: i >= 2 ? 0.35 : 0.9, transition: "all 0.3s" }}>
              <CheckCircle size={15} style={{ flexShrink: 0, color: i < 2 ? accentColor : S.muted }} />
              <p style={{ fontSize: 13, color: i < 2 ? S.text : S.muted, margin: 0 }}>{feat}</p>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 20 }}>
          {[...Array(5)].map((_, i) => (
            <Star key={i} size={13} style={{ fill: "#f59e0b", color: "#f59e0b" }} />
          ))}
          <span style={{ fontSize: 11, fontWeight: 600, marginLeft: 6, color: S.muted }}>
            Trusted by thousands across East Africa
          </span>
        </div>

        <button
          onClick={onSignup}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            padding: "15px 20px", borderRadius: 12,
            background: `linear-gradient(135deg, ${accentColor}, ${accentSecondary})`,
            border: "none", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer",
            boxShadow: hovered
              ? `0 8px 30px ${accentColor}55, 0 0 0 4px ${accentColor}20`
              : `0 4px 16px ${accentColor}40`,
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

function WaitlistPanel({ isDark, accentColor, accentFaint, onSubmit, name, email, loading, success, error, visible, setVisible, setName, setEmail }: {
  isDark: boolean;
  accentColor: string;
  accentFaint: string;
  onSubmit: () => void;
  name: string;
  email: string;
  loading: boolean;
  success: boolean;
  error: string | null;
  visible: boolean;
  setVisible: (value: boolean) => void;
  setName: (value: string) => void;
  setEmail: (value: string) => void;
}) {
  return (
    <div
      style={{
        borderRadius: 28,
        padding: 28,
        background: isDark
          ? "linear-gradient(180deg, #064e3b 0%, #065f46 45%, #0f766e 100%)"
          : "linear-gradient(180deg, #0f766e 0%, #10b981 45%, #34d399 100%)",
        color: "#f8fafc",
        border: `1px solid ${accentColor}30`,
        boxShadow: `0 20px 60px rgba(0,0,0,0.12)`,
      }}
    >
      <p style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.2em", margin: 0, opacity: 0.9 }}>
        HMEX APP · Coming soon
      </p>
      <h2 style={{ fontSize: "clamp(1.7rem, 3vw, 2.4rem)", fontWeight: 900, margin: "18px 0 16px", lineHeight: 1.05 }}>
        Your results are just the beginning.
      </h2>
      <p style={{ fontSize: 14.5, lineHeight: 1.85, color: "rgba(248,250,252,0.92)", maxWidth: 640, margin: 0 }}>
        The HMEX app turns your risk score into a living prevention plan — tracking your habits, showing your progress, and adjusting every week based on what you actually do.
      </p>

      <div style={{ margin: "24px 0", display: "grid", gap: 10 }}>
        {[
          "90-day prevention plan built around your specific risk factors",
          "Daily micro-actions matched to your conditions",
          "Weekly check-ins with streak tracking",
          "Quarterly reassessment — see your risk actually change",
          "Shareable monthly progress card",
        ].map((item, index) => (
          <div key={item} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#6ee7b7", marginTop: 8 }} />
            <p style={{ fontSize: 13.3, lineHeight: 1.7, color: "rgba(248,250,252,0.92)", margin: 0 }}>{item}</p>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 13, fontStyle: "italic", opacity: 0.88, marginBottom: 20 }}>
        Early access · ~$3/month · Price shown upfront
      </p>

      {success ? (
        <div style={{ padding: 22, borderRadius: 18, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.14)" }}>
          <p style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>You’re on the waitlist.</p>
          <p style={{ fontSize: 13, opacity: 0.9, margin: "10px 0 0" }}>
            We’ve sent your request to the HMEX team and will notify you when early access is available.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {!visible ? (
            <button
              onClick={() => setVisible(true)}
              style={{
                width: "fit-content",
                padding: "14px 24px",
                borderRadius: 14,
                border: "none",
                background: "#10b981",
                color: "#fff",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 12px 30px rgba(16,185,129,0.26)",
              }}
            >
              Join the waitlist
            </button>
          ) : (
            <div style={{ display: "grid", gap: 14 }}>
              <div style={{ display: "grid", gap: 10 }}>
                <input
                  type="text"
                  name="name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.24)",
                    background: "rgba(255,255,255,0.12)",
                    color: "#fff",
                    fontSize: 14,
                  }}
                />
                <input
                  type="email"
                  name="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Your email"
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.24)",
                    background: "rgba(255,255,255,0.12)",
                    color: "#fff",
                    fontSize: 14,
                  }}
                />
              </div>
              {error && <p style={{ fontSize: 13, color: "#fecaca", margin: 0 }}>{error}</p>}
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setVisible(false)}
                  style={{
                    padding: "14px 20px",
                    borderRadius: 14,
                    background: "rgba(255,255,255,0.12)",
                    border: "1px solid rgba(255,255,255,0.18)",
                    color: "#f8fafc",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onSubmit}
                  disabled={loading}
                  style={{
                    padding: "14px 20px",
                    borderRadius: 14,
                    border: "none",
                    background: "#ffffff",
                    color: "#064e3b",
                    fontWeight: 700,
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.75 : 1,
                  }}
                >
                  {loading ? "Sending..." : "Tell Irene"}
                </button>
              </div>
              <p style={{ fontSize: 12, opacity: 0.82, margin: 0 }}>
                We’ll notify the HMEX team that you want early access.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function ReviewPage() {
  const { isDark, surface: S, accentColor, accentFaint } = useTheme();
  const router = useRouter();

  const [assessment, setAssessment] = useState<DualRiskAssessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showShareScreen, setShowShareScreen] = useState(false);
  const [showWaitlistForm, setShowWaitlistForm] = useState(false);
  const [waitlistName, setWaitlistName] = useState("");
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [waitlistStatus, setWaitlistStatus] = useState<"idle"|"success"|"error">("idle");
  const [waitlistError, setWaitlistError] = useState<string | null>(null);

  useEffect(() => { generate(); }, []);

  // lock scroll when share screen is open
  useEffect(() => {
    if (showShareScreen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [showShareScreen]);

  // Escape key closes share screen
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowShareScreen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const generate = async () => {
    setLoading(true); setError(null);
    try { setAssessment(await groqService.generateRiskAssessment()); }
    catch { setError("Failed to generate your assessment. Please try again."); }
    finally { setLoading(false); }
  };

  const handleWaitlistSubmit = async () => {
    setWaitlistError(null);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!waitlistName.trim()) {
      setWaitlistError("Please enter your name.");
      setWaitlistStatus("error");
      return;
    }
    if (!emailRegex.test(waitlistEmail.trim())) {
      setWaitlistError("Please enter a valid email address.");
      setWaitlistStatus("error");
      return;
    }

    setWaitlistLoading(true);
    setWaitlistError(null);
    setWaitlistStatus("idle");

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: waitlistName.trim(), email: waitlistEmail.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to join the waitlist.");
      setWaitlistStatus("success");
      setShowWaitlistForm(false);
      setWaitlistName("");
      setWaitlistEmail("");
    } catch (err) {
      setWaitlistStatus("error");
      setWaitlistError(err instanceof Error ? err.message : "Failed to send waitlist request.");
    } finally {
      setWaitlistLoading(false);
    }
  };

  // derive risk level from assessment for the share card
  const shareRiskLevel = (() => {
    if (!assessment) return "moderate" as const;
    const levels = ["low", "slightly-elevated", "moderate", "high", "very-high"];
    const dIdx = levels.indexOf(assessment.diabetesRisk.level);
    const hIdx = levels.indexOf(assessment.hypertensionRisk.level);
    const worst = Math.max(dIdx, hIdx);
    if (worst <= 0) return "low" as const;
    if (worst <= 2) return "moderate" as const;
    return "high" as const;
  })();

  // ── LOADING ───────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display: "flex", minHeight: "100vh", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 32, background: S.bg, transition: "background 0.4s ease" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, textAlign: "center" }}>
        {/* Clean circular spinner */}
        <div style={{ position: "relative", width: 72, height: 72, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg
            width="72" height="72" viewBox="0 0 72 72" fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ animation: "spin 0.9s linear infinite", position: "absolute", inset: 0 }}
          >
            <circle cx="36" cy="36" r="30" stroke={`${accentColor}20`} strokeWidth="5" fill="none" />
            <path d="M36 6 A30 30 0 0 1 66 36" stroke={accentColor} strokeWidth="5" strokeLinecap="round" fill="none" />
          </svg>
          <Activity size={26} color={accentColor} />
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

        <div style={{ width: 192, height: 5, background: `${accentColor}18`, borderRadius: 99, overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: 99,
            background: accentColor,
            animation: "loadbar 1.8s ease-in-out infinite",
          }} />
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes loadbar {
          0%   { width: 0%;   margin-left: 0%; }
          50%  { width: 70%;  margin-left: 15%; }
          100% { width: 0%;   margin-left: 100%; }
        }
      `}</style>
    </div>
  );

  // ── ERROR ─────────────────────────────────────────────────────────────────
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
    <>
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
            <p style={{ fontSize: 13.5, color: S.muted, maxWidth: "38ch", margin: "0 auto 20px", lineHeight: 1.65 }}>
              Based on your answers and validated clinical frameworks (FINDRISC & Framingham).
              This is a screening tool — not a medical diagnosis.
            </p>

            {/* ── SHARE BUTTON on review page ── */}
            <button
              onClick={() => setShowShareScreen(true)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "10px 20px", borderRadius: 10,
                background: accentFaint,
                border: `1px solid ${accentColor}30`,
                color: accentColor, fontSize: 13, fontWeight: 700,
                cursor: "pointer", transition: "all 0.15s ease",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = "0.8"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
            >
              <Share2 size={14} />
              Share your result
            </button>
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

          <WaitlistPanel
            isDark={isDark}
            accentColor={accentColor}
            accentFaint={accentFaint}
            onSubmit={handleWaitlistSubmit}
            name={waitlistName}
            email={waitlistEmail}
            loading={waitlistLoading}
            success={waitlistStatus === "success"}
            error={waitlistError}
            visible={showWaitlistForm}
            setVisible={(value) => {
              setShowWaitlistForm(value);
              if (!value) setWaitlistError(null);
            }}
            setName={setWaitlistName}
            setEmail={setWaitlistEmail}
          />

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
                <div style={{ borderTop: `1px solid ${S.border}`, padding: "20px", display: "flex", flexDirection: "column", gap: 12 }}>
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
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)", transition: "all 0.15s",
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
                boxShadow: "0 4px 16px rgba(37,211,102,0.3)", transition: "opacity 0.15s",
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

      {/* ── SHARE FULL-SCREEN TAKEOVER ──────────────────────────────────────────
           Covers the entire viewport. Not a modal. Renders above everything.
           Passes the real risk level derived from the assessment.
      ──────────────────────────────────────────────────────────────────────── */}
      {showShareScreen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            backgroundColor: S.bg,
            overflowY: "auto",
            transition: "background 0.3s ease",
          }}
        >
          {/* Sticky top bar */}
          <div
            style={{
              position: "sticky",
              top: 0,
              zIndex: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 20px",
              backgroundColor: S.surface,
              borderBottom: `1px solid ${S.border}`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 32, height: 32,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  backgroundColor: accentFaint,
                  borderRadius: 8,
                }}
              >
                <Share2 size={15} color={accentColor} />
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: S.text, margin: 0, lineHeight: 1.2 }}>
                  Share your result
                </p>
                <p style={{ fontSize: 11, color: S.muted, margin: 0 }}>
                  Create a card · Download as PNG
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowShareScreen(false)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 14px", borderRadius: 8,
                backgroundColor: S.surfaceAlt,
                border: `1px solid ${S.border}`,
                color: S.muted, fontSize: 12, fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <X size={13} />
              Close
            </button>
          </div>

          {/* Card designer */}
          <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 20px 80px" }}>
            <ShareableRiskCard/>
          </div>
        </div>
      )}
    </>
  );
}