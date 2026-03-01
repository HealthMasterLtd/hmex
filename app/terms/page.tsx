"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Shield, FileText, HeartPulse, Mail, ChevronRight,
  ArrowLeft, AlertTriangle, Scale, Database, Cpu,
  UserCheck, WifiOff, RefreshCw, Globe, Phone,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

// ─── EFFECTIVE DATE — update before deploy ────────────────────────────────────
const EFFECTIVE_DATE = "1 July 2025";

// ─── SECTION DATA ─────────────────────────────────────────────────────────────
const SECTIONS = [
  {
    num: "01",
    id: "description",
    title: "Description of the Service",
    icon: Cpu,
    body: [
      { type: "intro" as const, text: "HMEX provides a suite of digital health risk assessment tools designed for preventive awareness and early detection." },
      {
        type: "list" as const,
        items: [
          "Digital risk assessments for non-communicable diseases (NCDs), including hypertension and diabetes",
          "Personalised risk categorisation based on user-provided information",
          "General health recommendations derived from assessment results",
        ],
      },
      { type: "callout" as const, text: "HMEX is a preventive and educational tool. It does not provide medical diagnosis or treatment." },
    ],
  },
  {
    num: "02",
    id: "eligibility",
    title: "Eligibility",
    icon: UserCheck,
    body: [
      { type: "intro" as const, text: "To access and use the Service, you must meet the following conditions:" },
      {
        type: "list" as const,
        items: [
          "Be at least 18 years old, or have appropriate guardian consent where applicable",
          "Provide accurate and truthful information during registration and all assessments",
          "Use the Service only for lawful, personal, non-commercial purposes",
        ],
      },
      { type: "text" as const, text: "We reserve the right to suspend or permanently terminate access if misuse is detected." },
    ],
  },
  {
    num: "03",
    id: "no-medical-advice",
    title: "No Medical Advice",
    icon: AlertTriangle,
    accent: true,
    body: [
      { type: "intro" as const, text: "The content, assessments, and recommendations provided through HMEX:" },
      {
        type: "list" as const,
        items: [
          "Are for informational and preventive purposes only",
          "Do not constitute medical advice, diagnosis, or treatment",
          "Do not replace consultation with a licensed healthcare professional",
        ],
      },
      { type: "callout" as const, text: "Always seek professional medical evaluation for diagnosis or treatment decisions. Never disregard professional advice based on content within this Service." },
    ],
  },
  {
    num: "04",
    id: "user-responsibilities",
    title: "User Responsibilities",
    icon: UserCheck,
    body: [
      { type: "intro" as const, text: "By accessing and using HMEX, you agree to the following obligations:" },
      {
        type: "list" as const,
        items: [
          "Provide complete and accurate information at all times",
          "Not misuse, reverse-engineer, or attempt to exploit the platform",
          "Not rely solely on the Service for medical decision-making",
        ],
      },
      { type: "text" as const, text: "You acknowledge that inaccurate or incomplete information may materially affect the accuracy of your assessment results." },
    ],
  },
  {
    num: "05",
    id: "data-collection",
    title: "Data Collection and Use",
    icon: Database,
    body: [
      { type: "intro" as const, text: "We collect and process personal and health-related information to:" },
      {
        type: "list" as const,
        items: [
          "Generate personalised risk assessments",
          "Provide health recommendations tailored to your profile",
          "Improve and optimise the quality and accuracy of our Service",
        ],
      },
      { type: "text" as const, text: "All data is handled in accordance with applicable data protection laws and our Privacy Policy." },
      { type: "callout" as const, text: "We do not sell personal data to third parties under any circumstances." },
    ],
  },
  {
    num: "06",
    id: "intellectual-property",
    title: "Intellectual Property",
    icon: Shield,
    body: [
      { type: "text" as const, text: "All content, algorithms, branding, interface elements, and materials within HMEX are the exclusive property of Health Master and are protected by applicable intellectual property laws." },
      { type: "text" as const, text: "You may not copy, distribute, modify, or reproduce any part of the Service without prior written permission from Health Master." },
    ],
  },
  {
    num: "07",
    id: "liability",
    title: "Limitation of Liability",
    icon: Scale,
    body: [
      { type: "intro" as const, text: "To the fullest extent permitted by applicable law:" },
      {
        type: "list" as const,
        items: [
          "Health Master is not liable for any indirect, incidental, or consequential damages arising from use of the Service",
          "We are not responsible for health outcomes resulting from reliance on assessment results without professional consultation",
        ],
      },
    ],
  },
  {
    num: "08",
    id: "availability",
    title: "Service Availability",
    icon: WifiOff,
    body: [
      { type: "intro" as const, text: "Health Master reserves the right to:" },
      {
        type: "list" as const,
        items: [
          "Modify, update, or discontinue features at any time without notice",
          "Temporarily suspend access for maintenance, security, or improvements",
        ],
      },
      { type: "text" as const, text: "We do not guarantee uninterrupted or error-free availability of the Service." },
    ],
  },
  {
    num: "09",
    id: "changes",
    title: "Changes to These Terms",
    icon: RefreshCw,
    body: [
      { type: "text" as const, text: "We may update these Terms of Service from time to time to reflect changes in our Service, legal requirements, or operational practices." },
      { type: "callout" as const, text: "Continued use of HMEX after updates are posted constitutes your acceptance of the revised Terms." },
    ],
  },
  {
    num: "10",
    id: "governing-law",
    title: "Governing Law",
    icon: Globe,
    body: [
      { type: "text" as const, text: "These Terms of Service are governed by and construed in accordance with the laws of the Republic of Rwanda, unless otherwise required by applicable local regulations." },
    ],
  },
  {
    num: "11",
    id: "contact",
    title: "Contact",
    icon: Mail,
    body: [
      { type: "text" as const, text: "For questions, concerns, or requests regarding these Terms of Service, please contact us:" },
      { type: "contact" as const },
    ],
  },
];

