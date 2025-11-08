const CACHE_NAME = 'quaidirect-v1';
const RUNTIME_CACHE = 'quaidirect-runtime';

// Assets à mettre en cache lors de l'installation
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Installation du service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activation et nettoyage des anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Stratégie de mise en cache : Network First avec fallback
self.addEventListener('fetch', (event) => {
  // Ignorer les requêtes non-GET et les requêtes vers des domaines externes
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.open(RUNTIME_CACHE).then((cache) => {
      return fetch(event.request)
        .then((response) => {
          // Mettre en cache la réponse réussie
          if (response.status === 200) {
            cache.put(event.request, response.clone());
          }
          return response;
        })
        .catch(() => {
          // En cas d'échec réseau, chercher dans le cache
          return cache.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Fallback pour les pages HTML
            if (event.request.headers.get('accept').includes('text/html')) {
              return cache.match('/index.html');
            }
            return new Response('Offline', { status: 503 });
          });
        });
    })
  );
});

// Gestion du background sync pour les drops créés hors ligne
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-drops') {
    event.waitUntil(syncOfflineDrops());
  }
});

async function syncOfflineDrops() {
  // Cette fonction sera implémentée côté client avec IndexedDB
  // pour rejouer les requêtes POST en attente
  console.log('Syncing offline drops...');
}

// Message handler pour les communications client-SW
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
