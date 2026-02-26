'use client';
import Image from "next/image";
import { useTheme } from "@/contexts/ThemeContext";
import { useEffect, useRef, useState } from "react";

const stats = [
  { pct: 33, label: "Cardiovascular", icon: "/assets/cordial.png",   alt: "cardiovascular" },
  { pct: 17, label: "Cancers",        icon: "/assets/cancer.png",    alt: "cancers"        },
  { pct: 8,  label: "Diabetes",       icon: "/assets/diabetes.png",  alt: "diabetes"       },
  { pct: 14, label: "Other NCDs",     icon: "/assets/otherCNDS.png", alt: "other NCDs"     },
];

function useCountUp(target: number, duration = 1300, start = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let t0: number | null = null;
    const tick = (ts: number) => {
      if (!t0) t0 = ts;
      const p = Math.min((ts - t0) / duration, 1);
      setValue(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration, start]);
  return value;
}

export default function QuoteSection() {
  const { isDark, surface, accentColor } = useTheme();
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); io.disconnect(); } },
      { threshold: 0.18 }
    );
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  const big = useCountUp(74, 1500, visible);

  return (
    <section
      ref={ref}
      className="w-full py-20 md:py-28 transition-colors duration-500"
      style={{ background: surface.surfaceAlt }}
    >
      <div className="mx-auto max-w-6xl px-6 lg:px-16">
        <div className="flex flex-col gap-16 md:flex-row md:items-center md:gap-20">

          {/* LEFT: map */}
          <div
            className="relative flex w-full justify-center md:w-1/2 md:justify-start"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateX(0)" : "translateX(-18px)",
              transition: "opacity .75s ease, transform .75s ease",
            }}
          >
            <div
              className="absolute inset-0 -z-0"
              style={{
                background: "radial-gradient(ellipse at 50% 50%, rgba(13,148,136,.13) 0%, transparent 68%)",
                animation: "breathe 7s ease-in-out infinite",
              }}
            />
            <Image
              src="/assets/3.png"
              alt="World map showing NCD distribution"
              width={440}
              height={310}
              className={`relative z-10 w-full max-w-[340px] object-contain md:max-w-[420px] ${
                isDark ? "opacity-85" : "opacity-100"
              }`}
            />
          </div>

          {/* RIGHT: copy + stats */}
          <div
            className="flex w-full flex-col gap-10 md:w-1/2"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(16px)",
              transition: "opacity .75s ease .15s, transform .75s ease .15s",
            }}
          >
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.2em]"
              style={{ color: accentColor }}
            >
              Global Burden of Disease
            </p>

            <div className="flex flex-col gap-2">
              <div className="flex items-baseline gap-3">
                <span
                  className="text-[clamp(3.2rem,7vw,5rem)] font-bold leading-none tabular-nums"
                  style={{ color: surface.text }}
                >
                  {big}%
                </span>
                <span className="text-sm" style={{ color: surface.muted }}>
                  of all deaths
                </span>
              </div>
              <p
                className="max-w-[42ch] text-[14.5px] leading-[1.8]"
                style={{ color: surface.muted }}
              >
                Non-communicable diseases are the leading cause of mortality worldwide —
                responsible for more than 7 in 10 deaths every year.
              </p>
            </div>

            <div className="h-px w-full" style={{ background: surface.border }} />

            <div className="grid grid-cols-2 gap-y-8 gap-x-6 sm:grid-cols-4">
              {stats.map((s, i) => {
                // eslint-disable-next-line react-hooks/rules-of-hooks
                const count = useCountUp(s.pct, 1200, visible);
                return (
                  <div
                    key={s.alt}
                    className="flex flex-col gap-2"
                    style={{
                      opacity: visible ? 1 : 0,
                      transform: visible ? "translateY(0)" : "translateY(10px)",
                      transition: `opacity .5s ease ${280 + i * 90}ms, transform .5s ease ${280 + i * 90}ms`,
                    }}
                  >
                    <span
                      className="text-[1.6rem] font-bold tabular-nums leading-none"
                      style={{ color: accentColor }}
                    >
                      {count}%
                    </span>
                    <div className="flex items-center gap-2">
                      <Image src={s.icon} alt={s.alt} width={18} height={18} className="h-[18px] w-[18px] object-contain opacity-70" />
                      <span
                        className="text-[12px] font-medium leading-snug"
                        style={{ color: surface.muted }}
                      >
                        {s.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes breathe {
          0%, 100% { transform: scale(1);    opacity: 1;   }
          50%       { transform: scale(1.1); opacity: .65; }
        }
      `}</style>
    </section>
  );
}