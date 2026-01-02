/**
 * Notification Settings Component
 * Menampilkan settings untuk push notification
 */

import React, { useEffect, useState } from "react";
import {
  MdNotifications,
  MdNotificationsActive,
  MdCheckCircle,
  MdError,
} from "react-icons/md";
import { usePushNotification } from "~/hooks/usePushNotification";

export function NotificationSettings() {
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe,
    sendTestNotification,
  } = usePushNotification();

  const [showTestSuccess, setShowTestSuccess] = useState(false);

  if (!isSupported) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <MdError className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-yellow-900">
              Browser tidak mendukung notifikasi
            </h3>
            <p className="text-sm text-yellow-800 mt-1">
              Browser Anda tidak mendukung push notification. Silakan gunakan
              browser modern seperti Chrome, Firefox, atau Edge.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleSubscribe = async () => {
    await subscribe();
  };

  const handleUnsubscribe = async () => {
    if (confirm("Apakah Anda yakin ingin menonaktifkan notifikasi?")) {
      await unsubscribe();
    }
  };

  const handleTestNotification = async () => {
    await sendTestNotification();
    setShowTestSuccess(true);
    setTimeout(() => setShowTestSuccess(false), 3000);
  };

  return (
    <div className="space-y-4">
      {/* Status Card */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            {isSubscribed ? (
              <MdNotificationsActive className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
            ) : (
              <MdNotifications className="w-6 h-6 text-gray-400 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <h3 className="font-semibold text-gray-900">
                {isSubscribed ? "Notifikasi Aktif" : "Notifikasi Nonaktif"}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {isSubscribed
                  ? "Anda akan menerima notifikasi push untuk tugas baru dan update penting."
                  : "Aktifkan notifikasi untuk mendapatkan update real-time tentang tugas Anda."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Permission Status */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              Status Permisi:
            </span>
            <span className="text-sm font-semibold text-gray-900 capitalize">
              {permission === "granted" && (
                <span className="text-green-600">✓ Diizinkan</span>
              )}
              {permission === "denied" && (
                <span className="text-red-600">✗ Ditolak</span>
              )}
              {permission === "default" && (
                <span className="text-gray-600">○ Belum ditentukan</span>
              )}
            </span>
          </div>

          {permission === "denied" && (
            <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">
              <p>
                Anda telah menolak permisi notifikasi. Untuk mengaktifkan
                kembali, buka pengaturan browser dan izinkan notifikasi untuk
                situs ini.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {showTestSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
          <MdCheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-sm text-green-700">
            Test notifikasi berhasil dikirim!
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-2">
        {!isSubscribed && permission !== "denied" && (
          <button
            onClick={handleSubscribe}
            disabled={isLoading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin">⏳</div>
                Mengaktifkan...
              </>
            ) : (
              <>
                <MdNotifications className="w-4 h-4" />
                Aktifkan Notifikasi
              </>
            )}
          </button>
        )}

        {isSubscribed && (
          <>
            <button
              onClick={handleTestNotification}
              disabled={isLoading}
              className="w-full px-4 py-2 bg-gray-100 text-gray-900 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Mengirim..." : "Kirim Test Notifikasi"}
            </button>

            <button
              onClick={handleUnsubscribe}
              disabled={isLoading}
              className="w-full px-4 py-2 border border-red-300 text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Memproses..." : "Nonaktifkan Notifikasi"}
            </button>
          </>
        )}
      </div>

      {/* Info */}
      <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-700 space-y-2">
        <p className="font-medium">Tipe notifikasi yang Anda terima:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Notifikasi tugas baru untuk kelas Anda</li>
          <li>Pengingat deadline tugas yang akan datang</li>
          <li>Update nilai dan feedback dari guru</li>
          <li>Pemberitahuan penting dari sekolah</li>
        </ul>
      </div>
    </div>
  );
}
