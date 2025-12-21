import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { handleCors, getCorsHeaders, jsonResponse, errorResponse } from "../_shared/cors.ts";

// Rate limiting configuration
const RATE_LIMIT = 10; // max requests
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

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const origin = req.headers.get("Origin");

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Rate limiting - use IP address for unauthenticated endpoint
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const { allowed, remaining } = await checkRateLimit(supabaseClient, clientIP, 'validate-secure-token');
    if (!allowed) {
      console.log(`[VALIDATE-TOKEN] Rate limit exceeded for IP ${clientIP}`);
      return new Response(
        JSON.stringify({ valid: false, error: 'Trop de requêtes. Veuillez patienter.' }),
        {
          headers: { 
            ...getCorsHeaders(origin), 
            'Content-Type': 'application/json',
            'X-RateLimit-Remaining': '0',
            'Retry-After': '60'
          },
          status: 429,
        }
      );
    }

    const { token } = await req.json();
    if (!token) throw new Error("Token manquant");

    // Vérifier le token
    const { data: tokenData, error: tokenError } = await supabaseClient
      .from("secure_edit_tokens")
      .select(`
        *,
        fishermen (
          id,
          boat_name,
          boat_registration,
          siret,
          company_name,
          description,
          phone,
          email,
          fishing_methods,
          fishing_zones,
          main_fishing_zone,
          photo_url,
          photo_boat_1,
          photo_boat_2,
          photo_dock_sale,
          instagram_url,
          facebook_url,
          website_url,
          bio
        )
      `)
      .eq("token", token)
      .single();

    if (tokenError || !tokenData) {
      return jsonResponse({ valid: false, error: "Token invalide ou expiré" }, 400, origin);
    }

    // Vérifier expiration
    const now = new Date();
    const expiresAt = new Date(tokenData.expires_at);
    if (now > expiresAt) {
      return jsonResponse({ 
        valid: false, 
        error: "Ce lien a expiré. Veuillez contacter le support pour obtenir un nouveau lien." 
      }, 400, origin);
    }

    // Vérifier si déjà utilisé
    if (tokenData.used_at) {
      return jsonResponse({ 
        valid: false, 
        error: "Ce lien a déjà été utilisé. Il ne peut être utilisé qu'une seule fois." 
      }, 400, origin);
    }

    // Vérifier si révoqué
    if (tokenData.revoked_at) {
      return jsonResponse({ 
        valid: false, 
        error: "Ce lien a été révoqué. Veuillez contacter le support." 
      }, 400, origin);
    }

    // Token valide, retourner les données du pêcheur
    return jsonResponse({ 
      valid: true, 
      fisherman: tokenData.fishermen,
      tokenId: tokenData.id,
      expiresAt: tokenData.expires_at
    }, 200, origin);
  } catch (error: any) {
    console.error("Erreur validate-secure-token:", error);
    return errorResponse(error.message, 500, origin);
  }
};

serve(handler);
