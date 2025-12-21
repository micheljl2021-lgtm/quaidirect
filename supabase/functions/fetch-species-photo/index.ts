import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { speciesName } = await req.json();
    
    if (!speciesName) {
      return new Response(
        JSON.stringify({ error: 'speciesName is required', imageUrl: null }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const pixabayApiKey = Deno.env.get('PIXABAY_API_KEY');
    
    if (!pixabayApiKey) {
      console.error('PIXABAY_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured', imageUrl: null }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Search for species + "poisson" in French
    const searchQuery = encodeURIComponent(`${speciesName} poisson`);
    const pixabayUrl = `https://pixabay.com/api/?key=${pixabayApiKey}&q=${searchQuery}&image_type=photo&orientation=horizontal&per_page=5&lang=fr&safesearch=true`;

    console.log(`Searching Pixabay for: ${speciesName} poisson`);

    const response = await fetch(pixabayUrl);
    
    if (!response.ok) {
      console.error(`Pixabay API error: ${response.status}`);
      return new Response(
        JSON.stringify({ error: 'Pixabay API error', imageUrl: null }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();

    if (data.hits && data.hits.length > 0) {
      // Return the first result's large image URL
      const imageUrl = data.hits[0].largeImageURL || data.hits[0].webformatURL;
      console.log(`Found image for ${speciesName}: ${imageUrl}`);
      
      return new Response(
        JSON.stringify({ imageUrl, source: 'pixabay' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // No results found, try a simpler search with just the species name
    const fallbackQuery = encodeURIComponent(speciesName);
    const fallbackUrl = `https://pixabay.com/api/?key=${pixabayApiKey}&q=${fallbackQuery}&image_type=photo&orientation=horizontal&per_page=3&lang=fr&safesearch=true`;
    
    console.log(`Fallback search for: ${speciesName}`);
    
    const fallbackResponse = await fetch(fallbackUrl);
    
    if (fallbackResponse.ok) {
      const fallbackData = await fallbackResponse.json();
      
      if (fallbackData.hits && fallbackData.hits.length > 0) {
        const imageUrl = fallbackData.hits[0].largeImageURL || fallbackData.hits[0].webformatURL;
        console.log(`Found fallback image for ${speciesName}: ${imageUrl}`);
        
        return new Response(
          JSON.stringify({ imageUrl, source: 'pixabay' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log(`No image found for ${speciesName}`);
    return new Response(
      JSON.stringify({ imageUrl: null, source: null }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in fetch-species-photo:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage, imageUrl: null }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
