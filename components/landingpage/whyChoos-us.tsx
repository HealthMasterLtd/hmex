'use client';
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { HeartPulse, HandHelping, Cpu, Radar, ShieldCheck } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

const features = [
  { icon: HeartPulse,   title: "AI-Driven Accuracy",          description: "Risk assessments built on validated medical research and reviewed by health experts." },
  { icon: HandHelping,  title: "Human + Technology",          description: "Smart AI guidance backed by real doctors for results you can actually trust." },
  { icon: Cpu,          title: "Fast & Accessible",           description: "Complete your full risk check in under two minutes — anywhere, any device." },
  { icon: Radar,        title: "Personalised Prevention",     description: "Simple, actionable insights tailored precisely to your lifestyle and history." },
  { icon: ShieldCheck,  title: "Secure & Private",            description: "Your data is encrypted, confidential, and never sold to third parties." },
];

function useInView(threshold = 0.12) {
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

function useCountUp(target: number, duration = 1400, start = false) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!start) return;
    let t0: number | null = null;
    const tick = (ts: number) => {
      if (!t0) t0 = ts;
      const p = Math.min((ts - t0) / duration, 1);
      setV(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration, start]);
  return v;
}

export default function WhyChooseUs() {
  const { isDark } = useTheme();
  const { ref, visible } = useInView();
  const count = useCountUp(1240, 1600, visible);

  return (
    <section
      ref={ref}
      className={`relative w-full overflow-hidden py-24 md:py-32 transition-colors duration-500 ${
        isDark ? "bg-[#161b25]" : "bg-[#f0f4f8]"
      }`}
    >
      {/* Ghost headline */}
      <div
        className="pointer-events-none absolute inset-x-0 top-4 flex justify-center select-none"
        aria-hidden="true"
      >
        <span
          className="text-[clamp(3rem,10vw,8rem)] font-black uppercase leading-none tracking-tight"
          style={{
            color: "transparent",
            WebkitTextStroke: isDark ? "1px rgba(255,255,255,.035)" : "1px rgba(0,0,0,.045)",
            letterSpacing: "-0.02em",
            opacity: visible ? 1 : 0,
            transition: "opacity 1s ease .1s",
          }}
        >
          WHY CHOOSE US
        </span>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-16">

        {/* Header */}
        <div
          className="mb-14"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(14px)",
            transition: "opacity .7s ease, transform .7s ease",
          }}
        >
          <p className={`mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] ${isDark ? "text-teal-400" : "text-teal-600"}`}>
            Our Difference
          </p>
          <h2 className={`text-[clamp(1.8rem,3.8vw,2.8rem)] font-bold leading-tight tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
            Why choose us
          </h2>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-14 xl:gap-20">

          {/* ── LEFT: feature list ── */}
          <div className="flex flex-col gap-0">
            {features.map((f, i) => {
              const Icon = f.icon;
              const isLast = i === features.length - 1;
              return (
                <div
                  key={i}
                  className="flex items-start gap-5 py-6"
                  style={{
                    borderBottom: isLast
                      ? "none"
                      : `1px solid ${isDark ? "rgba(255,255,255,.07)" : "rgba(0,0,0,.07)"}`,
                    opacity: visible ? 1 : 0,
                    transform: visible ? "translateX(0)" : "translateX(-16px)",
                    transition: `opacity .55s ease ${120 + i * 95}ms, transform .55s ease ${120 + i * 95}ms`,
                  }}
                >
                  {/* Icon */}
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors duration-500 ${
                      isDark ? "bg-teal-500/12 text-teal-400" : "bg-teal-500/10 text-teal-600"
                    }`}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                  </div>

                  {/* Text */}
                  <div className="flex-1">
                    <h3 className={`text-[14.5px] font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                      {f.title}
                    </h3>
                    <p className={`mt-1 text-[13px] leading-[1.75] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      {f.description}
                    </p>
                  </div>

                  {/* Step number — far right, muted */}
                  <span
                    className="shrink-0 self-center text-[11px] font-bold tabular-nums"
                    style={{ color: isDark ? "rgba(255,255,255,.12)" : "rgba(0,0,0,.12)" }}
                  >
                    0{i + 1}
                  </span>
                </div>
              );
            })}
          </div>

          {/* ── RIGHT: image + stat ── */}
          <div
            className="relative flex flex-col gap-8 lg:justify-between"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateX(0)" : "translateX(20px)",
              transition: "opacity .75s ease .15s, transform .75s ease .15s",
            }}
          >
            {/* Big stat */}
            <div>
              <div className="flex items-baseline gap-2">
                <span className={`text-[clamp(2.8rem,5.5vw,4rem)] font-bold tabular-nums leading-none ${isDark ? "text-white" : "text-slate-900"}`}>
                  {count.toLocaleString()}+
                </span>
              </div>
              <p className={`mt-2 text-[13px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                NCD risk checks completed
              </p>

              {/* Thin progress bar — visual decoration */}
              <div className={`mt-4 h-px w-full overflow-hidden rounded-full ${isDark ? "bg-white/8" : "bg-slate-200"}`}>
                <div
                  className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500"
                  style={{
                    width: visible ? "72%" : "0%",
                    transition: "width 1.4s cubic-bezier(.16,1,.3,1) .4s",
                  }}
                />
              </div>
              <div className={`mt-1.5 flex justify-between text-[10px] tabular-nums ${isDark ? "text-slate-600" : "text-slate-400"}`}>
                <span>0</span>
                <span>Target: 2,000</span>
              </div>
            </div>

            {/* Image */}
            <div className="relative flex-1">
              {/* Ambient glow */}
              <div
                className="absolute inset-0 -z-10 rounded-2xl"
                style={{
                  background: "radial-gradient(ellipse at 50% 60%, rgba(13,148,136,.15) 0%, transparent 65%)",
                  animation: "breathe 8s ease-in-out infinite",
                }}
              />
              <Image
                src="/assets/5zoom.png"
                alt="Healthcare professional"
                width={420}
                height={500}
                className={`mx-auto w-full max-w-[300px] object-contain lg:max-w-full ${isDark ? "opacity-90" : "opacity-100"}`}
                priority
              />
            </div>

            {/* Floating trust badge — no glass, just clean */}
            <div
              className={`absolute bottom-6 right-0 rounded-xl px-4 py-3 shadow-md transition-colors duration-500 ${
                isDark ? "bg-[#1e2535] ring-1 ring-white/8" : "bg-white ring-1 ring-slate-200"
              }`}
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(10px)",
                transition: "opacity .6s ease .8s, transform .6s ease .8s",
              }}
            >
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="h-4 w-4 text-teal-500" />
                <div>
                  <p className={`text-[12px] font-semibold ${isDark ? "text-white" : "text-slate-800"}`}>
                    Clinically Validated
                  </p>
                  <p className={`text-[10.5px] ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                    Reviewed by health experts
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes breathe {
          0%, 100% { transform: scale(1);    opacity: 1;  }
          50%       { transform: scale(1.1); opacity: .65; }
        }
      `}</style>
    </section>
  );
}