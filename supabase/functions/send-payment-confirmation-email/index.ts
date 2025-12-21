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

// Single source of truth for plan labels - Synchronized with pricing.ts
const PLAN_CONFIG: Record<string, { label: string; features: string[] }> = {
  standard: {
    label: 'Standard',
    features: [
      '✅ Emails illimités à vos clients',
      '✅ Partage WhatsApp instantané',
      '✅ IA pour générer vos textes et descriptions',
      '✅ 50 SMS/mois inclus',
      '✅ 200 SMS bonus ouverture',
      '✅ 1 point de vente',
    ],
  },
  pro: {
    label: 'Pro',
    features: [
      '✅ Emails illimités à vos clients',
      '✅ IA avancée (prix, météo, marée)',
      '✅ 200 SMS/mois inclus',
      '✅ 1000 SMS bonus ouverture',
      '✅ Statistiques et estimation CA',
      '✅ Multi-points de vente (jusqu\'à 3)',
      '✅ Support prioritaire',
    ],
  },
  elite: {
    label: 'Elite',
    features: [
      '✅ Emails illimités à vos clients',
      '✅ IA complète + photo → annonce',
      '✅ 1500 SMS/mois inclus',
      '✅ Multi-points de vente (jusqu\'à 10)',
      '✅ Dashboard avancé',
      '✅ Numéro SMS vérifié (quand disponible)',
      '✅ Support prioritaire dédié',
    ],
  },
  premium: {
    label: 'Premium',
    features: [
      '✅ Notifications push + email',
      '✅ Accès prioritaire aux arrivages',
      '✅ Soutien direct aux pêcheurs',
    ],
  },
  premium_plus: {
    label: 'Premium+',
    features: [
      '✅ Notifications push + email + SMS',
      '✅ Accès prioritaire aux arrivages',
      '✅ Contribution au pool SMS pêcheurs',
      '✅ Soutien direct aux pêcheurs',
    ],
  },
  // Backward compatibility
  basic: {
    label: 'Standard',
    features: [
      '✅ Emails illimités à vos clients',
      '✅ Partage WhatsApp instantané',
      '✅ IA pour générer vos textes et descriptions',
      '✅ 50 SMS/mois inclus',
      '✅ 200 SMS bonus ouverture',
      '✅ 1 point de vente',
    ],
  },
};

const getPlanConfig = (plan: string) => {
  const normalized = plan.toLowerCase()
    .replace('fisherman_', '')
    .replace('_annual', '')
    .replace('_monthly', '');
  return PLAN_CONFIG[normalized] || PLAN_CONFIG.standard;
};

interface PaymentConfirmationRequest {
  userEmail: string;
  boatName?: string;
  plan: string;
  amountPaid: number;
  invoiceUrl?: string;
  nextBillingDate: string;
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
      console.error('[PAYMENT-CONFIRMATION] Unauthorized: Invalid or missing internal secret');
      return errorResponse('Unauthorized', 401, origin);
    }

    const { userEmail, boatName, plan, amountPaid, invoiceUrl, nextBillingDate }: PaymentConfirmationRequest = await req.json();

    const config = getPlanConfig(plan);
    const amount = (amountPaid / 100).toFixed(2);
    const isFishermanPlan = plan.toLowerCase().includes('fisherman') || ['standard', 'pro', 'elite', 'basic'].includes(plan.toLowerCase());
    const dashboardUrl = isFishermanPlan ? `${SITE_URL}/dashboard/pecheur` : `${SITE_URL}/dashboard/premium`;

    console.log('[PAYMENT-CONFIRMATION] Sending confirmation email', { userEmail, plan, planLabel: config.label, amount });

    const emailResponse = await resend.emails.send({
      from: "QuaiDirect <support@quaidirect.fr>",
      to: [userEmail],
      subject: `✅ Confirmation de paiement QuaiDirect - ${amount}€`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #0066cc 0%, #0052a3 100%); padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;">✅ Paiement confirmé</h1>
            ${boatName ? `<p style="color: #e0e7ff; margin: 8px 0 0 0; font-size: 16px;">${escapeHtml(boatName)}</p>` : ''}
          </div>
          
          <div style="padding: 24px;">
            <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin: 0 0 24px 0; border-left: 4px solid #28a745;">
              <p style="margin: 0; font-size: 18px; font-weight: bold; color: #155724;">
                Votre paiement de ${escapeHtml(amount)}€ a été traité avec succès !
              </p>
              <p style="margin: 10px 0 0 0; color: #155724;">
                Plan : <strong>QuaiDirect ${escapeHtml(config.label)}</strong>
              </p>
            </div>

            <h2 style="color: #1e293b; margin: 0 0 16px 0; font-size: 18px;">📋 Détails de votre abonnement</h2>
            
            <table style="width: 100%; border-collapse: collapse; margin: 0 0 24px 0;">
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 12px 0; color: #64748b;">Plan souscrit</td>
                <td style="padding: 12px 0; text-align: right; font-weight: bold; color: #1e293b;">QuaiDirect ${escapeHtml(config.label)}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 12px 0; color: #64748b;">Montant payé</td>
                <td style="padding: 12px 0; text-align: right; font-weight: bold; color: #1e293b;">${escapeHtml(amount)}€</td>
              </tr>
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
            </table>

            ${invoiceUrl ? `
            <div style="text-align: center; margin: 0 0 24px 0;">
              <a href="${invoiceUrl}" 
                 style="display: inline-block; background: #6c757d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                📄 Télécharger ma facture
              </a>
            </div>
            ` : ''}

            <h2 style="color: #1e293b; margin: 0 0 16px 0; font-size: 18px;">🎉 Vos avantages</h2>
            <ul style="line-height: 1.8; color: #475569; padding-left: 0; list-style: none; margin: 0 0 24px 0;">
              ${config.features.map(f => `<li style="margin-bottom: 8px;">${f}</li>`).join('')}
            </ul>

            <div style="text-align: center; margin: 32px 0;">
              <a href="${dashboardUrl}" 
                 style="display: inline-block; background: linear-gradient(135deg, #0066cc 0%, #0052a3 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                Accéder à mon tableau de bord
              </a>
            </div>

            <div style="background: #e7f3ff; padding: 16px; border-radius: 6px; margin: 0 0 24px 0;">
              <p style="margin: 0; font-size: 14px; color: #1e40af;">
                <strong>💡 Info :</strong> Votre abonnement se renouvellera automatiquement. 
                Vous pouvez gérer ou annuler à tout moment depuis votre espace Stripe.
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0; color: #64748b; font-size: 14px;">
              Une question ? Contactez <a href="mailto:support@quaidirect.fr" style="color: #0066cc;">support@quaidirect.fr</a>
            </p>
            <p style="margin: 12px 0 0 0; color: #94a3b8; font-size: 13px;">
              Merci de votre confiance,<br>
              <strong>L'équipe QuaiDirect</strong>
            </p>
          </div>
        </div>
      `,
    });

    console.log("[PAYMENT-CONFIRMATION] Email sent successfully:", emailResponse);

    return jsonResponse(emailResponse, 200, origin);
  } catch (error: any) {
    console.error("[PAYMENT-CONFIRMATION] Error:", error);
    return errorResponse(error.message, 500, origin);
  }
});
