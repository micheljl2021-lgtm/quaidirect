/**
 * Module centralisé pour la configuration Google Maps
 * Garantit une utilisation cohérente de la clé API à travers l'application
 */

// Flag to track if warning has been shown (avoid spam)
let apiKeyWarningShown = false;

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
  return Boolean(import.meta.env.VITE_GOOGLE_MAPS_API_KEY);
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
