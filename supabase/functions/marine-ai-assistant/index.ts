import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting configuration
const RATE_LIMIT = 10; // max requests per minute
const RATE_WINDOW_MINUTES = 1;

const checkRateLimit = async (
  supabase: any,
  identifier: string,
  endpoint: string
): Promise<{ allowed: boolean; remaining: number }> => {
  const windowStart = new Date(Date.now() - RATE_WINDOW_MINUTES * 60 * 1000).toISOString();
  
  const { data: existing, error: fetchError } = await supabase
    .from('rate_limits')
    .select('id, request_count')
    .eq('identifier', identifier)
    .eq('endpoint', endpoint)
    .gte('window_start', windowStart)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error('Rate limit check error:', fetchError);
    return { allowed: true, remaining: RATE_LIMIT };
  }

  if (existing) {
    if (existing.request_count >= RATE_LIMIT) {
      return { allowed: false, remaining: 0 };
    }
    await supabase
      .from('rate_limits')
      .update({ request_count: existing.request_count + 1 })
      .eq('id', existing.id);
    return { allowed: true, remaining: RATE_LIMIT - existing.request_count - 1 };
  }

  await supabase.from('rate_limits').insert({
    identifier,
    endpoint,
    request_count: 1,
    window_start: new Date().toISOString(),
  });
  return { allowed: true, remaining: RATE_LIMIT - 1 };
};

