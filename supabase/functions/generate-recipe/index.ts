import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { handleCors, getCorsHeaders, jsonResponse, errorResponse } from "../_shared/cors.ts";

// Input validation schema
const inputSchema = z.object({
  species_id: z.string().uuid("ID d'espèce invalide"),
  cooking_method: z.string().max(100).optional(),
});

serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const origin = req.headers.get("Origin");

  try {
    const rawBody = await req.json();
    
    // Validate input with Zod
    const parseResult = inputSchema.safeParse(rawBody);
    if (!parseResult.success) {
      const errorMessage = parseResult.error.errors
        .map(e => `${e.path.join('.')}: ${e.message}`)
        .join(', ');
      console.warn("Validation failed:", errorMessage);
      return errorResponse(errorMessage, 400, origin);
    }

    const { species_id, cooking_method } = parseResult.data;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch species data
    const { data: speciesData, error: fetchError } = await supabase
      .from("species")
      .select("*")
      .eq("id", species_id)
      .single();

    if (fetchError || !speciesData) {
      console.error("Species not found:", fetchError);
      return errorResponse("Espèce non trouvée", 404, origin);
    }

    console.log(`Generating recipe for: ${speciesData.name}, method: ${cooking_method || "any"}`);

    // Build cooking methods context
    const cookingMethods: string[] = [];
    if (speciesData.cooking_plancha) cookingMethods.push("plancha");
    if (speciesData.cooking_friture) cookingMethods.push("friture");
    if (speciesData.cooking_grill) cookingMethods.push("grill/barbecue");
    if (speciesData.cooking_sushi_tartare) cookingMethods.push("sushi/tartare");
    if (speciesData.cooking_vapeur) cookingMethods.push("vapeur");
    if (speciesData.cooking_four) cookingMethods.push("four");
    if (speciesData.cooking_poele) cookingMethods.push("poêle");
    if (speciesData.cooking_soupe) cookingMethods.push("soupe");
    if (speciesData.cooking_bouillabaisse) cookingMethods.push("bouillabaisse");

    // Call Lovable AI with tool calling for structured output
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Tu es un chef cuisinier français spécialisé dans les produits de la mer.
Tu crées des recettes authentiques, savoureuses et accessibles pour les familles.
Tes recettes mettent en valeur la fraîcheur et la qualité du poisson.
Réponds toujours en français.`;

    const userPrompt = `Crée une recette originale avec "${speciesData.name}".

Informations sur l'espèce:
- Goût: ${speciesData.flavor || "Non renseigné"}
- Arêtes: ${speciesData.bones_level || "Non renseigné"}
- Conseils: ${speciesData.cooking_tips || "Non renseigné"}
- Méthodes de cuisson adaptées: ${cookingMethods.join(", ") || "Toutes"}

${cooking_method ? `Méthode de cuisson demandée: ${cooking_method}` : "Choisis la méthode la plus adaptée."}

Crée une recette simple et délicieuse, typique de la cuisine française méditerranéenne ou côtière.`;

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
              name: "create_recipe",
              description: "Crée une recette de poisson complète avec tous les détails",
              parameters: {
                type: "object",
                properties: {
                  title: {
                    type: "string",
                    description: "Titre de la recette (ex: 'Dorade royale au four, citron et thym')"
                  },
                  description: {
                    type: "string",
                    description: "Description appétissante de la recette en 2-3 phrases"
                  },
                  preparation_time: {
                    type: "number",
                    description: "Temps de préparation en minutes"
                  },
                  cooking_time: {
                    type: "number",
                    description: "Temps de cuisson en minutes"
                  },
                  difficulty: {
                    type: "string",
                    enum: ["facile", "moyen", "difficile"],
                    description: "Niveau de difficulté"
                  },
                  servings: {
                    type: "number",
                    description: "Nombre de personnes"
                  },
                  instructions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        step: { type: "number" },
                        text: { type: "string" }
                      },
                      required: ["step", "text"]
                    },
                    description: "Étapes de la recette"
                  },
                  ingredients: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        quantity: { type: "string" }
                      },
                      required: ["name", "quantity"]
                    },
                    description: "Liste des ingrédients avec quantités"
                  }
                },
                required: ["title", "description", "preparation_time", "cooking_time", "difficulty", "servings", "instructions", "ingredients"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "create_recipe" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return errorResponse("Limite de requêtes atteinte, réessayez plus tard", 429, origin);
      }
      if (response.status === 402) {
        return errorResponse("Crédits IA insuffisants", 402, origin);
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    console.log("AI Response received");

    // Extract tool call result
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "create_recipe") {
      throw new Error("Invalid AI response format");
    }

    const recipeData = JSON.parse(toolCall.function.arguments);
    console.log("Recipe data:", recipeData.title);

    // Insert recipe into database
    const { data: newRecipe, error: recipeError } = await supabase
      .from("recipes")
      .insert({
        title: recipeData.title,
        description: recipeData.description,
        preparation_time: recipeData.preparation_time,
        cooking_time: recipeData.cooking_time,
        difficulty: recipeData.difficulty,
        servings: recipeData.servings,
        instructions: recipeData.instructions,
      })
      .select()
      .single();

    if (recipeError) {
      console.error("Recipe insert error:", recipeError);
      throw new Error("Erreur lors de la création de la recette");
    }

    // Insert recipe_species link
    const { error: speciesLinkError } = await supabase
      .from("recipe_species")
      .insert({
        recipe_id: newRecipe.id,
        species_id: species_id,
        is_primary: true,
        quantity: recipeData.ingredients.find((i: any) => 
          i.name.toLowerCase().includes(speciesData.name.toLowerCase())
        )?.quantity || "400g"
      });

    if (speciesLinkError) {
      console.error("Species link error:", speciesLinkError);
    }

    // Insert recipe ingredients
    const ingredientsToInsert = recipeData.ingredients
      .filter((i: any) => !i.name.toLowerCase().includes(speciesData.name.toLowerCase()))
      .map((i: any, idx: number) => ({
        recipe_id: newRecipe.id,
        name: i.name,
        quantity: i.quantity,
        order_index: idx + 1
      }));

    if (ingredientsToInsert.length > 0) {
      const { error: ingredientsError } = await supabase
        .from("recipe_ingredients")
        .insert(ingredientsToInsert);

      if (ingredientsError) {
        console.error("Ingredients insert error:", ingredientsError);
      }
    }

    console.log(`Successfully created recipe: ${newRecipe.title}`);

    return jsonResponse({
      success: true,
      recipe: {
        ...newRecipe,
        species_name: speciesData.name,
        ingredients: recipeData.ingredients
      },
      message: "Recette créée avec succès"
    }, 200, origin);

  } catch (error) {
    console.error("generate-recipe error:", error);
    return errorResponse(error instanceof Error ? error.message : "Erreur inconnue", 500, origin);
  }
});
