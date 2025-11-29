import { supabase } from "@/integrations/supabase/client";

export interface GeocodeResult {
  lat: number;
  lng: number;
  formattedAddress: string;
}

/**
 * Géocode un port via l'Edge Function Supabase
 * 
 * @param portName - Nom du port (ex: "Hyères")
 * @param city - Ville (ex: "Hyères")
 * @returns Les coordonnées géographiques et l'adresse formatée, ou null en cas d'erreur
 * 
 * @example
 * ```typescript
 * const result = await geocodePort("Hyères", "Hyères");
 * if (result) {
 *   console.log(`Port location: ${result.lat}, ${result.lng}`);
 * }
 * ```
 */
export async function geocodePort(
  portName: string,
  city: string
): Promise<GeocodeResult | null> {
  try {
    console.log(`[Geocode Client] Requesting geocode for: ${portName}, ${city}`);

    const { data, error } = await supabase.functions.invoke('google-geocode-port', {
      body: {
        port_name: portName,
        city: city,
      },
    });

    if (error) {
      console.error('[Geocode Client] Edge Function error:', error);
      return null;
    }

    if (!data || !data.lat || !data.lng) {
      console.error('[Geocode Client] Invalid response data:', data);
      return null;
    }

    console.log(`[Geocode Client] Success: ${data.lat}, ${data.lng}`);
    return data as GeocodeResult;

  } catch (error) {
    console.error('[Geocode Client] Unexpected error:', error);
    return null;
  }
}
