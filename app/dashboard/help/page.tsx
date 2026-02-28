/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  MapPin, Mail, Phone, Send, CheckCircle, AlertCircle,
  MessageSquare, Code2, ChevronDown, ChevronRight,
  Activity, Shield, Zap, Clock, HeartPulse, BookOpen,
  LifeBuoy, ExternalLink, ArrowRight,
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useTheme } from "@/contexts/ThemeContext";
import ThemeToggle from "@/components/Themetoggle";

// ─── FAQ DATA ────────────────────────────────────────────────────────────────
const FAQS = [
  {
    q: "How is my risk score calculated?",
    a: "Your score is based on the FINDRISC (diabetes) and Framingham (hypertension) validated clinical frameworks — two of the most widely used screening tools globally. Your answers across 14 questions are weighted and combined to produce a calibrated percentage risk estimate.",
    icon: Activity,
  },
  {
    q: "Is my health data private and secure?",
    a: "Yes. All data is stored in Appwrite's encrypted infrastructure. We never sell, share, or monetise your personal health information. Each assessment is linked only to your account and is not accessible to other users.",
    icon: Shield,
  },
  {
    q: "How do I earn Health XP?",
    a: "You earn XP by completing assessments — up to 3 XP per question based on answer speed and streaks, plus a 5 XP completion bonus. Accumulate 300 XP to unlock a free WhatsApp doctor consultation.",
    icon: Zap,
  },
  {
    q: "How often should I take an assessment?",
    a: "We recommend reassessing every 2–3 months if you're actively making lifestyle changes, or every 6 months for general health tracking. Your trend chart becomes meaningful after 3+ assessments.",
    icon: Clock,
  },
  {
    q: "Can this replace a visit to a doctor?",
    a: "No — and it's not designed to. HMEX is a screening and awareness tool based on validated risk models. It helps you understand your risk profile and take informed action. Always consult a qualified healthcare professional for diagnosis and treatment.",
    icon: HeartPulse,
  },
  {
    q: "What does 'slightly elevated' risk mean?",
    a: "It means your current profile places you above baseline risk but below a clinical threshold that demands urgent action. It's an early signal — an opportunity to make targeted lifestyle adjustments before risk escalates.",
    icon: BookOpen,
  },
];

