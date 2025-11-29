import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: "Token invalide ou expiré" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Vérifier expiration
    const now = new Date();
    const expiresAt = new Date(tokenData.expires_at);
    if (now > expiresAt) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: "Ce lien a expiré. Veuillez contacter le support pour obtenir un nouveau lien." 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Vérifier si déjà utilisé
    if (tokenData.used_at) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: "Ce lien a déjà été utilisé. Il ne peut être utilisé qu'une seule fois." 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Vérifier si révoqué
    if (tokenData.revoked_at) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: "Ce lien a été révoqué. Veuillez contacter le support." 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Token valide, retourner les données du pêcheur
    return new Response(
      JSON.stringify({ 
        valid: true, 
        fisherman: tokenData.fishermen,
        tokenId: tokenData.id,
        expiresAt: tokenData.expires_at
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("Erreur validate-secure-token:", error);
    return new Response(
      JSON.stringify({ valid: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
};

serve(handler);
