// OnlineLand Service Worker
// v2 — cross-origin requests bypass the SW entirely (Firebase/gstatic fix)

const CACHE_NAME = 'onlineland-v9';

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

// పాత cache లు తొలగించడం
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;

  // 1) GET కాని రిక్వెస్ట్‌లు SW ముట్టుకోదు
  if (req.method !== 'GET') return;

  // 2) వేరే డొమైన్ రిక్వెస్ట్‌లు (gstatic, firebase, googleapis...) SW ముట్టుకోదు
  //    ఇదే ముఖ్యమైన ఫిక్స్ — Firebase నేరుగా బ్రౌజర్‌కే వెళ్తుంది
  if (new URL(req.url).origin !== self.location.origin) return;

  // 3) సొంత సైట్ ఫైల్‌లు: ముందు నెట్‌వర్క్, పడిపోతే cache
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.ok && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then((cached) => {
          if (cached) return cached;
          // ఏమీ లేకపోతే సరైన error ఇవ్వాలి (undefined ఇవ్వకూడదు)
          return new Response('Offline', {
            status: 503,
            statusText: 'Offline',
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
          });
        })
      )
  );
});
