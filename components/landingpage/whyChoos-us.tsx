'use client';
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { HeartPulse, HandHelping, Cpu, Radar, ShieldCheck } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

const features = [
  { icon: HeartPulse,  title: "AI-Driven Accuracy",      description: "Risk assessments built on validated medical research and reviewed by health experts."      },
  { icon: HandHelping, title: "Human + Technology",      description: "Smart AI guidance backed by real doctors for results you can actually trust."               },
  { icon: Cpu,         title: "Fast & Accessible",       description: "Complete your full risk check in under two minutes — anywhere, any device."                },
  { icon: Radar,       title: "Personalised Prevention", description: "Simple, actionable insights tailored precisely to your lifestyle and history."              },
  { icon: ShieldCheck, title: "Secure & Private",        description: "Your data is encrypted, confidential, and never sold to third parties."                    },
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
  const { isDark, surface, accentColor } = useTheme();
  const { ref, visible } = useInView();
  const count = useCountUp(1240, 1600, visible);

  return (
    <section
      ref={ref}
      className="relative w-full overflow-hidden py-24 md:py-32 transition-colors duration-500"
      style={{ background: surface.surfaceAlt }}
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
            WebkitTextStroke: `1px ${surface.subtle}20`,
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
          <p
            className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em]"
            style={{ color: accentColor }}
          >
            Our Difference
          </p>
          <h2
            className="text-[clamp(1.8rem,3.8vw,2.8rem)] font-bold leading-tight tracking-tight"
            style={{ color: surface.text }}
          >
            Why choose us
          </h2>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-14 xl:gap-20">

          {/* LEFT: feature list */}
          <div className="flex flex-col gap-0">
            {features.map((f, i) => {
              const Icon = f.icon;
              const isLast = i === features.length - 1;
              return (
                <div
                  key={i}
                  className="flex items-start gap-5 py-6"
                  style={{
                    borderBottom: isLast ? "none" : `1px solid ${surface.border}`,
                    opacity: visible ? 1 : 0,
                    transform: visible ? "translateX(0)" : "translateX(-16px)",
                    transition: `opacity .55s ease ${120 + i * 95}ms, transform .55s ease ${120 + i * 95}ms`,
                  }}
                >
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                    style={{
                      background: isDark ? "rgba(13,148,136,0.12)" : "rgba(13,148,136,0.10)",
                      color: accentColor,
                    }}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                  </div>

                  <div className="flex-1">
                    <h3
                      className="text-[14.5px] font-bold"
                      style={{ color: surface.text }}
                    >
                      {f.title}
                    </h3>
                    <p
                      className="mt-1 text-[13px] leading-[1.75]"
                      style={{ color: surface.muted }}
                    >
                      {f.description}
                    </p>
                  </div>

                  <span
                    className="shrink-0 self-center text-[11px] font-bold tabular-nums"
                    style={{ color: surface.subtle }}
                  >
                    0{i + 1}
                  </span>
                </div>
              );
            })}
          </div>

          {/* RIGHT: image + stat */}
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
                <span
                  className="text-[clamp(2.8rem,5.5vw,4rem)] font-bold tabular-nums leading-none"
                  style={{ color: surface.text }}
                >
                  {count.toLocaleString()}+
                </span>
              </div>
              <p className="mt-2 text-[13px]" style={{ color: surface.muted }}>
                NCD risk checks completed
              </p>

              <div
                className="mt-4 h-px w-full overflow-hidden rounded-full"
                style={{ background: surface.border }}
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500"
                  style={{
                    width: visible ? "72%" : "0%",
                    transition: "width 1.4s cubic-bezier(.16,1,.3,1) .4s",
                  }}
                />
              </div>
              <div
                className="mt-1.5 flex justify-between text-[10px] tabular-nums"
                style={{ color: surface.subtle }}
              >
                <span>0</span>
                <span>Target: 2,000</span>
              </div>
            </div>

            {/* Image */}
            <div className="relative flex-1">
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

            {/* Trust badge */}
            <div
              className="absolute bottom-6 right-0 px-4 py-3 shadow-md transition-colors duration-500"
              style={{
                background: surface.surface,
                border: `1px solid ${surface.border}`,
                borderRadius: "12px",
                boxShadow: isDark
                  ? "0 4px 20px rgba(0,0,0,0.40)"
                  : "0 4px 16px rgba(0,0,0,0.08)",
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(10px)",
                transition: "opacity .6s ease .8s, transform .6s ease .8s",
              }}
            >
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="h-4 w-4 text-teal-500" />
                <div>
                  <p className="text-[12px] font-semibold" style={{ color: surface.text }}>
                    Clinically Validated
                  </p>
                  <p className="text-[10.5px]" style={{ color: surface.muted }}>
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