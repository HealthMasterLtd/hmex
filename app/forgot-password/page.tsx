/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "@/contexts/ThemeContext";
import { Mail, Sun, Moon, AlertCircle, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { account } from "@/lib/appwrite";
import { AppwriteException } from "appwrite";

export const dynamic = "force-dynamic";

export default function ForgotPasswordPage() {
  const { isDark, toggleTheme, surface, accentColor, accentSecondary } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

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
    if (!email.trim()) { setError("Please enter your email address."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Please enter a valid email address."); return; }

    setLoading(true);
    try {
      // Appwrite sends a magic recovery email
      // The redirect URL must match a platform URL in your Appwrite console
      const redirectUrl = `${window.location.origin}/reset-password`;
      await account.createRecovery(email.trim(), redirectUrl);
      setSuccess(true);
    } catch (err) {
      if (err instanceof AppwriteException) {
        if (err.code === 404) {
          // Don't reveal if email exists — show success anyway for security
          setSuccess(true);
        } else if (err.code === 429) {
          setError("Too many attempts. Please wait a moment and try again.");
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
            <p className="text-xs font-medium text-white/80 mb-1">Account Recovery</p>
            <h1 className="text-2xl font-bold text-white">Reset your password</h1>
          </div>
        </div>

        <div className="flex-1 relative z-10 flex flex-col justify-end pb-8">
          <div className="mx-5">
            <div className="p-6" style={{ background: surface.surface, borderRadius: 0 }}>
              <MobileContent
                email={email} setEmail={setEmail} loading={loading}
                error={error} success={success} handleSubmit={handleSubmit}
                handleKeyPress={handleKeyPress} focusedField={focusedField}
                setFocusedField={setFocusedField} inputStyle={inputStyle}
                ctaBtn={ctaBtn} surface={surface} accentColor={accentColor} isDark={isDark}
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
                    Forgot your<br />
                    <span style={{ color: accentColor }}>password?</span>
                  </h1>
                  <p className="text-base leading-relaxed max-w-md" style={{ color: surface.muted }}>
                    No worries. Enter your email and we&apos;ll send you a secure link to reset your password and get back to your health journey.
                  </p>
                </div>

                {/* Info cards */}
                <div className="space-y-3 max-w-md">
                  {[
                    { step: "01", title: "Enter your email", desc: "Provide the email address linked to your HMEX account." },
                    { step: "02", title: "Check your inbox", desc: "We'll send a secure password reset link within seconds." },
                    { step: "03", title: "Create a new password", desc: "Follow the link to set a strong new password for your account." },
                  ].map(({ step, title, desc }) => (
                    <div key={step} className="flex items-start gap-4 p-4"
                      style={{ border: `1px solid ${surface.border}`, background: surface.surface }}>
                      <span className="text-xs font-black mt-0.5" style={{ color: accentColor }}>{step}</span>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: surface.text }}>{title}</p>
                        <p className="text-xs mt-0.5" style={{ color: surface.muted }}>{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* RIGHT */}
              <div className="w-full max-w-md mx-auto lg:mx-0">
                <div className="p-8" style={{ background: surface.surface, border: `1px solid ${surface.border}`, borderRadius: 0 }}>

                  <AnimatePresence mode="wait">
                    {success ? (
                      <motion.div
                        key="success"
                        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                        className="text-center py-6 space-y-4"
                      >
                        <div className="w-16 h-16 mx-auto flex items-center justify-center"
                          style={{ background: `${accentColor}15`, border: `1px solid ${accentColor}30` }}>
                          <CheckCircle2 className="w-8 h-8" style={{ color: accentColor }} />
                        </div>
                        <div>
                          <h2 className="text-2xl font-black" style={{ letterSpacing: "-0.04em", color: surface.text }}>
                            Check your inbox
                          </h2>
                          <p className="text-sm mt-2" style={{ color: surface.muted }}>
                            If an account exists for <strong style={{ color: surface.text }}>{email}</strong>, you&apos;ll receive a password reset link shortly.
                          </p>
                        </div>
                        <p className="text-xs" style={{ color: surface.muted }}>
                          Didn&apos;t receive it? Check your spam folder or{" "}
                          <button onClick={() => { setSuccess(false); setError(null); }}
                            className="font-semibold underline underline-offset-2" style={{ color: accentColor, background: "none", border: "none", cursor: "pointer" }}>
                            try again
                          </button>.
                        </p>
                        <div className="pt-2">
                          <Link href="/login" className="w-full py-3 px-4 text-sm font-semibold flex items-center justify-center gap-2 group"
                            style={ctaBtn}>
                            Back to Sign In <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                          </Link>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div key="form" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="mb-6">
                          <h2 className="text-2xl font-black" style={{ letterSpacing: "-0.04em", color: surface.text }}>
                            Reset password
                          </h2>
                          <p className="text-sm mt-1" style={{ color: surface.muted }}>
                            Enter your email to receive a reset link.
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
                          <div>
                            <label className="block text-xs font-semibold mb-2" style={{ color: surface.text }}>Email Address</label>
                            <div className="relative">
                              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: surface.muted }} />
                              <input
                                type="email" value={email} onChange={(e) => { setError(null); setEmail(e.target.value); }}
                                onKeyPress={handleKeyPress}
                                onFocus={() => setFocusedField("email")} onBlur={() => setFocusedField(null)}
                                placeholder="you@example.com" disabled={loading}
                                className="w-full pl-11 pr-4 py-3 text-sm"
                                style={inputStyle("email")}
                              />
                            </div>
                          </div>

                          <button onClick={handleSubmit} disabled={loading}
                            className="w-full py-3 px-4 text-sm font-semibold group"
                            style={{ ...ctaBtn, opacity: loading ? 0.7 : 1 }}>
                            <span className="flex items-center justify-center gap-2">
                              {loading ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Sending link...</>
                              ) : (
                                <>Send Reset Link <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" /></>
                              )}
                            </span>
                          </button>

                          <p className="text-center text-sm mt-4" style={{ color: surface.muted }}>
                            Remember your password?{" "}
                            <Link href="/login" className="font-semibold hover:underline underline-offset-4" style={{ color: accentColor }}>
                              Sign in
                            </Link>
                          </p>

                          <div className="text-center mt-3">
                            <Link href="/" className="text-xs hover:underline underline-offset-4" style={{ color: surface.subtle }}>
                              ← Back to home
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
function MobileContent({ email, setEmail, loading, error, success, handleSubmit, handleKeyPress,
  focusedField, setFocusedField, inputStyle, ctaBtn, surface, accentColor, isDark }: any) {
  return (
    <AnimatePresence mode="wait">
      {success ? (
        <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-4 py-4">
          <div className="w-14 h-14 mx-auto flex items-center justify-center"
            style={{ background: `${accentColor}15`, border: `1px solid ${accentColor}30` }}>
            <CheckCircle2 className="w-7 h-7" style={{ color: accentColor }} />
          </div>
          <div>
            <h2 className="text-xl font-black" style={{ letterSpacing: "-0.04em", color: surface.text }}>Check your inbox</h2>
            <p className="text-sm mt-2" style={{ color: surface.muted }}>
              A reset link has been sent to <strong style={{ color: surface.text }}>{email}</strong>.
            </p>
          </div>
          <Link href="/login" className="block w-full py-3 text-sm font-semibold text-center" style={ctaBtn}>
            Back to Sign In
          </Link>
        </motion.div>
      ) : (
        <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h2 className="text-2xl font-black mb-1" style={{ letterSpacing: "-0.04em", color: surface.text }}>Reset password</h2>
          <p className="text-sm mb-6" style={{ color: surface.muted }}>We&apos;ll send a reset link to your email.</p>

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
              <label className="block text-xs font-semibold mb-2" style={{ color: surface.text }}>Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: surface.muted }} />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={handleKeyPress} onFocus={() => setFocusedField("email")} onBlur={() => setFocusedField(null)}
                  placeholder="you@example.com" disabled={loading}
                  className="w-full pl-10 pr-3 py-2.5 text-sm" style={inputStyle("email")} />
              </div>
            </div>
            <button onClick={handleSubmit} disabled={loading} className="w-full py-3 px-4 text-sm font-semibold"
              style={{ ...ctaBtn, opacity: loading ? 0.7 : 1 }}>
              {loading ? (
                <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Sending...</span>
              ) : (
                <span className="flex items-center justify-center gap-2">Send Reset Link <ArrowRight size={16} /></span>
              )}
            </button>
            <p className="text-center text-sm" style={{ color: surface.muted }}>
              Remember it?{" "}
              <Link href="/login" className="font-semibold" style={{ color: accentColor }}>Sign in</Link>
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}