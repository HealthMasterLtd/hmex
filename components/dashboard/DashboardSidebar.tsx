"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Activity, History, User, Settings,
  LogOut, ChevronLeft, ChevronRight, X, HelpCircle, Bell, Lightbulb,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";

const PRIMARY_NAV = [
  { id: "overview",        label: "Overview",        icon: LayoutDashboard, href: "/dashboard" },
  { id: "recommendations", label: "Recommendations", icon: Lightbulb,       href: "/dashboard/recommendations" },
  { id: "history",         label: "History",         icon: History,         href: "/dashboard/history" },
  { id: "assessment",      label: "New Assessment",  icon: Activity,        href: "/dashboard/assessment" },
  { id: "profile",         label: "My Profile",      icon: User,            href: "/dashboard/profile" },
];
const SECONDARY_NAV = [
  { id: "notifications", label: "Notifications",  icon: Bell,       href: "/dashboard/notifications" },
  { id: "help",          label: "Help & Support",  icon: HelpCircle, href: "/dashboard/help" },
  { id: "settings",      label: "Settings",        icon: Settings,   href: "/dashboard/settings" },
];

// ─── TOOLTIP ─────────────────────────────────────────────────────────────────
function Tooltip({ label, children, S, accentColor }: {
  label: string; children: React.ReactNode;
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
            position: "fixed", top: coords.top, left: coords.left,
            transform: "translateY(-50%)", zIndex: 99999, pointerEvents: "none",
            animation: "ttFadeIn 0.12s ease forwards",
          }}
        >
          <div style={{
            whiteSpace: "nowrap", padding: "5px 12px",
            background: accentColor,
            color: "#fff", fontSize: 11, fontWeight: 700, letterSpacing: "0.04em",
            boxShadow: `0 4px 16px ${accentColor}55`,
            position: "relative",
          }}>
            {label}
            <span style={{
              position: "absolute", right: "100%", top: "50%", transform: "translateY(-50%)",
              borderTop: "5px solid transparent", borderBottom: "5px solid transparent",
              borderRight: `5px solid ${accentColor}`,
              display: "block", width: 0, height: 0,
            }} />
          </div>
        </div>
      )}
    </>
  );
}

// ─── UNREAD BADGE ─────────────────────────────────────────────────────────────
function UnreadBadge({ count, collapsed }: { count: number; collapsed: boolean }) {
  if (count === 0) return null;
  const label = count > 99 ? "99+" : String(count);

  if (collapsed) {
    // Small dot in top-right of icon when sidebar is collapsed
    return (
      <span style={{
        position: "absolute", top: 4, right: 4,
        minWidth: 16, height: 16, padding: "0 4px",
        background: "#ef4444",
        color: "#fff",
        fontSize: 9, fontWeight: 900,
        display: "flex", alignItems: "center", justifyContent: "center",
        lineHeight: 1,
        boxShadow: "0 1px 6px rgba(239,68,68,0.5)",
        borderRadius: 2,
      }}>
        {label}
      </span>
    );
  }

  return (
    <span style={{
      marginLeft: "auto",
      minWidth: 18, height: 18, padding: "0 5px",
      background: "#ef4444",
      color: "#fff",
      fontSize: 10, fontWeight: 900,
      display: "flex", alignItems: "center", justifyContent: "center",
      lineHeight: 1,
      boxShadow: "0 1px 6px rgba(239,68,68,0.45)",
      borderRadius: 2,
      flexShrink: 0,
    }}>
      {label}
    </span>
  );
}

