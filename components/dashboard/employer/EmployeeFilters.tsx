import { Search } from "lucide-react";
import { Card } from "@/components/dashboard/Dashboardwidgets";
import type { RiskFilter, StatusFilter } from "./types";

const COLORS = {
  blue: "#2563eb",
  border: "#e2e8f0",
  white: "#ffffff",
  navy: "#0f172a",
  muted: "#64748b",
};

const DEPARTMENTS = [
  "All Departments",
  "Engineering",
  "Marketing",
  "Sales",
  "HR",
  "Operations",
  "Finance",
  "IT",
];

const LOCATIONS = [
  "All Locations",
  "New York",
  "San Francisco",
  "Chicago",
  "Los Angeles",
  "Austin",
  "Miami",
  "Denver",
  "Seattle",
  "Boston",
  "Portland",
];

interface EmployeeFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  departmentFilter: string;
  onDepartmentChange: (value: string) => void;
  locationFilter: string;
  onLocationChange: (value: string) => void;
  riskFilter: RiskFilter;
  onRiskChange: (value: RiskFilter) => void;
  statusFilter: StatusFilter;
  onStatusChange: (value: StatusFilter) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export function EmployeeFilters({
  searchTerm,
  onSearchChange,
  departmentFilter,
  onDepartmentChange,
  locationFilter,
  onLocationChange,
  riskFilter,
  onRiskChange,
  statusFilter,
  onStatusChange,
  onClearFilters,
  hasActiveFilters,
}: EmployeeFiltersProps) {
  return (
    <Card>
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 12,
      }}>
        {/* Search */}
        <div style={{ flex: 2, minWidth: 250, position: "relative" }}>
          <Search size={14} style={{
            position: "absolute",
            left: 12,
            top: "50%",
            transform: "translateY(-50%)",
            color: COLORS.muted,
          }} />
          <input
            type="text"
            placeholder="Search by name, email, ID, or position..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 10px 10px 36px",
              fontSize: 12,
              border: `1px solid ${COLORS.border}`,
              background: COLORS.white,
              color: COLORS.navy,
            }}
          />
        </div>

        {/* Department filter */}
        <select
          value={departmentFilter}
          onChange={(e) => onDepartmentChange(e.target.value)}
          style={{
            flex: 1,
            minWidth: 140,
            padding: "10px 12px",
            fontSize: 12,
            border: `1px solid ${COLORS.border}`,
            background: COLORS.white,
            color: COLORS.navy,
          }}
        >
          {DEPARTMENTS.map(dept => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>

        {/* Location filter */}
        <select
          value={locationFilter}
          onChange={(e) => onLocationChange(e.target.value)}
          style={{
            flex: 1,
            minWidth: 140,
            padding: "10px 12px",
            fontSize: 12,
            border: `1px solid ${COLORS.border}`,
            background: COLORS.white,
            color: COLORS.navy,
          }}
        >
          {LOCATIONS.map(loc => (
            <option key={loc} value={loc}>{loc}</option>
          ))}
        </select>

        {/* Risk filter */}
        <select
          value={riskFilter}
          onChange={(e) => onRiskChange(e.target.value as RiskFilter)}
          style={{
            flex: 1,
            minWidth: 120,
            padding: "10px 12px",
            fontSize: 12,
            border: `1px solid ${COLORS.border}`,
            background: COLORS.white,
            color: COLORS.navy,
          }}
        >
          <option value="all">All Risk Levels</option>
          <option value="low">Low Risk</option>
          <option value="moderate">Moderate Risk</option>
          <option value="high">High Risk</option>
          <option value="pending">Not Assessed</option>
        </select>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value as StatusFilter)}
          style={{
            flex: 1,
            minWidth: 120,
            padding: "10px 12px",
            fontSize: 12,
            border: `1px solid ${COLORS.border}`,
            background: COLORS.white,
            color: COLORS.navy,
          }}
        >
          <option value="all">All Status</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
        </select>

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            style={{
              padding: "10px 16px",
              fontSize: 12,
              background: "transparent",
              border: `1px solid ${COLORS.border}`,
              color: COLORS.muted,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Clear Filters
          </button>
        )}
      </div>
    </Card>
  );
}