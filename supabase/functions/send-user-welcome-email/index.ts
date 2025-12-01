import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const resendModule = await import("https://esm.sh/resend@2.0.0");
const Resend = resendModule.Resend || resendModule.default?.Resend || resendModule.default;

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UserWelcomeRequest {
  email: string;
  name?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name }: UserWelcomeRequest = await req.json();

    console.log("Sending welcome email to:", email);

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
              <p style="font-size: 18px; margin-top: 0;">Bonjour${name ? ` ${name}` : ''} 👋</p>
              
              <p>Merci d'avoir rejoint <strong>QuaiDirect</strong>, la plateforme qui connecte directement les marins-pêcheurs artisanaux avec leurs clients.</p>
              
              <h3 style="color: #0EA5E9; margin-top: 30px;">🐟 Que pouvez-vous faire maintenant ?</h3>
              
              <div class="feature">Découvrir les arrivages de poissons frais près de chez vous</div>
              <div class="feature">Commander des paniers de poisson ultra-frais (Découverte, Famille, Gourmet)</div>
              <div class="feature">Suivre vos pêcheurs préférés et leurs points de vente</div>
              <div class="feature">Soutenir la pêche artisanale et le circuit court</div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://quaidirect.fr" class="button">🌊 Découvrir les arrivages</a>
              </div>
              
              <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <strong>Envie d'aller plus loin ?</strong><br>
                Passez Premium pour recevoir des alertes en priorité sur vos espèces favorites et soutenir activement les pêcheurs artisanaux.
              </p>
            </div>
            <div class="footer">
              <p>🎣 QuaiDirect - Du bateau à votre assiette<br>
              <a href="https://quaidirect.fr" style="color: #0EA5E9;">quaidirect.fr</a></p>
              <p style="font-size: 12px; color: #9ca3af;">
                Questions ? Contactez-nous : <a href="mailto:support@quaidirect.fr" style="color: #0EA5E9;">support@quaidirect.fr</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Welcome email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-user-welcome-email function:", error);
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
