import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InquiryConfirmationRequest {
  email: string;
  message: string;
  type: string;
}

const getTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    'launch_notification': 'Notification de lancement',
    'question': 'Question générale',
    'fisherman_interest': 'Intérêt pêcheur',
    'partnership': 'Partenariat / Presse',
    'other': 'Autre',
  };
  return labels[type] || type;
};

const handler = async (req: Request): Promise<Response> => {
  console.log("send-inquiry-confirmation: Request received");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, message, type }: InquiryConfirmationRequest = await req.json();

    console.log(`send-inquiry-confirmation: Sending to ${email}, type: ${type}`);

    if (!email) {
      throw new Error("Email is required");
    }

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const typeLabel = getTypeLabel(type);
    const messagePreview = message ? (message.length > 200 ? message.substring(0, 200) + '...' : message) : 'Aucun message';

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a2e; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #0ea5e9; }
          .logo { font-size: 28px; font-weight: bold; color: #0ea5e9; }
          .content { padding: 30px 0; }
          .recap { background: #f0f9ff; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .recap-title { font-weight: bold; color: #0369a1; margin-bottom: 10px; }
          .recap-item { margin: 8px 0; }
          .recap-label { color: #64748b; }
          .footer { text-align: center; padding: 20px 0; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🐟 QuaiDirect</div>
          </div>
          <div class="content">
            <h2>Bonjour,</h2>
            <p>Merci d'avoir contacté QuaiDirect ! 🐟</p>
            <p>Nous avons bien reçu votre message et notre équipe vous répondra dans les plus brefs délais.</p>
            
            <div class="recap">
              <div class="recap-title">📋 Récapitulatif de votre demande</div>
              <div class="recap-item">
                <span class="recap-label">Type :</span> ${typeLabel}
              </div>
              <div class="recap-item">
                <span class="recap-label">Message :</span> ${messagePreview}
              </div>
            </div>

            <p>À très bientôt sur QuaiDirect !</p>
            <p><strong>L'équipe QuaiDirect</strong></p>
          </div>
          <div class="footer">
            <p>Du poisson frais, en direct des pêcheurs de votre région</p>
            <p><a href="https://quaidirect.fr">quaidirect.fr</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "QuaiDirect <contact@quaidirect.fr>",
        to: [email],
        subject: "✅ QuaiDirect a bien reçu votre message",
        html: emailHtml,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("send-inquiry-confirmation: Resend error:", errorText);
      throw new Error(`Failed to send email: ${errorText}`);
    }

    const emailResponse = await response.json();
    console.log("send-inquiry-confirmation: Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("send-inquiry-confirmation: Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
