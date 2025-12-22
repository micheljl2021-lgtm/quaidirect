// Firebase Messaging Service Worker
// This handles background push notifications from FCM

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Firebase configuration
firebase.initializeApp({
  apiKey: "AIzaSyCk_r6Pv2-PdvLoJRkn-GHRK1NOu58JMkg",
  authDomain: "arcane-argon-426216-b7.firebaseapp.com",
  projectId: "arcane-argon-426216-b7",
  storageBucket: "arcane-argon-426216-b7.firebasestorage.app",
  messagingSenderId: "425193275047",
  appId: "1:425193275047:web:e3b3f08dcb366d919da582",
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[FCM SW] Background message received:', payload);

  const notificationTitle = payload.notification?.title || payload.data?.title || 'QuaiDirect';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || 'Nouvelle notification',
    icon: payload.notification?.icon || '/icon-192.png',
    badge: '/icon-192.png',
    data: payload.data || {},
    vibrate: [200, 100, 200],
    tag: 'quaidirect-fcm',
    requireInteraction: false,
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[FCM SW] Notification clicked:', event);
  
  event.notification.close();

  const urlToOpen = event.notification.data?.url || event.notification.data?.click_action || '/arrivages';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (let client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus().then(() => client.navigate(urlToOpen));
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

console.log('[FCM SW] Firebase Messaging Service Worker loaded');
