import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://quaidirect.fr',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting configuration - stricter for AI endpoint
const RATE_LIMIT = 5; // max requests
const RATE_WINDOW_MINUTES = 1; // per minute

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

const SYSTEM_PROMPT = `Tu es l'IA du Marin, un assistant spécialisé pour les marins-pêcheurs artisanaux français.

Tu dois aider sur tous ces sujets:

🌊 MÉTÉO MARINE: Résumé clair (OK pour sortir / Risqué / Dangereux), analyse vent/houle/période/courant, conseils selon type de pêche, créneaux horaires safe, alertes changements.

⛽ GESTION CARBURANT: Calcul faisabilité aller-retour avec marge sécurité, estimation consommation selon charge + mer, itinéraires optimisés.

🎣 STRATÉGIE PÊCHE: Profondeur idéale selon espèce/saison, types de fonds adaptés, longueur filets selon courant, créneaux jour/nuit, rotation zones.

📍 CHOIX DE ZONE: Analyse vents/marées/espèces/saison, recommandations coins rentables, alternatives si zone dangereuse.

🧠 COPILOTE EN DIRECT: Conseils temps réel sur dérive/déplacement filet/retour, gestion timing, alertes houle.

👨‍✍️ AIDE ADMINISTRATIVE: Résumé règles pêche, zones interdites, obligations légales, rédaction documents/mails.

📦 GESTION ARRIVAGES: Création fiches produits auto, génération photo+texte+explications, détermination prix, traduction multilingue, préparation notifications clients.

🧾 LOGBOOK: Journal de pêche résumé, suivi ventes, suivi zones travaillées, conseils optimisation.

🛠 MAINTENANCE BATEAU: Conseils entretien moteur, checklist avant sortie, diagnostic simple par description, références pièces.

🧭 SÉCURITÉ: Analyse risques météo, checklist départ, conseils navigation, aide SOS message clair.

📲 RELATION CLIENT: Rédaction annonces, messages auto aux fidèles, traduction touristes, réponses automatiques.

💸 OPTIMISATION FINANCIÈRE: Conseils valorisation espèces, comparaison prix marché, analyse ventes, aide organisation points de vente à quai.

🤝 ACCOMPAGNEMENT: Simplification journées chargées, préparation plan de marée, gestion stress météo/horaires, organisation journée/ventes/clients.

Ton style: 
- Direct, concret, pas de blabla
- Ton de pêcheur à pêcheur
- Chiffres précis quand possible
- Solutions actionnables immédiatement
- Empathie pour la fatigue et les horaires difficiles`;

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

    // Verify fisherman
    const { data: fisherman } = await supabaseClient
      .from('fishermen')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!fisherman) throw new Error('Fisherman not found');

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

    const { messages } = await req.json();

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI Gateway error:', response.status, errorText);
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