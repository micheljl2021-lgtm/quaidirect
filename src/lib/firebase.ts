// Firebase Cloud Messaging integration for QuaiDirect push notifications
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, type Messaging } from 'firebase/messaging';

// Defaults for Firebase config (fallback values)
const FIREBASE_DEFAULTS = {
  apiKey: "AIzaSyCk_r6Pv2-PdvLoJRkn-GHRK1NOu58JMkg",
  authDomain: "arcane-argon-426216-b7.firebaseapp.com",
  projectId: "arcane-argon-426216-b7",
  storageBucket: "arcane-argon-426216-b7.firebasestorage.app",
  messagingSenderId: "425193275047",
  appId: "1:425193275047:web:e3b3f08dcb366d919da582",
  measurementId: "G-ERMEXSWNZS"
};

// Clean a config value (remove quotes, whitespace, VITE_ prefix)
const cleanConfigValue = (value: string | undefined, fieldName: string): string | null => {
  if (!value) return null;
  
  let clean = value.trim().replace(/^["']|["']$/g, '');
  
  // Remove accidental VITE_ prefix in the value itself
  if (clean.startsWith('VITE_')) {
    console.warn(`[Firebase] ${fieldName} had VITE_ prefix in value, removing it`);
    clean = clean.replace(/^VITE_/, '');
  }
  
  // Remove newlines
  clean = clean.replace(/[\r\n]/g, '');
  
  return clean.length > 0 ? clean : null;
};

// Get Firebase API key from environment variable
const getFirebaseApiKey = (): { value: string; source: 'env' | 'fallback'; issues: string[] } => {
  const rawKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const issues: string[] = [];
  
  if (!rawKey) {
    console.warn('[Firebase] VITE_FIREBASE_API_KEY not set, using fallback');
    return { value: FIREBASE_DEFAULTS.apiKey, source: 'fallback', issues: ['Variable non configurée'] };
  }
  
  // Check for common issues
  if (rawKey.startsWith('"') || rawKey.startsWith("'")) {
    issues.push('Quotes détectées');
  }
  if (rawKey.startsWith('VITE_')) {
    issues.push('Préfixe VITE_ dans la valeur');
  }
  if (rawKey.includes('\n') || rawKey.includes('\r')) {
    issues.push('Retours ligne détectés');
  }
  
  const cleaned = cleanConfigValue(rawKey, 'API Key');
  
  if (!cleaned || cleaned.length < 30) {
    console.error('[Firebase] API key too short after cleaning, using fallback');
    issues.push('Clé trop courte');
    return { value: FIREBASE_DEFAULTS.apiKey, source: 'fallback', issues };
  }
  
  return { value: cleaned, source: 'env', issues };
};

// Get other Firebase config values from env or fallback
const getFirebaseProjectId = (): string => {
  return cleanConfigValue(import.meta.env.VITE_FIREBASE_PROJECT_ID, 'projectId') || FIREBASE_DEFAULTS.projectId;
};

const getFirebaseMessagingSenderId = (): string => {
  return cleanConfigValue(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID, 'senderId') || FIREBASE_DEFAULTS.messagingSenderId;
};

const getFirebaseAppId = (): string => {
  return cleanConfigValue(import.meta.env.VITE_FIREBASE_APP_ID, 'appId') || FIREBASE_DEFAULTS.appId;
};

const getFirebaseAuthDomain = (): string => {
  return cleanConfigValue(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN, 'authDomain') || FIREBASE_DEFAULTS.authDomain;
};

// Build Firebase configuration
const apiKeyResult = getFirebaseApiKey();
const firebaseConfig = {
  apiKey: apiKeyResult.value,
  authDomain: getFirebaseAuthDomain(),
  projectId: getFirebaseProjectId(),
  storageBucket: cleanConfigValue(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET, 'storageBucket') || FIREBASE_DEFAULTS.storageBucket,
  messagingSenderId: getFirebaseMessagingSenderId(),
  appId: getFirebaseAppId(),
  measurementId: cleanConfigValue(import.meta.env.VITE_FIREBASE_MEASUREMENT_ID, 'measurementId') || FIREBASE_DEFAULTS.measurementId
};

// Log configuration status on init
console.log('[Firebase] Config loaded:', {
  projectId: firebaseConfig.projectId,
  senderId: firebaseConfig.messagingSenderId,
  apiKeySource: apiKeyResult.source,
  apiKeyPrefix: firebaseConfig.apiKey.substring(0, 10) + '...',
});

// Export config for diagnostic purposes (without exposing full key)
export const getFirebaseConfigInfo = () => ({
  apiKeyPrefix: firebaseConfig.apiKey.substring(0, 10) + '...',
  apiKeyLength: firebaseConfig.apiKey.length,
  apiKeySource: apiKeyResult.source,
  apiKeyIssues: apiKeyResult.issues,
  projectId: firebaseConfig.projectId,
  projectIdSource: import.meta.env.VITE_FIREBASE_PROJECT_ID ? 'env' : 'fallback',
  messagingSenderId: firebaseConfig.messagingSenderId,
  senderIdSource: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ? 'env' : 'fallback',
  appId: firebaseConfig.appId,
  appIdSource: import.meta.env.VITE_FIREBASE_APP_ID ? 'env' : 'fallback',
  authDomain: firebaseConfig.authDomain,
  // Cohérence check: all from same source?
  isCoherent: (
    (apiKeyResult.source === 'env' && import.meta.env.VITE_FIREBASE_PROJECT_ID && import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID) ||
    (apiKeyResult.source === 'fallback' && !import.meta.env.VITE_FIREBASE_PROJECT_ID && !import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID)
  ),
});

// VAPID public key fallback - this is a PUBLIC key, safe to include in code
// Used only if VITE_VAPID_PUBLIC_KEY is not configured
const VAPID_PUBLIC_KEY_FALLBACK = "BFIt5LESGxT4TBsI7-m4E6n6EbEJTX2B1g6rQ4Tb6J2vGE0m5vJm2nRq6A3cG8dN7wK9xP0sF1hL2mY3uZ4oT5k";

// Get VAPID key from environment with robust fallback
export const getVapidKey = (): string | null => {
  const rawKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  
  // Use fallback if not configured
  if (!rawKey) {
    console.warn('[Firebase] VITE_VAPID_PUBLIC_KEY not configured, using fallback');
    return VAPID_PUBLIC_KEY_FALLBACK;
  }
  
  // Clean the key (remove whitespace, quotes, and any VITE_ prefix if mistakenly included)
  let cleanKey = rawKey.trim().replace(/^["']|["']$/g, '');
  if (cleanKey.startsWith('VITE_')) {
    console.warn('[Firebase] VAPID key had VITE_ prefix in value, removing it');
    cleanKey = cleanKey.replace(/^VITE_/, '');
  }
  
  // Validate key length (VAPID keys are typically 87 characters)
  if (cleanKey.length < 70) {
    console.error('[Firebase] VAPID key too short, using fallback. Length:', cleanKey.length);
    return VAPID_PUBLIC_KEY_FALLBACK;
  }
  
  console.log('[Firebase] VAPID key loaded - length:', cleanKey.length, '- prefix:', cleanKey.substring(0, 12) + '...');
  return cleanKey;
};

// Export VAPID info for diagnostics - comprehensive debug info
export const getVapidKeyInfo = () => {
  const rawKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';
  const cleanKey = getVapidKey();
  const usingFallback = !rawKey || rawKey.length < 70;
  
  return {
    // Raw value info (from env)
    rawPrefix: rawKey ? rawKey.substring(0, 15) + '...' : '(empty)',
    rawLength: rawKey.length,
    rawValue: rawKey.length > 0 ? `${rawKey.substring(0, 8)}...${rawKey.substring(rawKey.length - 8)}` : '(empty)',
    
    // Clean value info (after processing)
    cleanPrefix: cleanKey ? cleanKey.substring(0, 15) + '...' : 'null',
    cleanLength: cleanKey?.length || 0,
    cleanFingerprint: cleanKey ? `${cleanKey.substring(0, 8)}...${cleanKey.substring(cleanKey.length - 8)}` : 'null',
    
    // Diagnostic flags
    hasVitePrefix: rawKey.startsWith('VITE_'),
    hasQuotes: rawKey.startsWith('"') || rawKey.startsWith("'"),
    usingFallback,
    isValid: (cleanKey?.length || 0) >= 70,
    
    // Source info
    source: usingFallback ? 'fallback (hardcoded)' : 'environment variable',
  };
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
    
    // Additional debug info
    console.error('[Firebase] Full error object:', JSON.stringify(error, null, 2));

    // Re-throw with normalized error
    const normalized: any = new Error(error?.message || 'Erreur inconnue');
    normalized.code = error?.code || 'unknown';
    normalized.originalError = error;
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
