// ─── HMEX Brand Colors ────────────────────────────────────────────────────────
// Source of truth for both light and dark themes.
// Use these in Tailwind via CSS variables (see globals.css) or import directly.

export const colors = {
  // ── Primary (teal/cyan — from auth pages) ──────────────────────────────────
  primary: {
    50:  "#E6F7F8",
    100: "#C7EFF1",
    200: "#9FE2E6",
    300: "#6DD3D9",
    400: "#3CC4CC",
    500: "#0FB6C8", // main brand teal
    600: "#0EA8B8",
    700: "#0A8A97",
    800: "#076B75",
    900: "#044D54",
  },

  // ── Emerald (buttons, accents) ─────────────────────────────────────────────
  emerald: {
    50:  "#E0F7F1",
    100: "#B3ECDF",
    200: "#80DFCA",
    300: "#4DD2B5",
    400: "#26C7A4",
    500: "#0FBB7D", // updated to match auth pages
    600: "#0B8A78",
    700: "#087060",
    800: "#055748",
    900: "#023D32",
  },

  // ── Navy (dark backgrounds, headers) ──────────────────────────────────────
  navy: {
    900: "#0A2D5E",
    800: "#0D3870",
    700: "#104482",
    600: "#1A5499",
  },

  // ── Neutral / Gray ────────────────────────────────────────────────────────
  gray: {
    50:  "#F9FAFB",
    100: "#F2F4F7",
    200: "#E4E7EC",
    300: "#D0D5DD",
    400: "#98A2B3",
    500: "#667085",
    600: "#475467",
    700: "#344054",
    800: "#1D2939",
    900: "#101828",
  },

  // ── Semantic ──────────────────────────────────────────────────────────────
  success: "#0FBB7D",
  warning: "#F79009",
  error:   "#F04438",
  info:    "#0FB6C8",
} as const;

// ─── Light Theme ──────────────────────────────────────────────────────────────
export const lightTheme = {
  // Backgrounds
  bgBase:        "#F8F8F6",   // updated to match auth pages
  bgSurface:     "#FFFFFF",   // cards, modals
  bgMuted:       "#F3F4F6",   // subtle sections
  bgAccent:      "#D6F2EA",   // green tinted card bg

  // Text
  textPrimary:   "#0A0A0B",   // updated to match auth pages
  textSecondary: "#52525B",   // updated to match auth pages
  textMuted:     "#667085",
  textInverse:   "#FFFFFF",

  // Borders
  border:        "#E2E2E0",   // updated to match auth pages
  borderFocus:   "#0FB6C8",

  // Brand
  brandPrimary:  "#0FB6C8",
  brandEmerald:  "#0FBB7D",   // updated to match auth pages
  brandNavy:     "#0A2D5E",

  // States
  success:       "#0FBB7D",
  successBg:     "#E0F7F1",
  error:         "#F04438",
  errorBg:       "#FEF2F2",
  warning:       "#F79009",
  warningBg:     "#FFFAEB",
} as const;

// ─── Dark Theme ───────────────────────────────────────────────────────────────
export const darkTheme = {
  // Backgrounds
  bgBase:        "#0D0D0F",   // updated to match auth pages
  bgSurface:     "#1A1B1F",   // updated to match auth pages
  bgMuted:       "#202126",   // updated to match auth pages
  bgAccent:      "#0D2B22",   // dark green tinted card bg

  // Text
  textPrimary:   "#FFFFFF",   // updated to match auth pages
  textSecondary: "#A0A0A8",   // updated to match auth pages
  textMuted:     "#5A5A64",   // updated to match auth pages
  textInverse:   "#0A0A0B",

  // Borders
  border:        "#202126",   // updated to match auth pages
  borderFocus:   "#0FB6C8",

  // Brand (same — brand colors stay consistent)
  brandPrimary:  "#0FB6C8",
  brandEmerald:  "#0FBB7D",   // updated to match auth pages
  brandNavy:     "#0A2D5E",

  // States
  success:       "#0FBB7D",
  successBg:     "#0D2B22",
  error:         "#F04438",
  errorBg:       "#2D1515",
  warning:       "#F79009",
  warningBg:     "#2B2000",
} as const;

export type Theme = typeof lightTheme;