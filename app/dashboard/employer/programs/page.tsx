"use client";

import React, { useState } from "react";
import {
  Activity, Users, Calendar,
  Plus, Edit2, Trash2, Eye, Play, Pause,
  Target, Award, Heart, Droplets, Apple,
  Footprints, Leaf,
} from "lucide-react";
import EmployerLayout from "@/components/dashboard/employer/EmployerLayout";
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

// ─── MOCK PROGRAMS DATA ───────────────────────────────────────────────────
const MOCK_PROGRAMS = [
  {
    id: 1,
    name: "Quarterly Blood Pressure Screening",
    description: "On-site screening event to capture mid-year metrics",
    category: "screening",
    icon: Droplets,
    status: "active",
    startDate: "2026-03-15",
    endDate: "2026-03-30",
    participants: 156,
    target: 300,
    completionRate: 52,
    color: COLORS.blue,
  },
  {
    id: 2,
    name: "10,000 Steps Challenge",
    description: "Workplace fitness initiative with team incentives",
    category: "fitness",
    icon: Footprints,
    status: "active",
    startDate: "2026-03-01",
    endDate: "2026-04-15",
    participants: 234,
    target: 400,
    completionRate: 58,
    color: COLORS.low,
  },
  {
    id: 3,
    name: "Healthy Meal Options Program",
    description: "Collaboration with catering for heart-healthy menu items",
    category: "nutrition",
    icon: Apple,
    status: "active",
    startDate: "2026-02-01",
    endDate: "2026-12-31",
    participants: 189,
    target: 500,
    completionRate: 38,
    color: COLORS.teal,
  },
  {
    id: 4,
    name: "Preventive Health Education",
    description: "Monthly newsletters on managing family medical history",
    category: "education",
    icon: Leaf,
    status: "active",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    participants: 412,
    target: 600,
    completionRate: 69,
    color: COLORS.moderate,
  },
  {
    id: 5,
    name: "Stress Management Workshop",
    description: "Mindfulness and stress reduction techniques",
    category: "wellness",
    icon: Activity,
    status: "upcoming",
    startDate: "2026-04-01",
    endDate: "2026-04-30",
    participants: 0,
    target: 200,
    completionRate: 0,
    color: "#8b5cf6",
  },
  {
    id: 6,
    name: "Diabetes Prevention Program",
    description: "Lifestyle intervention for at-risk employees",
    category: "medical",
    icon: Heart,
    status: "draft",
    startDate: "2026-05-01",
    endDate: "2026-08-31",
    participants: 0,
    target: 150,
    completionRate: 0,
    color: COLORS.high,
  },
];

// ─── STAT CARD ────────────────────────────────────────────────────────────
function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  subValue,
  color = COLORS.blue 
}: { 
  icon: React.ElementType; 
  label: string; 
  value: string; 
  subValue?: string;
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
      
      {subValue && (
        <p style={{ fontSize: 11, color: COLORS.muted, margin: "4px 0 0" }}>{subValue}</p>
      )}
    </div>
  );
}

