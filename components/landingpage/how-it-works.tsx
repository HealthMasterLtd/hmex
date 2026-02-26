'use client';
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ClipboardCheck, Brain, Lightbulb, Hospital, Share2 } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

const steps = [
  { number: "01", title: "Check Your Risk",     description: "Answer a short set of health and lifestyle questions tailored to you.",              icon: ClipboardCheck, side: "left"  },
  { number: "02", title: "AI Analyzes",         description: "Our model scores your NCD risk instantly across 12 conditions.",                     icon: Brain,          side: "left"  },
  { number: "03", title: "Get Smart Tips",      description: "Receive daily prevention advice and lifestyle guidance personalised to your profile.",icon: Lightbulb,      side: "left"  },
  { number: "04", title: "Connect to Care",     description: "Get referred to certified nearby health centres when you need them.",                 icon: Hospital,       side: "right" },
  { number: "05", title: "Empowering Insights", description: "Your anonymised data helps health systems identify risks and act faster.",            icon: Share2,         side: "right" },
];

const leftSteps  = steps.filter(s => s.side === "left");
const rightSteps = steps.filter(s => s.side === "right");

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

function StepItem({
  step, visible, delay, align,
}: {
  step: typeof steps[0];
  visible: boolean;
  delay: number;
  align: "left" | "right";
}) {
  const { isDark, surface, accentColor } = useTheme();
  const Icon = step.icon;
  return (
    <div
      className="flex items-start gap-4"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible
          ? "translateX(0)"
          : align === "left" ? "translateX(-20px)" : "translateX(20px)",
        transition: `opacity .6s ease ${delay}ms, transform .6s ease ${delay}ms`,
      }}
    >
      <span
        className="w-8 shrink-0 pt-0.5 text-right text-[11px] font-bold tabular-nums"
        style={{ color: surface.subtle }}
      >
        {step.number}
      </span>

      <div
        className="relative mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
        style={{ background: isDark ? "rgba(13,148,136,0.15)" : "rgba(13,148,136,0.08)" }}
      >
        <Icon className="h-4 w-4" style={{ color: accentColor }} />
      </div>

      <div className="flex-1 pb-8">
        <h3 className="text-[14.5px] font-bold leading-snug" style={{ color: surface.text }}>
          {step.title}
        </h3>
        <p className="mt-1 text-[13px] leading-[1.75]" style={{ color: surface.muted }}>
          {step.description}
        </p>
      </div>
    </div>
  );
}

function StepList({ list, visible, baseDelay, align }: {
  list: typeof steps;
  visible: boolean;
  baseDelay: number;
  align: "left" | "right";
}) {
  const { isDark, accentColor } = useTheme();
  return (
    <div className="relative flex flex-col">
      <div
        className="pointer-events-none absolute left-[2.35rem] top-4 w-px"
        style={{
          bottom: "2.5rem",
          background: isDark
            ? "linear-gradient(to bottom, rgba(20,184,166,.3), rgba(20,184,166,.05))"
            : "linear-gradient(to bottom, rgba(13,148,136,.25), rgba(13,148,136,.03))",
          opacity: visible ? 1 : 0,
          transition: "opacity .8s ease .2s",
        }}
      />
      {list.map((step, i) => (
        <StepItem
          key={step.number}
          step={step}
          visible={visible}
          delay={baseDelay + i * 110}
          align={align}
        />
      ))}
    </div>
  );
}

export default function HowItWorks() {
  const { surface, accentColor } = useTheme();
  const { ref, visible } = useInView(0.1);

  return (
    <section
      id="how-it-works"
      ref={ref}
      className="relative w-full scroll-mt-24 overflow-hidden py-24 md:py-32 transition-colors duration-500"
      style={{ background: surface.bg }}
    >
      {/* Ghost headline */}
      <div
        className="pointer-events-none absolute inset-x-0 top-6 flex justify-center select-none"
        aria-hidden="true"
      >
        <span
          className="text-[clamp(4rem,12vw,9rem)] font-black uppercase leading-none tracking-tight transition-colors duration-500"
          style={{
            color: "transparent",
            WebkitTextStroke: `1px ${surface.subtle}20`,
            letterSpacing: "-0.02em",
            opacity: visible ? 1 : 0,
            transition: "opacity 1s ease .1s",
          }}
        >
          HOW IT WORKS
        </span>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-16">

        {/* Header */}
        <div
          className="mb-16 text-center"
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
            Your Journey
          </p>
          <h2
            className="text-[clamp(1.8rem,3.8vw,2.8rem)] font-bold leading-tight tracking-tight"
            style={{ color: surface.text }}
          >
            How it works
          </h2>
          <p
            className="mx-auto mt-4 max-w-[48ch] text-[14.5px] leading-[1.8]"
            style={{ color: surface.muted }}
          >
            Five simple steps from risk awareness to personalised care — taking less than two minutes.
          </p>
        </div>

        {/* Three-column layout */}
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[1fr_260px_1fr] xl:grid-cols-[1fr_300px_1fr] lg:gap-8 xl:gap-12">

          <StepList list={leftSteps} visible={visible} baseDelay={150} align="left" />

          {/* Center image */}
          <div
            className="flex justify-center lg:sticky lg:top-28"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "scale(1)" : "scale(.96)",
              transition: "opacity .8s ease .1s, transform .8s ease .1s",
            }}
          >
            <div className="relative w-full max-w-[240px] md:max-w-[280px] lg:max-w-full">
              <div
                className="absolute inset-0 -z-10 rounded-full"
                style={{
                  background: "radial-gradient(ellipse at 50% 60%, rgba(13,148,136,.18) 0%, transparent 70%)",
                  animation: "breathe 7s ease-in-out infinite",
                }}
              />
              <Image
                src="/assets/4zoom.png"
                alt="Healthcare professional showing five fingers"
                width={300}
                height={420}
                className="relative w-full h-auto object-contain"
                priority
              />
            </div>
          </div>

          <StepList list={rightSteps} visible={visible} baseDelay={250} align="right" />
        </div>
      </div>

      <style jsx>{`
        @keyframes breathe {
          0%, 100% { transform: scale(1);    opacity: 1;  }
          50%       { transform: scale(1.1); opacity: .7; }
        }
      `}</style>
    </section>
  );
}