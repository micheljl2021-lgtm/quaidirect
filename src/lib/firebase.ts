// Firebase Cloud Messaging integration for QuaiDirect push notifications
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, type Messaging } from 'firebase/messaging';

// Firebase configuration - must match sw.js
const firebaseConfig = {
  apiKey: "AIzaSyCk_r6Pv2-PdvLoJRkn-GHRK1NOu58JMkg",
  authDomain: "arcane-argon-426216-b7.firebaseapp.com",
  projectId: "arcane-argon-426216-b7",
  storageBucket: "arcane-argon-426216-b7.firebasestorage.app",
  messagingSenderId: "425193275047",
  appId: "1:425193275047:web:e3b3f08dcb366d919da582",
  measurementId: "G-ERMEXSWNZS"
};

// Get VAPID key from environment - this is the SINGLE source of truth
const getVapidKey = (): string | null => {
  const rawKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  
  if (!rawKey) {
    console.error('[Firebase] VITE_VAPID_PUBLIC_KEY is not configured');
    return null;
  }
  
  // Clean the key (remove whitespace, quotes, and any VITE_ prefix if mistakenly included)
  let cleanKey = rawKey.trim().replace(/^["']|["']$/g, '');
  if (cleanKey.startsWith('VITE_')) {
    cleanKey = cleanKey.replace(/^VITE_/, '');
  }
  
  console.log('[Firebase] VAPID key loaded - length:', cleanKey.length, '- prefix:', cleanKey.substring(0, 12) + '...');
  return cleanKey;
};

// Initialize Firebase (singleton)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Get messaging instance (only in browser)
let messagingInstance: Messaging | null = null;

export const getFirebaseMessaging = (): Messaging | null => {
  if (typeof window === 'undefined') {
    console.log('[Firebase] Not in browser environment');
    return null;
  }
  
  if (!('Notification' in window)) {
    console.log('[Firebase] Notifications API not supported');
    return null;
  }
  
  if (!('serviceWorker' in navigator)) {
    console.log('[Firebase] Service Worker not supported');
    return null;
  }
  
  if (!messagingInstance) {
    try {
      messagingInstance = getMessaging(app);
      console.log('[Firebase] Messaging instance created');
    } catch (error) {
      console.error('[Firebase] Error initializing messaging:', error);
      return null;
    }
  }
  
  return messagingInstance;
};

// Request FCM token with comprehensive error handling
export const requestFCMToken = async (): Promise<string | null> => {
  console.log('[Firebase] Requesting FCM token...');

  // Check browser support
  if (typeof window === 'undefined') {
    console.error('[Firebase] Not in browser environment');
    return null;
  }

  if (!('Notification' in window)) {
    console.error('[Firebase] Notifications API not supported');
    return null;
  }

  if (!('serviceWorker' in navigator)) {
    console.error('[Firebase] Service Worker not supported');
    return null;
  }

  // Check permission
  const permission = Notification.permission;
  console.log('[Firebase] Current permission:', permission);

  if (permission === 'denied') {
    console.error('[Firebase] Notifications blocked by user');
    const err: any = new Error('Notifications bloquées par l\'utilisateur');
    err.code = 'messaging/permission-blocked';
    throw err;
  }

  // Request permission if needed
  if (permission === 'default') {
    console.log('[Firebase] Requesting permission...');
    const newPermission = await Notification.requestPermission();
    console.log('[Firebase] Permission result:', newPermission);
    
    if (newPermission !== 'granted') {
      const err: any = new Error('Permission non accordée');
      err.code = 'messaging/permission-denied';
      throw err;
    }
  }

  // Get VAPID key
  const vapidKey = getVapidKey();
  if (!vapidKey) {
    const err: any = new Error('Clé VAPID manquante (VITE_VAPID_PUBLIC_KEY)');
    err.code = 'missing-vapid-key';
    throw err;
  }

  try {
    // Register/update service worker
    console.log('[Firebase] Registering service worker...');
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    console.log('[Firebase] Service worker registered, scope:', registration.scope);

    // Try to update (non-blocking)
    registration.update().catch((e) => console.log('[Firebase] SW update check:', e));

    // Wait for service worker to be ready
    await navigator.serviceWorker.ready;
    console.log('[Firebase] Service worker is ready');

    // Get messaging instance
    const messaging = getFirebaseMessaging();
    if (!messaging) {
      const err: any = new Error('Firebase Messaging indisponible');
      err.code = 'messaging-unavailable';
      throw err;
    }

    // Get FCM token
    console.log('[Firebase] Getting FCM token with VAPID key...');
    const token = await getToken(messaging, {
      vapidKey: vapidKey,
      serviceWorkerRegistration: registration,
    });

    if (token) {
      console.log('[Firebase] FCM token obtained - length:', token.length);
      console.log('[Firebase] Token prefix:', token.substring(0, 20) + '...');
      return token;
    }

    const err: any = new Error('Aucun token retourné par Firebase');
    err.code = 'no-token';
    throw err;

  } catch (error: any) {
    console.error('[Firebase] Error getting FCM token:', error);
    console.error('[Firebase] Error code:', error?.code);
    console.error('[Firebase] Error message:', error?.message);

    // Re-throw with normalized error
    const normalized: any = new Error(error?.message || 'Erreur inconnue');
    normalized.code = error?.code || 'unknown';
    throw normalized;
  }
};

// Listen for foreground messages
export const onForegroundMessage = (callback: (payload: any) => void) => {
  const messaging = getFirebaseMessaging();
  if (!messaging) {
    console.warn('[Firebase] Cannot listen for messages - messaging not available');
    return () => {};
  }
  
  return onMessage(messaging, (payload) => {
    console.log('[Firebase] Foreground message received:', payload);
    callback(payload);
  });
};

export { app as firebaseApp };
