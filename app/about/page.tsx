/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  BarChart2, Lightbulb, Link2, Smartphone, TrendingUp,
  ChevronLeft, ChevronRight, ArrowRight, Target, Eye,
  Play
} from "lucide-react";
import Navbar from "@/components/landingpage/navbar";
import Footer from "@/components/ui/Footer";
import { useTheme } from "@/contexts/ThemeContext";
import ThemeToggle from "@/components/Themetoggle";

/* ─────────────────── Shared hook ─────────────────── */
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

/* ─────────────────── Data ─────────────────── */
const team = [
  { name: "Irene Dushime",     role: "CEO",             image: "/assets/new/Irene.jpg"   },
  { name: "Bonheur",           role: "COO",             image: "/assets/new/bonheur.JPG" },
  { name: "Brian Chege",       role: "CTO",             image: "/assets/new/brian.jpeg"  },
  { name: "Mucyo Papy Blaise", role: "Developer",       image: "/assets/14.png"          },
  { name: "Francis",           role: "Product Manager", image: "/assets/new/Francis.JPG" },
];

const services = [
  { icon: BarChart2,  text: "Help users quickly assess their risk for diabetes and hypertension"                  },
  { icon: Lightbulb,  text: "Provide clear, personalized prevention tips based on individual results"             },
  { icon: Link2,      text: "Connect people to healthcare professionals when needed"                               },
  { icon: Smartphone, text: "Support better follow-up and medication adherence over time"                         },
  { icon: TrendingUp, text: "Generate anonymized insights that help strengthen public health systems"             },
];

/* ═══════════════════════════════════════════════════════
   ABOUT PAGE
═══════════════════════════════════════════════════════ */
export default function AboutPage() {
  const { surface } = useTheme();

  return (
    <div className="min-h-screen transition-colors duration-500" style={{ background: surface.bg }}>
      <Navbar />

      {/* ══ 1. HERO ══════════════════════════════════════ */}
      <section className="relative h-[62vh] min-h-[400px] overflow-hidden">
        <Image
          src="/assets/new/hero.png"
          alt="About HMEX"
          fill
          className="object-cover"
          priority
        />
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(160deg, rgba(4,30,45,.82) 0%, rgba(8,40,35,.75) 100%)",
          }}
        />
        <div
          className="pointer-events-none absolute -left-24 bottom-0 h-80 w-80 rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, rgba(13,148,136,1) 0%, transparent 70%)",
            animation: "breathe 9s ease-in-out infinite",
          }}
        />
        <div className="relative z-10 flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-teal-400">
            Our Story
          </p>
          <h1 className="text-[clamp(2.2rem,5vw,4rem)] font-bold leading-tight tracking-tight text-white">
            About HMEX
          </h1>
          <p className="max-w-[44ch] text-[15px] leading-[1.8] text-white/60">
            A digital health team committed to helping people understand their
            health earlier — before serious complications arise.
          </p>
        </div>
      </section>

      <WhoWeAre />
      <WhyWeExist />
      <MissionVision />
      <WhatWeDo />
      <ImpactStats />
      <TeamSection />
      <JoinUs />

      <Footer />

      <style jsx global>{`
        @keyframes breathe {
          0%, 100% { transform: scale(1);    opacity: 1;   }
          50%       { transform: scale(1.1); opacity: .65; }
        }
      `}</style>
    </div>
  );
}

