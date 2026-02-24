'use client';
/* eslint-disable @next/next/no-img-element */
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useTheme } from "@/contexts/ThemeContext";

export default function Hero() {
  const { isDark } = useTheme();

  return (
    <section
      className={`relative min-h-screen transition-colors duration-500 ${
        isDark ? "bg-[#0e1117]" : "bg-white"
      }`}
    >
      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 items-center gap-12 px-6 py-28 lg:grid-cols-2 lg:gap-16 lg:px-16 lg:py-0">

        {/* ── LEFT ── */}
        <div className="flex flex-col gap-6">

          <p className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${
            isDark ? "text-teal-400" : "text-teal-600"
          }`}>
            Non-Communicable Disease Prevention
          </p>

          <h1 className={`text-[clamp(1.85rem,3.6vw,3rem)] font-bold leading-[1.18] tracking-tight ${
            isDark ? "text-white" : "text-slate-900"
          }`}>
            Know your health risks
            <br />
            <span className={isDark ? "text-slate-400" : "text-slate-500"}>
              before they know you.
            </span>
          </h1>

          <p className={`max-w-[36ch] text-[15px] leading-[1.8] ${
            isDark ? "text-slate-400" : "text-slate-500"
          }`}>
            Answer a short set of questions about your lifestyle and history.
            We surface your personal risk profile and connect you to the right
            care — in under two minutes.
          </p>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:gap-4">
            <Link href="/questions">
              <button
                className="inline-flex w-full items-center justify-center gap-2.5 rounded-lg px-7 py-3.5 text-sm font-semibold text-white transition-opacity duration-200 hover:opacity-90 active:scale-[.98] sm:w-auto"
                style={{
                  background: "linear-gradient(135deg, #0d9488, #059669)",
                  boxShadow: "0 4px 18px rgba(13,148,136,.30)",
                }}
              >
                Start Your Risk Check
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>

            <Link href="/how-it-works">
              <button className={`inline-flex w-full items-center justify-center rounded-lg px-7 py-3.5 text-sm font-semibold transition-colors duration-200 active:scale-[.98] sm:w-auto ${
                isDark
                  ? "bg-white/6 text-slate-300 hover:bg-white/10"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}>
                How It Works
              </button>
            </Link>
          </div>

          {/* Minimal trust indicators — no false claims */}
          <div className={`flex items-center gap-5 pt-1 text-[11.5px] ${
            isDark ? "text-slate-600" : "text-slate-400"
          }`}>
            <span className="flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-teal-500" />
              Free to use
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-teal-500" />
              Results in &lt;2 min
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-teal-500" />
              12 conditions
            </span>
          </div>
        </div>

        {/* ── RIGHT ── */}
        <div className="relative w-full">

          {/* Animated background light — behind the image */}
          <div className="absolute inset-0 -z-10">
            {/* Primary slow-breathing orb */}
            <div
              className={`absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors duration-500`}
              style={{
                background: isDark
                  ? "radial-gradient(circle, rgba(13,148,136,.18) 0%, transparent 70%)"
                  : "radial-gradient(circle, rgba(13,148,136,.14) 0%, transparent 70%)",
                animation: "breathe 6s ease-in-out infinite",
              }}
            />
            {/* Secondary offset orb */}
            <div
              className="absolute -bottom-8 -right-8 h-[260px] w-[260px] rounded-full"
              style={{
                background: isDark
                  ? "radial-gradient(circle, rgba(5,150,105,.10) 0%, transparent 70%)"
                  : "radial-gradient(circle, rgba(5,150,105,.10) 0%, transparent 70%)",
                animation: "breathe 8s ease-in-out infinite reverse",
              }}
            />
          </div>

          {/* Image */}
          <div className={`relative overflow-hidden rounded-2xl ${
            isDark ? "ring-1 ring-white/8" : "ring-1 ring-slate-200/80"
          }`}>
            <img
              src="/assets/1.png"
              alt="Healthcare professional with patient"
              className="h-[300px] w-full object-cover object-center sm:h-[390px] lg:h-[470px]"
            />
          </div>

          {/* Stat card — bottom left */}
          <div className={`absolute -bottom-5 left-5 flex items-center gap-3.5 rounded-xl px-4 py-3.5 shadow-lg transition-colors duration-500 ${
            isDark
              ? "bg-[#181c27] ring-1 ring-white/8"
              : "bg-white ring-1 ring-slate-200"
          }`}>
            <div className="flex items-end gap-[3px]">
              {[38, 60, 45, 75, 55, 88, 68].map((h, i) => (
                <span
                  key={i}
                  className="w-[3.5px] rounded-sm transition-colors duration-500"
                  style={{
                    height: `${h * 0.28}px`,
                    background:
                      i === 5
                        ? "linear-gradient(180deg, #0d9488, #059669)"
                        : isDark
                        ? "rgba(255,255,255,.09)"
                        : "rgba(0,0,0,.08)",
                  }}
                />
              ))}
            </div>
            <div>
              <p className={`text-[13px] font-bold leading-none ${
                isDark ? "text-white" : "text-slate-900"
              }`}>
                50+
              </p>
              <p className={`mt-1 text-[11px] ${
                isDark ? "text-slate-500" : "text-slate-400"
              }`}>
                risk checks completed
              </p>
            </div>
          </div>

          {/* Condition pill — top right */}
          <div className={`absolute -top-4 right-5 flex items-center gap-2 rounded-lg px-3.5 py-2.5 shadow-md transition-colors duration-500 ${
            isDark
              ? "bg-[#181c27] ring-1 ring-white/8"
              : "bg-white ring-1 ring-slate-200"
          }`}>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <p className={`text-[12px] font-medium ${
              isDark ? "text-slate-300" : "text-slate-700"
            }`}>
              12 conditions screened
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes breathe {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          50% { transform: translate(-50%, -50%) scale(1.15); opacity: 0.7; }
        }
      `}</style>
    </section>
  );
}