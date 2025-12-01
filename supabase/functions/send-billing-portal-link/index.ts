import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://quaidirect.fr",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BillingLinkRequest {
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

    const { supportRequestId }: BillingLinkRequest = await req.json();

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
          onboarding_payment_id
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
    if (supportRequest.request_type_code !== "STRIPE_BILLING_UPDATE") {
      throw new Error("Type de demande incorrect pour cette action");
    }

    // Initialiser Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Récupérer le customer Stripe via l'email
    const customers = await stripe.customers.list({ 
      email: fisherman.email, 
      limit: 1 
    });

    if (customers.data.length === 0) {
      throw new Error("Aucun compte Stripe trouvé pour ce pêcheur");
    }

    const customerId = customers.data[0].id;

    // Créer une session Customer Portal
    const origin = req.headers.get("origin") || "https://quaidirect.fr";
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/dashboard/pecheur`,
    });

    // Envoyer l'email avec le lien
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    
    const emailHtml = `
      <h1>Accès à votre portail de facturation</h1>
      <p>Bonjour,</p>
      <p>Vous avez demandé à accéder à votre portail de facturation Stripe.</p>
      <p>Cliquez sur le lien ci-dessous pour gérer vos moyens de paiement, consulter vos factures et mettre à jour vos informations de facturation :</p>
      <p><a href="${portalSession.url}" style="display: inline-block; padding: 12px 24px; background-color: #0066cc; color: white; text-decoration: none; border-radius: 4px;">Accéder au portail de facturation</a></p>
      <p><strong>Important :</strong> Ce lien expire dans quelques heures.</p>
      <p>Si vous n'avez pas fait cette demande, ignorez cet email.</p>
      <p>Cordialement,<br>L'équipe QuaiDirect</p>
    `;

    await resend.emails.send({
      from: "QuaiDirect <support@quaidirect.fr>",
      to: [fisherman.email],
      subject: "Accès à votre portail de facturation QuaiDirect",
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

    console.log(`Lien portail Stripe envoyé au pêcheur ${fisherman.id} (${fisherman.email})`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Lien du portail de facturation envoyé avec succès"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("Erreur send-billing-portal-link:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
};

serve(handler);
