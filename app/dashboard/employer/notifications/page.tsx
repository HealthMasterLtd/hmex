"use client";

import React, { useState } from "react";
import {
  Bell, CheckCheck, Trash2, AlertTriangle,
  Calendar, Users, FileText, Shield,
  Settings, Clock, Filter,
} from "lucide-react";
import EmployerLayout from "@/components/dashboard/employer/EmployerLayout";
import { Card } from "@/components/dashboard/Dashboardwidgets";
import ThemeToggle from "@/components/Themetoggle";

const COLORS = {
  navy: "#0f172a",
  white: "#ffffff",
  blue: "#2563eb",
  teal: "#0d9488",
  low: "#22c55e",
  moderate: "#f97316",
  high: "#ef4444",
  border: "#e2e8f0",
  muted: "#64748b",
  subtle: "#94a3b8",
  hover: "#f8fafc",
};

// ─── MOCK NOTIFICATIONS ───────────────────────────────────────────────────
const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    type: "alert",
    title: "High Risk Employees Detected",
    message: "8 employees have been identified as high risk. Review recommended.",
    timestamp: "2026-03-07T09:30:00",
    read: false,
    icon: AlertTriangle,
    color: COLORS.high,
  },
  {
    id: 2,
    type: "info",
    title: "New Assessment Completed",
    message: "24 employees completed their health assessments this week.",
    timestamp: "2026-03-06T14:15:00",
    read: false,
    icon: Users,
    color: COLORS.blue,
  },
  {
    id: 3,
    type: "success",
    title: "Compliance Report Ready",
    message: "Q1 2026 compliance report is now available for download.",
    timestamp: "2026-03-05T11:00:00",
    read: true,
    icon: Shield,
    color: COLORS.low,
  },
  {
    id: 4,
    type: "reminder",
    title: "Upcoming Health Program",
    message: "Blood Pressure Screening starts in 3 days.",
    timestamp: "2026-03-04T10:00:00",
    read: true,
    icon: Calendar,
    color: COLORS.moderate,
  },
  {
    id: 5,
    type: "update",
    title: "Privacy Policy Updated",
    message: "Terms of service and privacy policy have been updated.",
    timestamp: "2026-03-03T16:20:00",
    read: true,
    icon: FileText,
    color: COLORS.teal,
  },
];

// ─── NOTIFICATION ITEM ─────────────────────────────────────────────────────
function NotificationItem({ 
  notification,
  onMarkRead,
  onDelete,
}: { 
  notification: typeof MOCK_NOTIFICATIONS[0];
  onMarkRead: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  const Icon = notification.icon;
  const [showDelete, setShowDelete] = useState(false);
  
  return (
    <div 
      style={{
        padding: "16px 20px",
        background: notification.read ? COLORS.white : `${notification.color}05`,
        borderBottom: `1px solid ${COLORS.border}`,
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        position: "relative",
      }}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      <div style={{
        width: 40,
        height: 40,
        background: `${notification.color}10`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}>
        <Icon size={18} color={notification.color} />
      </div>
      
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: COLORS.navy, margin: 0 }}>
            {notification.title}
          </p>
          {!notification.read && (
            <span style={{
              width: 8,
              height: 8,
              background: notification.color,
            }} />
          )}
        </div>
        
        <p style={{ fontSize: 13, color: COLORS.muted, margin: "0 0 8px" }}>
          {notification.message}
        </p>
        
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Clock size={12} color={COLORS.subtle} />
            <span style={{ fontSize: 11, color: COLORS.subtle }}>
              {new Date(notification.timestamp).toLocaleString()}
            </span>
          </div>
          
          {!notification.read && (
            <button
              onClick={() => onMarkRead(notification.id)}
              style={{
                fontSize: 11,
                color: COLORS.blue,
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              Mark as read
            </button>
          )}
        </div>
      </div>
      
      {showDelete && (
        <button
          onClick={() => onDelete(notification.id)}
          style={{
            padding: 6,
            background: "transparent",
            border: `1px solid ${COLORS.border}`,
            color: COLORS.muted,
            cursor: "pointer",
            position: "absolute",
            right: 16,
            top: 16,
          }}
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────
export default function EmployerNotificationsPage() {
  const [filter, setFilter] = useState("all");
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  const handleMarkAllRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
  };
  
  const handleMarkRead = (id: number) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };
  
  const handleDelete = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };
  
  const filteredNotifications = filter === "all" 
    ? notifications 
    : filter === "unread" 
      ? notifications.filter(n => !n.read)
      : notifications;
  
  return (
    <EmployerLayout>
      <div style={{ paddingBottom: 48 }}>
        
        {/* Page Header */}
        <div style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 28,
        }}>
          <div>
            <p style={{
              margin: 0,
              marginBottom: 5,
              fontSize: 10.5,
              fontWeight: 800,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: COLORS.blue,
            }}>
              Alerts
            </p>
            <h1 style={{
              margin: 0,
              fontSize: "clamp(1.4rem, 3vw, 1.75rem)",
              fontWeight: 900,
              color: COLORS.navy,
              letterSpacing: "-0.025em",
              lineHeight: 1.15,
            }}>
              Notifications
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: COLORS.muted }}>
              Stay updated with important alerts and announcements
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                style={{
                  padding: "8px 16px",
                  background: "transparent",
                  border: `1px solid ${COLORS.border}`,
                  color: COLORS.muted,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <CheckCheck size={13} />
                Mark all as read
              </button>
            )}
            <button style={{
              padding: "8px 16px",
              background: COLORS.blue,
              border: "none",
              color: "#fff",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}>
              <Settings size={13} />
              Preferences
            </button>
          </div>
        </div>

        {/* Filters */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={() => setFilter("all")}
              style={{
                padding: "6px 12px",
                fontSize: 12,
                fontWeight: 600,
                background: filter === "all" ? COLORS.blue : "transparent",
                color: filter === "all" ? "#fff" : COLORS.muted,
                border: `1px solid ${filter === "all" ? COLORS.blue : COLORS.border}`,
                cursor: "pointer",
              }}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter("unread")}
              style={{
                padding: "6px 12px",
                fontSize: 12,
                fontWeight: 600,
                background: filter === "unread" ? COLORS.blue : "transparent",
                color: filter === "unread" ? "#fff" : COLORS.muted,
                border: `1px solid ${filter === "unread" ? COLORS.blue : COLORS.border}`,
                cursor: "pointer",
              }}
            >
              Unread ({unreadCount})
            </button>
          </div>

          <button style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "6px 12px",
            fontSize: 12,
            background: "transparent",
            border: `1px solid ${COLORS.border}`,
            color: COLORS.muted,
            cursor: "pointer",
          }}>
            <Filter size={12} />
            Filter
          </button>
        </div>

        {/* Notifications List - Using Card without style prop */}
        <Card>
          {filteredNotifications.length > 0 ? (
            <div>
              {filteredNotifications.map(notification => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkRead={handleMarkRead}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
            <div style={{
              padding: "60px 24px",
              textAlign: "center",
            }}>
              <Bell size={40} style={{ color: COLORS.subtle, marginBottom: 16 }} />
              <h3 style={{ fontSize: 16, fontWeight: 700, color: COLORS.navy, margin: 0 }}>
                No notifications
              </h3>
              <p style={{ fontSize: 13, color: COLORS.muted, margin: "8px 0 0" }}>
                You&lsquo;re all caught up! Check back later for updates.
              </p>
            </div>
          )}
        </Card>

        <ThemeToggle />
      </div>
    </EmployerLayout>
  );
}