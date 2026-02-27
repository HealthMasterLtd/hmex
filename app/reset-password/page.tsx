/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "@/contexts/ThemeContext";
import { useSearchParams, useRouter } from "next/navigation";
import { Lock, Eye, EyeOff, Sun, Moon, AlertCircle, ArrowRight, Loader2, CheckCircle2, ShieldCheck } from "lucide-react";
import { account } from "@/lib/appwrite";
import { AppwriteException } from "appwrite";

export const dynamic = "force-dynamic";

// ─── Password strength helper ─────────────────────────────────────────────────
function getStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { score, label: "Weak", color: "#EF4444" };
  if (score <= 2) return { score, label: "Fair", color: "#F59E0B" };
  if (score <= 3) return { score, label: "Good", color: "#3B82F6" };
  return { score, label: "Strong", color: "#10B981" };
}

function ResetPasswordInner() {
  const { isDark, toggleTheme, surface, accentColor, accentSecondary } = useTheme();
  const searchParams = useSearchParams();
  const router = useRouter();

  const userId = searchParams.get("userId");
  const secret = searchParams.get("secret");

  const [mounted, setMounted] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  // Invalid / expired link
  const invalidLink = !userId || !secret;

  const strength = getStrength(password);

  const inputStyle = (field: string): React.CSSProperties => ({
    width: "100%",
    borderRadius: 0,
    border: `1px solid ${focusedField === field ? accentColor : surface.border}`,
    background: isDark ? "rgba(0,0,0,0.2)" : surface.bg,
    color: surface.text,
    outline: "none",
    transition: "border-color 0.15s",
  });

  const ctaBtn: React.CSSProperties = {
    borderRadius: 0,
    border: "none",
    background: `linear-gradient(135deg, ${accentColor}, ${accentSecondary})`,
    color: "#fff",
    cursor: loading ? "not-allowed" : "pointer",
    transition: "opacity 0.15s",
  };

  const handleSubmit = async () => {
    setError(null);
    if (!password || !confirm) { setError("Please fill in both fields."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (strength.score < 2) { setError("Please choose a stronger password."); return; }

    setLoading(true);
    try {
      await account.updateRecovery(userId!, secret!, password);
      setSuccess(true);
      // Redirect to login after 3 seconds
      setTimeout(() => router.push("/login"), 3000);
    } catch (err) {
      if (err instanceof AppwriteException) {
        if (err.code === 401 || err.code === 404) {
          setError("This reset link has expired or is invalid. Please request a new one.");
        } else if (err.code === 400) {
          setError("Password must be at least 8 characters and meet complexity requirements.");
        } else {
          setError(err.message || "Something went wrong. Please try again.");
        }
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) handleSubmit();
  };

  return (
    <div className="min-h-screen relative" style={{ background: surface.bg }}>

      {/* Theme Toggle */}
      <motion.button
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        onClick={toggleTheme} whileTap={{ scale: 0.9 }}
        className="fixed top-6 right-6 z-50 px-3 py-2 text-xs font-semibold flex items-center gap-2"
        style={{
          borderRadius: 0,
          border: `1px solid ${accentColor}`,
          background: `${accentColor}18`,
          color: accentColor,
        }}
      >
        <motion.div
          key={isDark ? "sun" : "moon"}
          initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}
          transition={{ duration: 0.25 }}
        >
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
            <p className="text-xs font-medium text-white/80 mb-1">Account Security</p>
            <h1 className="text-2xl font-bold text-white">Create a new password</h1>
          </div>
        </div>

        <div className="flex-1 relative z-10 flex flex-col justify-end pb-8">
          <div className="mx-5">
            <div className="p-6" style={{ background: surface.surface, borderRadius: 0 }}>
              <MobileContent
                invalidLink={invalidLink} password={password} setPassword={setPassword}
                confirm={confirm} setConfirm={setConfirm} showPassword={showPassword}
                setShowPassword={setShowPassword} showConfirm={showConfirm} setShowConfirm={setShowConfirm}
                loading={loading} error={error} success={success} strength={strength}
                handleSubmit={handleSubmit} handleKeyPress={handleKeyPress}
                focusedField={focusedField} setFocusedField={setFocusedField}
                inputStyle={inputStyle} ctaBtn={ctaBtn} surface={surface} accentColor={accentColor} isDark={isDark}
              />
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

                <div className="space-y-3">
                  <h1 className="text-5xl font-black leading-tight" style={{ letterSpacing: "-0.04em", color: surface.text }}>
                    Create a<br />
                    <span style={{ color: accentColor }}>new password.</span>
                  </h1>
                  <p className="text-base leading-relaxed max-w-md" style={{ color: surface.muted }}>
                    Choose a strong, unique password to secure your HMEX health account.
                  </p>
                </div>

                {/* Password tips */}
                <div className="space-y-3 max-w-md">
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: surface.muted }}>Password tips</p>
                  {[
                    "At least 8 characters long",
                    "Mix uppercase and lowercase letters",
                    "Include numbers and symbols",
                    "Avoid using personal info or common words",
                  ].map((tip) => (
                    <div key={tip} className="flex items-center gap-3">
                      <div className="w-5 h-5 flex items-center justify-center flex-shrink-0"
                        style={{ borderRadius: 0, background: `${accentColor}18`, border: `1px solid ${accentColor}30` }}>
                        <ShieldCheck className="w-3 h-3" style={{ color: accentColor }} />
                      </div>
                      <span className="text-sm font-medium" style={{ color: surface.muted }}>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* RIGHT */}
              <div className="w-full max-w-md mx-auto lg:mx-0">
                <div className="p-8" style={{ background: surface.surface, border: `1px solid ${surface.border}`, borderRadius: 0 }}>

                  <AnimatePresence mode="wait">
                    {/* ── Invalid link ── */}
                    {invalidLink ? (
                      <motion.div key="invalid" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center py-6 space-y-4">
                        <div className="w-16 h-16 mx-auto flex items-center justify-center"
                          style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
                          <AlertCircle className="w-8 h-8" style={{ color: "#EF4444" }} />
                        </div>
                        <div>
                          <h2 className="text-2xl font-black" style={{ letterSpacing: "-0.04em", color: surface.text }}>Invalid link</h2>
                          <p className="text-sm mt-2" style={{ color: surface.muted }}>
                            This password reset link is invalid or has expired. Reset links are only valid for 1 hour.
                          </p>
                        </div>
                        <Link href="/forgot-password" className="block w-full py-3 px-4 text-sm font-semibold text-center" style={ctaBtn}>
                          Request a new link
                        </Link>
                        <Link href="/login" className="block text-xs text-center hover:underline underline-offset-2" style={{ color: surface.subtle }}>
                          Back to sign in
                        </Link>
                      </motion.div>
                    ) : success ? (
                      /* ── Success ── */
                      <motion.div key="success" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center py-6 space-y-4">
                        <div className="w-16 h-16 mx-auto flex items-center justify-center"
                          style={{ background: `${accentColor}15`, border: `1px solid ${accentColor}30` }}>
                          <CheckCircle2 className="w-8 h-8" style={{ color: accentColor }} />
                        </div>
                        <div>
                          <h2 className="text-2xl font-black" style={{ letterSpacing: "-0.04em", color: surface.text }}>Password updated!</h2>
                          <p className="text-sm mt-2" style={{ color: surface.muted }}>
                            Your password has been reset successfully. Redirecting you to sign in...
                          </p>
                        </div>
                        <div className="flex items-center justify-center gap-2 text-xs" style={{ color: surface.muted }}>
                          <Loader2 className="w-3 h-3 animate-spin" style={{ color: accentColor }} />
                          Redirecting in 3 seconds
                        </div>
                        <Link href="/login" className="block w-full py-3 px-4 text-sm font-semibold text-center" style={ctaBtn}>
                          Sign In Now
                        </Link>
                      </motion.div>
                    ) : (
                      /* ── Form ── */
                      <motion.div key="form" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="mb-6">
                          <h2 className="text-2xl font-black" style={{ letterSpacing: "-0.04em", color: surface.text }}>
                            New password
                          </h2>
                          <p className="text-sm mt-1" style={{ color: surface.muted }}>
                            Enter and confirm your new password below.
                          </p>
                        </div>

                        <AnimatePresence>
                          {error && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                              className="mb-6 p-3 flex items-start gap-2"
                              style={{
                                borderRadius: 0,
                                background: isDark ? "rgba(239,68,68,0.10)" : "#FEF2F2",
                                border: `1px solid ${isDark ? "rgba(239,68,68,0.2)" : "#FEE2E2"}`,
                              }}
                            >
                              <AlertCircle size={16} color="#EF4444" className="flex-shrink-0 mt-0.5" />
                              <p className="text-sm" style={{ color: "#EF4444" }}>{error}</p>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <div className="space-y-4">
                          {/* New password */}
                          <div>
                            <label className="block text-xs font-semibold mb-2" style={{ color: surface.text }}>New Password</label>
                            <div className="relative">
                              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: surface.muted }} />
                              <input
                                type={showPassword ? "text" : "password"} value={password}
                                onChange={(e) => { setError(null); setPassword(e.target.value); }}
                                onKeyPress={handleKeyPress}
                                onFocus={() => setFocusedField("password")} onBlur={() => setFocusedField(null)}
                                placeholder="••••••••" disabled={loading}
                                className="w-full pl-11 pr-11 py-3 text-sm"
                                style={inputStyle("password")}
                              />
                              <button type="button" onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2"
                                style={{ color: surface.muted, background: "none", border: "none", cursor: "pointer" }}>
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                              </button>
                            </div>

                            {/* Strength bar */}
                            {password.length > 0 && (
                              <div className="mt-2 space-y-1">
                                <div className="flex gap-1">
                                  {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="h-1 flex-1 transition-all duration-300"
                                      style={{
                                        background: i <= strength.score ? strength.color : surface.border,
                                        borderRadius: 0,
                                      }} />
                                  ))}
                                </div>
                                <p className="text-xs font-medium" style={{ color: strength.color }}>{strength.label}</p>
                              </div>
                            )}
                          </div>

                          {/* Confirm password */}
                          <div>
                            <label className="block text-xs font-semibold mb-2" style={{ color: surface.text }}>Confirm Password</label>
                            <div className="relative">
                              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: surface.muted }} />
                              <input
                                type={showConfirm ? "text" : "password"} value={confirm}
                                onChange={(e) => { setError(null); setConfirm(e.target.value); }}
                                onKeyPress={handleKeyPress}
                                onFocus={() => setFocusedField("confirm")} onBlur={() => setFocusedField(null)}
                                placeholder="••••••••" disabled={loading}
                                className="w-full pl-11 pr-11 py-3 text-sm"
                                style={{
                                  ...inputStyle("confirm"),
                                  borderColor: confirm.length > 0
                                    ? (password === confirm ? "#10B981" : "#EF4444")
                                    : focusedField === "confirm" ? accentColor : surface.border,
                                }}
                              />
                              <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                                className="absolute right-3 top-1/2 -translate-y-1/2"
                                style={{ color: surface.muted, background: "none", border: "none", cursor: "pointer" }}>
                                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                              </button>
                            </div>
                            {confirm.length > 0 && password !== confirm && (
                              <p className="text-xs mt-1" style={{ color: "#EF4444" }}>Passwords do not match</p>
                            )}
                          </div>

                          <button onClick={handleSubmit} disabled={loading}
                            className="w-full py-3 px-4 text-sm font-semibold mt-2 group"
                            style={{ ...ctaBtn, opacity: loading ? 0.7 : 1 }}>
                            <span className="flex items-center justify-center gap-2">
                              {loading ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Updating password...</>
                              ) : (
                                <>Reset Password <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" /></>
                              )}
                            </span>
                          </button>

                          <div className="text-center mt-3">
                            <Link href="/login" className="text-xs hover:underline underline-offset-4" style={{ color: surface.subtle }}>
                              ← Back to sign in
                            </Link>
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
      </div>
    </div>
  );
}

