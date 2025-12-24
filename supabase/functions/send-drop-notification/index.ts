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

// Recipient interface for deduplication
interface Recipient {
  userId: string;
  email?: string;
  firstName?: string;
  sources: Set<string>; // 'follower' | 'species' | 'port' | 'sale_point'
}

// Generate improved email HTML template with personalization
function generateEmailHtml(
  fishermanName: string,
  speciesNames: string,
  saleTime: string,
  locationName: string,
  dropUrl: string,
  recipientFirstName?: string,
  notificationSources?: string[]
): string {
  const greeting = recipientFirstName 
    ? `Bonjour ${recipientFirstName},`
    : 'Bonjour,';

  // Build the reason based on sources
  let reason = '';
  if (notificationSources?.includes('follower')) {
    reason = `Vous suivez ${fishermanName} sur QuaiDirect`;
  } else if (notificationSources?.includes('species')) {
    reason = `Vous avez choisi de suivre ces espèces favorites`;
  } else if (notificationSources?.includes('port') || notificationSources?.includes('sale_point')) {
    reason = `Arrivage près de votre port favori`;
  }

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
              ${reason ? `<p style="margin: 12px 0 0; font-size: 14px; color: rgba(255,255,255,0.9);">${reason}</p>` : ''}
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 20px; font-size: 16px; color: #3f3f46;">
                ${greeting}
              </p>
              
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
                <a href="https://quaidirect.fr/compte" style="color: #0ea5e9; text-decoration: none;">Gérer mes préférences de notifications</a>
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

// Send email via Resend with improved headers
async function sendEmail(
  to: string, 
  subject: string, 
  htmlContent: string, 
  resendApiKey: string,
  fishermanName: string
): Promise<boolean> {
  try {
    const fromName = fishermanName ? `${fishermanName} via QuaiDirect` : 'QuaiDirect';
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${resendApiKey}`, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ 
        from: `${fromName} <notification@quaidirect.fr>`, 
        to: [to], 
        subject, 
        html: htmlContent,
        headers: {
          'List-Unsubscribe': '<https://quaidirect.fr/compte>',
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        }
      }),
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

// Record sent notifications to avoid duplicates
async function recordSentNotifications(
  supabase: any,
  dropId: string,
  notifications: Array<{ userId?: string; email?: string; channel: string; source: string }>
): Promise<void> {
  if (notifications.length === 0) return;
  
  const records = notifications.map(n => ({
    drop_id: dropId,
    user_id: n.userId || null,
    email: n.email || null,
    channel: n.channel,
    notification_source: n.source,
  }));

  // Insert with ignore duplicates - the unique indexes handle conflicts
  const { error } = await supabase
    .from('drop_notifications_sent')
    .insert(records)
    .select();

  if (error) {
    console.error('Error recording sent notifications:', error);
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

    // Check if notifications were already sent for this drop
    const { data: existingNotifications } = await supabase
      .from('drop_notifications_sent')
      .select('user_id, email, channel')
      .eq('drop_id', dropId);
    
    const alreadyNotifiedUsers = new Set<string>();
    const alreadyNotifiedEmails = new Set<string>();
    
    existingNotifications?.forEach(n => {
      if (n.user_id) alreadyNotifiedUsers.add(`${n.user_id}-${n.channel}`);
      if (n.email) alreadyNotifiedEmails.add(`${n.email}-${n.channel}`);
    });
    
    console.log(`Already notified: ${alreadyNotifiedUsers.size} users, ${alreadyNotifiedEmails.size} emails`);

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

    // Get ALL species for this drop (not just first 3)
    const allSpeciesNames = (drop.offers as any[])?.map((o: any) => o.species?.name).filter(Boolean) || [];
    const speciesNamesDisplay = allSpeciesNames.length > 3 
      ? allSpeciesNames.slice(0, 3).join(', ') + ` +${allSpeciesNames.length - 3}`
      : allSpeciesNames.join(', ') || 'Produits frais';
    const speciesIds = (drop.offers as any[])?.map((o: any) => o.species?.id).filter(Boolean) || [];

    const saleTime = new Date(drop.sale_start_time).toLocaleString('fr-FR', { 
      weekday: 'long',
      day: 'numeric', 
      month: 'long', 
      hour: '2-digit', 
      minute: '2-digit' 
    });

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

    const dropUrl = `${siteUrl}/drop/${dropId}`;

    // ========== COLLECT ALL RECIPIENTS WITH DEDUPLICATION ==========
    const recipientMap = new Map<string, Recipient>();

    // 1. Fisherman followers
    const { data: fishermenFollowers } = await supabase
      .from('fishermen_followers')
      .select('user_id')
      .eq('fisherman_id', drop.fisherman_id);
    
    for (const f of fishermenFollowers || []) {
      if (!recipientMap.has(f.user_id)) {
        recipientMap.set(f.user_id, { userId: f.user_id, sources: new Set(['follower']) });
      } else {
        recipientMap.get(f.user_id)!.sources.add('follower');
      }
    }
    console.log(`Fisherman followers: ${fishermenFollowers?.length || 0}`);

    // 2. Port proximity followers (within 10km)
    if (dropLat && dropLon) {
      const { data: allPortFollows } = await supabase
        .from('follow_ports')
        .select(`user_id, ports(latitude, longitude)`);
      
      if (allPortFollows) {
        for (const fp of allPortFollows) {
          const port = fp.ports as any;
          if (!port?.latitude || !port?.longitude) continue;
          if (haversineDistance(dropLat, dropLon, port.latitude, port.longitude) <= 10) {
            if (!recipientMap.has(fp.user_id)) {
              recipientMap.set(fp.user_id, { userId: fp.user_id, sources: new Set(['port']) });
            } else {
              recipientMap.get(fp.user_id)!.sources.add('port');
            }
          }
        }
      }
    }

    // 3. Sale point followers
    if (drop.sale_point_id) {
      const { data: salePointFollowers } = await supabase
        .from('client_follow_sale_points')
        .select('user_id')
        .eq('sale_point_id', drop.sale_point_id);
      
      for (const sp of salePointFollowers || []) {
        if (!recipientMap.has(sp.user_id)) {
          recipientMap.set(sp.user_id, { userId: sp.user_id, sources: new Set(['sale_point']) });
        } else {
          recipientMap.get(sp.user_id)!.sources.add('sale_point');
        }
      }
    }

    // 4. Species followers (Premium Plus only)
    if (speciesIds.length > 0) {
      const { data: speciesFollowers } = await supabase
        .from('follow_species')
        .select('user_id')
        .in('species_id', speciesIds);
      
      if (speciesFollowers?.length) {
        // Check if they have premium_plus
        const { data: premiumPlusUsers } = await supabase
          .from('payments')
          .select('user_id')
          .in('user_id', speciesFollowers.map(f => f.user_id))
          .in('status', ['active', 'trialing'])
          .eq('subscription_level', 'premium_plus');
        
        const premiumPlusUserIds = new Set(premiumPlusUsers?.map(p => p.user_id) || []);
        
        for (const sf of speciesFollowers) {
          if (premiumPlusUserIds.has(sf.user_id)) {
            if (!recipientMap.has(sf.user_id)) {
              recipientMap.set(sf.user_id, { userId: sf.user_id, sources: new Set(['species']) });
            } else {
              recipientMap.get(sf.user_id)!.sources.add('species');
            }
          }
        }
      }
    }

    console.log(`Total unique recipients after deduplication: ${recipientMap.size}`);

    // Get user profiles with emails and names
    const userIds = Array.from(recipientMap.keys());
    
    if (userIds.length === 0) {
      console.log('No recipients to notify');
      return jsonResponse({ 
        message: 'No recipients', 
        push: { targeted: 0, sent: 0, failed: 0 }, 
        email: { sent: 0 } 
      }, 200, origin);
    }

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .in('id', userIds);

    // Enrich recipients with profile data
    for (const profile of profiles || []) {
      if (recipientMap.has(profile.id)) {
        const recipient = recipientMap.get(profile.id)!;
        recipient.email = profile.email;
        recipient.firstName = profile.full_name?.split(' ')[0];
      }
    }

    // Filter out already notified users
    const newRecipients = Array.from(recipientMap.values()).filter(r => {
      const pushKey = `${r.userId}-push`;
      const emailKey = `${r.userId}-email`;
      return !alreadyNotifiedUsers.has(pushKey) && !alreadyNotifiedUsers.has(emailKey);
    });

    console.log(`New recipients (not already notified): ${newRecipients.length}`);

    // ========== SEND PUSH NOTIFICATIONS ==========
    let pushSentCount = 0;
    let pushFailedCount = 0;
    const usersNeedingEmailFallback: string[] = [];

    if (newRecipients.length > 0 && functionSecret) {
      const pushUserIds = newRecipients.map(r => r.userId);
      
      const fcmResult = await sendFCMNotification(
        supabaseUrl,
        pushUserIds,
        {
          title: `🐟 ${fishermanName}`,
          body: `${speciesNamesDisplay} - ${saleTime} à ${locationName}`,
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
      
      // Track push notifications sent
      const pushNotificationRecords = pushUserIds
        .filter(id => !fcmResult.failedUserIds.includes(id) && !fcmResult.usersWithoutTokens.includes(id))
        .map(userId => {
          const recipient = recipientMap.get(userId)!;
          const primarySource = Array.from(recipient.sources)[0];
          return { userId, channel: 'push', source: primarySource };
        });
      
      await recordSentNotifications(supabase, dropId, pushNotificationRecords);

      // Collect users who need email fallback
      usersNeedingEmailFallback.push(...fcmResult.failedUserIds, ...fcmResult.usersWithoutTokens);
      
      console.log(`FCM: ${pushSentCount} sent, ${pushFailedCount} failed, ${usersNeedingEmailFallback.length} need email fallback`);
    } else {
      // No FCM available, all users need email
      usersNeedingEmailFallback.push(...newRecipients.map(r => r.userId));
    }

    // ========== SEND EMAIL NOTIFICATIONS ==========
    let emailSentCount = 0;
    
    if (resendApiKey && usersNeedingEmailFallback.length > 0) {
      // Get notification preferences for email-enabled users
      const { data: emailPrefs } = await supabase
        .from('notification_preferences')
        .select('user_id')
        .in('user_id', usersNeedingEmailFallback)
        .eq('email_enabled', true);
      
      const usersWithEmailEnabled = new Set(emailPrefs?.map(p => p.user_id) || []);
      
      // Also include users who don't have preferences set (default to email enabled)
      const usersWithoutPrefs = usersNeedingEmailFallback.filter(id => !usersWithEmailEnabled.has(id));
      const { data: usersWithPrefsSet } = await supabase
        .from('notification_preferences')
        .select('user_id')
        .in('user_id', usersWithoutPrefs);
      
      const usersWithPrefsSetIds = new Set(usersWithPrefsSet?.map(p => p.user_id) || []);
      
      // Users who need email: either email_enabled=true OR no preferences set
      const usersToEmail = usersNeedingEmailFallback.filter(id => 
        usersWithEmailEnabled.has(id) || !usersWithPrefsSetIds.has(id)
      );

      console.log(`Users to email: ${usersToEmail.length}`);

      const emailNotificationRecords: Array<{ userId: string; email?: string; channel: string; source: string }> = [];
      const emailSubject = `🐟 ${fishermanName} - ${speciesNamesDisplay}`;

      for (const userId of usersToEmail) {
        const recipient = recipientMap.get(userId);
        if (!recipient?.email) continue;

        // Skip if already emailed for this drop
        if (alreadyNotifiedEmails.has(`${recipient.email}-email`)) continue;

        const sources = Array.from(recipient.sources);
        const emailHtml = generateEmailHtml(
          fishermanName,
          allSpeciesNames.join(', ') || 'Produits frais',
          saleTime,
          locationName,
          dropUrl,
          recipient.firstName,
          sources
        );

        const success = await sendEmail(
          recipient.email, 
          emailSubject, 
          emailHtml, 
          resendApiKey,
          fishermanName
        );

        if (success) {
          emailSentCount++;
          emailNotificationRecords.push({ 
            userId, 
            email: recipient.email, 
            channel: 'email', 
            source: sources[0] 
          });
        }
      }

      // Record email notifications sent
      await recordSentNotifications(supabase, dropId, emailNotificationRecords);
    }

    console.log(`Total: ${pushSentCount} push, ${emailSentCount} emails sent`);

    return jsonResponse({ 
      message: 'Notifications sent', 
      push: { targeted: newRecipients.length, sent: pushSentCount, failed: pushFailedCount }, 
      email: { sent: emailSentCount },
      duplicates_prevented: alreadyNotifiedUsers.size + alreadyNotifiedEmails.size
    }, 200, origin);
  } catch (error) {
    console.error('Error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Unknown error', 500, origin);
  }
});
