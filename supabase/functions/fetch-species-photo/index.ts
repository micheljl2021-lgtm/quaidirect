import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Complete French to English species translation mapping
const speciesTranslations: Record<string, { en: string; latin?: string }> = {
  // Poissons communs Méditerranée/Atlantique
  "bar": { en: "sea bass", latin: "Dicentrarchus labrax" },
  "bar de ligne": { en: "line caught sea bass", latin: "Dicentrarchus labrax" },
  "bar moucheté": { en: "spotted sea bass" },
  "loup": { en: "sea bass", latin: "Dicentrarchus labrax" },
  "loup de mer": { en: "sea bass" },
  "dorade": { en: "sea bream", latin: "Sparus aurata" },
  "dorade royale": { en: "gilt head bream", latin: "Sparus aurata" },
  "daurade": { en: "sea bream", latin: "Sparus aurata" },
  "daurade royale": { en: "gilt head bream" },
  "dorade grise": { en: "black sea bream", latin: "Spondyliosoma cantharus" },
  "pageot": { en: "red porgy", latin: "Pagellus erythrinus" },
  "pagre": { en: "common pandora" },
  "sar": { en: "white sea bream", latin: "Diplodus sargus" },
  "marbré": { en: "sand steenbras" },
  
  // Thon et pélagiques
  "thon": { en: "tuna fish", latin: "Thunnus" },
  "thon rouge": { en: "bluefin tuna", latin: "Thunnus thynnus" },
  "thon blanc": { en: "albacore tuna", latin: "Thunnus alalunga" },
  "bonite": { en: "bonito fish", latin: "Sarda sarda" },
  "maquereau": { en: "mackerel fish", latin: "Scomber scombrus" },
  "chinchard": { en: "horse mackerel", latin: "Trachurus trachurus" },
  "sardine": { en: "sardine fish", latin: "Sardina pilchardus" },
  "anchois": { en: "anchovy fish", latin: "Engraulis encrasicolus" },
  "hareng": { en: "herring fish", latin: "Clupea harengus" },
  "espadon": { en: "swordfish", latin: "Xiphias gladius" },
  
  // Poissons plats
  "sole": { en: "sole fish", latin: "Solea solea" },
  "sole commune": { en: "common sole" },
  "turbot": { en: "turbot fish", latin: "Scophthalmus maximus" },
  "barbue": { en: "brill fish", latin: "Scophthalmus rhombus" },
  "plie": { en: "plaice fish", latin: "Pleuronectes platessa" },
  "carrelet": { en: "plaice" },
  "limande": { en: "dab fish", latin: "Limanda limanda" },
  "flet": { en: "flounder fish" },
  "saint-pierre": { en: "john dory fish", latin: "Zeus faber" },
  
  // Gadidés (cabillaud, merlu, etc.)
  "cabillaud": { en: "atlantic cod", latin: "Gadus morhua" },
  "morue": { en: "cod fish" },
  "merlu": { en: "hake fish", latin: "Merluccius merluccius" },
  "colin": { en: "hake" },
  "lieu jaune": { en: "pollack fish", latin: "Pollachius pollachius" },
  "lieu noir": { en: "saithe fish", latin: "Pollachius virens" },
  "merlan": { en: "whiting fish", latin: "Merlangius merlangus" },
  "tacaud": { en: "pouting fish" },
  "églefin": { en: "haddock fish", latin: "Melanogrammus aeglefinus" },
  "lingue": { en: "ling fish" },
  
  // Rougets et autres
  "rouget": { en: "red mullet fish", latin: "Mullus barbatus" },
  "rouget barbet": { en: "red mullet", latin: "Mullus barbatus" },
  "rouget grondin": { en: "gurnard fish", latin: "Chelidonichthys lucerna" },
  "grondin": { en: "gurnard fish" },
  "grondin rouge": { en: "red gurnard" },
  "grondin perlon": { en: "tub gurnard" },
  "vive": { en: "weever fish", latin: "Trachinus draco" },
  "rascasse": { en: "scorpion fish", latin: "Scorpaena scrofa" },
  "chapon": { en: "large scale scorpionfish" },
  "mostelle": { en: "forkbeard" },
  
  // Baudroie et raies
  "baudroie": { en: "monkfish", latin: "Lophius piscatorius" },
  "lotte": { en: "monkfish" },
  "lotte de mer": { en: "anglerfish" },
  "raie": { en: "ray fish", latin: "Raja" },
  "raie bouclée": { en: "thornback ray", latin: "Raja clavata" },
  "raie pastenague": { en: "stingray" },
  "pocheteau": { en: "skate fish" },
  "roussette": { en: "lesser spotted catshark", latin: "Scyliorhinus canicula" },
  "émissole": { en: "smooth hound shark" },
  "requin": { en: "shark" },
  
  // Céphalopodes
  "seiche": { en: "cuttlefish", latin: "Sepia officinalis" },
  "calamar": { en: "squid", latin: "Loligo vulgaris" },
  "calmar": { en: "squid" },
  "encornet": { en: "squid" },
  "poulpe": { en: "octopus", latin: "Octopus vulgaris" },
  "pieuvre": { en: "octopus" },
  
  // Crustacés
  "homard": { en: "lobster", latin: "Homarus gammarus" },
  "homard breton": { en: "european lobster" },
  "langouste": { en: "spiny lobster", latin: "Palinurus elephas" },
  "langoustine": { en: "langoustine", latin: "Nephrops norvegicus" },
  "crevette": { en: "shrimp" },
  "crevette grise": { en: "brown shrimp" },
  "crevette rose": { en: "pink shrimp" },
  "gambas": { en: "king prawn" },
  "bouquet": { en: "prawn" },
  "crabe": { en: "crab" },
  "tourteau": { en: "brown crab", latin: "Cancer pagurus" },
  "étrille": { en: "velvet crab" },
  "araignée": { en: "spider crab", latin: "Maja squinado" },
  "araignée de mer": { en: "spider crab" },
  "cigale de mer": { en: "slipper lobster" },
  
  // Coquillages
  "moule": { en: "mussel", latin: "Mytilus edulis" },
  "moules de bouchot": { en: "bouchot mussels" },
  "huître": { en: "oyster", latin: "Ostrea edulis" },
  "huître creuse": { en: "pacific oyster" },
  "huître plate": { en: "flat oyster" },
  "palourde": { en: "clam", latin: "Ruditapes philippinarum" },
  "coque": { en: "cockle", latin: "Cerastoderma edule" },
  "coquille saint-jacques": { en: "scallop", latin: "Pecten maximus" },
  "saint-jacques": { en: "scallop" },
  "pétoncle": { en: "queen scallop" },
  "praire": { en: "warty venus clam" },
  "couteau": { en: "razor clam" },
  "bulot": { en: "whelk", latin: "Buccinum undatum" },
  "bigorneaux": { en: "periwinkle" },
  "ormeau": { en: "abalone" },
  "oursin": { en: "sea urchin" },
  "violet": { en: "sea fig" },
  
  // Autres poissons
  "mulet": { en: "grey mullet", latin: "Mugil cephalus" },
  "muge": { en: "mullet fish" },
  "congre": { en: "conger eel", latin: "Conger conger" },
  "anguille": { en: "eel fish", latin: "Anguilla anguilla" },
  "sandre": { en: "zander fish", latin: "Sander lucioperca" },
  "brochet": { en: "pike fish", latin: "Esox lucius" },
  "perche": { en: "perch fish", latin: "Perca fluviatilis" },
  "carpe": { en: "carp fish" },
  "truite": { en: "trout fish", latin: "Salmo trutta" },
  "truite de mer": { en: "sea trout" },
  "saumon": { en: "salmon fish", latin: "Salmo salar" },
  "omble": { en: "arctic char" },
  "féra": { en: "whitefish" },
  
  // Espèces supplémentaires
  "sabre": { en: "cutlassfish" },
  "orphie": { en: "garfish", latin: "Belone belone" },
  "aiguillette": { en: "needlefish" },
  "sériole": { en: "amberjack", latin: "Seriola dumerili" },
  "denti": { en: "dentex", latin: "Dentex dentex" },
  "mérou": { en: "grouper fish", latin: "Epinephelus marginatus" },
  "cernier": { en: "wreckfish" },
  "oblade": { en: "saddled sea bream" },
  "bogue": { en: "bogue fish" },
  "saupe": { en: "salema fish" },
  "girelle": { en: "rainbow wrasse" },
  "labre": { en: "wrasse fish" },
  "vieille": { en: "ballan wrasse" },
};