// Mobile inner content
function MobileContent({ invalidLink, password, setPassword, confirm, setConfirm, showPassword,
  setShowPassword, showConfirm, setShowConfirm, loading, error, success, strength, handleSubmit,
  handleKeyPress, focusedField, setFocusedField, inputStyle, ctaBtn, surface, accentColor, isDark }: any) {

  if (invalidLink) return (
    <div className="text-center space-y-4 py-4">
      <div className="w-14 h-14 mx-auto flex items-center justify-center"
        style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
        <AlertCircle className="w-7 h-7" style={{ color: "#EF4444" }} />
      </div>
      <div>
        <h2 className="text-xl font-black" style={{ letterSpacing: "-0.04em", color: surface.text }}>Invalid link</h2>
        <p className="text-sm mt-2" style={{ color: surface.muted }}>This link has expired or is invalid.</p>
      </div>
      <Link href="/forgot-password" className="block w-full py-3 text-sm font-semibold text-center" style={ctaBtn}>
        Request new link
      </Link>
    </div>
  );

  if (success) return (
    <div className="text-center space-y-4 py-4">
      <div className="w-14 h-14 mx-auto flex items-center justify-center"
        style={{ background: `${accentColor}15`, border: `1px solid ${accentColor}30` }}>
        <CheckCircle2 className="w-7 h-7" style={{ color: accentColor }} />
      </div>
      <div>
        <h2 className="text-xl font-black" style={{ letterSpacing: "-0.04em", color: surface.text }}>Password updated!</h2>
        <p className="text-sm mt-2" style={{ color: surface.muted }}>Redirecting you to sign in...</p>
      </div>
      <Link href="/login" className="block w-full py-3 text-sm font-semibold text-center" style={ctaBtn}>
        Sign In Now
      </Link>
    </div>
  );

  return (
    <div>
      <h2 className="text-2xl font-black mb-1" style={{ letterSpacing: "-0.04em", color: surface.text }}>New password</h2>
      <p className="text-sm mb-6" style={{ color: surface.muted }}>Enter and confirm your new password.</p>

      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="mb-4 p-3 flex items-start gap-2"
            style={{ borderRadius: 0, background: isDark ? "rgba(239,68,68,0.10)" : "#FEF2F2", border: `1px solid ${isDark ? "rgba(239,68,68,0.2)" : "#FEE2E2"}` }}>
            <AlertCircle size={16} color="#EF4444" className="flex-shrink-0 mt-0.5" />
            <p className="text-xs" style={{ color: "#EF4444" }}>{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold mb-2" style={{ color: surface.text }}>New Password</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: surface.muted }} />
            <input type={showPassword ? "text" : "password"} value={password}
              onChange={(e) => setPassword(e.target.value)} onKeyPress={handleKeyPress}
              onFocus={() => setFocusedField("password")} onBlur={() => setFocusedField(null)}
              placeholder="••••••••" disabled={loading}
              className="w-full pl-10 pr-10 py-2.5 text-sm" style={inputStyle("password")} />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: surface.muted, background: "none", border: "none", cursor: "pointer" }}>
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {password.length > 0 && (
            <div className="mt-2 space-y-1">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-1 flex-1 transition-all duration-300"
                    style={{ background: i <= strength.score ? strength.color : surface.border }} />
                ))}
              </div>
              <p className="text-xs font-medium" style={{ color: strength.color }}>{strength.label}</p>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold mb-2" style={{ color: surface.text }}>Confirm Password</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: surface.muted }} />
            <input type={showConfirm ? "text" : "password"} value={confirm}
              onChange={(e) => setConfirm(e.target.value)} onKeyPress={handleKeyPress}
              onFocus={() => setFocusedField("confirm")} onBlur={() => setFocusedField(null)}
              placeholder="••••••••" disabled={loading}
              className="w-full pl-10 pr-10 py-2.5 text-sm"
              style={{
                ...inputStyle("confirm"),
                borderColor: confirm.length > 0 ? (password === confirm ? "#10B981" : "#EF4444") : undefined,
              }} />
            <button type="button" onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: surface.muted, background: "none", border: "none", cursor: "pointer" }}>
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button onClick={handleSubmit} disabled={loading} className="w-full py-3 px-4 text-sm font-semibold"
          style={{ ...ctaBtn, opacity: loading ? 0.7 : 1 }}>
          {loading ? (
            <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Updating...</span>
          ) : (
            <span className="flex items-center justify-center gap-2">Reset Password <ArrowRight size={16} /></span>
          )}
        </button>

        <p className="text-center text-sm" style={{ color: surface.muted }}>
          <Link href="/login" className="font-semibold" style={{ color: accentColor }}>Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordInner />
    </Suspense>
  );
}