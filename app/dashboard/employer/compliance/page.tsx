"use client";

import React, { useState } from "react";
import {
  Shield, Lock, AlertTriangle,
  CheckCircle, RefreshCw,
 Database, Key, FileText,
  Globe, Clock,
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

// ─── MOCK COMPLIANCE DATA ─────────────────────────────────────────────────
const MOCK_COMPLIANCE = {
  hipaa: {
    status: "compliant",
    lastAudit: "2026-03-01",
    nextAudit: "2026-06-01",
    score: 98,
  },
  gdpr: {
    status: "compliant",
    lastAudit: "2026-02-15",
    nextAudit: "2026-05-15",
    score: 96,
  },
  dataAnonymization: {
    totalRecords: 2482,
    anonymized: 2482,
    percentage: 100,
    lastProcessed: "2026-03-07",
  },
  consentManagement: {
    totalEmployees: 2482,
    consentGiven: 2345,
    consentWithdrawn: 137,
    pending: 0,
  },
  dataRetention: {
    policies: 12,
    activeRetention: "7 years",
    lastReview: "2026-02-01",
  },
};

// ─── STAT CARD ────────────────────────────────────────────────────────────
function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  subValue,
  status = "neutral",
}: { 
  icon: React.ElementType; 
  label: string; 
  value: string; 
  subValue?: string;
  status?: "success" | "warning" | "danger" | "neutral";
}) {
  const statusColors = {
    success: COLORS.low,
    warning: COLORS.moderate,
    danger: COLORS.high,
    neutral: COLORS.blue,
  };
  
  const color = statusColors[status];
  
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
      
      {subValue && (
        <p style={{ fontSize: 11, color: COLORS.muted, margin: "4px 0 0" }}>{subValue}</p>
      )}
    </div>
  );
}

