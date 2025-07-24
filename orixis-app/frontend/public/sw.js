// public/sw.js
const CACHE_NAME = 'orixis-app-v1';
const urlsToCache = [
  // Pages HTML
  '/',
  '/index.html',
  '/home.html',
  '/fiche-intervention.html',
  '/signature-client.html',
  '/signature-intervenant.html',
  '/fiche-impression.html',
  '/guide-sav.html',
  '/contacts.html',
  
  // CSS
  '/src/css/variables.css',
  '/src/css/styles.css',
  '/src/css/components.css',
  '/src/css/responsive.css',
  '/src/css/print.css',
  
  // JavaScript Modules
  '/src/js/app.js',
  '/src/js/config/app.config.js',
  '/src/js/services/auth.service.js',
  '/src/js/services/email.service.js',
  '/src/js/services/storage.service.js',
  '/src/js/services/intervention.service.js',
  '/src/js/components/signature-canvas.js',
  '/src/js/utils/date.utils.js',
  '/src/js/utils/dom.utils.js',
  '/src/js/utils/validation.utils.js',
  '/src/js/data/index.js',
  
  // Assets
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Installation du Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache ouvert');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Erreur lors de la mise en cache:', error);
      })
  );
});

// Activation du Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Suppression ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Stratégie de cache : Network First avec fallback
self.addEventListener('fetch', event => {
  // Ignorer les requêtes non-GET
  if (event.request.method !== 'GET') {
    return;
  }

  // Pour les API externes (EmailJS, etc.), toujours réseau
  if (event.request.url.includes('emailjs.com') || 
      event.request.url.includes('googleapis.com')) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Vérifier si la réponse est valide
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Cloner la réponse pour la mettre en cache
        const responseToCache = response.clone();

        caches.open(CACHE_NAME)
          .then(cache => {
            cache.put(event.request, responseToCache);
          });

        return response;
      })
      .catch(() => {
        // En cas d'échec réseau, utiliser le cache
        return caches.match(event.request)
          .then(response => {
            if (response) {
              return response;
            }

            // Si pas en cache, retourner une page hors ligne
            if (event.request.mode === 'navigate') {
              return caches.match('/offline.html');
            }
          });
      })
  );
});

// Gestion des messages du client
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Synchronisation en arrière-plan (si supportée)
self.addEventListener('sync', event => {
  if (event.tag === 'sync-interventions') {
    event.waitUntil(syncInterventions());
  }
});

async function syncInterventions() {
  // Logique de synchronisation des interventions
  // À implémenter avec l'API backend
  console.log('Synchronisation des interventions...');
}