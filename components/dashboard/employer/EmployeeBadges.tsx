// /components/dashboard/employer/employees/EmployeeBadges.tsx

import React from "react";
import { CheckCircle, AlertTriangle, Clock } from "lucide-react";

const COLORS = {
  low: "#22c55e",
  moderate: "#f97316",
  high: "#ef4444",
  muted: "#64748b",
  subtle: "#94a3b8",
};

interface RiskBadgeProps {
  level: "low" | "moderate" | "high" | null;
}

export function RiskBadge({ level }: RiskBadgeProps) {
  if (!level) return null;
  
  const config = {
    low: { 
      color: COLORS.low, 
      bg: "rgba(34,197,94,0.1)", 
      label: "Low Risk",
      icon: CheckCircle,
    },
    moderate: { 
      color: COLORS.moderate, 
      bg: "rgba(249,115,22,0.1)", 
      label: "Moderate Risk",
      icon: AlertTriangle,
    },
    high: { 
      color: COLORS.high, 
      bg: "rgba(239,68,68,0.1)", 
      label: "High Risk",
      icon: AlertTriangle,
    },
  };
  
  const c = config[level];
  const Icon = c.icon;
  
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "4px 10px",
      background: c.bg,
      color: c.color,
      fontSize: 11,
      fontWeight: 700,
    }}>
      <Icon size={12} />
      {c.label}
    </span>
  );
}

interface StatusBadgeProps {
  completed: boolean;
  date?: string | null;
}

export function StatusBadge({ completed, date }: StatusBadgeProps) {
  if (completed) {
    return (
      <span style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        background: "rgba(34,197,94,0.1)",
        color: COLORS.low,
        fontSize: 11,
        fontWeight: 700,
      }}>
        <CheckCircle size={12} />
        Completed
        {date && (
          <span style={{ 
            marginLeft: 4, 
            fontSize: 10, 
            color: COLORS.muted,
            fontWeight: 400,
          }}>
            {new Date(date).toLocaleDateString()}
          </span>
        )}
      </span>
    );
  }
  
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "4px 10px",
      background: "rgba(239,68,68,0.1)",
      color: COLORS.high,
      fontSize: 11,
      fontWeight: 700,
    }}>
      <Clock size={12} />
      Pending
    </span>
  );
}

interface RiskScoreBarProps {
  score: number;
  level: "low" | "moderate" | "high" | null;
}

export function RiskScoreBar({ score, level }: RiskScoreBarProps) {
  if (!score || !level) return null;
  
  const colors = {
    low: COLORS.low,
    moderate: COLORS.moderate,
    high: COLORS.high,
  };
  
  return (
    <div style={{ marginTop: 6, width: 80 }}>
      <div style={{
        height: 4,
        background: "#f1f5f9",
        overflow: "hidden",
      }}>
        <div style={{
          width: `${score}%`,
          height: "100%",
          background: colors[level],
        }} />
      </div>
      <p style={{ fontSize: 10, color: COLORS.muted, margin: "2px 0 0" }}>
        Score: {score}
      </p>
    </div>
  );
}