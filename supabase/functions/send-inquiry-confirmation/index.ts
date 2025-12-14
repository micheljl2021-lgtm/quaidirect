import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

// Helper function to escape HTML to prevent XSS
const escapeHtml = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://quaidirect.fr",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting configuration
const RATE_LIMIT = 3; // max requests
const RATE_WINDOW_MINUTES = 1; // per minute

// Input validation schema
const InquiryRequestSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters')
    .transform(val => val.trim().toLowerCase()),
  message: z.string()
    .max(2000, 'Message must be less than 2000 characters')
    .optional()
    .default('')
    .transform(val => val.trim()),
  type: z.enum(['launch_notification', 'question', 'fisherman_interest', 'partnership', 'other'])
    .default('other'),
});

const checkRateLimit = async (
  supabase: any,
  identifier: string,
  endpoint: string
): Promise<{ allowed: boolean; remaining: number }> => {
  const windowStart = new Date(Date.now() - RATE_WINDOW_MINUTES * 60 * 1000).toISOString();
  
  const { data: existing, error: fetchError } = await supabase
    .from('rate_limits')
    .select('id, request_count')
    .eq('identifier', identifier)
    .eq('endpoint', endpoint)
    .gte('window_start', windowStart)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error('Rate limit check error:', fetchError);
    return { allowed: true, remaining: RATE_LIMIT };
  }

  if (existing) {
    if (existing.request_count >= RATE_LIMIT) {
      return { allowed: false, remaining: 0 };
    }
    await supabase
      .from('rate_limits')
      .update({ request_count: existing.request_count + 1 })
      .eq('id', existing.id);
    return { allowed: true, remaining: RATE_LIMIT - existing.request_count - 1 };
  }

  await supabase.from('rate_limits').insert({
    identifier,
    endpoint,
    request_count: 1,
    window_start: new Date().toISOString(),
  });
  return { allowed: true, remaining: RATE_LIMIT - 1 };
};

const getTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    'launch_notification': 'Notification de lancement',
    'question': 'Question générale',
    'fisherman_interest': 'Intérêt pêcheur',
    'partnership': 'Partenariat / Presse',
    'other': 'Autre',
  };
  return labels[type] || type;
};

const handler = async (req: Request): Promise<Response> => {
  console.log("send-inquiry-confirmation: Request received");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Rate limiting - use IP address for unauthenticated endpoint
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const { allowed, remaining } = await checkRateLimit(supabaseClient, clientIP, 'send-inquiry-confirmation');
    if (!allowed) {
      console.log(`[INQUIRY-CONFIRMATION] Rate limit exceeded for IP ${clientIP}`);
      return new Response(
        JSON.stringify({ error: 'Trop de requêtes. Veuillez patienter.' }),
        {
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'X-RateLimit-Remaining': '0',
            'Retry-After': '60'
          },
          status: 429,
        }
      );
    }

    // Validate input with Zod
    const rawBody = await req.json();
    const validationResult = InquiryRequestSchema.safeParse(rawBody);
    
    if (!validationResult.success) {
      const errorMessages = validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      console.error("send-inquiry-confirmation: Validation error:", errorMessages);
      return new Response(
        JSON.stringify({ error: `Validation error: ${errorMessages}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { email, message, type } = validationResult.data;
    console.log(`send-inquiry-confirmation: Sending to ${email}, type: ${type}`);

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const typeLabel = getTypeLabel(type);
    const messagePreview = message ? (message.length > 200 ? message.substring(0, 200) + '...' : message) : 'Aucun message';

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a2e; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #0ea5e9; }
          .logo { font-size: 28px; font-weight: bold; color: #0ea5e9; }
          .content { padding: 30px 0; }
          .recap { background: #f0f9ff; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .recap-title { font-weight: bold; color: #0369a1; margin-bottom: 10px; }
          .recap-item { margin: 8px 0; }
          .recap-label { color: #64748b; }
          .footer { text-align: center; padding: 20px 0; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🐟 QuaiDirect</div>
          </div>
          <div class="content">
            <h2>Bonjour,</h2>
            <p>Merci d'avoir contacté QuaiDirect ! 🐟</p>
            <p>Nous avons bien reçu votre message et notre équipe vous répondra dans les plus brefs délais.</p>
            
            <div class="recap">
              <div class="recap-title">📋 Récapitulatif de votre demande</div>
              <div class="recap-item">
                <span class="recap-label">Type :</span> ${escapeHtml(typeLabel)}
              </div>
              <div class="recap-item">
                <span class="recap-label">Message :</span> ${escapeHtml(messagePreview)}
              </div>
            </div>

            <p>À très bientôt sur QuaiDirect !</p>
            <p><strong>L'équipe QuaiDirect</strong></p>
          </div>
          <div class="footer">
            <p>Du poisson frais, en direct des pêcheurs de votre région</p>
            <p><a href="https://quaidirect.fr">quaidirect.fr</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "QuaiDirect <contact@quaidirect.fr>",
        to: [email],
        subject: "✅ QuaiDirect a bien reçu votre message",
        html: emailHtml,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("send-inquiry-confirmation: Resend error:", errorText);
      throw new Error(`Failed to send email: ${errorText}`);
    }

    const emailResponse = await response.json();
    console.log("send-inquiry-confirmation: Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("send-inquiry-confirmation: Error:", error);
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
