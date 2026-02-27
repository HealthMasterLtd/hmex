/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type ThemeMode = "light" | "dark";

export type DarkVariant =
  | "graphite"   // neutral charcoal
  | "midnight"   // pure near-black navy
  | "slate"      // cool blue-grey clinical
  | "forest"     // dark with green undertone
  | "obsidian";  // ultra dark, subtle purple tint

export type AccentColor =
  | "teal"       // #0FBB7D — default brand
  | "cyan"       // #0FB6C8 — brand secondary
  | "coral"      // #F05C5C — warm health
  | "violet"     // #7C5CFC — modern tech
  | "amber"      // #F59E0B — energy/vitality
  | "rose"       // #EC4899 — wellness
  | "cobalt";    // #2563EB — clinical blue

// ─── PALETTES ────────────────────────────────────────────────────────────────

export const ACCENT_PALETTES: Record<
  AccentColor,
  { primary: string; secondary: string; faint: string; label: string }
> = {
  teal:   { primary: "#0FBB7D", secondary: "#059669", faint: "#0FBB7D18", label: "Teal" },
  cyan:   { primary: "#0FB6C8", secondary: "#0891B2", faint: "#0FB6C818", label: "Cyan" },
  coral:  { primary: "#F05C5C", secondary: "#E11D48", faint: "#F05C5C18", label: "Coral" },
  violet: { primary: "#7C5CFC", secondary: "#6D28D9", faint: "#7C5CFC18", label: "Violet" },
  amber:  { primary: "#F59E0B", secondary: "#D97706", faint: "#F59E0B18", label: "Amber" },
  rose:   { primary: "#EC4899", secondary: "#DB2777", faint: "#EC489918", label: "Rose" },
  cobalt: { primary: "#2563EB", secondary: "#1D4ED8", faint: "#2563EB18", label: "Cobalt" },
};

export const DARK_VARIANTS: Record<
  DarkVariant,
  { bg: string; surface: string; surfaceAlt: string; border: string; text: string; muted: string; subtle: string; label: string }
> = {
  graphite: {
    bg: "#0D0D0F", surface: "#1A1B1F", surfaceAlt: "#222327",
    border: "rgba(255,255,255,0.08)", text: "#F8FAFC",
    muted: "#9CA3AF", subtle: "#3F4147", label: "Graphite",
  },
  midnight: {
    bg: "#080C14", surface: "#0E1420", surfaceAlt: "#141C2E",
    border: "rgba(255,255,255,0.07)", text: "#F0F4FF",
    muted: "#7B8DB0", subtle: "#2A3348", label: "Midnight",
  },
  slate: {
    bg: "#0A0F1A", surface: "#111827", surfaceAlt: "#1A2235",
    border: "rgba(148,163,184,0.12)", text: "#E2E8F0",
    muted: "#94A3B8", subtle: "#334155", label: "Slate",
  },
  forest: {
    bg: "#080F0D", surface: "#0F1A16", surfaceAlt: "#152319",
    border: "rgba(16,185,129,0.12)", text: "#ECFDF5",
    muted: "#6EE7B7", subtle: "#1F3329", label: "Forest",
  },
  obsidian: {
    bg: "#0A0810", surface: "#13101C", surfaceAlt: "#1C1728",
    border: "rgba(139,92,246,0.1)", text: "#F5F0FF",
    muted: "#A78BFA", subtle: "#2D2448", label: "Obsidian",
  },
};

export const LIGHT_SURFACE = {
  bg: "#F4F6F9", surface: "#FFFFFF", surfaceAlt: "#F0F2F6",
  border: "rgba(0,0,0,0.08)", text: "#0A0C10",
  muted: "#64748B", subtle: "#CBD5E1",
};

// ─── CONTEXT ──────────────────────────────────────────────────────────────────

export interface ThemeContextType {
  theme: ThemeMode;
  isDark: boolean;
  darkVariant: DarkVariant;
  accent: AccentColor;
  accentColor: string;
  accentSecondary: string;
  accentFaint: string;
  surface: typeof LIGHT_SURFACE;
  toggleTheme: () => void;
  setDarkVariant: (v: DarkVariant) => void;
  setAccent: (a: AccentColor) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

// ─── PROVIDER ────────────────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [darkVariant, setDarkVariantState] = useState<DarkVariant>("graphite");
  const [accent, setAccentState] = useState<AccentColor>("teal");

  useEffect(() => {
    try {
      const t = localStorage.getItem("hmex-theme") as ThemeMode | null;
      const dv = localStorage.getItem("hmex-dark-variant") as DarkVariant | null;
      const ac = localStorage.getItem("hmex-accent") as AccentColor | null;
      if (t === "light" || t === "dark") setTheme(t);
      // else if (window.matchMedia("(prefers-color-scheme: dark)").matches) setTheme("dark");
      if (dv && DARK_VARIANTS[dv]) setDarkVariantState(dv);
      if (ac && ACCENT_PALETTES[ac]) setAccentState(ac);
    } catch {}
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const s = theme === "dark" ? DARK_VARIANTS[darkVariant] : LIGHT_SURFACE;
    const a = ACCENT_PALETTES[accent];

    theme === "dark" ? root.classList.add("dark") : root.classList.remove("dark");

    root.style.setProperty("--bg",          s.bg);
    root.style.setProperty("--surface",     s.surface);
    root.style.setProperty("--surface-alt", s.surfaceAlt);
    root.style.setProperty("--border",      s.border);
    root.style.setProperty("--text",        s.text);
    root.style.setProperty("--muted",       s.muted);
    root.style.setProperty("--subtle",      s.subtle);
    root.style.setProperty("--accent",      a.primary);
    root.style.setProperty("--accent-sec",  a.secondary);
    root.style.setProperty("--accent-faint",a.faint);

    try {
      localStorage.setItem("hmex-theme", theme);
      localStorage.setItem("hmex-dark-variant", darkVariant);
      localStorage.setItem("hmex-accent", accent);
    } catch {}
  }, [theme, darkVariant, accent]);

  const toggleTheme = useCallback(() => setTheme(p => p === "light" ? "dark" : "light"), []);
  const setDarkVariant = useCallback((v: DarkVariant) => setDarkVariantState(v), []);
  const setAccent = useCallback((a: AccentColor) => setAccentState(a), []);

  const surface = theme === "dark" ? DARK_VARIANTS[darkVariant] : LIGHT_SURFACE;
  const { primary: accentColor, secondary: accentSecondary, faint: accentFaint } = ACCENT_PALETTES[accent];

  return (
    <ThemeContext.Provider value={{
      theme, isDark: theme === "dark", darkVariant, accent,
      accentColor, accentSecondary, accentFaint, surface,
      toggleTheme, setDarkVariant, setAccent,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}