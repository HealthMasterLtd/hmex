'use client';
import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";

const pillars = [
  {
    number: "01",
    title: "Detect Early",
    body: "A clinically-informed risk questionnaire surfaces hidden NCD risks before symptoms appear.",
  },
  {
    number: "02",
    title: "Personalise",
    body: "Your results are mapped to your lifestyle, age, and history — no generic advice.",
  },
  {
    number: "03",
    title: "Take Action",
    body: "Actionable prevention steps, diet guidance, and direct pathways to certified care.",
  },
];

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

export default function AwarenessSection() {
  const { isDark } = useTheme();
  const { ref, visible } = useInView(0.15);

  const c1 = useCountUp(74,  1400, visible);
  const c2 = useCountUp(2,   1200, visible); // billions
  const c3 = useCountUp(80,  1300, visible); // % preventable

  return (
    <section
      ref={ref}
      className="relative w-full overflow-hidden py-24 md:py-36"
    >
      {/* ── Parallax background ── */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-fixed"
        style={{ backgroundImage: "url(/Background.jpg)" }}
      />

      {/* ── Overlay: theme-aware tint ── */}
      <div
        className="absolute inset-0 transition-colors duration-500"
        style={{
          background: isDark
            ? "linear-gradient(160deg, rgba(10,15,26,.82) 0%, rgba(10,20,28,.75) 100%)"
            : "linear-gradient(160deg, rgba(4,30,45,.78) 0%, rgba(8,40,35,.72) 100%)",
        }}
      />

      {/* ── Subtle teal accent — top left ── */}
      <div
        className="pointer-events-none absolute -left-24 -top-24 h-[480px] w-[480px] rounded-full opacity-20"
        style={{
          background: "radial-gradient(circle, rgba(13,148,136,1) 0%, transparent 70%)",
          animation: "breathe 9s ease-in-out infinite",
        }}
      />

      {/* ── Content ── */}
      <div className="relative z-10 mx-auto max-w-6xl px-6 lg:px-16">

        {/* Eyebrow */}
        <p
          className="mb-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-teal-400"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(10px)",
            transition: "opacity .6s ease, transform .6s ease",
          }}
        >
          Our Approach
        </p>

        {/* Headline */}
        <h2
          className="max-w-2xl text-[clamp(2rem,4.5vw,3.4rem)] font-bold leading-[1.15] tracking-tight text-white"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(14px)",
            transition: "opacity .7s ease .1s, transform .7s ease .1s",
          }}
        >
          Turning awareness
          <br />
          <span className="text-teal-400">into action.</span>
        </h2>

        {/* Sub */}
        <p
          className="mt-5 max-w-[46ch] text-[15px] leading-[1.8] text-white/60"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(14px)",
            transition: "opacity .7s ease .2s, transform .7s ease .2s",
          }}
        >
          We combine technology, data, and community to help people detect
          risks early, take preventive action, and stay healthy for longer.
        </p>

        {/* ── Thin horizontal rule ── */}
        <div
          className="my-14 h-px w-full bg-white/10"
          style={{
            opacity: visible ? 1 : 0,
            transition: "opacity .8s ease .3s",
          }}
        />

        {/* ── Two-column: pillars left, stats right ── */}
        <div className="grid grid-cols-1 gap-14 lg:grid-cols-2 lg:gap-20">

          {/* Pillars */}
          <div className="flex flex-col gap-10">
            {pillars.map((p, i) => (
              <div
                key={p.number}
                className="flex gap-6"
                style={{
                  opacity: visible ? 1 : 0,
                  transform: visible ? "translateX(0)" : "translateX(-14px)",
                  transition: `opacity .6s ease ${0.35 + i * 0.12}s, transform .6s ease ${0.35 + i * 0.12}s`,
                }}
              >
                {/* Number + line */}
                <div className="flex flex-col items-center gap-2 pt-1">
                  <span className="text-[11px] font-bold tabular-nums text-teal-400/70">
                    {p.number}
                  </span>
                  {i < pillars.length - 1 && (
                    <div className="w-px flex-1 bg-white/10" />
                  )}
                </div>

                <div className="pb-2">
                  <h3 className="text-[15px] font-bold text-white">{p.title}</h3>
                  <p className="mt-1.5 text-[13.5px] leading-[1.75] text-white/55">
                    {p.body}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Stats — three big numbers, no cards */}
          <div className="flex flex-col justify-center gap-10">
            {[
              { value: c1, suffix: "%",  label: "of deaths are NCD-related globally" },
              { value: c2, suffix: "B+", label: "people at risk of an NCD right now" },
              { value: c3, suffix: "%",  label: "of NCDs are preventable with early action" },
            ].map((s, i) => (
              <div
                key={i}
                className="flex items-baseline gap-4"
                style={{
                  opacity: visible ? 1 : 0,
                  transform: visible ? "translateX(0)" : "translateX(14px)",
                  transition: `opacity .6s ease ${0.4 + i * 0.13}s, transform .6s ease ${0.4 + i * 0.13}s`,
                }}
              >
                <span className="text-[clamp(2.4rem,5vw,3.6rem)] font-bold tabular-nums leading-none text-white">
                  {s.value}{s.suffix}
                </span>
                <span className="max-w-[18ch] text-[13px] leading-[1.6] text-white/50">
                  {s.label}
                </span>
              </div>
            ))}
          </div>

        </div>
      </div>

      <style jsx>{`
        @keyframes breathe {
          0%, 100% { transform: scale(1);    opacity: .20; }
          50%       { transform: scale(1.12); opacity: .28; }
        }
      `}</style>
    </section>
  );
}