// Build personalized system prompt based on user context
const buildSystemPrompt = (userContext: any): string => {
  const basePromptFisherman = `Tu es l'IA du Marin, un assistant personnel spécialisé pour les marins-pêcheurs artisanaux français.

Tu connais bien ce pêcheur et tu l'aides au quotidien. Voici ce que tu sais sur lui :`;

  const basePromptClient = `Tu es l'assistant QuaiDirect, spécialisé dans l'achat de poisson frais en circuit court auprès de pêcheurs artisanaux français.

Tu connais les préférences de cet utilisateur :`;

  const capabilities = `

Tu peux aider sur ces sujets:

🌊 MÉTÉO MARINE: Résumé clair (OK pour sortir / Risqué / Dangereux), analyse vent/houle/période/courant, conseils selon type de pêche, créneaux horaires safe, alertes changements.

⛽ GESTION CARBURANT: Calcul faisabilité aller-retour avec marge sécurité, estimation consommation selon charge + mer, itinéraires optimisés.

🎣 STRATÉGIE PÊCHE: Profondeur idéale selon espèce/saison, types de fonds adaptés, longueur filets selon courant, créneaux jour/nuit, rotation zones.

📍 CHOIX DE ZONE: Analyse vents/marées/espèces/saison, recommandations coins rentables, alternatives si zone dangereuse.

👨‍✍️ AIDE ADMINISTRATIVE: Résumé règles pêche, zones interdites, obligations légales, rédaction documents/mails.

📦 GESTION ARRIVAGES: Création fiches produits auto, génération descriptions, détermination prix, préparation notifications clients.

💸 OPTIMISATION FINANCIÈRE: Conseils valorisation espèces, comparaison prix marché, analyse ventes, aide organisation points de vente à quai.

🍳 RECETTES & CONSEILS: Recettes simples pour poissons frais, conseils de préparation, conservation.

Ton style: 
- Direct, concret, pas de blabla
- Ton de pêcheur à pêcheur (ou ami proche pour les clients)
- Chiffres précis quand possible
- Solutions actionnables immédiatement
- Empathie pour la fatigue et les horaires difficiles`;

  if (!userContext) {
    return basePromptFisherman + "\n(Informations non disponibles)" + capabilities;
  }

  if (userContext.type === 'fisherman') {
    let contextInfo = "\n";
    
    if (userContext.boatName) {
      contextInfo += `\n🚤 Bateau: ${userContext.boatName}`;
    }
    if (userContext.companyName) {
      contextInfo += ` (${userContext.companyName})`;
    }
    if (userContext.yearsExperience) {
      contextInfo += `\n📅 Expérience: ${userContext.yearsExperience}`;
    }
    if (userContext.city) {
      contextInfo += `\n📍 Basé à: ${userContext.city}`;
    }
    if (userContext.mainFishingZone) {
      contextInfo += `\n🗺️ Zone principale: ${userContext.mainFishingZone}`;
    }
    if (userContext.fishingZones && userContext.fishingZones.length > 0) {
      contextInfo += `\n🌊 Zones de pêche: ${userContext.fishingZones.join(', ')}`;
    }
    if (userContext.fishingMethods && userContext.fishingMethods.length > 0) {
      contextInfo += `\n🎣 Méthodes de pêche: ${userContext.fishingMethods.join(', ')}`;
    }
    if (userContext.preferredSpecies && userContext.preferredSpecies.length > 0) {
      contextInfo += `\n🐟 Espèces principales: ${userContext.preferredSpecies.join(', ')}`;
    }
    if (userContext.salePoints && userContext.salePoints.length > 0) {
      contextInfo += `\n🏪 Points de vente: ${userContext.salePoints.map((sp: any) => `${sp.label} (${sp.address})`).join(', ')}`;
    }

    return basePromptFisherman + contextInfo + capabilities;
  } else {
    // Premium or admin user
    let contextInfo = "\n";
    
    if (userContext.userName) {
      contextInfo += `\n👤 Nom: ${userContext.userName}`;
    }
    if (userContext.userCity) {
      contextInfo += `\n📍 Ville: ${userContext.userCity}`;
    }
    if (userContext.followedPorts && userContext.followedPorts.length > 0) {
      contextInfo += `\n⚓ Ports favoris: ${userContext.followedPorts.join(', ')}`;
    }
    if (userContext.followedSpecies && userContext.followedSpecies.length > 0) {
      contextInfo += `\n🐟 Espèces préférées: ${userContext.followedSpecies.join(', ')}`;
    }
    if (userContext.followedFishermen && userContext.followedFishermen.length > 0) {
      contextInfo += `\n🚤 Pêcheurs suivis: ${userContext.followedFishermen.join(', ')}`;
    }

    const clientCapabilities = `

Tu peux aider sur ces sujets:

🐟 ESPÈCES DE SAISON: Quelles espèces sont disponibles selon la saison et la région.

📍 OÙ ACHETER: Trouver les meilleurs ports et pêcheurs pour acheter du poisson frais.

🍳 RECETTES: Suggestions de recettes simples et savoureuses selon les espèces.

🧊 CONSERVATION: Conseils pour conserver le poisson frais, le préparer, le congeler.

⏰ ARRIVAGES: Informations sur les horaires de vente, les créneaux recommandés.

💡 CONSEILS: Comment reconnaître un poisson frais, négocier les prix, choisir selon ses besoins.

Ton style:
- Amical et accessible
- Conseils pratiques et concrets
- Vulgarisation du monde de la pêche
- Passion pour le circuit court et les produits frais`;

    return basePromptClient + contextInfo + clientCapabilities;
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    
    const user = userData.user;
    if (!user) throw new Error('User not authenticated');

    // Check if user has access (fisherman, premium, or admin)
    const { data: roles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const userRoles = roles?.map(r => r.role) || [];
    const hasAccess = userRoles.includes('fisherman') || 
                      userRoles.includes('premium') || 
                      userRoles.includes('admin');

    if (!hasAccess) {
      throw new Error('Accès réservé aux pêcheurs, utilisateurs premium et administrateurs');
    }

    // Rate limiting check
    const { allowed, remaining } = await checkRateLimit(supabaseClient, user.id, 'marine-ai-assistant');
    if (!allowed) {
      console.log(`[MARINE-AI] Rate limit exceeded for user ${user.id}`);
      return new Response(
        JSON.stringify({ error: 'Limite de requêtes atteinte. Veuillez patienter 1 minute.' }),
        {
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'X-RateLimit-Remaining': '0',
            'Retry-After': '60'
          },
          status: 429,
        }
      );
    }
    console.log(`[MARINE-AI] Rate limit OK for user ${user.id}, remaining: ${remaining}`);

    const { messages, userContext } = await req.json();

    // Build personalized system prompt
    const systemPrompt = buildSystemPrompt(userContext);
    console.log(`[MARINE-AI] User type: ${userContext?.type || 'unknown'}, boat: ${userContext?.boatName || 'N/A'}`);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Trop de requêtes. Réessayez dans quelques instants.' }),
          {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      
      throw new Error(`Lovable AI Gateway error: ${response.status}`);
    }

    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'X-RateLimit-Remaining': String(remaining),
      },
    });
  } catch (error: any) {
    console.error('marine-ai-assistant error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
