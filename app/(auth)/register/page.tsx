/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import { claimPendingAssessment, getPendingAssessment } from "@/services/AppwriteService";
import { claimPendingRecommendations, getPendingRecommendations } from "@/services/RecommendationService";
import OAuthCallbackHandler from "@/components/OAuthCallbackHandler";
import { getDashboardPath, type UserRole } from "@/services/userService";
import {
  Sun, Moon, Mail, Lock, User, Eye, EyeOff,
  Check, AlertCircle, ArrowRight, Loader2, CheckCircle, Sparkles, Briefcase,
} from "lucide-react";
import ThemeToggle from "@/components/Themetoggle";

export const dynamic = "force-dynamic";

// ─── Lottie ───────────────────────────────────────────────────────────────────
function HealthLottie() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let anim: any;
    let cancelled = false;
    import("lottie-web").then((lottie) => {
      if (cancelled || !containerRef.current) return;
      anim = lottie.default.loadAnimation({
        container: containerRef.current, renderer: "svg", loop: true, autoplay: true,
        path: "/animations/health-animation.json",
      });
      anim.addEventListener("DOMLoaded", () => { if (!cancelled) setLoaded(true); });
    });
    return () => { cancelled = true; anim?.destroy(); };
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-2 animate-spin"
            style={{ borderColor: "#0FBB7D", borderTopColor: "transparent" }} />
        </div>
      )}
      <div ref={containerRef} className="w-full h-full"
        style={{ opacity: loaded ? 1 : 0, transition: "opacity 0.5s ease" }} />
    </div>
  );
}

// ─── Role Toggle ──────────────────────────────────────────────────────────────
interface RoleToggleProps {
  role:     UserRole;
  onChange: (role: UserRole) => void;
  accent:   string;
  surface:  any;
  isDark:   boolean;
}