// Function to translate French species name to English
function translateSpecies(frenchName: string): { en: string; latin?: string } | null {
  const normalizedName = frenchName.toLowerCase().trim();
  
  // Direct match
  if (speciesTranslations[normalizedName]) {
    return speciesTranslations[normalizedName];
  }
  
  // Try to find partial match
  for (const [key, value] of Object.entries(speciesTranslations)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return value;
    }
  }
  
  // Try first word match
  const firstWord = normalizedName.split(' ')[0];
  if (speciesTranslations[firstWord]) {
    return speciesTranslations[firstWord];
  }
  
  return null;
}

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

    // Translate species name from French to English
    const translation = translateSpecies(speciesName);
    const englishName = translation?.en || speciesName;
    
    console.log(`Species: ${speciesName} -> English: ${englishName}`);

    // Search with terms to get raw/fresh fish (not cooked)
    const searchQuery = encodeURIComponent(`${englishName} raw fresh`);
    const pixabayUrl = `https://pixabay.com/api/?key=${pixabayApiKey}&q=${searchQuery}&image_type=photo&orientation=horizontal&per_page=15&lang=en&safesearch=true`;

    console.log(`Searching Pixabay for: ${englishName}`);

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
      
      console.log(`Found ${images.length} images for ${speciesName} (${englishName})`);
      
      return new Response(
        JSON.stringify({ images, source: 'pixabay', englishName }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fallback: try with latin name if available
    if (translation?.latin) {
      const latinQuery = encodeURIComponent(translation.latin);
      const latinUrl = `https://pixabay.com/api/?key=${pixabayApiKey}&q=${latinQuery}&image_type=photo&orientation=horizontal&per_page=10&lang=en&safesearch=true`;
      
      console.log(`Fallback search with latin name: ${translation.latin}`);
      
      const latinResponse = await fetch(latinUrl);
      
      if (latinResponse.ok) {
        const latinData = await latinResponse.json();
        
        if (latinData.hits && latinData.hits.length > 0) {
          const images = latinData.hits
            .slice(0, 3)
            .map((hit: any) => hit.largeImageURL || hit.webformatURL)
            .filter(Boolean);
          
          console.log(`Found ${images.length} images using latin name`);
          
          return new Response(
            JSON.stringify({ images, source: 'pixabay', englishName: translation.latin }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // Last fallback: French search with "poisson marin pêcheur"
    const genericQuery = encodeURIComponent(`${speciesName} poisson marin pêcheur`);
    const genericUrl = `https://pixabay.com/api/?key=${pixabayApiKey}&q=${genericQuery}&image_type=photo&orientation=horizontal&per_page=10&lang=fr&safesearch=true`;
    
    console.log(`French fallback search: ${speciesName} poisson marin pêcheur`);
    
    const genericResponse = await fetch(genericUrl);
    
    if (genericResponse.ok) {
      const genericData = await genericResponse.json();
      
      if (genericData.hits && genericData.hits.length > 0) {
        const images = genericData.hits
          .slice(0, 3)
          .map((hit: any) => hit.largeImageURL || hit.webformatURL)
          .filter(Boolean);
        
        console.log(`Found ${images.length} generic images`);
        
        return new Response(
          JSON.stringify({ images, source: 'pixabay', englishName }),
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
