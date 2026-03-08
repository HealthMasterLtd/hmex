"use client";

import React, { useState } from "react";
import {
  BarChart3, Download, FileText, Calendar,
  TrendingUp, TrendingDown, Users, Activity,Filter, Mail, Share2,
  FileSpreadsheet, FilePieChart, Clock, DownloadCloud,
} from "lucide-react";
import EmployerLayout from "@/components/dashboard/employer/EmployerLayout";
import { Card } from "@/components/dashboard/Dashboardwidgets";
import ThemeToggle from "@/components/Themetoggle";

const COLORS = {
  navy: "#0f172a",
  white: "#ffffff",
  blue: "#2563eb",
  teal: "#0d9488",
  low: "#22c55e",
  moderate: "#f97316",
  high: "#ef4444",
  border: "#e2e8f0",
  muted: "#64748b",
  subtle: "#94a3b8",
  hover: "#f8fafc",
};

// ─── MOCK REPORT DATA ─────────────────────────────────────────────────────
const MOCK_REPORTS = [
  {
    id: 1,
    name: "Workforce Health Summary",
    description: "Complete overview of workforce health metrics and risk distribution",
    type: "PDF",
    date: "2026-03-07",
    size: "2.4 MB",
    downloads: 45,
    icon: FilePieChart,
  },
  {
    id: 2,
    name: "Risk Assessment Report",
    description: "Detailed analysis of risk levels by department and demographic",
    type: "Excel",
    date: "2026-03-06",
    size: "1.8 MB",
    downloads: 32,
    icon: FileSpreadsheet,
  },
  {
    id: 3,
    name: "Participation Analytics",
    description: "Employee engagement and assessment completion trends",
    type: "PDF",
    date: "2026-03-05",
    size: "3.1 MB",
    downloads: 28,
    icon: BarChart3,
  },
  {
    id: 4,
    name: "Wellness Program Impact",
    description: "ROI and effectiveness of current health initiatives",
    type: "Excel",
    date: "2026-03-04",
    size: "1.2 MB",
    downloads: 19,
    icon: Activity,
  },
  {
    id: 5,
    name: "Compliance & Privacy Report",
    description: "Data anonymization stats and compliance metrics",
    type: "PDF",
    date: "2026-03-03",
    size: "0.9 MB",
    downloads: 23,
    icon: FileText,
  },
  {
    id: 6,
    name: "Quarterly Health Trends",
    description: "Q1 2026 health metrics and year-over-year comparison",
    type: "Excel",
    date: "2026-03-01",
    size: "4.2 MB",
    downloads: 56,
    icon: TrendingUp,
  },
];

const MOCK_TRENDS = {
  participation: [68, 72, 75, 78, 82, 84],
  highRisk: [24, 26, 25, 28, 27, 31],
  lowRisk: [45, 44, 46, 43, 44, 42],
  months: ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"],
};

