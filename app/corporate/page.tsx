"use client";

import Navbar from "@/components/landingpage/navbar";
import Footer from "@/components/ui/Footer";
import { Users, Briefcase, Calendar, ArrowRight, CheckCircle, Send } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import ThemeToggle from "@/components/Themetoggle";
import Lottie from "lottie-react";

// ─── Lottie JSON (inline, no extra fetch) ────────────────────────────────────
// Uses the free "success checkmark" from LottieFiles (lf20_jbrw3hcz / green check)
// We embed a small hand-crafted animation so there's zero external dependency.
const SUCCESS_LOTTIE = {
  v: "5.7.4",
  fr: 60,
  ip: 0,
  op: 90,
  w: 200,
  h: 200,
  nm: "success",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "ring",
      sr: 1,
      ks: {
        o: { a: 1, k: [{ t: 0, s: [0], e: [100] }, { t: 20, s: [100] }], ix: 11 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [100, 100, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 1, k: [{ t: 0, s: [60, 60, 100], e: [110, 110, 100] }, { t: 25, s: [110, 110, 100], e: [100, 100, 100] }, { t: 40, s: [100, 100, 100] }], ix: 6 },
      },
      ao: 0,
      shapes: [
        {
          ty: "el",
          s: { a: 0, k: [140, 140] },
          p: { a: 0, k: [0, 0] },
          nm: "Ellipse Path",
        },
        {
          ty: "st",
          c: { a: 0, k: [0.051, 0.584, 0.533, 1] },
          o: { a: 0, k: 100 },
          w: { a: 0, k: 8 },
          lc: 2,
          lj: 2,
          nm: "Stroke",
          d: [{ n: "d", nm: "dash", v: { a: 1, k: [{ t: 0, s: [0], e: [440] }, { t: 45, s: [440] }] } }, { n: "o", nm: "offset", v: { a: 0, k: 0 } }],
        },
        { ty: "fl", c: { a: 0, k: [0, 0, 0, 0] }, o: { a: 0, k: 0 }, nm: "Fill" },
        { ty: "tr", p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
      ],
      ip: 5,
      op: 90,
      st: 0,
    },
    {
      ddd: 0,
      ind: 2,
      ty: 4,
      nm: "check",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [100, 100, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] },
      },
      ao: 0,
      shapes: [
        {
          ty: "sh",
          ks: {
            a: 1,
            k: [
              {
                t: 30,
                s: [{ i: [[0,0],[0,0],[0,0]], o: [[0,0],[0,0],[0,0]], v: [[-28, 0], [-28, 0], [-28, 0]], c: false }],
                e: [{ i: [[0,0],[0,0],[0,0]], o: [[0,0],[0,0],[0,0]], v: [[-28, 0], [-6, 22], [32, -22]], c: false }],
              },
              {
                t: 60,
                s: [{ i: [[0,0],[0,0],[0,0]], o: [[0,0],[0,0],[0,0]], v: [[-28, 0], [-6, 22], [32, -22]], c: false }],
              },
            ],
          },
          nm: "Path",
        },
        {
          ty: "st",
          c: { a: 0, k: [0.051, 0.584, 0.533, 1] },
          o: { a: 0, k: 100 },
          w: { a: 0, k: 9 },
          lc: 2,
          lj: 2,
          nm: "Stroke",
        },
        { ty: "tr", p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
      ],
      ip: 28,
      op: 90,
      st: 0,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────

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
  { icon: Users,     title: "Scalable Solutions",   desc: "Flexible plans designed to grow with your organisation, from startups to large enterprises."       },
  { icon: Briefcase, title: "Dedicated Support",    desc: "Your success is our priority with personalised onboarding and ongoing account management."         },
  { icon: Calendar,  title: "Quick Implementation", desc: "Get your team up and running in days, not months, with our streamlined onboarding process."        },
];

const stats = [
  { v: "5+",  l: "Organisations"    },
  { v: "50+", l: "Employees Served" },
  { v: "98%", l: "Satisfaction Rate" },
  { v: "24/7",l: "Support"          },
];

const employeeRanges = ["1–50", "51–200", "201–500", "501–1,000", "1,001+"];

export default function CorporatePage() {
  const { isDark, surface, accentColor } = useTheme();
  const formRef  = useInView();
  const statsRef = useInView();

  const [loading,  setLoading]  = useState(false);
  const [status,   setStatus]   = useState<"idle" | "success" | "error">("idle");
  const [sentName, setSentName] = useState("");
  const [formData, setFormData] = useState({
    name: "", department: "", organization: "",
    employeeCount: "", email: "", phone: "", preferredDate: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    setLoading(true); setStatus("idle");
    try {
      const res = await fetch("/api/corporate-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error();
      setSentName(formData.name.split(" ")[0]);
      setStatus("success");
      setFormData({ name:"", department:"", organization:"", employeeCount:"", email:"", phone:"", preferredDate:"" });
    } catch {
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    borderRadius: 0,
    padding: "12px 16px",
    fontSize: "13.5px",
    outline: "none",
    transition: "border-color 0.15s",
    background: isDark ? "rgba(255,255,255,0.05)" : "#fff",
    border: `1px solid ${isDark ? "rgba(255,255,255,0.10)" : surface.border}`,
    color: surface.text,
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    marginBottom: "6px",
    fontSize: "11.5px",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    color: surface.subtle,
  };

  return (
    <div className="min-h-screen transition-colors duration-500" style={{ background: surface.bg }}>
      <Navbar />

      {/* ── HERO ── */}
      <section className="relative w-full overflow-hidden py-32 md:py-40" style={{ background: surface.surfaceAlt }}>
        <div
          className="pointer-events-none absolute right-0 top-0 h-[70%] w-[55%]"
          style={{
            background: isDark
              ? "radial-gradient(ellipse at 90% 10%, rgba(13,148,136,.09) 0%, transparent 65%)"
              : "radial-gradient(ellipse at 90% 10%, rgba(13,148,136,.11) 0%, transparent 65%)",
          }}
        />
        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center lg:px-16">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: accentColor }}>
            Corporate
          </p>
          <h1 className="mb-5 text-[clamp(2rem,4.5vw,3.4rem)] font-bold leading-[1.12] tracking-tight" style={{ color: surface.text }}>
            Transform your organisation&apos;s
            <br />
            <span className="bg-gradient-to-r from-teal-500 to-emerald-500 bg-clip-text text-transparent">
              health & wellness.
            </span>
          </h1>
          <p className="mx-auto max-w-[44ch] text-[15px] leading-[1.8]" style={{ color: surface.muted }}>
            AI-powered health risk screening for your entire workforce. Scalable,
            private, and designed to reduce NCD burden before it affects productivity.
          </p>
        </div>
      </section>

      {/* ── BENEFITS STRIP ── */}
      <section className="w-full transition-colors duration-500" style={{ background: surface.bg }}>
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-px sm:grid-cols-3" style={{ background: surface.border }}>
            {benefits.map((b, i) => {
              const Icon = b.icon;
              return (
                <div key={i} className="flex flex-col gap-4 p-10 transition-colors duration-500" style={{ background: surface.bg }}>
                  <div
                    className="flex h-9 w-9 items-center justify-center"
                    style={{ borderRadius: 0, background: isDark ? "rgba(13,148,136,0.12)" : "rgba(13,148,136,0.10)", color: accentColor }}
                  >
                    <Icon className="h-[17px] w-[17px]" />
                  </div>
                  <div>
                    <h3 className="mb-2 text-[14.5px] font-bold" style={{ color: surface.text }}>{b.title}</h3>
                    <p className="text-[13px] leading-[1.75]" style={{ color: surface.muted }}>{b.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FORM SECTION ── */}
      <section
        ref={formRef.ref}
        className="w-full py-24 md:py-28 transition-colors duration-500"
        style={{ background: surface.surfaceAlt }}
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-16">
          <div
            style={{
              display: "grid",
              overflow: "hidden",
              border: `1px solid ${surface.border}`,
              borderRadius: 0,
              opacity: formRef.visible ? 1 : 0,
              transform: formRef.visible ? "translateY(0)" : "translateY(16px)",
              transition: "opacity .75s ease, transform .75s ease",
            }}
            className="grid-cols-1 lg:grid-cols-[1fr_1.6fr]"
          >
            {/* Left — why partner */}
            <div
              className="flex flex-col gap-8 p-8 md:p-12"
              style={{ background: surface.surface, borderRight: `1px solid ${surface.border}` }}
            >
              <div>
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: accentColor }}>
                  Why Partner With Us
                </p>
                <h2 className="text-[clamp(1.5rem,2.8vw,2rem)] font-bold leading-tight tracking-tight" style={{ color: surface.text }}>
                  Built for organisations
                  <br />that care.
                </h2>
              </div>

              <ul className="flex flex-col gap-3">
                {[
                  "Bulk employee screening in minutes",
                  "Anonymised aggregate health insights",
                  "Dedicated onboarding & support team",
                  "Compliant with data protection standards",
                  "Customisable to your wellness programme",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 shrink-0" style={{ color: accentColor }} />
                    <span className="text-[13.5px]" style={{ color: surface.muted }}>{item}</span>
                  </li>
                ))}
              </ul>

              <div
                className="p-5"
                style={{
                  borderRadius: 0,
                  background: isDark ? "rgba(255,255,255,.04)" : "rgba(0,0,0,.03)",
                  border: `1px solid ${surface.border}`,
                }}
              >
                <p className="text-[13px] leading-[1.75] italic" style={{ color: surface.muted }}>
                  &quot;HMEX transformed how we deliver wellness to our 500+ employees.
                  Intuitive, fast, and our team loves the personal reports.&quot;
                </p>
                <p className="mt-3 text-[12px] font-semibold" style={{ color: accentColor }}>
                  — Corporate Client
                </p>
              </div>
            </div>

            {/* Right — form OR success */}
            <div
              className="flex flex-col gap-6 p-8 md:p-12"
              style={{ background: surface.surfaceAlt }}
            >
              {status === "success" ? (
                /* ── SUCCESS STATE ── */
                <div
                  className="flex flex-col items-center justify-center text-center h-full py-6 gap-0"
                  style={{ animation: "fadeUp .5s ease both" }}
                >
                  {/* Lottie animation */}
                  <div className="w-44 h-44 -mb-2">
                    <Lottie
                      animationData={SUCCESS_LOTTIE}
                      loop={false}
                      autoplay
                      style={{ width: "100%", height: "100%" }}
                    />
                  </div>

                  {/* Heading */}
                  <div style={{ animation: "fadeUp .5s ease .2s both", opacity: 0 }}>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-teal-500 mb-3">
                      Demo Requested
                    </p>
                    <h3
                      className="text-[clamp(1.6rem,2.5vw,2.1rem)] font-bold leading-tight tracking-tight mb-3"
                      style={{ color: surface.text }}
                    >
                      You&apos;re all set{sentName ? `, ${sentName}` : ""}!
                    </h3>
                    <p className="text-[14px] leading-[1.8] max-w-[36ch] mx-auto" style={{ color: surface.muted }}>
                      Our team will reach out within{" "}
                      <span className="font-semibold text-teal-500">24 hours</span>{" "}
                      to confirm your demo session and send a calendar invite.
                    </p>
                  </div>

                  {/* Divider */}
                  <div
                    className="my-7 w-16 h-px"
                    style={{ background: isDark ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.08)" }}
                  />

                  {/* What happens next */}
                  <div
                    className="w-full max-w-sm rounded-xl p-5 text-left mb-7"
                    style={{
                      background: isDark ? "rgba(13,148,136,.07)" : "rgba(13,148,136,.06)",
                      border: `1px solid ${isDark ? "rgba(13,148,136,.18)" : "rgba(13,148,136,.18)"}`,
                      animation: "fadeUp .5s ease .32s both",
                      opacity: 0,
                    }}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-500 mb-4">
                      What happens next
                    </p>
                    <div className="flex flex-col gap-3">
                      {[
                        "We review your organisation&apos;s details",
                        "A tailored demo is prepared for your team",
                        "We confirm your session with a calendar invite",
                      ].map((text, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div
                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                            style={{ background: "linear-gradient(135deg, #0d9488, #059669)" }}
                          >
                            {i + 1}
                          </div>
                          <p
                            className="text-[13px]"
                            style={{ color: surface.muted }}
                            dangerouslySetInnerHTML={{ __html: text }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Send another */}
                  <button
                    onClick={() => setStatus("idle")}
                    className="inline-flex items-center gap-2 text-[13px] font-semibold text-teal-500 hover:text-teal-400 transition-colors"
                    style={{ animation: "fadeUp .5s ease .44s both", opacity: 0 }}
                  >
                    <Send className="h-3.5 w-3.5" />
                    Submit another request
                  </button>
                </div>
              ) : (
                /* ── FORM STATE ── */
                <>
                  <div>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: accentColor }}>
                      Book a Demo
                    </p>
                    <h2 className="text-[clamp(1.4rem,2.4vw,1.8rem)] font-bold leading-tight tracking-tight" style={{ color: surface.text }}>
                      See HMEX in action for your team.
                    </h2>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div>
                      <label style={labelStyle}>Full Name</label>
                      <input type="text" name="name" value={formData.name} onChange={handleChange}
                        placeholder="Jane Doe" style={inputStyle} />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label style={labelStyle}>Department</label>
                        <input type="text" name="department" value={formData.department} onChange={handleChange}
                          placeholder="Human Resources" style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>Organisation</label>
                        <input type="text" name="organization" value={formData.organization} onChange={handleChange}
                          placeholder="Acme Corp" style={inputStyle} />
                      </div>
                    </div>

                    <div>
                      <label style={labelStyle}>Number of Employees</label>
                      <select name="employeeCount" value={formData.employeeCount} onChange={handleChange} style={inputStyle}>
                        <option value="">Select range</option>
                        {employeeRanges.map(r => <option key={r} value={r}>{r} employees</option>)}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label style={labelStyle}>Email</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange}
                          placeholder="jane@company.com" style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>Phone</label>
                        <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
                          placeholder="+250 789 399 765" style={inputStyle} />
                      </div>
                    </div>

                    <div>
                      <label style={labelStyle}>Preferred Demo Date</label>
                      <input type="date" name="preferredDate" value={formData.preferredDate} onChange={handleChange}
                        style={inputStyle} />
                    </div>

                    {status === "error" && (
                      <p className="text-[13px] text-red-500">Something went wrong. Please try again.</p>
                    )}

                    <button
                      disabled={loading}
                      onClick={handleSubmit}
                      className="group mt-1 inline-flex w-full items-center justify-center gap-2.5 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 active:scale-[.98] disabled:opacity-50"
                      style={{
                        borderRadius: 0,
                        border: "none",
                        background: "linear-gradient(135deg, #0d9488, #059669)",
                        boxShadow: "0 4px 18px rgba(13,148,136,.25)",
                      }}
                    >
                      {loading ? "Submitting…" : "Book a Demo"}
                      {!loading && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />}
                    </button>

                    <p className="text-center text-[11.5px]" style={{ color: surface.muted }}>
                      We&apos;ll respond within 24 hours to schedule your demo.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section
        ref={statsRef.ref}
        className="w-full transition-colors duration-500"
        style={{ background: surface.bg }}
      >
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 gap-px md:grid-cols-4" style={{ background: surface.border }}>
            {stats.map((s, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-1.5 px-8 py-10 text-center transition-colors duration-500"
                style={{
                  background: surface.bg,
                  opacity: statsRef.visible ? 1 : 0,
                  transform: statsRef.visible ? "translateY(0)" : "translateY(8px)",
                  transition: `opacity .55s ease ${i * 80}ms, transform .55s ease ${i * 80}ms`,
                }}
              >
                <span className="text-[2rem] font-bold tabular-nums leading-none" style={{ color: surface.text }}>{s.v}</span>
                <span className="text-[12px]" style={{ color: surface.muted }}>{s.l}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ThemeToggle />
      <Footer />

      <style jsx>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
      `}</style>
    </div>
  );
}