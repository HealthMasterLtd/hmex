/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, CheckCheck, Trash2,
  AlertTriangle, Users, Activity, Shield, Settings,
  Clock, Filter, UserPlus, UserMinus, Sparkles,
  TrendingUp, BarChart3, RefreshCw, Zap, Info,
  ChevronDown, Building2,
} from "lucide-react";
import EmployerLayout from "@/components/dashboard/employer/EmployerLayout";
import { useTheme } from "@/contexts/ThemeContext";
import ThemeToggle from "@/components/Themetoggle";
import { useAuth } from "@/hooks/useAuth";
import { useEmployerNotifications } from "@/hooks/useEmployerNotifications";
import {
  clearReadEmployerNotifications,
  getEmployerNotifColor,
  type EmployerNotification,
  type EmployerNotificationCategory,
} from "@/services/employerNotificationsService";
import { getCompanyByOwner } from "@/services/companyService";
import { useEffect, useRef } from "react";

// ─── ICON MAP ─────────────────────────────────────────────────────────────────
function CategoryIcon({
  category,
  type,
  color,
  size = 16,
}: {
  category: EmployerNotificationCategory;
  type: string;
  color: string;
  size?: number;
}) {
  const props = { size, strokeWidth: 1.8, color };
  if (type === "employee_joined" || type === "invite_accepted") return <UserPlus {...props} />;
  if (type === "employee_removed")   return <UserMinus {...props} />;
  if (type === "invite_sent")        return <Users {...props} />;
  if (type === "programs_generated" || type === "programs_refreshed") return <Sparkles {...props} />;
  if (type === "welcome")            return <Building2 {...props} />;
  switch (category) {
    case "risk_alert":         return <AlertTriangle {...props} />;
    case "employee_activity":  return <Users {...props} />;
    case "programs":           return <Sparkles {...props} />;
    case "assessment_rate":    return <TrendingUp {...props} />;
    case "workforce_summary":  return <BarChart3 {...props} />;
    case "compliance":         return <Shield {...props} />;
    default:                   return <Info {...props} />;
  }
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return "Yesterday";
  if (d < 7) return `${d} days ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function priorityLabel(p: string): { label: string; color: string; bg: string } {
  switch (p) {
    case "urgent": return { label: "Urgent",  color: "#EF4444", bg: "rgba(239,68,68,0.1)" };
    case "high":   return { label: "High",    color: "#F97316", bg: "rgba(249,115,22,0.1)" };
    case "medium": return { label: "Medium",  color: "#F59E0B", bg: "rgba(245,158,11,0.1)" };
    default:       return { label: "Low",     color: "#64748B", bg: "rgba(100,116,139,0.08)" };
  }
}

function categoryLabel(cat: EmployerNotificationCategory): string {
  switch (cat) {
    case "risk_alert":         return "Risk Alert";
    case "employee_activity":  return "Team";
    case "programs":           return "Programs";
    case "assessment_rate":    return "Assessments";
    case "workforce_summary":  return "Summary";
    case "compliance":         return "Compliance";
    default:                   return "System";
  }
}

// ─── NOTIFICATION ITEM ────────────────────────────────────────────────────────
function NotificationItem({
  notification,
  c,
  accentColor,
  isDark,
  onMarkRead,
  onDelete,
}: {
  notification: EmployerNotification;
  c: any;
  accentColor: string;
  isDark: boolean;
  onMarkRead: (id: string) => void;
  onDelete:   (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const color   = getEmployerNotifColor(notification);
  const pLabel  = priorityLabel(notification.priority);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.2 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 14,
        padding: "16px 20px",
        background: notification.isRead
          ? "transparent"
          : isDark ? `${color}07` : `${color}05`,
        borderLeft: notification.isRead ? `3px solid transparent` : `3px solid ${color}`,
        transition: "background 0.15s",
        position: "relative",
        cursor: "default",
      }}
    >
      {/* Icon */}
      <div style={{
        width: 40, height: 40, borderRadius: 2, flexShrink: 0,
        background: `${color}15`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <CategoryIcon
          category={notification.category}
          type={notification.type}
          color={color}
          size={17}
        />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", flex: 1 }}>
            <p style={{
              margin: 0, fontSize: 13,
              fontWeight: notification.isRead ? 600 : 800,
              color: c.text, lineHeight: 1.3,
            }}>
              {notification.title}
            </p>
            {!notification.isRead && (
              <span style={{
                width: 7, height: 7, borderRadius: "50%",
                background: color, flexShrink: 0,
              }} />
            )}
          </div>
          <span style={{ fontSize: 11, color: c.muted, flexShrink: 0, marginTop: 1 }}>
            {timeAgo(notification.$createdAt)}
          </span>
        </div>

        <p style={{
          margin: "0 0 10px", fontSize: 12, color: c.muted, lineHeight: 1.65,
        }}>
          {notification.message}
        </p>

        {/* Meta row */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {/* Category tag */}
          <span style={{
            padding: "2px 8px", borderRadius: 2,
            background: `${color}12`, color,
            fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
          }}>
            {categoryLabel(notification.category)}
          </span>

          {/* Priority tag */}
          <span style={{
            padding: "2px 8px", borderRadius: 2,
            background: pLabel.bg, color: pLabel.color,
            fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
          }}>
            {pLabel.label}
          </span>

          {/* Action link */}
          {notification.actionUrl && notification.actionLabel && (
            <a
              href={notification.actionUrl}
              onClick={() => { if (!notification.isRead) onMarkRead(notification.$id); }}
              style={{
                display: "flex", alignItems: "center", gap: 4,
                fontSize: 11, fontWeight: 700, color: accentColor,
                textDecoration: "none",
              }}
            >
              {notification.actionLabel}
              <Activity size={9} />
            </a>
          )}
        </div>
      </div>

      {/* Action buttons on hover */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: "absolute", top: 12, right: 16,
              display: "flex", gap: 6,
            }}
          >
            {!notification.isRead && (
              <button
                onClick={() => onMarkRead(notification.$id)}
                title="Mark as read"
                style={{
                  width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
                  background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                  border: `1px solid ${c.border}`, borderRadius: 2, cursor: "pointer", color: accentColor,
                }}
              >
                <CheckCheck size={12} strokeWidth={2.2} />
              </button>
            )}
            <button
              onClick={() => onDelete(notification.$id)}
              title="Delete"
              style={{
                width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
                background: isDark ? "rgba(239,68,68,0.1)" : "rgba(239,68,68,0.06)",
                border: "1px solid rgba(239,68,68,0.2)", borderRadius: 2, cursor: "pointer", color: "#EF4444",
              }}
            >
              <Trash2 size={12} strokeWidth={2} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function EmployerNotificationsPage() {
  const { user }                         = useAuth();
  const { isDark, surface: c, accentColor } = useTheme();

  const [companyId, setCompanyId] = useState<string | null>(null);
  const [filter,    setFilter]    = useState<"all" | "unread" | EmployerNotificationCategory>("all");
  const [clearing,  setClearing]  = useState(false);

  const {
    notifications,
    unreadCount,
    loading,
    markRead,
    markAllRead,
    remove,
    refresh,
  } = useEmployerNotifications(user?.id);

  // Resolve companyId for clearing read
  useEffect(() => {
    if (!user) return;
    getCompanyByOwner(user.id)
      .then((co) => { if (co) setCompanyId(co.$id); })
      .catch(() => {});
  }, [user]);

  const handleClearRead = async () => {
    if (!user) return;
    setClearing(true);
    await clearReadEmployerNotifications(user.id).catch(() => {});
    await refresh();
    setClearing(false);
  };

  // Filter options
  const FILTER_OPTIONS: { key: typeof filter; label: string }[] = [
    { key: "all",              label: `All (${notifications.length})` },
    { key: "unread",           label: `Unread (${unreadCount})` },
    { key: "risk_alert",       label: "Risk Alerts" },
    { key: "employee_activity",label: "Team Activity" },
    { key: "programs",         label: "Programs" },
    { key: "assessment_rate",  label: "Assessments" },
    { key: "system",           label: "System" },
  ];

  const filtered = notifications.filter((n) => {
    if (filter === "all")    return true;
    if (filter === "unread") return !n.isRead;
    return n.category === filter;
  });

  // Group by date
  const grouped: { label: string; items: EmployerNotification[] }[] = [];
  const today     = new Date(); today.setHours(0,0,0,0);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);

  for (const n of filtered) {
    const d = new Date(n.$createdAt); d.setHours(0,0,0,0);
    const label =
      d.getTime() === today.getTime()     ? "Today" :
      d.getTime() === yesterday.getTime() ? "Yesterday" :
      d.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
    const existing = grouped.find((g) => g.label === label);
    if (existing) existing.items.push(n);
    else grouped.push({ label, items: [n] });
  }

  return (
    <EmployerLayout>
      <div style={{ maxWidth: 780, paddingBottom: 80 }}>

        {/* ── Page Header ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          style={{
            display: "flex", alignItems: "flex-start", justifyContent: "space-between",
            flexWrap: "wrap", gap: 16, marginBottom: 28,
          }}
        >
          <div>
            <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 800, color: accentColor, letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Alerts
            </p>
            <h1 style={{ margin: 0, fontSize: "clamp(1.35rem,3vw,1.7rem)", fontWeight: 900, color: c.text, letterSpacing: "-0.03em", lineHeight: 1.15 }}>
              Notifications
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: c.muted }}>
              Stay updated on workforce activity, risk alerts, and program updates
            </p>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                style={{
                  padding: "8px 14px", background: "transparent",
                  border: `1px solid ${c.border}`, color: c.muted,
                  borderRadius: 2, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 6,
                  fontSize: 12, fontWeight: 600,
                }}
              >
                <CheckCheck size={13} />
                Mark all read
              </button>
            )}
            <button
              onClick={refresh}
              disabled={loading}
              style={{
                padding: "8px 14px", background: "transparent",
                border: `1px solid ${c.border}`, color: c.muted,
                borderRadius: 2, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6,
                fontSize: 12, fontWeight: 600,
              }}
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
            {notifications.some((n) => n.isRead) && (
              <button
                onClick={handleClearRead}
                disabled={clearing}
                style={{
                  padding: "8px 14px", background: "transparent",
                  border: `1px solid ${c.border}`, color: c.muted,
                  borderRadius: 2, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 6,
                  fontSize: 12, fontWeight: 600, opacity: clearing ? 0.5 : 1,
                }}
              >
                <Trash2 size={13} />
                Clear read
              </button>
            )}
          </div>
        </motion.div>

        {/* ── Stats strip ─────────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 10, marginBottom: 24 }}>
          {[
            { label: "Total",      value: notifications.length,                                    color: accentColor },
            { label: "Unread",     value: unreadCount,                                              color: "#EF4444" },
            { label: "Risk Alerts",value: notifications.filter((n) => n.category === "risk_alert").length, color: "#F97316" },
            { label: "Programs",   value: notifications.filter((n) => n.category === "programs").length,   color: "#8B5CF6" },
          ].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              style={{ padding: "12px 16px", background: c.surface, border: `1px solid ${c.border}`, borderRadius: 2 }}
            >
              <p style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 700, color: c.muted, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                {s.label}
              </p>
              <p style={{ margin: 0, fontSize: 24, fontWeight: 900, color: s.color, lineHeight: 1, letterSpacing: "-0.04em" }}>
                {s.value}
              </p>
            </motion.div>
          ))}
        </div>

        {/* ── Filter tabs ─────────────────────────────────────────────── */}
        <div style={{
          display: "flex", gap: 4, flexWrap: "wrap",
          marginBottom: 20, borderBottom: `1px solid ${c.border}`, paddingBottom: 0,
        }}>
          {FILTER_OPTIONS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                padding: "7px 14px", background: "none", border: "none",
                borderBottom: filter === f.key ? `2px solid ${accentColor}` : "2px solid transparent",
                marginBottom: -1, cursor: "pointer",
                fontSize: 12, fontWeight: filter === f.key ? 800 : 500,
                color: filter === f.key ? accentColor : c.muted,
                transition: "color 0.15s",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* ── List ────────────────────────────────────────────────────── */}
        {loading && notifications.length === 0 ? (
          <div style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 2, overflow: "hidden" }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{ padding: "16px 20px", borderBottom: `1px solid ${c.border}`, display: "flex", gap: 14 }}>
                <div className="animate-pulse" style={{ width: 40, height: 40, borderRadius: 2, background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)" }} />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                  <div className="animate-pulse" style={{ height: 13, width: "55%", borderRadius: 2, background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)" }} />
                  <div className="animate-pulse" style={{ height: 11, width: "80%", borderRadius: 2, background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)" }} />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{
              padding: "64px 24px", textAlign: "center",
              background: c.surface, border: `1px solid ${c.border}`, borderRadius: 2,
            }}
          >
            <div style={{
              width: 56, height: 56, borderRadius: 2,
              background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px",
            }}>
              <Bell size={24} strokeWidth={1.2} color={c.muted} />
            </div>
            <p style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 800, color: c.text }}>
              {filter === "all" ? "No notifications yet" : `No ${filter.replace("_", " ")} notifications`}
            </p>
            <p style={{ margin: 0, fontSize: 12, color: c.muted, lineHeight: 1.6 }}>
              {filter === "all"
                ? "Notifications will appear here as your workforce becomes active — invite employees, run assessments, and generate AI programs."
                : "Try switching to 'All' to see everything."}
            </p>
          </motion.div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <AnimatePresence mode="popLayout">
              {grouped.map((group) => (
                <motion.div
                  key={group.label}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 2, overflow: "hidden" }}
                >
                  {/* Group header */}
                  <div style={{
                    padding: "10px 20px",
                    borderBottom: `1px solid ${c.border}`,
                    background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.015)",
                    display: "flex", alignItems: "center", gap: 8,
                  }}>
                    <Clock size={11} style={{ color: c.muted }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: c.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      {group.label}
                    </span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, color: accentColor,
                      background: `${accentColor}15`, padding: "1px 7px", borderRadius: 2,
                    }}>
                      {group.items.length}
                    </span>
                  </div>

                  <AnimatePresence mode="popLayout">
                    {group.items.map((n, i) => (
                      <React.Fragment key={n.$id}>
                        {i > 0 && <div style={{ height: 1, background: c.border, margin: "0" }} />}
                        <NotificationItem
                          notification={n}
                          c={c}
                          accentColor={accentColor}
                          isDark={isDark}
                          onMarkRead={markRead}
                          onDelete={remove}
                        />
                      </React.Fragment>
                    ))}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        <ThemeToggle />
      </div>
    </EmployerLayout>
  );
}