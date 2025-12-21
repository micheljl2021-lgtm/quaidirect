import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@4.0.0";

import { getCorsHeaders, handleCors } from "../_shared/cors.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const SITE_URL = Deno.env.get('SITE_URL') || 'https://quaidirect.fr';

interface PlatformUpdateRequest {
  updateId: string;
}

serve(async (req) => {
  const origin = req.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);

  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Supabase environment variables are not configured');
    }

    const supabaseClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // Verify admin authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify admin role
    const { data: roleData } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { updateId }: PlatformUpdateRequest = await req.json();

    if (!updateId) {
      return new Response(
        JSON.stringify({ error: 'updateId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch the platform update
    const { data: update, error: updateError } = await supabaseClient
      .from('platform_updates')
      .select('*')
      .eq('id', updateId)
      .single();

    if (updateError || !update) {
      console.error('[send-platform-update] Update not found:', updateError);
      return new Response(
        JSON.stringify({ error: 'Mise à jour non trouvée' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (update.sent_at) {
      return new Response(
        JSON.stringify({ error: 'Cette mise à jour a déjà été envoyée' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch all verified fishermen with email
    const { data: fishermen, error: fishermenError } = await supabaseClient
      .from('fishermen')
      .select('id, email, boat_name, company_name')
      .not('verified_at', 'is', null)
      .not('email', 'is', null);

    if (fishermenError) {
      console.error('[send-platform-update] Error fetching fishermen:', fishermenError);
      throw fishermenError;
    }

    const validFishermen = fishermen?.filter(f => f.email && f.email.includes('@')) || [];
    console.log(`[send-platform-update] Sending to ${validFishermen.length} fishermen`);

    if (validFishermen.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Aucun pêcheur vérifié avec email valide',
          recipientCount: 0 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send emails in batches of 50
    const batchSize = 50;
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < validFishermen.length; i += batchSize) {
      const batch = validFishermen.slice(i, i + batchSize);
      
      const emailPromises = batch.map(async (fisherman) => {
        try {
          const displayName = fisherman.company_name || fisherman.boat_name || 'Pêcheur';
          
          await resend.emails.send({
            from: "QuaiDirect <noreply@quaidirect.fr>",
            to: [fisherman.email],
            subject: `🔔 ${update.title}`,
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <style>
                  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: linear-gradient(135deg, #0066CC, #0099FF); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                  .header h1 { margin: 0; font-size: 24px; }
                  .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
                  .version { background: #0066CC; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; display: inline-block; margin-bottom: 20px; }
                  .update-content { background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 20px 0; }
                  .footer { background: #1f2937; color: #9ca3af; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; }
                  .cta { display: inline-block; background: #0066CC; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 20px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>🐟 QuaiDirect</h1>
                    <p style="margin: 10px 0 0 0; opacity: 0.9;">Nouveautés de la plateforme</p>
                  </div>
                  <div class="content">
                    <p>Bonjour ${displayName},</p>
                    
                    ${update.version ? `<span class="version">Version ${update.version}</span>` : ''}
                    
                    <h2 style="color: #0066CC; margin-top: 0;">${update.title}</h2>
                    
                    <div class="update-content">
                      ${update.content.split('\n').map((line: string) => `<p style="margin: 10px 0;">${line}</p>`).join('')}
                    </div>
                    
                    <p>Ces améliorations sont déjà disponibles sur votre tableau de bord.</p>
                    
                    <a href="${SITE_URL}/dashboard/pecheur" class="cta">
                      Accéder à mon tableau de bord
                    </a>
                    
                    <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                      Des questions ? Contactez-nous via votre espace support.
                    </p>
                  </div>
                  <div class="footer">
                    <p>© 2025 QuaiDirect - La vente directe à quai</p>
                    <p>Cet email a été envoyé à ${fisherman.email}</p>
                  </div>
                </div>
              </body>
              </html>
            `,
          });
          successCount++;
          console.log(`[send-platform-update] Email sent to ${fisherman.email}`);
        } catch (emailError) {
          errorCount++;
          console.error(`[send-platform-update] Failed to send to ${fisherman.email}:`, emailError);
        }
      });

      await Promise.all(emailPromises);
    }

    // Update the platform_updates record
    const { error: updateDbError } = await supabaseClient
      .from('platform_updates')
      .update({
        sent_at: new Date().toISOString(),
        sent_by: user.id,
        recipient_count: successCount,
      })
      .eq('id', updateId);

    if (updateDbError) {
      console.error('[send-platform-update] Error updating record:', updateDbError);
    }

    console.log(`[send-platform-update] Complete: ${successCount} sent, ${errorCount} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        recipientCount: successCount,
        errorCount,
        message: `Email envoyé à ${successCount} pêcheur(s)` 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[send-platform-update] Unexpected error:', message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
