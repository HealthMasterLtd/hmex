/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Sun, Moon, Mail, Lock, Eye, EyeOff,
  Check, AlertCircle, ArrowRight, Loader2, User, Briefcase, CheckCircle,
} from "lucide-react";
import Image from "next/image";
import ThemeToggle from "@/components/Themetoggle";
import OAuthCallbackHandler from "@/components/OAuthCallbackHandler";
import { getUserProfile, getDashboardPath, type UserRole } from "@/services/userService";

export const dynamic = "force-dynamic";

// ─── Toast ────────────────────────────────────────────────────────────────────
interface ToastProps {
  message: string;
  type: "success" | "error";
  onDone: () => void;
}

function Toast({ message, type, onDone }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onDone, 3500);
    return () => clearTimeout(t);
  }, [onDone]);

  const isSuccess = type === "success";
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="fixed top-6 left-1/2 z-[9999] flex items-center gap-3 px-5 py-3 shadow-2xl"
      style={{
        transform: "translateX(-50%)",
        borderRadius: 0,
        background: isSuccess ? "#0FBB7D" : "#EF4444",
        color: "#fff",
        minWidth: 280,
        maxWidth: 420,
        boxShadow: `0 8px 32px ${isSuccess ? "#0FBB7D44" : "#EF444444"}`,
      }}
    >
      {isSuccess
        ? <CheckCircle size={18} className="flex-shrink-0" />
        : <AlertCircle size={18} className="flex-shrink-0" />}
      <span className="text-sm font-semibold">{message}</span>
      {/* progress bar */}
      <motion.div
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: 3.5, ease: "linear" }}
        style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: 2,
          background: "rgba(255,255,255,0.45)", transformOrigin: "left",
        }}
      />
    </motion.div>
  );
}

// ─── Full-screen Loading Gate ─────────────────────────────────────────────────
// Shown after successful login while we resolve the role and redirect
interface LoadingGateProps {
  accentColor: string;
  isDark: boolean;
  surfaceBg: string;
}

function LoadingGate({ accentColor, isDark, surfaceBg }: LoadingGateProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[9998] flex flex-col items-center justify-center gap-6"
      style={{ background: isDark ? "#0a0a0a" : surfaceBg }}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
        className="flex flex-col items-center gap-4"
      >
        {/* Spinning ring */}
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-full border-2"
            style={{ borderColor: `${accentColor}22` }} />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border-2 border-transparent"
            style={{ borderTopColor: accentColor }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <CheckCircle size={20} style={{ color: accentColor }} />
          </div>
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold" style={{ color: accentColor }}>Signing you in…</p>
          <p className="text-xs mt-1" style={{ color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)" }}>
            Loading your dashboard
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

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
            style={{ borderColor: "#0d9488", borderTopColor: "transparent" }} />
        </div>
      )}
      <div ref={containerRef} className="w-full h-full"
        style={{ opacity: loaded ? 1 : 0, transition: "opacity 0.5s ease" }} />
    </div>
  );
}

// ─── Google Icon ──────────────────────────────────────────────────────────────
function GoogleIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

// ─── Role Toggle ──────────────────────────────────────────────────────────────
interface RoleToggleProps {
  role: UserRole;
  onChange: (r: UserRole) => void;
  accent: string;
  surfaceBorder: string;
  surfaceMuted: string;
  isDark: boolean;
}

function RoleToggle({ role, onChange, accent, surfaceBorder, surfaceMuted, isDark }: RoleToggleProps) {
  const isEmployer = role === "employer";
  return (
    <div className="mb-6">
      <div className="relative flex items-center p-1"
        style={{ background: isDark ? "rgba(0,0,0,0.25)" : "rgba(0,0,0,0.05)", border: `1px solid ${surfaceBorder}` }}>
        <motion.div layout transition={{ type: "spring", stiffness: 400, damping: 35 }}
          style={{
            position: "absolute", top: 4, bottom: 4,
            left: isEmployer ? "calc(50% + 4px)" : 4,
            width: "calc(50% - 8px)",
            background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
            boxShadow: `0 1px 8px ${accent}44`,
          }} />
        <button onClick={() => onChange("user")}
          className="relative z-10 flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold transition-colors duration-200"
          style={{ color: !isEmployer ? "#fff" : surfaceMuted }}>
          <User size={14} /><span>Member</span>
        </button>
        <button onClick={() => onChange("employer")}
          className="relative z-10 flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold transition-colors duration-200"
          style={{ color: isEmployer ? "#fff" : surfaceMuted }}>
          <Briefcase size={14} /><span>Employer</span>
        </button>
      </div>
      <AnimatePresence mode="wait">
        <motion.p key={role} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.18 }} className="text-xs mt-2 text-center" style={{ color: surfaceMuted }}>
          {isEmployer ? "Sign in to your employer portal & manage your workforce health" : "Sign in to your personal health dashboard"}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

