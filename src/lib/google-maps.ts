/**
 * Module centralisé pour la configuration Google Maps
 * @see docs/GOOGLE_MAPS_CONFIG.md pour les instructions de configuration
 */

let apiKeyWarningShown = false;
let configLogShown = false;

export function getGoogleMapsApiKey(): string {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  
  // Skip validation in test environment
  if (import.meta.env.MODE === 'test' || import.meta.env.VITEST) {
    return apiKey || '';
  }
  
  if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
    if (!apiKeyWarningShown) {
      apiKeyWarningShown = true;
      throw new Error(
        '[Google Maps] CRITICAL: VITE_GOOGLE_MAPS_API_KEY not configured.\n' +
        'Please configure it in:\n' +
        '- Lovable Dashboard → Project → Secrets (for production)\n' +
        '- Local .env file (for development)\n' +
        '\n' +
        'See docs/GOOGLE_MAPS_CONFIG.md for setup instructions.'
      );
    }
  }
  
  return apiKey;
}

export function isGoogleMapsConfigured(): boolean {
  const key = getGoogleMapsApiKey();
  const configured = Boolean(key && key.length > 0);
  
  if (!configLogShown) {
    configLogShown = true;
    console.info(configured ? "[Google Maps] API key configurée ✓" : "[Google Maps] API key non configurée");
  }
  
  return configured;
}

export function initGoogleMapsApiKey(): Promise<string> {
  return Promise.resolve(getGoogleMapsApiKey());
}

export const googleMapsLoaderConfig = {
  id: "google-map-script",
  get googleMapsApiKey() { return getGoogleMapsApiKey(); },
  libraries: ["places", "geometry"] as ("places" | "geometry")[],
  version: "weekly",
  language: "fr",
  region: "FR",
};

export const defaultMapConfig = {
  center: { lat: 43.1167, lng: 6.1333 },
  zoom: 11,
};

export const quaiDirectMapStyles: google.maps.MapTypeStyle[] = [
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'road.local', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.neighborhood', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.locality', elementType: 'labels', stylers: [{ visibility: 'simplified' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#a0d2eb' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#074e7c' }] },
];
