/* Kado Kohi web-push handlers. Imported into the generated service worker
   via Workbox importScripts. Keep this dependency-free. */

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'Kado Kohi', body: event.data ? event.data.text() : '' };
  }

  const title = data.title || 'Kado Kohi';
  const isOrderAlert = typeof data.tag === 'string' && data.tag.startsWith('order-');
  const isNewOrder = typeof data.tag === 'string' && data.tag.startsWith('new-order-');
  const isProof = typeof data.tag === 'string' && data.tag.startsWith('proof-');

  const options = {
    body: data.body || '',
    icon: data.icon || '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    image: data.image || undefined,
    tag: data.tag || 'kado-order',
    renotify: true,
    requireInteraction: isNewOrder || isProof,
    vibrate: isNewOrder || isProof ? [120, 60, 120, 60, 120] : [80, 40, 80],
    timestamp: Date.now(),
    silent: false,
    data: {
      url: data.url || '/',
      tag: data.tag || 'kado-order',
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    }),
  );
});

self.addEventListener('notificationclose', (event) => {
  // Reserved for analytics — no-op for now.
  void event;
});
