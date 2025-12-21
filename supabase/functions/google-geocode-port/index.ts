import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, handleCors } from '../_shared/cors.ts';

interface GeocodeRequest {
  port_name: string;
  city: string;
}

interface GeocodeResponse {
  lat: number;
  lng: number;
  formattedAddress: string;
}

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const origin = req.headers.get('origin');

  try {
    const googleMapsApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY_SERVER');
    
    if (!googleMapsApiKey) {
      console.error('[Geocode] Missing GOOGLE_MAPS_API_KEY_SERVER');
      return new Response(
        JSON.stringify({ error: 'Configuration serveur manquante' }),
        { status: 500, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
      );
    }

    const { port_name, city }: GeocodeRequest = await req.json();
    
    // Validation des entrées
    if (!port_name || !city) {
      console.error('[Geocode] Missing required fields');
      return new Response(
        JSON.stringify({ error: 'Nom du port et ville requis' }),
        { status: 400, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
      );
    }

    // Construction de l'adresse de recherche
    const address = `Port de ${port_name}, ${city}, France`;
    console.log(`[Geocode] Searching for: ${address}`);

    // Appel à l'API Google Geocoding
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${googleMapsApiKey}`;
    
    const response = await fetch(geocodeUrl);
    const data = await response.json();

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      console.warn(`[Geocode] No results for ${address}. Status: ${data.status}`);
      return new Response(
        JSON.stringify({ 
          error: 'Aucun résultat trouvé pour cette adresse',
          status: data.status 
        }),
        { status: 404, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
      );
    }

    const result = data.results[0];
    const location = result.geometry.location;

    const geocodeResponse: GeocodeResponse = {
      lat: location.lat,
      lng: location.lng,
      formattedAddress: result.formatted_address,
    };

    console.log(`[Geocode] Success for ${port_name}: ${location.lat}, ${location.lng}`);

    return new Response(
      JSON.stringify(geocodeResponse),
      { 
        status: 200, 
        headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('[Geocode] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erreur interne du serveur';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
    );
  }
});
