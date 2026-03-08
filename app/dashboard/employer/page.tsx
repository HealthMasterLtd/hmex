"use client";
/**
 * /app/dashboard/employer/page.tsx
 * 
 * Employer Dashboard Overview
 * Uses same components as user dashboard but with employer data
 * All styling matches the Figma design colors
 */

import React, { useState } from "react";
import {
  TrendingUp, Users, ClipboardCheck,
  Activity, Download,
  Shield, ExternalLink, ChevronRight,
  Heart, Droplets, 
} from "lucide-react";
import EmployerLayout from "@/components/dashboard/employer/EmployerLayout";
import { useTheme } from "@/contexts/ThemeContext";
import { StatCard, SectionHeader, Card, RiskBadge, DashButton } from "@/components/dashboard/Dashboardwidgets";
import ThemeToggle from "@/components/Themetoggle";

// MOCK DATA 
const MOCK_WORKFORCE_METRICS = {
  totalEmployees: 2482,
  employeeChange: "+12% from last month",
  assessmentCompletion: 84.2,
  completionChange: "+4.5% participation rate",
  avgRiskLevel: "Moderate" as const,
  riskTrend: "Stable across population",
  participationTrend: "+18% last 30 days",
  avgCompletionTime: "6.5 min",
  followUpRetakes: "22%",
};

const MOCK_RISK_DISTRIBUTION = {
  hypertension: {
    low: 65,
    moderate: 15,
    high: 20, // derived from the remaining percentage
  },
  diabetes: {
    low: 72,
    moderate: 15,
    high: 13, // derived from the remaining percentage
  },
};

const MOCK_RISK_DRIVERS = [
  { factor: "Physical Inactivity", percentage: 42, color: "#ef4444" },
  { factor: "Poor Diet Patterns", percentage: 38, color: "#f97316" },
  { factor: "High BMI Index", percentage: 29, color: "#eab308" },
  { factor: "Family History", percentage: 15, color: "#22c55e" },
];

const MOCK_RISK_TRENDS = [
  { month: "Jan", value: 24 },
  { month: "Feb", value: 26 },
  { month: "Mar", value: 25 },
  { month: "Apr", value: 28 },
  { month: "May", value: 27 },
  { month: "Jun", value: 31 },
];

const MOCK_RECOMMENDATIONS = [
  {
    id: 1,
    title: "Quarterly Blood Pressure Screening",
    description: "Organize an on-site screening event to capture mid-year metrics.",
    priority: "high" as const,
    category: "screening" as const,
  },
  {
    id: 2,
    title: "Promote Healthy Meal Options",
    description: "Collaborate with office catering to label heart-healthy menu items.",
    priority: "medium" as const,
    category: "nutrition" as const,
  },
  {
    id: 3,
    title: "Workplace Fitness Initiative",
    description: "Introduce a 10,000 steps-a-day challenge with team incentives.",
    priority: "high" as const,
    category: "activity" as const,
  },
  {
    id: 4,
    title: "Preventive Health Education",
    description: "Share monthly newsletters on managing family medical history risks.",
    priority: "low" as const,
    category: "education" as const,
  },
];

// ─── PROGRESS BAR COMPONENT ─────────────────────────────────────────────────

function ProgressBar({ 
  label, 
  value, 
  color,
  showValue = true,
}: { 
  label: string; 
  value: number; 
  color: string;
  showValue?: boolean;
}) {
  const { isDark, surface } = useTheme();
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        marginBottom: 4,
        fontSize: 11,
      }}>
        <span style={{ color: surface.muted }}>{label}</span>
        {showValue && <span style={{ color: surface.text, fontWeight: 700 }}>{value}%</span>}
      </div>
      <div style={{
        height: 8,
        background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)",
        overflow: "hidden",
      }}>
        <div style={{
          width: `${value}%`,
          height: "100%",
          background: color,
          transition: "width 0.5s ease",
        }} />
      </div>
    </div>
  );
}

