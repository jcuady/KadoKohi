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
  const options = {
    body: data.body || '',
    icon: '/logo/Logo2.png',
    badge: '/logo/Logo2.png',
    tag: data.tag || 'kado-order',
    renotify: true,
    data: { url: data.url || '/' },
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