// ─── COMPLIANCE BADGE ─────────────────────────────────────────────────────
function ComplianceBadge({ status }: { status: string }) {
  const config = {
    compliant: { icon: CheckCircle, color: COLORS.low, bg: `${COLORS.low}10`, label: "Compliant" },
    pending: { icon: Clock, color: COLORS.moderate, bg: `${COLORS.moderate}10`, label: "Pending Review" },
    warning: { icon: AlertTriangle, color: COLORS.high, bg: `${COLORS.high}10`, label: "Action Required" },
    approved: { icon: CheckCircle, color: COLORS.low, bg: `${COLORS.low}10`, label: "Approved" },
    completed: { icon: CheckCircle, color: COLORS.low, bg: `${COLORS.low}10`, label: "Completed" },
  };
  
  const c = config[status as keyof typeof config] || config.compliant;
  const Icon = c.icon;
  
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      padding: "4px 8px",
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

// ─── MAIN PAGE ────────────────────────────────────────────────────────────
export default function EmployerCompliancePage() {
  const [activeTab, setActiveTab] = useState("overview");
  
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
              Data Protection
            </p>
            <h1 style={{
              margin: 0,
              fontSize: "clamp(1.4rem, 3vw, 1.75rem)",
              fontWeight: 900,
              color: COLORS.navy,
              letterSpacing: "-0.025em",
              lineHeight: 1.15,
            }}>
              Privacy & Compliance
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: COLORS.muted }}>
              Ensure data privacy and regulatory compliance
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button style={{
              padding: "8px 16px",
              background: "transparent",
              border: `1px solid ${COLORS.border}`,
              color: COLORS.muted,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}>
              <RefreshCw size={13} />
              Run Audit
            </button>
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
              <FileText size={13} />
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
            icon={Shield}
            label="HIPAA Compliance"
            value="98%"
            subValue={`Last audit: ${MOCK_COMPLIANCE.hipaa.lastAudit}`}
            status="success"
          />
          <StatCard 
            icon={Globe}
            label="GDPR Compliance"
            value="96%"
            subValue={`Next audit: ${MOCK_COMPLIANCE.gdpr.nextAudit}`}
            status="success"
          />
          <StatCard 
            icon={Database}
            label="Anonymized Records"
            value="100%"
            subValue={`${MOCK_COMPLIANCE.dataAnonymization.totalRecords} total records`}
            status="success"
          />
          <StatCard 
            icon={Key}
            label="Consent Rate"
            value="94.5%"
            subValue={`${MOCK_COMPLIANCE.consentManagement.consentGiven} employees`}
            status="success"
          />
        </div>

        {/* Tabs */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          marginBottom: 20,
          borderBottom: `1px solid ${COLORS.border}`,
        }}>
          {["overview", "data privacy", "consent management", "audit logs", "policies"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "12px 20px",
                fontSize: 12,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                background: "none",
                border: "none",
                borderBottom: activeTab === tab ? `2px solid ${COLORS.blue}` : "none",
                color: activeTab === tab ? COLORS.blue : COLORS.muted,
                cursor: "pointer",
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Active Tab Content */}
        {activeTab === "overview" && (
          <div style={{ display: "grid", gap: 20 }}>
            {/* Compliance Status Cards */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: 10,
            }}>
              <Card>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <div style={{
                    width: 44,
                    height: 44,
                    background: `${COLORS.low}10`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    <Shield size={20} color={COLORS.low} />
                  </div>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: COLORS.navy, margin: 0 }}>
                      HIPAA Compliance
                    </p>
                    <p style={{ fontSize: 11, color: COLORS.muted, margin: "2px 0 0" }}>
                      Health Insurance Portability and Accountability Act
                    </p>
                  </div>
                </div>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <p style={{ fontSize: 11, color: COLORS.muted, margin: 0 }}>Status</p>
                    <ComplianceBadge status="compliant" />
                  </div>
                  <div>
                    <p style={{ fontSize: 11, color: COLORS.muted, margin: 0 }}>Score</p>
                    <p style={{ fontSize: 20, fontWeight: 900, color: COLORS.low, margin: 0 }}>
                      {MOCK_COMPLIANCE.hipaa.score}%
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: 11, color: COLORS.muted, margin: 0 }}>Last Audit</p>
                    <p style={{ fontSize: 12, color: COLORS.navy, margin: 0 }}>
                      {MOCK_COMPLIANCE.hipaa.lastAudit}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: 11, color: COLORS.muted, margin: 0 }}>Next Audit</p>
                    <p style={{ fontSize: 12, color: COLORS.navy, margin: 0 }}>
                      {MOCK_COMPLIANCE.hipaa.nextAudit}
                    </p>
                  </div>
                </div>
              </Card>

              <Card>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <div style={{
                    width: 44,
                    height: 44,
                    background: `${COLORS.low}10`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    <Globe size={20} color={COLORS.low} />
                  </div>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: COLORS.navy, margin: 0 }}>
                      GDPR Compliance
                    </p>
                    <p style={{ fontSize: 11, color: COLORS.muted, margin: "2px 0 0" }}>
                      General Data Protection Regulation
                    </p>
                  </div>
                </div>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <p style={{ fontSize: 11, color: COLORS.muted, margin: 0 }}>Status</p>
                    <ComplianceBadge status="compliant" />
                  </div>
                  <div>
                    <p style={{ fontSize: 11, color: COLORS.muted, margin: 0 }}>Score</p>
                    <p style={{ fontSize: 20, fontWeight: 900, color: COLORS.low, margin: 0 }}>
                      {MOCK_COMPLIANCE.gdpr.score}%
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: 11, color: COLORS.muted, margin: 0 }}>Last Audit</p>
                    <p style={{ fontSize: 12, color: COLORS.navy, margin: 0 }}>
                      {MOCK_COMPLIANCE.gdpr.lastAudit}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: 11, color: COLORS.muted, margin: 0 }}>Next Audit</p>
                    <p style={{ fontSize: 12, color: COLORS.navy, margin: 0 }}>
                      {MOCK_COMPLIANCE.gdpr.nextAudit}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Data Anonymization */}
            <Card>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <div style={{
                  width: 44,
                  height: 44,
                  background: `${COLORS.teal}10`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <Lock size={20} color={COLORS.teal} />
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: COLORS.navy, margin: 0 }}>
                    Data Anonymization
                  </p>
                  <p style={{ fontSize: 11, color: COLORS.muted, margin: "2px 0 0" }}>
                    All employee data is anonymized before aggregation
                  </p>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 20 }}>
                <div>
                  <p style={{ fontSize: 11, color: COLORS.muted, margin: 0 }}>Total Records</p>
                  <p style={{ fontSize: 24, fontWeight: 900, color: COLORS.navy, margin: 0 }}>
                    {MOCK_COMPLIANCE.dataAnonymization.totalRecords}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: 11, color: COLORS.muted, margin: 0 }}>Anonymized</p>
                  <p style={{ fontSize: 24, fontWeight: 900, color: COLORS.low, margin: 0 }}>
                    {MOCK_COMPLIANCE.dataAnonymization.anonymized}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: 11, color: COLORS.muted, margin: 0 }}>Percentage</p>
                  <p style={{ fontSize: 24, fontWeight: 900, color: COLORS.low, margin: 0 }}>
                    {MOCK_COMPLIANCE.dataAnonymization.percentage}%
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: 11, color: COLORS.muted, margin: 0 }}>Last Processed</p>
                  <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.navy, margin: 0 }}>
                    {MOCK_COMPLIANCE.dataAnonymization.lastProcessed}
                  </p>
                </div>
              </div>
            </Card>

            {/* Privacy First Message */}
            <div style={{
              padding: 24,
              background: `${COLORS.blue}05`,
              border: `1px solid ${COLORS.blue}20`,
              display: "flex",
              alignItems: "center",
              gap: 20,
            }}>
              <Shield size={40} color={COLORS.blue} />
              <div>
                <p style={{ fontSize: 16, fontWeight: 800, color: COLORS.navy, margin: 0 }}>
                  Privacy-First Philosophy
                </p>
                <p style={{ fontSize: 13, color: COLORS.muted, margin: "8px 0 0", maxWidth: 600 }}>
                  Individual health data is never shared with employers. All workforce insights are 
                  anonymized and aggregated to protect employee privacy while providing leadership with 
                  actionable data to support a healthy workforce.
                </p>
              </div>
            </div>
          </div>
        )}

        <ThemeToggle />
      </div>
    </EmployerLayout>
  );
}