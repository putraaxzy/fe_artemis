/**
 * Notification Permission Dialog Component
 * Component untuk meminta permission notifikasi dari user
 */

import React, { useEffect, useState } from "react";
import { MdNotifications, MdClose, MdCheckCircle } from "react-icons/md";
import { usePushNotification } from "~/hooks/usePushNotification";

export interface NotificationPermissionDialogProps {
  onClose?: () => void;
  autoShow?: boolean;
}

export function NotificationPermissionDialog({
  onClose,
  autoShow = true,
}: NotificationPermissionDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const {
    isSupported,
    permission,
    isLoading,
    error,
    subscribe,
  } = usePushNotification();

  useEffect(() => {
    // Auto show dialog jika supported dan belum punya permission
    if (autoShow && isSupported && permission === "default") {
      setIsOpen(true);
    }
  }, [isSupported, permission, autoShow]);

  const handleEnable = async () => {
    try {
      await subscribe();
      setIsOpen(false);
      onClose?.();
    } catch (err) {
      console.error("Error enabling notifications:", err);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  if (!isOpen || !isSupported) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full">
        <div className="p-6">
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isLoading}
          >
            <MdClose className="w-5 h-5 text-gray-500" />
          </button>

          {/* Icon */}
          <div className="text-center mb-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MdNotifications className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          {/* Content */}
          <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
            Aktifkan Notifikasi
          </h2>
          <p className="text-sm text-gray-600 text-center mb-6">
            Dapatkan notifikasi real-time untuk tugas baru dan pengingat penting.
            Kami hanya akan mengirim notifikasi yang relevan.
          </p>

          {/* Benefits */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6 space-y-2">
            <div className="flex items-start gap-2 text-sm">
              <MdCheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700">
                Notifikasi tugas baru secara instant
              </span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <MdCheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700">
                Pengingat deadline yang akan datang
              </span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <MdCheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700">
                Update nilai dan feedback dari guru
              </span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Nanti Dulu
            </button>
            <button
              onClick={handleEnable}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin">⏳</div>
                  Mengaktifkan...
                </>
              ) : (
                <>
                  <MdNotifications className="w-4 h-4" />
                  Aktifkan
                </>
              )}
            </button>
          </div>

          {/* Footer Note */}
          <p className="text-xs text-gray-500 text-center mt-4">
            Anda dapat mengubah pengaturan notifikasi kapan saja di settings
          </p>
        </div>
      </div>
    </div>
  );
}
