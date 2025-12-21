import { supabase } from "@/integrations/supabase/client";

export interface GeocodeResult {
  lat: number;
  lng: number;
  formattedAddress: string;
}

/**
 * Géocode une adresse complète via l'Edge Function Supabase
 * 
 * @param address - Adresse complète (ex: "Quai Gabriel Péri, 83400 Hyères, France")
 * @returns Les coordonnées géographiques et l'adresse formatée, ou null en cas d'erreur
 */
export async function geocodeAddress(
  address: string
): Promise<GeocodeResult | null> {
  try {
    if (import.meta.env.DEV) console.log(`[Geocode Client] Requesting geocode for: ${address}`);

    const { data, error } = await supabase.functions.invoke('geocode-address', {
      body: { address },
    });

    if (error) {
      if (import.meta.env.DEV) console.error('[Geocode Client] Edge Function error:', error);
      return null;
    }

    if (!data || !data.lat || !data.lng) {
      if (import.meta.env.DEV) console.error('[Geocode Client] Invalid response data:', data);
      return null;
    }

    if (import.meta.env.DEV) console.log(`[Geocode Client] Success: ${data.lat}, ${data.lng}`);
    return data as GeocodeResult;

  } catch (error) {
    if (import.meta.env.DEV) console.error('[Geocode Client] Unexpected error:', error);
    return null;
  }
}

/**
 * Géocode un port via l'Edge Function Supabase (backward compatibility)
 */
export async function geocodePort(
  portName: string,
  city: string
): Promise<GeocodeResult | null> {
  const address = `Port ${portName}, ${city}, France`;
  return geocodeAddress(address);
}
