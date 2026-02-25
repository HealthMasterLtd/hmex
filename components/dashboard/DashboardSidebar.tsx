"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Activity,
  History,
  User,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Heart,
  X,
  HelpCircle,
  Bell,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/hooks/useAuth";

// ─── NAV ITEMS ────────────────────────────────────────────────────────────────
const PRIMARY_NAV = [
  { id: "overview",   label: "Overview",       icon: LayoutDashboard, href: "/dashboard" },
  { id: "assessment", label: "New Assessment",  icon: Activity,        href: "/dashboard/assessment" },
  { id: "history",    label: "History",         icon: History,         href: "/dashboard/history" },
  { id: "profile",    label: "My Profile",      icon: User,            href: "/dashboard/profile" },
];

const SECONDARY_NAV = [
  { id: "notifications", label: "Notifications", icon: Bell,       href: "/dashboard/notifications" },
  { id: "help",          label: "Help & Support", icon: HelpCircle, href: "/dashboard/help" },
  { id: "settings",      label: "Settings",       icon: Settings,   href: "/dashboard/settings" },
];

// ─── PORTAL TOOLTIP ─────────────────────────────────────────────────────────
// Uses fixed positioning so it escapes sidebar overflow:hidden in collapsed mode
function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
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
          className="pointer-events-none"
          style={{
            position: "fixed",
            top: coords.top,
            left: coords.left,
            transform: "translateY(-50%)",
            zIndex: 99999,
            animation: "ttFadeIn 0.12s ease forwards",
          }}
        >
          <div
            className="whitespace-nowrap rounded-lg px-3 py-1.5 text-[11px] font-bold"
            style={{
              background: "linear-gradient(135deg,#0d9488,#059669)",
              color: "#fff",
              boxShadow: "0 4px 16px rgba(13,148,136,0.45)",
              letterSpacing: "0.04em",
            }}
          >
            {label}
            {/* Arrow */}
            <span
              style={{
                position: "absolute",
                right: "100%",
                top: "50%",
                transform: "translateY(-50%)",
                borderTop: "5px solid transparent",
                borderBottom: "5px solid transparent",
                borderRight: "5px solid #0d9488",
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

// ─── NAV ITEM ─────────────────────────────────────────────────────────────────
function NavItem({
  item,
  collapsed,
  isDark,
  sidebarBg,
  onClick,
}: {
  item: { id: string; label: string; icon: React.ElementType; href: string };
  collapsed: boolean;
  isDark: boolean;
  sidebarBg: string;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const isActive =
    pathname === item.href ||
    (item.href !== "/dashboard" && pathname.startsWith(item.href));
  const Icon = item.icon;

  const content = (
    <Link
      href={item.href}
      onClick={onClick}
      className="group relative flex items-center gap-3 transition-all duration-200 overflow-hidden"
      style={{
        padding: collapsed ? "9px 14px" : "9px 11px",
        borderRadius: 10,
        margin: "1px 0",
        background: isActive
          ? isDark
            ? "linear-gradient(135deg,rgba(13,148,136,0.22),rgba(5,150,105,0.14))"
            : "linear-gradient(135deg,rgba(13,148,136,0.13),rgba(5,150,105,0.08))"
          : "transparent",
        color: isActive ? "#0d9488" : isDark ? "#8b9cb5" : "#4a5568",
        boxShadow: isActive
          ? isDark
            ? "inset 0 1px 0 rgba(255,255,255,0.06)"
            : "inset 0 1px 0 rgba(255,255,255,0.8)"
          : "none",
      }}
    >
      {/* Glowing left pill */}
      {isActive && (
        <span
          style={{
            position: "absolute",
            left: 0,
            top: "50%",
            transform: "translateY(-50%)",
            width: 3,
            height: 22,
            borderRadius: 99,
            background: "linear-gradient(180deg,#0d9488,#059669)",
            boxShadow: "0 0 10px rgba(13,148,136,0.7)",
          }}
        />
      )}

      {/* Icon wrapper */}
      <span
        className="flex items-center justify-center shrink-0 rounded-lg transition-all duration-200"
        style={{
          width: 28,
          height: 28,
          background: isActive
            ? isDark ? "rgba(13,148,136,0.22)" : "rgba(13,148,136,0.14)"
            : "transparent",
          boxShadow: isActive ? "0 0 14px rgba(13,148,136,0.28)" : "none",
        }}
      >
        <Icon size={15} strokeWidth={isActive ? 2.2 : 1.8} />
      </span>

      {!collapsed && (
        <span
          className="text-[13px] truncate"
          style={{ fontWeight: isActive ? 700 : 400, letterSpacing: isActive ? "-0.01em" : "0.01em" }}
        >
          {item.label}
        </span>
      )}

      {/* Hover bg overlay */}
      <span
        className="absolute inset-0 rounded-[10px] opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none"
        style={{ background: isActive ? "transparent" : isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)" }}
      />
    </Link>
  );

  if (collapsed) {
    return (
      <div className="flex justify-center">
        <Tooltip label={item.label}>{content}</Tooltip>
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

export default function DashboardSidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onMobileClose,
}: SidebarProps) {
  const { isDark } = useTheme();
  const { user, logout } = useAuth();

  // Sidebar has its own slightly different bg from the page
  // Page bg: #0b0f1a (dark) / #f4f6fb (light)
  // Sidebar: #0d1221 (dark) / #ffffff (light) — gives subtle contrast
  const sidebarBg = isDark ? "#0d1221" : "#ffffff";
  const border    = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)";
  const divider   = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)";
  const muted     = isDark ? "#4a5568" : "#94a3b8";

  const w = collapsed ? 64 : 228;

  const innerContent = (
    <div className="flex flex-col h-full" style={{ background: sidebarBg }}>

      {/* ── Brand ── */}
      <div
        className="flex items-center gap-2.5 px-3"
        style={{ height: 56, minHeight: 56, borderBottom: `1px solid ${border}` }}
      >
        <div
          className={`flex items-center justify-center shrink-0 ${collapsed ? "mx-auto" : ""}`}
          style={{
            width: 32, height: 32,
            background: "linear-gradient(135deg,#0d9488,#059669)",
            borderRadius: 8,
            boxShadow: "0 4px 12px rgba(13,148,136,0.3)",
          }}
        >
          <Heart size={15} strokeWidth={2.5} color="#fff" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-[14px] font-black tracking-tight" style={{ color: isDark ? "#f0f4f8" : "#0f172a", letterSpacing: "-0.03em" }}>
              HealthMex
            </p>
            <p className="text-[9px] font-bold" style={{ color: muted, letterSpacing: "0.1em" }}>
              RISK SCREENING
            </p>
          </div>
        )}
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3 space-y-0.5">
        {PRIMARY_NAV.map(item => (
          <NavItem key={item.id} item={item} collapsed={collapsed} isDark={isDark} sidebarBg={sidebarBg} onClick={onMobileClose} />
        ))}

        <div className="my-3 mx-1" style={{ borderTop: `1px solid ${divider}` }} />

        {!collapsed && (
          <p className="px-3 pb-1.5 text-[10px] font-black uppercase" style={{ color: muted, letterSpacing: "0.14em" }}>
            General
          </p>
        )}

        {SECONDARY_NAV.map(item => (
          <NavItem key={item.id} item={item} collapsed={collapsed} isDark={isDark} sidebarBg={sidebarBg} onClick={onMobileClose} />
        ))}
      </nav>

      {/* ── User footer ── */}
      <div style={{ borderTop: `1px solid ${border}` }}>
        {user && (
          <div
            className={`flex items-center gap-2.5 px-3 py-3 ${collapsed ? "justify-center" : ""}`}
            style={{ borderBottom: `1px solid ${divider}` }}
          >
            <div
              className="flex items-center justify-center shrink-0 text-[11px] font-black"
              style={{
                width: 30, height: 30, borderRadius: 8,
                background: "linear-gradient(135deg,#0d9488,#059669)",
                color: "#fff",
                boxShadow: "0 2px 8px rgba(13,148,136,0.25)",
              }}
            >
              {user.name?.charAt(0).toUpperCase() || "U"}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-semibold truncate" style={{ color: isDark ? "#e2e8f0" : "#0f172a" }}>
                  {user.name}
                </p>
                <p className="text-[10px] truncate" style={{ color: muted }}>{user.email}</p>
              </div>
            )}
          </div>
        )}

        {/* Sign out */}
        {collapsed ? (
          <Tooltip label="Sign out">
            <button
              onClick={logout}
              className="flex items-center justify-center w-full py-3 group transition-colors duration-150"
              style={{ color: muted }}
            >
              <LogOut size={15} strokeWidth={1.8} className="group-hover:text-red-400 transition-colors duration-150" />
            </button>
          </Tooltip>
        ) : (
          <button
            onClick={logout}
            className="flex items-center gap-2.5 w-full px-3 py-3 group transition-colors duration-150"
            style={{ color: muted }}
          >
            <LogOut size={14} strokeWidth={1.8} className="group-hover:text-red-400 transition-colors duration-150 shrink-0" />
            <span className="text-[12px] group-hover:text-red-400 transition-colors duration-150">Sign out</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* ── DESKTOP SIDEBAR ── */}
      {/* 
        Collapse toggle is rendered OUTSIDE the sidebar so it's never clipped.
        It's positioned relative to the parent flex container.
      */}
      <div className="hidden lg:flex relative shrink-0 transition-all duration-200 ease-in-out" style={{ width: w }}>
        <aside
          className="h-full w-full overflow-hidden"
          style={{
            background: sidebarBg,
            borderRight: `1px solid ${border}`,
            // Curved top-right and bottom-left
            borderRadius: "0 18px 0 18px",
            boxShadow: isDark
              ? "4px 0 24px rgba(0,0,0,0.35)"
              : "4px 0 24px rgba(0,0,0,0.06)",
          }}
        >
          {innerContent}
        </aside>

        {/* Collapse toggle — outside aside so never clipped */}
        <button
          onClick={onToggleCollapse}
          className="absolute -right-3 top-[60px] z-30 flex items-center justify-center w-6 h-6 transition-all duration-150 hover:scale-110"
          style={{
            background: isDark ? sidebarBg : "#ffffff",
            border: `1px solid ${border}`,
            borderRadius: 6,
            color: isDark ? "#6b7a8d" : "#64748b",
            boxShadow: isDark ? "0 2px 10px rgba(0,0,0,0.5)" : "0 2px 10px rgba(0,0,0,0.12)",
          }}
        >
          {collapsed
            ? <ChevronRight size={11} strokeWidth={2.5} />
            : <ChevronLeft  size={11} strokeWidth={2.5} />
          }
        </button>
      </div>

      {/* ── MOBILE DRAWER ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(3px)" }}
            onClick={onMobileClose}
          />
          <aside
            className="absolute left-0 top-0 bottom-0 z-10 overflow-hidden"
            style={{
              width: 228,
              background: sidebarBg,
              borderRight: `1px solid ${border}`,
              borderRadius: "0 18px 0 18px",
              animation: "slideInLeft 0.18s ease",
            }}
          >
            <button
              onClick={onMobileClose}
              className="absolute top-4 right-4 z-20 flex items-center justify-center w-7 h-7 rounded-lg"
              style={{
                background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)",
                color: isDark ? "#8b9cb5" : "#64748b",
              }}
            >
              <X size={14} strokeWidth={2} />
            </button>
            {innerContent}
          </aside>
        </div>
      )}

      {/* ── GLOBAL ANIMATIONS ── */}
      <style jsx global>{`
        @keyframes slideInLeft {
          from { transform: translateX(-100%); opacity: 0; }
          to   { transform: translateX(0);     opacity: 1; }
        }
        @keyframes ttFadeIn {
          from { opacity: 0; transform: translateY(-50%) translateX(-6px); }
          to   { opacity: 1; transform: translateY(-50%) translateX(0);    }
        }
      `}</style>
    </>
  );
}