// ─── TOC ITEM ─────────────────────────────────────────────────────────────────
function TocItem({
  section, active, onClick, S, accentColor, accentFaint,
}: {
  section: typeof SECTIONS[0];
  active: boolean;
  onClick: () => void;
  S: any;
  accentColor: string;
  accentFaint: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        width: "100%", padding: "8px 10px",
        background: active ? accentFaint : "transparent",
        border: `1px solid ${active ? accentColor + "44" : "transparent"}`,
        borderLeft: active ? `3px solid ${accentColor}` : "3px solid transparent",
        color: active ? accentColor : S.muted,
        cursor: "pointer", transition: "all 0.15s",
        textAlign: "left",
      }}
    >
      <span style={{
        fontSize: 9, fontWeight: 900, letterSpacing: "0.1em",
        color: active ? accentColor : S.subtle,
        fontVariantNumeric: "tabular-nums",
        minWidth: 20, flexShrink: 0,
      }}>
        {section.num}
      </span>
      <span style={{
        fontSize: 11, fontWeight: active ? 700 : 400,
        lineHeight: 1.35,
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {section.title}
      </span>
      {active && <ChevronRight size={10} strokeWidth={2.5} style={{ marginLeft: "auto", flexShrink: 0 }} />}
    </button>
  );
}

