/* eslint-disable react-hooks/refs */
"use client";

import Image from "next/image";
import { ArrowRight, ShieldCheck, Clock, FileText } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Navbar from "@/components/landingpage/navbar";
import Footer from "@/components/ui/Footer";
import { useTheme } from "@/contexts/ThemeContext";

function useInView(threshold = 0.15) {
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

const steps = [
  { n: "01", icon: FileText,    title: "Answer 12 questions", body: "Simple questions about your lifestyle, habits, and history. No jargon, no medical knowledge needed." },
  { n: "02", icon: ShieldCheck, title: "AI scores your risk",  body: "Your answers are assessed against validated clinical benchmarks across 12 NCD conditions."            },
  { n: "03", icon: Clock,       title: "Get your report",      body: "An instant, personal risk profile with clear prevention tips — ready in under 2 minutes."             },
];

export default function HealthCheckPage() {
  const { isDark } = useTheme();
  const stepsRef = useInView();

  const bg    = isDark ? "#0e1117" : "#ffffff";
  const bgAlt = isDark ? "#161b25" : "#f0f4f8";
  const h     = isDark ? "text-white"     : "text-slate-900";
  const body  = isDark ? "text-slate-400" : "text-slate-500";
  const ln    = isDark ? "rgba(255,255,255,.07)" : "rgba(0,0,0,.07)";

  return (
    <div className="min-h-screen transition-colors duration-500" style={{ background: bg }}>
      <Navbar />

      {/* ── HERO ── */}
      <section
        className="relative w-full overflow-hidden"
        style={{ background: bg }}
      >
        {/* Teal quadrant wash — top right */}
        <div
          className="pointer-events-none absolute right-0 top-0 h-[65%] w-[50%]"
          style={{
            background: isDark
              ? "radial-gradient(ellipse at 85% 15%, rgba(13,148,136,.09) 0%, transparent 65%)"
              : "radial-gradient(ellipse at 85% 15%, rgba(13,148,136,.11) 0%, transparent 65%)",
          }}
        />

        <div className="relative z-10 mx-auto grid min-h-screen max-w-7xl grid-cols-1 items-center gap-10 px-6 py-28 lg:grid-cols-2 lg:gap-20 lg:px-16 lg:py-0">

          {/* ── Left copy ── */}
          <div className="flex flex-col gap-7">

            <p className={`text-[11px] font-semibold uppercase tracking-[0.22em] ${isDark ? "text-teal-400" : "text-teal-600"}`}>
              Risk Assessment
            </p>

            <h1 className={`text-[clamp(2rem,3.8vw,3rem)] font-bold leading-[1.13] tracking-tight ${h}`}>
              Your personalised
              <br />
              <span className="bg-gradient-to-r from-teal-500 to-emerald-500 bg-clip-text text-transparent">
                health risk check.
              </span>
            </h1>

            <p className={`max-w-[38ch] text-[15px] leading-[1.8] ${body}`}>
              Private, fast, and clinically informed. 12 questions.
              Instant results. A clear picture of your NCD risk — in
              under 2 minutes.
            </p>

            {/* Trust trio */}
            <div className={`flex flex-col gap-0 rounded-xl overflow-hidden ${isDark ? "ring-1 ring-white/7" : "ring-1 ring-slate-100"}`}>
              {[
                { icon: Clock,        label: "Under 2 minutes",  sub: "Complete the full check in one sitting"          },
                { icon: ShieldCheck,  label: "Private & secure",  sub: "Your data is encrypted and never sold"           },
                { icon: FileText,     label: "12 conditions",     sub: "Diabetes, hypertension, heart disease, and more" },
              ].map(({ icon: Icon, label, sub }, i) => (
                <div
                  key={label}
                  className="flex items-center gap-4 px-5 py-4 transition-colors duration-500"
                  style={{
                    background: isDark ? "rgba(255,255,255,.025)" : "rgba(0,0,0,.02)",
                    borderBottom: i < 2 ? `1px solid ${ln}` : "none",
                  }}
                >
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${isDark ? "bg-teal-500/12 text-teal-400" : "bg-teal-500/10 text-teal-600"}`}>
                    <Icon className="h-[16px] w-[16px]" />
                  </div>
                  <div>
                    <p className={`text-[13px] font-semibold leading-none ${h}`}>{label}</p>
                    <p className={`mt-0.5 text-[11.5px] ${body}`}>{sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center">
              <Link href="/questions">
                <button
                  className="group inline-flex w-full items-center justify-center gap-2.5 rounded-lg px-7 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 active:scale-[.98] sm:w-auto"
                  style={{
                    background: "linear-gradient(135deg, #0d9488, #059669)",
                    boxShadow: "0 4px 18px rgba(13,148,136,.28)",
                  }}
                >
                  Start Free Assessment
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              </Link>
              <span className={`text-[12px] ${body}`}>Free · Know your risk level today</span>
            </div>
          </div>

          {/* ── Right image ── */}
          <div className="relative flex items-end justify-center">
            <div
              className="absolute inset-0 -z-10"
              style={{
                background: "radial-gradient(ellipse at 50% 72%, rgba(13,148,136,.13) 0%, transparent 62%)",
                animation: "breathe 8s ease-in-out infinite",
              }}
            />
            <Image
              src="/assets/6new.png"
              alt="Health professional"
              width={480}
              height={560}
              className="w-full max-w-[320px] object-contain object-bottom lg:max-w-[420px]"
              priority
            />
          </div>
        </div>
      </section>

      {/* ── 3 STEPS ── */}
      <section
        ref={stepsRef.ref}
        className="w-full py-24 md:py-32 transition-colors duration-500"
        style={{ background: bgAlt }}
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-16">

          <div
            className="mb-14"
            style={{
              opacity: stepsRef.visible ? 1 : 0,
              transform: stepsRef.visible ? "translateY(0)" : "translateY(14px)",
              transition: "opacity .7s ease, transform .7s ease",
            }}
          >
            <p className={`mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] ${isDark ? "text-teal-400" : "text-teal-600"}`}>
              The Process
            </p>
            <h2 className={`text-[clamp(1.8rem,3.4vw,2.6rem)] font-bold leading-tight tracking-tight ${h}`}>
              Three steps to clarity.
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-0">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div
                  key={i}
                  className="flex flex-col gap-5 md:px-10"
                  style={{
                    borderRight: i < steps.length - 1 ? `1px solid ${ln}` : "none",
                    ...(i === 0 && { paddingLeft: 0 }),
                    ...(i === steps.length - 1 && { paddingRight: 0 }),
                    opacity: stepsRef.visible ? 1 : 0,
                    transform: stepsRef.visible ? "translateY(0)" : "translateY(16px)",
                    transition: `opacity .6s ease ${i * 120}ms, transform .6s ease ${i * 120}ms`,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${isDark ? "bg-teal-500/12 text-teal-400" : "bg-teal-500/10 text-teal-600"}`}>
                      <Icon className="h-[18px] w-[18px]" />
                    </div>
                    <span
                      className="text-[11px] font-bold tabular-nums"
                      style={{ color: isDark ? "rgba(255,255,255,.14)" : "rgba(0,0,0,.14)" }}
                    >
                      {step.n}
                    </span>
                  </div>
                  <div>
                    <h3 className={`mb-2 text-[15px] font-bold ${h}`}>{step.title}</h3>
                    <p className={`text-[13.5px] leading-[1.75] ${body}`}>{step.body}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom CTA inside steps section */}
          <div
            className="mt-14 flex items-center justify-between flex-wrap gap-5"
            style={{
              paddingTop: "2rem",
              borderTop: `1px solid ${ln}`,
              opacity: stepsRef.visible ? 1 : 0,
              transition: "opacity .7s ease .4s",
            }}
          >
            <p className={`text-[14px] max-w-[44ch] leading-[1.75] ${body}`}>
              Ready to understand your health? It takes less than two minutes
              and costs nothing.
            </p>
            <Link href="/questions">
              <button
                className="group inline-flex items-center gap-2.5 rounded-lg px-7 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 active:scale-[.98]"
                style={{
                  background: "linear-gradient(135deg, #0d9488, #059669)",
                  boxShadow: "0 4px 18px rgba(13,148,136,.25)",
                }}
              >
                Start Now
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />

      <style jsx>{`
        @keyframes breathe {
          0%, 100% { transform: scale(1);    opacity: 1;   }
          50%       { transform: scale(1.1); opacity: .65; }
        }
      `}</style>
    </div>
  );
}