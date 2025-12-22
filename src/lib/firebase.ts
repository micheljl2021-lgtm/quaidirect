import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';

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

// Request FCM token
export const requestFCMToken = async (): Promise<string | null> => {
  const msg = getFirebaseMessaging();
  if (!msg) {
    console.error('[Firebase] Messaging not available');
    return null;
  }

  try {
    // Register custom service worker for FCM
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    console.log('[Firebase] Service worker registered:', registration.scope);

    const token = await getToken(msg, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (token) {
      console.log('[Firebase] FCM Token obtained:', token.substring(0, 20) + '...');
      return token;
    } else {
      console.warn('[Firebase] No FCM token available');
      return null;
    }
  } catch (error) {
    console.error('[Firebase] Error getting FCM token:', error);
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
