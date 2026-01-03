/**
 * Hook untuk auto-initialize push notification
 * Dipanggil di root layout untuk setup service worker dan check subscription
 */

import { useEffect } from "react";

export function useInitializePushNotification() {
  useEffect(() => {
    // Push notification initialization skipped
  }, []);
}
