// DeathToData Service Worker
// Enables offline search and fast loading

const CACHE_NAME = 'deathtodata-v2'; // Increment version to force cache refresh
const urlsToCache = [
  './',
  './index.html',
  './search.html',
  './dashboard.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Install - Cache static files
self.addEventListener('install', event => {
  console.log('[DeathToData SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[DeathToData SW] Caching app files');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate - Clean old caches
self.addEventListener('activate', event => {
  console.log('[DeathToData SW] Activating...');
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('[DeathToData SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch - Cache first for static, network first for API
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Network-first strategy for API calls
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache successful API responses for offline fallback
          if (response.ok) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => cache.put(event.request, responseToCache));
          }
          return response;
        })
        .catch(() => {
          // Offline - try to serve from cache
          return caches.match(event.request)
            .then(cachedResponse => {
              if (cachedResponse) {
                console.log('[DeathToData SW] Serving API from cache (offline)');
                return cachedResponse;
              }
              // Return offline response
              return new Response(JSON.stringify({
                error: 'offline',
                message: 'You are offline. Search requires internet connection.',
                cached: false
              }), {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
              });
            });
        })
    );
    return;
  }

  // Cache-first strategy for static files
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          console.log('[DeathToData SW] Serving from cache:', event.request.url);
          return response;
        }

        return fetch(event.request)
          .then(response => {
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }

            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => cache.put(event.request, responseToCache));

            return response;
          })
          .catch(() => {
            // Offline fallback
            return new Response('Offline - DeathToData requires internet connection for search', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// Background sync for analytics (when back online)
self.addEventListener('sync', event => {
  if (event.tag === 'sync-analytics') {
    event.waitUntil(syncAnalytics());
  }
});

async function syncAnalytics() {
  // Send any queued analytics when back online
  const cache = await caches.open(CACHE_NAME);
  const requests = await cache.keys();
  const analyticsRequests = requests.filter(req => req.url.includes('/api/analytics'));

  for (const request of analyticsRequests) {
    try {
      await fetch(request);
      await cache.delete(request);
      console.log('[DeathToData SW] Synced analytics');
    } catch (error) {
      console.error('[DeathToData SW] Failed to sync analytics:', error);
    }
  }
}

console.log('[DeathToData SW] Service Worker loaded');
