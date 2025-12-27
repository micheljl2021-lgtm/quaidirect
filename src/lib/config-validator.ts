/**
 * Validates required environment variables at app startup
 * Throws clear errors if configuration is missing
 */

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
      value: import.meta.env.VITE_SUPABASE_URL,
      required: true,
      service: 'Supabase',
    },
    {
      key: 'VITE_SUPABASE_PUBLISHABLE_KEY',
      value: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      required: true,
      service: 'Supabase',
    },
    {
      key: 'VITE_GOOGLE_MAPS_API_KEY',
      value: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
      required: true,
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
    
    throw new Error(
      `[Config] Missing required environment variables:\n\n${missingList}\n\n` +
      `Please configure these in:\n` +
      `  • Lovable Dashboard → Your Project → Secrets (production)\n` +
      `  • Local .env file (development)\n\n` +
      `See .env.example for template.`
    );
  }

  // Log optional missing configs (not blocking)
  const optionalMissing = configs.filter((c) => {
    if (c.required) return false;
    if (!c.value) return true;
    
    // Check for common placeholder patterns
    const placeholderPatterns = [
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
