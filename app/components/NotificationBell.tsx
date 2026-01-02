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
} from "react-icons/md";
import { usePushNotification } from "~/hooks/usePushNotification";

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  taskId?: number;
  timestamp: Date;
  read: boolean;
}

// Local storage key for notifications
const NOTIF_STORAGE_KEY = "notification_history";

export function NotificationBell() {
  const navigate = useNavigate();
  const { isSupported, isSubscribed, permission } = usePushNotification();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
          console.error("Error parsing notifications:", e);
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

  const handleServiceWorkerMessage = (event: MessageEvent) => {
    if (event.data?.type === "NEW_NOTIFICATION") {
      const newNotif: NotificationItem = {
        id: Date.now().toString(),
        title: event.data.title || "Notifikasi",
        body: event.data.body || "",
        taskId: event.data.taskId,
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
    
    if (notif.taskId) {
      navigate(`/tasks/${notif.taskId}`);
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
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
        title="Notifikasi"
      >
        {!isSupported || permission === "denied" ? (
          <MdNotificationsOff className="w-5 h-5 text-gray-400" />
        ) : isSubscribed ? (
          <MdNotificationsActive className="w-5 h-5 text-gray-700" />
        ) : (
          <MdNotifications className="w-5 h-5 text-gray-500" />
        )}

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl z-50 border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
            <div>
              <h3 className="font-semibold text-gray-900">Notifikasi</h3>
              {unreadCount > 0 && (
                <p className="text-xs text-gray-500">{unreadCount} belum dibaca</p>
              )}
            </div>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Tandai dibaca
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Hapus
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-12 text-center">
                <MdNotifications className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Belum ada notifikasi</p>
                {!isSubscribed && isSupported && (
                  <p className="text-xs text-gray-400 mt-1">
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
                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-start gap-3 ${
                      !notif.read ? "bg-blue-50/50" : ""
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        !notif.read ? "bg-blue-100" : "bg-gray-100"
                      }`}
                    >
                      <MdTask
                        className={`w-4 h-4 ${
                          !notif.read ? "text-blue-600" : "text-gray-500"
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm truncate ${
                          !notif.read
                            ? "font-semibold text-gray-900"
                            : "text-gray-700"
                        }`}
                      >
                        {notif.title}
                      </p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {notif.body}
                      </p>
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        <MdAccessTime className="w-3 h-3" />
                        {formatTime(notif.timestamp)}
                      </p>
                    </div>
                    <MdChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
            <button
              onClick={() => {
                setIsOpen(false);
                navigate("/settings");
              }}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium w-full text-center flex items-center justify-center gap-1"
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
