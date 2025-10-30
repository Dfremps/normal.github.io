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

// Install Service Worker and cache all assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
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

// Fetch assets from cache first, then network fallback
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request);
    }).catch(() => {
      // Optionally return a fallback page or image
    })
  );
});