// ─── FAQ ITEM ────────────────────────────────────────────────────────────────
function FaqItem({
  item,
  index,
  S,
  accentColor,
  accentFaint,
  isDark,
}: {
  item: typeof FAQS[0];
  index: number;
  S: any;
  accentColor: string;
  accentFaint: string;
  isDark: boolean;
}) {
  const [open, setOpen] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const Icon = item.icon;

  return (
    <div
      style={{
        border: `1px solid ${open ? accentColor + "40" : S.border}`,
        background: open
          ? isDark ? "rgba(15,187,125,0.04)" : "rgba(15,187,125,0.02)"
          : S.surface,
        transition: "all 0.25s ease",
      }}
    >
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-4 p-5 text-left"
        style={{ background: "none", border: "none", cursor: "pointer" }}
      >
        <div
          className="shrink-0 w-9 h-9 flex items-center justify-center"
          style={{
            background: open ? accentFaint : isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
            color: open ? accentColor : S.muted,
            transition: "all 0.2s",
          }}
        >
          <Icon size={15} strokeWidth={1.8} />
        </div>
        <p
          className="flex-1 text-[13.5px] leading-snug"
          style={{ color: open ? S.text : S.muted, fontWeight: open ? 700 : 500 }}
        >
          {item.q}
        </p>
        <ChevronDown
          size={14}
          strokeWidth={2.2}
          style={{
            color: S.subtle,
            flexShrink: 0,
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.22s ease",
          }}
        />
      </button>

      <div
        style={{
          maxHeight: open ? 300 : 0,
          overflow: "hidden",
          transition: "max-height 0.3s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        <p
          className="text-[13px] leading-[1.75] px-5 pb-5"
          style={{ color: S.muted, paddingLeft: "4.5rem" }}
        >
          {item.a}
        </p>
      </div>
    </div>
  );
}

// ─── CONTACT CARD ────────────────────────────────────────────────────────────
function ContactCard({
  icon: Icon,
  label,
  value,
  href,
  sub,
  S,
  accentColor,
  accentFaint,
  delay,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  href?: string;
  sub?: string;
  S: any;
  accentColor: string;
  accentFaint: string;
  delay: number;
}) {
  return (
    <div
      className="flex items-start gap-4 p-5"
      style={{
        background: S.surface,
        border: `1px solid ${S.border}`,
        animation: `fadeUp 0.5s ease both`,
        animationDelay: `${delay}ms`,
      }}
    >
      <div
        className="w-10 h-10 flex items-center justify-center shrink-0"
        style={{ background: accentFaint, color: accentColor }}
      >
        <Icon size={16} strokeWidth={1.8} />
      </div>
      <div className="min-w-0">
        <p
          className="text-[10px] font-bold uppercase tracking-[0.14em] mb-1"
          style={{ color: S.subtle }}
        >
          {label}
        </p>
        {href ? (
          <a
            href={href}
            className="text-[13.5px] font-semibold hover:underline break-all"
            style={{ color: S.text }}
          >
            {value}
          </a>
        ) : (
          <p className="text-[13.5px] font-semibold" style={{ color: S.text }}>
            {value}
          </p>
        )}
        {sub && (
          <p className="text-[11px] mt-0.5" style={{ color: S.muted }}>
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── MAIN PAGE ───────────────────────────────────────────────────────────────
export default function HelpPage() {
  const { isDark, surface: S, accentColor, accentFaint } = useTheme();

  // Form state
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"general" | "developer">("general");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setFormError(null);
  };

  const handleSubmit = async () => {
    const { name, email, message } = form;
    if (!name.trim() || !email.trim() || !message.trim()) {
      setFormError("Please fill in your name, email, and message.");
      return;
    }
    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRx.test(email)) {
      setFormError("Please enter a valid email address.");
      return;
    }

    setSending(true);
    setFormError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send.");
      setSent(true);
      setForm({ name: "", email: "", phone: "", message: "" });
    } catch (e: any) {
      setFormError(e.message || "Could not send. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "11px 14px",
    background: S.surfaceAlt,
    border: `1px solid ${S.border}`,
    color: S.text,
    fontSize: 13,
    outline: "none",
    fontFamily: "inherit",
    transition: "border-color 0.15s",
  } as React.CSSProperties;

  const labelStyle = {
    display: "block",
    fontSize: 10,
    fontWeight: 800,
    textTransform: "uppercase" as const,
    letterSpacing: "0.14em",
    color: S.subtle,
    marginBottom: 6,
  };

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>

        {/* ── PAGE HEADER ── */}
        <div
          className="relative overflow-hidden mb-8 p-8"
          style={{
            background: isDark
              ? `linear-gradient(135deg, rgba(15,187,125,0.1) 0%, rgba(15,187,125,0.03) 60%, transparent 100%)`
              : `linear-gradient(135deg, rgba(15,187,125,0.08) 0%, rgba(15,187,125,0.02) 60%, transparent 100%)`,
            border: `1px solid ${isDark ? "rgba(15,187,125,0.15)" : "rgba(15,187,125,0.12)"}`,
            animation: "fadeUp 0.5s ease both",
          }}
        >
          {/* Decorative grid lines */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `linear-gradient(${isDark ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.025)"} 1px, transparent 1px),
                                linear-gradient(90deg, ${isDark ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.025)"} 1px, transparent 1px)`,
              backgroundSize: "40px 40px",
            }}
          />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <LifeBuoy size={14} color={accentColor} strokeWidth={2} />
              <p
                style={{
                  fontSize: 10, fontWeight: 800, textTransform: "uppercase",
                  letterSpacing: "0.18em", color: accentColor, margin: 0,
                }}
              >
                Help & Support
              </p>
            </div>
            <h1
              style={{
                fontSize: "clamp(1.5rem, 4vw, 2.1rem)",
                fontWeight: 900,
                color: S.text,
                letterSpacing: "-0.035em",
                margin: "0 0 8px",
                lineHeight: 1.1,
              }}
            >
              How can we help?
            </h1>
            <p style={{ fontSize: 13, color: S.muted, margin: 0, maxWidth: "50ch", lineHeight: 1.65 }}>
              Browse common questions below, or reach our team directly. We respond within 24 hours.
            </p>
          </div>
        </div>

        {/* ── CONTACT INFO CARDS ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          <ContactCard
            icon={MapPin}
            label="Head Office"
            value="Norrsken House Kigali"
            sub="1 KN 78 St, Kigali, Rwanda"
            S={S}
            accentColor={accentColor}
            accentFaint={accentFaint}
            delay={50}
          />
          <ContactCard
            icon={Mail}
            label="Email"
            value="info@healthmasterco.com"
            href="mailto:info@healthmasterco.com"
            sub="General & support enquiries"
            S={S}
            accentColor={accentColor}
            accentFaint={accentFaint}
            delay={100}
          />
          <ContactCard
            icon={Phone}
            label="Phone / WhatsApp"
            value="+250 789 399 765"
            href="https://wa.me/250789399765"
            sub="WhatsApp preferred"
            S={S}
            accentColor={accentColor}
            accentFaint={accentFaint}
            delay={150}
          />
        </div>

        {/* ── MAIN TWO-COL GRID ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* ── LEFT: FAQ ── */}
          <div
            className="lg:col-span-3"
            style={{ animation: "fadeUp 0.5s ease 0.15s both" }}
          >
            <div
              className="flex items-center gap-2 mb-4"
              style={{ borderBottom: `1px solid ${S.border}`, paddingBottom: 12 }}
            >
              <BookOpen size={13} strokeWidth={2} color={accentColor} />
              <p
                style={{
                  fontSize: 10, fontWeight: 800, textTransform: "uppercase",
                  letterSpacing: "0.16em", color: S.subtle, margin: 0,
                }}
              >
                Frequently Asked Questions
              </p>
            </div>

            <div className="flex flex-col gap-2">
              {FAQS.map((item, i) => (
                <FaqItem
                  key={i}
                  item={item}
                  index={i}
                  S={S}
                  accentColor={accentColor}
                  accentFaint={accentFaint}
                  isDark={isDark}
                />
              ))}
            </div>

            {/* Quick links */}
            <div
              className="mt-5 p-4 flex flex-col sm:flex-row sm:items-center gap-3"
              style={{
                background: isDark ? "rgba(99,102,241,0.07)" : "rgba(99,102,241,0.05)",
                border: "1px solid rgba(99,102,241,0.15)",
              }}
            >
              <div className="flex-1">
                <p className="text-[12px] font-bold" style={{ color: "#6366f1", margin: "0 0 2px" }}>
                  Developer? Check the docs.
                </p>
                <p className="text-[11px]" style={{ color: S.muted, margin: 0 }}>
                  API reference, integration guides, and technical resources.
                </p>
              </div>
              <a
                href="mailto:chegephil24@gmail.com"
                className="flex items-center gap-1.5 px-4 py-2 text-[11px] font-bold shrink-0 transition-opacity hover:opacity-75"
                style={{
                  background: "rgba(99,102,241,0.12)",
                  border: "1px solid rgba(99,102,241,0.25)",
                  color: "#6366f1",
                  textDecoration: "none",
                }}
              >
                <Code2 size={12} strokeWidth={2} />
                Email Dev Team
                <ArrowRight size={10} strokeWidth={2.5} />
              </a>
            </div>
          </div>

          {/* ── RIGHT: CONTACT FORM ── */}
          <div
            className="lg:col-span-2"
            style={{ animation: "fadeUp 0.5s ease 0.25s both" }}
          >
            {/* Tab switcher */}
            <div
              className="flex mb-5"
              style={{ borderBottom: `1px solid ${S.border}`, paddingBottom: 12, gap: 4 }}
            >
              {(["general", "developer"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setSent(false); setFormError(null); }}
                  style={{
                    padding: "6px 14px",
                    background: activeTab === tab ? accentFaint : "transparent",
                    border: `1px solid ${activeTab === tab ? accentColor + "50" : S.border}`,
                    color: activeTab === tab ? accentColor : S.muted,
                    fontSize: 11,
                    fontWeight: activeTab === tab ? 700 : 500,
                    cursor: "pointer",
                    textTransform: "capitalize",
                    transition: "all 0.15s",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  {tab === "general"
                    ? <><MessageSquare size={11} strokeWidth={2} />General</>
                    : <><Code2 size={11} strokeWidth={2} />Developer</>
                  }
                </button>
              ))}
            </div>

            <div
              className="flex items-center gap-2 mb-5"
              style={{ borderBottom: `1px solid ${S.border}`, paddingBottom: 12 }}
            >
              <MessageSquare size={13} strokeWidth={2} color={accentColor} />
              <p
                style={{
                  fontSize: 10, fontWeight: 800, textTransform: "uppercase",
                  letterSpacing: "0.16em", color: S.subtle, margin: 0,
                }}
              >
                {activeTab === "developer" ? "Developer Contact" : "Send a Message"}
              </p>
            </div>

            {activeTab === "developer" && (
              <div
                className="mb-5 p-4"
                style={{
                  background: isDark ? "rgba(99,102,241,0.07)" : "rgba(99,102,241,0.05)",
                  border: "1px solid rgba(99,102,241,0.18)",
                }}
              >
                <div className="flex items-start gap-3">
                  <Code2 size={14} color="#6366f1" strokeWidth={1.8} style={{ marginTop: 1 }} />
                  <div>
                    <p className="text-[12px] font-bold" style={{ color: "#6366f1", margin: "0 0 2px" }}>
                      Developer enquiries
                    </p>
                    <p className="text-[11.5px] leading-relaxed" style={{ color: S.muted, margin: "0 0 8px" }}>
                      For API access, integrations, bugs, or technical collaboration, reach Brian directly:
                    </p>
                    <a
                      href="mailto:chegephil24@gmail.com"
                      className="flex items-center gap-1.5 text-[12px] font-bold hover:underline"
                      style={{ color: "#6366f1" }}
                    >
                      chegephil24@gmail.com
                      <ExternalLink size={10} strokeWidth={2.5} />
                    </a>
                  </div>
                </div>
              </div>
            )}

            <p className="text-[12px] mb-5" style={{ color: S.muted }}>
              {activeTab === "developer"
                ? "Or use the form below to send a developer-specific message."
                : "We'll get back to you within 24 hours."}
            </p>

            {sent ? (
              <div
                className="flex flex-col items-center justify-center py-12 gap-4 text-center"
                style={{
                  background: isDark ? "rgba(15,187,125,0.06)" : "rgba(15,187,125,0.04)",
                  border: `1px solid rgba(15,187,125,0.2)`,
                }}
              >
                <div
                  className="w-14 h-14 flex items-center justify-center"
                  style={{ background: accentFaint }}
                >
                  <CheckCircle size={28} strokeWidth={1.5} color={accentColor} />
                </div>
                <div>
                  <p className="text-[15px] font-black" style={{ color: S.text, margin: "0 0 6px", letterSpacing: "-0.02em" }}>
                    Message sent!
                  </p>
                  <p className="text-[12px]" style={{ color: S.muted, margin: 0, lineHeight: 1.6 }}>
                    We&apos;ve received your message and will respond within 24 hours. Check your inbox for a confirmation.
                  </p>
                </div>
                <button
                  onClick={() => setSent(false)}
                  className="text-[11px] font-bold transition-opacity hover:opacity-70 mt-1"
                  style={{ color: accentColor, background: "none", border: "none", cursor: "pointer" }}
                >
                  Send another message →
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {/* Name */}
                <div>
                  <label style={labelStyle}>Name *</label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Your full name"
                    style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = accentColor; }}
                    onBlur={e => { e.target.style.borderColor = S.border; }}
                  />
                </div>

                {/* Email */}
                <div>
                  <label style={labelStyle}>Email *</label>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = accentColor; }}
                    onBlur={e => { e.target.style.borderColor = S.border; }}
                  />
                </div>

                {/* Phone */}
                <div>
                  <label style={labelStyle}>Phone <span style={{ color: S.subtle, fontWeight: 500, textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+250 7XX XXX XXX"
                    style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = accentColor; }}
                    onBlur={e => { e.target.style.borderColor = S.border; }}
                  />
                </div>

                {/* Message */}
                <div>
                  <label style={labelStyle}>Message *</label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    placeholder={
                      activeTab === "developer"
                        ? "Describe the technical issue or feature request…"
                        : "How can we help you today?"
                    }
                    rows={5}
                    style={{ ...inputStyle, resize: "vertical", minHeight: 120 }}
                    onFocus={e => { e.target.style.borderColor = accentColor; }}
                    onBlur={e => { e.target.style.borderColor = S.border; }}
                  />
                </div>

                {/* Error */}
                {formError && (
                  <div
                    className="flex items-center gap-2.5 px-4 py-3 text-[12px]"
                    style={{
                      background: "rgba(239,68,68,0.08)",
                      border: "1px solid rgba(239,68,68,0.2)",
                      color: "#ef4444",
                    }}
                  >
                    <AlertCircle size={13} strokeWidth={2} />
                    {formError}
                  </div>
                )}

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={sending}
                  className="flex items-center justify-center gap-2 py-3 text-[13px] font-black text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
                  style={{
                    background: `linear-gradient(135deg, ${accentColor}, #059669)`,
                    border: "none",
                    cursor: sending ? "not-allowed" : "pointer",
                    boxShadow: `0 4px 20px ${accentColor}35`,
                    letterSpacing: "0.01em",
                  }}
                >
                  {sending ? (
                    <>
                      <div
                        className="w-4 h-4 border-2 animate-spin"
                        style={{ borderColor: "transparent", borderTopColor: "#fff", borderRightColor: "rgba(255,255,255,0.3)" }}
                      />
                      Sending…
                    </>
                  ) : (
                    <>
                      <Send size={13} strokeWidth={2.2} />
                      Send Message
                    </>
                  )}
                </button>

                <p className="text-[10.5px] text-center" style={{ color: S.subtle }}>
                  Your information is kept private and never shared.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── BOTTOM STRIP ── */}
        <div
          className="mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-5"
          style={{
            background: S.surface,
            border: `1px solid ${S.border}`,
            animation: "fadeUp 0.5s ease 0.35s both",
          }}
        >
          <div className="flex items-center gap-3">
            <HeartPulse size={15} strokeWidth={1.8} color={accentColor} />
            <p className="text-[12px]" style={{ color: S.muted, margin: 0 }}>
              <strong style={{ color: S.text }}>HMEX</strong> · Built at Norrsken House Kigali
            </p>
          </div>
          <div className="flex items-center gap-5">
            <a
              href="https://wa.me/250789399765"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[11px] font-bold transition-opacity hover:opacity-70"
              style={{ color: accentColor, textDecoration: "none" }}
            >
              WhatsApp Us
              <ExternalLink size={9} strokeWidth={2.5} />
            </a>
            <span style={{ width: 1, height: 14, background: S.border }} />
            <a
              href="mailto:info@healthmasterco.com"
              className="flex items-center gap-1.5 text-[11px] font-bold transition-opacity hover:opacity-70"
              style={{ color: S.muted, textDecoration: "none" }}
            >
              info@healthmasterco.com
            </a>
          </div>
        </div>

        <p
          className="text-center text-[11px] mt-5 pb-4"
          style={{ color: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.2)" }}
        >
          HMEX is a screening tool only — not a substitute for professional medical advice.
        </p>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <ThemeToggle />
    </DashboardLayout>
  );
}