// ─── Form Fields ──────────────────────────────────────────────────────────────
// At module level — prevents cursor-jumping remount bug
interface FormFieldsProps {
  compact: boolean;
  role: UserRole;
  onRoleChange: (r: UserRole) => void;
  formData: { email: string; password: string };
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onSubmit: () => void;
  onGoogleLogin: () => void;
  loading: boolean;
  showPassword: boolean;
  onTogglePassword: () => void;
  focusedField: string | null;
  onFocus: (f: string) => void;
  onBlur: () => void;
  accentColor: string;
  accentSecondary: string;
  surfaceBorder: string;
  surfaceText: string;
  surfaceMuted: string;
  surfaceSurface: string;
  surfaceBg: string;
  isDark: boolean;
}

function FormFields({
  compact, role, onRoleChange, formData, onChange, onKeyPress, onSubmit, onGoogleLogin,
  loading, showPassword, onTogglePassword, focusedField, onFocus, onBlur,
  accentColor, accentSecondary, surfaceBorder, surfaceText, surfaceMuted,
  surfaceSurface, surfaceBg, isDark,
}: FormFieldsProps) {
  const isEmployer = role === "employer";
  const iconSize   = compact ? 16 : 18;
  const px         = compact ? "pl-10 pr-3 py-2.5" : "pl-11 pr-4 py-3";
  const pxIcon     = compact ? "pl-10 pr-10 py-2.5" : "pl-11 pr-11 py-3";

  const inputStyle = (field: string): React.CSSProperties => ({
    width: "100%", borderRadius: 0,
    border: `1px solid ${focusedField === field ? accentColor : surfaceBorder}`,
    background: isDark ? "rgba(0,0,0,0.2)" : surfaceBg,
    color: surfaceText, outline: "none", transition: "border-color 0.15s",
  });

  return (
    <div className="space-y-4">
      <RoleToggle
        role={role} onChange={onRoleChange} accent={accentColor}
        surfaceBorder={surfaceBorder} surfaceMuted={surfaceMuted} isDark={isDark}
      />

      {/* Email */}
      <div>
        <label className="block text-xs font-semibold mb-2" style={{ color: surfaceText }}>Email Address</label>
        <div className="relative">
          <Mail size={iconSize} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: surfaceMuted }} />
          <input type="email" name="email" value={formData.email}
            onChange={onChange} onKeyPress={onKeyPress}
            onFocus={() => onFocus("email")} onBlur={onBlur}
            placeholder={isEmployer ? "you@company.com" : "you@example.com"}
            disabled={loading} className={`w-full ${px} text-sm`} style={inputStyle("email")} />
        </div>
      </div>

      {/* Password */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-semibold" style={{ color: surfaceText }}>Password</label>
          <Link href="/forgot-password" className="text-xs font-medium" style={{ color: accentColor }}>Forgot password?</Link>
        </div>
        <div className="relative">
          <Lock size={iconSize} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: surfaceMuted }} />
          <input type={showPassword ? "text" : "password"} name="password" value={formData.password}
            onChange={onChange} onKeyPress={onKeyPress}
            onFocus={() => onFocus("password")} onBlur={onBlur}
            placeholder="••••••••" disabled={loading}
            className={`w-full ${pxIcon} text-sm`} style={inputStyle("password")} />
          <button type="button" onClick={onTogglePassword}
            className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: surfaceMuted, background: "none", border: "none", cursor: "pointer" }}>
            {showPassword ? <EyeOff size={iconSize} /> : <Eye size={iconSize} />}
          </button>
        </div>
      </div>

      {/* Submit */}
      <button onClick={onSubmit} disabled={loading}
        className="w-full py-3 px-4 text-sm font-semibold mt-2 group"
        style={{
          borderRadius: 0, border: "none", cursor: loading ? "not-allowed" : "pointer",
          background: `linear-gradient(135deg, ${accentColor}, ${accentSecondary})`,
          color: "#fff", opacity: loading ? 0.7 : 1, transition: "opacity 0.15s",
        }}>
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Signing in...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            {isEmployer ? "Sign In to Portal" : "Sign In"}
            <ArrowRight size={iconSize} className="group-hover:translate-x-1 transition-transform" />
          </span>
        )}
      </button>

      {/* Divider */}
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t" style={{ borderColor: surfaceBorder }} />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-2" style={{ background: surfaceSurface, color: surfaceMuted }}>or continue with</span>
        </div>
      </div>

      {/* Google */}
      <button onClick={onGoogleLogin} disabled={loading}
        className="w-full py-2.5 px-4 text-sm font-medium flex items-center justify-center gap-2"
        style={{ borderRadius: 0, background: surfaceSurface, border: `1px solid ${surfaceBorder}`, color: surfaceText, cursor: "pointer" }}>
        <GoogleIcon size={compact ? 16 : 20} />
        Continue with Google
      </button>

      <p className="text-center text-sm mt-4" style={{ color: surfaceMuted }}>
        Don&apos;t have an account?{" "}
        <Link href={isEmployer ? "/register?role=employer" : "/register"} className="font-semibold" style={{ color: accentColor }}>Sign up</Link>
      </p>
      <p className="text-center text-xs mt-1" style={{ color: surfaceMuted }}>
        By signing in, you agree to our{" "}
        <Link href="/terms" style={{ color: accentColor, fontWeight: 600 }}>Terms of Service</Link>
      </p>
    </div>
  );
}

