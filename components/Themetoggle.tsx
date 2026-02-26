/* eslint-disable react-hooks/set-state-in-effect */
"use client";

/**
 * ThemeToggle.tsx
 * Floating right-edge panel — bigger tab (44×96), pulsing accent ring,
 * fully theme-aware. Import anywhere: <ThemeToggle />
 */

import React, { useState, useEffect, useRef } from "react";
import {
  useTheme,
  ACCENT_PALETTES,
  DARK_VARIANTS,
  type AccentColor,
  type DarkVariant,
} from "@/contexts/ThemeContext";

// ─── INLINE ICONS ────────────────────────────────────────────────────────────
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
const BackIcon = ({ s = 13, c = "currentColor" }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);
const CheckIcon = ({ s = 8, c = "currentColor" }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

// ─── SECTION LABEL ───────────────────────────────────────────────────────────
function Sec({ label, S }: { label: string; S: { muted: string; border: string } }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
      <p style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.16em", textTransform: "uppercase", color: S.muted, margin: 0, whiteSpace: "nowrap" }}>
        {label}
      </p>
      <div style={{ flex: 1, height: 1, background: S.border }} />
    </div>
  );
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
export default function ThemeToggle() {
  const { isDark, theme, darkVariant, accent, accentColor, accentSecondary, surface: S, toggleTheme, setDarkVariant, setAccent } = useTheme();
  const [open,    setOpen]    = useState(false);
  const [hover,   setHover]   = useState(false);
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (!open) return;
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [open]);

  if (!mounted) return null;

  const tabBg = open
    ? `linear-gradient(180deg, ${accentColor}, ${accentSecondary})`
    : hover ? S.surfaceAlt : S.surface;

  return (
    <>
      {open && (
        <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 9996, background: "rgba(0,0,0,0.3)", backdropFilter: "blur(2px)" }} />
      )}

      <div ref={ref} style={{ position: "fixed", right: 0, top: "50%", transform: "translateY(-50%)", zIndex: 9997, display: "flex", alignItems: "stretch" }}>

        {/* PANEL */}
        <div style={{
          width: open ? 284 : 0, overflow: "hidden",
          transition: "width 0.3s cubic-bezier(0.4,0,0.2,1)",
          background: S.surface,
          borderTop: `1px solid ${S.border}`,
          borderBottom: `1px solid ${S.border}`,
          borderLeft: `1px solid ${S.border}`,
          boxShadow: open ? (isDark ? "-28px 0 72px rgba(0,0,0,0.7), -4px 0 16px rgba(0,0,0,0.4)" : "-28px 0 72px rgba(0,0,0,0.18), -4px 0 12px rgba(0,0,0,0.08)") : "none",
        }}>
          <div style={{ width: 284, padding: "24px 20px 20px" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 3, height: 22, background: `linear-gradient(180deg, ${accentColor}, ${accentSecondary})` }} />
                <div>
                  <p style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.2em", textTransform: "uppercase", color: accentColor, margin: 0 }}>Appearance</p>
                  <p style={{ fontSize: 17, fontWeight: 800, color: S.text, letterSpacing: "-0.04em", margin: 0 }}>Theme</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: S.surfaceAlt, border: `1px solid ${S.border}`, cursor: "pointer" }}>
                <BackIcon s={13} c={S.muted} />
              </button>
            </div>

            {/* Mode */}
            <Sec label="Mode" S={S} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginBottom: 22 }}>
              {([["light", "Light", SunIcon], ["dark", "Dark", MoonIcon]] as const).map(([mode, label, Icon]) => (
                <button key={mode} onClick={() => { if (theme !== mode) toggleTheme(); }}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "13px 8px",
                    background: theme === mode ? `${accentColor}14` : S.surfaceAlt,
                    border: `1px solid ${theme === mode ? accentColor : S.border}`,
                    cursor: "pointer", transition: "all 0.15s", position: "relative",
                  }}>
                  <Icon s={16} c={theme === mode ? accentColor : S.muted} />
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

            {/* Accent */}
            <Sec label="Accent Color" S={S} />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 9, marginBottom: 7 }}>
              {(Object.entries(ACCENT_PALETTES) as [AccentColor, typeof ACCENT_PALETTES[AccentColor]][]).map(([key, val]) => (
                <button key={key} title={val.label} onClick={() => setAccent(key)}
                  style={{
                    width: 30, height: 30, background: val.primary,
                    border: accent === key ? `3px solid ${S.text}` : "3px solid transparent",
                    outline: accent === key ? `2px solid ${val.primary}` : "2px solid transparent",
                    outlineOffset: 1, cursor: "pointer",
                    transition: "transform 0.12s ease",
                    transform: accent === key ? "scale(1.2)" : "scale(1)",
                  }}
                />
              ))}
            </div>
            <p style={{ fontSize: 11, color: S.muted, marginBottom: 22, fontWeight: 600 }}>{ACCENT_PALETTES[accent].label}</p>

            {/* Dark variant */}
            {isDark && (
              <>
                <Sec label="Dark Variant" S={S} />
                <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 18 }}>
                  {(Object.entries(DARK_VARIANTS) as [DarkVariant, typeof DARK_VARIANTS[DarkVariant]][]).map(([key, val]) => (
                    <button key={key} onClick={() => setDarkVariant(key)}
                      style={{
                        display: "flex", alignItems: "center", gap: 10, padding: "8px 10px",
                        background: darkVariant === key ? `${accentColor}12` : "transparent",
                        border: `1px solid ${darkVariant === key ? accentColor : S.border}`,
                        cursor: "pointer", transition: "all 0.12s",
                      }}>
                      <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
                        {[val.bg, val.surface, val.surfaceAlt].map((c, i) => <div key={i} style={{ width: 10, height: 22, background: c }} />)}
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

            <p style={{ fontSize: 10, color: S.subtle, textAlign: "center", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              HMEX · Appearance
            </p>
          </div>
        </div>

        {/* TAB BUTTON — 44×96, pulsing */}
        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
          {/* Tooltip */}
          {!open && hover && (
            <div style={{
              position: "absolute", right: "calc(100% + 12px)", top: "50%", transform: "translateY(-50%)",
              background: S.surface, border: `1px solid ${S.border}`, padding: "6px 14px",
              whiteSpace: "nowrap", fontSize: 11, fontWeight: 800, letterSpacing: "0.1em",
              textTransform: "uppercase", color: S.text,
              boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.45)" : "0 4px 16px rgba(0,0,0,0.12)",
              pointerEvents: "none", animation: "ttIn 0.14s ease",
            }}>
              Theme
              <div style={{ position: "absolute", right: -5, top: "50%", transform: "translateY(-50%)", width: 0, height: 0, borderTop: "5px solid transparent", borderBottom: "5px solid transparent", borderLeft: `5px solid ${S.border}` }} />
            </div>
          )}

          <button
            onClick={() => setOpen(o => !o)}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{
              width: 44, height: 96,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 7,
              background: tabBg,
              borderTop: `1px solid ${open ? accentColor : S.border}`,
borderBottom: `1px solid ${open ? accentColor : S.border}`,
borderLeft: `1px solid ${open ? accentColor : S.border}`,
              borderRight: "none", cursor: "pointer",
              transition: "all 0.22s ease",
              boxShadow: open ? "none" : (isDark ? "-6px 0 28px rgba(0,0,0,0.5)" : "-6px 0 20px rgba(0,0,0,0.1)"),
            }}
          >
            {isDark
              ? <MoonIcon s={17} c={open ? "#fff" : accentColor} />
              : <SunIcon  s={17} c={open ? "#fff" : accentColor} />
            }

            {/* Pulsing dot */}
            <div style={{ position: "relative", width: 8, height: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {!open && (
                <div style={{
                  position: "absolute",
                  width: 16, height: 16,
                  background: `${accentColor}28`,
                  borderRadius: "50%",
                  animation: "ring 2.2s ease-in-out infinite",
                }} />
              )}
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: open ? "rgba(255,255,255,0.85)" : accentColor, transition: "background 0.2s", flexShrink: 0 }} />
            </div>

            <PaletteIcon s={15} c={open ? "rgba(255,255,255,0.8)" : S.muted} />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes ttIn {
          from { opacity: 0; transform: translateY(-50%) translateX(8px); }
          to   { opacity: 1; transform: translateY(-50%) translateX(0); }
        }
        @keyframes ring {
          0%   { transform: scale(0.7); opacity: 0.8; }
          65%  { transform: scale(2.2); opacity: 0; }
          100% { transform: scale(0.7); opacity: 0; }
        }
      `}</style>
    </>
  );
}