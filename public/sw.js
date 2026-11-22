/* Norvim PWA service worker. Keeps background Web Push handling and adds a safe offline fallback. */
const NORVIM_CACHE = 'norvim-pwa-v1';
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(NORVIM_CACHE);
    const essentials = [OFFLINE_URL, '/manifest.webmanifest', '/images/norvim-icon-192.png', '/images/norvim-icon-512.png', '/images/norvim-icon-maskable-512.png'];
    // A single temporarily unavailable asset must not abort service-worker installation.
    await Promise.allSettled(essentials.map(url => cache.add(url)));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('norvim-pwa-') && key !== NORVIM_CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

// Only handle page navigations here. API requests and live account/job data stay network-only.
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || request.mode !== 'navigate') return;
  event.respondWith((async () => {
    try { return await fetch(request); }
    catch (_) { return (await caches.match(OFFLINE_URL)) || Response.error(); }
  })());
});

self.addEventListener('push', event => {
  event.waitUntil((async () => {
    let data = {};
    try { data = event.data ? event.data.json() : {}; }
    catch (_) { data = { body: event.data ? event.data.text() : 'You have a new update on Norvim.' }; }
    const options = {
      body: String(data.body || 'You have a new update on Norvim.'),
      icon: '/images/logo.png', badge: '/images/logo.png',
      tag: String(data.tag || ('norvim-' + Date.now())),
      renotify: true, silent: false,
      vibrate: Array.isArray(data.vibrate) && data.vibrate.length ? data.vibrate : [180, 90, 180],
      requireInteraction: false,
      data: { url: data.url || '/applicant-dashboard.html' },
      timestamp: Date.now()
    };
    try { await self.registration.showNotification(data.title || 'Norvim', options); }
    catch (error) { console.error('Norvim notification display failed:', error); }
  })());
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const destination = new URL(event.notification.data?.url || '/applicant-dashboard.html', self.location.origin).href;
  event.waitUntil((async () => {
    const clientsList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clientsList) {
      if (client.url.startsWith(self.location.origin) && 'focus' in client) {
        await client.focus();
        if ('navigate' in client && client.url !== destination) await client.navigate(destination);
        return;
      }
    }
    if (self.clients.openWindow) await self.clients.openWindow(destination);
  })());
});
