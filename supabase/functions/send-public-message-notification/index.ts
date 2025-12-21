import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { getCorsHeaders, handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Input validation schema
const PublicMessageSchema = z.object({
  fishermanUserId: z.string().uuid("Invalid fisherman user ID"),
  fishermanId: z.string().uuid("Invalid fisherman ID"),
  senderName: z.string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters")
    .transform(val => val.trim()),
  senderEmail: z.string()
    .email("Invalid email format")
    .max(255, "Email must be less than 255 characters")
    .transform(val => val.trim().toLowerCase()),
  message: z.string()
    .min(10, "Message must be at least 10 characters")
    .max(2000, "Message must be less than 2000 characters")
    .transform(val => val.trim()),
});

// Rate limiting configuration
const RATE_LIMIT = 5; // max requests per email
const RATE_WINDOW_MINUTES = 10; // per 10 minutes

// Helper to escape HTML for XSS prevention
const escapeHtml = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

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

Deno.serve(async (req: Request) => {
  // Handle CORS preflight with origin validation
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const origin = req.headers.get('Origin');

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate input with Zod
    const rawBody = await req.json();
    const validationResult = PublicMessageSchema.safeParse(rawBody);
    
    if (!validationResult.success) {
      const errorMessages = validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      console.error("[PUBLIC-MESSAGE] Validation error:", errorMessages);
      return errorResponse(`Validation error: ${errorMessages}`, 400, origin);
    }

    const { fishermanUserId, fishermanId, senderName, senderEmail, message } = validationResult.data;

    // Rate limiting by sender email to prevent spam
    const { allowed, remaining } = await checkRateLimit(supabase, senderEmail, 'send-public-message-notification');
    if (!allowed) {
      console.log(`[PUBLIC-MESSAGE] Rate limit exceeded for ${senderEmail}`);
      return new Response(
        JSON.stringify({ error: 'Trop de messages envoyés. Veuillez patienter 10 minutes.' }),
        {
          status: 429,
          headers: { 
            ...getCorsHeaders(origin), 
            'Content-Type': 'application/json',
            'X-RateLimit-Remaining': '0',
            'Retry-After': '600'
          },
        }
      );
    }

    console.log("[PUBLIC-MESSAGE] Sending notification to fisherman:", fishermanId);

    // Insert message into database using service role (bypasses RLS)
    const { error: insertError } = await supabase.from("messages").insert({
      sender_id: fishermanUserId, // Use fisherman as placeholder since visitor has no user_id
      recipient_id: fishermanUserId,
      sender_email: senderEmail,
      sender_name: senderName,
      subject: `Message de ${senderName} via QuaiDirect`,
      body: message,
      message_type: "public_inquiry",
    });

    if (insertError) {
      console.error("[PUBLIC-MESSAGE] Error inserting message:", insertError);
      throw new Error("Could not save message");
    }

    // Get fisherman email from auth.users
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(fishermanUserId);
    
    if (authError || !authUser?.user?.email) {
      console.error("[PUBLIC-MESSAGE] Error getting fisherman email:", authError);
      throw new Error("Could not get fisherman email");
    }

    const fishermanEmail = authUser.user.email;

    // Get fisherman boat name
    const { data: fisherman } = await supabase
      .from("fishermen")
      .select("boat_name")
      .eq("id", fishermanId)
      .single();

    const boatName = fisherman?.boat_name || "Votre bateau";
    const siteUrl = Deno.env.get("SITE_URL") || "https://quaidirect.fr";

    // Send email to fisherman
    const { error: emailError } = await resend.emails.send({
      from: "QuaiDirect <notifications@quaidirect.fr>",
      replyTo: senderEmail,
      to: [fishermanEmail],
      subject: `Nouveau message de ${escapeHtml(senderName)} sur QuaiDirect`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #0077B6 0%, #00B4D8 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .message-box { background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #0077B6; margin: 20px 0; }
            .sender-info { background: #e0f2fe; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
            .cta-button { display: inline-block; background: #0077B6; color: white !important; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🐟 Nouveau message</h1>
              <p>Un visiteur vous a contacté via QuaiDirect</p>
            </div>
            <div class="content">
              <div class="sender-info">
                <strong>De :</strong> ${escapeHtml(senderName)}<br>
                <strong>Email :</strong> <a href="mailto:${escapeHtml(senderEmail)}">${escapeHtml(senderEmail)}</a>
              </div>
              
              <h3>Message :</h3>
              <div class="message-box">
                ${escapeHtml(message).replace(/\n/g, "<br>")}
              </div>
              
              <p>Pour répondre à ce message, vous pouvez :</p>
              <ul>
                <li>Répondre directement à cet email (l'email de ${escapeHtml(senderName)} est en copie)</li>
                <li>Ou utiliser votre messagerie QuaiDirect</li>
              </ul>
              
              <p style="text-align: center; margin-top: 30px;">
                <a href="${siteUrl}/pecheur/dashboard" class="cta-button">
                  Voir ma messagerie
                </a>
              </p>
              
              <div class="footer">
                <p>Cet email a été envoyé par QuaiDirect<br>
                La plateforme de vente directe de poisson frais</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (emailError) {
      console.error("[PUBLIC-MESSAGE] Error sending email:", emailError);
      throw emailError;
    }

    console.log("[PUBLIC-MESSAGE] Email sent successfully");

    return jsonResponse({ success: true }, 200, origin);
  } catch (error: any) {
    console.error("[PUBLIC-MESSAGE] Error:", error);
    return errorResponse(error.message || "Internal server error", 500, origin);
  }
});
