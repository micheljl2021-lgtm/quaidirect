// Firebase Cloud Messaging integration for QuaiDirect push notifications
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, type Messaging } from 'firebase/messaging';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCk_r6Pv2-PdvLoJRkn-GHRK1NOu58JMkg",
  authDomain: "arcane-argon-426216-b7.firebaseapp.com",
  projectId: "arcane-argon-426216-b7",
  storageBucket: "arcane-argon-426216-b7.firebasestorage.app",
  messagingSenderId: "425193275047",
  appId: "1:425193275047:web:e3b3f08dcb366d919da582",
};

// VAPID key for web push
const VAPID_KEY = "BOtX3NFoSWNKMfJGfOALKab5JcTNzWKuYmEg4pumfS9BJ7PlOm5KTmYn9PtvdT-CC9BQ9Yy2eK4ypkYM8jHiU";

// Initialize Firebase (only once)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Get messaging instance (only in browser)
let messaging: Messaging | null = null;

export const getFirebaseMessaging = (): Messaging | null => {
  if (typeof window === 'undefined') return null;
  if (!('Notification' in window)) return null;
  if (!('serviceWorker' in navigator)) return null;
  
  if (!messaging) {
    try {
      messaging = getMessaging(app);
    } catch (error) {
      console.error('[Firebase] Error initializing messaging:', error);
      return null;
    }
  }
  return messaging;
};

// Request FCM token with detailed error logging
export const requestFCMToken = async (): Promise<string | null> => {
  const msg = getFirebaseMessaging();
  if (!msg) {
    console.error('[Firebase] Messaging not available - check browser support for notifications and service workers');
    return null;
  }

  try {
    // Check notification permission first
    const permission = Notification.permission;
    console.log('[Firebase] Current notification permission:', permission);
    
    if (permission === 'denied') {
      console.error('[Firebase] Notifications are blocked by user');
      return null;
    }

    // Register custom service worker for FCM
    console.log('[Firebase] Registering service worker...');
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    console.log('[Firebase] Service worker registered:', registration.scope);

    // Wait for the service worker to be ready
    await navigator.serviceWorker.ready;
    console.log('[Firebase] Service worker is ready');

    console.log('[Firebase] Requesting FCM token with VAPID key...');
    const token = await getToken(msg, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (token) {
      console.log('[Firebase] FCM Token obtained successfully:', token.substring(0, 20) + '...');
      return token;
    } else {
      console.warn('[Firebase] No FCM token returned - notification permission may not be granted');
      return null;
    }
  } catch (error: any) {
    // Detailed error logging
    console.error('[Firebase] Error getting FCM token:', error);
    console.error('[Firebase] Error code:', error?.code);
    console.error('[Firebase] Error message:', error?.message);
    
    // Common error hints
    if (error?.code === 'messaging/permission-blocked') {
      console.error('[Firebase] Hint: User has blocked notifications');
    } else if (error?.code === 'messaging/failed-service-worker-registration') {
      console.error('[Firebase] Hint: Service worker registration failed - check firebase-messaging-sw.js');
    } else if (error?.message?.includes('VAPID')) {
      console.error('[Firebase] Hint: VAPID key may be incorrect');
    }
    
    return null;
  }
};

// Listen for foreground messages
export const onForegroundMessage = (callback: (payload: any) => void) => {
  const msg = getFirebaseMessaging();
  if (!msg) return () => {};
  
  return onMessage(msg, (payload) => {
    console.log('[Firebase] Foreground message received:', payload);
    callback(payload);
  });
};

export { app as firebaseApp };
