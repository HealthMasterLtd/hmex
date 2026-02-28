"use client";

import React, { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu, Bell, ChevronRight, LogOut, User, Settings, Activity, Zap,
  CheckCheck, Trash2, ExternalLink, AlertTriangle, Lightbulb,
  Trophy, Calendar, Info, RefreshCw,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/hooks/useAuth";
import { fetchUserXp, type UserXpRecord } from "@/services/AppwriteService";
import { useNotifications } from "@/hooks/useNotifications";
import {
  type AppNotification,
  getNotificationColor,
  getNotificationIcon,
} from "@/services/NotificationsService";

const XP_THRESHOLD = 300;

const BREADCRUMB_MAP: Record<string, string> = {
  "/dashboard":                 "Overview",
  "/dashboard/history":         "History",
  "/dashboard/profile":         "My Profile",
  "/dashboard/settings":        "Settings",
  "/dashboard/help":            "Help & Support",
  "/dashboard/notifications":   "Notifications",
  "/dashboard/assessment":      "New Assessment",
  "/dashboard/review":          "Full Report",
  "/dashboard/recommendations": "Recommendations",
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return "Yesterday";
  return `${d} days ago`;
}

function CategoryIcon({ category, color }: { category: string; color: string }) {
  const size = 13;
  const sw   = 1.8;
  const props = { size, strokeWidth: sw, color };
  switch (category) {
    case "risk_alert":     return <AlertTriangle {...props} />;
    case "recommendation": return <Lightbulb {...props} />;
    case "xp":             return <Zap {...props} fill={color} />;
    case "milestone":      return <Trophy {...props} />;
    case "reminder":       return <Calendar {...props} />;
    default:               return <Info {...props} />;
  }
}

// ─── BREADCRUMBS ─────────────────────────────────────────────────────────────
function Breadcrumbs() {
  const pathname = usePathname();
  const { surface: S } = useTheme();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length <= 1) {
    return (
      <p style={{ fontSize: 13, fontWeight: 600, color: S.text, letterSpacing: "-0.01em", margin: 0 }}>
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
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      {crumbs.map((c, i) => (
        <React.Fragment key={c.href}>
          {i > 0 && <ChevronRight size={11} strokeWidth={2} color={S.muted} />}
          <span style={{
            fontSize: 12,
            letterSpacing: "-0.01em",
            color:      i === crumbs.length - 1 ? S.text : S.muted,
            fontWeight: i === crumbs.length - 1 ? 700  : 400,
          }}>
            {c.label}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── XP BADGE ────────────────────────────────────────────────────────────────
function XpBadge({ userId }: { userId: string }) {
  const { surface: S, accentColor, accentFaint, isDark } = useTheme();
  const [xp,   setXp]   = useState<UserXpRecord | null>(null);
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchUserXp(userId).then(setXp).catch(() => {}); }, [userId]);
  useEffect(() => {
    if (!show) return;
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setShow(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [show]);

  const total     = xp?.totalXp     ?? 0;
  const redeemed  = xp?.redeemedXp  ?? 0;
  const available = total - redeemed;
  const pct       = Math.min((available / XP_THRESHOLD) * 100, 100);
  const unlocked  = available >= XP_THRESHOLD;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setShow(v => !v)}
        style={{
          display: "flex", alignItems: "center", gap: 6, padding: "6px 10px",
          background: unlocked ? accentFaint : S.surfaceAlt,
          border: `1px solid ${unlocked ? accentColor + "50" : S.border}`,
          cursor: "pointer", transition: "all 0.15s",
        }}
        title="Your XP balance"
      >
        <Zap size={12} strokeWidth={2.2}
          color={unlocked ? accentColor : S.muted}
          fill={unlocked ? accentColor : "none"}
        />
        <span style={{ fontSize: 11, fontWeight: 700, color: unlocked ? accentColor : S.muted }}>
          {available.toLocaleString()} XP
        </span>
      </button>

      {show && (
        <div style={{
          position: "absolute", right: 0, top: "calc(100% + 8px)", zIndex: 50,
          background: S.surface, border: `1px solid ${S.border}`,
          boxShadow: isDark ? "0 12px 40px rgba(0,0,0,0.55)" : "0 12px 40px rgba(0,0,0,0.14)",
          minWidth: 224, padding: 14,
          animation: "dropIn 0.12s ease",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{ width: 26, height: 26, background: accentFaint, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Zap size={13} strokeWidth={2} color={accentColor} fill={accentColor} />
            </div>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: S.text, margin: 0 }}>Health XP</p>
              <p style={{ fontSize: 10, color: S.muted, margin: 0 }}>Earned from assessments</p>
            </div>
          </div>

          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1px 1fr 1px 1fr", gap: 0,
            background: S.surfaceAlt, padding: "10px 12px", marginBottom: 12,
          }}>
            {[
              { val: available, lbl: "Available", color: accentColor },
              { val: total,     lbl: "Total",     color: S.text },
              { val: redeemed,  lbl: "Redeemed",  color: S.muted },
            ].map((item, i) => (
              <React.Fragment key={i}>
                {i > 0 && <div style={{ width: 1, background: S.border, margin: "0 4px" }} />}
                <div style={{ textAlign: "center", padding: "0 4px" }}>
                  <p style={{ fontSize: 18, fontWeight: 900, color: item.color, margin: 0, letterSpacing: "-0.04em" }}>
                    {item.val.toLocaleString()}
                  </p>
                  <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: S.muted, margin: 0, marginTop: 2 }}>
                    {item.lbl}
                  </p>
                </div>
              </React.Fragment>
            ))}
          </div>

          <div style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <p style={{ fontSize: 10, color: S.muted, margin: 0 }}>Free Consultation</p>
              <p style={{ fontSize: 10, fontWeight: 700, color: unlocked ? accentColor : S.text, margin: 0 }}>
                {available} / {XP_THRESHOLD} XP
              </p>
            </div>
            <div style={{ height: 5, background: S.surfaceAlt, overflow: "hidden" }}>
              <div style={{
                height: "100%", width: `${pct}%`,
                background: unlocked
                  ? `linear-gradient(90deg, ${accentColor}, ${accentColor}cc)`
                  : "linear-gradient(90deg, #6366f1, #8b5cf6)",
                transition: "width 0.7s ease",
              }} />
            </div>
          </div>

          {unlocked ? (
            <div style={{ padding: "8px 10px", background: accentFaint, border: `1px solid ${accentColor}30` }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: accentColor, margin: 0 }}>
                🎉 You&apos;ve unlocked a free consultation!
              </p>
            </div>
          ) : (
            <p style={{ fontSize: 11, color: S.muted, lineHeight: 1.5, margin: 0 }}>
              Earn <strong style={{ color: S.text }}>{XP_THRESHOLD - available} more XP</strong> to unlock a free doctor consultation.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── NOTIFICATION ITEM ───────────────────────────────────────────────────────
function NotifItem({
  n, S, accentColor, accentFaint, isDark,
  onMarkRead, onRemove,
}: {
  n: AppNotification;
  S: { surface: string; surfaceAlt: string; border: string; text: string; muted: string; subtle: string };
  accentColor: string;
  accentFaint: string;
  isDark: boolean;
  onMarkRead: (id: string) => void;
  onRemove:   (id: string) => void;
}) {
  const router = useRouter();
  const color  = getNotificationColor(n);
  const [hovered, setHovered] = useState(false);

  const handleClick = () => {
    if (!n.isRead) onMarkRead(n.$id);
    if (n.actionUrl) {
      if (n.actionUrl.startsWith("http")) window.open(n.actionUrl, "_blank");
      else router.push(n.actionUrl);
    }
  };

  return (
    <div
      style={{
        display: "flex", gap: 10, padding: "10px 14px",
        background: hovered
          ? (isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.025)")
          : n.isRead
            ? "transparent"
            : (isDark ? `${color}08` : `${color}06`),
        borderLeft: n.isRead ? "none" : `3px solid ${color}`,
        cursor: "pointer",
        transition: "background 0.12s",
        position: "relative",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleClick}
    >
      {/* Icon circle */}
      <div style={{
        width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
        background: `${color}18`,
        display: "flex", alignItems: "center", justifyContent: "center",
        marginTop: 2,
      }}>
        <CategoryIcon category={n.category} color={color} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 6 }}>
          <p style={{
            fontSize: 12, fontWeight: n.isRead ? 500 : 700,
            color: n.isRead ? S.muted : S.text,
            margin: 0, lineHeight: 1.35,
          }}>
            {n.title}
          </p>
          <span style={{ fontSize: 10, color: S.subtle, flexShrink: 0, marginTop: 1 }}>
            {timeAgo(n.$createdAt)}
          </span>
        </div>

        <p style={{
          fontSize: 11, color: S.muted, margin: "3px 0 0",
          lineHeight: 1.5,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        } as React.CSSProperties}>
          {n.message}
        </p>

        {n.actionLabel && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 5 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: accentColor }}>
              {n.actionLabel}
            </span>
            <ExternalLink size={9} strokeWidth={2.5} color={accentColor} />
          </div>
        )}
      </div>

      {/* Delete button (appears on hover) */}
      {hovered && (
        <button
          onClick={e => { e.stopPropagation(); onRemove(n.$id); }}
          style={{
            position: "absolute", top: 8, right: 8,
            width: 20, height: 20,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: isDark ? "rgba(239,68,68,0.15)" : "rgba(239,68,68,0.1)",
            border: "none", cursor: "pointer", borderRadius: 2,
            color: "#ef4444",
          }}
          title="Delete"
        >
          <Trash2 size={10} strokeWidth={2} />
        </button>
      )}
    </div>
  );
}

// ─── NOTIFICATIONS BELL DROPDOWN ────────────────────────────────────────────
function NotificationsBell({ userId }: { userId: string }) {
  const { surface: S, accentColor, accentFaint, isDark } = useTheme();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { notifications, unreadCount, loading, markRead, markAllRead, remove, refresh } =
    useNotifications(userId);

  useEffect(() => {
    if (!open) return;
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [open]);

  const handleOpen = () => {
    setOpen(v => !v);
    if (!open) refresh();
  };

  // Show only the 6 most recent in the dropdown; rest on the full page
  const preview = notifications.slice(0, 6);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        style={{
          position: "relative", width: 30, height: 30,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: open ? S.surfaceAlt : S.surfaceAlt,
          border: `1px solid ${open ? accentColor + "60" : S.border}`,
          color: open ? accentColor : S.muted,
          cursor: "pointer", transition: "all 0.14s",
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = accentColor; }}
        onMouseLeave={e => {
          if (!open) (e.currentTarget as HTMLElement).style.color = S.muted;
        }}
      >
        <Bell size={13} strokeWidth={2} />

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span style={{
            position: "absolute", top: -4, right: -4,
            minWidth: 16, height: 16, padding: "0 3px",
            background: unreadCount > 0 && notifications.some(n => n.priority === "urgent" || n.priority === "high")
              ? "#ef4444" : accentColor,
            borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 9, fontWeight: 900, color: "#fff",
            border: `2px solid ${S.surface}`,
            animation: "pulse 2s infinite",
          }}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div style={{
          position: "absolute", right: 0, top: "calc(100% + 8px)", zIndex: 50,
          background: S.surface, border: `1px solid ${S.border}`,
          boxShadow: isDark ? "0 16px 48px rgba(0,0,0,0.6)" : "0 16px 40px rgba(0,0,0,0.14)",
          width: 340,
          animation: "dropIn 0.12s ease",
          overflow: "hidden",
        }}>
          {/* Header */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 14px 10px",
            borderBottom: `1px solid ${S.border}`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Bell size={13} strokeWidth={2} color={accentColor} />
              <p style={{ fontSize: 13, fontWeight: 800, color: S.text, margin: 0 }}>Notifications</p>
              {unreadCount > 0 && (
                <span style={{
                  fontSize: 10, fontWeight: 800, color: "#fff",
                  background: accentColor, padding: "1px 7px", borderRadius: 2,
                }}>
                  {unreadCount} new
                </span>
              )}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={() => refresh()}
                style={{ background: "none", border: "none", cursor: "pointer", color: S.muted, padding: 3 }}
                title="Refresh"
              >
                <RefreshCw size={11} strokeWidth={2} className={loading ? "animate-spin" : ""} />
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  style={{ background: "none", border: "none", cursor: "pointer", color: accentColor, fontSize: 10, fontWeight: 700, padding: 3 }}
                  title="Mark all read"
                >
                  <CheckCheck size={13} strokeWidth={2} />
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div style={{ maxHeight: 360, overflowY: "auto" }}>
            {loading && notifications.length === 0 ? (
              <div style={{ padding: "24px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{ display: "flex", gap: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: "50%", background: S.surfaceAlt, flexShrink: 0 }} />
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                      <div style={{ height: 10, width: "70%", background: S.surfaceAlt, borderRadius: 2 }} />
                      <div style={{ height: 9,  width: "90%", background: S.surfaceAlt, borderRadius: 2 }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : preview.length === 0 ? (
              <div style={{ padding: "32px 14px", textAlign: "center" }}>
                <Bell size={28} strokeWidth={1.2} color={S.subtle} style={{ display: "block", margin: "0 auto 10px" }} />
                <p style={{ fontSize: 13, fontWeight: 600, color: S.text, margin: "0 0 4px" }}>All caught up!</p>
                <p style={{ fontSize: 11, color: S.muted, margin: 0 }}>
                  Complete an assessment to receive personalised notifications.
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {preview.map((n, i) => (
                  <React.Fragment key={n.$id}>
                    {i > 0 && <div style={{ height: 1, background: S.border, margin: "0 14px" }} />}
                    <NotifItem
                      n={n}
                      S={S}
                      accentColor={accentColor}
                      accentFaint={accentFaint}
                      isDark={isDark}
                      onMarkRead={id => { markRead(id); }}
                      onRemove={remove}
                    />
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div style={{ borderTop: `1px solid ${S.border}`, padding: "8px 14px" }}>
              <button
                onClick={() => { router.push("/dashboard/notifications"); setOpen(false); }}
                style={{
                  width: "100%", padding: "8px",
                  background: accentFaint, border: `1px solid ${accentColor}30`,
                  color: accentColor, fontSize: 11, fontWeight: 700,
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                  transition: "opacity 0.15s",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = "0.8"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
              >
                View all {notifications.length} notifications
                <ChevronRight size={11} strokeWidth={2.5} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── USER DROPDOWN ───────────────────────────────────────────────────────────
function UserDropdown() {
  const { surface: S, accentColor, isDark } = useTheme();
  const { user, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [open]);

  const items = [
    { icon: User,     label: "My Profile",     action: () => router.push("/dashboard/profile") },
    { icon: Activity, label: "New Assessment",  action: () => router.push("/dashboard/assessment") },
    { icon: Settings, label: "Settings",        action: () => router.push("/dashboard/settings") },
  ];

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: "flex", alignItems: "center", gap: 8, padding: "5px 8px",
          background: open ? S.surfaceAlt : "transparent",
          border: `1px solid ${open ? S.border : "transparent"}`,
          cursor: "pointer", transition: "all 0.14s",
        }}
      >
        <div style={{
          width: 26, height: 26, flexShrink: 0,
          background: `linear-gradient(135deg, ${accentColor}, ${accentColor}bb)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 900, color: "#fff",
        }}>
          {user?.name?.charAt(0).toUpperCase() || "U"}
        </div>
        <span className="hidden sm:block" style={{ fontSize: 12, fontWeight: 600, color: S.text }}>
          {user?.name?.split(" ")[0] || "User"}
        </span>
      </button>

      {open && (
        <div style={{
          position: "absolute", right: 0, top: "calc(100% + 6px)", zIndex: 50,
          background: S.surface, border: `1px solid ${S.border}`,
          boxShadow: isDark ? "0 12px 40px rgba(0,0,0,0.55)" : "0 12px 40px rgba(0,0,0,0.14)",
          minWidth: 180, paddingTop: 6, paddingBottom: 6,
          animation: "dropIn 0.12s ease",
        }}>
          <div style={{ padding: "8px 12px 8px", borderBottom: `1px solid ${S.border}`, marginBottom: 4 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: S.text, margin: 0 }}>{user?.name}</p>
            <p style={{ fontSize: 11, color: S.muted, margin: 0 }}>{user?.email}</p>
          </div>

          {items.map(item => (
            <button
              key={item.label}
              onClick={() => { item.action(); setOpen(false); }}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                width: "100%", padding: "8px 12px",
                background: "none", border: "none",
                color: S.muted, fontSize: 12, cursor: "pointer",
                transition: "all 0.1s",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = S.surfaceAlt;
                (e.currentTarget as HTMLElement).style.color = S.text;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = "none";
                (e.currentTarget as HTMLElement).style.color = S.muted;
              }}
            >
              <item.icon size={13} strokeWidth={1.8} />
              {item.label}
            </button>
          ))}

          <div style={{ borderTop: `1px solid ${S.border}`, margin: "4px 0" }} />

          <button
            onClick={() => { logout(); setOpen(false); }}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              width: "100%", padding: "8px 12px",
              background: "none", border: "none",
              color: S.muted, fontSize: 12, cursor: "pointer", transition: "all 0.1s",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.07)";
              (e.currentTarget as HTMLElement).style.color = "#ef4444";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = "none";
              (e.currentTarget as HTMLElement).style.color = S.muted;
            }}
          >
            <LogOut size={13} strokeWidth={1.8} />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

// ─── HEADER ──────────────────────────────────────────────────────────────────
export default function DashboardHeader({ onMobileMenuOpen }: { onMobileMenuOpen: () => void }) {
  const { surface: S, accentColor } = useTheme();
  const { user } = useAuth();

  return (
    <>
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 16px", height: 56, flexShrink: 0, zIndex: 30,
        background: S.surface, borderBottom: `1px solid ${S.border}`,
      }}>
        {/* Left */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <button
            onClick={onMobileMenuOpen}
            className="lg:hidden"
            style={{
              width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
              background: S.surfaceAlt, border: `1px solid ${S.border}`,
              color: S.muted, cursor: "pointer",
            }}
          >
            <Menu size={14} strokeWidth={2} />
          </button>
          <Breadcrumbs />
        </div>

        {/* Right */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {user?.id && <XpBadge userId={user.id} />}

          <div style={{ width: 1, height: 20, background: S.border, margin: "0 2px" }} />

          {/* Live notifications bell */}
          {user?.id && <NotificationsBell userId={user.id} />}

          <div style={{ width: 1, height: 20, background: S.border, margin: "0 2px" }} />

          <UserDropdown />
        </div>
      </header>

      <style>{`
        @keyframes dropIn {
          from { transform: translateY(-5px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.65; }
        }
      `}</style>
    </>
  );
}