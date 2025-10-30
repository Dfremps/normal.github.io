// Shakmen - Service Worker
// Handles offline caching for faster loading and limited offline access.

const CACHE_NAME = 'mini-shop-v2';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './script.js',
  './manifest.json',
  './images/shoe.jpg',
  './images/bag.jpg',
  './images/icon-192.png',
  './images/icon-512.png'
];

// Install Service Worker and cache all assets (tolerant to missing files)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // cache assets individually so a single missing asset won't fail the entire install
      await Promise.all(ASSETS.map(async (asset) => {
        try {
          await cache.add(asset);
        } catch (err) {
          console.warn('SW: failed to cache', asset, err);
        }
      }));
    })
  );
  self.skipWaiting();
});

// Activate Service Worker and remove old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => { if (key !== CACHE_NAME) return caches.delete(key); })
    ))
  );
  self.clients.claim();
});

// Fetch assets from cache first, then network fallback. Provide image fallback on errors.
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(networkRes => {
        return networkRes;
      });
    }).catch(() => {
      // If request is for an image, return a tiny SVG placeholder
      if (event.request.destination === 'image' || /\.png$|\.jpg$|\.jpeg$|\.gif$/.test(event.request.url)) {
        return new Response(
          '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="100%" height="100%" fill="#eee"/><text x="50%" y="50%" fill="#999" dy=".3em" font-size="20" text-anchor="middle">Image unavailable</text></svg>',
          { headers: { 'Content-Type': 'image/svg+xml' } }
        );
      }
      // Fallback to cached index if available
      return caches.match('./index.html');
    })
  );
});
// ...existing code...
