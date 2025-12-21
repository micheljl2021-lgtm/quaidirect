import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://quaidirect.fr",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

interface PremiumWelcomeRequest {
  userEmail: string;
  userName?: string;
  plan: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify internal secret for webhook calls
    const internalSecret = req.headers.get('x-internal-secret');
    const expectedSecret = Deno.env.get('INTERNAL_FUNCTION_SECRET');
    
    if (!expectedSecret || internalSecret !== expectedSecret) {
      console.error('[PREMIUM-WELCOME] Unauthorized: Invalid or missing internal secret');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { userEmail, userName, plan }: PremiumWelcomeRequest = await req.json();

    const planLabel = plan.includes('annual') ? 'Annuel' : 'Mensuel';
    const planType = plan.includes('plus') ? 'Premium+' : 'Premium';

    const emailResponse = await resend.emails.send({
      from: "QuaiDirect <support@quaidirect.fr>",
      to: [userEmail],
      subject: `Bienvenue dans QuaiDirect ${planType} !`,
      html: `
        <h1>Bienvenue ${userName ? escapeHtml(userName) : ''} !</h1>
        <p>Votre abonnement <strong>${escapeHtml(planType)} ${escapeHtml(planLabel)}</strong> est maintenant actif.</p>
        
        <h2>🎉 Vos avantages Premium :</h2>
        <ul>
          <li>✅ Soutenez directement les pêcheurs locaux</li>
          <li>✅ Alertes ciblées sur vos poissons favoris</li>
          <li>✅ Notifications prioritaires par email</li>
          <li>✅ Badge Premium visible</li>
          ${planType === 'Premium+' ? '<li>✅ Notifications SMS incluses</li>' : ''}
        </ul>

        <h2>📍 Prochaines étapes :</h2>
        <ol>
          <li>Configurez vos préférences (ports favoris, espèces préférées)</li>
          <li>Activez les notifications pour ne rien manquer</li>
          <li>Explorez les arrivages disponibles</li>
        </ol>

        <p style="margin-top: 30px;">
          <a href="${Deno.env.get('SITE_URL') || 'https://quaidirect.fr'}/premium/reglages" 
             style="background: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Configurer mes préférences
          </a>
        </p>

        <p style="margin-top: 30px; color: #666;">
          Merci de soutenir la pêche locale et artisanale !<br>
          L'équipe QuaiDirect
        </p>
      `,
    });

    console.log("Premium welcome email sent:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-premium-welcome-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
