import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PublicMessagePayload {
  fishermanUserId: string;
  fishermanId: string;
  senderName: string;
  senderEmail: string;
  message: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: PublicMessagePayload = await req.json();
    const { fishermanUserId, fishermanId, senderName, senderEmail, message } = payload;

    // Validate required fields
    if (!fishermanUserId || !fishermanId || !senderName || !senderEmail || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(senderEmail)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Sending public message notification to fisherman:", fishermanId);

    // Insert message into database using service role (bypasses RLS)
    const { error: insertError } = await supabase.from("messages").insert({
      sender_id: fishermanUserId, // Use fisherman as placeholder since visitor has no user_id
      recipient_id: fishermanUserId,
      sender_email: senderEmail,
      sender_name: senderName,
      subject: `Message de ${senderName} via QuaiDirect`,
      body: message,
      message_type: "public_inquiry",
    });

    if (insertError) {
      console.error("Error inserting message:", insertError);
      throw new Error("Could not save message");
    }

    console.log("Message saved to database");

    // Get fisherman email from auth.users
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(fishermanUserId);
    
    if (authError || !authUser?.user?.email) {
      console.error("Error getting fisherman email:", authError);
      throw new Error("Could not get fisherman email");
    }

    const fishermanEmail = authUser.user.email;

    // Get fisherman boat name
    const { data: fisherman } = await supabase
      .from("fishermen")
      .select("boat_name")
      .eq("id", fishermanId)
      .single();

    const boatName = fisherman?.boat_name || "Votre bateau";

    // Send email to fisherman
    const { error: emailError } = await resend.emails.send({
      from: "QuaiDirect <notifications@quaidirect.fr>",
      reply_to: senderEmail,
      to: [fishermanEmail],
      subject: `Nouveau message de ${senderName} sur QuaiDirect`,
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
            .sender-info { background: #e0f2fe; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
            .cta-button { display: inline-block; background: #0077B6; color: white !important; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🐟 Nouveau message</h1>
              <p>Un visiteur vous a contacté via QuaiDirect</p>
            </div>
            <div class="content">
              <div class="sender-info">
                <strong>De :</strong> ${senderName}<br>
                <strong>Email :</strong> <a href="mailto:${senderEmail}">${senderEmail}</a>
              </div>
              
              <h3>Message :</h3>
              <div class="message-box">
                ${message.replace(/\n/g, "<br>")}
              </div>
              
              <p>Pour répondre à ce message, vous pouvez :</p>
              <ul>
                <li>Répondre directement à cet email (l'email de ${senderName} est en copie)</li>
                <li>Ou utiliser votre messagerie QuaiDirect</li>
              </ul>
              
              <p style="text-align: center; margin-top: 30px;">
                <a href="${Deno.env.get("SITE_URL") || "https://quaidirect.fr"}/pecheur/dashboard" class="cta-button">
                  Voir ma messagerie
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
      console.error("Error sending email:", emailError);
      throw emailError;
    }

    console.log("Email sent successfully to:", fishermanEmail);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-public-message-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
