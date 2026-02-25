"use client";

import React, { useState, useRef, useEffect } from "react";
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
  { id: "overview",     label: "Overview",         icon: LayoutDashboard, href: "/dashboard" },
  { id: "assessment",   label: "New Assessment",    icon: Activity,        href: "/questions" },
  { id: "history",      label: "History",           icon: History,         href: "/dashboard/history" },
  { id: "profile",      label: "My Profile",        icon: User,            href: "/dashboard/profile" },
];

const SECONDARY_NAV = [
  { id: "notifications", label: "Notifications",   icon: Bell,            href: "/dashboard/notifications" },
  { id: "help",          label: "Help & Support",   icon: HelpCircle,      href: "/dashboard/help" },
  { id: "settings",      label: "Settings",         icon: Settings,        href: "/dashboard/settings" },
];

// ─── TOOLTIP ─────────────────────────────────────────────────────────────────
function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  return (
    <div
      className="relative flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div
          className="absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 pointer-events-none"
          style={{ animation: "fadeInLeft 0.12s ease" }}
        >
          <div
            className="whitespace-nowrap rounded px-2.5 py-1.5 text-[11px] font-semibold tracking-wide"
            style={{
              background: "#0d9488",
              color: "#fff",
              boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
            }}
          >
            {label}
            {/* Arrow */}
            <div
              className="absolute right-full top-1/2 -translate-y-1/2"
              style={{
                borderTop: "5px solid transparent",
                borderBottom: "5px solid transparent",
                borderRight: "5px solid #0d9488",
                width: 0,
                height: 0,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── NAV ITEM ─────────────────────────────────────────────────────────────────
function NavItem({
  item,
  collapsed,
  isDark,
  onClick,
}: {
  item: { id: string; label: string; icon: React.ElementType; href: string };
  collapsed: boolean;
  isDark: boolean;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
  const Icon = item.icon;

  const content = (
    <Link
      href={item.href}
      onClick={onClick}
      className="group relative flex items-center gap-3 px-3 py-2.5 transition-all duration-150"
      style={{
        borderRadius: 4,
        background: isActive
          ? isDark ? "rgba(13,148,136,0.14)" : "rgba(13,148,136,0.09)"
          : "transparent",
        color: isActive
          ? "#0d9488"
          : isDark ? "#8b9cb5" : "#4a5568",
      }}
    >
      {/* Active indicator bar */}
      {isActive && (
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full"
          style={{ background: "#0d9488" }}
        />
      )}
      <Icon
        size={16}
        className="shrink-0 transition-colors duration-150"
        strokeWidth={isActive ? 2.2 : 1.8}
      />
      {!collapsed && (
        <span
          className="text-[13px] transition-all duration-150 truncate"
          style={{ fontWeight: isActive ? 600 : 400, letterSpacing: "0.01em" }}
        >
          {item.label}
        </span>
      )}
      {/* Hover bg */}
      <div
        className="absolute inset-0 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none"
        style={{
          borderRadius: 4,
          background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
        }}
      />
    </Link>
  );

  if (collapsed) {
    return <Tooltip label={item.label}>{content}</Tooltip>;
  }
  return content;
}

// ─── SIDEBAR COMPONENT ────────────────────────────────────────────────────────
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

  const bg       = isDark ? "#0b0f1a" : "#ffffff";
  const border   = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)";
  const divider  = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)";
  const mutedTxt = isDark ? "#4a5568" : "#94a3b8";

  const sidebarWidth = collapsed ? 60 : 224;

  const sidebarContent = (
    <div
      className="flex flex-col h-full"
      style={{ background: bg }}
    >
      {/* ── Logo / Brand ── */}
      <div
        className="flex items-center gap-2.5 px-3 py-4"
        style={{
          borderBottom: `1px solid ${border}`,
          height: 56,
          minHeight: 56,
        }}
      >
        <div
          className="flex items-center justify-center shrink-0"
          style={{
            width: 30,
            height: 30,
            background: "linear-gradient(135deg,#0d9488,#059669)",
            borderRadius: 6,
          }}
        >
          <Heart size={15} strokeWidth={2.5} color="#fff" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p
              className="text-[14px] font-bold tracking-tight truncate"
              style={{ color: isDark ? "#f0f4f8" : "#0f172a", letterSpacing: "-0.02em" }}
            >
              HealthMex
            </p>
            <p className="text-[10px] font-medium" style={{ color: mutedTxt, letterSpacing: "0.06em" }}>
              RISK SCREENING
            </p>
          </div>
        )}
      </div>

      {/* ── Primary Nav ── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3 space-y-0.5">
        {PRIMARY_NAV.map(item => (
          <NavItem
            key={item.id}
            item={item}
            collapsed={collapsed}
            isDark={isDark}
            onClick={onMobileClose}
          />
        ))}

        {/* Divider */}
        <div className="my-3 mx-1" style={{ borderTop: `1px solid ${divider}` }} />

        {/* Section label */}
        {!collapsed && (
          <p
            className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.14em]"
            style={{ color: mutedTxt }}
          >
            General
          </p>
        )}

        {SECONDARY_NAV.map(item => (
          <NavItem
            key={item.id}
            item={item}
            collapsed={collapsed}
            isDark={isDark}
            onClick={onMobileClose}
          />
        ))}
      </nav>

      {/* ── User Footer ── */}
      <div style={{ borderTop: `1px solid ${border}` }}>
        {/* User info */}
        {user && (
          <div
            className="flex items-center gap-2.5 px-3 py-3"
            style={{
              borderBottom: `1px solid ${divider}`,
              minHeight: collapsed ? 0 : "auto",
            }}
          >
            {/* Avatar */}
            <div
              className="flex items-center justify-center shrink-0 text-[11px] font-bold"
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                background: "linear-gradient(135deg,#0d9488,#059669)",
                color: "#fff",
              }}
            >
              {user.name?.charAt(0).toUpperCase() || "U"}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p
                  className="text-[12px] font-semibold truncate"
                  style={{ color: isDark ? "#e2e8f0" : "#0f172a" }}
                >
                  {user.name}
                </p>
                <p
                  className="text-[10px] truncate"
                  style={{ color: mutedTxt }}
                >
                  {user.email}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Logout */}
        {collapsed ? (
          <Tooltip label="Sign out">
            <button
              onClick={logout}
              className="flex items-center justify-center w-full py-3 transition-colors duration-150 group"
              style={{ color: isDark ? "#4a5568" : "#94a3b8" }}
            >
              <LogOut
                size={15}
                strokeWidth={1.8}
                className="group-hover:text-red-400 transition-colors duration-150"
              />
            </button>
          </Tooltip>
        ) : (
          <button
            onClick={logout}
            className="flex items-center gap-2.5 w-full px-3 py-3 transition-colors duration-150 group"
            style={{ color: isDark ? "#4a5568" : "#94a3b8" }}
          >
            <LogOut size={14} strokeWidth={1.8} className="group-hover:text-red-400 transition-colors duration-150 shrink-0" />
            <span
              className="text-[12px] group-hover:text-red-400 transition-colors duration-150"
              style={{ fontWeight: 400 }}
            >
              Sign out
            </span>
          </button>
        )}
      </div>

      {/* ── Collapse Toggle (desktop only) ── */}
      <button
        onClick={onToggleCollapse}
        className="hidden lg:flex items-center justify-center absolute -right-3 top-16 z-10 w-6 h-6 transition-all duration-150 hover:scale-110"
        style={{
          background: isDark ? "#1a2236" : "#ffffff",
          border: `1px solid ${border}`,
          borderRadius: 6,
          color: isDark ? "#6b7a8d" : "#64748b",
          boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.4)" : "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        {collapsed ? <ChevronRight size={12} strokeWidth={2.5} /> : <ChevronLeft size={12} strokeWidth={2.5} />}
      </button>
    </div>
  );

  return (
    <>
      {/* ── DESKTOP SIDEBAR ── */}
      <aside
        className="hidden lg:block relative shrink-0 transition-all duration-200 ease-in-out"
        style={{
          width: sidebarWidth,
          borderRight: `1px solid ${border}`,
          background: bg,
        }}
      >
        {sidebarContent}
      </aside>

      {/* ── MOBILE OVERLAY + DRAWER ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" }}
            onClick={onMobileClose}
          />
          {/* Drawer */}
          <aside
            className="absolute left-0 top-0 bottom-0 z-10 flex flex-col"
            style={{
              width: 224,
              background: bg,
              borderRight: `1px solid ${border}`,
              animation: "slideInLeft 0.18s ease",
            }}
          >
            {/* Close button */}
            <button
              onClick={onMobileClose}
              className="absolute top-4 right-4 z-20 flex items-center justify-center w-7 h-7 rounded"
              style={{
                background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)",
                color: isDark ? "#8b9cb5" : "#64748b",
              }}
            >
              <X size={14} strokeWidth={2} />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* ── CSS ANIMATIONS ── */}
      <style jsx global>{`
        @keyframes slideInLeft {
          from { transform: translateX(-100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes fadeInLeft {
          from { transform: translateX(-4px) translateY(-50%); opacity: 0; }
          to   { transform: translateX(0)    translateY(-50%); opacity: 1; }
        }
      `}</style>
    </>
  );
}