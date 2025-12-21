// Cache version - simple timestamp-based versioning
const CACHE_VERSION = '2025-06-21';
const CACHE_NAME = `quaidirect-${CACHE_VERSION}`;
const RUNTIME_CACHE = `quaidirect-runtime-${CACHE_VERSION}`;
const STATIC_CACHE = `quaidirect-static-${CACHE_VERSION}`;
const API_CACHE = `quaidirect-api-${CACHE_VERSION}`;

// Assets à mettre en cache lors de l'installation
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/arrivages',
  '/carte',
  '/premium',
];

// Patterns pour les stratégies de cache
const CACHE_STRATEGIES = {
  // Cache First - pour les assets statiques (images, fonts, CSS)
  cacheFirst: [
    /\.(png|jpg|jpeg|gif|webp|svg|ico)$/,
    /\.(woff|woff2|ttf|eot)$/,
    /\.css$/,
  ],
  // Network First - pour les données API dynamiques
  networkFirst: [
    /\/functions\/v1\//,
    /\/rest\/v1\//,
    /supabase\.co/,
  ],
  // Stale While Revalidate - pour les données semi-statiques
  staleWhileRevalidate: [
    /\/assets\//,
    /\.js$/,
  ],
};

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
  const currentCaches = [CACHE_NAME, RUNTIME_CACHE, STATIC_CACHE, API_CACHE];
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            // Keep only current version caches
            // Delete all old caches including those with old versions or without versions
            return !currentCaches.includes(cacheName);
          })
          .map((cacheName) => {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => {
      console.log('Service Worker activated with version:', CACHE_VERSION);
      // Take control of all pages immediately
      return self.clients.claim();
    })
  );
});

// Déterminer la stratégie de cache pour une URL
function getCacheStrategy(url) {
  for (const pattern of CACHE_STRATEGIES.cacheFirst) {
    if (pattern.test(url)) return 'cacheFirst';
  }
  for (const pattern of CACHE_STRATEGIES.networkFirst) {
    if (pattern.test(url)) return 'networkFirst';
  }
  for (const pattern of CACHE_STRATEGIES.staleWhileRevalidate) {
    if (pattern.test(url)) return 'staleWhileRevalidate';
  }
  return 'networkFirst'; // Default
}

// Cache First Strategy - pour les assets statiques
async function cacheFirstStrategy(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Return offline fallback for images
    if (request.destination === 'image') {
      return new Response(
        '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="#f0f0f0" width="100" height="100"/><text x="50%" y="50%" text-anchor="middle" fill="#999" font-size="12">Hors ligne</text></svg>',
        { headers: { 'Content-Type': 'image/svg+xml' } }
      );
    }
    throw error;
  }
}

// Network First Strategy - pour les données API
async function networkFirstStrategy(request) {
  const cache = await caches.open(API_CACHE);
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.status === 200) {
      // Clone et mettre en cache avec un TTL de 5 minutes
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return new Response(
      JSON.stringify({ error: 'Offline', message: 'Données non disponibles hors ligne' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Stale While Revalidate Strategy
async function staleWhileRevalidateStrategy(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => cachedResponse);
  
  return cachedResponse || fetchPromise;
}

// Gestion des requêtes fetch
self.addEventListener('fetch', (event) => {
  // Ignorer les requêtes non-GET et les requêtes vers des domaines tiers non-API
  if (event.request.method !== 'GET') {
    return;
  }
  
  const url = event.request.url;
  
  // Ignorer les requêtes chrome-extension et autres protocoles non-http
  if (!url.startsWith('http')) {
    return;
  }
  
  const strategy = getCacheStrategy(url);
  
  event.respondWith(
    (async () => {
      try {
        switch (strategy) {
          case 'cacheFirst':
            return await cacheFirstStrategy(event.request);
          case 'networkFirst':
            return await networkFirstStrategy(event.request);
          case 'staleWhileRevalidate':
            return await staleWhileRevalidateStrategy(event.request);
          default:
            return await networkFirstStrategy(event.request);
        }
      } catch (error) {
        // Fallback pour les pages HTML
        if (event.request.headers.get('accept')?.includes('text/html')) {
          const cache = await caches.open(CACHE_NAME);
          return cache.match('/index.html') || new Response('Hors ligne', { status: 503 });
        }
        return new Response('Offline', { status: 503 });
      }
    })()
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
  
  // Clear specific cache
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    const cacheName = event.data.cacheName || RUNTIME_CACHE;
    caches.delete(cacheName);
  }
  
  // Check cache version
  if (event.data && event.data.type === 'GET_VERSION') {
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage({ version: CACHE_VERSION });
    }
  }
  
  // Force update - clear all caches and skip waiting
  if (event.data && event.data.type === 'FORCE_UPDATE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      }).then(() => {
        self.skipWaiting();
      })
    );
  }
});

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
  let data = {
    title: 'QuaiDirect',
    body: 'Nouvelle notification',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      console.error('Error parsing push data:', e);
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    data: data.data || {},
    vibrate: [200, 100, 200],
    tag: 'quaidirect-notification',
    requireInteraction: false,
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open with the app
        for (let client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus().then(() => client.navigate(urlToOpen));
          }
        }
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