// ─── STAT CARD ────────────────────────────────────────────────────────────
function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  trend,
  trendValue,
  color = COLORS.blue 
}: { 
  icon: React.ElementType; 
  label: string; 
  value: string; 
  trend?: "up" | "down";
  trendValue?: string;
  color?: string;
}) {
  return (
    <div style={{
      padding: 20,
      background: COLORS.white,
      border: `1px solid ${COLORS.border}`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <div style={{
          width: 40,
          height: 40,
          background: `${color}10`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <Icon size={18} color={color} />
        </div>
        <p style={{ fontSize: 12, color: COLORS.muted, margin: 0 }}>{label}</p>
      </div>
      
      <p style={{ fontSize: 28, fontWeight: 900, color: COLORS.navy, margin: 0, lineHeight: 1 }}>
        {value}
      </p>
      
      {trend && trendValue && (
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: 4, 
          marginTop: 8,
          color: trend === "up" ? COLORS.low : COLORS.high,
        }}>
          {trend === "up" ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          <span style={{ fontSize: 11, fontWeight: 600 }}>{trendValue}</span>
        </div>
      )}
    </div>
  );
}

// ─── TREND CHART ──────────────────────────────────────────────────────────
function TrendChart() {
  const maxValue = Math.max(...MOCK_TRENDS.participation, ...MOCK_TRENDS.highRisk);
  
  return (
    <Card>
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 15, fontWeight: 800, color: COLORS.navy, margin: 0 }}>
          Health Trends (Last 6 Months)
        </p>
        <p style={{ fontSize: 12, color: COLORS.muted, margin: "4px 0 0" }}>
          Participation and risk level progression
        </p>
      </div>

      <div style={{ height: 200, display: "flex", alignItems: "flex-end", gap: 16 }}>
        {MOCK_TRENDS.months.map((month, i) => (
          <div key={month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            {/* Stacked bars */}
            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 2 }}>
              <div style={{
                height: (MOCK_TRENDS.participation[i] / maxValue) * 120,
                background: COLORS.blue,
                width: "100%",
              }} />
              <div style={{
                height: (MOCK_TRENDS.highRisk[i] / maxValue) * 80,
                background: COLORS.high,
                width: "100%",
              }} />
            </div>
            <span style={{ fontSize: 11, color: COLORS.muted }}>{month}</span>
          </div>
        ))}
      </div>

      <div style={{ 
        display: "flex", 
        gap: 16, 
        marginTop: 20,
        paddingTop: 16,
        borderTop: `1px solid ${COLORS.border}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 12, height: 12, background: COLORS.blue }} />
          <span style={{ fontSize: 11, color: COLORS.muted }}>Participation Rate</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 12, height: 12, background: COLORS.high }} />
          <span style={{ fontSize: 11, color: COLORS.muted }}>High Risk %</span>
        </div>
      </div>
    </Card>
  );
}

// ─── REPORT CARD ──────────────────────────────────────────────────────────
function ReportCard({ report }: { report: typeof MOCK_REPORTS[0] }) {
  const Icon = report.icon;
  
  return (
    <div style={{
      padding: 20,
      background: COLORS.white,
      border: `1px solid ${COLORS.border}`,
      transition: "all 0.2s ease",
    }}
    onMouseEnter={e => {
      e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.05)";
      e.currentTarget.style.borderColor = COLORS.blue;
    }}
    onMouseLeave={e => {
      e.currentTarget.style.boxShadow = "none";
      e.currentTarget.style.borderColor = COLORS.border;
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{
          width: 48,
          height: 48,
          background: `${COLORS.blue}10`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}>
          <Icon size={22} color={COLORS.blue} />
        </div>
        
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: COLORS.navy, margin: 0 }}>
                {report.name}
              </p>
              <p style={{ fontSize: 12, color: COLORS.muted, margin: "4px 0 8px" }}>
                {report.description}
              </p>
            </div>
            <span style={{
              padding: "4px 8px",
              background: `${COLORS.blue}10`,
              color: COLORS.blue,
              fontSize: 11,
              fontWeight: 700,
            }}>
              {report.type}
            </span>
          </div>
          
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: 16,
            marginBottom: 12,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Calendar size={12} color={COLORS.muted} />
              <span style={{ fontSize: 11, color: COLORS.muted }}>
                {new Date(report.date).toLocaleDateString()}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Download size={12} color={COLORS.muted} />
              <span style={{ fontSize: 11, color: COLORS.muted }}>{report.size}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Users size={12} color={COLORS.muted} />
              <span style={{ fontSize: 11, color: COLORS.muted }}>{report.downloads} downloads</span>
            </div>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button style={{
              padding: "8px 16px",
              background: COLORS.blue,
              border: "none",
              color: "#fff",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}>
              <Download size={13} />
              Download
            </button>
            <button style={{
              padding: "8px",
              background: "transparent",
              border: `1px solid ${COLORS.border}`,
              color: COLORS.muted,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <Mail size={13} />
            </button>
            <button style={{
              padding: "8px",
              background: "transparent",
              border: `1px solid ${COLORS.border}`,
              color: COLORS.muted,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <Share2 size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────
export default function EmployerReportsPage() {
  const [dateRange, setDateRange] = useState("last30");
  const [reportType, setReportType] = useState("all");
  
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
              Analytics
            </p>
            <h1 style={{
              margin: 0,
              fontSize: "clamp(1.4rem, 3vw, 1.75rem)",
              fontWeight: 900,
              color: COLORS.navy,
              letterSpacing: "-0.025em",
              lineHeight: 1.15,
            }}>
              Reports & Analytics
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: COLORS.muted }}>
              Download detailed reports and analyze workforce health trends
            </p>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              style={{
                padding: "8px 12px",
                fontSize: 12,
                border: `1px solid ${COLORS.border}`,
                background: COLORS.white,
                color: COLORS.navy,
              }}
            >
              <option value="last7">Last 7 days</option>
              <option value="last30">Last 30 days</option>
              <option value="last90">Last 90 days</option>
              <option value="year">This year</option>
              <option value="custom">Custom range</option>
            </select>
            
            <button style={{
              padding: "8px 16px",
              background: COLORS.blue,
              border: "none",
              color: "#fff",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}>
              <DownloadCloud size={13} />
              Generate Report
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 10,
          marginBottom: 24,
        }}>
          <StatCard 
            icon={Users}
            label="Total Reports"
            value="24"
            trend="up"
            trendValue="+8 this month"
          />
          <StatCard 
            icon={Download}
            label="Total Downloads"
            value="1,284"
            trend="up"
            trendValue="+23% vs last month"
            color={COLORS.low}
          />
          <StatCard 
            icon={Clock}
            label="Avg. Generation Time"
            value="2.4 min"
            color={COLORS.moderate}
          />
          <StatCard 
            icon={Activity}
            label="Data Points"
            value="12.5K"
            trend="up"
            trendValue="+1,200 new"
            color={COLORS.teal}
          />
        </div>

        {/* Trend Chart */}
        <div style={{ marginBottom: 24 }}>
          <TrendChart />
        </div>

        {/* Report Type Filter */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={() => setReportType("all")}
              style={{
                padding: "6px 12px",
                fontSize: 12,
                fontWeight: 600,
                background: reportType === "all" ? COLORS.blue : "transparent",
                color: reportType === "all" ? "#fff" : COLORS.muted,
                border: `1px solid ${reportType === "all" ? COLORS.blue : COLORS.border}`,
                cursor: "pointer",
              }}
            >
              All Reports
            </button>
            <button
              onClick={() => setReportType("pdf")}
              style={{
                padding: "6px 12px",
                fontSize: 12,
                fontWeight: 600,
                background: reportType === "pdf" ? COLORS.blue : "transparent",
                color: reportType === "pdf" ? "#fff" : COLORS.muted,
                border: `1px solid ${reportType === "pdf" ? COLORS.blue : COLORS.border}`,
                cursor: "pointer",
              }}
            >
              PDF
            </button>
            <button
              onClick={() => setReportType("excel")}
              style={{
                padding: "6px 12px",
                fontSize: 12,
                fontWeight: 600,
                background: reportType === "excel" ? COLORS.blue : "transparent",
                color: reportType === "excel" ? "#fff" : COLORS.muted,
                border: `1px solid ${reportType === "excel" ? COLORS.blue : COLORS.border}`,
                cursor: "pointer",
              }}
            >
              Excel
            </button>
          </div>

          <button style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "6px 12px",
            fontSize: 12,
            background: "transparent",
            border: `1px solid ${COLORS.border}`,
            color: COLORS.muted,
            cursor: "pointer",
          }}>
            <Filter size={12} />
            Filter
          </button>
        </div>

        {/* Reports Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(500px, 1fr))",
          gap: 10,
          marginBottom: 24,
        }}>
          {MOCK_REPORTS.map(report => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>

        <ThemeToggle />
      </div>
    </EmployerLayout>
  );
}