/* ══ WHO WE ARE ════════════════════════════════════════ */
function WhoWeAre() {
  const { isDark, surface, accentColor } = useTheme();
  const { ref, visible } = useInView();

  return (
    <section ref={ref} className="w-full py-24 md:py-28 transition-colors duration-500" style={{ background: surface.bg }}>
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 px-6 lg:grid-cols-2 lg:gap-20 lg:px-16">

        <div
          className="flex flex-col gap-6"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateX(0)" : "translateX(-16px)",
            transition: "opacity .7s ease, transform .7s ease",
          }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: accentColor }}>
            Who We Are
          </p>
          <h2
            className="text-[clamp(1.8rem,3.6vw,2.6rem)] font-bold leading-tight tracking-tight"
            style={{ color: surface.text }}
          >
            Built for everyday people,
            <br />
            <span className="bg-gradient-to-r from-teal-500 to-emerald-500 bg-clip-text text-transparent">
              not just patients.
            </span>
          </h2>
          <p className="max-w-[40ch] text-[15px] leading-[1.8]" style={{ color: surface.muted }}>
            We are a digital health team committed to helping people understand
            their health earlier — before serious complications arise. Our platform
            uses simple questions, smart technology, and clear guidance to help
            individuals assess their risk for non-communicable diseases.
          </p>
          <p className="max-w-[40ch] text-[15px] leading-[1.8]" style={{ color: surface.muted }}>
            We believe that everyone deserves access to basic health insights, no
            matter where they live or what device they use.
          </p>
          <div className="h-px w-12" style={{ background: surface.subtle }} />
          <div className="flex flex-wrap gap-8">
            {[{ v: "100+", l: "Users" }, { v: "3+", l: "Countries" }, { v: "12", l: "Conditions" }].map((s, i) => (
              <div key={i}>
                <p className="text-[1.6rem] font-bold tabular-nums leading-none" style={{ color: surface.text }}>{s.v}</p>
                <p className="mt-1 text-[12px]" style={{ color: surface.muted }}>{s.l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Image keeps rounded corners */}
        <div
          className="overflow-hidden rounded-2xl"
          style={{
            border: `1px solid ${surface.border}`,
            opacity: visible ? 1 : 0,
            transform: visible ? "translateX(0)" : "translateX(16px)",
            transition: "opacity .75s ease .1s, transform .75s ease .1s",
          }}
        >
          <Image
            src="/assets/new/2.png"
            alt="Healthcare team"
            width={600}
            height={420}
            className="h-[280px] w-full object-cover sm:h-[360px]"
          />
        </div>
      </div>
    </section>
  );
}

/* ══ WHY WE EXIST ═══════════════════════════════════════ */
function WhyWeExist() {
  const { isDark, surface, accentColor } = useTheme();
  const { ref, visible } = useInView();

  return (
    <section ref={ref} className="w-full py-24 md:py-28 transition-colors duration-500" style={{ background: surface.surfaceAlt }}>
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 px-6 lg:grid-cols-2 lg:gap-20 lg:px-16">

        {/* Staggered image mosaic — images keep rounded corners */}
        <div
          className="grid grid-cols-2 gap-3"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateX(0)" : "translateX(-16px)",
            transition: "opacity .75s ease, transform .75s ease",
          }}
        >
          <div className="overflow-hidden rounded-xl">
            <Image src="/assets/new/2.png" alt="" width={300} height={200} className="h-44 w-full object-cover" />
          </div>
          <div className="mt-8 overflow-hidden rounded-xl">
            <Image src="/assets/new/3.png" alt="" width={300} height={200} className="h-44 w-full object-cover" />
          </div>
          <div className="-mt-4 overflow-hidden rounded-xl">
            <Image src="/assets/new/4.png" alt="" width={300} height={200} className="h-44 w-full object-cover" />
          </div>
          {/* Video preview */}
          <div className="relative mt-8 overflow-hidden rounded-xl">
            <Image src="/assets/new/cancerII.png" alt="" width={300} height={200} className="h-44 w-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full shadow-lg"
                style={{ background: isDark ? "rgba(255,255,255,0.9)" : "#fff" }}
              >
                <Play className="ml-0.5 h-4 w-4 text-teal-600" />
              </div>
            </div>
          </div>
        </div>

        <div
          className="flex flex-col gap-6"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateX(0)" : "translateX(16px)",
            transition: "opacity .75s ease .15s, transform .75s ease .15s",
          }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: accentColor }}>
            Why We Exist
          </p>
          <h2
            className="text-[clamp(1.8rem,3.6vw,2.6rem)] font-bold leading-tight tracking-tight"
            style={{ color: surface.text }}
          >
            The gap we&apos;re
            <br />closing.
          </h2>
          <p className="max-w-[40ch] text-[15px] leading-[1.8]" style={{ color: surface.muted }}>
            Non-communicable diseases are silently affecting millions of people
            across Africa. Many live with conditions like hypertension or
            diabetes without knowing it — until it becomes serious.
          </p>
          <p className="max-w-[40ch] text-[15px] leading-[1.8]" style={{ color: surface.muted }}>
            We exist to close this gap by making early risk screening simple,
            accessible, and understandable for everyday people.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ══ MISSION & VISION ═══════════════════════════════════ */
