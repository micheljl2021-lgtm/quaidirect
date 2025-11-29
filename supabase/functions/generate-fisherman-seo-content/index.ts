import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fishermanId } = await req.json();

    if (!fishermanId) {
      return new Response(
        JSON.stringify({ error: 'fishermanId requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Vérifier que l'utilisateur est admin
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseClient.auth.getUser(token);

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Non authentifié' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: userRole } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!userRole) {
      return new Response(
        JSON.stringify({ error: 'Accès refusé: admin requis' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Récupérer les données du pêcheur
    const { data: fisherman, error: fishermanError } = await supabaseClient
      .from('fishermen')
      .select('*')
      .eq('id', fishermanId)
      .single();

    if (fishermanError || !fisherman) {
      return new Response(
        JSON.stringify({ error: 'Pêcheur introuvable' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Déterminer le type de pêche
    let typeDePeche = "artisan";
    if (fisherman.fishing_methods && fisherman.fishing_methods.length > 0) {
      const method = fisherman.fishing_methods[0];
      if (method === "ligne") typeDePeche = "ligneur";
      else if (method === "filet") typeDePeche = "fileyeur";
      else if (method === "casier") typeDePeche = "caseyeur";
      else if (method === "palangre") typeDePeche = "palangrier";
    }

    const zonePeche = fisherman.main_fishing_zone || "Méditerranée";
    const nomBateau = fisherman.boat_name;
    const nomEntreprise = fisherman.company_name || nomBateau;

    // Générer le contenu SEO via Lovable AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY non configurée');
    }

    const systemPrompt = `Tu es un expert en marketing digital et SEO pour la pêche artisanale française. 
Tu dois générer du contenu optimisé SEO pour enrichir le profil d'un pêcheur sur QuaiDirect.fr.

Le contenu doit être :
- Authentique et professionnel
- Optimisé pour le référencement local
- Centré sur la vente directe à quai
- Mettant en valeur la qualité et la fraîcheur des produits
- Incluant des mots-clés pertinents pour le SEO local`;

    const userPrompt = `Génère le contenu SEO complet pour ce pêcheur :

Nom du bateau: ${nomBateau}
Entreprise: ${nomEntreprise}
Type de pêche: ${typeDePeche}
Zone de pêche: ${zonePeche}

Fournis un JSON avec cette structure exacte :
{
  "seo_title": "Titre SEO optimisé (60 caractères max, incluant ville)",
  "seo_meta_description": "Description pour moteurs de recherche (150-160 caractères)",
  "seo_keywords": ["mot-clé 1", "mot-clé 2", "mot-clé 3", "mot-clé 4", "mot-clé 5"],
  "seo_long_content": "Contenu long enrichi (300-400 mots) mettant en valeur l'authenticité, la qualité, la fraîcheur. Parler de la pêche artisanale, du savoir-faire, de la vente directe.",
  "seo_how_to_order": {
    "steps": [
      {"number": 1, "title": "Titre étape 1", "description": "Description courte"},
      {"number": 2, "title": "Titre étape 2", "description": "Description courte"},
      {"number": 3, "title": "Titre étape 3", "description": "Description courte"},
      {"number": 4, "title": "Titre étape 4", "description": "Description courte"}
    ]
  },
  "seo_hours_location": "Texte décrivant horaires variables selon météo et localisation du point de vente (2-3 phrases)"
}

IMPORTANT: Réponds UNIQUEMENT avec le JSON, sans texte avant ou après.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API Error:', errorText);
      throw new Error('Erreur lors de la génération du contenu');
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices[0].message.content;

    // Parser le JSON retourné par l'IA
    let seoContent;
    try {
      // Nettoyer le contenu (enlever les balises markdown si présentes)
      const cleanContent = aiContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      seoContent = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Parse Error:', parseError);
      console.error('AI Content:', aiContent);
      throw new Error('Format de réponse IA invalide');
    }

    // Sauvegarder dans la base de données
    const { error: updateError } = await supabaseClient
      .from('fishermen')
      .update({
        seo_title: seoContent.seo_title,
        seo_meta_description: seoContent.seo_meta_description,
        seo_keywords: seoContent.seo_keywords,
        seo_long_content: seoContent.seo_long_content,
        seo_how_to_order: seoContent.seo_how_to_order,
        seo_hours_location: seoContent.seo_hours_location,
        seo_enriched_at: new Date().toISOString(),
      })
      .eq('id', fishermanId);

    if (updateError) {
      throw updateError;
    }

    // Logger dans les audits
    await supabaseClient.from('audits').insert({
      table_name: 'fishermen',
      record_id: fishermanId,
      action: 'seo_enrichment',
      new_data: seoContent,
      user_id: user.id,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Contenu SEO généré et sauvegardé avec succès',
        data: seoContent,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erreur inconnue' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});