// ─── Confetti helper ──────────────────────────────────────────────────────────
async function fireConfetti(accentColor: string) {
  try {
    const confetti = (await import("canvas-confetti")).default;
    const count = 180;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };
    const colors   = [accentColor, "#0FB6C8", "#ffffff", "#a3e635"];

    const fire = (particleRatio: number, opts: object) =>
      confetti({ ...defaults, ...opts, colors, particleCount: Math.floor(count * particleRatio) });

    fire(0.25, { spread: 26, startVelocity: 55, origin: { x: 0.5, y: 0.6 } });
    fire(0.2,  { spread: 60, origin: { x: 0.5, y: 0.6 } });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8, origin: { x: 0.5, y: 0.6 } });
    fire(0.1,  { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2, origin: { x: 0.5, y: 0.6 } });
    fire(0.1,  { spread: 120, startVelocity: 45, origin: { x: 0.5, y: 0.6 } });
  } catch {
    // canvas-confetti not installed — silently skip
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithGoogle, loading, error, clearError, user } = useAuth();
  const { isDark, toggleTheme, surface, accentColor, accentSecondary } = useTheme();

  const [mounted,         setMounted]         = useState(false);
  const [role,            setRole]            = useState<UserRole>("user");
  const [formData,        setFormData]        = useState({ email: "", password: "" });
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showPassword,    setShowPassword]    = useState(false);
  const [focusedField,    setFocusedField]    = useState<string | null>(null);

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Loading gate — shown while we fetch role + redirect
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => setMounted(true), []);

  // When user is set (after login), resolve their role and redirect
  useEffect(() => {
    if (!user) return;
    setRedirecting(true);
    const doRedirect = async () => {
      try {
        const profile = await getUserProfile((user as any).id || (user as any).$id);
        const path    = getDashboardPath(profile?.role ?? "user");
        router.push(path);
      } catch {
        router.push("/dashboard");
      }
    };
    doRedirect();
  }, [user, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearError();
    setValidationError(null);
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validate = () => {
    if (!formData.email.trim() || !formData.password) {
      setValidationError("Please fill in all fields."); return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setValidationError("Please enter a valid email"); return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      await login(formData.email.trim(), formData.password);
      // If login() didn't throw, it succeeded — show toast + confetti
      setToast({ message: "Welcome back! Signing you in…", type: "success" });
      fireConfetti(accentColor);
      // redirecting state is set by the user useEffect above
    } catch (err: any) {
      // login() throws on failure — show error toast
      const msg = err?.message || "Something went wrong. Please try again.";
      setToast({ message: msg, type: "error" });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) handleSubmit();
  };

  const dismissToast = useCallback(() => setToast(null), []);

  if (!mounted) return null;

  const isEmployer  = role === "employer";
  const headingText = isEmployer ? "Employer Portal" : "Welcome back";
  const subText     = isEmployer
    ? "Manage your team's health programmes and insights"
    : "Continue your health journey";

  const benefits = isEmployer
    ? ["Access your workforce health dashboard", "Review aggregated team health insights", "Manage health programmes and benefits", "Your employees' data stays private and protected"]
    : ["Your risk insights and recommendations are always ready for you", "Track your diabetes and hypertension risk over time", "Your health data is private, encrypted, and never sold", "Continue your prevention journey with personalized guidance"];

  // Note: we deliberately do NOT pass `error` from the context into the form
  // anymore — we catch the thrown error directly in handleSubmit and show a toast.
  // This prevents the old inline banner from also appearing.
  const errorMessage = validationError;

  const formFieldsProps: Omit<FormFieldsProps, "compact"> = {
    role, onRoleChange: setRole, formData,
    onChange: handleChange, onKeyPress: handleKeyPress,
    onSubmit: handleSubmit, onGoogleLogin: loginWithGoogle,
    loading, showPassword, onTogglePassword: () => setShowPassword(v => !v),
    focusedField, onFocus: setFocusedField, onBlur: () => setFocusedField(null),
    accentColor, accentSecondary: accentSecondary ?? accentColor,
    surfaceBorder: surface.border, surfaceText: surface.text,
    surfaceMuted: surface.muted, surfaceSurface: surface.surface,
    surfaceBg: surface.bg, isDark,
  };

  return (
    <div className="min-h-screen relative" style={{ background: surface.bg }}>
      <OAuthCallbackHandler />

      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && <Toast key="toast" message={toast.message} type={toast.type} onDone={dismissToast} />}
      </AnimatePresence>

      {/* ── Loading gate ── */}
      <AnimatePresence>
        {redirecting && (
          <LoadingGate key="gate" accentColor={accentColor} isDark={isDark} surfaceBg={surface.bg} />
        )}
      </AnimatePresence>

      {/* Theme Toggle */}
      <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={toggleTheme} whileTap={{ scale: 0.9 }}
        className="fixed top-6 right-6 z-50 px-3 py-2 text-xs font-semibold flex items-center gap-2"
        style={{ borderRadius: 0, border: `1px solid ${accentColor}`, background: `${accentColor}18`, color: accentColor }}>
        <motion.div key={isDark ? "sun" : "moon"} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} transition={{ duration: 0.25 }}>
          {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </motion.div>
        {isDark ? "Light mode" : "Dark mode"}
      </motion.button>

      {/* ── MOBILE ── */}
      <div className="lg:hidden min-h-screen flex flex-col relative">
        <div className="absolute inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=80" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.5)" }} />
        </div>

        <div className="relative z-10 px-5 py-6">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm">
              <Image src="/white logo.png" alt="Logo" width={120} height={50} className="object-cover w-full h-full" />
            </div>
            <span className="text-xl font-bold text-white">HMEX</span>
          </div>
          <div className="mt-6">
            <p className="text-xs font-medium text-white/80 mb-1">{isEmployer ? "Employer Portal" : "For Your Health"}</p>
            <AnimatePresence mode="wait">
              <motion.h1 key={`mob-hero-${role}`} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                className="text-2xl font-bold text-white">
                {isEmployer ? "Workforce Health Management" : "Smart Health Monitoring"}
              </motion.h1>
            </AnimatePresence>
          </div>
        </div>

        <div className="flex-1 relative z-10 flex flex-col justify-end pb-8">
          <div className="mx-5">
            <div className="p-6" style={{ background: surface.surface, borderRadius: 0 }}>
              <AnimatePresence mode="wait">
                <motion.div key={`mob-head-${role}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
                  <h2 className="text-2xl font-black mb-1" style={{ letterSpacing: "-0.04em", color: surface.text }}>{headingText}</h2>
                  <p className="text-sm mb-6" style={{ color: surface.muted }}>{subText}</p>
                </motion.div>
              </AnimatePresence>

              {/* Inline validation error only (auth errors now go to toast) */}
              <AnimatePresence>
                {errorMessage && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                    className="mb-4 p-3 flex items-start gap-2"
                    style={{ borderRadius: 0, background: isDark ? "rgba(239,68,68,0.10)" : "#FEF2F2", border: `1px solid ${isDark ? "rgba(239,68,68,0.2)" : "#FEE2E2"}` }}>
                    <AlertCircle size={16} color="#EF4444" className="flex-shrink-0 mt-0.5" />
                    <p className="text-xs" style={{ color: "#EF4444" }}>{errorMessage}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <FormFields {...formFieldsProps} compact={true} />
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
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm">
                    <Image src="/white logo.png" alt="Logo" width={120} height={50} className="object-cover w-full h-full" />
                  </div>
                  <span className="text-2xl font-bold" style={{ color: surface.text }}>HMEX</span>
                </Link>

                <AnimatePresence mode="wait">
                  <motion.div key={`desk-left-${role}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="space-y-3">
                    <h1 className="text-5xl font-black leading-tight" style={{ letterSpacing: "-0.04em", color: surface.text }}>
                      {isEmployer
                        ? <>Welcome back to<br /><span style={{ color: accentColor }}>your employer hub.</span></>
                        : <>Welcome back to<br /><span style={{ color: accentColor }}>your health journey.</span></>}
                    </h1>
                    <p className="text-base leading-relaxed max-w-md" style={{ color: surface.muted }}>
                      {isEmployer ? "Your workforce health data, programmes, and team insights are waiting for you." : "Your risk insights, progress, and recommendations are waiting for you."}
                    </p>
                  </motion.div>
                </AnimatePresence>

                <div style={{ height: 360, width: "100%" }}><HealthLottie /></div>

                <AnimatePresence mode="wait">
                  <motion.div key={`desk-benefits-${role}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="flex flex-col gap-2.5">
                    {benefits.map((b) => (
                      <div key={b} className="flex items-center gap-3">
                        <div className="w-5 h-5 flex items-center justify-center flex-shrink-0"
                          style={{ borderRadius: 0, background: `${accentColor}18`, border: `1px solid ${accentColor}30` }}>
                          <Check className="w-3 h-3" style={{ color: accentColor }} />
                        </div>
                        <span className="text-sm font-medium" style={{ color: surface.muted }}>{b}</span>
                      </div>
                    ))}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* RIGHT */}
              <div className="w-full max-w-md mx-auto lg:mx-0">
                <div className="p-8" style={{ background: surface.surface, border: `1px solid ${surface.border}`, borderRadius: 0 }}>
                  <AnimatePresence mode="wait">
                    <motion.div key={`desk-head-${role}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }} className="mb-6">
                      <h2 className="text-2xl font-black" style={{ letterSpacing: "-0.04em", color: surface.text }}>{headingText}</h2>
                      <p className="text-sm mt-1" style={{ color: surface.muted }}>{subText}</p>
                    </motion.div>
                  </AnimatePresence>

                  {/* Inline validation error only */}
                  <AnimatePresence>
                    {errorMessage && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        className="mb-6 p-3 flex items-start gap-2"
                        style={{ borderRadius: 0, background: isDark ? "rgba(239,68,68,0.10)" : "#FEF2F2", border: `1px solid ${isDark ? "rgba(239,68,68,0.2)" : "#FEE2E2"}` }}>
                        <AlertCircle size={16} color="#EF4444" className="flex-shrink-0 mt-0.5" />
                        <p className="text-sm" style={{ color: "#EF4444" }}>{errorMessage}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <FormFields {...formFieldsProps} compact={false} />

                  <div className="text-center mt-4">
                    <Link href="/" className="text-xs hover:underline underline-offset-4" style={{ color: surface.subtle }}>← Back to home</Link>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      <ThemeToggle />
    </div>
  );
}