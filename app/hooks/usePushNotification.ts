/**
 * Hook untuk Push Notification
 * Menangani subscription dan permission notification
 */

import { useEffect, useState } from "react";
import { PushNotificationService } from "~/services/pushNotificationService";

export interface UsePushNotificationReturn {
  isSupported: boolean;
  permission: NotificationPermission | null;
  isSubscribed: boolean;
  isLoading: boolean;
  error: string | null;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
  requestPermission: () => Promise<NotificationPermission>;
  sendTestNotification: () => Promise<void>;
}

export function usePushNotification(): UsePushNotificationReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | null>(
    null
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check support on mount
  useEffect(() => {
    const supported = PushNotificationService.isSupported();
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission as NotificationPermission);
      checkSubscription();
    }
  }, []);

  /**
   * Check jika user sudah subscribe
   */
  const checkSubscription = async () => {
    try {
      const hasSubscription =
        await PushNotificationService.hasActiveSubscription();
      setIsSubscribed(hasSubscription);
    } catch (err) {
      console.error("Error checking subscription:", err);
    }
  };

  /**
   * Request permission untuk notification
   */
  const requestPermission = async (): Promise<NotificationPermission> => {
    setIsLoading(true);
    setError(null);

    try {
      const perm = await PushNotificationService.requestPermission();
      setPermission(perm);
      return perm;
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Gagal meminta izin notifikasi";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Subscribe ke push notification
   */
  const subscribe = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Request permission jika belum granted
      if (permission !== "granted") {
        const perm = await requestPermission();
        if (perm !== "granted") {
          setError("User menolak izin notifikasi");
          return;
        }
      }

      // Subscribe
      const success = await PushNotificationService.subscribe();
      if (success) {
        setIsSubscribed(true);
        // Optional: show success message
        console.log("Berhasil subscribe push notification");
      } else {
        setError("Gagal subscribe push notification");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error subscribing";
      setError(errorMessage);
      console.error("Error subscribing to push notification:", err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Unsubscribe dari push notification
   */
  const unsubscribe = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const success = await PushNotificationService.unsubscribe();
      if (success) {
        setIsSubscribed(false);
        console.log("Berhasil unsubscribe push notification");
      } else {
        setError("Gagal unsubscribe push notification");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error unsubscribing";
      setError(errorMessage);
      console.error("Error unsubscribing from push notification:", err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Send test notification
   */
  const sendTestNotification = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const success = await PushNotificationService.sendTestNotification();
      if (!success) {
        setError("Gagal mengirim test notification");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error sending test";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe,
    requestPermission,
    sendTestNotification,
  };
}
