"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Activity,
  Shield,
  Settings,
  Bell,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/hooks/useAuth";
import { useEmployerNotifications } from "@/hooks/useEmployerNotifications";

const EMPLOYER_PRIMARY_NAV = [
  { id: "overview",    label: "Workforce Overview",   icon: LayoutDashboard, href: "/dashboard/employer" },
  { id: "employees",   label: "Employee Management",  icon: Users,           href: "/dashboard/employer/employees" },
  { id: "reports",     label: "Reports & Analytics",  icon: BarChart3,       href: "/dashboard/employer/reports" },
  { id: "programs",    label: "Health Programs",       icon: Activity,        href: "/dashboard/employer/programs" },
  { id: "compliance",  label: "Privacy & Compliance", icon: Shield,          href: "/dashboard/employer/compliance" },
  { id: "settings",    label: "Settings",              icon: Settings,        href: "/dashboard/employer/settings" },
];

const EMPLOYER_SECONDARY_NAV = [
  { id: "notifications", label: "Notifications", icon: Bell,        href: "/dashboard/employer/notifications" },
  { id: "help",          label: "Help & Support", icon: HelpCircle,  href: "/dashboard/employer/help" },
];

// ─── TOOLTIP ────────────────────────────────────────────────────────────────
function Tooltip({
  label,
  children,
  accentColor,
}: {
  label: string;
  children: React.ReactNode;
  S: { surface: string; border: string; text: string };
  accentColor: string;
}) {
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const show = () => {
    if (ref.current) {
      const r = ref.current.getBoundingClientRect();
      setCoords({ top: r.top + r.height / 2, left: r.right + 10 });
    }
  };

  return (
    <>
      <div ref={ref} onMouseEnter={show} onMouseLeave={() => setCoords(null)}>
        {children}
      </div>
      {coords && (
        <div
          style={{
            position: "fixed",
            top: coords.top,
            left: coords.left,
            transform: "translateY(-50%)",
            zIndex: 99999,
            pointerEvents: "none",
            animation: "ttFadeIn 0.12s ease forwards",
          }}
        >
          <div
            style={{
              whiteSpace: "nowrap",
              padding: "5px 12px",
              background: accentColor,
              color: "#fff",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.04em",
              boxShadow: `0 4px 16px ${accentColor}55`,
              position: "relative",
            }}
          >
            {label}
            <span
              style={{
                position: "absolute",
                right: "100%",
                top: "50%",
                transform: "translateY(-50%)",
                borderTop: "5px solid transparent",
                borderBottom: "5px solid transparent",
                borderRight: `5px solid ${accentColor}`,
                display: "block",
                width: 0,
                height: 0,
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}

// ─── NAV ITEM ────────────────────────────────────────────────────────────────
function NavItem({
  item,
  collapsed,
  S,
  accentColor,
  accentFaint,
  onClick,
  badge,
}: {
  item: (typeof EMPLOYER_PRIMARY_NAV)[0];
  collapsed: boolean;
  S: { text: string; muted: string; border: string; surface: string; surfaceAlt: string };
  accentColor: string;
  accentFaint: string;
  onClick?: () => void;
  badge?: number;
}) {
  const pathname = usePathname();
  const isActive =
    pathname === item.href ||
    (item.href !== "/dashboard/employer" && pathname.startsWith(item.href + "/"));
  const Icon = item.icon;

  const content = (
    <Link
      href={item.href}
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        position: "relative",
        padding: collapsed ? "12px 14px" : "12px 16px",
        margin: "2px 0",
        background: isActive ? accentFaint : "transparent",
        color: isActive ? accentColor : S.muted,
        textDecoration: "none",
        transition: "all 0.15s ease",
        overflow: "hidden",
        borderRadius: 0,
      }}
      onMouseEnter={(e) => {
        if (!isActive) (e.currentTarget as HTMLElement).style.background = S.surfaceAlt;
      }}
      onMouseLeave={(e) => {
        if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent";
      }}
    >
      {isActive && (
        <span style={{
          position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)",
          width: 4, height: 28,
          background: `linear-gradient(180deg, ${accentColor}, ${accentColor}90)`,
        }} />
      )}

      <span style={{
        width: 28, height: 28, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: isActive ? `${accentColor}18` : "transparent",
        transition: "background 0.15s",
        position: "relative",
      }}>
        <Icon size={16} strokeWidth={isActive ? 2.2 : 1.8} />
        {collapsed && badge && badge > 0 && (
          <span style={{
            position: "absolute", top: 2, right: 2,
            width: 8, height: 8, background: "#EF4444", borderRadius: "50%",
          }} />
        )}
      </span>

      {!collapsed && (
        <>
          <span style={{
            flex: 1, fontSize: 13,
            fontWeight: isActive ? 700 : 500,
            color: isActive ? accentColor : S.muted,
            letterSpacing: isActive ? "-0.01em" : "0",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {item.label}
          </span>
          {badge && badge > 0 && (
            <span style={{
              minWidth: 20, height: 20, padding: "0 6px",
              background: "#EF4444", color: "#fff",
              fontSize: 10, fontWeight: 800,
              display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1,
            }}>
              {badge > 99 ? "99+" : badge}
            </span>
          )}
        </>
      )}
    </Link>
  );

  if (collapsed) {
    return (
      <div style={{ display: "flex", justifyContent: "center" }}>
        <Tooltip label={item.label} S={S} accentColor={accentColor}>
          {content}
        </Tooltip>
      </div>
    );
  }
  return content;
}

// ─── SIDEBAR ────────────────────────────────────────────────────────────────
interface EmployerSidebarProps {
  collapsed:        boolean;
  onToggleCollapse: () => void;
  mobileOpen:       boolean;
  onMobileClose:    () => void;
}

export default function EmployerSidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onMobileClose,
}: EmployerSidebarProps) {
  const { isDark, accentColor, accentFaint, surface: S } = useTheme();
  const { user, logout } = useAuth();

  // ─── REAL unread count from Appwrite ─────────────────────────────────────
  const { unreadCount } = useEmployerNotifications(user?.id);

  const sidebarBg = isDark ? S.surfaceAlt : S.surface;
  const w = collapsed ? 72 : 260;

  const inner = (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: sidebarBg, borderTopRightRadius: "18px" }}>

      {/* Brand */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: collapsed ? "20px 14px" : "20px 20px",
        justifyContent: collapsed ? "center" : "flex-start",
        borderBottom: `1px solid ${S.border}`,
        flexShrink: 0,
      }}>
        <div style={{
          width: 36, height: 36, overflow: "hidden", flexShrink: 0,
          borderRadius: "100%", background: "#cccccc",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Image src="/white logo.png" alt="HMEX" width={54} height={24} />
        </div>
        {!collapsed && (
          <div>
            <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.03em", color: S.text, display: "block", lineHeight: 1.2 }}>
              HMEX
            </span>
            <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: accentColor }}>
              Employer Portal
            </span>
          </div>
        )}
      </div>

      {/* Primary Navigation */}
      <nav style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "16px 8px" }}>
        {EMPLOYER_PRIMARY_NAV.map((item) => (
          <NavItem
            key={item.id}
            item={item}
            collapsed={collapsed}
            S={S}
            accentColor={accentColor}
            accentFaint={accentFaint}
            onClick={onMobileClose}
          />
        ))}

        <div style={{ margin: "16px 12px", borderTop: `1px solid ${S.border}` }} />

        {!collapsed && (
          <p style={{
            padding: "0 16px 8px", fontSize: 10, fontWeight: 700,
            textTransform: "uppercase", letterSpacing: "0.08em", color: S.subtle,
          }}>
            Support
          </p>
        )}

        {EMPLOYER_SECONDARY_NAV.map((item) => (
          <NavItem
            key={item.id}
            item={item}
            collapsed={collapsed}
            S={S}
            accentColor={accentColor}
            accentFaint={accentFaint}
            onClick={onMobileClose}
            // Only show badge on the notifications nav item
            badge={item.id === "notifications" ? unreadCount : undefined}
          />
        ))}
      </nav>

      {/* User Profile */}
      {user && (
        <div style={{ borderTop: `1px solid ${S.border}`, flexShrink: 0, padding: collapsed ? "12px 0" : "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: collapsed ? "center" : "flex-start" }}>
            <div style={{
              width: 40, height: 40,
              background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, fontWeight: 900, color: "#fff", flexShrink: 0,
            }}>
              {user.name?.charAt(0).toUpperCase() || "E"}
            </div>
            {!collapsed && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: S.text, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.name}
                </p>
                <p style={{ fontSize: 11, color: accentColor, margin: "2px 0 0", fontWeight: 600 }}>
                  Employer Admin
                </p>
              </div>
            )}
          </div>

          {!collapsed && (
            <button
              onClick={logout}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                width: "100%", padding: "12px 16px", marginTop: 12,
                background: "transparent", border: `1px solid ${S.border}`,
                color: S.muted, fontSize: 12, cursor: "pointer", transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.05)";
                (e.currentTarget as HTMLElement).style.color = "#ef4444";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(239,68,68,0.3)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "transparent";
                (e.currentTarget as HTMLElement).style.color = S.muted;
                (e.currentTarget as HTMLElement).style.borderColor = S.border;
              }}
            >
              <LogOut size={14} strokeWidth={1.8} />
              Sign out
            </button>
          )}
        </div>
      )}

      {/* Collapsed sign out */}
      {collapsed && (
        <div style={{ padding: "16px 0", borderTop: `1px solid ${S.border}` }}>
          <Tooltip label="Sign out" S={S} accentColor={accentColor}>
            <button
              onClick={logout}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", padding: "12px 0", background: "none", border: "none", color: S.muted, cursor: "pointer" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#ef4444"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = S.muted; }}
            >
              <LogOut size={16} strokeWidth={1.8} />
            </button>
          </Tooltip>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* DESKTOP */}
      <div className="hidden lg:flex" style={{ position: "relative", flexShrink: 0, width: w, transition: "width 0.2s ease" }}>
        <aside style={{
          height: "100%", width: "100%", overflow: "hidden",
          background: sidebarBg, borderRight: `1px solid ${S.border}`,
          boxShadow: isDark ? "4px 0 28px rgba(0,0,0,0.4)" : "4px 0 24px rgba(0,0,0,0.07)",
        }}>
          {inner}
        </aside>

        <button
          onClick={onToggleCollapse}
          style={{
            position: "absolute", right: -12, top: 70, zIndex: 30,
            width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center",
            background: sidebarBg, border: `1px solid ${S.border}`,
            color: S.muted, cursor: "pointer",
            boxShadow: isDark ? "0 2px 12px rgba(0,0,0,0.5)" : "0 2px 10px rgba(0,0,0,0.1)",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = accentColor; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = S.muted; }}
        >
          {collapsed ? <ChevronRight size={11} strokeWidth={2.5} /> : <ChevronLeft size={11} strokeWidth={2.5} />}
        </button>
      </div>

      {/* MOBILE DRAWER */}
      {mobileOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50 }} className="lg:hidden">
          <div
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(3px)" }}
            onClick={onMobileClose}
          />
          <aside style={{
            position: "absolute", left: 0, top: 0, bottom: 0, width: 280, zIndex: 10,
            background: sidebarBg, borderRight: `1px solid ${S.border}`,
            animation: "slideInLeft 0.18s ease", overflow: "hidden",
          }}>
            <button
              onClick={onMobileClose}
              style={{
                position: "absolute", top: 14, right: 14, zIndex: 20,
                width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
                background: S.surfaceAlt, border: `1px solid ${S.border}`,
                color: S.muted, cursor: "pointer",
              }}
            >
              <X size={13} strokeWidth={2} />
            </button>
            {inner}
          </aside>
        </div>
      )}

      <style>{`
        @keyframes slideInLeft {
          from { transform: translateX(-100%); opacity: 0; }
          to   { transform: translateX(0);     opacity: 1; }
        }
        @keyframes ttFadeIn {
          from { opacity: 0; transform: translateY(-50%) translateX(-6px); }
          to   { opacity: 1; transform: translateY(-50%) translateX(0); }
        }
      `}</style>
    </>
  );
}