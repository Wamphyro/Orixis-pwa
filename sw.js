const CACHE_NAME = 'sav-orixis-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/auth-config.js',
  '/auth-check.js',
  '/pages/home.html',
  '/pages/fiche-intervention.html',
  '/pages/signature-client.html',
  '/pages/signature-intervenant.html',
  '/pages/fiche-impression.html',
  '/pages/guide-sav.html',
  '/pages/contacts.html',
  '/manifest.json',
  '/assets/images/icon-192.png',
  '/assets/images/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});