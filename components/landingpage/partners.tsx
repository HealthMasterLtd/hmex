'use client';
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { Users, Globe2, Handshake, ClipboardCheck } from "lucide-react";

const partners = [
  { name: "ALX",                logo: "/Alxlogo-black.svg",       invert: true  },
  { name: "TMF",                logo: "/TMFlogo.svg",             invert: false },
  { name: "Bridge for Billions",logo: "/BridgeSquared_logo.png",  invert: false },
  { name: "Hanga",              logo: "/HangPitchFest25.png",     invert: false },
];

const achievements = [
  { icon: ClipboardCheck, value: "100+",  label: "Risk checks completed"       },
  { icon: Users,          value: "80+",   label: "Active users on the platform" },
  { icon: Globe2,         value: "3+",    label: "Countries represented"        },
  { icon: Handshake,      value: "4",     label: "Supporting organisations"     },
];

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

function useCountUp(target: number, duration = 1200, start = false) {
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

// Triple for seamless loop
const track = [...partners, ...partners, ...partners];

function StatCell({ a, i, visible, isDark }: {
  a: typeof achievements[0];
  i: number;
  visible: boolean;
  isDark: boolean;
}) {
  const Icon = a.icon;
  // parse numeric part for count-up
  const numeric = parseInt(a.value.replace(/\D/g, ""), 10);
  const suffix = a.value.replace(/[0-9]/g, "");
  const count = useCountUp(numeric, 1200, visible);

  return (
    <div
      className={`flex flex-col items-center gap-2 px-6 py-8 text-center transition-colors duration-500 ${
        isDark ? "bg-[#0e1117]" : "bg-white"
      }`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(8px)",
        transition: `opacity .5s ease ${180 + i * 90}ms, transform .5s ease ${180 + i * 90}ms`,
      }}
    >
      <Icon className={`h-4 w-4 ${isDark ? "text-teal-400" : "text-teal-500"}`} />
      <span className={`text-[1.65rem] font-bold tabular-nums leading-none ${isDark ? "text-white" : "text-slate-900"}`}>
        {count}{suffix}
      </span>
      <span className={`text-[11.5px] leading-snug ${isDark ? "text-slate-500" : "text-slate-400"}`}>
        {a.label}
      </span>
    </div>
  );
}

export default function Partners() {
  const { isDark } = useTheme();
  const { ref, visible } = useInView();

  return (
    <section
      ref={ref}
      className={`relative w-full overflow-hidden py-24 md:py-32 transition-colors duration-500 ${
        isDark ? "bg-[#0e1117]" : "bg-white"
      }`}
    >
      {/* Ghost headline */}
      <div
        className="pointer-events-none absolute inset-x-0 top-4 flex justify-center select-none"
        aria-hidden="true"
      >
        <span
          className="text-[clamp(3rem,9vw,7.5rem)] font-black uppercase leading-none tracking-tight"
          style={{
            color: "transparent",
            WebkitTextStroke: isDark ? "1px rgba(255,255,255,.035)" : "1px rgba(0,0,0,.04)",
            letterSpacing: "-0.02em",
            opacity: visible ? 1 : 0,
            transition: "opacity 1s ease",
          }}
        >
          OUR PARTNERS
        </span>
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-6 lg:px-16">

        {/* Header */}
        <div
          className="mb-16 flex flex-col gap-3 text-center"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(14px)",
            transition: "opacity .7s ease, transform .7s ease",
          }}
        >
          <p className={`text-[11px] font-semibold uppercase tracking-[0.22em] ${isDark ? "text-teal-400" : "text-teal-600"}`}>
            Backed By
          </p>
          <h2 className={`text-[clamp(1.8rem,3.8vw,2.8rem)] font-bold leading-tight tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
            With support from
          </h2>
          <p className={`mx-auto max-w-[44ch] text-[14.5px] leading-[1.8] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            We&apos;re proud to be backed by world-class organisations committed to
            health innovation across Africa and beyond.
          </p>
        </div>

        {/* Achievements row — count-up */}
        <div
          className={`mb-16 grid grid-cols-2 gap-px overflow-hidden rounded-2xl md:grid-cols-4 ${
            isDark ? "bg-white/6" : "bg-slate-100"
          }`}
          style={{
            opacity: visible ? 1 : 0,
            transition: "opacity .6s ease .1s",
          }}
        >
          {achievements.map((a, i) => (
            <StatCell key={i} a={a} i={i} visible={visible} isDark={isDark} />
          ))}
        </div>

        {/* Divider */}
        <div
          className="mb-10 flex items-center gap-4"
          style={{ opacity: visible ? 1 : 0, transition: "opacity .7s ease .3s" }}
        >
          <div className={`h-px flex-1 ${isDark ? "bg-white/8" : "bg-slate-100"}`} />
          <span className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${isDark ? "text-slate-600" : "text-slate-400"}`}>
            Partners & Supporters
          </span>
          <div className={`h-px flex-1 ${isDark ? "bg-white/8" : "bg-slate-100"}`} />
        </div>
      </div>

      {/* Infinite logo carousel */}
      <div
        className="relative w-full overflow-hidden"
        style={{ opacity: visible ? 1 : 0, transition: "opacity .8s ease .4s" }}
      >
        {/* Fade masks */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-28"
          style={{
            background: isDark
              ? "linear-gradient(to right, #0e1117, transparent)"
              : "linear-gradient(to right, #ffffff, transparent)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-28"
          style={{
            background: isDark
              ? "linear-gradient(to left, #0e1117, transparent)"
              : "linear-gradient(to left, #ffffff, transparent)",
          }}
        />

        <div
          className="flex items-center gap-20 py-6"
          style={{
            width: "max-content",
            animation: "marquee 30s linear infinite",
          }}
        >
          {track.map((p, i) => (
            <div
              key={i}
              className="flex shrink-0 items-center justify-center"
              style={{ width: "150px", height: "52px" }}
            >
              <Image
                src={p.logo}
                alt={p.name}
                width={130}
                height={48}
                className={`h-10 w-auto max-w-[130px] object-contain transition-all duration-300 ${
                  isDark
                    ? p.invert
                      ? "opacity-50 brightness-0 invert hover:opacity-90"   // SVGs that are black → invert to white
                      : "opacity-45 hover:opacity-85"                         // PNGs/colour logos → just lighten
                    : "opacity-45 grayscale hover:opacity-100 hover:grayscale-0"
                }`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div
        className="relative z-10 mx-auto mt-12 max-w-6xl px-6 text-center lg:px-16"
        style={{ opacity: visible ? 1 : 0, transition: "opacity .7s ease .6s" }}
      >
        <p className={`text-[12.5px] leading-relaxed ${isDark ? "text-slate-600" : "text-slate-400"}`}>
          Interested in partnering with us?{" "}
          <a
            href="mailto:hello@hmex.health"
            className={`font-medium underline-offset-2 hover:underline ${isDark ? "text-teal-400" : "text-teal-600"}`}
          >
            Get in touch
          </a>
        </p>
      </div>

      <style jsx>{`
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(calc(-100% / 3)); }
        }
      `}</style>
    </section>
  );
}