/**
 * Hook for Real-time Notifications via Laravel Echo
 */

import { useEffect, useState, useCallback } from "react";
import { initializeEcho, getEcho, disconnectEcho } from "~/services/echo";
import { useAuth } from "./useAuth";

export interface RealtimeNotification {
  type: string;
  task?: {
    id: number;
    judul: string;
    deskripsi?: string;
    tanggal_deadline?: string;
    target: string;
  };
  follower?: {
    id: number;
    username: string;
    name: string;
    avatar: string;
  };
  message: string;
  timestamp: string;
}

export function useRealtimeNotifications() {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastNotification, setLastNotification] = useState<RealtimeNotification | null>(null);

  const addNotification = useCallback((notification: RealtimeNotification) => {
    setNotifications((prev) => [notification, ...prev]);
    setLastNotification(notification);
  }, []);

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") {
      return;
    }

    if (!isAuthenticated || !user) {
      disconnectEcho();
      setIsConnected(false);
      return;
    }

    // Initialize Echo
    const echo = initializeEcho();
    
    if (!echo) {
      return;
    }

    // Subscribe to user's private channel
    const channel = echo.private(`user.${user.id}`);

    // Debug: channel subscription events
    channel.error((error: any) => {
      // Channel subscription error
    });

    // Listen for task.created event (siswa receives when guru creates task)
    channel.listen(".task.created", (data: RealtimeNotification) => {
      addNotification(data);

      // Show browser notification if permitted
      if (Notification.permission === "granted") {
        new Notification(data.task?.judul || "Tugas Baru", {
          body: data.message,
          icon: "/batik.png",
          badge: "/batik.png",
          tag: `task-${data.task?.id}`,
        });
      }
    });

    // Listen for task.submitted event (guru receives when siswa submits)
    channel.listen(".task.submitted", (data: RealtimeNotification) => {
      addNotification(data);

      // Show browser notification if permitted
      if (Notification.permission === "granted") {
        new Notification("Tugas Dikumpulkan", {
          body: data.message,
          icon: "/batik.png",
          badge: "/batik.png",
          tag: `task-submitted-${data.task?.id}`,
        });
      }
    });

    // Listen for user.followed event (when someone follows you)
    channel.listen(".user.followed", (data: RealtimeNotification) => {
      addNotification(data);

      // Show browser notification if permitted
      if (Notification.permission === "granted") {
        new Notification("Follower Baru!", {
          body: data.message,
          icon: data.follower?.avatar || "/batik.png",
          badge: "/batik.png",
          tag: `user-followed-${data.follower?.id}`,
        });
      }
    });

    setIsConnected(true);

    // Connection status listeners
    echo.connector.pusher.connection.bind("connected", () => {
      setIsConnected(true);
    });

    echo.connector.pusher.connection.bind("disconnected", () => {
      setIsConnected(false);
    });

    echo.connector.pusher.connection.bind("error", (err: any) => {
      setIsConnected(false);
    });

    // Cleanup on unmount
    return () => {
      channel.stopListening(".task.created");
      channel.stopListening(".task.submitted");
      channel.stopListening(".user.followed");
      disconnectEcho();
      setIsConnected(false);
    };
  }, [isAuthenticated, user, addNotification]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setLastNotification(null);
  }, []);

  return {
    notifications,
    lastNotification,
    isConnected,
    clearNotifications,
  };
}
