import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://quaidirect.fr',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const GeocodeRequestSchema = z.object({
  address: z.string()
    .min(3, 'Address must be at least 3 characters')
    .max(500, 'Address must be less than 500 characters')
    .transform(val => val.trim()),
});

interface GeocodeResponse {
  lat: number;
  lng: number;
  formattedAddress: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('serveur_google_map_clee_api');
    if (!apiKey) {
      throw new Error('serveur_google_map_clee_api not configured');
    }

    // Validate input with Zod
    const rawBody = await req.json();
    const validationResult = GeocodeRequestSchema.safeParse(rawBody);
    
    if (!validationResult.success) {
      const errorMessages = validationResult.error.errors.map(e => e.message).join(', ');
      console.error('[Geocode] Validation error:', errorMessages);
      return new Response(
        JSON.stringify({ error: `Validation error: ${errorMessages}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { address } = validationResult.data;
    console.log(`[Geocode] Geocoding address: ${address.substring(0, 50)}...`);

    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
    const geocodeResponse = await fetch(geocodeUrl);
    const geocodeData = await geocodeResponse.json();

    if (geocodeData.status !== 'OK' || !geocodeData.results || geocodeData.results.length === 0) {
      console.error('[Geocode] No results found:', geocodeData.status);
      return new Response(
        JSON.stringify({ error: 'Address not found or invalid' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = geocodeData.results[0];
    const location = result.geometry.location;

    const response: GeocodeResponse = {
      lat: location.lat,
      lng: location.lng,
      formattedAddress: result.formatted_address,
    };

    console.log(`[Geocode] Success: ${response.lat}, ${response.lng}`);

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[Geocode] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
