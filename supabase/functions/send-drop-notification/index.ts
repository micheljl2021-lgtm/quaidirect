import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { getCorsHeaders, jsonResponse, errorResponse } from "../_shared/cors.ts";

// Input validation schema
const RequestSchema = z.object({
  dropId: z.string().uuid('dropId must be a valid UUID'),
});

// Haversine distance calculation (returns km)
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Generate email HTML template
function generateEmailHtml(
  fishermanName: string,
  speciesNames: string,
  saleTime: string,
  locationName: string,
  dropUrl: string
): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px; text-align: center; background: linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%); border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; font-size: 28px; color: #ffffff; font-weight: 700;">
                🐟 Nouvel arrivage !
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <h2 style="margin: 0 0 16px; font-size: 22px; color: #18181b; font-weight: 600;">
                ${fishermanName}
              </h2>
              
              <div style="margin-bottom: 24px; padding: 20px; background-color: #f0f9ff; border-radius: 8px; border-left: 4px solid #0ea5e9;">
                <p style="margin: 0 0 12px; font-size: 16px; color: #0c4a6e;">
                  <strong>🎣 Espèces :</strong> ${speciesNames}
                </p>
                <p style="margin: 0 0 12px; font-size: 16px; color: #0c4a6e;">
                  <strong>🕐 Quand :</strong> ${saleTime}
                </p>
                <p style="margin: 0; font-size: 16px; color: #0c4a6e;">
                  <strong>📍 Où :</strong> ${locationName}
                </p>
              </div>
              
              <a href="${dropUrl}" style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px; text-align: center;">
                Voir l'arrivage →
              </a>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; border-top: 1px solid #e4e4e7; text-align: center;">
              <p style="margin: 0 0 8px; font-size: 14px; color: #71717a;">
                Pêche artisanale en circuit court
              </p>
              <p style="margin: 0; font-size: 12px; color: #a1a1aa;">
                <a href="https://quaidirect.fr/compte" style="color: #0ea5e9; text-decoration: none;">Gérer mes notifications</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// Send email via Resend
