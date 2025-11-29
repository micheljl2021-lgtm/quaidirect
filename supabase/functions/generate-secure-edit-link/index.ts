import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GenerateLinkRequest {
  supportRequestId: string;
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

    // Vérifier authentification admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Non authentifié");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Utilisateur non trouvé");

    // Vérifier rôle admin
    const { data: roleData } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) throw new Error("Accès admin requis");

    const { supportRequestId }: GenerateLinkRequest = await req.json();

    // Récupérer la demande et le pêcheur
    const { data: supportRequest, error: requestError } = await supabaseClient
      .from("support_requests")
      .select(`
        *,
        fishermen (
          id,
          user_id,
          boat_name,
          email,
          boat_registration,
          siret,
          company_name,
          description,
          phone,
          fishing_methods,
          fishing_zones,
          main_fishing_zone,
          photo_url,
          photo_boat_1,
          photo_boat_2
        )
      `)
      .eq("id", supportRequestId)
      .single();

    if (requestError || !supportRequest) {
      throw new Error("Demande non trouvée");
    }

    const fisherman = supportRequest.fishermen as any;
    if (!fisherman) throw new Error("Pêcheur non trouvé");

    // Vérifier le type de demande
    if (supportRequest.request_type_code !== "EDIT_PROFILE_AFTER_STRIPE") {
      throw new Error("Type de demande incorrect pour cette action");
    }

    // Révoquer les anciens tokens du même pêcheur (idempotent)
    await supabaseClient
      .from("secure_edit_tokens")
      .update({ revoked_at: new Date().toISOString() })
      .eq("fisherman_id", fisherman.id)
      .is("used_at", null)
      .is("revoked_at", null);

    // Générer un token cryptographique sécurisé (32 bytes = 256 bits)
    const tokenBytes = new Uint8Array(32);
    crypto.getRandomValues(tokenBytes);
    const secureToken = Array.from(tokenBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Créer le token avec expiration 24h
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const { data: tokenData, error: tokenError } = await supabaseClient
      .from("secure_edit_tokens")
      .insert({
        token: secureToken,
        fisherman_id: fisherman.id,
        support_request_id: supportRequestId,
        token_type: "PROFILE_EDIT",
        expires_at: expiresAt.toISOString(),
        sent_via: "email",
        sent_at: new Date().toISOString()
      })
      .select()
      .single();

    if (tokenError) throw new Error(`Erreur création token: ${tokenError.message}`);

    // Construire l'URL du lien sécurisé
    const origin = req.headers.get("origin") || "https://quaidirect.fr";
    const secureLink = `${origin}/secure/profile/edit?token=${secureToken}`;

    // Envoyer l'email via Resend
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    
    const emailHtml = `
      <h1>Modification de votre profil QuaiDirect</h1>
      <p>Bonjour,</p>
      <p>Vous avez demandé à modifier votre profil professionnel sur QuaiDirect.</p>
      <p>Cliquez sur le lien ci-dessous pour accéder au formulaire de modification sécurisé :</p>
      <p><a href="${secureLink}" style="display: inline-block; padding: 12px 24px; background-color: #0066cc; color: white; text-decoration: none; border-radius: 4px;">Modifier mon profil</a></p>
      <p><strong>Important :</strong> Ce lien est valide pendant 24 heures et ne peut être utilisé qu'une seule fois.</p>
      <p>Si vous n'avez pas fait cette demande, ignorez cet email.</p>
      <p>Cordialement,<br>L'équipe QuaiDirect</p>
    `;

    await resend.emails.send({
      from: "QuaiDirect <support@quaidirect.fr>",
      to: [fisherman.email],
      subject: "Lien de modification de votre profil QuaiDirect",
      html: emailHtml,
    });

    // Mettre à jour le statut de la demande
    await supabaseClient
      .from("support_requests")
      .update({ 
        status: "link_sent",
        updated_at: new Date().toISOString()
      })
      .eq("id", supportRequestId);

    console.log(`Lien sécurisé envoyé au pêcheur ${fisherman.id} (${fisherman.email})`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Lien de modification envoyé avec succès",
        expiresAt: expiresAt.toISOString()
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("Erreur generate-secure-edit-link:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
};

serve(handler);
