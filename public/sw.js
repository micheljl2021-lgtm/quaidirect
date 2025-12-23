// =============================================
// QuaiDirect Service Worker - Version 2025-12-23-v2
// Firebase Cloud Messaging + Caching
// =============================================

// Cache version - update this to force cache refresh
const CACHE_VERSION = '2025-12-23-v2';
const CACHE_NAME = `quaidirect-${CACHE_VERSION}`;
const RUNTIME_CACHE = `quaidirect-runtime-${CACHE_VERSION}`;
const STATIC_CACHE = `quaidirect-static-${CACHE_VERSION}`;

// Firebase SDK - using compat version for service worker (10.12.0)
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Initialize Firebase for FCM
let fcmMessaging = null;
try {
  firebase.initializeApp({
    apiKey: "AIzaSyCk_r6Pv2-PdvLoJRkn-GHRK1NOu58JMkg",
    authDomain: "arcane-argon-426216-b7.firebaseapp.com",
    projectId: "arcane-argon-426216-b7",
    storageBucket: "arcane-argon-426216-b7.firebasestorage.app",
    messagingSenderId: "425193275047",
    appId: "1:425193275047:web:e3b3f08dcb366d919da582",
  });
  fcmMessaging = firebase.messaging();
  console.log('[SW] Firebase Messaging initialized successfully');
} catch (err) {
  console.error('[SW] Firebase init error:', err);
}

// Handle FCM background messages
if (fcmMessaging) {
  fcmMessaging.onBackgroundMessage((payload) => {
    console.log('[SW] FCM Background message received:', payload);

    const notificationTitle = payload.notification?.title || payload.data?.title || 'QuaiDirect';
    const notificationOptions = {
      body: payload.notification?.body || payload.data?.body || 'Nouvelle notification',
      icon: payload.notification?.icon || payload.data?.icon || '/icon-192.png',
      badge: '/icon-192.png',
      data: {
        url: payload.data?.url || payload.fcmOptions?.link || '/',
        ...payload.data
      },
      vibrate: [200, 100, 200],
      tag: 'quaidirect-fcm',
      requireInteraction: true,
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
  });
}

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
  
  const currentCaches = [CACHE_NAME, RUNTIME_CACHE, STATIC_CACHE];
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // Delete old caches that don't match current version
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
  
  // Skip API and Supabase requests (don't cache these)
  if (url.includes('/rest/v1/') || 
      url.includes('/functions/v1/') ||
      url.includes('supabase.co') ||
      url.includes('/auth/')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses
        if (response.status === 200) {
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

// Handle push events (fallback if FCM doesn't work)
self.addEventListener('push', (event) => {
  console.log('[SW] Push event received');
  
  let data = {
    title: 'QuaiDirect',
    body: 'Nouvelle notification',
    icon: '/icon-192.png',
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = {
        title: payload.notification?.title || payload.title || data.title,
        body: payload.notification?.body || payload.body || data.body,
        icon: payload.notification?.icon || payload.icon || data.icon,
        data: payload.data || {},
      };
    } catch (e) {
      console.error('[SW] Error parsing push data:', e);
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: '/icon-192.png',
    data: data.data || {},
    vibrate: [200, 100, 200],
    tag: 'quaidirect-push',
    requireInteraction: true,
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification.tag);
  event.notification.close();

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

// Message handler for client-SW communication
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data?.type === 'GET_VERSION') {
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage({ version: CACHE_VERSION });
    }
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

console.log('[SW] Service worker script loaded - Version:', CACHE_VERSION);
