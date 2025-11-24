import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";
const WS_BASE = process.env.REACT_APP_WS_URL || API_BASE;
const MAX_NOTIFICATIONS = 200;

const sortNotifications = (items) =>
  [...items].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

const toIdSet = (ids = []) => new Set(ids.map((id) => String(id)));

export default function useRealtimeNotifications({
  role,
  recipientId,
  enabled = true,
  limit = 50,
} = {}) {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);
  const abortRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    if (!role || !enabled) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const query = new URLSearchParams({
        role,
        limit: String(limit),
      });
      if (recipientId) {
        query.append("recipientId", recipientId);
      }

      const response = await fetch(`${API_BASE}/api/notifications?${query.toString()}`, {
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Failed to load notifications (${response.status})`);
      }

      const payload = await response.json();
      if (!payload?.data) {
        throw new Error("Malformed notifications response");
      }

      setNotifications(sortNotifications(payload.data).slice(0, limit));
    } catch (err) {
      if (err.name !== "AbortError") {
        setError(err);
      }
    } finally {
      setIsLoading(false);
    }
  }, [role, recipientId, limit, enabled]);

  const upsertNotification = useCallback((incoming) => {
    setNotifications((prev) => {
      const map = new Map(prev.map((item) => [item.id, item]));
      map.set(incoming.id, incoming);
      return sortNotifications(Array.from(map.values())).slice(0, MAX_NOTIFICATIONS);
    });
  }, []);

  const applyReadState = useCallback((ids) => {
    if (!Array.isArray(ids) || !ids.length) return;
    const targetIds = toIdSet(ids);
    setNotifications((prev) =>
      prev.map((notification) =>
        targetIds.has(String(notification.id))
          ? { ...notification, isRead: true }
          : notification
      )
    );
  }, []);

  useEffect(() => {
    fetchNotifications();
    return () => abortRef.current?.abort();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!role || !enabled) return undefined;

    const socket = io(WS_BASE, {
      transports: ["websocket"],
      auth: {
        role,
        recipientId: recipientId || null,
      },
      reconnectionAttempts: 8,
      reconnectionDelay: 1500,
    });

    socketRef.current = socket;

    const handleNew = (payload) => {
      if (payload?.role === role) {
        upsertNotification(payload);
      }
    };

    const handleUpdated = (payload) => {
      if (payload?.role === role) {
        upsertNotification(payload);
      }
    };

    const handleBulkRead = (payload) => {
      if (payload?.role === role && (!recipientId || !payload.recipientId || payload.recipientId === recipientId)) {
        applyReadState(payload.ids || []);
      }
    };

    socket.on("notifications:new", handleNew);
    socket.on("notifications:updated", handleUpdated);
    socket.on("notifications:bulk-read", handleBulkRead);

    socket.on("connect_error", (err) => {
      console.warn("Socket.IO connection error:", err.message);
      // Only set error for non-connection issues in production
      if (process.env.NODE_ENV === 'production') {
        setError(err);
      }
      // In development, just log the error without showing it to user
    });

    return () => {
      socket.off("notifications:new", handleNew);
      socket.off("notifications:updated", handleUpdated);
      socket.off("notifications:bulk-read", handleBulkRead);
      socket.disconnect();
    };
  }, [role, recipientId, enabled, upsertNotification, applyReadState]);

  const markAsRead = useCallback(
    async (notificationId) => {
      if (!notificationId || !role) return;

      applyReadState([notificationId]);

      try {
        const response = await fetch(`${API_BASE}/api/notifications/${notificationId}/read`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ role, recipientId: recipientId || null }),
        });

        if (!response.ok) {
          throw new Error(`Failed to mark notification ${notificationId} as read`);
        }
      } catch (err) {
        setError(err);
      }
    },
    [role, recipientId, applyReadState]
  );

  const markAllAsRead = useCallback(async () => {
    if (!role) return;

    const ids = notifications.filter((item) => !item.isRead).map((item) => item.id);
    applyReadState(ids);

    try {
      const response = await fetch(`${API_BASE}/api/notifications/read-all`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role, recipientId: recipientId || null }),
      });

      if (!response.ok) {
        throw new Error("Failed to mark notifications as read");
      }
    } catch (err) {
      setError(err);
    }
  }, [role, recipientId, notifications, applyReadState]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications]
  );

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  };
}
