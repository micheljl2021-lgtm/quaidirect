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
      service: 'Backend',
    },
    {
      key: 'VITE_SUPABASE_PUBLISHABLE_KEY',
      value: resolveBackendPublishableKey(),
      required: true,
      service: 'Backend',
    },
    // Optional (fallback via backend function)
    {
      key: 'VITE_GOOGLE_MAPS_API_KEY',
      value: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
      required: false,
      service: 'Google Maps',
    },

    // Optional
    {
      key: 'VITE_FIREBASE_API_KEY',
      value: import.meta.env.VITE_FIREBASE_API_KEY,
      required: false,
      service: 'Firebase (notifications)',
    },
    {
      key: 'VITE_VAPID_PUBLIC_KEY',
      value: import.meta.env.VITE_VAPID_PUBLIC_KEY,
      required: false,
      service: 'Web Push (VAPID)',
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
      'your_vapid_public_key_here',
    ];

    return placeholderPatterns.some((pattern) => c.value === pattern);
  });

  if (missing.length > 0) {
    const missingList = missing.map((c) => `  • ${c.key} (${c.service})`).join('\n');

    const message =
      `[Config] Configuration manquante :\n\n${missingList}\n\n` +
      `→ Ajoute ces valeurs dans Lovable Cloud → Secrets.\n` +
      `Note : il n’y a pas de fichier .env à “recréer” ici.`;

    // Ne jamais bloquer l'app (sinon écran blanc). On loggue uniquement.
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

    const googleMapsMissing = optionalMissing.some((c) => c.key === 'VITE_GOOGLE_MAPS_API_KEY');
    if (googleMapsMissing) {
      console.warn(
        '[Config] Google Maps key not set in VITE_GOOGLE_MAPS_API_KEY. The frontend will attempt to load it via the Supabase function get-maps-config.'
      );
    }
  }
};

// Run validation on import
validateConfig();

export { validateConfig };