// ─── SECTION BLOCK ────────────────────────────────────────────────────────────
function SectionBlock({
  section, S, accentColor, accentFaint, isDark,
}: {
  section: typeof SECTIONS[0];
  S: any;
  accentColor: string;
  accentFaint: string;
  isDark: boolean;
}) {
  const Icon = section.icon;

  return (
    <div
      id={section.id}
      style={{
        paddingBottom: 40,
        marginBottom: 40,
        borderBottom: `1px solid ${S.border}`,
      }}
    >
      {/* Section header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 20 }}>
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          gap: 6, flexShrink: 0,
        }}>
          <span style={{
            fontSize: 10, fontWeight: 900, letterSpacing: "0.16em",
            color: accentColor, fontVariantNumeric: "tabular-nums",
          }}>
            {section.num}
          </span>
          <div style={{
            width: 36, height: 36,
            background: section.accent
              ? "rgba(239,68,68,0.1)"
              : accentFaint,
            color: section.accent ? "#ef4444" : accentColor,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <Icon size={15} strokeWidth={1.8} />
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{
            fontSize: "clamp(1rem, 2.5vw, 1.2rem)",
            fontWeight: 800, color: S.text,
            letterSpacing: "-0.025em", margin: "0 0 0",
            lineHeight: 1.2,
          }}>
            {section.title}
          </h2>
        </div>
      </div>

      {/* Body content */}
      <div style={{ paddingLeft: 50 }}>
        {section.body.map((block, i) => {
          if (block.type === "intro") {
            return (
              <p key={i} style={{
                fontSize: 13, color: S.muted, lineHeight: 1.75,
                margin: "0 0 14px", fontWeight: 500,
              }}>
                {block.text}
              </p>
            );
          }
          if (block.type === "text") {
            return (
              <p key={i} style={{
                fontSize: 13, color: S.muted, lineHeight: 1.75,
                margin: "0 0 12px",
              }}>
                {block.text}
              </p>
            );
          }
          if (block.type === "list") {
            return (
              <ul key={i} style={{ margin: "0 0 14px", padding: 0, listStyle: "none" }}>
                {block.items!.map((item, j) => (
                  <li key={j} style={{
                    display: "flex", alignItems: "flex-start", gap: 10,
                    padding: "7px 0",
                    borderBottom: j < block.items!.length - 1
                      ? `1px solid ${S.border}`
                      : "none",
                  }}>
                    <span style={{
                      width: 5, height: 5, borderRadius: "50%",
                      background: accentColor,
                      flexShrink: 0, marginTop: 6,
                    }} />
                    <span style={{ fontSize: 13, color: S.muted, lineHeight: 1.65 }}>
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            );
          }
          if (block.type === "callout") {
            const isWarning = section.accent;
            return (
              <div key={i} style={{
                padding: "12px 16px",
                background: isWarning
                  ? "rgba(239,68,68,0.07)"
                  : isDark ? `${accentColor}0C` : `${accentColor}0A`,
                border: `1px solid ${isWarning ? "rgba(239,68,68,0.2)" : accentColor + "28"}`,
                borderLeft: `3px solid ${isWarning ? "#ef4444" : accentColor}`,
                margin: "0 0 12px",
              }}>
                <p style={{
                  fontSize: 12.5, lineHeight: 1.7, margin: 0,
                  color: isWarning ? "#ef4444" : accentColor,
                  fontWeight: 600,
                }}>
                  {block.text}
                </p>
              </div>
            );
          }
          if (block.type === "contact") {
            return (
              <div key={i} style={{
                display: "flex", flexDirection: "column", gap: 10, marginTop: 6,
              }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 16px",
                  background: S.surfaceAlt, border: `1px solid ${S.border}`,
                }}>
                  <div style={{
                    width: 32, height: 32, background: accentFaint,
                    color: accentColor,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <Mail size={13} strokeWidth={1.8} />
                  </div>
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", color: S.subtle, margin: "0 0 2px" }}>Email</p>
                    <a href="mailto:info@healthmasterco.com" style={{ fontSize: 13, fontWeight: 600, color: accentColor, textDecoration: "none" }}>
                      info@healthmasterco.com
                    </a>
                  </div>
                </div>
                <div style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 16px",
                  background: S.surfaceAlt, border: `1px solid ${S.border}`,
                }}>
                  <div style={{
                    width: 32, height: 32, background: accentFaint,
                    color: accentColor,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <HeartPulse size={13} strokeWidth={1.8} />
                  </div>
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", color: S.subtle, margin: "0 0 2px" }}>Company</p>
                    <p style={{ fontSize: 13, fontWeight: 600, color: S.text, margin: 0 }}>Health Master · Norrsken House Kigali</p>
                  </div>
                </div>
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function TermsPage() {
  const { isDark, surface: S, accentColor, accentFaint } = useTheme();
  const [activeId, setActiveId] = useState("description");
  const [tocOpen, setTocOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Scrollspy
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        }
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 }
    );
    SECTIONS.forEach(s => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setTocOpen(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: S.bg,
      color: S.text,
    }}>

      {/* ── TOP BAR ── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 40,
        background: isDark
          ? `${S.surface}ee`
          : `${S.surface}f0`,
        backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${S.border}`,
      }}>
        <div style={{
          maxWidth: 1100, margin: "0 auto",
          padding: "0 24px",
          display: "flex", alignItems: "center", gap: 16,
          height: 52,
        }}>
          <Link href="/" style={{
            display: "flex", alignItems: "center", gap: 6,
            color: S.muted, textDecoration: "none", fontSize: 11, fontWeight: 600,
            transition: "color 0.15s",
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = accentColor; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = S.muted; }}
          >
            <ArrowLeft size={13} strokeWidth={2} />
            Back
          </Link>

          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 1, height: 16, background: S.border }} />
            <HeartPulse size={13} color={accentColor} strokeWidth={2} />
            <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: "-0.02em", color: S.text }}>
              H<span style={{ color: accentColor }}>MEX</span>
            </span>
            <span style={{ fontSize: 11, color: S.muted }}>· Terms of Service</span>
          </div>

          {/* Mobile TOC toggle */}
          <button
            onClick={() => setTocOpen(v => !v)}
            className="lg:hidden"
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "5px 10px",
              background: S.surfaceAlt, border: `1px solid ${S.border}`,
              color: S.muted, fontSize: 11, fontWeight: 600, cursor: "pointer",
            }}
          >
            <FileText size={12} strokeWidth={1.8} />
            Contents
          </button>
        </div>
      </div>

      {/* ── MOBILE TOC DRAWER ── */}
      {tocOpen && (
        <div
          className="lg:hidden"
          style={{
            position: "fixed", inset: 0, zIndex: 50,
          }}
        >
          <div
            onClick={() => setTocOpen(false)}
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(3px)" }}
          />
          <div style={{
            position: "absolute", left: 0, top: 0, bottom: 0, width: 280,
            background: S.surface, borderRight: `1px solid ${S.border}`,
            overflowY: "auto",
            animation: "slideInLeft 0.18s ease",
            zIndex: 10,
          }}>
            <div style={{ padding: "16px 12px" }}>
              <p style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.16em", color: S.subtle, margin: "0 0 10px 10px" }}>
                Contents
              </p>
              {SECTIONS.map(s => (
                <TocItem
                  key={s.id} section={s}
                  active={activeId === s.id}
                  onClick={() => scrollTo(s.id)}
                  S={S} accentColor={accentColor} accentFaint={accentFaint}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── BODY ── */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px 80px" }}>
        <div style={{ display: "flex", gap: 40, alignItems: "flex-start" }}>

          {/* ── SIDEBAR TOC (desktop) ── */}
          <aside
            className="hidden lg:block"
            style={{
              width: 210, flexShrink: 0,
              position: "sticky", top: 72,
              maxHeight: "calc(100vh - 96px)",
              overflowY: "auto",
              animation: "fadeUp 0.4s ease both",
            }}
          >
            <p style={{
              fontSize: 9, fontWeight: 900, textTransform: "uppercase",
              letterSpacing: "0.16em", color: S.subtle, margin: "0 0 10px 10px",
            }}>
              Contents
            </p>
            {SECTIONS.map(s => (
              <TocItem
                key={s.id} section={s}
                active={activeId === s.id}
                onClick={() => scrollTo(s.id)}
                S={S} accentColor={accentColor} accentFaint={accentFaint}
              />
            ))}

            {/* Accepted indicator */}
            <div style={{
              marginTop: 20, padding: "10px 12px",
              background: isDark ? "rgba(34,197,94,0.07)" : "rgba(34,197,94,0.06)",
              border: "1px solid rgba(34,197,94,0.2)",
              borderLeft: "3px solid #22c55e",
            }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: "#22c55e", margin: "0 0 2px" }}>
                In force
              </p>
              <p style={{ fontSize: 10, color: S.muted, margin: 0, lineHeight: 1.4 }}>
                Effective {EFFECTIVE_DATE}
              </p>
            </div>
          </aside>

          {/* ── MAIN CONTENT ── */}
          <main
            ref={contentRef}
            style={{
              flex: 1, minWidth: 0,
              animation: "fadeUp 0.4s ease 0.05s both",
            }}
          >
            {/* Page hero */}
            <div style={{
              marginBottom: 40, paddingBottom: 32,
              borderBottom: `1px solid ${S.border}`,
            }}>
              {/* Label row */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "4px 10px",
                  background: accentFaint,
                  border: `1px solid ${accentColor}30`,
                }}>
                  <FileText size={10} color={accentColor} strokeWidth={2.5} />
                  <span style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.16em", color: accentColor }}>
                    Legal
                  </span>
                </div>
                <div style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "4px 10px",
                  background: S.surfaceAlt,
                  border: `1px solid ${S.border}`,
                }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: S.muted }}>
                    Effective {EFFECTIVE_DATE}
                  </span>
                </div>
              </div>

              <h1 style={{
                fontSize: "clamp(1.6rem, 5vw, 2.4rem)",
                fontWeight: 900, color: S.text,
                letterSpacing: "-0.04em",
                margin: "0 0 16px",
                lineHeight: 1.08,
              }}>
                Terms of Service
              </h1>

              {/* Welcome block */}
              <div style={{
                padding: "16px 20px",
                background: S.surfaceAlt,
                border: `1px solid ${S.border}`,
                borderLeft: `3px solid ${accentColor}`,
                maxWidth: 620,
              }}>
                <p style={{ fontSize: 13, color: S.muted, lineHeight: 1.75, margin: 0 }}>
                  Welcome to <strong style={{ color: S.text }}>HMEX</strong>, a digital health risk assessment service provided by{" "}
                  <strong style={{ color: S.text }}>Health Master</strong> ("Company," "we," "us," or "our"). By accessing or using HMEX, you agree to these Terms of Service.
                </p>
                <p style={{
                  fontSize: 12, color: accentColor, margin: "10px 0 0",
                  fontWeight: 700, display: "flex", alignItems: "center", gap: 6,
                }}>
                  <Shield size={12} strokeWidth={2} />
                  If you do not agree, please do not use the Service.
                </p>
              </div>
            </div>

            {/* All sections */}
            {SECTIONS.map(section => (
              <SectionBlock
                key={section.id}
                section={section}
                S={S}
                accentColor={accentColor}
                accentFaint={accentFaint}
                isDark={isDark}
              />
            ))}

            {/* Footer note */}
            <div style={{
              marginTop: 8, padding: "20px 24px",
              background: S.surfaceAlt, border: `1px solid ${S.border}`,
              display: "flex", alignItems: "center", justifyContent: "space-between",
              flexWrap: "wrap", gap: 12,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <HeartPulse size={14} color={accentColor} strokeWidth={1.8} />
                <p style={{ fontSize: 12, color: S.muted, margin: 0 }}>
                  <strong style={{ color: S.text }}>Health Master</strong> · Norrsken House Kigali, Rwanda
                </p>
              </div>
              <p style={{ fontSize: 11, color: S.subtle, margin: 0 }}>
                © {new Date().getFullYear()} Health Master. All rights reserved.
              </p>
            </div>
          </main>
        </div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInLeft {
          from { transform: translateX(-100%); opacity: 0; }
          to   { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}