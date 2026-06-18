// MedConnect service worker — enables PWA install + a basic offline shell.
const CACHE = 'medconnect-v5';
const APP_SHELL = ['/', '/index.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Never cache API calls — always hit the network so data is fresh.
  if (request.url.includes('/api/')) {
    event.respondWith(fetch(request));
    return;
  }

  // For navigations, try network first, fall back to cached shell (offline).
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('/index.html')));
    return;
  }

  // For other assets: serve from cache if present, otherwise fetch + cache.
  event.respondWith(
    caches.match(request).then((cached) =>
      cached ||
      fetch(request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(request, copy));
        return res;
      })
    )
  );
});

// ---- Push notifications ----
self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) { data = { title: 'MedConnect', body: event.data ? event.data.text() : '' }; }
  const title = data.title || 'MedConnect';
  const options = {
    body: data.body || '',
    icon: '/pwa-192.png',
    badge: '/notification-icon.png',
    data: { url: data.url || '/home' },
    tag: data.tag || undefined,
    renotify: !!data.tag,
  };
  event.waitUntil((async () => {
    await self.registration.showNotification(title, options);
    // update the home-screen app icon badge
    try {
      if (self.navigator && 'setAppBadge' in self.navigator) {
        const count = typeof data.badgeCount === 'number' ? data.badgeCount : 0;
        if (count > 0) await self.navigator.setAppBadge(count);
        else await self.navigator.setAppBadge(); // dot if no count
      }
    } catch (e) {}
  })());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const path = (event.notification.data && event.notification.data.url) || '/home';
  const fullUrl = new URL(path, self.location.origin).href;
  event.waitUntil((async () => {
    const list = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    // If an app window is already open, focus it (and try to navigate, ignoring failures).
    for (const client of list) {
      if ('focus' in client) {
        try { await client.focus(); } catch (e) {}
        try { if (client.navigate) await client.navigate(fullUrl); } catch (e) {}
        return;
      }
    }
    // Otherwise open a fresh window.
    if (self.clients.openWindow) {
      try { await self.clients.openWindow(fullUrl); } catch (e) {}
    }
  })());
});
