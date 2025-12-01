import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://quaidirect.fr",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FishermanWelcomeRequest {
  userEmail: string;
  boatName?: string;
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
      console.error('[FISHERMAN-WELCOME] Unauthorized: Invalid or missing internal secret');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { userEmail, boatName, plan }: FishermanWelcomeRequest = await req.json();

    const planLabel = plan === 'pro' ? 'Pro (199€/an)' : 'Basic (150€/an)';
    const isPro = plan === 'pro';

    const emailResponse = await resend.emails.send({
      from: "QuaiDirect <support@quaidirect.fr>",
      to: [userEmail],
      subject: `Bienvenue sur QuaiDirect ${boatName ? boatName : ''} !`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #0066cc;">🎉 Bienvenue sur QuaiDirect ${boatName ? `- ${boatName}` : ''} !</h1>
          
          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-size: 16px;">
              <strong>Votre période d'essai gratuite de 30 jours a commencé !</strong>
            </p>
            <p style="margin: 10px 0 0 0; color: #666;">
              Plan souscrit : <strong>${planLabel}</strong>
            </p>
          </div>

          <h2 style="color: #333;">🚀 Vos avantages ${isPro ? 'Pro' : 'Basic'} :</h2>
          <ul style="line-height: 1.8;">
            <li>✅ Emails illimités à vos clients</li>
            <li>✅ Partage WhatsApp instantané</li>
            <li>✅ IA pour générer vos textes et descriptions</li>
            ${isPro ? `
            <li>✅ IA avancée (suggestions de prix, météo, marée)</li>
            <li>✅ Statistiques et estimation CA</li>
            <li>✅ Multi-points de vente</li>
            <li>✅ Support prioritaire</li>
            ` : ''}
          </ul>

          <h2 style="color: #333;">📍 Prochaines étapes :</h2>
          <ol style="line-height: 1.8;">
            <li><strong>Complétez votre profil pêcheur</strong> avec vos infos bateau et zones de pêche</li>
            <li><strong>Ajoutez vos points de vente</strong> (jusqu'à 2 emplacements)</li>
            <li><strong>Créez votre premier arrivage</strong> en moins de 2 minutes</li>
            <li><strong>Importez vos contacts clients</strong> pour les informer automatiquement</li>
          </ol>

          <div style="margin: 30px 0; text-align: center;">
            <a href="https://quaidirect.fr/dashboard/pecheur" 
               style="background: #0066cc; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Accéder à mon tableau de bord
            </a>
          </div>

          <div style="background: #fff9e6; padding: 16px; border-left: 4px solid #ffc107; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px;">
              <strong>💡 Rappel :</strong> Votre essai gratuit se termine dans 30 jours. 
              Vous serez facturé automatiquement ${isPro ? '199€' : '150€'} pour votre première année, sauf annulation avant la fin de l'essai.
            </p>
          </div>

          <p style="margin-top: 30px; color: #666; font-size: 14px;">
            Besoin d'aide pour démarrer ? Répondez directement à cet email ou contactez-nous à <a href="mailto:support@quaidirect.fr">support@quaidirect.fr</a>
          </p>

          <p style="color: #666; font-size: 14px;">
            Bonne pêche et bonnes ventes !<br>
            <strong>L'équipe QuaiDirect</strong>
          </p>
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
