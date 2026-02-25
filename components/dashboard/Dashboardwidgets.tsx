"use client";

import React from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react";

// ─── SHARED TOKEN HELPER ──────────────────────────────────────────────────────
export function useTokens() {
  const { isDark } = useTheme();
  return {
    isDark,
    bg:      isDark ? "#0b0f1a" : "#ffffff",
    pageBg:  isDark ? "#080c16" : "#f1f5f9",
    border:  isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)",
    textH:   isDark ? "#f0f4f8"  : "#0f172a",
    textM:   isDark ? "#6b7a8d"  : "#64748b",
    textS:   isDark ? "#3d4f63"  : "#94a3b8",
    accent:  "#0d9488",
    accentFaint: isDark ? "rgba(13,148,136,0.12)" : "rgba(13,148,136,0.08)",
  };
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────
// Used for: "Last assessment", "Risk level", "Assessments taken", etc.
interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "flat";
  trendLabel?: string;
  accentColor?: string;
  /** Make card span 2 columns on the grid */
  wide?: boolean;
}

export function StatCard({
  label,
  value,
  sub,
  icon,
  trend,
  trendLabel,
  accentColor = "#0d9488",
  wide,
}: StatCardProps) {
  const { isDark, bg, border, textH, textM, textS } = useTokens();

  const trendColor =
    trend === "up" ? "#ef4444" :
    trend === "down" ? "#22c55e" :
    textS;

  const TrendIcon =
    trend === "up" ? TrendingUp :
    trend === "down" ? TrendingDown :
    Minus;

  return (
    <div
      className={`flex flex-col gap-3 p-5 transition-all duration-200 ${wide ? "col-span-2" : ""}`}
      style={{
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: 4,
        boxShadow: isDark
          ? "0 2px 12px rgba(0,0,0,0.25)"
          : "0 2px 12px rgba(0,0,0,0.04)",
      }}
    >
      {/* Top row: label + icon */}
      <div className="flex items-center justify-between">
        <p
          className="text-[11px] font-bold uppercase tracking-[0.14em]"
          style={{ color: textM }}
        >
          {label}
        </p>
        {icon && (
          <div
            className="flex items-center justify-center w-7 h-7"
            style={{
              borderRadius: 4,
              background: `${accentColor}18`,
              color: accentColor,
            }}
          >
            {icon}
          </div>
        )}
      </div>

      {/* Value */}
      <div>
        <p
          className="text-[1.7rem] font-black leading-none tracking-tight"
          style={{ color: textH, letterSpacing: "-0.03em" }}
        >
          {value}
        </p>
        {sub && (
          <p className="mt-1 text-[11px]" style={{ color: textM }}>
            {sub}
          </p>
        )}
      </div>

      {/* Trend */}
      {trend && trendLabel && (
        <div className="flex items-center gap-1.5 pt-1" style={{ borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}` }}>
          <TrendIcon size={12} strokeWidth={2} style={{ color: trendColor }} />
          <p className="text-[11px]" style={{ color: trendColor }}>{trendLabel}</p>
        </div>
      )}
    </div>
  );
}

// ─── SECTION HEADER ───────────────────────────────────────────────────────────
interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function SectionHeader({ title, subtitle, action }: SectionHeaderProps) {
  const { textH, textM, isDark, border } = useTokens();
  return (
    <div
      className="flex items-start justify-between pb-4 mb-5"
      style={{ borderBottom: `1px solid ${border}` }}
    >
      <div>
        <h2
          className="text-[15px] font-bold tracking-tight"
          style={{ color: textH, letterSpacing: "-0.02em" }}
        >
          {title}
        </h2>
        {subtitle && (
          <p className="mt-0.5 text-[12px]" style={{ color: textM }}>
            {subtitle}
          </p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ─── CARD WRAPPER ─────────────────────────────────────────────────────────────
export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { bg, border, isDark } = useTokens();
  return (
    <div
      className={`p-5 ${className}`}
      style={{
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: 4,
        boxShadow: isDark ? "0 2px 12px rgba(0,0,0,0.2)" : "0 2px 12px rgba(0,0,0,0.04)",
      }}
    >
      {children}
    </div>
  );
}

// ─── RISK BADGE ───────────────────────────────────────────────────────────────
const RISK_COLOURS: Record<string, { bg: string; text: string; dot: string }> = {
  "low":               { bg: "rgba(34,197,94,.1)",   text: "#16a34a", dot: "#22c55e" },
  "slightly-elevated": { bg: "rgba(234,179,8,.1)",   text: "#b45309", dot: "#eab308" },
  "moderate":          { bg: "rgba(249,115,22,.1)",  text: "#c2410c", dot: "#f97316" },
  "high":              { bg: "rgba(239,68,68,.1)",   text: "#b91c1c", dot: "#ef4444" },
  "very-high":         { bg: "rgba(220,38,38,.12)",  text: "#991b1b", dot: "#dc2626" },
};

export function RiskBadge({ level }: { level: string }) {
  const colours = RISK_COLOURS[level] ?? RISK_COLOURS["low"];
  const label = level.split("-").map(w => w[0].toUpperCase() + w.slice(1)).join(" ");
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-semibold"
      style={{ background: colours.bg, color: colours.text, borderRadius: 3 }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: colours.dot }} />
      {label}
    </span>
  );
}

// ─── LOADING SKELETON ─────────────────────────────────────────────────────────
function SkeletonBlock({ w = "100%", h = 16, className = "" }: { w?: string | number; h?: number; className?: string }) {
  const { isDark } = useTheme();
  return (
    <div
      className={`animate-pulse ${className}`}
      style={{
        width: w,
        height: h,
        borderRadius: 3,
        background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
      }}
    />
  );
}

export function StatCardSkeleton() {
  const { bg, border, isDark } = useTokens();
  return (
    <div
      className="flex flex-col gap-4 p-5"
      style={{
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: 4,
      }}
    >
      <div className="flex items-center justify-between">
        <SkeletonBlock w={80} h={11} />
        <SkeletonBlock w={28} h={28} />
      </div>
      <SkeletonBlock w={100} h={36} />
      <SkeletonBlock w={120} h={11} />
    </div>
  );
}

export function TableRowSkeleton({ cols = 4 }: { cols?: number }) {
  const { isDark, border } = useTokens();
  return (
    <tr style={{ borderBottom: `1px solid ${border}` }}>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <SkeletonBlock w={i === 0 ? 120 : 70} h={13} />
        </td>
      ))}
    </tr>
  );
}

// ─── EMPTY STATE ─────────────────────────────────────────────────────────────
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  const { textH, textM, isDark } = useTokens();
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {icon && (
        <div
          className="flex items-center justify-center w-12 h-12 mb-4"
          style={{
            background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
            borderRadius: 8,
            color: isDark ? "#3d4f63" : "#94a3b8",
          }}
        >
          {icon}
        </div>
      )}
      <p className="text-[14px] font-semibold mb-1" style={{ color: textH }}>{title}</p>
      {description && (
        <p className="text-[12px] max-w-[28ch] leading-relaxed" style={{ color: textM }}>{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

// ─── ALERT BANNER ────────────────────────────────────────────────────────────
interface AlertBannerProps {
  type?: "warning" | "info" | "danger";
  message: string;
  onDismiss?: () => void;
}

export function AlertBanner({ type = "info", message, onDismiss }: AlertBannerProps) {
  const colours = {
    warning: { bg: "rgba(234,179,8,.08)",  border: "rgba(234,179,8,.25)",  text: "#b45309", icon: "#eab308" },
    danger:  { bg: "rgba(239,68,68,.08)",  border: "rgba(239,68,68,.25)",  text: "#b91c1c", icon: "#ef4444" },
    info:    { bg: "rgba(13,148,136,.08)", border: "rgba(13,148,136,.25)", text: "#0d9488", icon: "#0d9488" },
  };
  const c = colours[type];
  return (
    <div
      className="flex items-start gap-3 px-4 py-3 mb-5"
      style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 4 }}
    >
      <AlertTriangle size={14} strokeWidth={2} style={{ color: c.icon, marginTop: 1, shrink: 0 }} />
      <p className="flex-1 text-[12.5px] leading-relaxed" style={{ color: c.text }}>{message}</p>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-[11px] font-semibold transition-opacity hover:opacity-70"
          style={{ color: c.text }}
        >
          Dismiss
        </button>
      )}
    </div>
  );
}

// ─── PRIMARY BUTTON ───────────────────────────────────────────────────────────
interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  size?: "sm" | "md";
  variant?: "primary" | "ghost" | "danger";
  icon?: React.ReactNode;
}

export function DashButton({
  children,
  size = "md",
  variant = "primary",
  icon,
  ...props
}: PrimaryButtonProps) {
  const { isDark, border } = useTokens();

  const styles = {
    primary: {
      background: "linear-gradient(135deg,#0d9488,#059669)",
      color: "#fff",
      boxShadow: "0 2px 10px rgba(13,148,136,.28)",
      borderColor: "transparent",
    },
    ghost: {
      background: "transparent",
      color: isDark ? "#8b9cb5" : "#374151",
      boxShadow: "none",
      borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
    },
    danger: {
      background: "rgba(239,68,68,.1)",
      color: "#ef4444",
      boxShadow: "none",
      borderColor: "rgba(239,68,68,.2)",
    },
  };

  const s = styles[variant];
  const pad = size === "sm" ? "px-3 py-1.5 text-[11px]" : "px-4 py-2 text-[12px]";

  return (
    <button
      {...props}
      className={`inline-flex items-center gap-1.5 font-semibold transition-all duration-150 active:scale-95 disabled:opacity-40 ${pad}`}
      style={{
        ...s,
        border: `1px solid ${s.borderColor}`,
        borderRadius: 4,
        ...props.style,
      }}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
}