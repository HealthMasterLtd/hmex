"use client";

/**
 * useNotifications.ts
 *
 * React hook for the HMEX notifications system.
 * Polls for new notifications, tracks unread count, and provides
 * actions to mark as read / delete.
 *
 * Usage:
 *   const { notifications, unreadCount, markRead, markAllRead, remove } = useNotifications(userId);
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  type AppNotification,
  fetchNotifications,
  fetchUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearReadNotifications,
} from "@/services/NotificationsService";

const POLL_INTERVAL_MS = 30_000; // 30 seconds

interface UseNotificationsResult {
  notifications:  AppNotification[];
  unreadCount:    number;
  loading:        boolean;
  error:          string | null;
  markRead:       (id: string) => Promise<void>;
  markAllRead:    () => Promise<void>;
  remove:         (id: string) => Promise<void>;
  clearRead:      () => Promise<void>;
  refresh:        () => Promise<void>;
}

export function useNotifications(userId: string | undefined): UseNotificationsResult {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Core fetch ──────────────────────────────────────────────────────────────
  const load = useCallback(async (silent = false) => {
    if (!userId) return;
    if (!silent) setLoading(true);
    try {
      const [notifs, count] = await Promise.all([
        fetchNotifications(userId),
        fetchUnreadCount(userId),
      ]);
      setNotifications(notifs);
      setUnreadCount(count);
      setError(null);
    } catch {
      setError("Could not load notifications.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [userId]);

  // Initial load + polling
  useEffect(() => {
    if (!userId) return;
    load();

    intervalRef.current = setInterval(() => load(true), POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [userId, load]);

  // ── Mark one as read ────────────────────────────────────────────────────────
  const markRead = useCallback(async (id: string) => {
    // Optimistic update
    setNotifications(prev =>
      prev.map(n => n.$id === id ? { ...n, isRead: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));

    const ok = await markAsRead(id);
    if (!ok) {
      // Revert on failure
      setNotifications(prev =>
        prev.map(n => n.$id === id ? { ...n, isRead: false } : n)
      );
      setUnreadCount(prev => prev + 1);
    }
  }, []);

  // ── Mark all as read ────────────────────────────────────────────────────────
  const markAllRead = useCallback(async () => {
    if (!userId) return;
    // Optimistic update
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);

    const ok = await markAllAsRead(userId);
    if (!ok) {
      // Reload true state on failure
      await load(true);
    }
  }, [userId, load]);

  // ── Delete one ──────────────────────────────────────────────────────────────
  const remove = useCallback(async (id: string) => {
    const target = notifications.find(n => n.$id === id);
    // Optimistic update
    setNotifications(prev => prev.filter(n => n.$id !== id));
    if (target && !target.isRead) setUnreadCount(prev => Math.max(0, prev - 1));

    const ok = await deleteNotification(id);
    if (!ok) {
      // Revert on failure
      if (target) {
        setNotifications(prev => [target, ...prev].sort(
          (a, b) => new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime()
        ));
        if (!target.isRead) setUnreadCount(prev => prev + 1);
      }
    }
  }, [notifications]);

  // ── Clear all read ──────────────────────────────────────────────────────────
  const clearRead = useCallback(async () => {
    if (!userId) return;
    setNotifications(prev => prev.filter(n => !n.isRead));
    await clearReadNotifications(userId);
  }, [userId]);

  // ── Manual refresh ──────────────────────────────────────────────────────────
  const refresh = useCallback(() => load(), [load]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markRead,
    markAllRead,
    remove,
    clearRead,
    refresh,
  };
}