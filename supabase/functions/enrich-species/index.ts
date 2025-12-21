import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCors } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  // Handle CORS preflight with origin validation
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const origin = req.headers.get('Origin');

  try {
    const { species_id, species_name } = await req.json();

    if (!species_id && !species_name) {
      return new Response(
        JSON.stringify({ error: "species_id ou species_name requis" }),
        { status: 400, headers: { ...getCorsHeaders(origin), "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch species data
    let query = supabase.from("species").select("*");
    if (species_id) {
      query = query.eq("id", species_id);
    } else {
      query = query.ilike("name", species_name);
    }

    const { data: speciesData, error: fetchError } = await query.single();

    if (fetchError || !speciesData) {
      console.error("Species not found:", fetchError);
      return new Response(
        JSON.stringify({ error: "Espèce non trouvée" }),
        { status: 404, headers: { ...getCorsHeaders(origin), "Content-Type": "application/json" } }
      );
    }

    // Check if enrichment is needed
    const needsEnrichment = !speciesData.flavor || 
                           !speciesData.bones_level || 
                           !speciesData.cooking_tips ||
                           speciesData.cooking_plancha === null;

    if (!needsEnrichment) {
      console.log(`Species ${speciesData.name} already enriched, returning cached data`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          species: speciesData,
          enriched: false,
          message: "Données déjà complètes"
        }),
        { headers: { ...getCorsHeaders(origin), "Content-Type": "application/json" } }
      );
    }

    console.log(`Enriching species: ${speciesData.name}`);

    // Call Lovable AI with tool calling for structured output
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Tu es un expert culinaire spécialisé dans les produits de la mer français.
Tu dois fournir des informations précises et utiles sur les poissons et fruits de mer pour aider les consommateurs à cuisiner.
Réponds toujours en français avec des informations concises et pratiques.`;

    const userPrompt = `Donne-moi les informations culinaires pour l'espèce de poisson/fruit de mer suivante: "${speciesData.name}"
${speciesData.scientific_name ? `(Nom scientifique: ${speciesData.scientific_name})` : ""}

Je veux savoir:
1. Le goût/saveur caractéristique (flavor)
2. Le niveau d'arêtes (bones_level) 
3. Des conseils de préparation pratiques (cooking_tips)
4. Les méthodes de cuisson adaptées (booléens)`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "enrich_species_data",
              description: "Retourne les données culinaires enrichies pour une espèce de poisson/fruit de mer",
              parameters: {
                type: "object",
                properties: {
                  flavor: {
                    type: "string",
                    description: "Description du goût en 5-10 mots (ex: 'Chair blanche, délicate et légèrement sucrée')"
                  },
                  bones_level: {
                    type: "string",
                    description: "Description du niveau d'arêtes (ex: 'Peu d'arêtes, facile à lever' ou 'Nombreuses petites arêtes')"
                  },
                  cooking_tips: {
                    type: "string",
                    description: "Conseils de préparation pratiques en 1-2 phrases courtes"
                  },
                  cooking_plancha: {
                    type: "boolean",
                    description: "Adapté à la cuisson à la plancha"
                  },
                  cooking_friture: {
                    type: "boolean",
                    description: "Adapté à la friture"
                  },
                  cooking_grill: {
                    type: "boolean",
                    description: "Adapté au grill/barbecue"
                  },
                  cooking_sushi_tartare: {
                    type: "boolean",
                    description: "Adapté en sushi ou tartare (cru)"
                  },
                  cooking_vapeur: {
                    type: "boolean",
                    description: "Adapté à la cuisson vapeur"
                  },
                  cooking_four: {
                    type: "boolean",
                    description: "Adapté à la cuisson au four"
                  },
                  cooking_poele: {
                    type: "boolean",
                    description: "Adapté à la poêle"
                  },
                  cooking_soupe: {
                    type: "boolean",
                    description: "Adapté en soupe de poisson"
                  },
                  cooking_bouillabaisse: {
                    type: "boolean",
                    description: "Adapté pour la bouillabaisse"
                  }
                },
                required: ["flavor", "bones_level", "cooking_tips", "cooking_plancha", "cooking_friture", "cooking_grill", "cooking_sushi_tartare", "cooking_vapeur", "cooking_four", "cooking_poele", "cooking_soupe", "cooking_bouillabaisse"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "enrich_species_data" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requêtes atteinte, réessayez plus tard" }),
          { status: 429, headers: { ...getCorsHeaders(origin), "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crédits IA insuffisants" }),
          { status: 402, headers: { ...getCorsHeaders(origin), "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    console.log("AI Response:", JSON.stringify(aiResponse, null, 2));

    // Extract tool call result
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "enrich_species_data") {
      throw new Error("Invalid AI response format");
    }

    const enrichedData = JSON.parse(toolCall.function.arguments);
    console.log("Enriched data:", enrichedData);

    // Update species in database
    const { data: updatedSpecies, error: updateError } = await supabase
      .from("species")
      .update({
        flavor: enrichedData.flavor,
        bones_level: enrichedData.bones_level,
        cooking_tips: enrichedData.cooking_tips,
        cooking_plancha: enrichedData.cooking_plancha,
        cooking_friture: enrichedData.cooking_friture,
        cooking_grill: enrichedData.cooking_grill,
        cooking_sushi_tartare: enrichedData.cooking_sushi_tartare,
        cooking_vapeur: enrichedData.cooking_vapeur,
        cooking_four: enrichedData.cooking_four,
        cooking_poele: enrichedData.cooking_poele,
        cooking_soupe: enrichedData.cooking_soupe,
        cooking_bouillabaisse: enrichedData.cooking_bouillabaisse,
      })
      .eq("id", speciesData.id)
      .select()
      .single();

    if (updateError) {
      console.error("Update error:", updateError);
      throw new Error("Erreur lors de la mise à jour");
    }

    console.log(`Successfully enriched species: ${speciesData.name}`);

    return new Response(
      JSON.stringify({
        success: true,
        species: updatedSpecies,
        enriched: true,
        message: "Espèce enrichie avec succès"
      }),
      { headers: { ...getCorsHeaders(origin), "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("enrich-species error:", error);
    const origin = req.headers.get('Origin');
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erreur inconnue" }),
      { status: 500, headers: { ...getCorsHeaders(origin), "Content-Type": "application/json" } }
    );
  }
});