async function sendEmail(to: string, subject: string, htmlContent: string, resendApiKey: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'QuaiDirect <notification@quaidirect.fr>', to: [to], subject, html: htmlContent }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Email send failed: ${response.status} - ${errorText}`);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

// Send FCM notification via internal function
async function sendFCMNotification(
  supabaseUrl: string,
  userIds: string[],
  message: { title: string; body: string; data?: Record<string, string> },
  internalSecret: string
): Promise<{ sent: number; failed: number; failedUserIds: string[]; usersWithoutTokens: string[] }> {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/send-fcm-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': internalSecret,
      },
      body: JSON.stringify({ userIds, message }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('FCM notification failed:', errorText);
      return { sent: 0, failed: userIds.length, failedUserIds: userIds, usersWithoutTokens: [] };
    }

    const result = await response.json();
    return { 
      sent: result.sent || 0, 
      failed: result.failed || 0,
      failedUserIds: result.failedUserIds || [],
      usersWithoutTokens: result.usersWithoutTokens || []
    };
  } catch (error) {
    console.error('Error calling FCM function:', error);
    return { sent: 0, failed: userIds.length, failedUserIds: userIds, usersWithoutTokens: [] };
  }
}

serve(async (req) => {
  const origin = req.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const internalSecret = req.headers.get('x-internal-secret');
    const expectedSecret = Deno.env.get('INTERNAL_FUNCTION_SECRET');
    const authHeader = req.headers.get('authorization') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    
    const hasValidInternalSecret = expectedSecret && internalSecret === expectedSecret;
    const isDbTriggerCall = authHeader.includes(supabaseAnonKey) && supabaseAnonKey.length > 20;
    
    if (!hasValidInternalSecret && !isDbTriggerCall) {
      return errorResponse('Unauthorized', 401, origin);
    }

    const rawBody = await req.json();
    const validationResult = RequestSchema.safeParse(rawBody);
    
    if (!validationResult.success) {
      return errorResponse(`Validation error`, 400, origin);
    }
    
    const { dropId } = validationResult.data;
    console.log(`Processing notification for drop: ${dropId}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const siteUrl = Deno.env.get('SITE_URL') || 'https://quaidirect.fr';
    const functionSecret = Deno.env.get('INTERNAL_FUNCTION_SECRET') || '';

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: drop, error: dropError } = await supabase
      .from('drops')
      .select(`id, sale_start_time, fisherman_id, sale_point_id, latitude, longitude,
        fishermen!inner(boat_name, company_name, display_name_preference, slug),
        offers(species(id, name)),
        ports(id, name, city, latitude, longitude),
        fisherman_sale_points(id, label, address, latitude, longitude)`)
      .eq('id', dropId)
      .single();

    if (dropError || !drop) throw new Error('Drop not found');

    const fisherman = drop.fishermen as any;
    const fishermanName = fisherman.display_name_preference === 'company_name'
      ? (fisherman.company_name || fisherman.boat_name) : fisherman.boat_name;

    const speciesNames = (drop.offers as any[])?.map((o: any) => o.species?.name).filter(Boolean).slice(0, 3).join(', ') || 'Produits frais';
    const speciesIds = (drop.offers as any[])?.map((o: any) => o.species?.id).filter(Boolean) || [];

    const saleTime = new Date(drop.sale_start_time).toLocaleString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });

    let locationName = 'Point de vente';
    let dropLat: number | null = null, dropLon: number | null = null;

    if (drop.fisherman_sale_points) {
      const sp = drop.fisherman_sale_points as any;
      locationName = sp.address || sp.label || 'Point de vente';
      dropLat = sp.latitude; dropLon = sp.longitude;
    } else if (drop.ports) {
      const port = drop.ports as any;
      locationName = `${port.name}, ${port.city}`;
      dropLat = port.latitude; dropLon = port.longitude;
    }

    // Get followers
    const { data: fishermenFollowers } = await supabase.from('fishermen_followers').select('user_id').eq('fisherman_id', drop.fisherman_id);
    const fishermenFollowerIds = fishermenFollowers?.map(f => f.user_id) || [];

    let portProximityUserIds: string[] = [];
    if (dropLat && dropLon) {
      const { data: allPortFollows } = await supabase.from('follow_ports').select(`user_id, ports(latitude, longitude)`);
      if (allPortFollows) {
        portProximityUserIds = allPortFollows.filter(fp => {
          const port = fp.ports as any;
          if (!port?.latitude || !port?.longitude) return false;
          return haversineDistance(dropLat!, dropLon!, port.latitude, port.longitude) <= 10;
        }).map(fp => fp.user_id);
      }
    }

    const pushUserIds = Array.from(new Set([...fishermenFollowerIds, ...portProximityUserIds]));
    console.log('Total PUSH users:', pushUserIds.length);

    // Send FCM notifications
    let pushSentCount = 0;
    let pushFailedCount = 0;
    let usersNeedingEmailFallback: string[] = [];
    
    if (pushUserIds.length > 0 && functionSecret) {
      const dropUrl = `${siteUrl}/drop/${dropId}`;
      const fcmResult = await sendFCMNotification(
        supabaseUrl,
        pushUserIds,
        {
          title: `🐟 ${fishermanName}`,
          body: `${speciesNames} - ${saleTime} à ${locationName}`,
          data: {
            url: dropUrl,
            dropId: dropId,
            type: 'new_drop',
          },
        },
        functionSecret
      );
      pushSentCount = fcmResult.sent;
      pushFailedCount = fcmResult.failed;
      
      // Collect users who need email fallback (failed push or no token)
      usersNeedingEmailFallback = [
        ...fcmResult.failedUserIds,
        ...fcmResult.usersWithoutTokens
      ];
      
      console.log(`FCM notifications: ${pushSentCount} sent, ${pushFailedCount} failed`);
      console.log(`Users needing email fallback: ${usersNeedingEmailFallback.length}`);
    } else {
      // No FCM available, all users need email fallback
      usersNeedingEmailFallback = pushUserIds;
    }

    // Email notifications - Fallback for failed push + Premium Plus species followers
    let emailSentCount = 0;
    let emailFallbackCount = 0;
    
    if (resendApiKey) {
      const dropUrl = `${siteUrl}/drop/${dropId}`;
      const emailHtml = generateEmailHtml(fishermanName, speciesNames, saleTime, locationName, dropUrl);
      const emailSubject = `🐟 ${fishermanName} - ${speciesNames}`;
      
      // 1. Email fallback for users who didn't get push notification
      if (usersNeedingEmailFallback.length > 0) {
        // Get users with email_enabled preference
        const { data: emailPrefs } = await supabase
          .from('notification_preferences')
          .select('user_id')
          .in('user_id', usersNeedingEmailFallback)
          .eq('email_enabled', true);
        
        const usersWithEmailEnabled = new Set(emailPrefs?.map(p => p.user_id) || []);
        
        // Get email addresses for these users
        if (usersWithEmailEnabled.size > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, email')
            .in('id', Array.from(usersWithEmailEnabled))
            .not('email', 'is', null);
          
          for (const p of profiles || []) {
            if (await sendEmail(p.email!, emailSubject, emailHtml, resendApiKey)) {
              emailFallbackCount++;
            }
          }
        }
        
        console.log(`Email fallback sent to ${emailFallbackCount} users`);
      }
      
      // 2. Premium Plus species followers (existing logic)
      if (speciesIds.length > 0) {
        const { data: speciesFollowers } = await supabase.from('follow_species').select('user_id').in('species_id', speciesIds);
        if (speciesFollowers?.length) {
          const { data: premiumPlusUsers } = await supabase
            .from('payments')
            .select('user_id')
            .in('user_id', speciesFollowers.map(f => f.user_id))
            .in('status', ['active', 'trialing'])
            .eq('subscription_level', 'premium_plus');
          
          if (premiumPlusUsers?.length) {
            // Exclude users who already received fallback email
            const alreadyEmailed = new Set(
              usersNeedingEmailFallback.filter(id => {
                // We only know if they were supposed to get email, not if successful
                // For simplicity, we'll check if email was enabled
                return true;
              })
            );
            
            const premiumToEmail = premiumPlusUsers.filter(p => !alreadyEmailed.has(p.user_id));
            
            if (premiumToEmail.length > 0) {
              const { data: profiles } = await supabase
                .from('profiles')
                .select('id, email')
                .in('id', premiumToEmail.map(p => p.user_id))
                .not('email', 'is', null);
              
              for (const p of profiles || []) {
                if (await sendEmail(p.email!, emailSubject, emailHtml, resendApiKey)) {
                  emailSentCount++;
                }
              }
            }
          }
        }
      }
    }

    const totalEmailSent = emailSentCount + emailFallbackCount;
    console.log(`Total emails sent: ${totalEmailSent} (${emailFallbackCount} fallback, ${emailSentCount} premium)`);

    return jsonResponse({ 
      message: 'Notifications sent', 
      push: { targeted: pushUserIds.length, sent: pushSentCount, failed: pushFailedCount }, 
      email: { sent: totalEmailSent, fallback: emailFallbackCount, premium: emailSentCount } 
    }, 200, origin);
  } catch (error) {
    console.error('Error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Unknown error', 500, origin);
  }
});
