// Firebase Cloud Messaging integration for QuaiDirect push notifications
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, type Messaging } from 'firebase/messaging';

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

// Validate required environment variables and throw clear errors if missing
const validateFirebaseConfig = () => {
  const missingVars: string[] = [];
  
  if (!import.meta.env.VITE_FIREBASE_API_KEY) {
    missingVars.push('VITE_FIREBASE_API_KEY');
  }
  if (!import.meta.env.VITE_FIREBASE_PROJECT_ID) {
    missingVars.push('VITE_FIREBASE_PROJECT_ID');
  }
  if (!import.meta.env.VITE_FIREBASE_AUTH_DOMAIN) {
    missingVars.push('VITE_FIREBASE_AUTH_DOMAIN');
  }
  if (!import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID) {
    missingVars.push('VITE_FIREBASE_MESSAGING_SENDER_ID');
  }
  if (!import.meta.env.VITE_FIREBASE_APP_ID) {
    missingVars.push('VITE_FIREBASE_APP_ID');
  }
  if (!import.meta.env.VITE_FIREBASE_STORAGE_BUCKET) {
    missingVars.push('VITE_FIREBASE_STORAGE_BUCKET');
  }
  
  if (missingVars.length > 0) {
    const errorMessage = `[Firebase] CRITICAL: Missing required environment variables: ${missingVars.join(', ')}.\n` +
      `Push notifications will NOT work.\n` +
      `Please configure these in Lovable Cloud Secrets or your local .env file.\n` +
      `See .env.example and docs/LOVABLE_CLOUD_SECRETS.md for instructions.`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
};

// Get Firebase API key from environment variable
const getFirebaseApiKey = (): { value: string; issues: string[] } => {
  const rawKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const issues: string[] = [];
  
  if (!rawKey) {
    throw new Error('[Firebase] VITE_FIREBASE_API_KEY not configured');
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
    throw new Error('[Firebase] API key too short or invalid after cleaning');
  }
  
  return { value: cleaned, issues };
};

// Get other Firebase config values from env (no fallbacks)
const getFirebaseProjectId = (): string => {
  const value = cleanConfigValue(import.meta.env.VITE_FIREBASE_PROJECT_ID, 'projectId');
  if (!value) {
    throw new Error('[Firebase] VITE_FIREBASE_PROJECT_ID not configured');
  }
  return value;
};

const getFirebaseMessagingSenderId = (): string => {
  const value = cleanConfigValue(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID, 'senderId');
  if (!value) {
    throw new Error('[Firebase] VITE_FIREBASE_MESSAGING_SENDER_ID not configured');
  }
  return value;
};

const getFirebaseAppId = (): string => {
  const value = cleanConfigValue(import.meta.env.VITE_FIREBASE_APP_ID, 'appId');
  if (!value) {
    throw new Error('[Firebase] VITE_FIREBASE_APP_ID not configured');
  }
  return value;
};

const getFirebaseAuthDomain = (): string => {
  const value = cleanConfigValue(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN, 'authDomain');
  if (!value) {
    throw new Error('[Firebase] VITE_FIREBASE_AUTH_DOMAIN not configured');
  }
  return value;
};

// Get storage bucket (accept both VITE_FIREBASE_STORAGE_BUCKET and VITE_FIREBASE_BUCKET)
const getFirebaseStorageBucket = (): string => {
  const value = cleanConfigValue(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET, 'storageBucket') 
    || cleanConfigValue(import.meta.env.VITE_FIREBASE_BUCKET, 'bucket');
  if (!value) {
    throw new Error('[Firebase] VITE_FIREBASE_STORAGE_BUCKET not configured');
  }
  return value;
};

// Validate configuration before building config object
validateFirebaseConfig();

// Build Firebase configuration
const apiKeyResult = getFirebaseApiKey();
const firebaseConfig = {
  apiKey: apiKeyResult.value,
  authDomain: getFirebaseAuthDomain(),
  projectId: getFirebaseProjectId(),
  storageBucket: getFirebaseStorageBucket(),
  messagingSenderId: getFirebaseMessagingSenderId(),
  appId: getFirebaseAppId(),
  measurementId: cleanConfigValue(import.meta.env.VITE_FIREBASE_MEASUREMENT_ID, 'measurementId') || undefined
};

// Log configuration status on init
console.log('[Firebase] Config loaded successfully:', {
  projectId: firebaseConfig.projectId,
  senderId: firebaseConfig.messagingSenderId,
  apiKeyPrefix: firebaseConfig.apiKey.substring(0, 10) + '...',
});

// Export config for diagnostic purposes (without exposing full key)
export const getFirebaseConfigInfo = () => {
  const sources = {
    projectIdSource: 'VITE_FIREBASE_PROJECT_ID',
    senderIdSource: 'VITE_FIREBASE_MESSAGING_SENDER_ID',
    apiKeySource: 'VITE_FIREBASE_API_KEY',
    authDomainSource: 'VITE_FIREBASE_AUTH_DOMAIN',
    appIdSource: 'VITE_FIREBASE_APP_ID',
    storageBucketSource: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET
      ? 'VITE_FIREBASE_STORAGE_BUCKET'
      : import.meta.env.VITE_FIREBASE_BUCKET
        ? 'VITE_FIREBASE_BUCKET'
        : 'missing',
  } as const;

  const envCount = Object.values(sources).filter((v) => v !== 'missing').length;
  const fallbackCount = 0;

  return {
    apiKeyPrefix: firebaseConfig.apiKey.substring(0, 10) + '...',
    apiKeyLength: firebaseConfig.apiKey.length,
    apiKeyIssues: apiKeyResult.issues,

    projectId: firebaseConfig.projectId,
    messagingSenderId: firebaseConfig.messagingSenderId,
    appId: firebaseConfig.appId,
    authDomain: firebaseConfig.authDomain,
    storageBucket: firebaseConfig.storageBucket,

    currentDomain: typeof window !== 'undefined' ? window.location.hostname : 'unknown',

    // Extra diagnostic fields expected by NotificationDiagnostic
    projectIdSource: sources.projectIdSource,
    senderIdSource: sources.senderIdSource,
    apiKeySource: sources.apiKeySource,
    authDomainSource: sources.authDomainSource,
    appIdSource: sources.appIdSource,
    storageBucketSource: sources.storageBucketSource,

    isCoherent: fallbackCount === 0,
    envCount,
    fallbackCount,
  };
};

// Get VAPID key from environment (no fallback)
export const getVapidKey = (): string | null => {
  const rawKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

  // Return null if not configured (push notifications won't work but app continues)
  if (!rawKey) {
    console.error(
      '[Firebase] CRITICAL: VITE_VAPID_PUBLIC_KEY not configured.\n' +
      'Push notifications will NOT work.\n' +
      'Configure this in Lovable Cloud Secrets or your local .env file.\n' +
      'Generate keys with: npx web-push generate-vapid-keys'
    );
    return null;
  }

  // Clean the key (remove whitespace, quotes, and any VITE_ prefix if mistakenly included)
  let cleanKey = rawKey.trim().replace(/^["']|["']$/g, '');
  if (cleanKey.startsWith('VITE_')) {
    console.warn('[Firebase] VAPID key had VITE_ prefix in value, removing it');
    cleanKey = cleanKey.replace(/^VITE_/, '');
  }

  // Validate key length (VAPID keys are typically 87 characters)
  if (cleanKey.length < 70) {
    console.error(
      '[Firebase] VAPID key too short (length: ' + cleanKey.length + ').\n' +
      'Expected at least 70 characters.\n' +
      'Generate a new key with: npx web-push generate-vapid-keys'
    );
    return null;
  }

  console.log('[Firebase] VAPID key loaded - length:', cleanKey.length, '- prefix:', cleanKey.substring(0, 12) + '...');
  return cleanKey;
};

// Export VAPID info for diagnostics - comprehensive debug info
export const getVapidKeyInfo = () => {
  const rawKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';
  const cleanKey = getVapidKey();
  const isConfigured = rawKey.length > 0;

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
    isConfigured,
    isValid: (cleanKey?.length || 0) >= 70,

    // Compatibility for UI components that expect this flag
    usingFallback: false,

    // Source info
    source: isConfigured ? 'VITE_VAPID_PUBLIC_KEY' : 'not configured',
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
