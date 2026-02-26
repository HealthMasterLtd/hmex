'use client';
/* eslint-disable @next/next/no-img-element */
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useTheme } from "@/contexts/ThemeContext";

export default function Hero() {
  const { isDark, surface, accentColor, accentFaint } = useTheme();

  return (
    <section
      className="relative min-h-screen transition-colors duration-500"
      style={{ background: surface.bg }}
    >
      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 items-center gap-12 px-6 py-28 lg:grid-cols-2 lg:gap-16 lg:px-16 lg:py-0">

        {/* ── LEFT ── */}
        <div className="flex flex-col gap-6">

          <p
            className="text-[11px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: accentColor }}
          >
            Non-Communicable Disease Prevention
          </p>

          <h1
            className="text-[clamp(1.85rem,3.6vw,3rem)] font-bold leading-[1.18] tracking-tight"
            style={{ color: surface.text }}
          >
            Know your health risks
            <br />
            <span style={{ color: surface.muted }}>
              before they know you.
            </span>
          </h1>

          <p
            className="max-w-[36ch] text-[15px] leading-[1.8]"
            style={{ color: surface.muted }}
          >
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
              <button
                className="inline-flex w-full items-center justify-center rounded-lg px-7 py-3.5 text-sm font-semibold transition-colors duration-200 active:scale-[.98] sm:w-auto"
                style={{
                  background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                  color: surface.muted,
                  border: `1px solid ${surface.border}`,
                }}
              >
                How It Works
              </button>
            </Link>
          </div>

          {/* Trust indicators */}
          <div
            className="flex items-center gap-5 pt-1 text-[11.5px]"
            style={{ color: surface.subtle }}
          >
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

          {/* ── Professional close-lighting / glow system ── */}
          <div className="absolute inset-0 -z-10">
            {/* Primary breathing orb — centered */}
            <div
              className="absolute left-1/2 top-1/2 h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                background: isDark
                  ? "radial-gradient(circle, rgba(13,148,136,.22) 0%, rgba(13,148,136,.06) 40%, transparent 70%)"
                  : "radial-gradient(circle, rgba(13,148,136,.16) 0%, rgba(13,148,136,.04) 40%, transparent 70%)",
                animation: "breathe 6s ease-in-out infinite",
                filter: "blur(2px)",
              }}
            />
            {/* Secondary offset orb — bottom right warm fill */}
            <div
              className="absolute -bottom-10 -right-10 h-[300px] w-[300px] rounded-full"
              style={{
                background: isDark
                  ? "radial-gradient(circle, rgba(5,150,105,.14) 0%, transparent 70%)"
                  : "radial-gradient(circle, rgba(5,150,105,.12) 0%, transparent 70%)",
                animation: "breathe 8s ease-in-out infinite reverse",
                filter: "blur(4px)",
              }}
            />
            {/* Top-left rim light — cool highlight */}
            <div
              className="absolute -left-8 -top-8 h-[200px] w-[200px] rounded-full"
              style={{
                background: isDark
                  ? "radial-gradient(circle, rgba(20,184,166,.10) 0%, transparent 70%)"
                  : "radial-gradient(circle, rgba(20,184,166,.08) 0%, transparent 70%)",
                animation: "breathe 10s ease-in-out infinite",
                filter: "blur(6px)",
              }}
            />
          </div>

          {/* ── Image with border-radius and professional shadow ── */}
          <div
            className="relative overflow-hidden"
            style={{
              borderRadius: "16px",
              boxShadow: isDark
                ? `0 0 0 1px rgba(255,255,255,0.07), 0 8px 40px rgba(0,0,0,0.55), 0 0 80px rgba(13,148,136,0.12), inset 0 1px 0 rgba(255,255,255,0.05)`
                : `0 0 0 1px rgba(0,0,0,0.07), 0 8px 40px rgba(0,0,0,0.12), 0 0 60px rgba(13,148,136,0.10)`,
            }}
          >
            {/* Inner top-edge highlight — lens-like rim */}
            <div
              className="pointer-events-none absolute inset-x-0 top-0 z-10 h-px"
              style={{
                background: isDark
                  ? "linear-gradient(90deg, transparent, rgba(255,255,255,0.12) 30%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0.12) 70%, transparent)"
                  : "linear-gradient(90deg, transparent, rgba(255,255,255,0.6) 30%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0.6) 70%, transparent)",
              }}
            />
            {/* Bottom fade-out vignette */}
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-24"
              style={{
                background: isDark
                  ? "linear-gradient(to top, rgba(14,17,23,0.45), transparent)"
                  : "linear-gradient(to top, rgba(255,255,255,0.2), transparent)",
              }}
            />
            <img
              src="/assets/1.png"
              alt="Healthcare professional with patient"
              className="h-[300px] w-full object-cover object-center sm:h-[390px] lg:h-[470px]"
            />
          </div>

          {/* ── Stat card — bottom left ── */}
          <div
            className="absolute -bottom-5 left-5 flex items-center gap-3.5 px-4 py-3.5 shadow-lg transition-colors duration-500"
            style={{
              background: surface.surface,
              border: `1px solid ${surface.border}`,
              borderRadius: "10px",
              boxShadow: isDark
                ? "0 8px 28px rgba(0,0,0,0.45), 0 1px 0 rgba(255,255,255,0.06) inset"
                : "0 8px 28px rgba(0,0,0,0.09)",
            }}
          >
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
              <p
                className="text-[13px] font-bold leading-none"
                style={{ color: surface.text }}
              >
                50+
              </p>
              <p
                className="mt-1 text-[11px]"
                style={{ color: surface.muted }}
              >
                risk checks completed
              </p>
            </div>
          </div>

          {/* ── Condition pill — top right ── */}
          <div
            className="absolute -top-4 right-5 flex items-center gap-2 px-3.5 py-2.5 shadow-md transition-colors duration-500"
            style={{
              background: surface.surface,
              border: `1px solid ${surface.border}`,
              borderRadius: "8px",
              boxShadow: isDark
                ? "0 4px 16px rgba(0,0,0,0.40)"
                : "0 4px 16px rgba(0,0,0,0.07)",
            }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <p
              className="text-[12px] font-medium"
              style={{ color: surface.muted }}
            >
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