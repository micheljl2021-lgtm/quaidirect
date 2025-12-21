import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { getCorsHeaders, handleCors } from "../_shared/cors.ts";

const SITE_URL = Deno.env.get('SITE_URL') || 'https://quaidirect.fr';

interface ReplyPayload {
  originalMessageId: string;
  replyBody: string;
  replierUserId: string;
}

serve(async (req: Request) => {
  const origin = req.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: ReplyPayload = await req.json();
    const { originalMessageId, replyBody, replierUserId } = payload;

    console.log("Processing reply to message:", originalMessageId);

    // Get original message
    const { data: originalMessage, error: msgError } = await supabase
      .from("messages")
      .select("*")
      .eq("id", originalMessageId)
      .single();

    if (msgError || !originalMessage) {
      console.error("Error getting original message:", msgError);
      throw new Error("Message original introuvable");
    }

    // Check if original message was from a public visitor (has sender_email)
    if (!originalMessage.sender_email) {
      console.log("No sender_email, skipping email notification");
      return new Response(
        JSON.stringify({ success: true, emailSent: false, reason: "no_sender_email" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get replier info (fisherman)
    const { data: fisherman } = await supabase
      .from("fishermen")
      .select("boat_name, company_name")
      .eq("user_id", replierUserId)
      .single();

    const replierName = fisherman?.boat_name || fisherman?.company_name || "Un pêcheur QuaiDirect";

    // Get replier email for reply-to
    const { data: authUser } = await supabase.auth.admin.getUserById(replierUserId);
    const replierEmail = authUser?.user?.email;

    // Send email to original sender
    const { error: emailError } = await resend.emails.send({
      from: "QuaiDirect <notifications@quaidirect.fr>",
      replyTo: replierEmail || "contact@quaidirect.fr",
      to: [originalMessage.sender_email],
      subject: `Réponse de ${replierName} sur QuaiDirect`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #0077B6 0%, #00B4D8 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .message-box { background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #0077B6; margin: 20px 0; }
            .original-message { background: #f3f4f6; padding: 15px; border-radius: 8px; margin-top: 20px; font-size: 14px; color: #666; }
            .cta-button { display: inline-block; background: #0077B6; color: white !important; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🐟 Réponse de ${replierName}</h1>
              <p>Le pêcheur vous a répondu sur QuaiDirect</p>
            </div>
            <div class="content">
              <p>Bonjour ${originalMessage.sender_name || ""},</p>
              
              <p><strong>${replierName}</strong> vous a répondu :</p>
              
              <div class="message-box">
                ${replyBody.replace(/\n/g, "<br>")}
              </div>
              
              <p>Vous pouvez répondre directement à cet email pour continuer la conversation.</p>
              
              <div class="original-message">
                <strong>Votre message original :</strong><br>
                ${originalMessage.body.replace(/\n/g, "<br>")}
              </div>
              
              <p style="text-align: center; margin-top: 30px;">
                <a href="${SITE_URL}/arrivages" class="cta-button">
                  Voir les arrivages disponibles
                </a>
              </p>
              
              <div class="footer">
                <p>Cet email a été envoyé par QuaiDirect<br>
                La plateforme de vente directe de poisson frais</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (emailError) {
      console.error("Error sending reply email:", emailError);
      throw emailError;
    }

    console.log("Reply email sent successfully to:", originalMessage.sender_email);

    return new Response(
      JSON.stringify({ success: true, emailSent: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-message-reply:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