function MissionVision() {
  const { isDark, surface, accentColor } = useTheme();
  const { ref, visible } = useInView();

  return (
    <section ref={ref} className="w-full py-24 md:py-28 transition-colors duration-500" style={{ background: surface.bg }}>
      <div className="mx-auto max-w-7xl px-6 lg:px-16">
        <div
          className="mb-14 text-center"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(14px)",
            transition: "opacity .7s ease, transform .7s ease",
          }}
        >
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: accentColor }}>
            Our Foundation
          </p>
          <h2
            className="text-[clamp(1.8rem,3.6vw,2.6rem)] font-bold leading-tight tracking-tight"
            style={{ color: surface.text }}
          >
            Mission & Vision
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-0 md:grid-cols-2">
          {[
            {
              icon: Target, label: "Our Mission",
              text: "To empower individuals with early health awareness and guide them toward the right care using technology that is simple, trusted, and built for real life.",
            },
            {
              icon: Eye, label: "Our Vision",
              text: "A world where no one is caught off guard by a preventable disease — where every person has the tools to understand and act on their health early.",
            },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={i}
                className="flex flex-col gap-6 p-10 md:p-14"
                style={{
                  borderRight: i === 0 ? `1px solid ${surface.border}` : "none",
                  opacity: visible ? 1 : 0,
                  transform: visible ? "translateY(0)" : "translateY(14px)",
                  transition: `opacity .6s ease ${i * 120}ms, transform .6s ease ${i * 120}ms`,
                }}
              >
                {/* Icon tile — sharp */}
                <div
                  className="flex h-10 w-10 items-center justify-center"
                  style={{
                    borderRadius: 0,
                    background: isDark ? "rgba(13,148,136,0.12)" : "rgba(13,148,136,0.10)",
                    color: accentColor,
                  }}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: surface.subtle }}>
                    {item.label}
                  </p>
                  <p className="text-[15px] leading-[1.8]" style={{ color: surface.muted }}>{item.text}</p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="h-px w-full" style={{ background: surface.border }} />
      </div>
    </section>
  );
}

