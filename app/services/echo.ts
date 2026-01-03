/**
 * Laravel Echo Configuration
 * Real-time WebSocket communication with Laravel Reverb
 */

import Echo from "laravel-echo";
import Pusher from "pusher-js";
import { API_BASE_URL } from "~/config/api";

declare global {
  interface Window {
    Pusher: typeof Pusher;
    Echo: Echo<"reverb">;
  }
}

// Only set Pusher on client side
if (typeof window !== "undefined") {
  window.Pusher = Pusher;
}

let echo: Echo<"reverb"> | null = null;

/**
 * Initialize Echo instance
 */
export function initializeEcho(authToken?: string): Echo<"reverb"> | null {
  // Only initialize on client side
  if (typeof window === "undefined") {
    return null;
  }

  if (echo) {
    return echo;
  }

  const token = authToken || localStorage.getItem("token");
  
  // Get base URL without /api suffix for broadcasting auth
  const baseUrl = API_BASE_URL.replace(/\/api$/, "");

  try {
    echo = new Echo({
      broadcaster: "reverb",
      key: import.meta.env.VITE_REVERB_APP_KEY || "local-key",
      wsHost: import.meta.env.VITE_REVERB_HOST || "localhost",
      wsPort: Number(import.meta.env.VITE_REVERB_PORT) || 8080,
      wssPort: Number(import.meta.env.VITE_REVERB_PORT) || 8080,
      forceTLS: (import.meta.env.VITE_REVERB_SCHEME || "http") === "https",
      enabledTransports: ["ws", "wss"],
      authEndpoint: `${baseUrl}/broadcasting/auth`,
      auth: {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      },
    });

    window.Echo = echo;
    return echo;
  } catch (error) {
    return null;
  }
}

/**
 * Get Echo instance
 */
export function getEcho(): Echo<"reverb"> | null {
  return echo;
}

/**
 * Disconnect Echo
 */
export function disconnectEcho(): void {
  if (echo) {
    echo.disconnect();
    echo = null;
  }
}

/**
 * Reconnect Echo
 */
export function reconnectEcho(): void {
  disconnectEcho();
  const token = localStorage.getItem("token");
  if (token) {
    initializeEcho(token);
  }
}
