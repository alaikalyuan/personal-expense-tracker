// Client-side helper for PWA Web Push notification registration and subscription

export function isPushNotificationSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function getExistingServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushNotificationSupported()) return null;
  try {
    return await navigator.serviceWorker.ready;
  } catch (err) {
    console.warn("Failed to get ready service worker registration:", err);
    return null;
  }
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushNotificationSupported()) return null;
  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });
    await navigator.serviceWorker.ready;
    return registration;
  } catch (err) {
    console.error("Service Worker registration failed:", err);
    return null;
  }
}

export async function getCurrentPushSubscription(): Promise<PushSubscription | null> {
  const registration = await getExistingServiceWorkerRegistration();
  if (!registration) return null;
  return await registration.pushManager.getSubscription();
}

export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!isPushNotificationSupported()) {
    throw new Error("Push notifications are not supported in this browser.");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error(
      permission === "denied"
        ? "Izin notifikasi ditolak di browser. Aktifkan izin pada pengaturan browser."
        : "Izin notifikasi belum diberikan."
    );
  }

  const registration = await registerServiceWorker();
  if (!registration) {
    throw new Error("Gagal mendaftarkan service worker.");
  }

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidPublicKey) {
    throw new Error("VAPID public key is missing.");
  }

  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    const convertedKey = urlBase64ToUint8Array(vapidPublicKey);
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedKey as unknown as BufferSource,
    });
  }

  // Save subscription to backend
  const rawSub = subscription.toJSON();
  const res = await fetch("/api/notifications/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      endpoint: subscription.endpoint,
      keys: {
        p256dh: rawSub.keys?.p256dh,
        auth: rawSub.keys?.auth,
      },
      userAgent: navigator.userAgent,
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || "Gagal menyimpan langganan notifikasi ke server.");
  }

  return subscription;
}

export async function unsubscribeFromPush(): Promise<boolean> {
  try {
    const registration = await getExistingServiceWorkerRegistration();
    if (!registration) return true;

    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return true;

    // Remove from server
    await fetch("/api/notifications/subscribe", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    });

    return await subscription.unsubscribe();
  } catch (err) {
    console.error("Failed to unsubscribe:", err);
    return false;
  }
}

export async function sendTestNotification(): Promise<{ success: boolean; message?: string }> {
  const res = await fetch("/api/notifications/test", {
    method: "POST",
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Gagal mengirim notifikasi tes.");
  }
  return data;
}
