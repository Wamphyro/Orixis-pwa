const CACHE_NAME = 'sav-orixis-v3';
const urlsToCache = [
  './',
  './index.html',
  './pages/home.html',
  './pages/intervention.html',
  './pages/signature-client.html',
  './pages/signature-intervenant.html',
  './pages/print-preview.html',
  './pages/guide.html',
  './pages/contacts.html',
  './manifest.json',
  './magasins-temp.js',
  './collaborateurs.js',
  './src/css/main.css',
  './src/js/services/firebase-auth.js',
  './src/js/config/firebase-config.js'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return Promise.all(
          urlsToCache.map(url => {
            return cache.add(url).catch(err => {
              console.warn('Erreur mise en cache de:', url, err);
            });
          })
        );
      })
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
  if (event.request.method !== 'GET') {
    return;
  }

  if (event.request.url.includes('firebase') || 
      event.request.url.includes('googleapis') ||
      event.request.url.includes('gstatic')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME)
          .then(cache => {
            cache.put(event.request, responseToCache);
          });

        return response;
      })
      .catch(() => {
        return caches.match(event.request)
          .then(response => {
            if (response) {
              return response;
            }
            if (event.request.destination === 'document') {
              return caches.match('./index.html');
            }
          });
      })
  );
});
