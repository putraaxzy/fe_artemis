/**
 * Push Notification Service
 * Menangani subscription dan push notification di frontend
 */

import { API_BASE_URL, API_ENDPOINTS } from "~/config/api";

export interface PushSubscriptionJSON {
  endpoint: string;
  keys: {
    auth: string;
    p256dh: string;
  };
}

export class PushNotificationService {
  /**
   * Cek apakah browser support push notification
   */
  static isSupported(): boolean {
    return (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window
    );
  }

  /**
   * Request permission untuk push notification
   */
  static async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      throw new Error("Push notification tidak didukung di browser ini");
    }

    // Cek permission yang sudah ada
    if (Notification.permission !== "default") {
      return Notification.permission;
    }

    return await Notification.requestPermission();
  }

  /**
   * Get VAPID public key dari server
   */
  static async getVapidPublicKey(): Promise<string> {
    const baseUrl = API_BASE_URL.replace(/\/api$/, '');
    const response = await fetch(`${baseUrl}/vapid-key`);

    if (!response.ok) {
      throw new Error("Gagal mengambil VAPID public key");
    }

    const data = await response.json();
    return data.vapid_public_key;
  }

  /**
   * Register service worker dan subscribe ke push notification
   */
  static async subscribe(): Promise<boolean> {
    if (!this.isSupported()) {
      console.warn("Push notification tidak didukung di browser ini");
      return false;
    }

    try {
      // Request permission
      const permission = await this.requestPermission();
      if (permission !== "granted") {
        console.log("User rejected push notification permission");
        return false;
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register(
        "/service-worker.js",
        { scope: "/" }
      );

      console.log("Service Worker registered successfully");

      // Get VAPID public key
      const vapidPublicKey = await this.getVapidPublicKey();
      
      if (!vapidPublicKey) {
        throw new Error("VAPID public key tidak tersedia. Pastikan backend sudah setup dengan php artisan vapid:keys");
      }

      // VAPID key sudah dalam format URL-safe base64 dari backend
      // Panjang yang benar adalah sekitar 87 karakter (65 bytes raw data)
      console.log("Using VAPID key length:", vapidPublicKey.length);
      
      if (vapidPublicKey.length < 80 || vapidPublicKey.length > 90) {
        console.warn("VAPID key length tidak sesuai. Expected ~87 chars, got:", vapidPublicKey.length);
        console.warn("Pastikan run: php artisan vapid:keys --force");
      }

      // Subscribe ke push manager
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey),
      });

      // Send subscription ke server
      await this.sendSubscriptionToServer(subscription);

      console.log("Push notification subscribed successfully");
      return true;
    } catch (error) {
      console.error("Error subscribing to push notifications:", error);
      return false;
    }
  }

  /**
   * Unsubscribe dari push notification
   */
  static async unsubscribe(): Promise<boolean> {
    if (!this.isSupported()) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription =
        await registration.pushManager.getSubscription();

      if (!subscription) {
        console.log("No active push subscription found");
        return false;
      }

      // Send unsubscribe ke server
      await fetch(`${API_BASE_URL}/api/notifications/unsubscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
        }),
      });

      // Unsubscribe dari push manager
      const unsubscribed = await subscription.unsubscribe();
      console.log("Push notification unsubscribed:", unsubscribed);
      return unsubscribed;
    } catch (error) {
      console.error("Error unsubscribing from push notifications:", error);
      return false;
    }
  }

  /**
   * Check jika ada active subscription
   */
  static async hasActiveSubscription(): Promise<boolean> {
    if (!this.isSupported()) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription =
        await registration.pushManager.getSubscription();
      return !!subscription;
    } catch (error) {
      console.error("Error checking subscription status:", error);
      return false;
    }
  }

  /**
   * Get subscription count dari server
   */
  static async getSubscriptionCount(): Promise<number> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/notifications/subscriptions-count`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) {
        return 0;
      }

      const data = await response.json();
      return data.subscriptions_count || 0;
    } catch (error) {
      console.error("Error getting subscription count:", error);
      return 0;
    }
  }

  /**
   * Send subscription ke server
   */
  private static async sendSubscriptionToServer(
    subscription: PushSubscription
  ): Promise<void> {
    const subscriptionJSON = subscription.toJSON() as PushSubscriptionJSON;

    const response = await fetch(`${API_BASE_URL}/api/notifications/subscribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        endpoint: subscriptionJSON.endpoint,
        auth_key: subscriptionJSON.keys.auth,
        p256dh_key: subscriptionJSON.keys.p256dh,
      }),
    });

    if (!response.ok) {
      throw new Error("Gagal mengirim subscription ke server");
    }
  }

  /**
   * Convert VAPID public key dari base64 ke Uint8Array
   */
  private static urlBase64ToUint8Array(
    base64String: string
  ): BufferSource {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray as BufferSource;
  }

  /**
   * Send test notification (development only)
   */
  static async sendTestNotification(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/test`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to send test notification");
      }

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error("Error sending test notification:", error);
      return false;
    }
  }
}
