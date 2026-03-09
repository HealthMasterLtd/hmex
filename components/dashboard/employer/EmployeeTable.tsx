import { ArrowUpDown, Users } from "lucide-react";
import { Card } from "@/components/dashboard/Dashboardwidgets";
import type { Employee, SortBy, SortOrder } from "./types";
import { EmployeeRow } from "./EmployeeRow";

const COLORS = {
  blue: "#2563eb",
  border: "#e2e8f0",
  muted: "#64748b",
  hover: "#f8fafc",
  navy: "#0f172a",
  subtle: "#94a3b8",
};

interface EmployeeTableProps {
  employees: Employee[];
  sortBy: SortBy;
  sortOrder: SortOrder;
  onSort: (column: SortBy) => void;
  onView: (id: number) => void;
  onMessage: (id: number) => void;
  onReport?: (id: number) => void;
  onRemind?: (id: number) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalResults: number;
}

export function EmployeeTable({
  employees,
  sortBy,
  sortOrder,
  onSort,
  onView,
  onMessage,
  onReport,
  onRemind,
  currentPage,
  totalPages,
  onPageChange,
  totalResults,
}: EmployeeTableProps) {
  const getSortIcon = (column: SortBy) => {
    if (sortBy !== column) return null;
    return (
      <ArrowUpDown 
        size={10} 
        style={{ 
          transform: sortOrder === "asc" ? "none" : "rotate(180deg)",
          transition: "transform 0.2s",
        }} 
      />
    );
  };

  if (employees.length === 0) {
    return (
      <Card>
        <div style={{
          padding: "60px 24px",
          textAlign: "center",
        }}>
          <Users size={40} style={{ color: COLORS.subtle, marginBottom: 16 }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, color: COLORS.navy, margin: 0 }}>
            No employees found
          </h3>
          <p style={{ fontSize: 13, color: COLORS.muted, margin: "8px 0 0" }}>
            Try adjusting your filters or add a new employee
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ 
              borderBottom: `2px solid ${COLORS.border}`,
              background: COLORS.hover,
            }}>
              <th style={{ padding: "14px 12px", textAlign: "left" }}>
                <button
                  onClick={() => onSort("name")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    background: "none",
                    border: "none",
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: sortBy === "name" ? COLORS.blue : COLORS.muted,
                    cursor: "pointer",
                  }}
                >
                  Employee
                  {getSortIcon("name")}
                </button>
              </th>
              <th style={{ padding: "14px 12px", textAlign: "left", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: COLORS.muted }}>
                Department
              </th>
              <th style={{ padding: "14px 12px", textAlign: "left" }}>
                <button
                  onClick={() => onSort("risk")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    background: "none",
                    border: "none",
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: sortBy === "risk" ? COLORS.blue : COLORS.muted,
                    cursor: "pointer",
                  }}
                >
                  Risk Level
                  {getSortIcon("risk")}
                </button>
              </th>
              <th style={{ padding: "14px 12px", textAlign: "left" }}>
                <button
                  onClick={() => onSort("date")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    background: "none",
                    border: "none",
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: sortBy === "date" ? COLORS.blue : COLORS.muted,
                    cursor: "pointer",
                  }}
                >
                  Status
                  {getSortIcon("date")}
                </button>
              </th>
              <th style={{ padding: "14px 12px", textAlign: "right", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: COLORS.muted }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {employees.map((employee) => (
              <EmployeeRow
                key={employee.id}
                employee={employee}
                onView={onView}
                onMessage={onMessage}
                onReport={onReport}
                onRemind={onRemind}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{
          marginTop: 20,
          paddingTop: 16,
          borderTop: `1px solid ${COLORS.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <p style={{ fontSize: 11, color: COLORS.muted }}>
            Showing {employees.length} of {totalResults} employees
          </p>
          
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              style={{
                padding: "6px 12px",
                background: "transparent",
                border: `1px solid ${COLORS.border}`,
                color: currentPage === 1 ? COLORS.subtle : COLORS.muted,
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
                opacity: currentPage === 1 ? 0.5 : 1,
              }}
            >
              Previous
            </button>
            
            <span style={{ fontSize: 12, color: COLORS.navy }}>
              Page {currentPage} of {totalPages}
            </span>
            
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              style={{
                padding: "6px 12px",
                background: "transparent",
                border: `1px solid ${COLORS.border}`,
                color: currentPage === totalPages ? COLORS.subtle : COLORS.muted,
                cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                opacity: currentPage === totalPages ? 0.5 : 1,
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}