// ─── NAV ITEM ─────────────────────────────────────────────────────────────────
function NavItem({
  item, collapsed, S, accentColor, accentFaint, onClick, badge,
}: {
  item: (typeof PRIMARY_NAV)[0];
  collapsed: boolean;
  S: { text: string; muted: string; border: string; surface: string; surfaceAlt: string };
  accentColor: string;
  accentFaint: string;
  onClick?: () => void;
  badge?: number;
}) {
  const pathname = usePathname();
  const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
  const Icon = item.icon;

  const content = (
    <Link
      href={item.href}
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 10, position: "relative",
        padding: collapsed ? "9px 14px" : "9px 10px",
        margin: "1px 0",
        background: isActive ? accentFaint : "transparent",
        color: isActive ? accentColor : S.muted,
        textDecoration: "none",
        transition: "all 0.15s ease",
        overflow: "hidden",
      }}
      onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = S.surfaceAlt; }}
      onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
    >
      {/* Active left bar */}
      {isActive && (
        <span style={{
          position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)",
          width: 3, height: 24,
          background: `linear-gradient(180deg, ${accentColor}, ${accentColor}90)`,
        }} />
      )}

      {/* Icon */}
      <span style={{
        width: 28, height: 28, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: isActive ? `${accentColor}18` : "transparent",
        transition: "background 0.15s",
        position: "relative",
      }}>
        <Icon size={15} strokeWidth={isActive ? 2.2 : 1.8} />
        {collapsed && badge !== undefined && <UnreadBadge count={badge} collapsed={true} />}
      </span>

      {!collapsed && (
        <>
          <span style={{
            fontSize: 13, fontWeight: isActive ? 700 : 400,
            color: isActive ? accentColor : S.muted,
            letterSpacing: isActive ? "-0.01em" : "0.01em",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {item.label}
          </span>
          {badge !== undefined && <UnreadBadge count={badge} collapsed={false} />}
        </>
      )}
    </Link>
  );

  if (collapsed) {
    return (
      <div style={{ display: "flex", justifyContent: "center" }}>
        <Tooltip label={item.label} S={S} accentColor={accentColor}>{content}</Tooltip>
      </div>
    );
  }
  return content;
}

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────
interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function DashboardSidebar({ collapsed, onToggleCollapse, mobileOpen, onMobileClose }: SidebarProps) {
  const { isDark, accentColor, accentFaint, surface: S } = useTheme();
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications(user?.id ?? undefined);

  // Sidebar bg is slightly offset from page bg for contrast
  const sidebarBg = isDark ? S.surfaceAlt : S.surface;
  const w = collapsed ? 64 : 228;

  const inner = (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: sidebarBg }}>

      {/* Brand */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: collapsed ? "0 14px" : "0 14px",
        justifyContent: collapsed ? "center" : "flex-start",
        height: 56, minHeight: 56, borderBottom: `1px solid ${S.border}`,
        flexShrink: 0,
      }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", overflow: "hidden", flexShrink: 0 }}>
          <Image src="/white logo.png" alt="HMEX" width={32} height={32} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        {!collapsed && (
          <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-0.03em", color: S.text }}>
            H<span style={{ color: accentColor }}>MEX</span>
          </span>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "10px 8px" }}>
        {PRIMARY_NAV.map(item => (
          <NavItem key={item.id} item={item} collapsed={collapsed} S={S} accentColor={accentColor} accentFaint={accentFaint} onClick={onMobileClose} />
        ))}

        <div style={{ margin: "10px 4px", borderTop: `1px solid ${S.border}` }} />

        {!collapsed && (
          <p style={{ padding: "0 10px 6px", fontSize: 10, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.14em", color: S.subtle }}>
            General
          </p>
        )}

        {SECONDARY_NAV.map(item => (
          <NavItem
            key={item.id}
            item={item}
            collapsed={collapsed}
            S={S}
            accentColor={accentColor}
            accentFaint={accentFaint}
            onClick={onMobileClose}
            badge={item.id === "notifications" ? unreadCount : undefined}
          />
        ))}
      </nav>

      {/* User footer */}
      <div style={{ borderTop: `1px solid ${S.border}`, flexShrink: 0 }}>
        {user && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 12px",
            justifyContent: collapsed ? "center" : "flex-start",
            borderBottom: `1px solid ${S.border}`,
          }}>
            <div style={{
              width: 30, height: 30, flexShrink: 0,
              background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 900, color: "#fff",
            }}>
              {user.name?.charAt(0).toUpperCase() || "U"}
            </div>
            {!collapsed && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: S.text, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.name}
                </p>
                <p style={{ fontSize: 10, color: S.muted, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.email}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Sign out */}
        {collapsed ? (
          <Tooltip label="Sign out" S={S} accentColor={accentColor}>
            <button
              onClick={logout}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: "100%", padding: "12px", background: "none", border: "none",
                color: S.muted, cursor: "pointer",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#ef4444"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = S.muted; }}
            >
              <LogOut size={15} strokeWidth={1.8} />
            </button>
          </Tooltip>
        ) : (
          <button
            onClick={logout}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              width: "100%", padding: "11px 12px",
              background: "none", border: "none",
              color: S.muted, cursor: "pointer", fontSize: 12,
              transition: "color 0.15s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#ef4444"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = S.muted; }}
          >
            <LogOut size={14} strokeWidth={1.8} />
            Sign out
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* DESKTOP */}
      <div className="hidden lg:flex" style={{ position: "relative", flexShrink: 0, width: w, transition: "width 0.2s ease" }}>
        <aside style={{
          height: "100%", width: "100%", overflow: "hidden",
          background: sidebarBg,
          borderRight: `1px solid ${S.border}`,
          borderRadius: "0 18px 0 18px",
          boxShadow: isDark ? "4px 0 28px rgba(0,0,0,0.4)" : "4px 0 24px rgba(0,0,0,0.07)",
        }}>
          {inner}
        </aside>

        {/* Collapse toggle */}
        <button
          onClick={onToggleCollapse}
          style={{
            position: "absolute", right: -12, top: 60, zIndex: 30,
            width: 24, height: 24,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: sidebarBg, border: `1px solid ${S.border}`,
            color: S.muted, cursor: "pointer",
            boxShadow: isDark ? "0 2px 12px rgba(0,0,0,0.5)" : "0 2px 10px rgba(0,0,0,0.1)",
            transition: "all 0.15s",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = accentColor; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = S.muted; }}
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
            position: "absolute", left: 0, top: 0, bottom: 0, width: 228, zIndex: 10,
            background: sidebarBg,
            borderRight: `1px solid ${S.border}`,
            borderRadius: "0 18px 0 18px",
            animation: "slideInLeft 0.18s ease",
            overflow: "hidden",
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