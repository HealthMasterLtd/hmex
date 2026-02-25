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
  Zap,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/hooks/useAuth";
import { fetchUserXp, type UserXpRecord } from "@/services/AppwriteService";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const XP_CONSULTATION_THRESHOLD = 300;

// ─── BREADCRUMB MAP ───────────────────────────────────────────────────────────
const BREADCRUMB_MAP: Record<string, string> = {
  "/dashboard":               "Overview",
  "/dashboard/history":       "History",
  "/dashboard/profile":       "My Profile",
  "/dashboard/settings":      "Settings",
  "/dashboard/help":          "Help & Support",
  "/dashboard/notifications": "Notifications",
  "/dashboard/assessment":    "New Assessment",
  "/dashboard/review":        "Full Report",
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

// ─── XP BADGE ─────────────────────────────────────────────────────────────────
function XpBadge({ userId, isDark }: { userId: string; isDark: boolean }) {
  const router = useRouter();
  const [xpRecord, setXpRecord] = useState<UserXpRecord | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userId) return;
    fetchUserXp(userId).then(setXpRecord).catch(() => {});
  }, [userId]);

  // Close tooltip on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
        setShowTooltip(false);
      }
    };
    if (showTooltip) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showTooltip]);

  const totalXp   = xpRecord?.totalXp ?? 0;
  const redeemed  = xpRecord?.redeemedXp ?? 0;
  const available = totalXp - redeemed;
  const pct       = Math.min((available / XP_CONSULTATION_THRESHOLD) * 100, 100);
  const unlocked  = available >= XP_CONSULTATION_THRESHOLD;

  const border  = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const popBg   = isDark ? "#111827" : "#ffffff";
  const txt     = isDark ? "#e2e8f0" : "#0f172a";
  const muted   = isDark ? "#4a5568" : "#94a3b8";
  const trackBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";

  return (
    <div ref={tooltipRef} className="relative">
      <button
        onClick={() => setShowTooltip(v => !v)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded transition-all duration-150 hover:opacity-90"
        style={{
          background: unlocked
            ? "linear-gradient(135deg,rgba(13,148,136,0.18),rgba(5,150,105,0.18))"
            : isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
          border: `1px solid ${unlocked ? "rgba(13,148,136,0.4)" : border}`,
          borderRadius: 6,
        }}
        title="Your XP balance"
      >
        <Zap
          size={12}
          strokeWidth={2.2}
          style={{ color: unlocked ? "#0d9488" : isDark ? "#4a5568" : "#94a3b8" }}
          fill={unlocked ? "#0d9488" : "none"}
        />
        <span
          className="text-[11px] font-bold tabular-nums"
          style={{ color: unlocked ? "#0d9488" : isDark ? "#6b7a8d" : "#64748b" }}
        >
          {available.toLocaleString()} XP
        </span>
      </button>

      {showTooltip && (
        <div
          className="absolute right-0 top-full mt-1.5 z-50 p-3"
          style={{
            background: popBg,
            border: `1px solid ${border}`,
            borderRadius: 8,
            boxShadow: isDark ? "0 8px 32px rgba(0,0,0,0.5)" : "0 8px 32px rgba(0,0,0,0.12)",
            minWidth: 220,
            animation: "dropdownIn 0.12s ease",
          }}
        >
          {/* Header */}
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-6 h-6 flex items-center justify-center"
              style={{ background: "rgba(13,148,136,0.12)", borderRadius: 4 }}
            >
              <Zap size={12} strokeWidth={2} style={{ color: "#0d9488" }} fill="#0d9488" />
            </div>
            <div>
              <p className="text-[12px] font-bold" style={{ color: txt }}>Health XP</p>
              <p className="text-[10px]" style={{ color: muted }}>Earned from assessments</p>
            </div>
          </div>

          {/* XP numbers */}
          <div
            className="flex justify-between items-center px-3 py-2 mb-3"
            style={{ background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)", borderRadius: 6 }}
          >
            <div className="text-center">
              <p className="text-[18px] font-black leading-none" style={{ color: "#0d9488" }}>
                {available.toLocaleString()}
              </p>
              <p className="text-[9px] font-bold uppercase tracking-wide mt-0.5" style={{ color: muted }}>
                Available
              </p>
            </div>
            <div className="w-px h-8" style={{ background: border }} />
            <div className="text-center">
              <p className="text-[18px] font-black leading-none" style={{ color: txt }}>
                {totalXp.toLocaleString()}
              </p>
              <p className="text-[9px] font-bold uppercase tracking-wide mt-0.5" style={{ color: muted }}>
                Total Earned
              </p>
            </div>
            <div className="w-px h-8" style={{ background: border }} />
            <div className="text-center">
              <p className="text-[18px] font-black leading-none" style={{ color: muted }}>
                {redeemed.toLocaleString()}
              </p>
              <p className="text-[9px] font-bold uppercase tracking-wide mt-0.5" style={{ color: muted }}>
                Redeemed
              </p>
            </div>
          </div>

          {/* Progress bar toward consultation */}
          <div className="mb-2">
            <div className="flex justify-between items-center mb-1.5">
              <p className="text-[10px] font-semibold" style={{ color: muted }}>
                Free Consultation
              </p>
              <p className="text-[10px] font-bold" style={{ color: unlocked ? "#0d9488" : txt }}>
                {available} / {XP_CONSULTATION_THRESHOLD} XP
              </p>
            </div>
            <div
              className="w-full h-1.5 overflow-hidden"
              style={{ background: trackBg, borderRadius: 99 }}
            >
              <div
                className="h-full transition-all duration-700"
                style={{
                  width: `${pct}%`,
                  background: unlocked
                    ? "linear-gradient(90deg,#0d9488,#059669)"
                    : "linear-gradient(90deg,#6366f1,#8b5cf6)",
                  borderRadius: 99,
                }}
              />
            </div>
          </div>

          {unlocked ? (
            <div
              className="flex items-center gap-2 px-3 py-2 mt-2"
              style={{ background: "rgba(13,148,136,0.1)", border: "1px solid rgba(13,148,136,0.25)", borderRadius: 6 }}
            >
              <span className="text-[11px]">🎉</span>
              <p className="text-[11px] font-semibold" style={{ color: "#0d9488" }}>
                You&apos;ve unlocked a free consultation!
              </p>
            </div>
          ) : (
            <p className="text-[10.5px] leading-relaxed" style={{ color: muted }}>
              Earn <strong style={{ color: txt }}>{XP_CONSULTATION_THRESHOLD - available} more XP</strong> by completing assessments to unlock a free doctor consultation.
            </p>
          )}
        </div>
      )}
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
    { icon: User,     label: "My Profile",      action: () => router.push("/dashboard/profile") },
    { icon: Activity, label: "New Assessment",  action: () => router.push("/dashboard/assessment") },
    { icon: Settings, label: "Settings",        action: () => router.push("/dashboard/settings") },
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
  const { user } = useAuth();

  const bg      = isDark ? "#0b0f1a" : "#ffffff";
  const border  = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)";
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
          {/* XP Badge */}
          {user?.id && <XpBadge userId={user.id} isDark={isDark} />}

          {/* Divider */}
          <div
            className="w-px h-5 mx-0.5"
            style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }}
          />

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