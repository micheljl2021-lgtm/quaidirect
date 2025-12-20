import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Build personalized system prompt based on user context
const buildSystemPrompt = (userContext: any): string => {
  const basePromptFisherman = `Tu es l'IA du Marin, un assistant personnel spécialisé pour les marins-pêcheurs artisanaux français.

Tu connais bien ce pêcheur et tu l'aides au quotidien. Voici ce que tu sais sur lui :`;

  const basePromptClient = `Tu es l'assistant QuaiDirect, spécialisé dans l'achat de poisson frais en circuit court auprès de pêcheurs artisanaux français.

Tu connais les préférences de cet utilisateur :`;

  const fishermanCapabilities = `

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
- Ton de pêcheur à pêcheur
- Chiffres précis quand possible
- Solutions actionnables immédiatement
- Empathie pour la fatigue et les horaires difficiles`;

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

  if (!userContext) {
    return basePromptFisherman + "\n(Informations non disponibles)" + fishermanCapabilities;
  }

  // Determine user type from context
  const isFisherman = userContext.boatName || userContext.fishingMethods || userContext.type === 'fisherman';

  if (isFisherman) {
    let contextInfo = "\n";
    
    if (userContext.boatName) {
      contextInfo += `\n🚤 Bateau: ${userContext.boatName}`;
    }
    if (userContext.fishingZones && userContext.fishingZones.length > 0) {
      contextInfo += `\n🌊 Zones de pêche: ${userContext.fishingZones.join(', ')}`;
    }
    if (userContext.fishingMethods && userContext.fishingMethods.length > 0) {
      contextInfo += `\n🎣 Méthodes: ${userContext.fishingMethods.join(', ')}`;
    }
    if (userContext.mainSpecies && userContext.mainSpecies.length > 0) {
      contextInfo += `\n🐟 Espèces principales: ${userContext.mainSpecies.join(', ')}`;
    }
    if (userContext.salePoints && userContext.salePoints.length > 0) {
      contextInfo += `\n🏪 Points de vente: ${userContext.salePoints.map((sp: any) => `${sp.label}`).join(', ')}`;
    }
    if (userContext.contactCount) {
      contextInfo += `\n👥 ${userContext.contactCount} contacts clients`;
    }
    if (userContext.recentDropsCount) {
      contextInfo += `\n📦 ${userContext.recentDropsCount} arrivages ce mois-ci`;
    }

    return basePromptFisherman + contextInfo + fishermanCapabilities;
  } else {
    // Premium user
    let contextInfo = "\n";
    
    if (userContext.followedPorts && userContext.followedPorts.length > 0) {
      contextInfo += `\n⚓ Ports favoris: ${userContext.followedPorts.join(', ')}`;
    }
    if (userContext.followedSpecies && userContext.followedSpecies.length > 0) {
      contextInfo += `\n🐟 Espèces préférées: ${userContext.followedSpecies.join(', ')}`;
    }
    if (userContext.followedFishermen && userContext.followedFishermen.length > 0) {
      contextInfo += `\n🚤 Pêcheurs suivis: ${userContext.followedFishermen.join(', ')}`;
    }
    if (userContext.recentOrders) {
      contextInfo += `\n🛒 ${userContext.recentOrders} commandes passées`;
    }

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
    const isFisherman = userRoles.includes('fisherman');
    const isPremium = userRoles.includes('premium');
    const isAdmin = userRoles.includes('admin');
    
    const hasAccess = isFisherman || isPremium || isAdmin;

    if (!hasAccess) {
      throw new Error('Accès réservé aux pêcheurs, utilisateurs premium et administrateurs');
    }

    // Determine user role for quota
    let userRole = 'user';
    if (isAdmin) userRole = 'admin';
    else if (isFisherman) userRole = 'fisherman';
    else if (isPremium) userRole = 'premium';

    // Check and increment AI usage quota
    const { data: quotaResult, error: quotaError } = await supabaseClient.rpc(
      'check_and_increment_ai_usage',
      { p_user_id: user.id, p_user_role: userRole }
    );

    if (quotaError) {
      console.error('[MARINE-AI] Quota check error:', quotaError);
      // Continue anyway - don't block on quota errors
    } else if (quotaResult && !quotaResult.allowed) {
      console.log(`[MARINE-AI] Quota exceeded for user ${user.id}, role: ${userRole}`);
      
      const message = quotaResult.reason === 'quota_exceeded'
        ? `Vous avez atteint votre limite de ${quotaResult.limit} questions IA pour aujourd'hui. Consultez les FAQ ou revenez demain !`
        : 'Accès IA non disponible pour votre compte.';
      
      return new Response(
        JSON.stringify({ 
          quotaExceeded: true, 
          message,
          remaining: 0,
          limit: quotaResult.limit 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200, // Return 200 so client can handle gracefully
        }
      );
    }

    console.log(`[MARINE-AI] Quota OK for user ${user.id}, role: ${userRole}, remaining: ${quotaResult?.remaining ?? 'N/A'}`);

    const { messages, userContext } = await req.json();

    // Build personalized system prompt
    const systemPrompt = buildSystemPrompt(userContext);
    console.log(`[MARINE-AI] User role: ${userRole}, context: ${userContext?.boatName || userContext?.followedPorts?.length + ' ports' || 'none'}`);

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
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Service temporairement indisponible. Réessayez plus tard.' }),
          {
            status: 402,
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
        'X-AI-Remaining': String(quotaResult?.remaining ?? -1),
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