//  RISK DISTRIBUTION CARD 
function RiskDistributionCard({ 
  title, 
  data,
  icon: Icon,
}: { 
  title: string; 
  data: { low: number; moderate: number; high: number };
  icon: React.ElementType;
}) {
  const { isDark, surface, accentColor } = useTheme();
  return (
    <Card>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{
          width: 32,
          height: 32,
          background: isDark ? "rgba(15,187,125,0.1)" : "rgba(15,187,125,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <Icon size={15} color={accentColor} />
        </div>
        <p style={{ fontSize: 13, fontWeight: 700, color: surface.text, margin: 0 }}>
          {title}
        </p>
      </div>
      
      <ProgressBar label="Low Risk" value={data.low} color="#22c55e" />
      <ProgressBar label="Moderate Risk" value={data.moderate} color="#f97316" />
      <ProgressBar label="High Risk" value={data.high} color="#ef4444" />
    </Card>
  );
}

// ─── TREND CHART (simplified bar visualization) ─────────────────────────────

function RiskTrendChart({ data }: { data: typeof MOCK_RISK_TRENDS }) {
  const { surface, accentColor } = useTheme();
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <Card>
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: surface.text, margin: 0 }}>
          Risk Trends (Last 6 Months)
        </p>
        <p style={{ fontSize: 11, color: surface.muted, margin: "2px 0 0" }}>
          Historical progression of high-risk population percentages
        </p>
      </div>
      
      <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 120 }}>
        {data.map((item, i) => {
          const height = (item.value / maxValue) * 100;
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div style={{
                width: "100%",
                height: `${height}%`,
                background: `linear-gradient(180deg, ${accentColor}, ${accentColor}80)`,
                minHeight: 20,
              }} />
              <span style={{ fontSize: 10, color: surface.muted }}>{item.month}</span>
            </div>
          );
        })}
      </div>
      
      <div style={{
        marginTop: 16,
        paddingTop: 12,
        borderTop: `1px solid ${surface.border}`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <span style={{ fontSize: 11, color: surface.muted }}>↑ +18% last 30 days</span>
        <RiskBadge level="moderate" />
      </div>
    </Card>
  );
}

// ─── RECOMMENDATION ITEM ────────────────────────────────────────────────────

function RecommendationItem({ 
  item,
  index,
}: { 
  item: typeof MOCK_RECOMMENDATIONS[0];
  index: number;
}) {
  const { surface } = useTheme();
  
  const priorityColors = {
    high: { bg: "rgba(239,68,68,0.1)", color: "#ef4444" },
    medium: { bg: "rgba(245,158,11,0.1)", color: "#f59e0b" },
    low: { bg: "rgba(34,197,94,0.1)", color: "#22c55e" },
  };
  
  const priorityColor = priorityColors[item.priority];
  
  return (
    <div style={{
      padding: "12px 0",
      borderBottom: index < MOCK_RECOMMENDATIONS.length - 1 ? `1px solid ${surface.border}` : "none",
    }}>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{
          width: 24,
          height: 24,
          background: priorityColor.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          fontWeight: 800,
          color: priorityColor.color,
          flexShrink: 0,
        }}>
          {index + 1}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 12.5, fontWeight: 700, color: surface.text, margin: 0 }}>
            {item.title}
          </p>
          <p style={{ fontSize: 11, color: surface.muted, margin: "4px 0 0", lineHeight: 1.6 }}>
            {item.description}
          </p>
        </div>
      </div>
    </div>
  );
}

