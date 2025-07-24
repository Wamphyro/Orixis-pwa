const CACHE_NAME = 'sav-orixis-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/pages/home.html',
  '/pages/fiche-intervention.html',
  '/pages/signature-client.html',
  '/pages/signature-intervenant.html',
  '/pages/fiche-impression.html',
  '/pages/guide-sav.html',
  '/pages/contacts.html',
  '/manifest.json',
  '/assets/images/icon-192.png',
  '/assets/images/icon-512.png',
  '/assets/css/main.css',
  '/assets/js/config/app.config.js',
  '/assets/js/services/auth.service.js',
  '/assets/js/services/storage.service.js',
  '/assets/js/pages/login.js'
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
        // Si la réponse est valide, on la met en cache
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
        // Si pas de réseau, on cherche dans le cache
        return caches.match(event.request);
      })
  );
});