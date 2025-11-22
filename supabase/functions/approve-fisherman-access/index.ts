import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

serve(async (req) => {
  // Preflight CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Client admin (service role)
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // Lecture du body
    const body = await req.json().catch(() => null);
    const email = body?.email;

    if (!email || typeof email !== "string") {
      return new Response(JSON.stringify({ error: "Email requis" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const emailLower = email.toLowerCase().trim();
    console.log(`Approving free access for ${emailLower}`);

    // 1) On essaye de trouver l'utilisateur par email
    const { data: usersPage, error: searchError } = await supabaseAdmin.auth.admin.listUsers();

    if (searchError) {
      console.error("Error searching users:", searchError);
      throw searchError;
    }

    let targetUser = usersPage?.users?.find((u) => u.email?.toLowerCase() === emailLower);

    // 2) Si l'utilisateur n'existe pas, on le crée
    if (!targetUser) {
      console.log(`User ${emailLower} not found, creating new user via admin API...`);
      const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: emailLower,
        email_confirm: true,
      });

      if (createError || !created?.user) {
        console.error("Error creating user:", createError);
        return new Response(JSON.stringify({ error: "Impossible de créer l'utilisateur" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      targetUser = created.user;
    }

    // 3) Vérifier si le pêcheur existe déjà
    const { data: existingFisherman, error: checkError } = await supabaseAdmin
      .from("fishermen")
      .select("id, onboarding_payment_status")
      .eq("user_id", targetUser.id)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking existing fisherman:", checkError);
      throw checkError;
    }

    if (existingFisherman) {
      return new Response(
        JSON.stringify({
          error: "Cet utilisateur a déjà un profil pêcheur",
          status: existingFisherman.onboarding_payment_status,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 4) Créer le profil pêcheur en "free"
    // Génération d'identifiants temporaires uniques
    const tempBoatReg = `TEMP-${targetUser.id.substring(0, 8).toUpperCase()}`;
    const tempSiret = `TEMP${targetUser.id.replace(/-/g, '').substring(0, 14)}`;
    
    const { data: newFisherman, error: insertError } = await supabaseAdmin
      .from("fishermen")
      .insert({
        user_id: targetUser.id,
        boat_name: "À compléter",
        boat_registration: tempBoatReg,
        siret: tempSiret,
        onboarding_payment_status: "free",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating fisherman:", insertError);
      throw insertError;
    }

    console.log(`✅ Free access approved for ${emailLower}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Accès pêcheur gratuit approuvé pour ${emailLower}`,
        fisherman: newFisherman,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    console.error("Error in approve-fisherman-access:", error);
    return new Response(JSON.stringify({ error: error.message || "Erreur inconnue" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
