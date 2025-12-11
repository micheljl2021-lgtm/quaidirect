/**
 * Module centralisé pour la configuration Google Maps
 * Garantit une utilisation cohérente de la clé API à travers l'application
 * 
 * @see docs/GOOGLE_MAPS_CONFIG.md pour les instructions de configuration
 */

// Flag to track if warning has been shown (avoid spam)
let apiKeyWarningShown = false;
let configLogShown = false;

export function getGoogleMapsApiKey(): string {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  
  if (!key && !apiKeyWarningShown) {
    apiKeyWarningShown = true;
    console.error(
      "[Google Maps] CRITICAL: VITE_GOOGLE_MAPS_API_KEY is missing. " +
      "Map functionality will not work. " +
      "Please configure this in Lovable Cloud secrets."
    );
  }
  
  return key || "";
}

/**
 * Check if Google Maps API key is configured
 */
export function isGoogleMapsConfigured(): boolean {
  const configured = Boolean(import.meta.env.VITE_GOOGLE_MAPS_API_KEY);
  
  // Log configuration status once
  if (!configLogShown) {
    configLogShown = true;
    if (configured) {
      console.info("[Google Maps] API key configured ✓");
      console.info("[Google Maps] Required APIs: Maps JavaScript API, Places API, Geocoding API");
    } else {
      console.warn("[Google Maps] API key not configured");
    }
  }
  
  return configured;
}

/**
 * Validate API key format (basic check)
 */
export function validateApiKeyFormat(key: string): boolean {
  // Google API keys typically start with 'AIza' and are 39 characters
  return key.startsWith('AIza') && key.length === 39;
}

/**
 * Get diagnostic info for troubleshooting
 */
export function getGoogleMapsDiagnostics(): {
  keyConfigured: boolean;
  keyFormat: 'valid' | 'invalid' | 'missing';
  currentDomain: string;
  recommendations: string[];
} {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const keyConfigured = Boolean(key);
  
  let keyFormat: 'valid' | 'invalid' | 'missing' = 'missing';
  if (key) {
    keyFormat = validateApiKeyFormat(key) ? 'valid' : 'invalid';
  }
  
  const currentDomain = typeof window !== 'undefined' ? window.location.hostname : 'unknown';
  
  const recommendations: string[] = [];
  
  if (!keyConfigured) {
    recommendations.push("Configurez VITE_GOOGLE_MAPS_API_KEY dans les secrets Lovable Cloud");
  }
  
  if (keyFormat === 'invalid') {
    recommendations.push("Le format de la clé API semble incorrect (doit commencer par 'AIza')");
  }
  
  if (currentDomain.includes('lovable')) {
    recommendations.push(`Ajoutez *.lovableproject.com/* aux restrictions HTTP de la clé`);
  }
  
  recommendations.push("Vérifiez que 'Maps JavaScript API' est activée dans Google Cloud Console");
  recommendations.push("Vérifiez que 'Places API' est activée pour l'autocomplétion d'adresses");
  recommendations.push("Vérifiez que 'Geocoding API' est activée pour la géolocalisation");
  
  return {
    keyConfigured,
    keyFormat,
    currentDomain,
    recommendations,
  };
}

/**
 * Configuration centralisée pour useJsApiLoader
 * CRITICAL: Doit être utilisée partout pour éviter les conflits de loader
 */
export const googleMapsLoaderConfig = {
  id: "google-map-script",
  googleMapsApiKey: getGoogleMapsApiKey(),
  libraries: ["places", "geometry"] as ("places" | "geometry")[],
  version: "weekly",
  language: "fr",
  region: "FR",
};

/**
 * Configuration par défaut pour les cartes Google Maps
 */
export const defaultMapConfig = {
  center: {
    lat: 43.1177,
    lng: 6.1298, // Hyères, France
  },
  zoom: 10,
};

/**
 * Styles personnalisés aux couleurs QuaiDirect
 */
export const quaiDirectMapStyles: google.maps.MapTypeStyle[] = [
  // Masquer TOUS les points d'intérêt (restaurants, parcs, McDonald's, etc.)
  {
    featureType: 'poi',
    stylers: [{ visibility: 'off' }],
  },
  // Masquer les transports en commun
  {
    featureType: 'transit',
    stylers: [{ visibility: 'off' }],
  },
  // Masquer les routes locales mineures
  {
    featureType: 'road.local',
    stylers: [{ visibility: 'off' }],
  },
  // Masquer les quartiers et villages
  {
    featureType: 'administrative.neighborhood',
    stylers: [{ visibility: 'off' }],
  },
  // Masquer les land parcels
  {
    featureType: 'administrative.land_parcel',
    stylers: [{ visibility: 'off' }],
  },
  // Simplifier les labels de villes (garder uniquement les grandes villes)
  {
    featureType: 'administrative.locality',
    elementType: 'labels',
    stylers: [{ visibility: 'simplified' }],
  },
  // Eau avec couleurs QuaiDirect
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#a0d2eb' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#074e7c' }],
  },
];
