import { Resend } from "https://esm.sh/resend@4.0.0";
import { getCorsHeaders, handleCors } from "../_shared/cors.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Escape HTML to prevent XSS attacks
function escapeHtml(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

interface UserWelcomeRequest {
  email: string;
  name?: string;
}

Deno.serve(async (req: Request): Promise<Response> => {
  console.log("[WELCOME-EMAIL] Function invoked");
  
  // Handle CORS preflight with origin validation
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const origin = req.headers.get('Origin');

  try {
    const body = await req.json();
    console.log("[WELCOME-EMAIL] Request body:", JSON.stringify(body));
    
    const { email, name }: UserWelcomeRequest = body;

    if (!email) {
      console.error("[WELCOME-EMAIL] Email is missing from request");
      throw new Error("Email is required");
    }

    console.log("[WELCOME-EMAIL] Sending welcome email to:", email);
    console.log("[WELCOME-EMAIL] RESEND_API_KEY configured:", !!Deno.env.get("RESEND_API_KEY"));

    const siteUrl = Deno.env.get("SITE_URL") || "https://quaidirect.fr";

    const emailResponse = await resend.emails.send({
      from: "QuaiDirect <support@quaidirect.fr>",
      to: [email],
      subject: "Bienvenue sur QuaiDirect ! 🎣",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
            .button { display: inline-block; background: #0EA5E9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
            .feature { margin: 15px 0; padding-left: 25px; position: relative; }
            .feature:before { content: "✓"; position: absolute; left: 0; color: #0EA5E9; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">⚓ Bienvenue sur QuaiDirect !</h1>
            </div>
            <div class="content">
              <p style="font-size: 18px; margin-top: 0;">Bonjour${name ? ` ${escapeHtml(name)}` : ''} 👋</p>
              
              <p>Merci d'avoir rejoint <strong>QuaiDirect</strong>, la plateforme qui connecte directement les marins-pêcheurs artisanaux avec leurs clients.</p>
              
              <h3 style="color: #0EA5E9; margin-top: 30px;">🐟 Que pouvez-vous faire maintenant ?</h3>
              
              <div class="feature">Découvrir les arrivages de poissons frais près de chez vous</div>
              <div class="feature">Commander des paniers de poisson ultra-frais (Découverte, Famille, Gourmet)</div>
              <div class="feature">Suivre vos pêcheurs préférés et leurs points de vente</div>
              <div class="feature">Soutenir la pêche artisanale et le circuit court</div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${siteUrl}" class="button">🌊 Découvrir les arrivages</a>
              </div>
              
              <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <strong>Envie d'aller plus loin ?</strong><br>
                Passez Premium pour recevoir des alertes en priorité sur vos espèces favorites et soutenir activement les pêcheurs artisanaux.
              </p>
            </div>
            <div class="footer">
              <p>🎣 QuaiDirect - Du bateau à votre assiette<br>
              <a href="${siteUrl}" style="color: #0EA5E9;">quaidirect.fr</a></p>
              <p style="font-size: 12px; color: #9ca3af;">
                Questions ? Contactez-nous : <a href="mailto:support@quaidirect.fr" style="color: #0EA5E9;">support@quaidirect.fr</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("[WELCOME-EMAIL] Email sent successfully:", JSON.stringify(emailResponse));

    return new Response(JSON.stringify({ 
      success: true, 
      emailResponse,
      message: "Welcome email sent successfully"
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...getCorsHeaders(origin),
      },
    });
  } catch (error: any) {
    console.error("[WELCOME-EMAIL] Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    const origin = req.headers.get('Origin');
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        details: error.stack
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...getCorsHeaders(origin) },
      }
    );
  }
});
