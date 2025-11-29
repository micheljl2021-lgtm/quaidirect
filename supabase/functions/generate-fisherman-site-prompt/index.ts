import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const typeLogic: Record<string, any> = {
  ligneur: {
    style: "premium, bleu nuit, qualitatif",
    focus: "poisson de ligne, qualité supérieure, poisson intact",
    defaultProducts: ["Bar de ligne", "Dorade royale", "Maigre", "Bonite"],
    seoKeywords: ["poisson de ligne", "bar de ligne", "pêche à la ligne", "pêche artisanale", "vente directe pêcheur", "poisson frais"]
  },
  fileyeur: {
    style: "tradition portuaire, ambiance authentique",
    focus: "pêche variée, volumes réguliers, pêche locale",
    defaultProducts: ["Dorade", "Merlan", "Rouget", "Sole", "Loup", "Pageot"],
    seoKeywords: ["pêche au filet", "fileyeur", "poisson frais", "pêche artisanale", "vente au port"]
  },
  caseyeur: {
    style: "crustacés, casiers, ambiance bois & cordages",
    focus: "homards, langoustes, crabes, poulpes, quantités limitées",
    defaultProducts: ["Homard", "Langouste", "Araignée de mer", "Poulpe", "Seiche", "Étrilles"],
    seoKeywords: ["crustacés vivants", "homard frais", "langouste", "pêche aux casiers", "vente directe crustacés"]
  },
  palangrier: {
    style: "haute mer, dynamique, grand large",
    focus: "thon, espadon, grands poissons, respect des quotas",
    defaultProducts: ["Thon", "Espadon", "Sabre", "Daurade rose"],
    seoKeywords: ["thon frais", "espadon", "palangrier", "pêche hauturière", "vente directe pêcheur"]
  },
  inconnu: {
    style: "maritime générique",
    focus: "pêche locale",
    defaultProducts: ["Poisson frais", "Saison", "Pêche du jour"],
    seoKeywords: ["poisson frais", "pêche locale", "vente directe pêcheur", "pêche artisanale"]
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Verify admin role
    const { data: roleData } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!roleData) {
      throw new Error('Admin access required');
    }

    const requestData = await req.json();
    
    // Validation des champs obligatoires
    const required = ['NOM_DU_BATEAU', 'NOM_DU_PECHEUR', 'PORT', 'NUMERO', 'TYPE_DE_PECHE'];
    for (const field of required) {
      if (!requestData[field]) {
        return new Response(
          JSON.stringify({ error: `Missing required field: ${field}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const typeDePeche = requestData.TYPE_DE_PECHE.toLowerCase();
    const logic = typeLogic[typeDePeche] || typeLogic.inconnu;
    
    // Construire les produits (fournis ou par défaut)
    const produits = requestData.PRODUITS && requestData.PRODUITS.length > 0 
      ? requestData.PRODUITS 
      : logic.defaultProducts;

    // Construire le contexte pour l'IA
    const systemPrompt = `Tu es un générateur expert de sites web pour marins-pêcheurs artisanaux français.
Tu crées des prompts détaillés et optimisés pour Lovable, qui générera automatiquement un site web complet.

Style et tonalité :
- Maritime authentique et professionnel
- Centré sur la vente directe et le contact rapide
- Mobile-first, lisible et simple
- Respectueux de la tradition maritime et de l'artisanat

Structure obligatoire du prompt Lovable :
1. Titre et style visuel (couleurs maritimes, design adapté au type de pêche)
2. Section héro avec image et CTA (WhatsApp + Téléphone)
3. Présentation du bateau et du pêcheur (authenticité, expérience)
4. Produits disponibles (liste claire avec descriptions courtes)
5. Comment commander (3-4 étapes simples)
6. Horaires & lieu (Google Maps intégré)
7. Galerie photos (bateau, port, pêche)
8. Contact (téléphone, WhatsApp, email visibles)
9. Footer avec attribution QuaiDirect
10. SEO et mots-clés adaptés
11. JSON-LD structured data pour référencement

Type de pêche détecté : ${typeDePeche}
Style recommandé : ${logic.style}
Focus : ${logic.focus}`;

    const userPrompt = `Génère un prompt Lovable complet pour créer un site web de pêcheur avec les données suivantes :

DONNÉES DU PÊCHEUR :
- Nom du bateau : ${requestData.NOM_DU_BATEAU}
- Nom du pêcheur : ${requestData.NOM_DU_PECHEUR}
- Port : ${requestData.PORT}
- Téléphone : ${requestData.NUMERO}
- Email : ${requestData.EMAIL || 'Non fourni'}
- Type de pêche : ${requestData.TYPE_DE_PECHE}
- Zone de pêche : ${requestData.ZONE_DE_PECHE || 'Locale'}
- Heure d'arrivée : ${requestData.HEURE_ARRIVEE || 'Selon météo'}
- Horaires : ${requestData.HORAIRES || 'Variable selon saison'}
- Jours de sortie : ${requestData.JOURS_SORTIE || 'Selon conditions météo'}
- Années d'expérience : ${requestData.ANNEES_EXPERIENCE || 'Expérimenté'}
- Technique : ${requestData.TECHNIQUE || logic.focus}
- Produits : ${produits.join(', ')}
- Adresse encodée Google Maps : ${requestData.ADRESSE_ENCODEE || ''}
- Image principale : ${requestData.IMAGE_PRINCIPALE || ''}

MOTS-CLÉS SEO À INTÉGRER :
${logic.seoKeywords.join(', ')}, ${requestData.PORT}

INSTRUCTIONS SPÉCIALES :
- Le site doit être en 2-4 pages maximum
- Les boutons CTA doivent être XXL pour usage mobile/tactile
- Intégrer un lien Google Maps : https://www.google.com/maps/dir/?api=1&destination=${requestData.ADRESSE_ENCODEE || requestData.PORT}
- Ajouter le JSON-LD suivant dans le head :
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "${requestData.NOM_DU_BATEAU}",
  "image": "${requestData.IMAGE_PRINCIPALE || ''}",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Port de ${requestData.PORT}",
    "addressLocality": "${requestData.PORT}",
    "addressRegion": "France"
  },
  "telephone": "${requestData.NUMERO}",
  "url": "${requestData.URL_SITE || ''}",
  "servesCuisine": "Produits de la mer",
  "keywords": "vente directe pêcheur, pêche artisanale, ${typeDePeche}, ${requestData.PORT}"
}

Génère maintenant le prompt Lovable complet, structuré, prêt à être copié-collé dans Lovable pour créer le site automatiquement.`;

    // Appel à Lovable AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('[PROMPT-GEN] Calling Lovable AI...');

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
      console.error('[PROMPT-GEN] AI Error:', aiResponse.status, errorText);
      throw new Error(`AI generation failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const generatedPrompt = aiData.choices[0].message.content;

    console.log('[PROMPT-GEN] Prompt generated successfully');

    // Log dans la base de données
    await supabaseClient.from('audits').insert({
      table_name: 'fishermen',
      action: 'generate_site_prompt',
      record_id: requestData.fishermanId || 'unknown',
      user_id: user.id,
      new_data: {
        boat_name: requestData.NOM_DU_BATEAU,
        fishing_type: requestData.TYPE_DE_PECHE,
        port: requestData.PORT
      }
    });

    return new Response(
      JSON.stringify({
        generatedPrompt,
        metadata: {
          boatName: requestData.NOM_DU_BATEAU,
          fishermanName: requestData.NOM_DU_PECHEUR,
          fishingType: requestData.TYPE_DE_PECHE,
          port: requestData.PORT,
          generatedAt: new Date().toISOString(),
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('[PROMPT-GEN] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
