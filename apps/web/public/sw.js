// The old onlineland.in had a service worker (cache "onlineland-v13"). The new site does not use one.
// Browsers that still have the old worker download this file, which removes the old caches,
// unregisters itself and reloads open tabs so visitors see the new site.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach((c) => c.navigate(c.url));
    })(),
  );
});
