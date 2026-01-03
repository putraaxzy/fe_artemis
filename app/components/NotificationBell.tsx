/**
 * Notification Bell Component
 * Icon notifikasi dengan dropdown history
 */

import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  MdNotifications,
  MdNotificationsActive,
  MdNotificationsOff,
  MdTask,
  MdAccessTime,
  MdChevronRight,
  MdSettings,
  MdPersonAdd,
} from "react-icons/md";
import { usePushNotification } from "~/hooks/usePushNotification";
import { useRealtimeNotifications } from "~/hooks/useRealtimeNotifications";

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  taskId?: number;
  followerUsername?: string;
  type?: string;
  timestamp: Date;
  read: boolean;
}

// Local storage key for notifications
const NOTIF_STORAGE_KEY = "notification_history";

export function NotificationBell() {
  const navigate = useNavigate();
  const { isSupported, isSubscribed, permission } = usePushNotification();
  const { lastNotification, isConnected } = useRealtimeNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [lastProcessedId, setLastProcessedId] = useState<string | null>(null);

  // Load notifications from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(NOTIF_STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setNotifications(
            parsed.map((n: any) => ({
              ...n,
              timestamp: new Date(n.timestamp),
            }))
          );
        } catch (e) {
        }
      }

      // Listen for new notifications from service worker
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.addEventListener("message", handleServiceWorkerMessage);
        return () => {
          navigator.serviceWorker.removeEventListener("message", handleServiceWorkerMessage);
        };
      }
    }
  }, []);

  // Handle realtime notifications from Reverb
  useEffect(() => {
    if (!lastNotification) return;
    
    const notifId = lastNotification.timestamp || String(Date.now());
    
    // Skip if already processed
    if (notifId === lastProcessedId) return;
    
    // Determine title based on notification type
    let title = "Notifikasi";
    if (lastNotification.type === "task_created") {
      title = lastNotification.task?.judul || "Tugas Baru";
    } else if (lastNotification.type === "task_submitted") {
      title = "Tugas Dikumpulkan";
    } else if (lastNotification.type === "user_followed") {
      title = "Follower Baru!";
    }
    
    const newNotif: NotificationItem = {
      id: notifId,
      title,
      body: lastNotification.message || "",
      taskId: lastNotification.task?.id,
      followerUsername: lastNotification.follower?.username,
      type: lastNotification.type,
      timestamp: new Date(),
      read: false,
    };
    
    addNotification(newNotif);
    setLastProcessedId(notifId);
  }, [lastNotification, lastProcessedId]);

  const handleServiceWorkerMessage = (event: MessageEvent) => {
    if (event.data?.type === "NEW_NOTIFICATION") {
      const newNotif: NotificationItem = {
        id: Date.now().toString(),
        title: event.data.title || "Notifikasi",
        body: event.data.body || "",
        taskId: event.data.taskId,
        followerUsername: event.data.followerUsername,
        type: event.data.notificationType,
        timestamp: new Date(),
        read: false,
      };
      addNotification(newNotif);
    }
  };

  const addNotification = (notif: NotificationItem) => {
    setNotifications((prev) => {
      const updated = [notif, ...prev].slice(0, 20); // Keep max 20
      localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
      localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const markAllAsRead = () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const handleNotificationClick = (notif: NotificationItem) => {
    markAsRead(notif.id);
    setIsOpen(false);
    
    // Navigate based on notification type
    if (notif.type === "user_followed" && notif.followerUsername) {
      navigate(`/profile/${notif.followerUsername}`);
    } else if (notif.taskId) {
      navigate(`/dashboard/${notif.taskId}`);
    } else {
      navigate("/dashboard");
    }
  };

  const clearAll = () => {
    setNotifications([]);
    localStorage.removeItem(NOTIF_STORAGE_KEY);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Baru saja";
    if (minutes < 60) return `${minutes} menit lalu`;
    if (hours < 24) return `${hours} jam lalu`;
    if (days < 7) return `${days} hari lalu`;
    return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2.5 rounded-full transition-all duration-200 ${
          isOpen 
            ? "bg-gray-900 text-white" 
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        }`}
        title={isConnected ? "Notifikasi (realtime aktif)" : "Notifikasi"}
      >
        {!isSupported || permission === "denied" ? (
          <MdNotificationsOff className="w-5 h-5 opacity-50" />
        ) : (
          <MdNotifications className={`w-5 h-5 ${unreadCount > 0 ? "animate-pulse" : ""}`} />
        )}

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1.5 shadow-sm">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
        
        {/* Connection Status Dot */}
        {isConnected && unreadCount === 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl z-50 border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3.5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">Notifikasi</h3>
              {isConnected && (
                <span className="px-1.5 py-0.5 text-[10px] font-medium bg-green-100 text-green-700 rounded-full">
                  Live
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline"
                >
                  Tandai dibaca
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                >
                  Hapus semua
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-[360px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MdNotifications className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 font-medium">Belum ada notifikasi</p>
                {!isSubscribed && isSupported && (
                  <p className="text-xs text-gray-400 mt-2">
                    Aktifkan notifikasi di Settings
                  </p>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notif) => (
                  <button
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`w-full px-4 py-3.5 text-left hover:bg-gray-50 transition-all flex items-start gap-3 group ${
                      !notif.read ? "bg-blue-50/40 border-l-2 border-l-blue-500" : "border-l-2 border-l-transparent"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 ${
                        notif.type === "user_followed"
                          ? !notif.read 
                            ? "bg-pink-500 text-white shadow-sm" 
                            : "bg-pink-100 text-pink-500"
                          : !notif.read 
                            ? "bg-blue-500 text-white shadow-sm" 
                            : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {notif.type === "user_followed" ? (
                        <MdPersonAdd className="w-5 h-5" />
                      ) : (
                        <MdTask className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm ${
                          !notif.read
                            ? "font-semibold text-gray-900"
                            : "font-medium text-gray-700"
                        }`}
                      >
                        {notif.title}
                      </p>
                      <p className="text-xs text-gray-500 line-clamp-2 mt-0.5 leading-relaxed">
                        {notif.body}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-1.5 flex items-center gap-1">
                        <MdAccessTime className="w-3 h-3" />
                        {formatTime(notif.timestamp)}
                      </p>
                    </div>
                    <MdChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <button
              onClick={() => {
                setIsOpen(false);
                navigate("/settings");
              }}
              className="text-sm text-gray-600 hover:text-gray-900 font-medium w-full text-center flex items-center justify-center gap-1.5 py-1 transition-colors"
            >
              <MdSettings className="w-4 h-4" />
              Pengaturan Notifikasi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
