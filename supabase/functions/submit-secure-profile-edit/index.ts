import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://quaidirect.fr",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting configuration
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

interface ProfileEditData {
  token: string;
  boat_name?: string;
  company_name?: string;
  description?: string;
  phone?: string;
  fishing_methods?: string[];
  fishing_zones?: string[];
  main_fishing_zone?: string;
  photo_url?: string;
  photo_boat_1?: string;
  photo_boat_2?: string;
  photo_dock_sale?: string;
  instagram_url?: string;
  facebook_url?: string;
  website_url?: string;
  bio?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Rate limiting - use IP address for unauthenticated endpoint
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const { allowed, remaining } = await checkRateLimit(supabaseClient, clientIP, 'submit-secure-profile-edit');
    if (!allowed) {
      console.log(`[SUBMIT-PROFILE-EDIT] Rate limit exceeded for IP ${clientIP}`);
      return new Response(
        JSON.stringify({ success: false, error: 'Trop de requêtes. Veuillez patienter.' }),
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

    const { token, ...updateData }: ProfileEditData = await req.json();
    if (!token) throw new Error("Token manquant");

    // Revalider le token
    const { data: tokenData, error: tokenError } = await supabaseClient
      .from("secure_edit_tokens")
      .select("*")
      .eq("token", token)
      .single();

    if (tokenError || !tokenData) {
      throw new Error("Token invalide");
    }

    // Vérifications de sécurité
    const now = new Date();
    const expiresAt = new Date(tokenData.expires_at);
    if (now > expiresAt) throw new Error("Token expiré");
    if (tokenData.used_at) throw new Error("Token déjà utilisé");
    if (tokenData.revoked_at) throw new Error("Token révoqué");

    // Récupérer les anciennes données pour l'audit
    const { data: oldData } = await supabaseClient
      .from("fishermen")
      .select("*")
      .eq("id", tokenData.fisherman_id)
      .single();

    // Préparer les données de mise à jour (exclure les champs sensibles)
    const allowedFields = [
      'boat_name', 'company_name', 'description', 'phone',
      'fishing_methods', 'fishing_zones', 'main_fishing_zone',
      'photo_url', 'photo_boat_1', 'photo_boat_2', 'photo_dock_sale',
      'instagram_url', 'facebook_url', 'website_url', 'bio'
    ];

    const filteredUpdate = Object.fromEntries(
      Object.entries(updateData).filter(([key]) => allowedFields.includes(key))
    );

    // Mettre à jour le profil
    const { error: updateError } = await supabaseClient
      .from("fishermen")
      .update({
        ...filteredUpdate,
        updated_at: new Date().toISOString()
      })
      .eq("id", tokenData.fisherman_id);

    if (updateError) throw new Error(`Erreur mise à jour: ${updateError.message}`);

    // Calculer les champs modifiés
    const fieldsChanged = Object.keys(filteredUpdate).filter(
      key => JSON.stringify(oldData[key]) !== JSON.stringify(filteredUpdate[key])
    );

    // Logger les modifications pour audit
    await supabaseClient
      .from("profile_edit_logs")
      .insert({
        fisherman_id: tokenData.fisherman_id,
        token_id: tokenData.id,
        old_data: oldData,
        new_data: { ...oldData, ...filteredUpdate },
        fields_changed: fieldsChanged,
        ip_address: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
        user_agent: req.headers.get("user-agent")
      });

    // Marquer le token comme utilisé
    await supabaseClient
      .from("secure_edit_tokens")
      .update({ used_at: new Date().toISOString() })
      .eq("id", tokenData.id);

    // Résoudre la demande support associée si elle existe
    if (tokenData.support_request_id) {
      await supabaseClient
        .from("support_requests")
        .update({ 
          status: "resolved",
          updated_at: new Date().toISOString()
        })
        .eq("id", tokenData.support_request_id);
    }

    console.log(`Profil mis à jour pour pêcheur ${tokenData.fisherman_id}, ${fieldsChanged.length} champs modifiés`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Votre profil a été mis à jour avec succès",
        fieldsChanged
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("Erreur submit-secure-profile-edit:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
};

serve(handler);
