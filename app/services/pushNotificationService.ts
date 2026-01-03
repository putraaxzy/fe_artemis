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
    const response = await fetch(`${API_BASE_URL}/notifications/vapid-key`);

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
      return false;
    }

    try {
      // Request permission
      const permission = await this.requestPermission();
      if (permission !== "granted") {
        return false;
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register(
        "/service-worker.js",
        { scope: "/" }
      );

      // Get VAPID public key
      const vapidPublicKey = await this.getVapidPublicKey();
      
      if (!vapidPublicKey) {
        throw new Error("VAPID public key tidak tersedia. Pastikan backend sudah setup dengan php artisan vapid:keys");
      }

      // VAPID key sudah dalam format URL-safe base64 dari backend
      // Panjang yang benar adalah sekitar 87 karakter (65 bytes raw data)
      
      if (vapidPublicKey.length < 80 || vapidPublicKey.length > 90) {
        // Invalid VAPID key length
      }

      // Check if there's an existing subscription and unsubscribe first
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        try {
          // Try to use existing subscription
          await this.sendSubscriptionToServer(existingSubscription);
          return true;
        } catch (e) {
          await existingSubscription.unsubscribe();
        }
      }

      // Wait for service worker to be fully active
      if (registration.active?.state !== 'activated') {
        await new Promise<void>((resolve) => {
          if (registration.active?.state === 'activated') {
            resolve();
            return;
          }
          registration.active?.addEventListener('statechange', () => {
            if (registration.active?.state === 'activated') {
              resolve();
            }
          });
          // Fallback timeout
          setTimeout(resolve, 1000);
        });
      }

      // Subscribe ke push manager with retry
      let subscription: PushSubscription | null = null;
      let attempts = 0;
      const maxAttempts = 3;

      while (!subscription && attempts < maxAttempts) {
        attempts++;
        try {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey),
          });
        } catch (err: any) {
          if (attempts < maxAttempts) {
            // Wait before retry
            await new Promise(r => setTimeout(r, 1000 * attempts));
          } else {
            throw err;
          }
        }
      }

      if (!subscription) {
        throw new Error("Failed to create push subscription after retries");
      }

      // Send subscription ke server
      await this.sendSubscriptionToServer(subscription);

      return true;
    } catch (error: any) {
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
        return false;
      }

      // Send unsubscribe ke server
      await fetch(`${API_BASE_URL}/notifications/unsubscribe`, {
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
      return unsubscribed;
    } catch (error) {
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
      return false;
    }
  }

  /**
   * Get subscription count dari server
   */
  static async getSubscriptionCount(): Promise<number> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/notifications/subscriptions-count`,
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

    const response = await fetch(`${API_BASE_URL}/notifications/subscribe`, {
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
      const response = await fetch(`${API_BASE_URL}/notifications/test`, {
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
      return false;
    }
  }
}
