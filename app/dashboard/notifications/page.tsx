"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Bell, CheckCheck, Trash2, AlertTriangle, Lightbulb,
  Trophy, Calendar, Info, Zap, Filter, RefreshCw,
  ExternalLink, ChevronRight, Activity, CheckCircle,
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useRequireAuth } from "@/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { useNotifications } from "@/hooks/useNotifications";
import {
  type AppNotification,
  type NotificationCategory,
  getNotificationColor,
} from "@/services/NotificationsService";
import ThemeToggle from "@/components/Themetoggle";

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
  if (d < 7)  return `${d} days ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
}

// ─── CATEGORY META ───────────────────────────────────────────────────────────
const CATEGORY_META: Record<NotificationCategory | string, { label: string; Icon: React.ElementType }> = {
  risk_alert:     { label: "Risk Alerts",       Icon: AlertTriangle },
  recommendation: { label: "Recommendations",   Icon: Lightbulb },
  xp:             { label: "XP & Rewards",      Icon: Zap },
  milestone:      { label: "Milestones",         Icon: Trophy },
  reminder:       { label: "Reminders",          Icon: Calendar },
  system:         { label: "System",             Icon: Info },
};

function CategoryIcon({ category, size = 15, color }: { category: string; size?: number; color: string }) {
  const meta = CATEGORY_META[category] ?? { Icon: Info };
  return <meta.Icon size={size} strokeWidth={1.8} color={color} />;
}

// ─── SKELETON ────────────────────────────────────────────────────────────────
function NotifSkeleton({ isDark }: { isDark: boolean }) {
  const bg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";
  return (
    <div style={{ display: "flex", gap: 14, padding: "16px 20px", alignItems: "flex-start" }}>
      <div style={{ width: 38, height: 38, borderRadius: "50%", background: bg, flexShrink: 0 }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, paddingTop: 4 }}>
        <div style={{ height: 12, width: "60%", background: bg, borderRadius: 2 }} />
        <div style={{ height: 10, width: "90%", background: bg, borderRadius: 2 }} />
        <div style={{ height: 10, width: "75%", background: bg, borderRadius: 2 }} />
      </div>
    </div>
  );
}

// ─── PRIORITY BADGE ──────────────────────────────────────────────────────────
function PriorityPill({ priority }: { priority: string }) {
  const colors: Record<string, { bg: string; text: string; label: string }> = {
    urgent: { bg: "rgba(239,68,68,0.12)",  text: "#ef4444", label: "Urgent" },
    high:   { bg: "rgba(249,115,22,0.12)", text: "#f97316", label: "High" },
    medium: { bg: "rgba(99,102,241,0.12)", text: "#6366f1", label: "Medium" },
    low:    { bg: "rgba(100,116,139,0.1)", text: "#64748b", label: "Low" },
  };
  const c = colors[priority] ?? colors.low;
  return (
    <span style={{
      fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em",
      padding: "2px 7px", background: c.bg, color: c.text, borderRadius: 2,
    }}>
      {c.label}
    </span>
  );
}

// ─── NOTIFICATION CARD ───────────────────────────────────────────────────────
function NotifCard({
  n, surface: S, accentColor, accentFaint, isDark,
  onMarkRead, onRemove,
}: {
  n: AppNotification;
  surface: {
    surface: string; surfaceAlt: string; border: string;
    text: string; muted: string; subtle: string;
  };
  accentColor: string;
  accentFaint: string;
  isDark: boolean;
  onMarkRead: (id: string) => void;
  onRemove:   (id: string) => void;
}) {
  const router   = useRouter();
  const color    = getNotificationColor(n);
  const [hov, setHov] = useState(false);

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
        display: "flex", gap: 14, padding: "16px 20px",
        background: hov
          ? (isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)")
          : n.isRead
            ? "transparent"
            : (isDark ? `${color}07` : `${color}05`),
        borderLeft: n.isRead ? `3px solid transparent` : `3px solid ${color}`,
        cursor: "pointer",
        transition: "background 0.12s, border-color 0.15s",
        position: "relative",
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={handleClick}
    >
      {/* Icon */}
      <div style={{
        width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
        background: `${color}15`,
        display: "flex", alignItems: "center", justifyContent: "center",
        marginTop: 2,
      }}>
        <CategoryIcon category={n.category} size={16} color={color} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Title row */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
          <p style={{
            fontSize: 13, fontWeight: n.isRead ? 500 : 700,
            color: n.isRead ? S.muted : S.text,
            margin: 0, lineHeight: 1.3,
          }}>
            {n.title}
          </p>
          <PriorityPill priority={n.priority} />
          {!n.isRead && (
            <span style={{
              width: 7, height: 7, borderRadius: "50%",
              background: color, flexShrink: 0,
              boxShadow: `0 0 6px ${color}80`,
            }} />
          )}
        </div>

        {/* Message */}
        <p style={{ fontSize: 12, color: S.muted, margin: "0 0 8px", lineHeight: 1.6 }}>
          {n.message}
        </p>

        {/* Footer row */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span style={{ fontSize: 10, color: S.subtle }}>{timeAgo(n.$createdAt)}</span>

          {n.actionLabel && (
            <button
              onClick={e => {
                e.stopPropagation();
                if (!n.isRead) onMarkRead(n.$id);
                if (n.actionUrl) {
                  if (n.actionUrl.startsWith("http")) window.open(n.actionUrl, "_blank");
                  else router.push(n.actionUrl);
                }
              }}
              style={{
                display: "flex", alignItems: "center", gap: 4,
                fontSize: 11, fontWeight: 700, color: accentColor,
                background: "none", border: "none", cursor: "pointer", padding: 0,
              }}
            >
              {n.actionLabel}
              <ExternalLink size={9} strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>

      {/* Action buttons (hover) */}
      {hov && (
        <div style={{ display: "flex", gap: 5, alignItems: "flex-start", marginTop: 2 }}>
          {!n.isRead && (
            <button
              onClick={e => { e.stopPropagation(); onMarkRead(n.$id); }}
              title="Mark as read"
              style={{
                width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center",
                background: accentFaint, border: `1px solid ${accentColor}30`,
                cursor: "pointer", color: accentColor, borderRadius: 2,
              }}
            >
              <CheckCircle size={12} strokeWidth={2} />
            </button>
          )}
          <button
            onClick={e => { e.stopPropagation(); onRemove(n.$id); }}
            title="Delete"
            style={{
              width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
              cursor: "pointer", color: "#ef4444", borderRadius: 2,
            }}
          >
            <Trash2 size={11} strokeWidth={2} />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── FILTER TABS ─────────────────────────────────────────────────────────────
const FILTER_OPTIONS: Array<{ key: string; label: string; Icon: React.ElementType }> = [
  { key: "all",           label: "All",          Icon: Bell },
  { key: "unread",        label: "Unread",        Icon: Bell },
  { key: "risk_alert",    label: "Risk Alerts",   Icon: AlertTriangle },
  { key: "recommendation",label: "Tips",          Icon: Lightbulb },
  { key: "xp",            label: "XP",            Icon: Zap },
  { key: "milestone",     label: "Milestones",    Icon: Trophy },
  { key: "reminder",      label: "Reminders",     Icon: Calendar },
];

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function NotificationsPage() {
  const auth    = useRequireAuth();
  const router  = useRouter();
  const { isDark, surface: S, accentColor, accentFaint } = useTheme();

  const [activeFilter, setActiveFilter] = useState("all");

  const {
    notifications, unreadCount, loading, error,
    markRead, markAllRead, remove, clearRead, refresh,
  } = useNotifications(auth.user?.id);

  // ── Filter ────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (activeFilter === "unread") return notifications.filter(n => !n.isRead);
    if (activeFilter === "all")   return notifications;
    return notifications.filter(n => n.category === activeFilter);
  }, [notifications, activeFilter]);

  // ── Group by day ─────────────────────────────────────────────────────────
  const grouped = useMemo(() => {
    const map = new Map<string, AppNotification[]>();
    for (const n of filtered) {
      const key = fmtDate(n.$createdAt);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(n);
    }
    return Array.from(map.entries());
  }, [filtered]);

  if (auth.loading) return null;

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>

        {/* ── PAGE HEADER ── */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <p style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.18em", color: accentColor, margin: "0 0 4px" }}>
                Notifications
              </p>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: S.text, margin: 0, letterSpacing: "-0.03em" }}>
                Your Activity Feed
              </h1>
              {unreadCount > 0 && (
                <p style={{ fontSize: 12, color: S.muted, margin: "4px 0 0" }}>
                  You have <strong style={{ color: S.text }}>{unreadCount} unread</strong> notification{unreadCount !== 1 ? "s" : ""}
                </p>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                onClick={refresh}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "7px 12px", background: S.surfaceAlt,
                  border: `1px solid ${S.border}`, color: S.muted,
                  fontSize: 12, fontWeight: 600, cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                <RefreshCw size={12} strokeWidth={2} className={loading ? "animate-spin" : ""} />
                Refresh
              </button>

              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "7px 12px", background: accentFaint,
                    border: `1px solid ${accentColor}30`, color: accentColor,
                    fontSize: 12, fontWeight: 700, cursor: "pointer",
                    transition: "opacity 0.15s",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = "0.8"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
                >
                  <CheckCheck size={13} strokeWidth={2} />
                  Mark all read
                </button>
              )}

              {notifications.some(n => n.isRead) && (
                <button
                  onClick={clearRead}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "7px 12px", background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444",
                    fontSize: 12, fontWeight: 600, cursor: "pointer",
                    transition: "opacity 0.15s",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = "0.75"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
                >
                  <Trash2 size={12} strokeWidth={2} />
                  Clear read
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── FILTER TABS ── */}
        <div style={{
          display: "flex", gap: 4, flexWrap: "wrap",
          padding: "10px 0", marginBottom: 16,
          borderBottom: `1px solid ${S.border}`,
        }}>
          {FILTER_OPTIONS.map(({ key, label, Icon }) => {
            const isActive = activeFilter === key;
            const cnt = key === "unread"
              ? unreadCount
              : key === "all"
                ? notifications.length
                : notifications.filter(n => n.category === key).length;

            return (
              <button
                key={key}
                onClick={() => setActiveFilter(key)}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "5px 11px",
                  background: isActive ? accentFaint : "transparent",
                  border: `1px solid ${isActive ? accentColor + "50" : S.border}`,
                  color: isActive ? accentColor : S.muted,
                  fontSize: 11, fontWeight: isActive ? 700 : 500,
                  cursor: "pointer", transition: "all 0.15s",
                }}
              >
                <Icon size={11} strokeWidth={2} />
                {label}
                {cnt > 0 && (
                  <span style={{
                    fontSize: 9, fontWeight: 800, minWidth: 16, height: 16,
                    padding: "0 4px", borderRadius: 2,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: isActive ? accentColor : S.surfaceAlt,
                    color: isActive ? "#fff" : S.muted,
                  }}>
                    {cnt}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── ERROR ── */}
        {error && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", marginBottom: 16,
            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
          }}>
            <AlertTriangle size={14} color="#ef4444" />
            <p style={{ fontSize: 12, color: "#ef4444", margin: 0, flex: 1 }}>{error}</p>
            <button onClick={refresh} style={{ fontSize: 11, fontWeight: 700, color: "#ef4444", background: "none", border: "none", cursor: "pointer" }}>
              Retry
            </button>
          </div>
        )}

        {/* ── LIST ── */}
        {loading && notifications.length === 0 ? (
          <div style={{ background: S.surface, border: `1px solid ${S.border}` }}>
            {[1, 2, 3, 4].map(i => (
              <React.Fragment key={i}>
                {i > 1 && <div style={{ height: 1, background: S.border, margin: "0 20px" }} />}
                <NotifSkeleton isDark={isDark} />
              </React.Fragment>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", padding: "64px 20px", gap: 14,
            background: S.surface, border: `1px solid ${S.border}`,
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              background: accentFaint,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Bell size={24} strokeWidth={1.4} color={accentColor} />
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: 15, fontWeight: 800, color: S.text, margin: "0 0 6px", letterSpacing: "-0.02em" }}>
                {activeFilter === "unread" ? "No unread notifications" : "No notifications here"}
              </p>
              <p style={{ fontSize: 12, color: S.muted, margin: 0, maxWidth: 280, lineHeight: 1.6 }}>
                {activeFilter === "unread"
                  ? "You're all caught up! New notifications will appear here after your next assessment."
                  : "Complete a health assessment to start receiving personalised risk alerts and recommendations."}
              </p>
            </div>
            <button
              onClick={() => router.push("/dashboard/assessment")}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "9px 18px", marginTop: 4,
                background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`,
                border: "none", color: "#fff",
                fontSize: 12, fontWeight: 700, cursor: "pointer",
                boxShadow: `0 4px 14px ${accentColor}40`,
                transition: "opacity 0.15s",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = "0.88"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
            >
              <Activity size={13} strokeWidth={2.5} />
              Take an Assessment
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {grouped.map(([day, notifs]) => (
              <div key={day}>
                {/* Day label */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 10, marginBottom: 8,
                }}>
                  <p style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", color: S.subtle, margin: 0, whiteSpace: "nowrap" }}>
                    {day}
                  </p>
                  <div style={{ flex: 1, height: 1, background: S.border }} />
                </div>

                {/* Cards */}
                <div style={{ background: S.surface, border: `1px solid ${S.border}`, overflow: "hidden" }}>
                  {notifs.map((n, i) => (
                    <React.Fragment key={n.$id}>
                      {i > 0 && <div style={{ height: 1, background: S.border, margin: "0 20px" }} />}
                      <NotifCard
                        n={n}
                        surface={S}
                        accentColor={accentColor}
                        accentFaint={accentFaint}
                        isDark={isDark}
                        onMarkRead={markRead}
                        onRemove={remove}
                      />
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}

            {/* End of feed */}
            {filtered.length >= 20 && (
              <p style={{ textAlign: "center", fontSize: 11, color: S.subtle, padding: "8px 0" }}>
                Showing most recent 30 notifications
              </p>
            )}
          </div>
        )}
      </div>
      <ThemeToggle />
    </DashboardLayout>
  );
}