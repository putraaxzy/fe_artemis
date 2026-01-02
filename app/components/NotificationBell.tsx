/**
 * Notification Bell Component
 * Icon notifikasi dengan status subscription
 */

import React, { useState, useRef, useEffect } from "react";
import { MdNotifications, MdNotificationsActive } from "react-icons/md";
import { usePushNotification } from "~/hooks/usePushNotification";
import { NotificationSettings } from "./NotificationSettings";

export function NotificationBell() {
  const { isSupported, isSubscribed, permission } = usePushNotification();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown saat click outside
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

  if (!isSupported) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
        title="Notification Settings"
      >
        {isSubscribed ? (
          <MdNotificationsActive className="w-5 h-5 text-blue-600" />
        ) : (
          <MdNotifications className="w-5 h-5" />
        )}

        {/* Status Badge */}
        {isSupported && (
          <span
            className={`absolute top-1 right-1 w-2.5 h-2.5 rounded-full ${
              isSubscribed ? "bg-green-500" : "bg-gray-400"
            }`}
          />
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl z-50 border border-gray-100 animate-in fade-in slide-in-from-top-2">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Pengaturan Notifikasi</h3>
            <p className="text-xs text-gray-500 mt-1">
              {isSubscribed
                ? "Notifikasi sedang aktif"
                : "Notifikasi sedang nonaktif"}
            </p>
          </div>

          {/* Content */}
          <div className="px-6 py-4 max-h-96 overflow-y-auto">
            <NotificationSettings />
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 rounded-b-xl">
            <p className="text-xs text-gray-500">
              Anda dapat mengubah pengaturan kapan saja
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
