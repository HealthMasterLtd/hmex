/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Heart,
  Sun,
  Moon,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  ArrowRight,
  Shield,
  Loader2,
} from "lucide-react";

export const dynamic = 'force-dynamic';

// Lottie Animation Component
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

      anim.addEventListener("DOMLoaded", () => {
        if (!cancelled) setLoaded(true);
      });
    });

    return () => {
      cancelled = true;
      anim?.destroy();
    };
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-2 animate-spin"
            style={{ borderColor: "#0FBB7D", borderTopColor: "transparent" }} />
        </div>
      )}
      <div
        ref={containerRef}
        className="w-full h-full"
        style={{ opacity: loaded ? 1 : 0, transition: "opacity 0.5s ease" }}
      />
    </div>
  );
}

export default function SignUpPage() {
  const router = useRouter();
  const { signUp, loginWithGoogle, loading, error, clearError, user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState(0);

  useEffect(() => setMounted(true), []);
  
  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (user) router.push("/dashboard");
  }, [user, router]);

  // Password strength calculator
  useEffect(() => {
    let strength = 0;
    const pw = formData.password;
    if (pw.length >= 8) strength += 25;
    if (/[A-Z]/.test(pw)) strength += 25;
    if (/[0-9]/.test(pw)) strength += 25;
    if (/[^A-Za-z0-9]/.test(pw)) strength += 25;
    setPasswordStrength(strength);
  }, [formData.password]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearError();
    setValidationError(null);
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validate = () => {
    if (!formData.fullName.trim()) {
      setValidationError("Please enter your full name");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setValidationError("Please enter a valid email");
      return false;
    }
    if (formData.password.length < 8) {
      setValidationError("Password must be at least 8 characters");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setValidationError("Passwords don't match");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    await signUp({
      fullName: formData.fullName.trim(),
      email: formData.email.trim(),
      password: formData.password,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleSubmit();
    }
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

  if (!mounted) return null;

  const colors = {
    bg: isDark ? "#0D0D0F" : "#F8F8F6",
    surface: isDark ? "#1A1B1F" : "#FFFFFF",
    border: isDark ? "#202126" : "#E2E2E0",
    text: isDark ? "#FFFFFF" : "#0A0A0B",
    muted: isDark ? "#A0A0A8" : "#52525B",
    subtle: isDark ? "#5A5A64" : "#A1A1AA",
    primary: "#0FBB7D",
    secondary: "#0FB6C8",
  };

  const benefits = [
    "Your health insights are always safe and ready for you",
    "Free health assessments",
    "No credit card required",
    "Your data stays private and secure",
  ];

  return (
    <div className="min-h-screen relative" style={{ background: colors.bg }}>
      {/* Theme Toggle */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={toggleTheme}
        whileTap={{ scale: 0.9 }}
        className="fixed top-6 right-6 z-50 px-3 py-2 text-xs font-semibold flex items-center gap-2"
        style={{
          border: `1px solid ${colors.primary}`,
          background: `color-mix(in srgb, ${colors.primary} 10%, transparent)`,
          color: colors.primary,
        }}
      >
        <motion.div
          key={isDark ? "sun" : "moon"}
          initial={{ rotate: -90, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ duration: 0.25 }}
        >
          {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </motion.div>
        {isDark ? "Light mode" : "Dark mode"}
      </motion.button>

      {/* MOBILE VIEW */}
      <div className="lg:hidden min-h-screen flex flex-col relative">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80"
            alt="Health background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0" style={{ background: "rgba(0, 0, 0, 0.5)" }} />
        </div>

        {/* Mobile Header */}
        <div className="relative z-10 px-5 py-6">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm">
              <Image
                src='/white logo.png'
                alt="Logo"
                width={120}
                height={50}
                className="object-cover w-full h-full"
              />
            </div>
            <span className="text-xl font-bold text-white">HMEX</span>
          </div>
          <div className="mt-6">
            <p className="text-xs font-medium text-white/80 mb-1">For Your Health</p>
            <h1 className="text-2xl font-bold text-white">Smart Health Monitoring</h1>
          </div>
        </div>

        {/* Form Container */}
        <div className="flex-1 relative z-10 flex flex-col justify-end pb-8">
          <div className="mx-5">
            <div className="p-6 rounded-t-3xl" style={{ background: colors.surface }}>
              <h2 className="text-2xl font-black mb-1" style={{ letterSpacing: "-0.04em", color: colors.text }}>
                Create account
              </h2>
              <p className="text-sm mb-6" style={{ color: colors.muted }}>
                Start your health journey today
              </p>

              {/* Tab Switcher */}
              <div className="flex gap-2 p-1 mb-6" style={{ background: isDark ? "rgba(0, 0, 0, 0.2)" : "#F3F4F6" }}>
                <div className="flex-1 py-2 text-center text-sm font-semibold" style={{ background: colors.surface, color: colors.text }}>
                  Sign up
                </div>
                <Link href="/login" className="flex-1 py-2 text-center text-sm font-medium" style={{ color: colors.muted }}>
                  Sign in
                </Link>
              </div>

              {/* Error message */}
              <AnimatePresence>
                {(validationError || error) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4 p-3 flex items-start gap-2"
                    style={{
                      background: isDark ? "rgba(239, 68, 68, 0.1)" : "#FEF2F2",
                      border: `1px solid ${isDark ? "rgba(239, 68, 68, 0.2)" : "#FEE2E2"}`,
                    }}
                  >
                    <AlertCircle size={16} color="#EF4444" className="flex-shrink-0 mt-0.5" />
                    <p className="text-xs" style={{ color: "#EF4444" }}>{validationError || error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form Fields */}
              <div className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold mb-2" style={{ color: colors.text }}>
                    Full Name
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: colors.muted }} />
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      onKeyPress={handleKeyPress}
                      placeholder="John Doe"
                      disabled={loading}
                      className="w-full pl-10 pr-3 py-2.5 text-sm"
                      style={{
                        background: isDark ? "rgba(0, 0, 0, 0.2)" : "#F3F4F6",
                        color: colors.text,
                        border: "none",
                        outline: "none",
                      }}
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold mb-2" style={{ color: colors.text }}>
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: colors.muted }} />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      onKeyPress={handleKeyPress}
                      placeholder="you@example.com"
                      disabled={loading}
                      className="w-full pl-10 pr-3 py-2.5 text-sm"
                      style={{
                        background: isDark ? "rgba(0, 0, 0, 0.2)" : "#F3F4F6",
                        color: colors.text,
                        border: "none",
                        outline: "none",
                      }}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold mb-2" style={{ color: colors.text }}>
                    Password
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: colors.muted }} />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      onKeyPress={handleKeyPress}
                      placeholder="••••••••"
                      disabled={loading}
                      className="w-full pl-10 pr-10 py-2.5 text-sm"
                      style={{
                        background: isDark ? "rgba(0, 0, 0, 0.2)" : "#F3F4F6",
                        color: colors.text,
                        border: "none",
                        outline: "none",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ color: colors.muted }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {formData.password && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-2 space-y-1"
                    >
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className="h-1 flex-1 transition-all"
                            style={{
                              background: passwordStrength >= i * 25 ? getStrengthColor() : colors.border,
                            }}
                          />
                        ))}
                      </div>
                      <p className="text-xs font-medium" style={{ color: getStrengthColor() }}>
                        {getStrengthText()} password
                      </p>
                    </motion.div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-semibold mb-2" style={{ color: colors.text }}>
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: colors.muted }} />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      onKeyPress={handleKeyPress}
                      placeholder="••••••••"
                      disabled={loading}
                      className="w-full pl-10 pr-10 py-2.5 text-sm"
                      style={{
                        background: isDark ? "rgba(0, 0, 0, 0.2)" : "#F3F4F6",
                        color: colors.text,
                        border: "none",
                        outline: "none",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ color: colors.muted }}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {formData.confirmPassword && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-1 flex items-center gap-1.5 text-xs font-medium"
                      style={{
                        color: formData.password === formData.confirmPassword ? "#0FBB7D" : "#F04438",
                      }}
                    >
                      {formData.password === formData.confirmPassword ? (
                        <><Check size={12} /> Passwords match</>
                      ) : (
                        <><AlertCircle size={12} /> Passwords don&apos;t match</>
                      )}
                    </motion.div>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full py-3 px-4 text-sm font-semibold transition-all mt-2"
                  style={{
                    background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                    color: "white",
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Create Account
                      <ArrowRight size={16} />
                    </span>
                  )}
                </button>

                {/* Divider */}
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t" style={{ borderColor: colors.border }} />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-2" style={{ background: colors.surface, color: colors.muted }}>
                      or continue with
                    </span>
                  </div>
                </div>

                {/* Google Button */}
                <button
                  onClick={loginWithGoogle}
                  disabled={loading}
                  className="w-full py-2.5 px-4 text-sm font-medium border flex items-center justify-center gap-2"
                  style={{
                    background: colors.surface,
                    borderColor: colors.border,
                    color: colors.text,
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </button>

                {/* Sign In Link */}
                <p className="text-center text-sm mt-4" style={{ color: colors.muted }}>
                  Already have an account?{" "}
                  <Link href="/login" className="font-semibold" style={{ color: colors.primary }}>
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DESKTOP VIEW */}
      <div className="hidden lg:block min-h-screen">
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="w-full max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">

              {/* LEFT SIDE */}
              <div className="space-y-8">
                {/* Logo */}
                <Link href="/" className="inline-flex items-center gap-3 group">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm">
                    <Image
                      src='/white logo.png'
                      alt="Logo"
                      width={120}
                      height={50}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <span className="text-2xl font-bold" style={{ color: colors.text }}>HMEX</span>
                </Link>

                {/* Headline */}
                <div className="space-y-3">
                  <h1 className="text-5xl font-black leading-tight" style={{ letterSpacing: "-0.04em", color: colors.text }}>
                    Take control of<br />
                    your health.{" "}
                    <span style={{ color: colors.primary }}>Start free.</span>
                  </h1>
                  <p className="text-base leading-relaxed max-w-md" style={{ color: colors.muted }}>
                    Join thousands preventing chronic conditions with personalized health insights and AI-powered risk detection.
                  </p>
                </div>

                {/* Large Lottie Animation */}
                <div style={{ height: 360, width: "100%" }}>
                  <HealthLottie />
                </div>

                {/* Benefits */}
                <div className="flex flex-col gap-2.5">
                  {benefits.map((benefit) => (
                    <div key={benefit} className="flex items-center gap-3">
                      <div className="w-5 h-5 flex items-center justify-center flex-shrink-0"
                        style={{
                          background: `color-mix(in srgb, ${colors.primary} 15%, transparent)`,
                          border: `1px solid color-mix(in srgb, ${colors.primary} 30%, transparent)`,
                        }}>
                        <Check className="w-3 h-3" style={{ color: colors.primary }} />
                      </div>
                      <span className="text-sm font-medium" style={{ color: colors.muted }}>{benefit}</span>
                    </div>
                  ))}
                </div>

                {/* Security Notice */}
                <div className="flex gap-3 p-4" style={{ 
                  background: `color-mix(in srgb, ${colors.primary} 10%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${colors.primary} 20%, transparent)`,
                }}>
                  <Shield className="w-5 h-5 mt-0.5 shrink-0" style={{ color: colors.primary }} />
                  <p className="text-sm" style={{ color: colors.text }}>Your data stays private and secure.</p>
                </div>
              </div>

              {/* RIGHT SIDE - Form */}
              <div className="w-full max-w-md mx-auto lg:mx-0">
                <div className="p-8" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
                  <div className="mb-6">
                    <h2 className="text-2xl font-black" style={{ letterSpacing: "-0.04em", color: colors.text }}>
                      Create account
                    </h2>
                    <p className="text-sm mt-1" style={{ color: colors.muted }}>
                      Free health assessments. No credit card required.
                    </p>
                  </div>

                  {/* Error message */}
                  <AnimatePresence>
                    {(validationError || error) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-6 p-3 flex items-start gap-2"
                        style={{
                          background: isDark ? "rgba(239, 68, 68, 0.1)" : "#FEF2F2",
                          border: `1px solid ${isDark ? "rgba(239, 68, 68, 0.2)" : "#FEE2E2"}`,
                        }}
                      >
                        <AlertCircle size={16} color="#EF4444" className="flex-shrink-0 mt-0.5" />
                        <p className="text-sm" style={{ color: "#EF4444" }}>{validationError || error}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Form Fields */}
                  <div className="space-y-4">
                    {/* Full Name */}
                    <div>
                      <label className="block text-xs font-semibold mb-2" style={{ color: colors.text }}>
                        Full Name
                      </label>
                      <div className="relative">
                        <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: colors.muted }} />
                        <input
                          type="text"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleChange}
                          onKeyPress={handleKeyPress}
                          onFocus={() => setFocusedField("name")}
                          onBlur={() => setFocusedField(null)}
                          placeholder="John Doe"
                          disabled={loading}
                          className="w-full pl-11 pr-4 py-3 text-sm border transition-all"
                          style={{
                            background: isDark ? "rgba(0, 0, 0, 0.2)" : colors.surface,
                            borderColor: focusedField === "name" ? colors.primary : colors.border,
                            color: colors.text,
                            outline: "none",
                          }}
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-xs font-semibold mb-2" style={{ color: colors.text }}>
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: colors.muted }} />
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          onKeyPress={handleKeyPress}
                          onFocus={() => setFocusedField("email")}
                          onBlur={() => setFocusedField(null)}
                          placeholder="you@example.com"
                          disabled={loading}
                          className="w-full pl-11 pr-4 py-3 text-sm border transition-all"
                          style={{
                            background: isDark ? "rgba(0, 0, 0, 0.2)" : colors.surface,
                            borderColor: focusedField === "email" ? colors.primary : colors.border,
                            color: colors.text,
                            outline: "none",
                          }}
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-xs font-semibold mb-2" style={{ color: colors.text }}>
                        Password
                      </label>
                      <div className="relative">
                        <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: colors.muted }} />
                        <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          onKeyPress={handleKeyPress}
                          onFocus={() => setFocusedField("password")}
                          onBlur={() => setFocusedField(null)}
                          placeholder="••••••••"
                          disabled={loading}
                          className="w-full pl-11 pr-11 py-3 text-sm border transition-all"
                          style={{
                            background: isDark ? "rgba(0, 0, 0, 0.2)" : colors.surface,
                            borderColor: focusedField === "password" ? colors.primary : colors.border,
                            color: colors.text,
                            outline: "none",
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2"
                          style={{ color: colors.muted }}
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      {formData.password && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="mt-2 space-y-2"
                        >
                          <div className="flex gap-1">
                            {[1, 2, 3, 4].map((i) => (
                              <div
                                key={i}
                                className="h-1 flex-1 transition-all"
                                style={{
                                  background: passwordStrength >= i * 25 ? getStrengthColor() : colors.border,
                                }}
                              />
                            ))}
                          </div>
                          <p className="text-xs font-medium" style={{ color: getStrengthColor() }}>
                            {getStrengthText()} password
                          </p>
                        </motion.div>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-xs font-semibold mb-2" style={{ color: colors.text }}>
                        Confirm Password
                      </label>
                      <div className="relative">
                        <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: colors.muted }} />
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          onKeyPress={handleKeyPress}
                          onFocus={() => setFocusedField("confirm")}
                          onBlur={() => setFocusedField(null)}
                          placeholder="••••••••"
                          disabled={loading}
                          className="w-full pl-11 pr-11 py-3 text-sm border transition-all"
                          style={{
                            background: isDark ? "rgba(0, 0, 0, 0.2)" : colors.surface,
                            borderColor: focusedField === "confirm" ? colors.primary : colors.border,
                            color: colors.text,
                            outline: "none",
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2"
                          style={{ color: colors.muted }}
                        >
                          {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      {formData.confirmPassword && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="mt-1 flex items-center gap-1.5 text-xs font-medium"
                          style={{
                            color: formData.password === formData.confirmPassword ? "#0FBB7D" : "#F04438",
                          }}
                        >
                          {formData.password === formData.confirmPassword ? (
                            <><Check size={14} /> Passwords match</>
                          ) : (
                            <><AlertCircle size={14} /> Passwords don&apos;t match</>
                          )}
                        </motion.div>
                      )}
                    </div>

                    {/* Submit Button */}
                    <button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="w-full py-3 px-4 text-sm font-semibold transition-all group mt-2"
                      style={{
                        background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                        color: "white",
                        opacity: loading ? 0.7 : 1,
                      }}
                    >
                      <span className="flex items-center justify-center gap-2">
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Creating Account...
                          </>
                        ) : (
                          <>
                            Create Account
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                          </>
                        )}
                      </span>
                    </button>

                    {/* Divider */}
                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t" style={{ borderColor: colors.border }} />
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-3" style={{ background: colors.surface, color: colors.muted }}>
                          or continue with
                        </span>
                      </div>
                    </div>

                    {/* Google Button */}
                    <button
                      onClick={loginWithGoogle}
                      disabled={loading}
                      className="w-full py-3 px-4 border text-sm font-medium flex items-center justify-center gap-3 transition-all"
                      style={{
                        background: colors.surface,
                        borderColor: colors.border,
                        color: colors.text,
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      Continue with Google
                    </button>

                    {/* Sign In Link */}
                    <p className="text-center text-sm mt-6" style={{ color: colors.muted }}>
                      Already have an account?{" "}
                      <Link
                        href="/login"
                        className="font-semibold hover:underline underline-offset-4"
                        style={{ color: colors.primary }}
                      >
                        Sign in
                      </Link>
                    </p>

                    <div className="text-center mt-3">
                      <Link href="/" className="text-xs hover:underline underline-offset-4" style={{ color: colors.subtle }}>
                        ← Back to home
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}