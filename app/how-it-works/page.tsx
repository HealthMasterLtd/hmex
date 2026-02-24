/* eslint-disable react-hooks/refs */
"use client";

import Image from "next/image";
import { ArrowRight, Shield, Clock, Heart, Users, ChevronRight, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Navbar from "@/components/landingpage/navbar";
import Footer from "@/components/ui/Footer";
import HowItWorks from "@/components/landingpage/how-it-works";
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

const benefits = [
  { icon: Shield, title: "Private & Secure",      desc: "Your health data is encrypted and never shared without your explicit consent."               },
  { icon: Clock,  title: "Results in Minutes",    desc: "Get instant risk assessment results powered by AI trained on validated clinical data."        },
  { icon: Heart,  title: "Personalised Plan",     desc: "Receive health recommendations based on your unique risk profile and lifestyle factors."      },
  { icon: Users,  title: "Expert-Backed Science", desc: "Our assessments are developed with leading healthcare professionals and researchers."         },
];

const journeySteps = [
  {
    n: "01",
    title: "Answer simple questions",
    body: "No medical jargon. Straightforward questions about your lifestyle, family history, and current health — taking under 2 minutes.",
    checks: ["Quick 2-minute completion", "Progress saved automatically", "Clear explanations for every question"],
  },
  {
    n: "02",
    title: "AI scores your risk",
    body: "Our model analyses your responses against validated clinical benchmarks across 12 NCD conditions instantly.",
    checks: ["Validated against clinical standards", "Considers multiple health dimensions", "Results available in seconds"],
  },
  {
    n: "03",
    title: "Get your personal report",
    body: "A clear, actionable risk profile with prevention tips and, where needed, referrals to nearby care.",
    checks: ["Visual risk score breakdown", "Personalised lifestyle recommendations", "Referral to nearby health centres"],
  },
];

const faqs = [
  { q: "How accurate is the assessment?",        a: "Our AI-powered assessment is validated against clinical standards and continuously refined with real-world data from healthcare professionals."                            },
  { q: "Is my health information secure?",        a: "Yes. We use strong encryption and comply with international healthcare data protection standards. Your information is never sold or shared without explicit consent." },
  { q: "How long does the assessment take?",      a: "Under 2 minutes. 12 simple questions about your lifestyle, health history, and habits."                                                                              },
  { q: "What happens after I get my results?",    a: "You'll receive a detailed risk profile with personalised recommendations. If needed, we'll connect you with nearby healthcare facilities."                           },
  { q: "Do I need any medical equipment?",        a: "No equipment needed. The assessment uses self-reported information. Knowing basic vitals like blood pressure can improve accuracy if you have them."                  },
];

export default function HowItWorksPage() {
  const { isDark } = useTheme();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const bg    = isDark ? "#0e1117" : "#ffffff";
  const bgAlt = isDark ? "#161b25" : "#f0f4f8";
  const h     = isDark ? "text-white"     : "text-slate-900";
  const p     = isDark ? "text-slate-400" : "text-slate-500";
  const ln    = isDark ? "rgba(255,255,255,.07)" : "rgba(0,0,0,.07)";

  const heroRef    = useInView(0.1);
  const benefitRef = useInView();
  const journeyRef = useInView();
  const faqRef     = useInView();

  return (
    <div className="min-h-screen transition-colors duration-500" style={{ background: bg }}>
      <Navbar />

      {/* ── HERO ── */}
      <section className="relative w-full overflow-hidden" style={{ background: bg }}>
        {/* Subtle teal quadrant */}
        <div
          className="pointer-events-none absolute right-0 top-0 h-[65%] w-[50%]"
          style={{
            background: isDark
              ? "radial-gradient(ellipse at 85% 15%, rgba(13,148,136,.08) 0%, transparent 65%)"
              : "radial-gradient(ellipse at 85% 15%, rgba(13,148,166,.10) 0%, transparent 65%)",
          }}
        />

        <div className="relative z-10 mx-auto grid min-h-screen max-w-7xl grid-cols-1 items-center gap-10 px-6 py-28 lg:grid-cols-2 lg:gap-20 lg:px-16 lg:py-0">
          <div
            className="flex flex-col gap-7"
            style={{
              opacity: heroRef.visible ? 1 : 0,
              transform: heroRef.visible ? "translateY(0)" : "translateY(16px)",
              transition: "opacity .7s ease, transform .7s ease",
            }}
            ref={heroRef.ref}
          >
            <p className={`text-[11px] font-semibold uppercase tracking-[0.22em] ${isDark ? "text-teal-400" : "text-teal-600"}`}>
              How It Works
            </p>

            <h1 className={`text-[clamp(2rem,3.8vw,3rem)] font-bold leading-[1.13] tracking-tight ${h}`}>
              Understanding your risk
              <br />
              <span className="bg-gradient-to-r from-teal-500 to-emerald-500 bg-clip-text text-transparent">
                has never been simpler.
              </span>
            </h1>

            <p className={`max-w-[40ch] text-[15px] leading-[1.8] ${p}`}>
              Our AI-powered platform helps you take control of your health
              through simple questions, instant insights, and personalised
              care guidance — in under two minutes.
            </p>

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
              <span className={`text-[12px] ${p}`}>Free · Under 2 minutes</span>
            </div>
          </div>

          <div className="relative flex items-end justify-center">
            <div
              className="absolute inset-0 -z-10"
              style={{
                background: "radial-gradient(ellipse at 50% 72%, rgba(13,148,136,.12) 0%, transparent 62%)",
                animation: "breathe 8s ease-in-out infinite",
              }}
            />
            <Image
              src="/assets/works.png"
              alt="Healthcare professional"
              width={480}
              height={560}
              className="w-full max-w-[320px] rounded-lg object-contain object-bottom lg:max-w-[420px]"
              priority
            />
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS COMPONENT ── */}
      <HowItWorks />

      {/* ── BENEFITS ── */}
      <section
        ref={benefitRef.ref}
        className="w-full py-24 md:py-28 transition-colors duration-500"
        style={{ background: bgAlt }}
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-16">
          <div
            className="mb-14"
            style={{
              opacity: benefitRef.visible ? 1 : 0,
              transform: benefitRef.visible ? "translateY(0)" : "translateY(14px)",
              transition: "opacity .7s ease, transform .7s ease",
            }}
          >
            <p className={`mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] ${isDark ? "text-teal-400" : "text-teal-600"}`}>
              Why HMEX
            </p>
            <h2 className={`text-[clamp(1.8rem,3.6vw,2.6rem)] font-bold leading-tight tracking-tight ${h}`}>
              Built for real life.
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-4" style={{ background: ln }}>
            {benefits.map((b, i) => {
              const Icon = b.icon;
              return (
                <div
                  key={i}
                  className="flex flex-col gap-4 p-8 transition-colors duration-500"
                  style={{
                    background: bgAlt,
                    opacity: benefitRef.visible ? 1 : 0,
                    transform: benefitRef.visible ? "translateY(0)" : "translateY(12px)",
                    transition: `opacity .55s ease ${i * 90}ms, transform .55s ease ${i * 90}ms`,
                  }}
                >
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${isDark ? "bg-teal-500/12 text-teal-400" : "bg-teal-500/10 text-teal-600"}`}>
                    <Icon className="h-[17px] w-[17px]" />
                  </div>
                  <div>
                    <h3 className={`mb-2 text-[14.5px] font-bold ${h}`}>{b.title}</h3>
                    <p className={`text-[13px] leading-[1.75] ${p}`}>{b.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── VISUAL JOURNEY ── */}
      <section
        ref={journeyRef.ref}
        className="w-full py-24 md:py-28 transition-colors duration-500"
        style={{ background: bg }}
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-16">
          <div
            className="mb-16"
            style={{
              opacity: journeyRef.visible ? 1 : 0,
              transform: journeyRef.visible ? "translateY(0)" : "translateY(14px)",
              transition: "opacity .7s ease, transform .7s ease",
            }}
          >
            <p className={`mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] ${isDark ? "text-teal-400" : "text-teal-600"}`}>
              Step by Step
            </p>
            <h2 className={`text-[clamp(1.8rem,3.6vw,2.6rem)] font-bold leading-tight tracking-tight ${h}`}>
              Your journey, visualised.
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-px md:grid-cols-3" style={{ background: ln }}>
            {journeySteps.map((step, i) => (
              <div
                key={i}
                className="flex flex-col gap-6 p-8 md:p-10 transition-colors duration-500"
                style={{
                  background: bg,
                  opacity: journeyRef.visible ? 1 : 0,
                  transform: journeyRef.visible ? "translateY(0)" : "translateY(16px)",
                  transition: `opacity .6s ease ${i * 130}ms, transform .6s ease ${i * 130}ms`,
                }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="text-[11px] font-bold tabular-nums"
                    style={{ color: isDark ? "rgba(255,255,255,.18)" : "rgba(0,0,0,.18)" }}
                  >
                    {step.n}
                  </span>
                  <div className="h-px flex-1 mx-4" style={{ background: ln }} />
                </div>

                <div>
                  <h3 className={`mb-3 text-[15px] font-bold ${h}`}>{step.title}</h3>
                  <p className={`text-[13.5px] leading-[1.8] ${p}`}>{step.body}</p>
                </div>

                <ul className="flex flex-col gap-2.5 pt-1">
                  {step.checks.map((c, ci) => (
                    <li key={ci} className="flex items-center gap-2.5">
                      <CheckCircle className={`h-3.5 w-3.5 shrink-0 ${isDark ? "text-teal-400" : "text-teal-500"}`} />
                      <span className={`text-[12.5px] ${p}`}>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section
        ref={faqRef.ref}
        className="w-full py-24 md:py-28 transition-colors duration-500"
        style={{ background: bgAlt }}
      >
        <div className="mx-auto max-w-3xl px-6">
          <div
            className="mb-14"
            style={{
              opacity: faqRef.visible ? 1 : 0,
              transform: faqRef.visible ? "translateY(0)" : "translateY(14px)",
              transition: "opacity .7s ease, transform .7s ease",
            }}
          >
            <p className={`mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] ${isDark ? "text-teal-400" : "text-teal-600"}`}>
              FAQ
            </p>
            <h2 className={`text-[clamp(1.8rem,3.6vw,2.6rem)] font-bold leading-tight tracking-tight ${h}`}>
              Common questions.
            </h2>
          </div>

          <div className="flex flex-col gap-0">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="border-b"
                style={{
                  borderColor: ln,
                  opacity: faqRef.visible ? 1 : 0,
                  transform: faqRef.visible ? "translateY(0)" : "translateY(10px)",
                  transition: `opacity .5s ease ${i * 70}ms, transform .5s ease ${i * 70}ms`,
                }}
              >
                <button
                  className="flex w-full items-center justify-between gap-4 py-5 text-left"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className={`text-[14.5px] font-semibold ${h}`}>{faq.q}</span>
                  <ChevronRight
                    className={`h-4 w-4 shrink-0 transition-transform duration-200 ${p} ${openFaq === i ? "rotate-90" : ""}`}
                  />
                </button>
                {openFaq === i && (
                  <p className={`pb-5 text-[13.5px] leading-[1.8] ${p}`}>{faq.a}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section className="w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Teal left */}
          <div
            className="relative flex flex-col justify-between gap-8 overflow-hidden px-10 py-14 md:px-16 md:py-16 xl:px-20"
            style={{ background: "linear-gradient(135deg, #0d9488 0%, #059669 100%)" }}
          >
            <div
              className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full opacity-[.07]"
              style={{ border: "44px solid #fff", animation: "breathe 9s ease-in-out infinite" }}
            />
            <div className="relative z-10 flex flex-col gap-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/60">Ready?</p>
              <h2 className="text-[clamp(1.7rem,3.4vw,2.6rem)] font-bold leading-[1.12] tracking-tight text-white">
                Take control of
                <br />your health today.
              </h2>
              <p className="max-w-[34ch] text-[14px] leading-[1.8] text-white/70">
                A two-minute risk check that could change how you approach your
                health for years to come. Free, private, clinically informed.
              </p>
            </div>
            <div className="relative z-10">
              <Link href="/questions">
                <button className="group inline-flex items-center gap-3 rounded-lg bg-white px-6 py-3.5 text-sm font-bold text-teal-700 transition-all hover:bg-white/92 active:scale-[.98]">
                  Start Free Assessment
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-600 text-white transition-transform group-hover:translate-x-0.5">
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </button>
              </Link>
            </div>
          </div>

          {/* Dark right */}
          <div
            className={`flex flex-col justify-between gap-8 px-10 py-14 md:px-16 md:py-16 xl:px-20 transition-colors duration-500 ${isDark ? "bg-[#161b25]" : "bg-white border border-slate-200"}`}
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
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <div className="h-px w-full" style={{ background: ln }} />
              <div className="grid grid-cols-3 gap-4">
                {[{ v: "2 min", l: "to complete" }, { v: "12", l: "conditions checked" }, { v: "Free", l: "always" }].map((s, i) => (
                  <div key={i} className="flex flex-col gap-1">
                    <span className={`text-[1.05rem] font-bold tabular-nums ${isDark ? "text-white" : "text-slate-900"}`}>{s.v}</span>
                    <span className={`text-[11px] ${isDark ? "text-white/35" : "text-slate-400"}`}>{s.l}</span>
                  </div>
                ))}
              </div>
              <div className="h-px w-full" style={{ background: ln }} />
              <Link href="/how-it-works">
                <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-teal-500 transition-colors hover:text-teal-400">
                  See how it works
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            </div>
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