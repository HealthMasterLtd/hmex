"use client";

import React, { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  Sun,
  Moon,
  Bell,
  ChevronRight,
  LogOut,
  User,
  Settings,
  Activity,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/hooks/useAuth";

// ─── BREADCRUMB MAP ───────────────────────────────────────────────────────────
const BREADCRUMB_MAP: Record<string, string> = {
  "/dashboard":               "Overview",
  "/dashboard/history":       "History",
  "/dashboard/profile":       "My Profile",
  "/dashboard/settings":      "Settings",
  "/dashboard/help":          "Help & Support",
  "/dashboard/notifications": "Notifications",
};

function Breadcrumbs({ isDark }: { isDark: boolean }) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const mutedTxt = isDark ? "#4a5568" : "#94a3b8";
  const activeTxt = isDark ? "#e2e8f0" : "#0f172a";

  if (segments.length <= 1) {
    return (
      <p className="text-[13px] font-semibold" style={{ color: activeTxt, letterSpacing: "-0.01em" }}>
        {BREADCRUMB_MAP[pathname] || "Dashboard"}
      </p>
    );
  }

  const crumbs: { label: string; href: string }[] = [];
  let path = "";
  for (const seg of segments) {
    path += `/${seg}`;
    crumbs.push({
      label: BREADCRUMB_MAP[path] || seg.charAt(0).toUpperCase() + seg.slice(1),
      href: path,
    });
  }

  return (
    <div className="flex items-center gap-1">
      {crumbs.map((crumb, i) => (
        <React.Fragment key={crumb.href}>
          {i > 0 && <ChevronRight size={12} style={{ color: mutedTxt }} strokeWidth={2} />}
          <span
            className="text-[12px]"
            style={{
              color: i === crumbs.length - 1 ? activeTxt : mutedTxt,
              fontWeight: i === crumbs.length - 1 ? 600 : 400,
              letterSpacing: "-0.01em",
            }}
          >
            {crumb.label}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── USER DROPDOWN ────────────────────────────────────────────────────────────
function UserDropdown({ isDark }: { isDark: boolean }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const bg     = isDark ? "#111827" : "#ffffff";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const hover  = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";
  const txt    = isDark ? "#e2e8f0" : "#0f172a";
  const muted  = isDark ? "#4a5568" : "#94a3b8";

  const menuItems = [
    { icon: User,     label: "My Profile",  action: () => router.push("/dashboard/profile") },
    { icon: Activity, label: "New Assessment", action: () => router.push("/questions") },
    { icon: Settings, label: "Settings",    action: () => router.push("/dashboard/settings") },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-2 py-1.5 rounded transition-colors duration-150 group"
        style={{
          background: open ? (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)") : "transparent",
          border: `1px solid ${open ? border : "transparent"}`,
        }}
      >
        {/* Avatar */}
        <div
          className="flex items-center justify-center text-[11px] font-bold shrink-0"
          style={{
            width: 26,
            height: 26,
            borderRadius: 5,
            background: "linear-gradient(135deg,#0d9488,#059669)",
            color: "#fff",
          }}
        >
          {user?.name?.charAt(0).toUpperCase() || "U"}
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-[12px] font-semibold leading-tight" style={{ color: txt }}>
            {user?.name?.split(" ")[0] || "User"}
          </p>
        </div>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1.5 z-50 py-1.5 min-w-[180px]"
          style={{
            background: bg,
            border: `1px solid ${border}`,
            borderRadius: 6,
            boxShadow: isDark
              ? "0 8px 32px rgba(0,0,0,0.5)"
              : "0 8px 32px rgba(0,0,0,0.12)",
            animation: "dropdownIn 0.12s ease",
          }}
        >
          {/* User info header */}
          <div
            className="px-3 py-2 mb-1"
            style={{ borderBottom: `1px solid ${border}` }}
          >
            <p className="text-[12px] font-semibold" style={{ color: txt }}>{user?.name}</p>
            <p className="text-[11px]" style={{ color: muted }}>{user?.email}</p>
          </div>

          {menuItems.map(item => (
            <button
              key={item.label}
              onClick={() => { item.action(); setOpen(false); }}
              className="flex items-center gap-2.5 w-full px-3 py-2 text-left transition-colors duration-100"
              style={{ background: "transparent", color: isDark ? "#8b9cb5" : "#374151" }}
              onMouseEnter={e => (e.currentTarget.style.background = hover)}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <item.icon size={13} strokeWidth={1.8} />
              <span className="text-[12px]">{item.label}</span>
            </button>
          ))}

          <div className="my-1" style={{ borderTop: `1px solid ${border}` }} />

          <button
            onClick={() => { logout(); setOpen(false); }}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-left transition-colors duration-100 group"
            style={{ background: "transparent", color: isDark ? "#4a5568" : "#94a3b8" }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "rgba(239,68,68,0.07)";
              e.currentTarget.style.color = "#ef4444";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = isDark ? "#4a5568" : "#94a3b8";
            }}
          >
            <LogOut size={13} strokeWidth={1.8} />
            <span className="text-[12px]">Sign out</span>
          </button>
        </div>
      )}
    </div>
  );
}

// ─── HEADER COMPONENT ─────────────────────────────────────────────────────────
interface HeaderProps {
  onMobileMenuOpen: () => void;
}

export default function DashboardHeader({ onMobileMenuOpen }: HeaderProps) {
  const { isDark, toggleTheme } = useTheme();

  const bg     = isDark ? "#0b0f1a" : "#ffffff";
  const border = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)";
  const iconClr = isDark ? "#6b7a8d" : "#64748b";

  return (
    <>
      <header
        className="flex items-center justify-between px-4 shrink-0 z-30"
        style={{
          height: 56,
          background: bg,
          borderBottom: `1px solid ${border}`,
        }}
      >
        {/* Left: Hamburger (mobile) + Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile hamburger */}
          <button
            onClick={onMobileMenuOpen}
            className="lg:hidden flex items-center justify-center w-7 h-7 rounded transition-colors duration-150"
            style={{
              background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
              color: iconClr,
            }}
          >
            <Menu size={15} strokeWidth={2} />
          </button>

          {/* Breadcrumb */}
          <Breadcrumbs isDark={isDark} />
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1.5">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center w-7 h-7 rounded transition-all duration-150 hover:scale-105"
            style={{
              background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
              color: iconClr,
            }}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark
              ? <Sun size={13} strokeWidth={2} />
              : <Moon size={13} strokeWidth={2} />
            }
          </button>

          {/* Notifications */}
          <button
            className="relative flex items-center justify-center w-7 h-7 rounded transition-all duration-150 hover:scale-105"
            style={{
              background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
              color: iconClr,
            }}
            title="Notifications"
          >
            <Bell size={13} strokeWidth={2} />
            {/* Unread dot */}
            <span
              className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full"
              style={{ background: "#0d9488" }}
            />
          </button>

          {/* Divider */}
          <div
            className="w-px h-5 mx-1"
            style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }}
          />

          {/* User dropdown */}
          <UserDropdown isDark={isDark} />
        </div>
      </header>

      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes dropdownIn {
          from { transform: translateY(-4px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </>
  );
}