import { Eye, Mail, FileText, RefreshCw } from "lucide-react";

const COLORS = {
  border: "#e2e8f0",
  muted: "#64748b",
};

interface EmployeeActionsProps {
  employeeId: number;
  hasAssessment: boolean;
  onView: (id: number) => void;
  onMessage: (id: number) => void;
  onReport?: (id: number) => void;
  onRemind?: (id: number) => void;
}

export function EmployeeActions({
  employeeId,
  hasAssessment,
  onView,
  onMessage,
  onReport,
  onRemind,
}: EmployeeActionsProps) {
  return (
    <div style={{ 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "flex-end", 
      gap: 6,
    }}>
      <button
        onClick={() => onView(employeeId)}
        style={{
          padding: "6px",
          background: "transparent",
          border: `1px solid ${COLORS.border}`,
          color: COLORS.muted,
          cursor: "pointer",
        }}
        title="View Details"
      >
        <Eye size={14} />
      </button>
      <button
        onClick={() => onMessage(employeeId)}
        style={{
          padding: "6px",
          background: "transparent",
          border: `1px solid ${COLORS.border}`,
          color: COLORS.muted,
          cursor: "pointer",
        }}
        title="Send Message"
      >
        <Mail size={14} />
      </button>
      {hasAssessment && onReport ? (
        <button
          onClick={() => onReport(employeeId)}
          style={{
            padding: "6px",
            background: "transparent",
            border: `1px solid ${COLORS.border}`,
            color: COLORS.muted,
            cursor: "pointer",
          }}
          title="View Report"
        >
          <FileText size={14} />
        </button>
      ) : onRemind && (
        <button
          onClick={() => onRemind(employeeId)}
          style={{
            padding: "6px",
            background: "transparent",
            border: `1px solid ${COLORS.border}`,
            color: COLORS.muted,
            cursor: "pointer",
          }}
          title="Send Reminder"
        >
          <RefreshCw size={14} />
        </button>
      )}
    </div>
  );
}