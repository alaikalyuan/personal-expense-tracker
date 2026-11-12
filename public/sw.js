// SakuTrack Service Worker: push notifications and an offline fallback page.

// Only the static offline page is cached. Pages with account data are never
// stored, so a stale or another user's screen can never be served from here.
const OFFLINE_CACHE = "sakutrack-offline-v1";
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(OFFLINE_CACHE).then((cache) => cache.add(OFFLINE_URL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== OFFLINE_CACHE).map((key) => caches.delete(key))))
      .then(() => clients.claim())
  );
});

// When a page navigation fails because there is no connection, show the offline page.
self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;
  event.respondWith(
    fetch(event.request).catch(() => caches.match(OFFLINE_URL).then((cached) => cached || Response.error()))
  );
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload = {
    title: "SakuTrack",
    body: "Pengingat pengeluaran harian",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    url: "/",
    tag: "sakutrack-notification",
  };

  try {
    const data = event.data.json();
    payload = {
      title: data.title || payload.title,
      body: data.body || payload.body,
      icon: data.icon || payload.icon,
      badge: data.badge || payload.badge,
      url: data.url || payload.url,
      tag: data.tag || payload.tag,
    };
  } catch {
    const text = event.data.text();
    if (text) {
      payload.body = text;
    }
  }

  const notificationOptions = {
    body: payload.body,
    icon: payload.icon,
    badge: payload.badge,
    data: {
      url: payload.url,
    },
    tag: payload.tag,
    renotify: true,
    vibrate: [100, 50, 100],
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, notificationOptions)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          if (client.url === targetUrl || client.url.endsWith(targetUrl)) {
            return client.focus();
          }
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
