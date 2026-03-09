"use client";

import React, { useState, useMemo } from "react";
import { Download, UserPlus } from "lucide-react";
import EmployerLayout from "@/components/dashboard/employer/EmployerLayout";
import {
  EmployeeStats,
  EmployeeFilters,
  EmployeeTable,
  type Employee,
  type SortBy,
  type SortOrder,
  type RiskFilter,
  type StatusFilter,
} from "@/components/dashboard/employer";
import ThemeToggle from "@/components/Themetoggle";

const COLORS = {
  blue: "#2563eb",
  border: "#e2e8f0",
  muted: "#64748b",
};

// ─── MOCK EMPLOYEE DATA ────────────────────────────────────────────────────
const MOCK_EMPLOYEES: Employee[] = [
  {
    id: 1,
    name: "Sarah Johnson",
    email: "sarah.j@company.com",
    department: "Engineering",
    position: "Senior Developer",
    riskLevel: "low",
    riskScore: 85,
    assessmentCompleted: true,
    completionDate: "2026-02-15",
    lastActive: "2026-03-07",
    avatar: null,
    location: "New York",
    employeeId: "EMP001",
    tenure: "3 years",
  },
  {
    id: 2,
    name: "Michael Chen",
    email: "m.chen@company.com",
    department: "Engineering",
    position: "Tech Lead",
    riskLevel: "moderate",
    riskScore: 62,
    assessmentCompleted: true,
    completionDate: "2026-02-10",
    lastActive: "2026-03-06",
    avatar: null,
    location: "San Francisco",
    employeeId: "EMP002",
    tenure: "5 years",
  },
  {
    id: 3,
    name: "Emily Rodriguez",
    email: "e.rodriguez@company.com",
    department: "Marketing",
    position: "Marketing Manager",
    riskLevel: "low",
    riskScore: 92,
    assessmentCompleted: true,
    completionDate: "2026-02-18",
    lastActive: "2026-03-07",
    avatar: null,
    location: "Chicago",
    employeeId: "EMP003",
    tenure: "2 years",
  },
  {
    id: 4,
    name: "David Kim",
    email: "d.kim@company.com",
    department: "Sales",
    position: "Account Executive",
    riskLevel: "high",
    riskScore: 45,
    assessmentCompleted: true,
    completionDate: "2026-02-05",
    lastActive: "2026-03-05",
    avatar: null,
    location: "Los Angeles",
    employeeId: "EMP004",
    tenure: "4 years",
  }
];

const ROWS_PER_PAGE = 10;

