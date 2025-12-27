/**
 * Module centralisé pour la configuration Google Maps
 * @see docs/GOOGLE_MAPS_CONFIG.md pour les instructions de configuration
 */

let configLogShown = false;
let cachedApiKey: string | null = null;
let initPromise: Promise<string> | null = null;

function readEnvKey(): string {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey || apiKey === 'your_google_maps_api_key_here') return '';
  return apiKey;
}

export function getGoogleMapsApiKey(): string {
  return cachedApiKey ?? readEnvKey();
}

export function isGoogleMapsConfigured(): boolean {
  // In test environment, check directly without throwing
  if (import.meta.env.MODE === 'test' || import.meta.env.VITEST) {
    const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    return Boolean(key && key.length > 0);
  }

  const key = getGoogleMapsApiKey();
  const configured = Boolean(key && key.length > 0);

  if (!configLogShown) {
    configLogShown = true;
    console.info(configured ? "[Google Maps] API key configurée ✓" : "[Google Maps] API key non configurée");
  }

  return configured;
}

/**
 * Initialise la clé Google Maps.
 * - 1) tente `import.meta.env.VITE_GOOGLE_MAPS_API_KEY`
 * - 2) sinon récupère depuis la fonction backend `get-maps-config`
 */
export function initGoogleMapsApiKey(): Promise<string> {
  if (import.meta.env.MODE === 'test' || import.meta.env.VITEST) {
    cachedApiKey = readEnvKey();
    return Promise.resolve(cachedApiKey || '');
  }

  if (cachedApiKey) return Promise.resolve(cachedApiKey);
  if (initPromise) return initPromise;

  const envKey = readEnvKey();
  if (envKey) {
    cachedApiKey = envKey;
    return Promise.resolve(envKey);
  }

  initPromise = (async () => {
    try {
      // Import dynamique pour éviter les imports circulaires
      const { resolveBackendUrl, resolveBackendPublishableKey } = await import('@/lib/public-config');

      const backendUrl = resolveBackendUrl();
      const anonKey = resolveBackendPublishableKey();

      const res = await fetch(`${backendUrl}/functions/v1/get-maps-config`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
      });

      if (!res.ok) throw new Error(`get-maps-config failed: ${res.status}`);
      const json = (await res.json()) as { googleMapsApiKey?: string; configured?: boolean };

      cachedApiKey = (json.googleMapsApiKey || '').trim();
      return cachedApiKey;
    } catch (e) {
      console.error('[Google Maps] Failed to load API key from backend function:', e);
      cachedApiKey = '';
      return '';
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
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