function RoleToggle({ role, onChange, accent, surface, isDark }: RoleToggleProps) {
  const isEmployer = role === "employer";
  return (
    <div className="mb-6">
      <div
        className="relative flex items-center p-1"
        style={{
          background: isDark ? "rgba(0,0,0,0.25)" : "rgba(0,0,0,0.05)",
          border:     `1px solid ${surface.border}`,
          // No border radius — sharp corners as requested
        }}
      >
        {/* Sliding indicator */}
        <motion.div
          layout
          transition={{ type: "spring", stiffness: 400, damping: 35 }}
          style={{
            position:   "absolute",
            top:        4,
            bottom:     4,
            left:       isEmployer ? "calc(50% + 4px)" : 4,
            width:      "calc(50% - 8px)",
            background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
            boxShadow:  `0 1px 8px ${accent}44`,
          }}
        />
        {/* User tab */}
        <button
          onClick={() => onChange("user")}
          className="relative z-10 flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold transition-colors duration-200"
          style={{ color: !isEmployer ? "#fff" : surface.muted }}
        >
          <User size={14} />
          <span>Member</span>
        </button>
        {/* Employer tab */}
        <button
          onClick={() => onChange("employer")}
          className="relative z-10 flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold transition-colors duration-200"
          style={{ color: isEmployer ? "#fff" : surface.muted }}
        >
          <Briefcase size={14} />
          <span>Employer</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.p key={role} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.18 }} className="text-xs mt-2 text-center" style={{ color: surface.muted }}>
          {isEmployer
            ? "Create an employer account to manage your organisation's health programmes"
            : "Create a personal account to track and improve your health"}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SignUpPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { signUp, loginWithGoogle, loading, error, clearError, user } = useAuth();
  const { isDark, toggleTheme, surface, accentColor } = useTheme();

  const [mounted,              setMounted]              = useState(false);
  // Pre-select role from query param (?role=employer) so the login page "Sign up" link works
  const [role,                 setRole]                 = useState<UserRole>("user");
  const [formData,             setFormData]             = useState({
    fullName: "", email: "", password: "", confirmPassword: "",
    // employer-only extra fields
    companyName: "", industry: "",
  });
  const [validationError,      setValidationError]      = useState<string | null>(null);
  const [showPassword,         setShowPassword]         = useState(false);
  const [showConfirmPassword,  setShowConfirmPassword]  = useState(false);
  const [focusedField,         setFocusedField]         = useState<string | null>(null);
  const [passwordStrength,     setPasswordStrength]     = useState(0);
  const [signupSuccess,        setSignupSuccess]        = useState(false);
  const [newUserId,            setNewUserId]            = useState<string | null>(null);
  const [savingAssessment,     setSavingAssessment]     = useState(false);
  const [assessmentSaved,      setAssessmentSaved]      = useState(false);
  const [hasPendingAssessment, setHasPendingAssessment] = useState(false);
  const [savingRecommendations, setSavingRecommendations] = useState(false);
  const [recommendationsSaved, setRecommendationsSaved] = useState(false);
  const [hasPendingReco,       setHasPendingReco]       = useState(false);
  const [agreedToTerms,        setAgreedToTerms]        = useState(false);
  const [termsError,           setTermsError]           = useState(false);
  const savedAssessmentIdRef = useRef<string | null>(null);

  useEffect(() => {
    setMounted(true);
    // Read role from query string
    const qRole = searchParams.get("role");
    if (qRole === "employer") setRole("employer");

    // Only relevant for user role (employers don't get assessments)
    const pending = getPendingAssessment();
    setHasPendingAssessment(!!pending);
    setHasPendingReco(!!getPendingRecommendations());
  }, [searchParams]);

  useEffect(() => {
    if (user && !signupSuccess) router.push(getDashboardPath("user"));
  }, [user, router, signupSuccess]);

  useEffect(() => {
    let strength = 0;
    const pw = formData.password;
    if (pw.length >= 8)           strength += 25;
    if (/[A-Z]/.test(pw))         strength += 25;
    if (/[0-9]/.test(pw))         strength += 25;
    if (/[^A-Za-z0-9]/.test(pw)) strength += 25;
    setPasswordStrength(strength);
  }, [formData.password]);

  useEffect(() => {
    if (signupSuccess && user && !newUserId) {
      const uid = (user as any).$id || (user as any).uid || (user as any).id;
      if (uid) setNewUserId(uid);
    }
  }, [user, signupSuccess, newUserId]);

  // Only claim pending data for regular users — employers don't have assessments
  useEffect(() => {
    if (!newUserId || !hasPendingAssessment || role === "employer") return;
    setSavingAssessment(true);
    claimPendingAssessment(newUserId)
      .then((saved) => { if (saved) { savedAssessmentIdRef.current = saved.$id; setAssessmentSaved(true); } })
      .catch((err) => console.error("Failed to claim assessment:", err))
      .finally(() => setSavingAssessment(false));
  }, [newUserId, hasPendingAssessment, role]);

  useEffect(() => {
    if (!assessmentSaved || !newUserId || !hasPendingReco || role === "employer") return;
    const assessmentId = savedAssessmentIdRef.current;
    if (!assessmentId) return;
    setSavingRecommendations(true);
    claimPendingRecommendations(newUserId, assessmentId)
      .then((saved) => { if (saved) setRecommendationsSaved(true); })
      .catch((err) => console.error("Failed to claim recommendations:", err))
      .finally(() => setSavingRecommendations(false));
  }, [assessmentSaved, newUserId, hasPendingReco, role]);

  useEffect(() => {
    if (!newUserId || hasPendingAssessment || !hasPendingReco || role === "employer") return;
    setSavingRecommendations(true);
    claimPendingRecommendations(newUserId, "unlinked")
      .then((saved) => { if (saved) setRecommendationsSaved(true); })
      .catch(console.error)
      .finally(() => setSavingRecommendations(false));
  }, [newUserId, hasPendingAssessment, hasPendingReco, role]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearError();
    setValidationError(null);
    setTermsError(false);
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validate = () => {
    if (!agreedToTerms) { setTermsError(true); setValidationError("Please agree to the Terms of Service to continue."); return false; }
    if (!formData.fullName.trim())                                    { setValidationError("Please enter your full name"); return false; }
    if (role === "employer" && !formData.companyName.trim())          { setValidationError("Please enter your company name"); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))          { setValidationError("Please enter a valid email"); return false; }
    if (formData.password.length < 8)                                 { setValidationError("Password must be at least 8 characters"); return false; }
    if (formData.password !== formData.confirmPassword)               { setValidationError("Passwords don't match"); return false; }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const result = await signUp({
      fullName: formData.fullName.trim(),
      email:    formData.email.trim(),
      password: formData.password,
      role,
    });
    if (result !== undefined) {
      const uid = (result as any).$id || (result as any).userId || (result as any).id;
      if (uid) setNewUserId(uid);
    }
    if (!error) setSignupSuccess(true);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) handleSubmit();
  };

  const getStrengthColor = () => {
    if (passwordStrength < 25) return "#F04438";
    if (passwordStrength < 50) return "#F79009";
    if (passwordStrength < 75) return "#0FB6C8";
    return "#0FBB7D";
  };
  const getStrengthText = () => {
    if (passwordStrength < 25) return "Weak";
    if (passwordStrength < 50) return "Fair";
    if (passwordStrength < 75) return "Good";
    return "Strong";
  };

  const isSaving   = savingAssessment || savingRecommendations;
  const isEmployer = role === "employer";

  if (!mounted) return null;

  const colors = {
    bg: surface.bg, surface: surface.surface, border: surface.border,
    text: surface.text, muted: surface.muted, subtle: surface.subtle,
    primary: accentColor, secondary: "#0FB6C8",
  };

  const benefits = isEmployer
    ? [
        "Set up your organisation's health programme",
        "Access aggregated workforce health insights",
        "No per-employee cost to get started",
        "Employee data stays private — always",
      ]
    : [
        "Your health insights are always safe and ready for you",
        "Free health assessments",
        "No credit card required",
        "Your data stays private and secure",
      ];

  // ── Terms Checkbox ─────────────────────────────────────────────────────────
  const TermsCheckbox = (
    <div
      onClick={() => { setAgreedToTerms(v => !v); setTermsError(false); setValidationError(null); }}
      style={{
        display: "flex", alignItems: "flex-start", gap: 10,
        padding: "10px 12px",
        background: termsError ? "rgba(239,68,68,0.07)" : agreedToTerms ? `${colors.primary}0D` : isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
        border: `1px solid ${termsError ? "rgba(239,68,68,0.3)" : agreedToTerms ? `${colors.primary}35` : colors.border}`,
        cursor: "pointer", userSelect: "none" as const, transition: "all 0.15s", borderRadius: 2,
      }}
    >
      <div style={{
        width: 18, height: 18, flexShrink: 0, marginTop: 1,
        border: `2px solid ${termsError ? "#ef4444" : agreedToTerms ? colors.primary : colors.border}`,
        background: agreedToTerms ? colors.primary : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.15s", borderRadius: 2,
      }}>
        {agreedToTerms && <Check size={11} strokeWidth={3} color="#fff" />}
      </div>
      <p style={{ fontSize: 12, color: colors.muted, lineHeight: 1.55, margin: 0 }}>
        I have read and agree to the{" "}
        <Link href="/terms" onClick={e => e.stopPropagation()}
          style={{ color: colors.primary, fontWeight: 700, textDecoration: "underline", textUnderlineOffset: 3 }}>
          Terms of Service
        </Link>
        {isEmployer
          ? " of Health Master. By creating an employer account, I confirm I have authority to enrol my organisation."
          : " of Health Master. By creating an account, I acknowledge that HMEX is a preventive tool and not a substitute for medical advice."}
      </p>
    </div>
  );

  // ── Success Content ────────────────────────────────────────────────────────
  const SuccessContent = (
    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }} className="text-center">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="flex items-center justify-center mx-auto mb-5 w-16 h-16"
        style={{ background: `color-mix(in srgb, ${colors.primary} 15%, transparent)`, borderRadius: 2 }}>
        {isEmployer ? <Briefcase className="w-8 h-8" style={{ color: colors.primary }} /> : <CheckCircle className="w-8 h-8" style={{ color: colors.primary }} />}
      </motion.div>

      <motion.h2 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="text-2xl font-black mb-1" style={{ letterSpacing: "-0.04em", color: colors.text }}>
        {isEmployer ? `Welcome, ${formData.companyName || formData.fullName.split(" ")[0]}!` : `Welcome, ${formData.fullName.split(" ")[0] || "there"}!`}
      </motion.h2>

      <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        className="text-sm mb-6" style={{ color: colors.muted }}>
        {isEmployer
          ? "Your employer account has been created. Set up your organisation's health programme."
          : "Your account has been created successfully."}
      </motion.p>

      {/* Only show pending assessment/reco saving for regular users */}
      {!isEmployer && hasPendingAssessment && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="mb-4 p-4 text-left"
          style={{ background: isDark ? `${colors.primary}14` : `${colors.primary}0F`, border: `1px solid ${colors.primary}30`, borderRadius: 2 }}>
          <div className="flex items-start gap-3">
            <div className="shrink-0 mt-0.5">
              {savingAssessment ? <Loader2 className="w-4 h-4 animate-spin" style={{ color: colors.primary }} />
                : assessmentSaved ? <CheckCircle className="w-4 h-4" style={{ color: colors.primary }} />
                : <Sparkles className="w-4 h-4" style={{ color: colors.primary }} />}
            </div>
            <div>
              <p className="text-xs font-semibold mb-0.5" style={{ color: colors.primary }}>
                {savingAssessment ? "Saving your health assessment..." : assessmentSaved ? "Assessment saved to your account" : "Health assessment found"}
              </p>
              <p className="text-xs" style={{ color: colors.muted }}>
                {savingAssessment ? "Linking your results to your new account." : assessmentSaved ? "Your results are saved and ready in your dashboard." : "Your recent health assessment will be saved."}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {!isEmployer && hasPendingReco && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.44 }}
          className="mb-6 p-4 text-left"
          style={{ background: isDark ? `${colors.primary}14` : `${colors.primary}0F`, border: `1px solid ${colors.primary}30`, borderRadius: 2 }}>
          <div className="flex items-start gap-3">
            <div className="shrink-0 mt-0.5">
              {savingRecommendations ? <Loader2 className="w-4 h-4 animate-spin" style={{ color: colors.primary }} />
                : recommendationsSaved ? <CheckCircle className="w-4 h-4" style={{ color: colors.primary }} />
                : <Sparkles className="w-4 h-4" style={{ color: colors.primary }} />}
            </div>
            <div>
              <p className="text-xs font-semibold mb-0.5" style={{ color: colors.primary }}>
                {savingRecommendations ? "Saving your personalised recommendations..." : recommendationsSaved ? "Recommendations saved to your account" : "AI recommendations ready"}
              </p>
              <p className="text-xs" style={{ color: colors.muted }}>
                {savingRecommendations ? "Linking your recommendations to your account." : recommendationsSaved ? "Your personalised plan is ready in your dashboard." : "Generated during your assessment — will be saved."}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.48 }}
        onClick={() => router.push(getDashboardPath(role))}
        disabled={isSaving}
        className="w-full py-3 px-4 text-sm font-semibold transition-all group"
        style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`, color: "white", opacity: isSaving ? 0.7 : 1, borderRadius: 2 }}>
        <span className="flex items-center justify-center gap-2">
          {isSaving ? <><Loader2 className="w-4 h-4 animate-spin" />Please wait...</>
            : <>{isEmployer ? "Go to Employer Dashboard" : "Go to Dashboard"}<ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>}
        </span>
      </motion.button>

      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        className="text-xs mt-4" style={{ color: colors.muted }}>
        {isEmployer ? "Your organisation's data is encrypted and protected." : "Your health data is encrypted and private."}
      </motion.p>
    </motion.div>
  );

  // ── Shared form body ───────────────────────────────────────────────────────
  const FormBody = ({ compact = false }: { compact?: boolean }) => {
    const px = compact ? "pl-10 pr-3 py-2.5" : "pl-11 pr-4 py-3";
    const inputBase = (field: string): React.CSSProperties => ({
      background:   isDark ? "rgba(0,0,0,0.2)" : colors.surface,
      borderColor:  focusedField === field ? colors.primary : colors.border,
      color:        colors.text, outline: "none", borderRadius: 2,
    });

    return (
      <div className="space-y-4">
        <RoleToggle role={role} onChange={setRole} accent={accentColor} surface={surface} isDark={isDark} />

        {/* Full Name */}
        <div>
          <label className="block text-xs font-semibold mb-2" style={{ color: colors.text }}>
            {isEmployer ? "Your Full Name" : "Full Name"}
          </label>
          <div className="relative">
            <User size={compact ? 16 : 18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: colors.muted }} />
            <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} onKeyPress={handleKeyPress}
              onFocus={() => setFocusedField("name")} onBlur={() => setFocusedField(null)}
              placeholder="John Doe" disabled={loading}
              className={`w-full ${px} text-sm border transition-all`}
              style={inputBase("name")} />
          </div>
        </div>

        {/* Company Name — employer only */}
        <AnimatePresence>
          {isEmployer && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
              <label className="block text-xs font-semibold mb-2" style={{ color: colors.text }}>Company Name</label>
              <div className="relative">
                <Briefcase size={compact ? 16 : 18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: colors.muted }} />
                <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} onKeyPress={handleKeyPress}
                  onFocus={() => setFocusedField("company")} onBlur={() => setFocusedField(null)}
                  placeholder="Acme Health Co." disabled={loading}
                  className={`w-full ${px} text-sm border transition-all`}
                  style={inputBase("company")} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Email */}
        <div>
          <label className="block text-xs font-semibold mb-2" style={{ color: colors.text }}>
            {isEmployer ? "Work Email" : "Email Address"}
          </label>
          <div className="relative">
            <Mail size={compact ? 16 : 18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: colors.muted }} />
            <input type="email" name="email" value={formData.email} onChange={handleChange} onKeyPress={handleKeyPress}
              onFocus={() => setFocusedField("email")} onBlur={() => setFocusedField(null)}
              placeholder={isEmployer ? "you@company.com" : "you@example.com"} disabled={loading}
              className={`w-full ${px} text-sm border transition-all`}
              style={inputBase("email")} />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-semibold mb-2" style={{ color: colors.text }}>Password</label>
          <div className="relative">
            <Lock size={compact ? 16 : 18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: colors.muted }} />
            <input type={showPassword ? "text" : "password"} name="password" value={formData.password}
              onChange={handleChange} onKeyPress={handleKeyPress}
              onFocus={() => setFocusedField("password")} onBlur={() => setFocusedField(null)}
              placeholder="••••••••" disabled={loading}
              className={`w-full ${compact ? "pl-10 pr-10 py-2.5" : "pl-11 pr-11 py-3"} text-sm border transition-all`}
              style={inputBase("password")} />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: colors.muted }}>
              {showPassword ? <EyeOff size={compact ? 16 : 18} /> : <Eye size={compact ? 16 : 18} />}
            </button>
          </div>
          {formData.password && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-2 space-y-1">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-1 flex-1 transition-all"
                    style={{ background: passwordStrength >= i * 25 ? getStrengthColor() : colors.border, borderRadius: 2 }} />
                ))}
              </div>
              <p className="text-xs font-medium" style={{ color: getStrengthColor() }}>{getStrengthText()} password</p>
            </motion.div>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-xs font-semibold mb-2" style={{ color: colors.text }}>Confirm Password</label>
          <div className="relative">
            <Lock size={compact ? 16 : 18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: colors.muted }} />
            <input type={showConfirmPassword ? "text" : "password"} name="confirmPassword" value={formData.confirmPassword}
              onChange={handleChange} onKeyPress={handleKeyPress}
              onFocus={() => setFocusedField("confirm")} onBlur={() => setFocusedField(null)}
              placeholder="••••••••" disabled={loading}
              className={`w-full ${compact ? "pl-10 pr-10 py-2.5" : "pl-11 pr-11 py-3"} text-sm border transition-all`}
              style={inputBase("confirm")} />
            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: colors.muted }}>
              {showConfirmPassword ? <EyeOff size={compact ? 16 : 18} /> : <Eye size={compact ? 16 : 18} />}
            </button>
          </div>
          {formData.confirmPassword && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="mt-1 flex items-center gap-1.5 text-xs font-medium"
              style={{ color: formData.password === formData.confirmPassword ? "#0FBB7D" : "#F04438" }}>
              {formData.password === formData.confirmPassword
                ? <><Check size={12} /> Passwords match</>
                : <><AlertCircle size={12} /> Passwords don&apos;t match</>}
            </motion.div>
          )}
        </div>

        {TermsCheckbox}

        {/* Submit */}
        <button onClick={handleSubmit} disabled={loading} className="w-full py-3 px-4 text-sm font-semibold transition-all mt-2"
          style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`, color: "white", opacity: loading ? 0.7 : 1, borderRadius: 2 }}>
          {loading ? (
            <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Creating...</span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              {isEmployer ? "Create Employer Account" : "Create Account"}
              <ArrowRight size={compact ? 16 : 18} />
            </span>
          )}
        </button>

        {/* Divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t" style={{ borderColor: colors.border }} />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-2" style={{ background: colors.surface, color: colors.muted }}>or continue with</span>
          </div>
        </div>

        {/* Google */}
        <button onClick={loginWithGoogle} disabled={loading}
          className="w-full py-2.5 px-4 text-sm font-medium border flex items-center justify-center gap-2"
          style={{ background: colors.surface, borderColor: colors.border, color: colors.text, borderRadius: 2 }}>
          <svg width={compact ? 16 : 20} height={compact ? 16 : 20} viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>

        <p className="text-center text-sm mt-4" style={{ color: colors.muted }}>
          Already have an account?{" "}
          <Link href={isEmployer ? "/login?role=employer" : "/login"} className="font-semibold" style={{ color: colors.primary }}>Sign in</Link>
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-screen relative" style={{ background: colors.bg }}>
      <OAuthCallbackHandler />

      {/* Theme Toggle */}
      <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={toggleTheme} whileTap={{ scale: 0.9 }}
        className="fixed top-6 right-6 z-50 px-3 py-2 text-xs font-semibold flex items-center gap-2"
        style={{ border: `1px solid ${colors.primary}`, background: `color-mix(in srgb, ${colors.primary} 10%, transparent)`, color: colors.primary, borderRadius: 2 }}>
        <motion.div key={isDark ? "sun" : "moon"} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} transition={{ duration: 0.25 }}>
          {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </motion.div>
        {isDark ? "Light mode" : "Dark mode"}
      </motion.button>

      {/* ── MOBILE ── */}
      <div className="lg:hidden min-h-screen flex flex-col relative">
        <div className="absolute inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80" alt="Health background" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.5)" }} />
        </div>
        <div className="relative z-10 px-5 py-6">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 flex items-center justify-center shadow-sm" style={{ borderRadius: 2 }}>
              <Image src="/white logo.png" alt="Logo" width={120} height={50} className="object-cover w-full h-full" />
            </div>
            <span className="text-xl font-bold text-white">HMEX</span>
          </div>
          <div className="mt-6">
            <p className="text-xs font-medium text-white/80 mb-1">
              {isEmployer ? "Employer Portal" : "For Your Health"}
            </p>
            <h1 className="text-2xl font-bold text-white">
              {isEmployer ? "Workforce Health Management" : "Smart Health Monitoring"}
            </h1>
          </div>
        </div>

        <div className="flex-1 relative z-10 flex flex-col justify-end pb-8">
          <div className="mx-5">
            <div className="p-6" style={{ background: colors.surface, borderRadius: 2 }}>
              <AnimatePresence mode="wait">
                {signupSuccess ? (
                  <motion.div key="mobile-success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {SuccessContent}
                  </motion.div>
                ) : (
                  <motion.div key="mobile-form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <AnimatePresence mode="wait">
                      <motion.div key={`mobile-head-${role}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                        <h2 className="text-2xl font-black mb-1" style={{ letterSpacing: "-0.04em", color: colors.text }}>
                          {isEmployer ? "Create employer account" : "Create account"}
                        </h2>
                        <p className="text-sm mb-6" style={{ color: colors.muted }}>
                          {isEmployer ? "Set up your organisation's health programme" : "Start your health journey today"}
                        </p>
                      </motion.div>
                    </AnimatePresence>

                    {(validationError || error) && (
                      <div className="mb-4 p-3 flex items-start gap-2"
                        style={{ background: isDark ? "rgba(239,68,68,0.1)" : "#FEF2F2", border: `1px solid ${isDark ? "rgba(239,68,68,0.2)" : "#FEE2E2"}`, borderRadius: 2 }}>
                        <AlertCircle size={16} color="#EF4444" className="flex-shrink-0 mt-0.5" />
                        <p className="text-xs" style={{ color: "#EF4444" }}>{validationError || error}</p>
                      </div>
                    )}

                    <FormBody compact />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* ── DESKTOP ── */}
      <div className="hidden lg:block min-h-screen">
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="w-full max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">

              {/* LEFT */}
              <div className="space-y-8">
                <Link href="/" className="inline-flex items-center gap-3 group">
                  <div className="w-10 h-10 flex items-center justify-center shadow-sm" style={{ borderRadius: 2 }}>
                    <Image src="/white logo.png" alt="Logo" width={120} height={50} className="object-cover w-full h-full" />
                  </div>
                  <span className="text-2xl font-bold" style={{ color: colors.text }}>HMEX</span>
                </Link>

                <AnimatePresence mode="wait">
                  <motion.div key={`desktop-left-${role}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="space-y-3">
                    <h1 className="text-5xl font-black leading-tight" style={{ letterSpacing: "-0.04em", color: colors.text }}>
                      {isEmployer ? <>Empower your<br /><span style={{ color: colors.primary }}>team&apos;s health.</span></> : <>Take control of<br />your health.{" "}<span style={{ color: colors.primary }}>Start free.</span></>}
                    </h1>
                    <p className="text-base leading-relaxed max-w-md" style={{ color: colors.muted }}>
                      {isEmployer
                        ? "Launch your organisation's health programme and support your workforce with data-driven insights."
                        : "Join thousands preventing chronic conditions with personalised health insights and AI-powered risk detection."}
                    </p>
                  </motion.div>
                </AnimatePresence>

                <div style={{ height: 360, width: "100%" }}>
                  <HealthLottie />
                </div>

                <AnimatePresence mode="wait">
                  <motion.div key={`desktop-benefits-${role}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="flex flex-col gap-2.5">
                    {benefits.map((benefit) => (
                      <div key={benefit} className="flex items-center gap-3">
                        <div className="w-5 h-5 flex items-center justify-center flex-shrink-0"
                          style={{ background: `color-mix(in srgb, ${colors.primary} 15%, transparent)`, border: `1px solid color-mix(in srgb, ${colors.primary} 30%, transparent)`, borderRadius: 2 }}>
                          <Check className="w-3 h-3" style={{ color: colors.primary }} />
                        </div>
                        <span className="text-sm font-medium" style={{ color: colors.muted }}>{benefit}</span>
                      </div>
                    ))}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* RIGHT */}
              <div className="w-full max-w-md mx-auto lg:mx-0">
                <AnimatePresence mode="wait">
                  {signupSuccess ? (
                    <motion.div key="desktop-success" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.35 }}
                      className="p-8" style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 2 }}>
                      {SuccessContent}
                    </motion.div>
                  ) : (
                    <motion.div key="desktop-form" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.35 }}>
                      <div className="p-8" style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 2 }}>
                        <AnimatePresence mode="wait">
                          <motion.div key={`desktop-form-head-${role}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="mb-6">
                            <h2 className="text-2xl font-black" style={{ letterSpacing: "-0.04em", color: colors.text }}>
                              {isEmployer ? "Create employer account" : "Create account"}
                            </h2>
                            <p className="text-sm mt-1" style={{ color: colors.muted }}>
                              {isEmployer ? "No per-employee cost to get started." : "Free health assessments. No credit card required."}
                            </p>
                          </motion.div>
                        </AnimatePresence>

                        {(validationError || error) && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                            className="mb-6 p-3 flex items-start gap-2"
                            style={{ background: isDark ? "rgba(239,68,68,0.1)" : "#FEF2F2", border: `1px solid ${isDark ? "rgba(239,68,68,0.2)" : "#FEE2E2"}`, borderRadius: 2 }}>
                            <AlertCircle size={16} color="#EF4444" className="flex-shrink-0 mt-0.5" />
                            <p className="text-sm" style={{ color: "#EF4444" }}>{validationError || error}</p>
                          </motion.div>
                        )}

                        <FormBody />

                        <div className="text-center mt-4">
                          <Link href="/" className="text-xs hover:underline underline-offset-4" style={{ color: colors.subtle }}>← Back to home</Link>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>
          </div>
        </div>
      </div>
      <ThemeToggle />
    </div>
  );
}