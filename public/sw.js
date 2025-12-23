// =============================================
// QuaiDirect Service Worker - Simplified Version
// Push notifications + Caching (NO Firebase SDK)
// =============================================

// Cache version - this placeholder is replaced at build time
const CACHE_VERSION = '__CACHE_VERSION__';
const CACHE_NAME = `quaidirect-${CACHE_VERSION}`;
const RUNTIME_CACHE = `quaidirect-runtime-${CACHE_VERSION}`;

// Log version on load
console.log('[SW] Service worker loaded - Version:', CACHE_VERSION);

// =============================================
// Cache Management
// =============================================

// Assets to precache
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

// URLs to never cache (external scripts, APIs)
const NEVER_CACHE_PATTERNS = [
  'gstatic.com',
  'googleapis.com',
  'firebase',
  'supabase.co',
  '/rest/v1/',
  '/functions/v1/',
  '/auth/',
  'chrome-extension',
];

// Check if URL should be cached
const shouldCache = (url) => {
  return !NEVER_CACHE_PATTERNS.some(pattern => url.includes(pattern));
};

// Install event
self.addEventListener('install', (event) => {
  console.log('[SW] Installing version:', CACHE_VERSION);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching precache assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        console.log('[SW] Install complete, skipping waiting');
        return self.skipWaiting();
      })
      .catch((err) => {
        console.error('[SW] Install failed:', err);
      })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating version:', CACHE_VERSION);
  
  const currentCaches = [CACHE_NAME, RUNTIME_CACHE];
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // Delete old QuaiDirect caches that don't match current version
              return cacheName.startsWith('quaidirect-') && 
                     !currentCaches.includes(cacheName);
            })
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[SW] Activation complete');
        return self.clients.claim();
      })
  );
});

// Fetch event - network first with cache fallback
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  const url = event.request.url;
  
  // Skip non-http requests
  if (!url.startsWith('http')) return;
  
  // Skip URLs that should never be cached
  if (!shouldCache(url)) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses
        if (response.status === 200 && shouldCache(url)) {
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // Fallback to index for navigation requests
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/');
          }
          return new Response('Offline', { status: 503 });
        });
      })
  );
});

// =============================================
// Push Notifications (NO Firebase SDK needed)
// =============================================

// Handle push events - this receives FCM messages in background
self.addEventListener('push', (event) => {
  console.log('[SW] Push event received');
  
  let data = {
    title: 'QuaiDirect',
    body: 'Nouvelle notification',
    icon: '/icon-192.png',
    url: '/',
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      console.log('[SW] Push payload:', payload);
      
      // Handle FCM format
      if (payload.notification) {
        data = {
          title: payload.notification.title || data.title,
          body: payload.notification.body || data.body,
          icon: payload.notification.icon || data.icon,
          url: payload.data?.url || payload.fcmOptions?.link || data.url,
        };
      } else {
        // Handle direct data format
        data = {
          title: payload.title || data.title,
          body: payload.body || data.body,
          icon: payload.icon || data.icon,
          url: payload.url || payload.data?.url || data.url,
        };
      }
    } catch (e) {
      console.error('[SW] Error parsing push data:', e);
      // Try as text
      try {
        data.body = event.data.text();
      } catch (e2) {
        console.error('[SW] Error parsing push text:', e2);
      }
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: '/icon-192.png',
    data: { url: data.url },
    vibrate: [200, 100, 200],
    tag: 'quaidirect-push',
    requireInteraction: true,
    actions: [
      { action: 'open', title: 'Voir' },
      { action: 'close', title: 'Fermer' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification.tag);
  event.notification.close();

  // Handle actions
  if (event.action === 'close') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Try to focus an existing window
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus().then(() => client.navigate(urlToOpen));
          }
        }
        // Open new window if none exists
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// =============================================
// Message Handler (for client-SW communication)
// =============================================

self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data?.type);
  
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data?.type === 'GET_VERSION') {
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage({ version: CACHE_VERSION });
    }
  }
  
  if (event.data?.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      }).then(() => {
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ cleared: true });
        }
      })
    );
  }
  
  if (event.data?.type === 'FORCE_UPDATE') {
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