// ─── PROGRAM CARD ─────────────────────────────────────────────────────────
function ProgramCard({ program }: { program: typeof MOCK_PROGRAMS[0] }) {
  const Icon = program.icon;
  
  const statusColors = {
    active: { bg: `${COLORS.low}10`, color: COLORS.low, label: "Active" },
    upcoming: { bg: `${COLORS.moderate}10`, color: COLORS.moderate, label: "Upcoming" },
    draft: { bg: `${COLORS.muted}10`, color: COLORS.muted, label: "Draft" },
  };
  
  const status = statusColors[program.status as keyof typeof statusColors];
  
  return (
    <div style={{
      padding: 20,
      background: COLORS.white,
      border: `1px solid ${COLORS.border}`,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{
          width: 48,
          height: 48,
          background: `${program.color}10`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}>
          <Icon size={22} color={program.color} />
        </div>
        
        <div style={{ flex: 1 }}>
          <div style={{ 
            display: "flex", 
            alignItems: "flex-start", 
            justifyContent: "space-between",
            marginBottom: 8,
          }}>
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: COLORS.navy, margin: 0 }}>
                {program.name}
              </p>
              <p style={{ fontSize: 12, color: COLORS.muted, margin: "4px 0 0" }}>
                {program.description}
              </p>
            </div>
            <span style={{
              padding: "4px 8px",
              background: status.bg,
              color: status.color,
              fontSize: 11,
              fontWeight: 700,
            }}>
              {status.label}
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
                {new Date(program.startDate).toLocaleDateString()} - {new Date(program.endDate).toLocaleDateString()}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Users size={12} color={COLORS.muted} />
              <span style={{ fontSize: 11, color: COLORS.muted }}>
                {program.participants}/{program.target} enrolled
              </span>
            </div>
          </div>
          
          {/* Progress bar */}
          {program.status === "active" && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: COLORS.muted }}>Participation</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: program.color }}>
                  {program.completionRate}%
                </span>
              </div>
              <div style={{
                height: 6,
                background: "#f1f5f9",
                overflow: "hidden",
              }}>
                <div style={{
                  width: `${program.completionRate}%`,
                  height: "100%",
                  background: program.color,
                }} />
              </div>
            </div>
          )}
          
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button style={{
              padding: "6px 12px",
              background: COLORS.blue,
              border: "none",
              color: "#fff",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}>
              <Eye size={12} />
              View
            </button>
            <button style={{
              padding: "6px 12px",
              background: "transparent",
              border: `1px solid ${COLORS.border}`,
              color: COLORS.muted,
              fontSize: 11,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}>
              <Edit2 size={12} />
              Edit
            </button>
            {program.status === "active" ? (
              <button style={{
                padding: "6px 12px",
                background: "transparent",
                border: `1px solid ${COLORS.border}`,
                color: COLORS.muted,
                fontSize: 11,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}>
                <Pause size={12} />
                Pause
              </button>
            ) : (
              <button style={{
                padding: "6px 12px",
                background: "transparent",
                border: `1px solid ${COLORS.border}`,
                color: COLORS.muted,
                fontSize: 11,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}>
                <Play size={12} />
                {program.status === "upcoming" ? "Start" : "Activate"}
              </button>
            )}
            <button style={{
              padding: "6px 12px",
              background: "transparent",
              border: `1px solid ${COLORS.border}`,
              color: COLORS.muted,
              fontSize: 11,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}>
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────
export default function EmployerProgramsPage() {
  const [filter, setFilter] = useState("all");
  
  const activeCount = MOCK_PROGRAMS.filter(p => p.status === "active").length;
  const totalParticipants = MOCK_PROGRAMS.reduce((acc, p) => acc + p.participants, 0);
  const avgCompletion = Math.round(
    MOCK_PROGRAMS.filter(p => p.status === "active")
      .reduce((acc, p) => acc + p.completionRate, 0) / activeCount
  );
  
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
              Wellness Initiatives
            </p>
            <h1 style={{
              margin: 0,
              fontSize: "clamp(1.4rem, 3vw, 1.75rem)",
              fontWeight: 900,
              color: COLORS.navy,
              letterSpacing: "-0.025em",
              lineHeight: 1.15,
            }}>
              Health Programs
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: COLORS.muted }}>
              Manage wellness initiatives and track employee participation
            </p>
          </div>

          <button style={{
            padding: "10px 20px",
            background: COLORS.blue,
            border: "none",
            color: "#fff",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}>
            <Plus size={16} />
            Create Program
          </button>
        </div>

        {/* Stats Row */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 10,
          marginBottom: 24,
        }}>
          <StatCard 
            icon={Activity}
            label="Active Programs"
            value={activeCount.toString()}
            subValue={`${MOCK_PROGRAMS.length - activeCount} inactive`}
            color={COLORS.blue}
          />
          <StatCard 
            icon={Users}
            label="Total Participants"
            value={totalParticipants.toLocaleString()}
            subValue="Across all programs"
            color={COLORS.low}
          />
          <StatCard 
            icon={Target}
            label="Avg. Completion"
            value={`${avgCompletion}%`}
            subValue="For active programs"
            color={COLORS.moderate}
          />
          <StatCard 
            icon={Award}
            label="Programs Impact"
            value="84%"
            subValue="Positive feedback rate"
            color={COLORS.teal}
          />
        </div>

        {/* Filters */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 16,
        }}>
          <button
            onClick={() => setFilter("all")}
            style={{
              padding: "6px 12px",
              fontSize: 12,
              fontWeight: 600,
              background: filter === "all" ? COLORS.blue : "transparent",
              color: filter === "all" ? "#fff" : COLORS.muted,
              border: `1px solid ${filter === "all" ? COLORS.blue : COLORS.border}`,
              cursor: "pointer",
            }}
          >
            All Programs
          </button>
          <button
            onClick={() => setFilter("active")}
            style={{
              padding: "6px 12px",
              fontSize: 12,
              fontWeight: 600,
              background: filter === "active" ? COLORS.blue : "transparent",
              color: filter === "active" ? "#fff" : COLORS.muted,
              border: `1px solid ${filter === "active" ? COLORS.blue : COLORS.border}`,
              cursor: "pointer",
            }}
          >
            Active
          </button>
          <button
            onClick={() => setFilter("upcoming")}
            style={{
              padding: "6px 12px",
              fontSize: 12,
              fontWeight: 600,
              background: filter === "upcoming" ? COLORS.blue : "transparent",
              color: filter === "upcoming" ? "#fff" : COLORS.muted,
              border: `1px solid ${filter === "upcoming" ? COLORS.blue : COLORS.border}`,
              cursor: "pointer",
            }}
          >
            Upcoming
          </button>
          <button
            onClick={() => setFilter("draft")}
            style={{
              padding: "6px 12px",
              fontSize: 12,
              fontWeight: 600,
              background: filter === "draft" ? COLORS.blue : "transparent",
              color: filter === "draft" ? "#fff" : COLORS.muted,
              border: `1px solid ${filter === "draft" ? COLORS.blue : COLORS.border}`,
              cursor: "pointer",
            }}
          >
            Drafts
          </button>
        </div>

        {/* Programs Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(600px, 1fr))",
          gap: 10,
        }}>
          {MOCK_PROGRAMS
            .filter(p => filter === "all" || p.status === filter)
            .map(program => (
              <ProgramCard key={program.id} program={program} />
            ))}
        </div>

        <ThemeToggle />
      </div>
    </EmployerLayout>
  );
}