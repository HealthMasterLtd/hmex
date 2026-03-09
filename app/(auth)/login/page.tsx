/* eslint-disable react-hooks/static-components */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Sun, Moon, Mail, Lock, Eye, EyeOff,
  Check, AlertCircle, ArrowRight, Loader2,
  User, Briefcase,
} from "lucide-react";
import Image from "next/image";
import ThemeToggle from "@/components/Themetoggle";
import OAuthCallbackHandler from "@/components/OAuthCallbackHandler";
import { getUserProfile, getDashboardPath, type UserRole } from "@/services/userService";

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
        container: containerRef.current,
        renderer: "svg",
        loop: true,
        autoplay: true,
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
        className="relative flex items-center p-1 gap-0"
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

      {/* Contextual hint */}
      <AnimatePresence mode="wait">
        <motion.p
          key={role}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.18 }}
          className="text-xs mt-2 text-center"
          style={{ color: surface.muted }}
        >
          {isEmployer
            ? "Sign in to your employer portal & manage your workforce health"
            : "Sign in to your personal health dashboard"}
        </motion.p>
      </AnimatePresence>
    </div>
  );
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

  useEffect(() => setMounted(true), []);

  // Redirect logged-in users to the correct dashboard based on their role
  useEffect(() => {
    if (!user) return;
    const redirect = async () => {
      const profile = await getUserProfile((user as any).id || (user as any).$id);
      router.push(getDashboardPath(profile?.role ?? "user"));
    };
    redirect();
  }, [user, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearError();
    setValidationError(null);
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
    // login resolves role from DB — the useEffect above handles redirect
    await login(formData.email.trim(), formData.password);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) handleSubmit();
  };

  if (!mounted) return null;

  // ── Contextual copy based on role ──
  const isEmployer   = role === "employer";
  const headingText  = isEmployer ? "Employer Portal" : "Welcome back";
  const subText      = isEmployer
    ? "Manage your team's health programmes and insights"
    : "Continue your health journey";

  const benefits = isEmployer
    ? [
        "Access your workforce health dashboard",
        "Review aggregated team health insights",
        "Manage health programmes and benefits",
        "Your employees' data stays private and protected",
      ]
    : [
        "Your risk insights and recommendations are always ready for you",
        "Track your diabetes and hypertension risk over time",
        "Your health data is private, encrypted, and never sold",
        "Continue your prevention journey with personalized guidance",
      ];

  const inputStyle = (field: string): React.CSSProperties => ({
    width:       "100%",
    borderRadius: 0,
    border:      `1px solid ${focusedField === field ? accentColor : surface.border}`,
    background:  isDark ? "rgba(0,0,0,0.2)" : surface.bg,
    color:       surface.text,
    outline:     "none",
    transition:  "border-color 0.15s",
  });

  const ctaBtn: React.CSSProperties = {
    borderRadius: 0,
    border:      "none",
    background:  `linear-gradient(135deg, ${accentColor}, ${accentSecondary})`,
    color:       "#fff",
    cursor:      "pointer",
    transition:  "opacity 0.15s",
  };

  const secondaryBtn: React.CSSProperties = {
    borderRadius: 0,
    background:  surface.surface,
    border:      `1px solid ${surface.border}`,
    color:       surface.text,
    cursor:      "pointer",
  };

  const ErrorBanner = () => (
    <AnimatePresence>
      {(validationError || error) && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-4 p-3 flex items-start gap-2"
          style={{
            borderRadius: 0,
            background:   isDark ? "rgba(239,68,68,0.10)" : "#FEF2F2",
            border:       `1px solid ${isDark ? "rgba(239,68,68,0.2)" : "#FEE2E2"}`,
          }}
        >
          <AlertCircle size={16} color="#EF4444" className="flex-shrink-0 mt-0.5" />
          <p className="text-xs" style={{ color: "#EF4444" }}>{validationError || error}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const FormFields = ({ compact = false }) => (
    <div className="space-y-4">
      <RoleToggle
        role={role}
        onChange={setRole}
        accent={accentColor}
        surface={surface}
        isDark={isDark}
      />

      {/* Email */}
      <div>
        <label className="block text-xs font-semibold mb-2" style={{ color: surface.text }}>
          Email Address
        </label>
        <div className="relative">
          <Mail size={compact ? 16 : 18} className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: surface.muted }} />
          <input type="email" name="email" value={formData.email}
            onChange={handleChange} onKeyPress={handleKeyPress}
            onFocus={() => setFocusedField("email")} onBlur={() => setFocusedField(null)}
            placeholder={isEmployer ? "you@company.com" : "you@example.com"}
            disabled={loading}
            className={`w-full ${compact ? "pl-10 pr-3 py-2.5" : "pl-11 pr-4 py-3"} text-sm`}
            style={inputStyle("email")}
          />
        </div>
      </div>

      {/* Password */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-semibold" style={{ color: surface.text }}>
            Password
          </label>
          <Link href="/forgot-password" className="text-xs font-medium" style={{ color: accentColor }}>
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <Lock size={compact ? 16 : 18} className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: surface.muted }} />
          <input
            type={showPassword ? "text" : "password"} name="password" value={formData.password}
            onChange={handleChange} onKeyPress={handleKeyPress}
            onFocus={() => setFocusedField("password")} onBlur={() => setFocusedField(null)}
            placeholder="••••••••" disabled={loading}
            className={`w-full ${compact ? "pl-10 pr-10 py-2.5" : "pl-11 pr-11 py-3"} text-sm`}
            style={inputStyle("password")}
          />
          <button type="button" onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: surface.muted, background: "none", border: "none", cursor: "pointer" }}>
            {showPassword ? <EyeOff size={compact ? 16 : 18} /> : <Eye size={compact ? 16 : 18} />}
          </button>
        </div>
      </div>

      {/* Submit */}
      <button onClick={handleSubmit} disabled={loading}
        className="w-full py-3 px-4 text-sm font-semibold mt-2 group"
        style={{ ...ctaBtn, opacity: loading ? 0.7 : 1 }}>
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Signing in...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            {isEmployer ? "Sign In to Portal" : "Sign In"}
            <ArrowRight size={compact ? 16 : 18} className="group-hover:translate-x-1 transition-transform" />
          </span>
        )}
      </button>

      {/* Divider */}
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t" style={{ borderColor: surface.border }} />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-2" style={{ background: surface.surface, color: surface.muted }}>
            or continue with
          </span>
        </div>
      </div>

      {/* Google */}
      <button onClick={loginWithGoogle} disabled={loading}
        className="w-full py-2.5 px-4 text-sm font-medium flex items-center justify-center gap-2"
        style={secondaryBtn}>
        <GoogleIcon size={compact ? 16 : 20} />
        Continue with Google
      </button>

      <p className="text-center text-sm mt-4" style={{ color: surface.muted }}>
        Don&apos;t have an account?{" "}
        <Link
          href={isEmployer ? `/register?role=employer` : "/register"}
          className="font-semibold"
          style={{ color: accentColor }}
        >
          Sign up
        </Link>
      </p>

      <p className="text-center text-xs mt-1" style={{ color: surface.muted }}>
        By signing in, you agree to our{" "}
        <Link href="/terms" style={{ color: accentColor, fontWeight: 600 }}>
          Terms of Service
        </Link>
      </p>
    </div>
  );

  return (
    <div className="min-h-screen relative" style={{ background: surface.bg }}>
      <OAuthCallbackHandler />

      {/* Theme Toggle */}
      <motion.button
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        onClick={toggleTheme} whileTap={{ scale: 0.9 }}
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
          <img
            src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=80"
            alt="Health background" className="w-full h-full object-cover"
          />
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
            <div className="p-6" style={{ background: surface.surface, borderRadius: 0 }}>
              <AnimatePresence mode="wait">
                <motion.div key={role} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
                  <h2 className="text-2xl font-black mb-1" style={{ letterSpacing: "-0.04em", color: surface.text }}>
                    {headingText}
                  </h2>
                  <p className="text-sm mb-6" style={{ color: surface.muted }}>{subText}</p>
                </motion.div>
              </AnimatePresence>

              <ErrorBanner />
              <FormFields compact />
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
                  <motion.div key={role} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="space-y-3">
                    <h1 className="text-5xl font-black leading-tight" style={{ letterSpacing: "-0.04em", color: surface.text }}>
                      {isEmployer ? (
                        <>Welcome back to<br /><span style={{ color: accentColor }}>your employer hub.</span></>
                      ) : (
                        <>Welcome back to<br /><span style={{ color: accentColor }}>your health journey.</span></>
                      )}
                    </h1>
                    <p className="text-base leading-relaxed max-w-md" style={{ color: surface.muted }}>
                      {isEmployer
                        ? "Your workforce health data, programmes, and team insights are waiting for you."
                        : "Your risk insights, progress, and recommendations are waiting for you."}
                    </p>
                  </motion.div>
                </AnimatePresence>

                <div style={{ height: 360, width: "100%" }}>
                  <HealthLottie />
                </div>

                <AnimatePresence mode="wait">
                  <motion.div key={`benefits-${role}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="flex flex-col gap-2.5">
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
                    <motion.div key={`heading-${role}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }} className="mb-6">
                      <h2 className="text-2xl font-black" style={{ letterSpacing: "-0.04em", color: surface.text }}>
                        {headingText}
                      </h2>
                      <p className="text-sm mt-1" style={{ color: surface.muted }}>{subText}</p>
                    </motion.div>
                  </AnimatePresence>

                  <ErrorBanner />
                  <FormFields />
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