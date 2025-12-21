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
        JSON.stringify({ error: 'speciesName is required', images: [] }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const pixabayApiKey = Deno.env.get('PIXABAY_API_KEY');
    
    if (!pixabayApiKey) {
      console.error('PIXABAY_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured', images: [] }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Search for fresh whole raw fish in English for better results
    // Use category=animals to avoid cooked fish dishes
    const searchQuery = encodeURIComponent(`${speciesName} fish fresh raw whole`);
    const pixabayUrl = `https://pixabay.com/api/?key=${pixabayApiKey}&q=${searchQuery}&image_type=photo&orientation=horizontal&per_page=10&lang=en&safesearch=true&category=animals`;

    console.log(`Searching Pixabay for: ${speciesName} fish fresh raw whole (category=animals)`);

    const response = await fetch(pixabayUrl);
    
    if (!response.ok) {
      console.error(`Pixabay API error: ${response.status}`);
      return new Response(
        JSON.stringify({ error: 'Pixabay API error', images: [] }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();

    if (data.hits && data.hits.length > 0) {
      // Return the first 3 results' large image URLs
      const images = data.hits
        .slice(0, 3)
        .map((hit: any) => hit.largeImageURL || hit.webformatURL)
        .filter(Boolean);
      
      console.log(`Found ${images.length} images for ${speciesName}`);
      
      return new Response(
        JSON.stringify({ images, source: 'pixabay' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // No results found with category=animals, try without category filter
    const fallbackQuery = encodeURIComponent(`${speciesName} fish raw`);
    const fallbackUrl = `https://pixabay.com/api/?key=${pixabayApiKey}&q=${fallbackQuery}&image_type=photo&orientation=horizontal&per_page=10&lang=en&safesearch=true`;
    
    console.log(`Fallback search for: ${speciesName} fish raw`);
    
    const fallbackResponse = await fetch(fallbackUrl);
    
    if (fallbackResponse.ok) {
      const fallbackData = await fallbackResponse.json();
      
      if (fallbackData.hits && fallbackData.hits.length > 0) {
        const images = fallbackData.hits
          .slice(0, 3)
          .map((hit: any) => hit.largeImageURL || hit.webformatURL)
          .filter(Boolean);
        
        console.log(`Found ${images.length} fallback images for ${speciesName}`);
        
        return new Response(
          JSON.stringify({ images, source: 'pixabay' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Last resort: try just the species name in French
    const frenchQuery = encodeURIComponent(`${speciesName} poisson`);
    const frenchUrl = `https://pixabay.com/api/?key=${pixabayApiKey}&q=${frenchQuery}&image_type=photo&orientation=horizontal&per_page=10&lang=fr&safesearch=true`;
    
    console.log(`French fallback search for: ${speciesName} poisson`);
    
    const frenchResponse = await fetch(frenchUrl);
    
    if (frenchResponse.ok) {
      const frenchData = await frenchResponse.json();
      
      if (frenchData.hits && frenchData.hits.length > 0) {
        const images = frenchData.hits
          .slice(0, 3)
          .map((hit: any) => hit.largeImageURL || hit.webformatURL)
          .filter(Boolean);
        
        console.log(`Found ${images.length} French fallback images for ${speciesName}`);
        
        return new Response(
          JSON.stringify({ images, source: 'pixabay' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log(`No images found for ${speciesName}`);
    return new Response(
      JSON.stringify({ images: [], source: null }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in fetch-species-photo:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage, images: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
