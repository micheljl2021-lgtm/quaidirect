import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FishermenApprovedRequest {
  userEmail: string;
  boatName?: string;
  plan: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userEmail, boatName, plan }: FishermenApprovedRequest = await req.json();

    const planLabel = plan === 'pro' ? 'Pro' : 'Basic';

    const emailResponse = await resend.emails.send({
      from: "QuaiDirect <support@quaidirect.fr>",
      to: [userEmail],
      subject: "Votre compte pêcheur QuaiDirect est validé !",
      html: `
        <h1>Félicitations ${boatName ? boatName : ''} !</h1>
        <p>Votre compte pêcheur <strong>${planLabel}</strong> a été validé par notre équipe.</p>
        
        <h2>🎉 Vous pouvez maintenant :</h2>
        <ul>
          <li>✅ Créer et publier vos arrivages</li>
          <li>✅ Gérer vos points de vente</li>
          <li>✅ Contacter vos clients par email (illimité)</li>
          <li>✅ Partager sur WhatsApp</li>
          <li>✅ Utiliser l'IA pour vos textes et descriptions</li>
          ${plan === 'pro' ? '<li>✅ Accéder aux statistiques avancées</li><li>✅ Utiliser l\'IA avancée (prix, météo, marée)</li>' : ''}
        </ul>

        <h2>📍 Prochaines étapes :</h2>
        <ol>
          <li>Complétez votre profil pêcheur</li>
          <li>Ajoutez vos points de vente</li>
          <li>Créez votre premier arrivage</li>
        </ol>

        <p style="margin-top: 30px;">
          <a href="https://quaidirect.fr/pecheur/onboarding" 
             style="background: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Compléter mon profil
          </a>
        </p>

        <p style="margin-top: 30px; color: #666;">
          Besoin d'aide ? Contactez-nous à support@quaidirect.fr<br>
          L'équipe QuaiDirect
        </p>
      `,
    });

    console.log("Fisherman approved email sent:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-fisherman-approved-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
