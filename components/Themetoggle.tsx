/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  useTheme,
  ACCENT_PALETTES,
  DARK_VARIANTS,
  type AccentColor,
  type DarkVariant,
} from "@/contexts/ThemeContext";

// ─── ICONS ───────────────────────────────────────────────────────────────────
const SunIcon = ({ s = 16, c = "currentColor" }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);
const MoonIcon = ({ s = 16, c = "currentColor" }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);
const PaletteIcon = ({ s = 14, c = "currentColor" }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="13.5" cy="6.5" r="1.5"/><circle cx="17.5" cy="10.5" r="1.5"/>
    <circle cx="8.5" cy="7" r="1.5"/><circle cx="6.5" cy="12" r="1.5"/>
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
  </svg>
);
const CloseIcon = ({ s = 14, c = "currentColor" }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const CheckIcon = ({ s = 8, c = "currentColor" }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

function Sec({ label, S }: { label: string; S: { muted: string; border: string } }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, marginTop: 4 }}>
      <p style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.18em", textTransform: "uppercase", color: S.muted, margin: 0, whiteSpace: "nowrap" }}>
        {label}
      </p>
      <div style={{ flex: 1, height: 1, background: S.border }} />
    </div>
  );
}

export default function ThemeToggle() {
  const {
    isDark, theme, darkVariant, accent,
    accentColor, accentSecondary, surface: S,
    toggleTheme, setDarkVariant, setAccent,
  } = useTheme();

  const [open,    setOpen]    = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pulse,   setPulse]   = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const initial = setTimeout(() => setPulse(true), 3000);
    return () => clearTimeout(initial);
  }, []);

  useEffect(() => {
    if (!pulse) return;
    const t = setTimeout(() => setPulse(false), 1200);
    const interval = setInterval(() => {
      setPulse(true);
      setTimeout(() => setPulse(false), 1200);
    }, 8000);
    return () => { clearTimeout(t); clearInterval(interval); };
  }, [pulse]);

  useEffect(() => {
    if (!open) return;
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [open]);

  // Smart scroll lock — only lock if navbar isn't already locking (navbar sets overflow directly)
  useEffect(() => {
    if (open) {
      if (document.body.style.overflow !== "hidden") {
        document.body.setAttribute("data-theme-lock", "1");
        document.body.style.overflow = "hidden";
      }
    } else {
      if (document.body.getAttribute("data-theme-lock") === "1") {
        document.body.removeAttribute("data-theme-lock");
        document.body.style.overflow = "";
      }
    }
    return () => {
      if (document.body.getAttribute("data-theme-lock") === "1") {
        document.body.removeAttribute("data-theme-lock");
        document.body.style.overflow = "";
      }
    };
  }, [open]);

  if (!mounted) return null;

  return (
    <>
      {/* Backdrop — z 9993, safely below navbar (9998–9999) */}
      <div
        onClick={() => setOpen(false)}
        style={{
          position: "fixed", inset: 0,
          zIndex: 9993,
          background: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(3px)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.28s ease",
        }}
      />

      {/* Wrapper — z 9994 */}
      <div
        ref={ref}
        style={{
          position: "fixed",
          top: 0, right: 0, bottom: 0,
          zIndex: 9994,
          display: "flex",
          alignItems: "stretch",
        }}
      >
        {/* ── DRAWER ── */}
        <div
          style={{
            width: 300,
            height: "100%",
            transform: open ? "translateX(0)" : "translateX(100%)",
            transition: "transform 0.32s cubic-bezier(0.4,0,0.2,1)",
            background: S.surface,
            borderLeft: `1px solid ${S.border}`,
            boxShadow: isDark
              ? "-32px 0 80px rgba(0,0,0,0.75)"
              : "-32px 0 80px rgba(0,0,0,0.18)",
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
          }}
        >
          {/* Header */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "20px 20px 16px",
            borderBottom: `1px solid ${S.border}`,
            position: "sticky", top: 0,
            background: S.surface,
            zIndex: 1,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 3, height: 22, background: `linear-gradient(180deg, ${accentColor}, ${accentSecondary})` }} />
              <div>
                <p style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.2em", textTransform: "uppercase", color: accentColor, margin: 0 }}>
                  Appearance
                </p>
                <p style={{ fontSize: 17, fontWeight: 800, color: S.text, letterSpacing: "-0.04em", margin: 0 }}>
                  Theme
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{
                width: 30, height: 30,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: S.surfaceAlt, border: `1px solid ${S.border}`,
                cursor: "pointer", borderRadius: 2,
              }}
            >
              <CloseIcon s={14} c={S.muted} />
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: "20px 20px 28px", flex: 1 }}>
            <Sec label="Mode" S={S} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginBottom: 24 }}>
              {([["light", "Light", SunIcon], ["dark", "Dark", MoonIcon]] as const).map(([mode, label, Icon]) => (
                <button
                  key={mode}
                  onClick={() => { if (theme !== mode) toggleTheme(); }}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                    padding: "14px 8px",
                    background: theme === mode ? `${accentColor}14` : S.surfaceAlt,
                    border: `1px solid ${theme === mode ? accentColor : S.border}`,
                    cursor: "pointer", transition: "all 0.15s", position: "relative",
                  }}
                >
                  <Icon s={17} c={theme === mode ? accentColor : S.muted} />
                  <span style={{ fontSize: 11, fontWeight: theme === mode ? 800 : 500, color: theme === mode ? accentColor : S.muted }}>
                    {label}
                  </span>
                  {theme === mode && (
                    <div style={{ position: "absolute", top: 5, right: 5, width: 15, height: 15, background: accentColor, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <CheckIcon s={8} c="#fff" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            <Sec label="Accent Color" S={S} />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 8 }}>
              {(Object.entries(ACCENT_PALETTES) as [AccentColor, typeof ACCENT_PALETTES[AccentColor]][]).map(([key, val]) => (
                <button
                  key={key} title={val.label} onClick={() => setAccent(key)}
                  style={{
                    width: 32, height: 32, background: val.primary,
                    border: accent === key ? `3px solid ${S.text}` : "3px solid transparent",
                    outline: accent === key ? `2px solid ${val.primary}` : "2px solid transparent",
                    outlineOffset: 1, cursor: "pointer",
                    transition: "transform 0.12s ease",
                    transform: accent === key ? "scale(1.2)" : "scale(1)",
                    borderRadius: 2,
                  }}
                />
              ))}
            </div>
            <p style={{ fontSize: 11, color: S.muted, marginBottom: 24, fontWeight: 600 }}>
              {ACCENT_PALETTES[accent].label}
            </p>

            {isDark && (
              <>
                <Sec label="Dark Variant" S={S} />
                <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 20 }}>
                  {(Object.entries(DARK_VARIANTS) as [DarkVariant, typeof DARK_VARIANTS[DarkVariant]][]).map(([key, val]) => (
                    <button
                      key={key} onClick={() => setDarkVariant(key)}
                      style={{
                        display: "flex", alignItems: "center", gap: 10, padding: "9px 10px",
                        background: darkVariant === key ? `${accentColor}12` : "transparent",
                        border: `1px solid ${darkVariant === key ? accentColor : S.border}`,
                        cursor: "pointer", transition: "all 0.12s",
                      }}
                    >
                      <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
                        {[val.bg, val.surface, val.surfaceAlt].map((c, i) => (
                          <div key={i} style={{ width: 10, height: 22, background: c }} />
                        ))}
                      </div>
                      <span style={{ fontSize: 12, flex: 1, textAlign: "left", fontWeight: darkVariant === key ? 700 : 500, color: darkVariant === key ? accentColor : S.text }}>
                        {val.label}
                      </span>
                      {darkVariant === key && <div style={{ width: 6, height: 6, background: accentColor, borderRadius: "50%", flexShrink: 0 }} />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: "12px 20px", borderTop: `1px solid ${S.border}`, textAlign: "center" }}>
            <p style={{ fontSize: 10, color: S.subtle, letterSpacing: "0.12em", textTransform: "uppercase", margin: 0 }}>
              HMEX · Appearance
            </p>
          </div>
        </div>

        {/* ── TAB — z 9995, above backdrop, below navbar ── */}
        {!open && (
          <div style={{
            position: "fixed", right: 0, top: "50%",
            transform: "translateY(-50%)",
            zIndex: 9995,
          }}>
            <button
              onClick={() => setOpen(true)}
              style={{
                width: 44, height: 110,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8,
                background: `linear-gradient(180deg, ${S.surface} 0%, ${S.surfaceAlt} 100%)`,
                borderTop: `1px solid ${S.border}`,
                borderBottom: `1px solid ${S.border}`,
                borderLeft: `2px solid ${accentColor}`,
                borderRight: "none",
                cursor: "pointer", transition: "all 0.2s ease",
                boxShadow: isDark
                  ? `-6px 0 32px rgba(0,0,0,0.6), -2px 0 12px ${accentColor}30`
                  : `-6px 0 24px rgba(0,0,0,0.13), -2px 0 10px ${accentColor}25`,
                animation: pulse ? "tabPulse 0.7s ease-in-out" : "none",
              }}
            >
              {isDark ? <MoonIcon s={17} c={accentColor} /> : <SunIcon s={17} c={accentColor} />}
              <div style={{ position: "relative", width: 10, height: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ position: "absolute", width: 20, height: 20, background: `${accentColor}35`, borderRadius: "50%", animation: "ring 2.4s ease-in-out infinite" }} />
                <div style={{ width: 9, height: 9, borderRadius: "50%", background: accentColor, flexShrink: 0 }} />
              </div>
              <PaletteIcon s={15} c={accentColor} />
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes ring {
          0%   { transform: scale(0.7); opacity: 0.9; }
          60%  { transform: scale(2.4); opacity: 0; }
          100% { transform: scale(0.7); opacity: 0; }
        }
        @keyframes tabPulse {
          0%   { box-shadow: -4px 0 0px ${accentColor}00; }
          40%  { box-shadow: -8px 0 28px ${accentColor}80; }
          100% { box-shadow: -4px 0 0px ${accentColor}00; }
        }
      `}</style>
    </>
  );
}