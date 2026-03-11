"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  fetchEmployerNotifications,
  markEmployerNotifAsRead,
  markAllEmployerNotifsAsRead,
  deleteEmployerNotification,
  type EmployerNotification,
} from "@/services/employerNotificationsService";

interface UseEmployerNotificationsReturn {
  notifications: EmployerNotification[];
  unreadCount:   number;
  loading:       boolean;
  markRead:      (id: string) => void;
  markAllRead:   () => void;
  remove:        (id: string) => void;
  refresh:       () => Promise<void>;
}

export function useEmployerNotifications(
  employerId: string | undefined
): UseEmployerNotificationsReturn {
  const [notifications, setNotifications] = useState<EmployerNotification[]>([]);
  const [loading,       setLoading]       = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Derive unread count directly from notifications — single source of truth
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const load = useCallback(async () => {
    if (!employerId) return;
    setLoading(true);
    try {
      const notifs = await fetchEmployerNotifications(employerId, 60);
      setNotifications(notifs);
    } catch (e) {
      console.error("[useEmployerNotifications] load error:", e);
    } finally {
      setLoading(false);
    }
  }, [employerId]);

  // Load on mount + poll every 30s
  useEffect(() => {
    if (!employerId) return;
    load();
    intervalRef.current = setInterval(load, 30_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [employerId, load]);

  const markRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.$id === id ? { ...n, isRead: true } : n))
    );
    markEmployerNotifAsRead(id).catch(() => {
      setNotifications((prev) =>
        prev.map((n) => (n.$id === id ? { ...n, isRead: false } : n))
      );
    });
  }, []);

  const markAllRead = useCallback(() => {
    if (!employerId) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    markAllEmployerNotifsAsRead(employerId).catch(() => load());
  }, [employerId, load]);

  const remove = useCallback(
    (id: string) => {
      const removed = notifications.find((n) => n.$id === id);
      setNotifications((prev) => prev.filter((n) => n.$id !== id));
      deleteEmployerNotification(id).catch(() => {
        if (removed) setNotifications((prev) => [removed, ...prev]);
      });
    },
    [notifications]
  );

  return { notifications, unreadCount, loading, markRead, markAllRead, remove, refresh: load };
}