import type { Employee } from "./types";

const COLORS = {
  navy: "#0f172a",
  white: "#ffffff",
  blue: "#2563eb",
  low: "#22c55e",
  moderate: "#f97316",
  high: "#ef4444",
  border: "#e2e8f0",
  muted: "#64748b",
};

interface EmployeeStatsProps {
  employees: Employee[];
}

export function EmployeeStats({ employees }: EmployeeStatsProps) {
  const totalEmployees = employees.length;
  const completedCount = employees.filter(e => e.assessmentCompleted).length;
  const pendingCount = totalEmployees - completedCount;
  const highRiskCount = employees.filter(e => e.riskLevel === "high").length;
  const moderateRiskCount = employees.filter(e => e.riskLevel === "moderate").length;
  const lowRiskCount = employees.filter(e => e.riskLevel === "low").length;
  const completionRate = Math.round((completedCount / totalEmployees) * 100);

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
      gap: 10,
      marginBottom: 24,
    }}>
      {/* Total Employees */}
      <div style={{
        padding: 20,
        background: COLORS.white,
        border: `1px solid ${COLORS.border}`,
      }}>
        <p style={{ fontSize: 11, color: COLORS.muted, margin: 0 }}>Total Employees</p>
        <p style={{ fontSize: 32, fontWeight: 900, color: COLORS.navy, margin: "8px 0 0" }}>
          {totalEmployees}
        </p>
      </div>
      
      {/* Completion Rate */}
      <div style={{
        padding: 20,
        background: COLORS.white,
        border: `1px solid ${COLORS.border}`,
      }}>
        <p style={{ fontSize: 11, color: COLORS.muted, margin: 0 }}>Completion Rate</p>
        <p style={{ fontSize: 32, fontWeight: 900, color: COLORS.low, margin: "8px 0 0" }}>
          {completionRate}%
        </p>
        <p style={{ fontSize: 11, color: COLORS.muted, margin: "4px 0 0" }}>
          {completedCount} completed · {pendingCount} pending
        </p>
      </div>
      
      {/* Risk Distribution */}
      <div style={{
        padding: 20,
        background: COLORS.white,
        border: `1px solid ${COLORS.border}`,
      }}>
        <p style={{ fontSize: 11, color: COLORS.muted, margin: 0 }}>Risk Distribution</p>
        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
          <div>
            <span style={{ fontSize: 18, fontWeight: 900, color: COLORS.low }}>{lowRiskCount}</span>
            <span style={{ fontSize: 10, color: COLORS.muted, marginLeft: 2 }}>Low</span>
          </div>
          <div>
            <span style={{ fontSize: 18, fontWeight: 900, color: COLORS.moderate }}>{moderateRiskCount}</span>
            <span style={{ fontSize: 10, color: COLORS.muted, marginLeft: 2 }}>Mod</span>
          </div>
          <div>
            <span style={{ fontSize: 18, fontWeight: 900, color: COLORS.high }}>{highRiskCount}</span>
            <span style={{ fontSize: 10, color: COLORS.muted, marginLeft: 2 }}>High</span>
          </div>
        </div>
      </div>
    </div>
  );
}