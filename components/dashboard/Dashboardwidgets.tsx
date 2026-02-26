"use client";

import React from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react";

// ─── TOKENS ──────────────────────────────────────────────────────────────────
// Pull directly from the ThemeContext surface object so all widgets
// respond instantly to any theme/accent/variant change.

export function useTokens() {
  const { isDark, surface: S, accentColor, accentFaint } = useTheme();
  return {
    isDark,
    // Surface layers
    bg:         S.surface,
    pageBg:     S.bg,
    surfaceAlt: S.surfaceAlt,
    // Borders / text
    border:     S.border,
    textH:      S.text,
    textM:      S.muted,
    textS:      S.subtle,
    // Accent (live — changes with user's accent pick)
    accent:     accentColor,
    accentFaint,
  };
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "flat";
  trendLabel?: string;
  accentColor?: string;
  wide?: boolean;
}

export function StatCard({ label, value, sub, icon, trend, trendLabel, accentColor: propAccent, wide }: StatCardProps) {
  const { isDark, bg, border, textH, textM, textS, accent } = useTokens();
  const col = propAccent ?? accent;

  const trendColor = trend === "up" ? "#ef4444" : trend === "down" ? "#22c55e" : textS;
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  return (
    <div
      style={{
        display: "flex", flexDirection: "column", gap: 12,
        padding: 20, gridColumn: wide ? "span 2" : undefined,
        background: bg, border: `1px solid ${border}`,
        boxShadow: isDark ? "0 2px 12px rgba(0,0,0,0.28)" : "0 2px 12px rgba(0,0,0,0.04)",
        transition: "box-shadow 0.2s ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", color: textM, margin: 0 }}>
          {label}
        </p>
        {icon && (
          <div style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: `${col}18`, color: col }}>
            {icon}
          </div>
        )}
      </div>

      <div>
        <p style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.04em", color: textH, margin: 0, lineHeight: 1 }}>
          {value}
        </p>
        {sub && <p style={{ fontSize: 11, color: textM, margin: "4px 0 0" }}>{sub}</p>}
      </div>

      {trend && trendLabel && (
        <div style={{
          display: "flex", alignItems: "center", gap: 6, paddingTop: 8,
          borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}`,
        }}>
          <TrendIcon size={12} strokeWidth={2} color={trendColor} />
          <p style={{ fontSize: 11, color: trendColor, margin: 0 }}>{trendLabel}</p>
        </div>
      )}
    </div>
  );
}

// ─── SECTION HEADER ──────────────────────────────────────────────────────────
export function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  const { textH, textM, border } = useTokens();
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", paddingBottom: 16, marginBottom: 20, borderBottom: `1px solid ${border}` }}>
      <div>
        <h2 style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-0.02em", color: textH, margin: 0 }}>{title}</h2>
        {subtitle && <p style={{ fontSize: 12, color: textM, margin: "3px 0 0" }}>{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ─── CARD WRAPPER ────────────────────────────────────────────────────────────
export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { bg, border, isDark } = useTokens();
  return (
    <div style={{
      padding: 20, background: bg, border: `1px solid ${border}`,
      boxShadow: isDark ? "0 2px 12px rgba(0,0,0,0.22)" : "0 2px 12px rgba(0,0,0,0.04)",
    }} className={className}>
      {children}
    </div>
  );
}

// ─── RISK BADGE ──────────────────────────────────────────────────────────────
const RISK_COLOURS: Record<string, { bg: string; text: string; dot: string }> = {
  "low":               { bg: "rgba(34,197,94,.1)",   text: "#16a34a", dot: "#22c55e" },
  "slightly-elevated": { bg: "rgba(234,179,8,.1)",   text: "#b45309", dot: "#eab308" },
  "moderate":          { bg: "rgba(249,115,22,.1)",  text: "#c2410c", dot: "#f97316" },
  "high":              { bg: "rgba(239,68,68,.1)",   text: "#b91c1c", dot: "#ef4444" },
  "very-high":         { bg: "rgba(220,38,38,.12)",  text: "#991b1b", dot: "#dc2626" },
};

export function RiskBadge({ level }: { level: string }) {
  const c = RISK_COLOURS[level] ?? RISK_COLOURS["low"];
  const label = level.split("-").map(w => w[0].toUpperCase() + w.slice(1)).join(" ");
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 8px", background: c.bg, color: c.text, fontSize: 11, fontWeight: 700 }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.dot }} />
      {label}
    </span>
  );
}

// ─── SKELETON ────────────────────────────────────────────────────────────────
function Skel({ w = "100%", h = 16 }: { w?: string | number; h?: number }) {
  const { isDark } = useTheme();
  return (
    <div className="animate-pulse" style={{
      width: w, height: h,
      background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)",
    }} />
  );
}

export function StatCardSkeleton() {
  const { bg, border } = useTokens();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: 20, background: bg, border: `1px solid ${border}` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Skel w={80} h={11} />
        <Skel w={28} h={28} />
      </div>
      <Skel w={100} h={36} />
      <Skel w={120} h={11} />
    </div>
  );
}

export function TableRowSkeleton({ cols = 4 }: { cols?: number }) {
  const { border } = useTokens();
  return (
    <tr style={{ borderBottom: `1px solid ${border}` }}>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} style={{ padding: "10px 14px" }}>
          <Skel w={i === 0 ? 120 : 70} h={13} />
        </td>
      ))}
    </tr>
  );
}

// ─── EMPTY STATE ─────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, description, action }: {
  icon?: React.ReactNode; title: string; description?: string; action?: React.ReactNode;
}) {
  const { textH, textM, surfaceAlt, isDark } = useTokens();
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 24px", textAlign: "center" }}>
      {icon && (
        <div style={{ width: 44, height: 44, background: surfaceAlt, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, color: isDark ? "#3d4f63" : "#94a3b8" }}>
          {icon}
        </div>
      )}
      <p style={{ fontSize: 14, fontWeight: 700, color: textH, margin: "0 0 6px" }}>{title}</p>
      {description && <p style={{ fontSize: 12, color: textM, margin: 0, maxWidth: "28ch", lineHeight: 1.5 }}>{description}</p>}
      {action && <div style={{ marginTop: 20 }}>{action}</div>}
    </div>
  );
}

// ─── ALERT BANNER ────────────────────────────────────────────────────────────
export function AlertBanner({ type = "info", message, onDismiss }: {
  type?: "warning" | "info" | "danger"; message: string; onDismiss?: () => void;
}) {
  const { accent } = useTokens();
  const colours = {
    warning: { bg: "rgba(234,179,8,.08)",  border: "rgba(234,179,8,.25)",  text: "#b45309", icon: "#eab308" },
    danger:  { bg: "rgba(239,68,68,.08)",  border: "rgba(239,68,68,.25)",  text: "#b91c1c", icon: "#ef4444" },
    info:    { bg: `${accent}0d`,          border: `${accent}28`,          text: accent,    icon: accent },
  };
  const c = colours[type];
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "11px 14px", marginBottom: 20, background: c.bg, border: `1px solid ${c.border}` }}>
      <AlertTriangle size={14} strokeWidth={2} color={c.icon} style={{ marginTop: 1, flexShrink: 0 }} />
      <p style={{ flex: 1, fontSize: 12.5, lineHeight: 1.5, color: c.text, margin: 0 }}>{message}</p>
      {onDismiss && (
        <button onClick={onDismiss} style={{ fontSize: 11, fontWeight: 700, color: c.text, background: "none", border: "none", cursor: "pointer" }}>
          Dismiss
        </button>
      )}
    </div>
  );
}

// ─── DASH BUTTON ─────────────────────────────────────────────────────────────
interface DashButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  size?: "sm" | "md";
  variant?: "primary" | "ghost" | "danger";
  icon?: React.ReactNode;
}

export function DashButton({ children, size = "md", variant = "primary", icon, ...props }: DashButtonProps) {
  const { isDark, border, accent, accentFaint } = useTokens();

  const styles = {
    primary: { background: accent,                   color: "#fff",    boxShadow: `0 2px 10px ${accent}40`, borderColor: "transparent" },
    ghost:   { background: "transparent",            color: isDark ? "#8b9cb5" : "#374151", boxShadow: "none", borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" },
    danger:  { background: "rgba(239,68,68,.1)",     color: "#ef4444", boxShadow: "none",   borderColor: "rgba(239,68,68,.2)" },
  };

  const s = styles[variant];
  const pad = size === "sm" ? "6px 12px" : "8px 16px";
  const fontSize = size === "sm" ? 11 : 12;

  return (
    <button
      {...props}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: pad, fontSize, fontWeight: 700,
        background: s.background, color: s.color,
        border: `1px solid ${s.borderColor}`, boxShadow: s.boxShadow,
        cursor: "pointer", transition: "all 0.15s ease",
        letterSpacing: "0.02em",
        opacity: props.disabled ? 0.4 : 1,
        ...props.style,
      }}
    >
      {icon && <span style={{ flexShrink: 0 }}>{icon}</span>}
      {children}
    </button>
  );
}