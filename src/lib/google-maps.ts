/**
 * Module centralisé pour la configuration Google Maps
 * Garantit une utilisation cohérente de la clé API à travers l'application
 */

export function getGoogleMapsApiKey(): string {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  
  if (!key) {
    console.warn(
      "[Google Maps] VITE_GOOGLE_MAPS_API_KEY is missing. " +
      "Please add it to your .env.local file."
    );
  }
  
  return key || "";
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
