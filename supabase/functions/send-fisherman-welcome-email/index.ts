import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const SITE_URL = Deno.env.get("SITE_URL") || "https://quaidirect.fr";

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

// Single source of truth for plan labels
const PLAN_CONFIG: Record<string, { label: string; priceCents: number; period: string; features: string[] }> = {
  standard: {
    label: 'Standard',
    priceCents: 15000,
    period: 'an',
    features: [
      '✅ Emails illimités à vos clients',
      '✅ Partage WhatsApp instantané',
      '✅ IA pour générer vos textes et descriptions',
      '✅ 50 SMS/mois inclus + 200 SMS bonus ouverture',
    ],
  },
  pro: {
    label: 'Pro',
    priceCents: 29900,
    period: 'an',
    features: [
      '✅ Emails illimités à vos clients',
      '✅ Partage WhatsApp instantané',
      '✅ IA avancée (prix, météo, marée)',
      '✅ 200 SMS/mois inclus + 1000 SMS bonus ouverture',
      '✅ Statistiques et estimation CA',
      '✅ Multi-points de vente (jusqu\'à 3)',
      '✅ Support prioritaire',
    ],
  },
  elite: {
    label: 'Elite',
    priceCents: 19900,
    period: 'mois',
    features: [
      '✅ Emails illimités à vos clients',
      '✅ IA complète + génération photo → annonce',
      '✅ 1500 SMS/mois inclus',
      '✅ Multi-points de vente (jusqu\'à 10)',
      '✅ Dashboard avancé',
      '✅ Numéro SMS vérifié (quand disponible)',
      '✅ Support prioritaire dédié',
    ],
  },
  // Backward compatibility mappings
  basic: {
    label: 'Standard',
    priceCents: 15000,
    period: 'an',
    features: [
      '✅ Emails illimités à vos clients',
      '✅ Partage WhatsApp instantané',
      '✅ IA pour générer vos textes et descriptions',
      '✅ 50 SMS/mois inclus + 200 SMS bonus ouverture',
    ],
  },
};

const getPlanConfig = (plan: string) => {
  const normalized = plan.toLowerCase().replace('fisherman_', '');
  return PLAN_CONFIG[normalized] || PLAN_CONFIG.standard;
};

interface FishermanWelcomeRequest {
  userEmail: string;
  boatName?: string;
  plan: string;
  fishermanZone?: string;
  fishermanPhoto?: string;
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
      console.error('[FISHERMAN-WELCOME] Unauthorized: Invalid or missing internal secret');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { userEmail, boatName, plan, fishermanZone, fishermanPhoto }: FishermanWelcomeRequest = await req.json();
    
    const config = getPlanConfig(plan);
    const priceFormatted = (config.priceCents / 100).toFixed(0);
    const planLabel = `${config.label} (${priceFormatted}€/${config.period})`;

    console.log('[FISHERMAN-WELCOME] Sending welcome email', { userEmail, plan, planLabel });

    const emailResponse = await resend.emails.send({
      from: "QuaiDirect <support@quaidirect.fr>",
      to: [userEmail],
      subject: `Bienvenue sur QuaiDirect ${boatName ? escapeHtml(boatName) : ''} !`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #0066cc 0%, #0052a3 100%); padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;">🎉 Bienvenue sur QuaiDirect</h1>
            ${boatName ? `<p style="color: #e0e7ff; margin: 8px 0 0 0; font-size: 16px;">${escapeHtml(boatName)}</p>` : ''}
          </div>
          
          <!-- Mini fiche pêcheur -->
          ${(boatName || fishermanZone || fishermanPhoto) ? `
          <div style="background-color: #f8fafc; padding: 20px; margin: 0; border-left: 4px solid #0066cc;">
            <div style="display: flex; align-items: center;">
              ${fishermanPhoto ? `<img src="${fishermanPhoto}" alt="${escapeHtml(boatName || 'Bateau')}" style="width: 60px; height: 60px; border-radius: 8px; object-fit: cover; margin-right: 16px;">` : ''}
              <div>
                ${boatName ? `<p style="margin: 0; font-weight: 600; font-size: 16px; color: #1e293b;">${escapeHtml(boatName)}</p>` : ''}
                ${fishermanZone ? `<p style="margin: 4px 0 0 0; font-size: 14px; color: #64748b;">📍 ${escapeHtml(fishermanZone)}</p>` : ''}
              </div>
            </div>
          </div>
          ` : ''}
          
          <div style="padding: 24px;">
            <div style="background: #d4edda; padding: 16px; border-radius: 8px; margin: 0 0 24px 0; border-left: 4px solid #28a745;">
              <p style="margin: 0; font-size: 16px; font-weight: 600; color: #155724;">
                ✅ Votre abonnement ${planLabel} est maintenant actif !
              </p>
            </div>

            <h2 style="color: #1e293b; margin: 0 0 16px 0; font-size: 18px;">🚀 Vos avantages ${config.label} :</h2>
            <ul style="line-height: 1.8; color: #475569; padding-left: 0; list-style: none; margin: 0 0 24px 0;">
              ${config.features.map(f => `<li style="margin-bottom: 8px;">${f}</li>`).join('')}
            </ul>

            <h2 style="color: #1e293b; margin: 0 0 16px 0; font-size: 18px;">📍 Prochaines étapes :</h2>
            <ol style="line-height: 1.8; color: #475569; margin: 0 0 24px 0; padding-left: 20px;">
              <li><strong>Complétez votre profil pêcheur</strong> avec vos infos bateau et zones de pêche</li>
              <li><strong>Ajoutez vos points de vente</strong> (jusqu'à ${plan === 'elite' ? '10' : plan === 'pro' ? '3' : '2'} emplacements)</li>
              <li><strong>Créez votre premier arrivage</strong> en moins de 2 minutes</li>
              <li><strong>Importez vos contacts clients</strong> pour les informer automatiquement</li>
            </ol>

            <div style="text-align: center; margin: 32px 0;">
              <a href="${SITE_URL}/pecheur/onboarding" 
                 style="display: inline-block; background: linear-gradient(135deg, #0066cc 0%, #0052a3 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                Compléter mon profil
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0; color: #64748b; font-size: 14px;">
              Besoin d'aide ? Répondez à cet email ou contactez <a href="mailto:support@quaidirect.fr" style="color: #0066cc;">support@quaidirect.fr</a>
            </p>
            <p style="margin: 12px 0 0 0; color: #94a3b8; font-size: 13px;">
              Bonne pêche et bonnes ventes !<br>
              <strong>L'équipe QuaiDirect</strong>
            </p>
          </div>
        </div>
      `,
    });

    console.log("[FISHERMAN-WELCOME] Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("[FISHERMAN-WELCOME] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
