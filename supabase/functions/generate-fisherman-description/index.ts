import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { handleCors, getCorsHeaders, jsonResponse, errorResponse } from "../_shared/cors.ts";

// Input validation schema
const inputSchema = z.object({
  yearsExperience: z.string().min(1, "Années d'expérience requises").max(200),
  passion: z.string().min(1, "Passion requise").max(500),
  workStyle: z.string().min(1, "Style de travail requis").max(500),
  clientMessage: z.string().min(1, "Message client requis").max(1000),
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

    const { yearsExperience, passion, workStyle, clientMessage } = parseResult.data;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY non configurée');
    }

    const systemPrompt = `Tu es un rédacteur spécialisé dans la valorisation des pêcheurs artisanaux méditerranéens.
À partir des réponses du pêcheur, génère une description authentique, chaleureuse et professionnelle de 150-200 mots qui met en valeur son métier et sa passion.

Style attendu :
- Ton chaleureux et authentique
- Mettre en avant la passion du métier
- Valoriser l'approche responsable et le savoir-faire
- Créer une connexion émotionnelle avec les clients
- Éviter le jargon trop technique
- Terminer par un appel à la confiance/rencontre

Format : Un seul paragraphe fluide, sans titre.`;

    const userPrompt = `Voici les réponses du pêcheur :

Expérience : ${yearsExperience}
Ce qu'il préfère : ${passion}
Comment il travaille : ${workStyle}
Message pour les clients : ${clientMessage}

Génère maintenant une belle description professionnelle.`;

    console.log('Appel à Lovable AI pour génération de description...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erreur API Lovable:', response.status, errorText);
      
      if (response.status === 429) {
        return errorResponse('Limite de requêtes atteinte. Veuillez réessayer dans quelques instants.', 429, origin);
      }
      
      if (response.status === 402) {
        return errorResponse('Crédits Lovable AI épuisés. Veuillez recharger votre compte.', 402, origin);
      }

      throw new Error(`Erreur API: ${response.status}`);
    }

    const data = await response.json();
    const generatedDescription = data.choices?.[0]?.message?.content;

    if (!generatedDescription) {
      throw new Error('Aucune description générée');
    }

    console.log('Description générée avec succès');

    return jsonResponse({ description: generatedDescription.trim() }, 200, origin);

  } catch (error) {
    console.error('Erreur dans generate-fisherman-description:', error);
    return errorResponse(error instanceof Error ? error.message : 'Erreur inconnue', 500, origin);
  }
});
