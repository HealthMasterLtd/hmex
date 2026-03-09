
import React, { useState } from "react";
import { Building, Briefcase, Calendar } from "lucide-react";
import type { Employee } from "./types";
import { RiskBadge, StatusBadge, RiskScoreBar } from "./EmployeeBadges";
import { EmployeeActions } from "./EmployeeActions";

const COLORS = {
  navy: "#0f172a",
  blue: "#2563eb",
  teal: "#0d9488",
  border: "#e2e8f0",
  muted: "#64748b",
  subtle: "#94a3b8",
  hover: "#f8fafc",
  white: "#ffffff",
};

interface EmployeeRowProps {
  employee: Employee;
  onView: (id: number) => void;
  onMessage: (id: number) => void;
  onReport?: (id: number) => void;
  onRemind?: (id: number) => void;
}

export function EmployeeRow({
  employee,
  onView,
  onMessage,
  onReport,
  onRemind,
}: EmployeeRowProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <tr 
      style={{
        borderBottom: `1px solid ${COLORS.border}`,
        transition: "background 0.15s",
        background: isHovered ? COLORS.hover : "transparent",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Employee Info */}
      <td style={{ padding: "16px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 40,
            height: 40,
            background: `linear-gradient(135deg, ${COLORS.blue}, ${COLORS.teal})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: 14,
            fontWeight: 700,
          }}>
            {employee.name.split(" ").map(n => n[0]).join("")}
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.navy, margin: 0 }}>
              {employee.name}
            </p>
            <p style={{ fontSize: 11, color: COLORS.muted, margin: "2px 0 0" }}>
              {employee.email}
            </p>
            <p style={{ fontSize: 10, color: COLORS.subtle, margin: "2px 0 0" }}>
              ID: {employee.employeeId}
            </p>
          </div>
        </div>
      </td>
      
      {/* Department/Position */}
      <td style={{ padding: "16px 12px" }}>
        <p style={{ fontSize: 13, fontWeight: 500, color: COLORS.navy, margin: 0 }}>
          {employee.position}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
          <Building size={10} color={COLORS.subtle} />
          <p style={{ fontSize: 11, color: COLORS.muted, margin: 0 }}>
            {employee.department}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
          <Briefcase size={10} color={COLORS.subtle} />
          <p style={{ fontSize: 11, color: COLORS.muted, margin: 0 }}>
            {employee.location} · {employee.tenure}
          </p>
        </div>
      </td>
      
      {/* Risk Level */}
      <td style={{ padding: "16px 12px" }}>
        <RiskBadge level={employee.riskLevel} />
        {employee.riskScore && employee.riskLevel && (
          <RiskScoreBar score={employee.riskScore} level={employee.riskLevel} />
        )}
      </td>
      
      {/* Status */}
      <td style={{ padding: "16px 12px" }}>
        <StatusBadge 
          completed={employee.assessmentCompleted} 
          date={employee.completionDate}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6 }}>
          <Calendar size={10} color={COLORS.subtle} />
          <p style={{ fontSize: 10, color: COLORS.muted, margin: 0 }}>
            Last active: {new Date(employee.lastActive).toLocaleDateString()}
          </p>
        </div>
      </td>
      
      {/* Actions */}
      <td style={{ padding: "16px 12px", textAlign: "right" }}>
        {isHovered && (
          <EmployeeActions
            employeeId={employee.id}
            hasAssessment={employee.assessmentCompleted}
            onView={onView}
            onMessage={onMessage}
            onReport={onReport}
            onRemind={onRemind}
          />
        )}
      </td>
    </tr>
  );
}