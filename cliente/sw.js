const CACHE_NAME = 'l1deres-pwa-v1';
const urlsToCache = [
  './index.html',
  './style.css',
  './app.js',
  '../logo.jpg',
  '../background_neon.png',
  '../f1_car_side.png'
];

// Install event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response; // Devuelve del cache
        }
        return fetch(event.request); // Busca en red
      })
  );
});
