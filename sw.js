const CACHE_NAME = 'sav-orixis-v2';
const urlsToCache = [
  './',
  './index.html',
  './pages/home.html',
  './pages/fiche-intervention.html',
  './pages/signature-client.html',
  './pages/signature-intervenant.html',
  './pages/fiche-impression.html',
  './pages/guide-sav.html',
  './pages/contacts.html',
  './manifest.json',
  './magasins-temp.js',
  './collaborateurs.js',
  './src/css/main.css',
  './src/js/services/firebase-auth.js',
  './src/js/config/firebase-config.js'
  // Commenté car les images n'existent pas encore
  // './assets/images/icon-192.png',
  // './assets/images/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // Ajouter les URLs une par une pour gérer les erreurs
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
  // Ignorer les requêtes non-GET
  if (event.request.method !== 'GET') {
    return;
  }

  // Ignorer les requêtes vers Firebase
  if (event.request.url.includes('firebase') || 
      event.request.url.includes('googleapis') ||
      event.request.url.includes('gstatic')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Ne pas mettre en cache les mauvaises réponses
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
        // Si offline, chercher dans le cache
        return caches.match(event.request)
          .then(response => {
            if (response) {
              return response;
            }
            // Si pas dans le cache, retourner la page offline
            if (event.request.destination === 'document') {
              return caches.match('./index.html');
            }
          });
      })
  );
});
