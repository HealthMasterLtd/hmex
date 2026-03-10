"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  fetchEmployerNotifications,
  fetchEmployerUnreadCount,
  markEmployerNotifAsRead,
  markAllEmployerNotifsAsRead,
  deleteEmployerNotification,
  type EmployerNotification,
} from "@/services/employerNotificationsService";

interface UseEmployerNotificationsReturn {
  notifications:  EmployerNotification[];
  unreadCount:    number;
  loading:        boolean;
  markRead:       (id: string) => void;
  markAllRead:    () => void;
  remove:         (id: string) => void;
  refresh:        () => void;
}

/**
 * Hook that manages employer notifications state with:
 * - Initial load on mount
 * - Polling every 60 seconds for new notifications
 * - Optimistic UI updates for read/delete actions
 */
export function useEmployerNotifications(
  employerId: string | undefined
): UseEmployerNotificationsReturn {
  const [notifications, setNotifications] = useState<EmployerNotification[]>([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [loading,       setLoading]       = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    if (!employerId) return;
    setLoading(true);
    try {
      const [notifs, count] = await Promise.all([
        fetchEmployerNotifications(employerId),
        fetchEmployerUnreadCount(employerId),
      ]);
      setNotifications(notifs);
      setUnreadCount(count);
    } catch (e) {
      console.error("[useEmployerNotifications] load error:", e);
    } finally {
      setLoading(false);
    }
  }, [employerId]);

  // Initial load + polling every 60s
  useEffect(() => {
    if (!employerId) return;
    load();
    intervalRef.current = setInterval(load, 60_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [employerId, load]);

  const markRead = useCallback((id: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.$id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    markEmployerNotifAsRead(id).catch(() => {
      // Revert on failure
      setNotifications((prev) =>
        prev.map((n) => (n.$id === id ? { ...n, isRead: false } : n))
      );
      setUnreadCount((prev) => prev + 1);
    });
  }, []);

  const markAllRead = useCallback(() => {
    if (!employerId) return;
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    markAllEmployerNotifsAsRead(employerId).catch(() => load());
  }, [employerId, load]);

  const remove = useCallback((id: string) => {
    const removed = notifications.find((n) => n.$id === id);
    // Optimistic update
    setNotifications((prev) => prev.filter((n) => n.$id !== id));
    if (removed && !removed.isRead) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    deleteEmployerNotification(id).catch(() => {
      // Revert on failure
      if (removed) {
        setNotifications((prev) => [removed, ...prev]);
        if (!removed.isRead) setUnreadCount((prev) => prev + 1);
      }
    });
  }, [notifications]);

  return {
    notifications,
    unreadCount,
    loading,
    markRead,
    markAllRead,
    remove,
    refresh: load,
  };
}