//  MAIN PAGE 
export default function EmployerDashboardPage() {
  const { isDark, surface, accentColor } = useTheme();
  const [timeframe, setTimeframe] = useState<"month" | "quarter" | "year">("month");

  return (
    <EmployerLayout>
      <div style={{ paddingBottom: 48 }}>
        
        {/*  Page Header  */}
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
              color: accentColor,
            }}>
              Employer Dashboard
            </p>
            <h1 style={{
              margin: 0,
              fontSize: "clamp(1.4rem, 3vw, 1.75rem)",
              fontWeight: 900,
              color: surface.text,
              letterSpacing: "-0.025em",
              lineHeight: 1.15,
            }}>
              Workforce Health Overview
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: surface.subtle }}>
              Aggregated health insights to support preventive care and employee wellbeing
            </p>
          </div>

          {/* Timeframe selector */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {(["month", "quarter", "year"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                style={{
                  padding: "6px 12px",
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: "capitalize",
                  background: timeframe === t ? accentColor : "transparent",
                  color: timeframe === t ? "#fff" : surface.muted,
                  border: `1px solid ${timeframe === t ? accentColor : surface.border}`,
                  cursor: "pointer",
                }}
              >
                {t}
              </button>
            ))}
            <button style={{
              padding: "6px 12px",
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 11,
              background: "transparent",
              border: `1px solid ${surface.border}`,
              color: surface.muted,
              cursor: "pointer",
              marginLeft: 4,
            }}>
              <Download size={11} />
              Export
            </button>
          </div>
        </div>

        {/* Key Metrics Row  */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 10,
          marginBottom: 20,
        }}>
          <StatCard
            label="Total Employees Enrolled"
            value={MOCK_WORKFORCE_METRICS.totalEmployees.toLocaleString()}
            sub={MOCK_WORKFORCE_METRICS.employeeChange}
            icon={<Users size={14} />}
            trend="up"
            trendLabel={MOCK_WORKFORCE_METRICS.employeeChange}
          />
          
          <StatCard
            label="Assessment Completion"
            value={`${MOCK_WORKFORCE_METRICS.assessmentCompletion}%`}
            sub={MOCK_WORKFORCE_METRICS.completionChange}
            icon={<ClipboardCheck size={14} />}
            trend="up"
            trendLabel={MOCK_WORKFORCE_METRICS.completionChange}
          />
          
          <StatCard
            label="Average Risk Level"
            value={MOCK_WORKFORCE_METRICS.avgRiskLevel}
            sub={MOCK_WORKFORCE_METRICS.riskTrend}
            icon={<Activity size={14} />}
            trend="flat"
            trendLabel="Stable"
          />
          
          <StatCard
            label="Participation Trend"
            value="Upward"
            sub={MOCK_WORKFORCE_METRICS.participationTrend}
            icon={<TrendingUp size={14} />}
            trend="up"
            trendLabel={MOCK_WORKFORCE_METRICS.participationTrend}
          />
        </div>

        {/* Risk Distribution Section  */}
        <SectionHeader 
          title="Risk Distribution Snapshot"
          subtitle="Condition-specific population categorization"
          action={
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 11, color: surface.muted }}>
                <span style={{ color: "#22c55e" }}>●</span> Low · <span style={{ color: "#f97316" }}>●</span> Moderate · <span style={{ color: "#ef4444" }}>●</span> High
              </span>
            </div>
          }
        />

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 10,
          marginBottom: 20,
        }}>
          <RiskDistributionCard 
            title="Hypertension Risk" 
            data={MOCK_RISK_DISTRIBUTION.hypertension}
            icon={Droplets}
          />
          <RiskDistributionCard 
            title="Diabetes Risk" 
            data={MOCK_RISK_DISTRIBUTION.diabetes}
            icon={Heart}
          />
          
          {/* Top Health Risk Drivers */}
          <Card>
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: surface.text, margin: 0 }}>
                Top Health Risk Drivers
              </p>
              <p style={{ fontSize: 11, color: surface.muted, margin: "2px 0 0" }}>
                Leading behavioral impact factors
              </p>
            </div>
            
            {MOCK_RISK_DRIVERS.map((driver) => (
              <ProgressBar 
                key={driver.factor}
                label={driver.factor}
                value={driver.percentage}
                color={driver.color}
              />
            ))}
            
            <div style={{
              marginTop: 12,
              padding: "10px 12px",
              background: isDark ? "rgba(15,187,125,0.1)" : "rgba(15,187,125,0.05)",
              border: `1px solid ${isDark ? "rgba(15,187,125,0.2)" : "rgba(15,187,125,0.1)"}`,
            }}>
              <p style={{ fontSize: 11, margin: 0, color: accentColor, lineHeight: 1.6 }}>
                <strong>Primary Insight:</strong> Physical inactivity appears to be the largest contributing factor in your workforce. Focused fitness initiatives are recommended.
              </p>
            </div>
          </Card>
        </div>

        {/* ── Second Row: Risk Trends + Participation ───────────────────── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 10,
          marginBottom: 20,
        }}>
          <RiskTrendChart data={MOCK_RISK_TRENDS} />
          
          <Card>
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: surface.text, margin: 0 }}>
                Participation & Engagement
              </p>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: surface.muted }}>Assessment Completed</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: accentColor }}>
                    {MOCK_WORKFORCE_METRICS.assessmentCompletion}%
                  </span>
                </div>
                <div style={{ height: 8, background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)" }}>
                  <div style={{ width: `${MOCK_WORKFORCE_METRICS.assessmentCompletion}%`, height: "100%", background: accentColor }} />
                </div>
              </div>
              
              <div style={{ display: "flex", gap: 20 }}>
                <div>
                  <p style={{ fontSize: 20, fontWeight: 900, color: surface.text, margin: 0 }}>
                    {MOCK_WORKFORCE_METRICS.avgCompletionTime}
                  </p>
                  <p style={{ fontSize: 10, color: surface.muted, margin: 0 }}>Avg. Completion Time</p>
                </div>
                <div>
                  <p style={{ fontSize: 20, fontWeight: 900, color: surface.text, margin: 0 }}>
                    {MOCK_WORKFORCE_METRICS.followUpRetakes}
                  </p>
                  <p style={{ fontSize: 10, color: surface.muted, margin: 0 }}>Follow-up Retakes</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* ── Recommended Wellness Actions ──────────────────────────────── */}
        <SectionHeader 
          title="Recommended Wellness Actions"
          subtitle="Based on workforce health insights"
          action={
            <DashButton size="sm" variant="ghost" icon={<ExternalLink size={11} />}>
              View all
            </DashButton>
          }
        />

        <Card>
          {MOCK_RECOMMENDATIONS.map((item, index) => (
            <RecommendationItem key={item.id} item={item} index={index} />
          ))}
          
          <div style={{
            marginTop: 16,
            paddingTop: 16,
            borderTop: `1px solid ${surface.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Shield size={12} color={surface.muted} />
              <span style={{ fontSize: 10, color: surface.muted }}>
                All participant data is encrypted and anonymized
              </span>
            </div>
            <button style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 11,
              fontWeight: 600,
              color: accentColor,
              background: "none",
              border: "none",
              cursor: "pointer",
            }}>
              View Privacy Policy
              <ChevronRight size={10} />
            </button>
          </div>
        </Card>

        {/* ── Compliance & Privacy Footer ───────────────────────────────── */}
        <div style={{
          marginTop: 24,
          padding: "16px 20px",
          background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
          border: `1px solid ${surface.border}`,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Shield size={16} color={accentColor} />
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: surface.text, margin: 0 }}>
                HMEX Compliance & Privacy
              </p>
              <p style={{ fontSize: 10, color: surface.muted, margin: "2px 0 0" }}>
                Ensuring full data privacy. All workforce insights are anonymized and comply with HIPAA & GDPR standards.
              </p>
            </div>
          </div>
          
          <div style={{ display: "flex", gap: 16 }}>
            <a href="#" style={{ fontSize: 11, color: surface.muted, textDecoration: "none" }}>Support Portal</a>
            <a href="#" style={{ fontSize: 11, color: surface.muted, textDecoration: "none" }}>Legal Terms</a>
            <span style={{ fontSize: 11, color: surface.subtle }}>© 2026 HMEX Systems Inc.</span>
          </div>
        </div>

        <ThemeToggle />
      </div>
    </EmployerLayout>
  );
}