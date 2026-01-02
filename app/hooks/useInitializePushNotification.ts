/**
 * Hook untuk auto-initialize push notification
 * Dipanggil di root layout untuk setup service worker dan check subscription
 */

import { useEffect } from "react";

export function useInitializePushNotification() {
  useEffect(() => {
    // Hanya jalankan di client-side
    if (typeof window === "undefined") {
      return;
    }

    const initializeNotifications = async () => {
      try {
        // Check jika browser support
        if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
          console.log("Push notification tidak didukung di browser ini");
          return;
        }

        // Register service worker
        if ("serviceWorker" in navigator) {
          try {
            const registration = await navigator.serviceWorker.register(
              "/service-worker.js",
              { scope: "/" }
            );
            console.log("Service Worker registered:", registration);

            // Listen untuk update
            registration.addEventListener("updatefound", () => {
              console.log("Service Worker update found");
            });
          } catch (error) {
            console.error("Service Worker registration failed:", error);
          }
        }

        // Check existing subscription
        const registration =
          await navigator.serviceWorker.ready;
        const subscription =
          await registration.pushManager.getSubscription();

        if (subscription) {
          console.log("Existing push subscription found");
        }
      } catch (error) {
        console.error("Error initializing push notifications:", error);
      }
    };

    // Delay initialization sedikit untuk memastikan DOM siap
    const timeoutId = setTimeout(initializeNotifications, 1000);

    return () => clearTimeout(timeoutId);
  }, []);
}
