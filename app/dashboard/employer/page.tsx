/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import EmployerLayout from "@/components/dashboard/employer/EmployerLayout";
import { StatCard, SectionHeader, Card } from "@/components/dashboard/Dashboardwidgets";
import ThemeToggle from "@/components/Themetoggle";
import {
  getCompanyByOwner,
  getCompanyMembers,
  type Company,
  type EmployeeDashboardRow,
} from "@/services/companyService";
import { Users, Clock, CheckCircle, ChevronRight, BarChart3, Building2, Plus } from "lucide-react";

function Skeleton({ style }: { style?: React.CSSProperties }) {
  return <div className="animate-pulse" style={{ background: "rgba(128,128,128,0.12)", borderRadius: 2, ...style }} />;
}

export default function EmployerDashboardPage() {
  const { user } = useAuth();
  const { isDark, surface, accentColor } = useTheme();
  const router = useRouter();

  const [company,        setCompany]        = useState<Company | null>(null);
  const [members,        setMembers]        = useState<EmployeeDashboardRow[]>([]);
  const [loadingCompany, setLoadingCompany] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const c = { text: surface.text, muted: surface.muted, border: surface.border, surface: surface.surface, primary: accentColor };

  useEffect(() => {
    if (!user) return;
    setLoadingCompany(true);

    const run = async () => {
      try {
        // 1. Try companies collection first
        let co = await getCompanyByOwner(user.id).catch(() => null);

        // 2. Fallback: user profile (for accounts created before companies table had a name column)
        if (!co) {
          const { getUserProfile } = await import("@/services/userService");
          const profile = await getUserProfile(user.id).catch(() => null);
          if (profile?.companyName) {
            co = {
              $id:         profile.companyId || user.id,
              $createdAt:  "",
              name:        profile.companyName,
              ownerId:     user.id,
              size:        profile.companySize || "",
              industry:    profile.industry   || "",
              inviteCount: 0,
            } as Company;
          }
        }

        setCompany(co);
        if (co) {
          setLoadingMembers(true);
          const rows = await getCompanyMembers(co.$id).catch(() => []);
          setMembers(rows);
          setLoadingMembers(false);
        }
      } catch (e) {
        console.error("[Dashboard] load error:", e);
      } finally {
        setLoadingCompany(false);
      }
    };

    run();
  }, [user]);

  const activeCount  = members.filter(m => m.status === "active").length;
  const pendingCount = members.filter(m => m.status === "pending").length;
  const totalCount   = members.length;
  const goToEmployees = () => router.push("/dashboard/employer/employees");

  return (
    <EmployerLayout>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        {loadingCompany ? (
          <><Skeleton style={{ width: 240, height: 28, marginBottom: 8 }} /><Skeleton style={{ width: 160, height: 14 }} /></>
        ) : (
          <>
            <SectionHeader title={company?.name || "Dashboard"} />
            {company && (
              <p style={{ margin: "4px 0 0", fontSize: 12, color: c.muted, display: "flex", alignItems: "center", gap: 6 }}>
                <Building2 size={13} />{company.industry || "Your organisation"}
              </p>
            )}
          </>
        )}
      </div>

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 32 }}>
        {loadingCompany || loadingMembers ? (
          [1, 2, 3].map(i => (
            <div key={i} style={{ padding: 20, background: c.surface, border: `1px solid ${c.border}` }}>
              <Skeleton style={{ width: 32, height: 32, marginBottom: 12 }} />
              <Skeleton style={{ width: "55%", height: 26, marginBottom: 8 }} />
              <Skeleton style={{ width: "75%", height: 13 }} />
            </div>
          ))
        ) : (
          <>
            <StatCard icon={<Users size={18} />}        value={totalCount}  label="Total Employees"  color={c.primary} />
            <StatCard icon={<CheckCircle size={18} />}  value={activeCount}  label="Active Members"   color="#0FBB7D"   />
            <StatCard icon={<Clock size={18} />}        value={pendingCount} label="Pending Invites"  color="#F79009"   />
          </>
        )}
      </div>

      {/* Employees Preview Card */}
      <SectionHeader title="Employees" />
      <Card className="mt-3 mb-8">

        {/* Card header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${c.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Users size={16} style={{ color: c.primary }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: c.text }}>Your Team</span>
            {totalCount > 0 && (
              <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", background: `${c.primary}18`, color: c.primary, borderRadius: 2 }}>{totalCount}</span>
            )}
          </div>
          <button onClick={goToEmployees} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: c.primary, background: "none", border: "none", cursor: "pointer" }}>
            View all <ChevronRight size={14} />
          </button>
        </div>

        {/* Card body */}
        {loadingCompany || loadingMembers ? (
          <div>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px" }}>
                <Skeleton style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0 }} />
                <div style={{ flex: 1 }}><Skeleton style={{ width: "40%", height: 13, marginBottom: 6 }} /><Skeleton style={{ width: "28%", height: 11 }} /></div>
                <Skeleton style={{ width: 60, height: 22 }} />
              </div>
            ))}
          </div>

        ) : members.length === 0 ? (
          /* Empty state */
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 24px", textAlign: "center" }}>
            <div style={{ width: 56, height: 56, display: "flex", alignItems: "center", justifyContent: "center", background: isDark ? "rgba(15,187,125,0.1)" : "rgba(15,187,125,0.08)", borderRadius: 2, marginBottom: 16 }}>
              <Users size={26} style={{ color: c.primary }} />
            </div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: c.text, marginBottom: 6 }}>No employees yet</p>
            <p style={{ margin: "0 0 20px", fontSize: 12, color: c.muted, lineHeight: 1.6, maxWidth: 260 }}>
              Invite your team to join your health programme. Their individual data stays private.
            </p>
            <button onClick={goToEmployees} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 20px", fontSize: 12, fontWeight: 700, background: `linear-gradient(135deg, ${c.primary}, #0FB6C8)`, color: "white", border: "none", borderRadius: 2, cursor: "pointer" }}>
              <Plus size={14} /> Add Employees
            </button>
          </motion.div>

        ) : (
          /* Member rows preview (first 3) */
          <>
            {members.slice(0, 3).map((m, idx) => {
              const name     = m.fullName || m.email.split("@")[0];
              const initials = name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
              const statusColors: Record<string, string> = { active: "#0FBB7D", pending: "#F79009", declined: "#EF4444" };
              const sc = statusColors[m.status] || "#9CA3AF";
              return (
                <motion.div key={m.$id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", borderBottom: idx < Math.min(totalCount, 3) - 1 ? `1px solid ${c.border}` : "none" }}>
                  {m.avatar
                    ? <img src={m.avatar} alt={name} style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0, objectFit: "cover" }} />
                    : <div style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0, background: `linear-gradient(135deg, ${c.primary}, ${c.primary}99)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "white" }}>{initials}</div>
                  }
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: c.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</p>
                    <p style={{ margin: 0, fontSize: 11, color: c.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.email}</p>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", background: `${sc}18`, color: sc, borderRadius: 2, flexShrink: 0 }}>
                    {m.status.charAt(0).toUpperCase() + m.status.slice(1)}
                  </span>
                </motion.div>
              );
            })}
            {totalCount > 3 && (
              <button onClick={goToEmployees} style={{ width: "100%", padding: "12px 20px", borderTop: `1px solid ${c.border}`, background: "transparent", border: "none", borderTop: `1px solid ${c.border}`, fontSize: 12, fontWeight: 600, color: c.primary, cursor: "pointer", textAlign: "center" }}>
                See all {totalCount} employees →
              </button>
            )}
          </>
        )}
      </Card>

      {/* Insights teaser */}
      {!loadingCompany && company && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, background: isDark ? `${accentColor}0A` : `${accentColor}06`, border: `1px solid ${accentColor}20` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", background: `${accentColor}18`, borderRadius: 2, flexShrink: 0 }}>
              <BarChart3 size={16} style={{ color: accentColor }} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: c.text }}>Team Health Insights</p>
              <p style={{ margin: 0, fontSize: 11, color: c.muted }}>Anonymised workforce analytics — coming soon</p>
            </div>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: accentColor, flexShrink: 0 }}>Coming soon →</span>
        </motion.div>
      )}

      <ThemeToggle />
    </EmployerLayout>
  );
}