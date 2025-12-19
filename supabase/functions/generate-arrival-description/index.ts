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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { species, salePointLabel, timeSlot } = await req.json();

    if (!species || species.length === 0) {
      return new Response(
        JSON.stringify({ error: "Aucune espèce fournie" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build species info with cooking methods
    const speciesInfo = species.map((s: any) => {
      let info = `${s.speciesName}`;
      if (s.cookingMethods && s.cookingMethods.length > 0) {
        info += ` (${s.cookingMethods.join(', ')})`;
      }
      if (s.flavor) {
        info += ` - ${s.flavor}`;
      }
      return info;
    }).join(", ");

    const timeSlotLabels: Record<string, string> = {
      matin: "7h-9h",
      fin_matinee: "9h-11h",
      midi: "11h-13h",
      apres_midi: "14h-17h",
    };

    const systemPrompt = `Tu es un assistant pour les pêcheurs artisanaux français. Tu génères des descriptions courtes et attrayantes pour leurs arrivages de poisson frais.

Règles:
- Maximum 2-3 phrases, style direct et authentique
- Mentionne les méthodes de cuisson si approprié (plancha, grillade, poêle, etc.)
- Ton chaleureux mais professionnel, typique des marchés locaux
- Évite le jargon marketing, reste naturel
- Mets en avant la fraîcheur et la qualité artisanale
- Tu peux utiliser des emojis de façon modérée (🐟, ⚓, 🔥)`;

    const userPrompt = `Génère une description attrayante pour cet arrivage:
- Espèces: ${speciesInfo}
- Point de vente: ${salePointLabel || "À quai"}
- Créneau: ${timeSlotLabels[timeSlot] || timeSlot}

Écris 2-3 phrases maximum pour donner envie aux clients.`;

    console.log("Generating description for species:", speciesInfo);

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
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Trop de requêtes, réessaie dans quelques secondes." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crédits IA épuisés. Contacte le support." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Erreur lors de la génération" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const description = data.choices?.[0]?.message?.content?.trim() || "";

    console.log("Generated description:", description);

    return new Response(
      JSON.stringify({ description }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error in generate-arrival-description:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
