/**
 * Validates required environment variables at app startup
 * Throws clear errors if configuration is missing
 */

import { resolveBackendPublishableKey, resolveBackendUrl } from "@/lib/public-config";


interface ConfigValidation {
  key: string;
  value: string | undefined;
  required: boolean;
  service: string;
}

const validateConfig = (): void => {
  // Skip validation in test environment
  if (import.meta.env.MODE === 'test' || import.meta.env.VITEST) {
    return;
  }

  const configs: ConfigValidation[] = [
    // Required
    {
      key: 'VITE_SUPABASE_URL',
      value: resolveBackendUrl(),
      required: true,
      service: 'Supabase',
    },
    {
      key: 'VITE_SUPABASE_PUBLISHABLE_KEY',
      value: resolveBackendPublishableKey(),
      required: true,
      service: 'Supabase',
    },
    {
      key: 'VITE_GOOGLE_MAPS_API_KEY',
      value: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
      required: false,
      service: 'Google Maps',
    },
    
    // Optional but recommended
    {
      key: 'VITE_FIREBASE_API_KEY',
      value: import.meta.env.VITE_FIREBASE_API_KEY,
      required: false,
      service: 'Firebase (Push Notifications)',
    },
    {
      key: 'VITE_VAPID_PUBLIC_KEY',
      value: import.meta.env.VITE_VAPID_PUBLIC_KEY,
      required: false,
      service: 'VAPID (Push Notifications)',
    },
  ];

  const missing = configs.filter((c) => {
    if (!c.required) return false;
    if (!c.value) return true;
    
    // Check for common placeholder patterns
    const placeholderPatterns = [
      'your_google_maps_api_key_here',
      'your_supabase_url_here',
      'your_supabase_publishable_anon_key_here',
      'your_firebase_api_key_here',
      'your_vapid_public_key_here'
    ];
    
    return placeholderPatterns.some(pattern => c.value === pattern);
  });

  if (missing.length > 0) {
    const missingList = missing.map((c) => `  • ${c.key} (${c.service})`).join('\n');

    const message =
      `[Config] Missing required environment variables:\n\n${missingList}\n\n` +
      `Please configure these in:\n` +
      `  • Lovable Dashboard → Your Project → Secrets (production)\n` +
      `  • Local .env file (development)\n\n` +
      `See .env.example for template.`;

    // En production, on évite de faire un écran blanc : certaines couches d'hébergement peuvent
    // temporairement ne pas injecter les VITE_* au runtime. On loggue clairement et on laisse l'app tourner.
    const isLocalhost =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    if (import.meta.env.DEV && isLocalhost) {
      throw new Error(message);
    }

    console.error(message);
    return;
  }

  // Log optional missing configs (not blocking)
  const optionalMissing = configs.filter((c) => {
    if (c.required) return false;
    if (!c.value) return true;
    
    // Check for common placeholder patterns
    const placeholderPatterns = [
      'your_google_maps_api_key_here',
      'your_firebase_api_key_here',
      'your_vapid_public_key_here'
    ];
    
    return placeholderPatterns.some(pattern => c.value === pattern);
  });

  if (optionalMissing.length > 0) {
    console.warn(
      '[Config] Optional features not configured:',
      optionalMissing.map((c) => c.service).join(', ')
    );
  }
};

// Run validation on import
validateConfig();

export { validateConfig };