export default function EmployerEmployeesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All Departments");
  const [locationFilter, setLocationFilter] = useState("All Locations");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  
  // Sort state
  const [sortBy, setSortBy] = useState<SortBy>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Filter employees
  const filteredEmployees = useMemo(() => {
    return MOCK_EMPLOYEES.filter(emp => {
      // Search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matches = 
          emp.name.toLowerCase().includes(term) ||
          emp.email.toLowerCase().includes(term) ||
          emp.employeeId.toLowerCase().includes(term) ||
          emp.position.toLowerCase().includes(term);
        if (!matches) return false;
      }
      
      // Department filter
      if (departmentFilter !== "All Departments" && emp.department !== departmentFilter) {
        return false;
      }
      
      // Location filter
      if (locationFilter !== "All Locations" && emp.location !== locationFilter) {
        return false;
      }
      
      // Risk filter
      if (riskFilter === "low" && emp.riskLevel !== "low") return false;
      if (riskFilter === "moderate" && emp.riskLevel !== "moderate") return false;
      if (riskFilter === "high" && emp.riskLevel !== "high") return false;
      if (riskFilter === "pending" && emp.riskLevel !== null) return false;
      
      // Status filter
      if (statusFilter === "completed" && !emp.assessmentCompleted) return false;
      if (statusFilter === "pending" && emp.assessmentCompleted) return false;
      
      return true;
    });
  }, [searchTerm, departmentFilter, locationFilter, riskFilter, statusFilter]);

  // Sort employees
  const sortedEmployees = useMemo(() => {
    return [...filteredEmployees].sort((a, b) => {
      if (sortBy === "name") {
        return sortOrder === "asc" 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }
      if (sortBy === "risk") {
        const riskWeight = { high: 3, moderate: 2, low: 1 };
        const aWeight = a.riskLevel ? riskWeight[a.riskLevel] : 0;
        const bWeight = b.riskLevel ? riskWeight[b.riskLevel] : 0;
        return sortOrder === "asc" ? aWeight - bWeight : bWeight - aWeight;
      }
      if (sortBy === "date") {
        const aDate = a.completionDate ? new Date(a.completionDate).getTime() : 0;
        const bDate = b.completionDate ? new Date(b.completionDate).getTime() : 0;
        return sortOrder === "asc" ? aDate - bDate : bDate - aDate;
      }
      return 0;
    });
  }, [filteredEmployees, sortBy, sortOrder]);

  // Pagination
  const paginatedEmployees = useMemo(() => {
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    return sortedEmployees.slice(start, start + ROWS_PER_PAGE);
  }, [sortedEmployees, currentPage]);

  const totalPages = Math.ceil(sortedEmployees.length / ROWS_PER_PAGE);

  // Handlers
  const handleSort = (column: SortBy) => {
    if (sortBy === column) {
      setSortOrder(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setDepartmentFilter("All Departments");
    setLocationFilter("All Locations");
    setRiskFilter("all");
    setStatusFilter("all");
  };

  const handleView = (id: number) => {
    console.log("View employee:", id);
  };

  const handleMessage = (id: number) => {
    console.log("Message employee:", id);
  };

  const handleReport = (id: number) => {
    console.log("View report:", id);
  };

  const handleRemind = (id: number) => {
    console.log("Send reminder:", id);
  };

  const handleExport = () => {
    console.log("Export employee data");
  };

  const handleAddEmployee = () => {
    console.log("Add new employee");
  };

  const hasActiveFilters = useMemo(() => {
    return searchTerm !== "" ||
           departmentFilter !== "All Departments" ||
           locationFilter !== "All Locations" ||
           riskFilter !== "all" ||
           statusFilter !== "all";
  }, [searchTerm, departmentFilter, locationFilter, riskFilter, statusFilter]);

  return (
    <EmployerLayout>
      <div style={{ paddingBottom: 48 }}>
        
        {/* Page Header */}
        <div style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 28,
        }}>
          <div>
            <p style={{
              margin: 0,
              marginBottom: 5,
              fontSize: 10.5,
              fontWeight: 800,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: COLORS.blue,
            }}>
              Employee Management
            </p>
            <h1 style={{
              margin: 0,
              fontSize: "clamp(1.4rem, 3vw, 1.75rem)",
              fontWeight: 900,
              color: "#0f172a",
              letterSpacing: "-0.025em",
              lineHeight: 1.15,
            }}>
              Employee Roster
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: COLORS.muted }}>
              Manage and monitor workforce health status
            </p>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={handleExport}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
                background: "transparent",
                border: `1px solid ${COLORS.border}`,
                color: COLORS.muted,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <Download size={13} />
              Export
            </button>
            <button
              onClick={handleAddEmployee}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 20px",
                background: COLORS.blue,
                border: "none",
                color: "#fff",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <UserPlus size={13} />
              Add Employee
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <EmployeeStats employees={MOCK_EMPLOYEES} />

        {/* Filters */}
        <EmployeeFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          departmentFilter={departmentFilter}
          onDepartmentChange={setDepartmentFilter}
          locationFilter={locationFilter}
          onLocationChange={setLocationFilter}
          riskFilter={riskFilter}
          onRiskChange={setRiskFilter}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          onClearFilters={handleClearFilters}
          hasActiveFilters={hasActiveFilters}
        />

        {/* Results count */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          margin: "16px 0 12px",
        }}>
          <p style={{ fontSize: 12, color: COLORS.muted }}>
            Showing {sortedEmployees.length} of {MOCK_EMPLOYEES.length} employees
          </p>
        </div>

        {/* Employee Table */}
        <EmployeeTable
          employees={paginatedEmployees}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          onView={handleView}
          onMessage={handleMessage}
          onReport={handleReport}
          onRemind={handleRemind}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalResults={sortedEmployees.length}
        />

        <ThemeToggle />
      </div>
    </EmployerLayout>
  );
}