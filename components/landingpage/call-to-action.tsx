'use client';
import Link from "next/link";
import { ArrowRight, HeartPulse } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";

function useInView(threshold = 0.2) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); io.disconnect(); } },
      { threshold }
    );
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, [threshold]);
  return { ref, visible };
}

export default function CallToAction() {
  const { isDark } = useTheme();
  const { ref, visible } = useInView();

  return (
    <section ref={ref} className="w-full">
      <div
        className="grid grid-cols-1 lg:grid-cols-2"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(20px)",
          transition: "opacity .75s ease, transform .75s ease",
        }}
      >
        {/* ── LEFT — theme-aware teal ── */}
        <div
          className="relative flex flex-col justify-between gap-8 overflow-hidden px-10 py-12 md:px-14 md:py-14 xl:px-20 xl:py-16"
          style={{
            background: isDark
              ? "linear-gradient(135deg, #0d9488 0%, #047857 100%)"
              : "linear-gradient(135deg, #0f766e 0%, #065f46 100%)",
          }}
        >
          {/* Decorative rings */}
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full opacity-[.07]"
            style={{ border: "48px solid #fff", animation: "breathe 9s ease-in-out infinite" }}
          />
          <div
            className="pointer-events-none absolute -bottom-20 -left-10 h-80 w-80 rounded-full opacity-[.05]"
            style={{ border: "56px solid #fff", animation: "breathe 11s ease-in-out infinite reverse" }}
          />

          <div className="relative z-10 flex flex-col gap-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/60">
              Get Started
            </p>
            <h2 className="text-[clamp(1.7rem,3.4vw,2.6rem)] font-bold leading-[1.12] tracking-tight text-white">
              Know your health
              <br />status today.
            </h2>
            <p className="max-w-[34ch] text-[14px] leading-[1.8] text-white/70">
              A two-minute risk check that could change how you approach
              your health for years to come.
            </p>
          </div>

          <div className="relative z-10">
            <Link href="/risk-assesment">
              <button className="group inline-flex items-center gap-3 rounded-lg bg-white px-6 py-3.5 text-sm font-bold text-teal-700 transition-all duration-200 hover:bg-white/92 active:scale-[.98]">
                Start Your Free Assessment
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-600 text-white transition-transform duration-200 group-hover:translate-x-0.5">
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </button>
            </Link>

            <div className="mt-4 flex items-center gap-2">
              <HeartPulse className="h-3.5 w-3.5 text-white/50" />
              <p className="text-[12px] text-white/50">
                Join 100+ people already taking control of their health
              </p>
            </div>
          </div>
        </div>

        {/* ── RIGHT — dark, theme-aware ── */}
        <div
          className={`flex flex-col justify-between gap-8 px-10 py-12 md:px-14 md:py-14 xl:px-20 xl:py-16 transition-colors duration-500 ${
            isDark ? "bg-[#161b25]" : "bg-white border border-slate-200"
          }`}
        >
          <div className="flex flex-col gap-4">
            <p className={`text-[11px] font-semibold uppercase tracking-[0.22em] ${isDark ? "text-white/40" : "text-slate-400"}`}>
              Why It Matters
            </p>
            <h3 className={`text-[clamp(1.4rem,2.8vw,2.1rem)] font-bold leading-[1.15] tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
              Prevention is always
              <br />
              <span className="text-teal-500">cheaper than treatment.</span>
            </h3>
            <p className={`max-w-[38ch] text-[14px] leading-[1.8] ${isDark ? "text-white/50" : "text-slate-500"}`}>
              NCDs cause 74% of all deaths globally — yet up to 80% are
              preventable with early awareness and simple lifestyle changes.
              That&apos;s exactly what we&apos;re built for.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <div className={`h-px w-full ${isDark ? "bg-white/8" : "bg-slate-100"}`} />

            <div className="grid grid-cols-3 gap-4">
              {[
                { v: "2 min", l: "to complete"       },
                { v: "12",    l: "conditions checked" },
                { v: "Free",  l: "always"             },
              ].map((s, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <span className={`text-[1.05rem] font-bold tabular-nums ${isDark ? "text-white" : "text-slate-900"}`}>{s.v}</span>
                  <span className={`text-[11px] ${isDark ? "text-white/35" : "text-slate-400"}`}>{s.l}</span>
                </div>
              ))}
            </div>

            <div className={`h-px w-full ${isDark ? "bg-white/8" : "bg-slate-100"}`} />

            <Link href="/how-it-works">
              <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-teal-500 transition-colors hover:text-teal-400">
                See how it works
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes breathe {
          0%, 100% { transform: scale(1);     }
          50%       { transform: scale(1.08); }
        }
      `}</style>
    </section>
  );
}