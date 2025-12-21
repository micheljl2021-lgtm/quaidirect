import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { getCorsHeaders, handleCors } from "../_shared/cors.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface CorrectionRequestPayload {
  dropId: string;
  fishermanUserId: string;
  correctionMessage: string;
  adminUserId: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight with origin validation
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const origin = req.headers.get('Origin');

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { dropId, fishermanUserId, correctionMessage, adminUserId }: CorrectionRequestPayload = await req.json();

    console.log("Processing correction request for drop:", dropId);

    // Get fisherman details
    const { data: fisherman, error: fishermanError } = await supabaseAdmin
      .from("fishermen")
      .select("boat_name, email, user_id")
      .eq("user_id", fishermanUserId)
      .single();

    if (fishermanError || !fisherman) {
      console.error("Error fetching fisherman:", fishermanError);
      throw new Error("Fisherman not found");
    }

    // Get fisherman's email from auth if not in fishermen table
    let recipientEmail = fisherman.email;
    if (!recipientEmail) {
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(fishermanUserId);
      if (authError) {
        console.error("Error fetching auth user:", authError);
        throw new Error("Could not find fisherman email");
      }
      recipientEmail = authUser.user?.email;
    }

    if (!recipientEmail) {
      throw new Error("No email found for fisherman");
    }

    // Get drop details
    const { data: drop, error: dropError } = await supabaseAdmin
      .from("drops")
      .select(`
        id,
        eta_at,
        sale_start_time,
        ports(name),
        fisherman_sale_points(label)
      `)
      .eq("id", dropId)
      .single();

    if (dropError) {
      console.error("Error fetching drop:", dropError);
    }

    // Handle the returned data - it may be an array or single object
    const salePointLabel = drop?.fisherman_sale_points 
      ? (Array.isArray(drop.fisherman_sale_points) 
        ? drop.fisherman_sale_points[0]?.label 
        : (drop.fisherman_sale_points as any)?.label)
      : null;
    
    const portName = drop?.ports 
      ? (Array.isArray(drop.ports) 
        ? drop.ports[0]?.name 
        : (drop.ports as any)?.name)
      : null;

    const dropLocation = salePointLabel || portName || "Non spécifié";
    const dropDate = drop?.eta_at ? new Date(drop.eta_at).toLocaleDateString('fr-FR') : "Date non spécifiée";

    // Create internal message
    const { error: messageError } = await supabaseAdmin
      .from("messages")
      .insert({
        sender_id: adminUserId,
        recipient_id: fishermanUserId,
        subject: `Demande de correction - Arrivage du ${dropDate}`,
        body: correctionMessage,
        message_type: "correction_request",
        related_drop_id: dropId,
      });

    if (messageError) {
      console.error("Error creating internal message:", messageError);
    }

    // Send email notification with dynamic SITE_URL
    const siteUrl = Deno.env.get("SITE_URL") || "https://quaidirect.fr";
    
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #0ea5e9, #0284c7); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
    .content { background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; }
    .message-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .button { display: inline-block; background: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 20px; }
    .footer { text-align: center; padding: 20px; color: #64748b; font-size: 14px; }
    .info { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ Demande de correction</h1>
      <p>Un administrateur a demandé des modifications sur votre arrivage</p>
    </div>
    <div class="content">
      <p>Bonjour ${fisherman.boat_name || "Capitaine"},</p>
      
      <div class="info">
        <strong>📍 Arrivage concerné :</strong><br>
        Lieu : ${dropLocation}<br>
        Date : ${dropDate}
      </div>
      
      <div class="message-box">
        <strong>📝 Message de l'administrateur :</strong><br><br>
        ${correctionMessage.replace(/\n/g, '<br>')}
      </div>
      
      <p><strong>Important :</strong> Votre arrivage a été temporairement dépublié et ne sera plus visible par les clients tant que les corrections demandées n'auront pas été apportées.</p>
      
      <p>Rendez-vous sur votre tableau de bord pour modifier votre arrivage :</p>
      
      <a href="${siteUrl}/pecheur/modifier-arrivage/${dropId}" class="button">Modifier mon arrivage</a>
      
      <p style="margin-top: 20px;">Vous avez également un nouveau message dans votre messagerie interne.</p>
    </div>
    <div class="footer">
      <p>QuaiDirect - Vente directe de poisson frais</p>
      <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
    </div>
  </div>
</body>
</html>
    `;

    const { error: emailError } = await resend.emails.send({
      from: "QuaiDirect <notifications@quaidirect.fr>",
      to: [recipientEmail],
      subject: `⚠️ Demande de correction - Arrivage du ${dropDate}`,
      html: emailHtml,
    });

    if (emailError) {
      console.error("Error sending email:", emailError);
      // Don't throw - internal message was created, email is secondary
    } else {
      console.log("Correction request email sent successfully to:", recipientEmail);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Correction request sent successfully",
        emailSent: !emailError 
      }),
      { 
        status: 200, 
        headers: { ...getCorsHeaders(origin), "Content-Type": "application/json" } 
      }
    );
  } catch (error: any) {
    console.error("Error in send-correction-request:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...getCorsHeaders(origin), "Content-Type": "application/json" } 
      }
    );
  }
});
