import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://quaidirect.fr",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SupportResponseRequest {
  requestId: string;
  status: string;
  adminResponse: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { requestId, status, adminResponse }: SupportResponseRequest = await req.json();

    console.log("Processing support response notification:", { requestId, status });

    // Initialize Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Fetch support request with fisherman details
    const { data: supportRequest, error: requestError } = await supabaseClient
      .from("support_requests")
      .select(`
        *,
        fishermen:fisherman_id (
          email,
          boat_name,
          company_name
        )
      `)
      .eq("id", requestId)
      .single();

    if (requestError || !supportRequest) {
      console.error("Error fetching support request:", requestError);
      throw new Error("Support request not found");
    }

    const fishermanEmail = supportRequest.fishermen?.email;
    if (!fishermanEmail) {
      console.error("Fisherman email not found");
      throw new Error("Fisherman email not found");
    }

    // Map status to French
    const statusLabels: Record<string, string> = {
      pending: "En attente",
      in_progress: "En cours de traitement",
      resolved: "Résolue",
      rejected: "Refusée",
    };

    const statusLabel = statusLabels[status] || status;

    // Send email to fisherman
    const emailResponse = await resend.emails.send({
      from: "Support QuaiDirect <support@quaidirect.fr>",
      to: [fishermanEmail],
      subject: `Réponse à votre demande de support - QuaiDirect`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0EA5E9;">QuaiDirect Support</h2>
          
          <p>Bonjour,</p>
          
          <p>Votre demande de support a été traitée par notre équipe.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>📋 Sujet :</strong> ${supportRequest.subject}</p>
            <p style="margin: 5px 0;"><strong>📌 Statut :</strong> <span style="color: #0EA5E9;">${statusLabel}</span></p>
          </div>
          
          <div style="background-color: #ffffff; border-left: 4px solid #0EA5E9; padding: 15px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>💬 Réponse de l'équipe QuaiDirect :</strong></p>
            <p style="margin: 0; white-space: pre-wrap;">${adminResponse}</p>
          </div>
          
          <p>Vous pouvez consulter l'historique de vos demandes sur :</p>
          <p><a href="https://quaidirect.fr/pecheur/support" style="color: #0EA5E9;">https://quaidirect.fr/pecheur/support</a></p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          
          <p style="color: #6b7280; font-size: 14px;">
            L'équipe QuaiDirect<br>
            <a href="mailto:support@quaidirect.fr" style="color: #0EA5E9;">support@quaidirect.fr</a>
          </p>
        </div>
      `,
    });

    console.log("Support response email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailId: emailResponse.data?.id,
        message: "Email de réponse envoyé avec succès"
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-support-response function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);
