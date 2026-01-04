/**
 * Service Worker for Push Notifications
 * Handle incoming push notifications dan background sync
 */

// Precache manifest injection point (required by vite-plugin-pwa)
// eslint-disable-next-line no-undef
self.__WB_MANIFEST;

// Cache version
const CACHE_VERSION = "v1";
const CACHE_NAME = `notification-cache-${CACHE_VERSION}`;

// Event listener untuk install
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

// Event listener untuk activate
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());

  // Clean up old caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
});

// Event listener untuk push notification
self.addEventListener("push", (event) => {
  if (!event.data) {
    return;
  }

  let notificationData;
  try {
    notificationData = event.data.json();
  } catch (error) {
    notificationData = {
      title: "Notifikasi",
      body: event.data.text(),
    };
  }

  const {
    title = "Notifikasi",
    body = "",
    icon = "/batik.png",
    badge = "/batik.png",
    tag = "default",
    data = {},
  } = notificationData;

  const notificationOptions = {
    body,
    icon,
    badge,
    tag,
    data,
    requireInteraction: false,
    vibrate: [200, 100, 200],
  };

  event.waitUntil(
    Promise.all([
      // Show notification
      self.registration.showNotification(title, notificationOptions),
      // Send message to all clients to update notification list
      self.clients.matchAll({ type: "window" }).then((clientList) => {
        clientList.forEach((client) => {
          client.postMessage({
            type: "NEW_NOTIFICATION",
            title,
            body,
            taskId: data?.taskId,
            followerUsername: data?.followerUsername,
            notificationType: data?.type,
            url: data?.url,
          });
        });
      }),
    ])
  );
});

// Event listener untuk notification click
self.addEventListener("notificationclick", (event) => {
  const { action, notification } = event;
  const { data } = notification;
  const url = data?.url || "/";

  // Tangani action click
  if (action === "close") {
    notification.close();
    return;
  }

  // Untuk action 'open' atau default click
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Cari window yang sudah terbuka
        for (let client of clientList) {
          if (client.url === url && "focus" in client) {
            return client.focus();
          }
        }

        // Jika tidak ada window terbuka, buat yang baru
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );

  notification.close();
});

// Event listener untuk notification close
self.addEventListener("notificationclose", (event) => {
  // Bisa track analytics tentang dismissed notifications
});

// Event listener untuk background sync (optional)
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-notifications") {
    event.waitUntil(syncNotifications());
  }
});

/**
 * Sync notifications function
 * Dipanggil saat browser memiliki koneksi internet kembali
 */
async function syncNotifications() {
  // Add your sync logic here
}
