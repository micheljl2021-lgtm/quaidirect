import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { getCorsHeaders, handleCors } from '../_shared/cors.ts';

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

interface TrialEndingRequest {
  userEmail: string;
  boatName?: string;
  plan: string;
  trialEndDate: string;
  customerPortalUrl: string;
}

const handler = async (req: Request): Promise<Response> => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const origin = req.headers.get('origin');

  try {
    // Verify internal secret for webhook calls
    const internalSecret = req.headers.get('x-internal-secret');
    const expectedSecret = Deno.env.get('INTERNAL_FUNCTION_SECRET');
    
    if (!expectedSecret || internalSecret !== expectedSecret) {
      console.error('[TRIAL-ENDING] Unauthorized: Invalid or missing internal secret');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
      });
    }

    const { userEmail, boatName, plan, trialEndDate, customerPortalUrl }: TrialEndingRequest = await req.json();

    const planLabel = plan === 'pro' ? 'Pro (199€/an)' : 'Basic (150€/an)';
    const amount = plan === 'pro' ? '199€' : '150€';

    const emailResponse = await resend.emails.send({
      from: "QuaiDirect <support@quaidirect.fr>",
      to: [userEmail],
      subject: `⏰ Votre essai QuaiDirect se termine dans 3 jours`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #0066cc;">⏰ Votre essai gratuit se termine bientôt ${boatName ? `- ${escapeHtml(boatName)}` : ''}</h1>
          
          <div style="background: #fff9e6; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <p style="margin: 0; font-size: 18px; font-weight: bold;">
              Votre essai gratuit se termine le ${new Date(trialEndDate).toLocaleDateString('fr-FR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
            <p style="margin: 10px 0 0 0; color: #666;">
              Plan actuel : <strong>${planLabel}</strong>
            </p>
          </div>

          <h2 style="color: #333;">📋 Que va-t-il se passer ?</h2>
          
          <div style="background: #f8f9fa; padding: 16px; border-radius: 6px; margin: 15px 0;">
            <p style="margin: 0; line-height: 1.6;">
              <strong>Si vous ne faites rien :</strong><br>
              Votre abonnement sera automatiquement activé et facturé <strong>${amount}</strong> pour votre première année.
              Vous pourrez continuer à utiliser tous vos avantages sans interruption.
            </p>
          </div>

          <div style="background: #f8f9fa; padding: 16px; border-radius: 6px; margin: 15px 0;">
            <p style="margin: 0; line-height: 1.6;">
              <strong>Si vous souhaitez annuler :</strong><br>
              Vous pouvez annuler votre abonnement avant la fin de l'essai via votre espace client Stripe.
              Aucun montant ne vous sera facturé.
            </p>
          </div>

          <h2 style="color: #333;">💡 Rappel de vos avantages</h2>
          <ul style="line-height: 1.8;">
            <li>✅ Emails illimités à vos clients</li>
            <li>✅ Partage WhatsApp instantané</li>
            <li>✅ IA pour générer vos textes et descriptions</li>
            ${plan === 'pro' ? `
            <li>✅ IA avancée (prix, météo, marée)</li>
            <li>✅ Statistiques et estimation CA</li>
            <li>✅ Multi-points de vente</li>
            <li>✅ Support prioritaire</li>
            ` : ''}
          </ul>

          <div style="margin: 30px 0; text-align: center;">
            <a href="${customerPortalUrl}" 
               style="background: #0066cc; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; margin: 10px;">
              Continuer mon abonnement
            </a>
            <br>
            <a href="${customerPortalUrl}" 
               style="background: #6c757d; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; margin: 10px;">
              Gérer mon abonnement
            </a>
          </div>

          <div style="background: #e7f3ff; padding: 16px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px;">
              <strong>❓ Des questions ?</strong><br>
              Notre équipe est là pour vous aider ! Répondez à cet email ou contactez-nous à <a href="mailto:support@quaidirect.fr">support@quaidirect.fr</a>
            </p>
          </div>

          <p style="margin-top: 30px; color: #666; font-size: 14px;">
            Merci de votre confiance,<br>
            <strong>L'équipe QuaiDirect</strong>
          </p>
        </div>
      `,
    });

    console.log("[TRIAL-ENDING] Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...getCorsHeaders(origin) },
    });
  } catch (error: any) {
    console.error("[TRIAL-ENDING] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...getCorsHeaders(origin) } }
    );
  }
};

serve(handler);
