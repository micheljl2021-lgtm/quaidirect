import { Resend } from "https://esm.sh/resend@4.0.0";
import { getCorsHeaders, handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const SITE_URL = Deno.env.get("SITE_URL") || "https://quaidirect.fr";

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

// Plan configuration synchronized with pricing.ts
const PLAN_CONFIG: Record<string, { label: string; priceCents: number; period: string; features: string[] }> = {
  premium: {
    label: 'Premium',
    priceCents: 2500,
    period: 'an',
    features: [
      '✅ Soutenez directement les pêcheurs locaux',
      '✅ Alertes ciblées sur vos poissons favoris',
      '✅ Notifications prioritaires par email',
      '✅ Badge Premium visible sur votre profil',
    ],
  },
  premium_plus: {
    label: 'Premium+',
    priceCents: 4000,
    period: 'an',
    features: [
      '✅ Soutenez directement les pêcheurs locaux',
      '✅ Alertes ciblées sur vos poissons favoris',
      '✅ Notifications prioritaires par email et SMS',
      '✅ Contribution au pool SMS des pêcheurs',
      '✅ Badge Premium+ exclusif sur votre profil',
    ],
  },
};

const getPlanConfig = (plan: string) => {
  const normalized = plan.toLowerCase()
    .replace('_annual', '')
    .replace('_monthly', '');
  return PLAN_CONFIG[normalized] || PLAN_CONFIG.premium;
};

interface PremiumWelcomeRequest {
  userEmail: string;
  userName?: string;
  plan: string;
  amountPaid?: number;
  nextBillingDate?: string;
}

Deno.serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const origin = req.headers.get('origin');

  try {
    // Verify internal secret for webhook calls
    const internalSecret = req.headers.get('x-internal-secret');
    const expectedSecret = Deno.env.get('INTERNAL_FUNCTION_SECRET');
    
    if (!expectedSecret || internalSecret !== expectedSecret) {
      console.error('[PREMIUM-WELCOME] Unauthorized: Invalid or missing internal secret');
      return errorResponse('Unauthorized', 401, origin);
    }

    const { userEmail, userName, plan, amountPaid, nextBillingDate }: PremiumWelcomeRequest = await req.json();

    const config = getPlanConfig(plan);
    const priceFormatted = amountPaid ? (amountPaid / 100).toFixed(2) : (config.priceCents / 100).toFixed(0);

    console.log('[PREMIUM-WELCOME] Sending welcome email', { userEmail, plan, planLabel: config.label });

    const emailResponse = await resend.emails.send({
      from: "QuaiDirect <support@quaidirect.fr>",
      to: [userEmail],
      subject: `Bienvenue dans QuaiDirect ${config.label} !`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #0066cc 0%, #0052a3 100%); padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;">🎉 Bienvenue dans QuaiDirect ${escapeHtml(config.label)}</h1>
            ${userName ? `<p style="color: #e0e7ff; margin: 8px 0 0 0; font-size: 16px;">${escapeHtml(userName)}</p>` : ''}
          </div>
          
          <div style="padding: 24px;">
            <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin: 0 0 24px 0; border-left: 4px solid #28a745;">
              <p style="margin: 0; font-size: 18px; font-weight: bold; color: #155724;">
                ✅ Votre abonnement ${escapeHtml(config.label)} est maintenant actif !
              </p>
              ${amountPaid ? `
              <p style="margin: 10px 0 0 0; color: #155724;">
                Montant : <strong>${escapeHtml(priceFormatted)}€/${config.period}</strong>
              </p>
              ` : ''}
            </div>

            <h2 style="color: #1e293b; margin: 0 0 16px 0; font-size: 18px;">📋 Détails de votre abonnement</h2>
            
            <table style="width: 100%; border-collapse: collapse; margin: 0 0 24px 0;">
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 12px 0; color: #64748b;">Plan souscrit</td>
                <td style="padding: 12px 0; text-align: right; font-weight: bold; color: #1e293b;">QuaiDirect ${escapeHtml(config.label)}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 12px 0; color: #64748b;">Tarif</td>
                <td style="padding: 12px 0; text-align: right; font-weight: bold; color: #1e293b;">${escapeHtml(priceFormatted)}€/${config.period}</td>
              </tr>
              ${nextBillingDate ? `
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 12px 0; color: #64748b;">Prochaine facturation</td>
                <td style="padding: 12px 0; text-align: right; font-weight: bold; color: #1e293b;">
                  ${new Date(nextBillingDate).toLocaleDateString('fr-FR', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </td>
              </tr>
              ` : ''}
            </table>

            <h2 style="color: #1e293b; margin: 0 0 16px 0; font-size: 18px;">🎁 Vos avantages ${config.label} :</h2>
            <ul style="line-height: 1.8; color: #475569; padding-left: 0; list-style: none; margin: 0 0 24px 0;">
              ${config.features.map(f => `<li style="margin-bottom: 8px;">${f}</li>`).join('')}
            </ul>

            <h2 style="color: #1e293b; margin: 0 0 16px 0; font-size: 18px;">📍 Prochaines étapes :</h2>
            <ol style="line-height: 1.8; color: #475569; margin: 0 0 24px 0; padding-left: 20px;">
              <li><strong>Configurez vos préférences</strong> (ports favoris, espèces préférées)</li>
              <li><strong>Activez les notifications</strong> pour ne rien manquer</li>
              <li><strong>Explorez les arrivages</strong> disponibles près de chez vous</li>
            </ol>

            <div style="text-align: center; margin: 32px 0;">
              <a href="${SITE_URL}/premium/reglages" 
                 style="display: inline-block; background: linear-gradient(135deg, #0066cc 0%, #0052a3 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                Configurer mes préférences
              </a>
            </div>

            <div style="background: #e7f3ff; padding: 16px; border-radius: 6px; margin: 0 0 24px 0;">
              <p style="margin: 0; font-size: 14px; color: #1e40af;">
                <strong>💡 Info :</strong> Votre abonnement se renouvellera automatiquement. 
                Vous pouvez gérer ou annuler à tout moment depuis votre tableau de bord.
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0; color: #64748b; font-size: 14px;">
              Une question ? Contactez <a href="mailto:support@quaidirect.fr" style="color: #0066cc;">support@quaidirect.fr</a>
            </p>
            <p style="margin: 12px 0 0 0; color: #94a3b8; font-size: 13px;">
              Merci de soutenir la pêche locale et artisanale !<br>
              <strong>L'équipe QuaiDirect</strong>
            </p>
          </div>
        </div>
      `,
    });

    console.log("[PREMIUM-WELCOME] Email sent successfully:", emailResponse);

    return jsonResponse(emailResponse, 200, origin);
  } catch (error: any) {
    console.error("[PREMIUM-WELCOME] Error:", error);
    return errorResponse(error.message, 500, origin);
  }
});
