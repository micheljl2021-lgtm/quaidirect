import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://quaidirect.fr',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { yearsExperience, passion, workStyle, clientMessage } = await req.json();

    if (!yearsExperience || !passion || !workStyle || !clientMessage) {
      return new Response(
        JSON.stringify({ error: 'Toutes les réponses sont requises' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
        return new Response(
          JSON.stringify({ error: 'Limite de requêtes atteinte. Veuillez réessayer dans quelques instants.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Crédits Lovable AI épuisés. Veuillez recharger votre compte.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`Erreur API: ${response.status}`);
    }

    const data = await response.json();
    const generatedDescription = data.choices?.[0]?.message?.content;

    if (!generatedDescription) {
      throw new Error('Aucune description générée');
    }

    console.log('Description générée avec succès');

    return new Response(
      JSON.stringify({ description: generatedDescription.trim() }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erreur dans generate-fisherman-description:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erreur inconnue' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});