"use client";

import Image from "next/image";
import { MapPin, Mail, Phone, ArrowRight } from "lucide-react";
import Navbar from "@/components/landingpage/navbar";
import Footer from "@/components/ui/Footer";
import { useState, useEffect, useRef } from "react";
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

const contactItems = [
  {
    icon: MapPin,
    label: "Head Office",
    value: "Norrsken House Kigali, 1 KN 78 St, Kigali",
  },
  {
    icon: Mail,
    label: "Email",
    value: "info@healthmasterco.com",
    href: "mailto:info@healthmasterco.com",
  },
  {
    icon: Phone,
    label: "Phone",
    value: "+250 789 399 765",
    href: "tel:+250789399765",
  },
];

export default function ContactPage() {
  const { isDark } = useTheme();
  const formRef = useInView();

  const bg    = isDark ? "#0e1117" : "#ffffff";
  const bgAlt = isDark ? "#161b25" : "#f0f4f8";
  const h     = isDark ? "text-white"     : "text-slate-900";
  const p     = isDark ? "text-slate-400" : "text-slate-500";
  const ln    = isDark ? "rgba(255,255,255,.07)" : "rgba(0,0,0,.07)";

  const inputBase = `w-full rounded-lg px-4 py-3 text-[13.5px] outline-none transition-colors duration-150 ${
    isDark
      ? "bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-teal-500/60"
      : "bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-teal-400"
  }`;

  const labelBase = `block mb-1.5 text-[11.5px] font-semibold uppercase tracking-[0.12em] ${isDark ? "text-white/40" : "text-slate-400"}`;

  const [loading, setLoading]   = useState(false);
  const [status,  setStatus]    = useState<"idle"|"success"|"error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [formData, setFormData] = useState({ name:"", email:"", phone:"", message:"" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setStatus("idle"); setErrorMsg("");
    try {
      const res  = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setStatus("success");
      setFormData({ name:"", email:"", phone:"", message:"" });
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "An error occurred");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen transition-colors duration-500" style={{ background: bg }}>
      <Navbar />

      {/* ── HERO ── */}
      <section className="relative h-[55vh] min-h-[380px] overflow-hidden">
        <Image src="/assets/new/hero.png" alt="Contact HMEX" fill className="object-cover" priority />
        <div
          className="absolute inset-0"
          style={{
            background: isDark
              ? "linear-gradient(160deg, rgba(10,15,26,.84) 0%, rgba(10,20,28,.78) 100%)"
              : "linear-gradient(160deg, rgba(4,30,45,.80) 0%, rgba(8,40,35,.74) 100%)",
          }}
        />
        <div
          className="pointer-events-none absolute -left-20 bottom-0 h-80 w-80 rounded-full opacity-[.15]"
          style={{
            background: "radial-gradient(circle, rgba(13,148,136,1) 0%, transparent 70%)",
            animation: "breathe 9s ease-in-out infinite",
          }}
        />
        <div className="relative z-10 flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-teal-400">Contact</p>
          <h1 className="text-[clamp(2rem,4.5vw,3.4rem)] font-bold leading-tight tracking-tight text-white">
            Get in touch.
          </h1>
          <p className="max-w-[40ch] text-[15px] leading-[1.8] text-white/60">
            Questions, partnerships, support — we&apos;re here and happy to help.
          </p>
        </div>
      </section>

      {/* ── MAIN CONTACT ── */}
      <section
        ref={formRef.ref}
        className="w-full py-24 md:py-28 transition-colors duration-500"
        style={{ background: bgAlt }}
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-16">
          <div
            className="grid grid-cols-1 gap-0 overflow-hidden rounded-xl lg:grid-cols-[1fr_1.7fr]"
            style={{
              border: `1px solid ${ln}`,
              opacity: formRef.visible ? 1 : 0,
              transform: formRef.visible ? "translateY(0)" : "translateY(16px)",
              transition: "opacity .75s ease, transform .75s ease",
            }}
          >
            {/* Left — contact info */}
            <div
              className="flex flex-col gap-10 p-8 md:p-12"
              style={{ background: isDark ? "#0e1117" : "#ffffff", borderRight: `1px solid ${ln}` }}
            >
              <div>
                <p className={`mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] ${isDark ? "text-teal-400" : "text-teal-600"}`}>
                  Reach Us
                </p>
                <h2 className={`text-[clamp(1.5rem,2.8vw,2rem)] font-bold leading-tight tracking-tight ${h}`}>
                  We&apos;d love to
                  <br />hear from you.
                </h2>
                <p className={`mt-3 max-w-[32ch] text-[14px] leading-[1.8] ${p}`}>
                  Have a question, need support, or want to partner with us?
                  Reach out directly.
                </p>
              </div>

              <div className="flex flex-col gap-7">
                {contactItems.map(({ icon: Icon, label, value, href }, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${isDark ? "bg-teal-500/12 text-teal-400" : "bg-teal-500/10 text-teal-600"}`}>
                      <Icon className="h-[17px] w-[17px]" />
                    </div>
                    <div>
                      <p className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${isDark ? "text-white/30" : "text-slate-400"}`}>
                        {label}
                      </p>
                      {href ? (
                        <a href={href} className={`text-[13.5px] leading-snug transition-colors hover:text-teal-500 ${h}`}>
                          {value}
                        </a>
                      ) : (
                        <p className={`text-[13.5px] leading-snug ${h}`}>{value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Ambient pattern */}
              <div
                className="mt-auto h-28 w-full rounded-lg"
                style={{
                  background: isDark
                    ? "radial-gradient(ellipse at 30% 50%, rgba(13,148,136,.12) 0%, transparent 70%)"
                    : "radial-gradient(ellipse at 30% 50%, rgba(13,148,136,.09) 0%, transparent 70%)",
                }}
              />
            </div>

            {/* Right — form */}
            <div
              className="flex flex-col gap-6 p-8 md:p-12"
              style={{ background: isDark ? "#161b25" : "#f0f4f8" }}
            >
              <div>
                <p className={`mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] ${isDark ? "text-teal-400" : "text-teal-600"}`}>
                  Send a Message
                </p>
                <h2 className={`text-[clamp(1.4rem,2.4vw,1.8rem)] font-bold leading-tight tracking-tight ${h}`}>
                  We&apos;ll get back to you
                  <br />within 24 hours.
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Name */}
                <div>
                  <label className={labelBase}>Name</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange}
                    placeholder="Your full name" className={inputBase} required />
                </div>

                {/* Email + Phone */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelBase}>Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange}
                      placeholder="you@example.com" className={inputBase} required />
                  </div>
                  <div>
                    <label className={labelBase}>Phone</label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
                      placeholder="+250 789 399 765" className={inputBase} required />
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className={labelBase}>Message</label>
                  <textarea name="message" value={formData.message} onChange={handleChange}
                    placeholder="How can we help?" rows={5}
                    className={`${inputBase} resize-none`} required />
                </div>

                {status === "success" && (
                  <p className="text-[13px] text-teal-500">Message sent — we&apos;ll be in touch soon.</p>
                )}
                {status === "error" && (
                  <p className="text-[13px] text-red-500">{errorMsg || "Something went wrong. Please try again."}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="group mt-1 inline-flex w-full items-center justify-center gap-2.5 rounded-lg py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 active:scale-[.98] disabled:opacity-50"
                  style={{
                    background: "linear-gradient(135deg, #0d9488, #059669)",
                    boxShadow: "0 4px 18px rgba(13,148,136,.25)",
                  }}
                >
                  {loading ? "Sending…" : "Send Message"}
                  {!loading && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ── MAP ── */}
      <section className="h-[420px] w-full" style={{ filter: isDark ? "invert(1) hue-rotate(180deg) brightness(.85)" : "none" }}>
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d63844.37502276254!2d30.058669799999998!3d-1.9440727!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x19dca4258ed8e797%3A0x4a6c9b4e2b0a5b0a!2sKigali%2C%20Rwanda!5e0!3m2!1sen!2sus!4v1234567890123!5m2!1sen!2sus"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
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