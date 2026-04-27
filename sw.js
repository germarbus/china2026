const CACHE_NAME = 'china2026-v1';
const SHELL_URLS = [
  '/china2026/',
  '/china2026/index.html'
];

// Install: cache the app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_URLS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network first, cache fallback
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // For Google Sheets CSV: always network, no cache
  if (event.request.url.includes('docs.google.com')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // For API calls (weather, exchange rate): always network
  if (event.request.url.includes('open-meteo.com') || event.request.url.includes('exchangerate')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // For everything else: network first, cache fallback
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
