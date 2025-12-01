import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://quaidirect.fr",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentConfirmationRequest {
  userEmail: string;
  boatName?: string;
  plan: string;
  amountPaid: number;
  invoiceUrl?: string;
  nextBillingDate: string;
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
      console.error('[PAYMENT-CONFIRMATION] Unauthorized: Invalid or missing internal secret');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { userEmail, boatName, plan, amountPaid, invoiceUrl, nextBillingDate }: PaymentConfirmationRequest = await req.json();

    const planLabel = plan === 'pro' ? 'Pro' : 'Basic';
    const amount = (amountPaid / 100).toFixed(2);

    const emailResponse = await resend.emails.send({
      from: "QuaiDirect <support@quaidirect.fr>",
      to: [userEmail],
      subject: `✅ Confirmation de paiement QuaiDirect - ${amount}€`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #0066cc;">✅ Paiement confirmé ${boatName ? `- ${boatName}` : ''}</h1>
          
          <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
            <p style="margin: 0; font-size: 18px; font-weight: bold; color: #155724;">
              Votre paiement de ${amount}€ a été traité avec succès !
            </p>
            <p style="margin: 10px 0 0 0; color: #155724;">
              Plan : <strong>QuaiDirect ${planLabel}</strong>
            </p>
          </div>

          <h2 style="color: #333;">📋 Détails de votre abonnement</h2>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 12px 0; color: #666;">Plan souscrit</td>
              <td style="padding: 12px 0; text-align: right; font-weight: bold;">QuaiDirect ${planLabel}</td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 12px 0; color: #666;">Montant payé</td>
              <td style="padding: 12px 0; text-align: right; font-weight: bold;">${amount}€</td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 12px 0; color: #666;">Prochaine facturation</td>
              <td style="padding: 12px 0; text-align: right; font-weight: bold;">
                ${new Date(nextBillingDate).toLocaleDateString('fr-FR', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </td>
            </tr>
          </table>

          ${invoiceUrl ? `
          <div style="margin: 20px 0; text-align: center;">
            <a href="${invoiceUrl}" 
               style="background: #6c757d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              📄 Télécharger ma facture
            </a>
          </div>
          ` : ''}

          <h2 style="color: #333;">🎉 Profitez de tous vos avantages</h2>
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
            <a href="https://quaidirect.fr/dashboard/pecheur" 
               style="background: #0066cc; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Accéder à mon tableau de bord
            </a>
          </div>

          <div style="background: #e7f3ff; padding: 16px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px;">
              <strong>💡 Conseil :</strong> Votre abonnement se renouvellera automatiquement chaque année. 
              Vous pouvez gérer ou annuler votre abonnement à tout moment depuis votre espace Stripe.
            </p>
          </div>

          <p style="margin-top: 30px; color: #666; font-size: 14px;">
            Une question sur votre facture ? Contactez-nous à <a href="mailto:support@quaidirect.fr">support@quaidirect.fr</a>
          </p>

          <p style="color: #666; font-size: 14px;">
            Merci de votre confiance,<br>
            <strong>L'équipe QuaiDirect</strong>
          </p>
        </div>
      `,
    });

    console.log("[PAYMENT-CONFIRMATION] Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("[PAYMENT-CONFIRMATION] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
