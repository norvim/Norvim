/* Norvim Stairs service worker: background web-push notifications. */
self.addEventListener('install', event => { event.waitUntil(self.skipWaiting()); });
self.addEventListener('activate', event => { event.waitUntil(self.clients.claim()); });
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