/* ══ WHAT WE DO ═════════════════════════════════════════ */
function WhatWeDo() {
  const { isDark, surface, accentColor } = useTheme();
  const { ref, visible } = useInView();

  return (
    <section ref={ref} className="w-full py-24 md:py-28 transition-colors duration-500" style={{ background: surface.surfaceAlt }}>
      <div className="mx-auto max-w-7xl px-6 lg:px-16">
        <div
          className="mb-14"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(14px)",
            transition: "opacity .7s ease, transform .7s ease",
          }}
        >
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: accentColor }}>
            What We Do
          </p>
          <h2
            className="text-[clamp(1.8rem,3.6vw,2.6rem)] font-bold leading-tight tracking-tight"
            style={{ color: surface.text }}
          >
            Five ways we help.
          </h2>
        </div>

        <div className="flex flex-col gap-0">
          {services.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={i}
                className="flex items-start gap-6 py-6"
                style={{
                  borderBottom: i < services.length - 1 ? `1px solid ${surface.border}` : "none",
                  opacity: visible ? 1 : 0,
                  transform: visible ? "translateX(0)" : "translateX(-14px)",
                  transition: `opacity .55s ease ${i * 80}ms, transform .55s ease ${i * 80}ms`,
                }}
              >
                {/* Icon tile — sharp */}
                <div
                  className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center"
                  style={{
                    borderRadius: 0,
                    background: isDark ? "rgba(13,148,136,0.12)" : "rgba(13,148,136,0.10)",
                    color: accentColor,
                  }}
                >
                  <Icon className="h-[17px] w-[17px]" />
                </div>
                <p className="pt-1.5 text-[14.5px] leading-[1.75]" style={{ color: surface.muted }}>{s.text}</p>
                <span
                  className="ml-auto shrink-0 self-center text-[11px] font-bold tabular-nums"
                  style={{ color: surface.subtle }}
                >
                  0{i + 1}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ══ IMPACT STATS ═══════════════════════════════════════ */
function ImpactStats() {
  const { ref, visible } = useInView();
  const c1 = useCountUp(100, 1200, visible);
  const c2 = useCountUp(500, 1400, visible);

  return (
    <section ref={ref} className="relative w-full overflow-hidden py-24 md:py-28">
      <div
        className="absolute inset-0 bg-cover bg-center bg-fixed"
        style={{ backgroundImage: "url('/assets/new/4.png')" }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(160deg, rgba(4,30,45,.87) 0%, rgba(8,40,35,.82) 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute -right-20 top-1/4 h-96 w-96 rounded-full opacity-[.14]"
        style={{
          background: "radial-gradient(circle, rgba(13,148,136,1) 0%, transparent 70%)",
          animation: "breathe 9s ease-in-out infinite",
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-16">
        <div
          className="mb-14"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(14px)",
            transition: "opacity .7s ease, transform .7s ease",
          }}
        >
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-teal-400">
            Our Impact
          </p>
          <h2 className="text-[clamp(1.8rem,3.6vw,2.6rem)] font-bold leading-tight tracking-tight text-white">
            Early traction.
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-px sm:grid-cols-2" style={{ background: "rgba(255,255,255,.08)" }}>
          {[
            { v: c1, s: "+", title: "Risk assessments completed",        sub: "Helping individuals understand their potential risk for diabetes and hypertension." },
            { v: c2, s: "+", title: "Personalised health tips delivered", sub: "Actionable, easy-to-follow guidance tailored based on individual responses."        },
          ].map((stat, i) => (
            <div
              key={i}
              className="flex flex-col gap-3 p-10 md:p-14"
              style={{
                background: "rgba(4,30,45,.60)",
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(10px)",
                transition: `opacity .6s ease ${i * 120}ms, transform .6s ease ${i * 120}ms`,
              }}
            >
              <span className="text-[clamp(2.6rem,5vw,4rem)] font-bold tabular-nums leading-none text-white">
                {stat.v}{stat.s}
              </span>
              <p className="text-[15px] font-semibold text-white/80">{stat.title}</p>
              <p className="max-w-[38ch] text-[13.5px] leading-[1.75] text-white/45">{stat.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══ TEAM ═══════════════════════════════════════════════ */
function TeamSection() {
  const { isDark, surface, accentColor } = useTheme();
  const { ref, visible } = useInView();
  const [current, setCurrent] = useState(0);
  const prev = () => setCurrent(i => (i === 0 ? team.length - 1 : i - 1));
  const next = () => setCurrent(i => (i === team.length - 1 ? 0 : i + 1));

  return (
    <section ref={ref} className="w-full py-24 md:py-28 transition-colors duration-500" style={{ background: surface.surfaceAlt }}>
      <div className="mx-auto max-w-7xl px-6 lg:px-16">

        <div
          className="mb-14"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(14px)",
            transition: "opacity .7s ease, transform .7s ease",
          }}
        >
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: accentColor }}>
            The Team
          </p>
          <h2
            className="text-[clamp(1.8rem,3.6vw,2.6rem)] font-bold leading-tight tracking-tight"
            style={{ color: surface.text }}
          >
            The people behind HMEX.
          </h2>
        </div>

        {/* Desktop grid — team cards sharp */}
        <div
          className="hidden md:grid md:grid-cols-5 gap-px overflow-hidden"
          style={{ background: surface.border }}
        >
          {team.map((member, i) => (
            <div
              key={i}
              className="group flex flex-col transition-colors duration-500"
              style={{
                background: surface.surfaceAlt,
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(12px)",
                transition: `opacity .55s ease ${i * 80}ms, transform .55s ease ${i * 80}ms`,
              }}
            >
              <div className="overflow-hidden">
                <Image
                  src={member.image}
                  alt={member.name}
                  width={220}
                  height={260}
                  className="h-52 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-col gap-0.5 px-5 py-4">
                <p className="text-[13.5px] font-bold leading-snug" style={{ color: surface.text }}>{member.name}</p>
                <p className="text-[12px]" style={{ color: surface.muted }}>{member.role}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile carousel — keeps rounded-xl on image wrapper only */}
        <div className="relative md:hidden">
          <div
            className="overflow-hidden rounded-xl"
            style={{ background: surface.surfaceAlt }}
          >
            <Image
              src={team[current].image}
              alt={team[current].name}
              width={400}
              height={320}
              className="h-64 w-full object-cover"
            />
            <div className="px-6 py-5">
              <p className="text-[15px] font-bold" style={{ color: surface.text }}>{team[current].name}</p>
              <p className="text-[13px]" style={{ color: surface.muted }}>{team[current].role}</p>
            </div>
          </div>

          {/* Controls */}
          <div className="mt-5 flex items-center justify-between">
            <div className="flex gap-2">
              {team.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className="h-1.5 transition-all duration-200"
                  style={{
                    borderRadius: 0,
                    width: i === current ? "24px" : "6px",
                    background: i === current
                      ? accentColor
                      : isDark ? "rgba(255,255,255,.2)" : "rgba(0,0,0,.15)",
                  }}
                />
              ))}
            </div>
            <div className="flex gap-2">
              {[{ fn: prev, Icon: ChevronLeft }, { fn: next, Icon: ChevronRight }].map(({ fn, Icon }, i) => (
                <button
                  key={i}
                  onClick={fn}
                  className="flex h-9 w-9 items-center justify-center transition-colors duration-150"
                  style={{
                    borderRadius: 0,
                    background: isDark ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.06)",
                  }}
                >
                  <Icon className="h-4 w-4" style={{ color: surface.muted }} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ══ JOIN US ════════════════════════════════════════════ */
function JoinUs() {
  const { surface, accentColor } = useTheme();
  const { ref, visible } = useInView();

  return (
    <section ref={ref} className="w-full" style={{ background: surface.bg }}>
      <div className="grid grid-cols-1 lg:grid-cols-2">

        {/* Left — copy */}
        <div
          className="flex flex-col justify-center gap-7 px-10 py-16 md:px-16 md:py-20 xl:px-20"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateX(0)" : "translateX(-16px)",
            transition: "opacity .7s ease, transform .7s ease",
          }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: accentColor }}>
            Work With Us
          </p>
          <h2
            className="text-[clamp(1.8rem,3.6vw,2.6rem)] font-bold leading-tight tracking-tight"
            style={{ color: surface.text }}
          >
            Join our mission.
          </h2>
          <p className="max-w-[38ch] text-[15px] leading-[1.8]" style={{ color: surface.muted }}>
            We are building this platform with communities, healthcare workers,
            and partners who believe in preventive care. If you share our
            vision, we&apos;d love to work together.
          </p>

          <div className="h-px w-full" style={{ background: surface.border }} />

          <Link href="/contact">
            <button
              className="group inline-flex w-fit items-center gap-2.5 px-7 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 active:scale-[.98]"
              style={{
                borderRadius: 0,
                background: "linear-gradient(135deg, #0d9488, #059669)",
                boxShadow: "0 4px 18px rgba(13,148,136,.28)",
                border: "none",
              }}
            >
              Get in Touch
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </Link>
        </div>

        {/* Right — full-bleed image, no radius */}
        <div
          className="hidden lg:block"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateX(0)" : "translateX(16px)",
            transition: "opacity .75s ease .15s, transform .75s ease .15s",
          }}
        >
          <Image
            src="/assets/new/1.png"
            alt="Healthcare professional"
            width={700}
            height={500}
            className="h-full w-full object-cover"
          />
        </div>
      </div>
      <ThemeToggle/>
    </section>
  );
}