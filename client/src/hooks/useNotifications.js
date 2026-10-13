import { useCallback, useEffect, useRef, useState } from 'react';
import { listNotifications, markRead as apiMarkRead, markAllRead as apiMarkAllRead } from '../api/notification.api.js';

const POLL_INTERVAL = 30_000; // 30 seconds

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const timerRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await listNotifications({ limit: 50 });
      const data = res.data;
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      // Silently ignore — polling errors should not disrupt UI
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    timerRef.current = setInterval(fetchNotifications, POLL_INTERVAL);
    return () => clearInterval(timerRef.current);
  }, [fetchNotifications]);

  const markRead = useCallback(async (id) => {
    try {
      await apiMarkRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // Ignore
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await apiMarkAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // Ignore
    }
  }, []);

  return { notifications, unreadCount, markRead, markAllRead, refetch: fetchNotifications, isLoading };
}
