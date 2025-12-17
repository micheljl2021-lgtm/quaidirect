import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const RequestSchema = z.object({
  dropId: z.string().uuid('dropId must be a valid UUID'),
});

// Haversine distance calculation (returns km)
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Simple VAPID header generation for Web Push
async function generateVAPIDHeaders(
  endpoint: string,
  publicKey: string,
  privateKey: string
): Promise<Record<string, string>> {
  const url = new URL(endpoint);
  
  return {
    'Authorization': `vapid t=${publicKey}, k=${privateKey}`,
    'Crypto-Key': `p256ecdsa=${publicKey}`,
  };
}

// Send email via Resend
async function sendEmail(
  to: string,
  subject: string,
  htmlContent: string,
  resendApiKey: string
): Promise<boolean> {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'QuaiDirect <notification@quaidirect.fr>',
        to: [to],
        subject,
        html: htmlContent,
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify internal secret to prevent unauthorized calls
    const internalSecret = req.headers.get('x-internal-secret');
    const expectedSecret = Deno.env.get('INTERNAL_FUNCTION_SECRET');
    
    if (!expectedSecret || internalSecret !== expectedSecret) {
      console.error('Unauthorized call to send-drop-notification');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate input with Zod
    const rawBody = await req.json();
    const validationResult = RequestSchema.safeParse(rawBody);
    
    if (!validationResult.success) {
      const errorMessages = validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      console.error('Validation failed:', errorMessages);
      return new Response(
        JSON.stringify({ error: `Validation error: ${errorMessages}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { dropId } = validationResult.data;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')!;
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const siteUrl = Deno.env.get('SITE_URL') || 'https://quaidirect.fr';

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch drop details with species and sale points
    const { data: drop, error: dropError } = await supabase
      .from('drops')
      .select(`
        id,
        sale_start_time,
        fisherman_id,
        sale_point_id,
        latitude,
        longitude,
        fishermen!inner(
          boat_name,
          company_name,
          display_name_preference,
          slug
        ),
        offers(
          species(
            id,
            name
          )
        ),
        ports(
          id,
          name,
          city,
          latitude,
          longitude
        ),
        fisherman_sale_points(
          id,
          label,
          address,
          latitude,
          longitude
        )
      `)
      .eq('id', dropId)
      .single();

    if (dropError || !drop) {
      console.error('Error fetching drop:', dropError);
      throw new Error('Drop not found');
    }

    // Extract species IDs from offers
    const speciesIds = (drop.offers as any[])
      ?.map((o: any) => o.species?.id)
      .filter(Boolean) || [];

    console.log('Drop species IDs:', speciesIds);

    // Prepare fisherman info
    const fisherman = drop.fishermen as any;
    const fishermanName = fisherman.display_name_preference === 'company_name'
      ? (fisherman.company_name || fisherman.boat_name)
      : fisherman.boat_name;

    const speciesNames = (drop.offers as any[])
      ?.map((o: any) => o.species?.name)
      .filter(Boolean)
      .slice(0, 3)
      .join(', ') || 'Produits frais';

    const saleTime = new Date(drop.sale_start_time).toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Determine location info
    let locationName = 'Point de vente';
    let dropLat: number | null = null;
    let dropLon: number | null = null;

    if (drop.fisherman_sale_points) {
      const sp = drop.fisherman_sale_points as any;
      locationName = sp.address || sp.label || 'Point de vente';
      dropLat = sp.latitude;
      dropLon = sp.longitude;
    } else if (drop.ports) {
      const port = drop.ports as any;
      locationName = `${port.name}, ${port.city}`;
      dropLat = port.latitude;
      dropLon = port.longitude;
    }

    // ============================================
    // 1. PUSH NOTIFICATIONS - Fisherman followers
    // ============================================
    const { data: fishermenFollowers } = await supabase
      .from('fishermen_followers')
      .select('user_id')
      .eq('fisherman_id', drop.fisherman_id);

    const fishermenFollowerIds = fishermenFollowers?.map(f => f.user_id) || [];
    console.log('Fisherman followers:', fishermenFollowerIds.length);

    // ============================================
    // 2. PUSH NOTIFICATIONS - Port proximity (< 10km)
    // ============================================
    let portProximityUserIds: string[] = [];
    
    if (dropLat && dropLon) {
      // Get all ports and their followers
      const { data: allPortFollows } = await supabase
        .from('follow_ports')
        .select(`
          user_id,
          ports(
            latitude,
            longitude
          )
        `);

      if (allPortFollows) {
        portProximityUserIds = allPortFollows
          .filter(fp => {
            const port = fp.ports as any;
            if (!port?.latitude || !port?.longitude) return false;
            const distance = haversineDistance(dropLat!, dropLon!, port.latitude, port.longitude);
            return distance <= 10; // 10km radius
          })
          .map(fp => fp.user_id);
      }
      console.log('Port proximity users (< 10km):', portProximityUserIds.length);
    }

    // Combine PUSH notification user IDs (unique)
    const pushUserIds = Array.from(new Set([...fishermenFollowerIds, ...portProximityUserIds]));
    console.log('Total PUSH users:', pushUserIds.length);

    // ============================================
    // 3. EMAIL - Followed sale points (Premium/Premium+)
    // ============================================
    let salePointEmailUsers: { user_id: string; email: string }[] = [];
    
    if (drop.sale_point_id) {
      const { data: salePointFollowers } = await supabase
        .from('client_follow_sale_points')
        .select('user_id')
        .eq('sale_point_id', drop.sale_point_id);

      if (salePointFollowers && salePointFollowers.length > 0) {
        // Get user emails and verify Premium/Premium+ status
        const spUserIds = salePointFollowers.map(f => f.user_id);
        
        const { data: premiumUsers } = await supabase
          .from('payments')
          .select('user_id')
          .in('user_id', spUserIds)
          .in('status', ['active', 'trialing'])
          .in('subscription_level', ['premium', 'premium_plus']);

        if (premiumUsers) {
          const premiumUserIds = premiumUsers.map(p => p.user_id);
          
          // Get emails from profiles
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, email')
            .in('id', premiumUserIds)
            .not('email', 'is', null);

          salePointEmailUsers = profiles?.map(p => ({ user_id: p.id, email: p.email! })) || [];
        }
      }
    }
    console.log('Sale point email users (Premium/Premium+):', salePointEmailUsers.length);

    // ============================================
    // 4. EMAIL - Favorite species (Premium+ ONLY)
    // ============================================
    let speciesEmailUsers: { user_id: string; email: string }[] = [];
    
    if (speciesIds.length > 0) {
      // Get users following these species
      const { data: speciesFollowers } = await supabase
        .from('follow_species')
        .select('user_id')
        .in('species_id', speciesIds);

      if (speciesFollowers && speciesFollowers.length > 0) {
        const spFollowerIds = speciesFollowers.map(f => f.user_id);
        
        // Only Premium+ users get species email notifications
        const { data: premiumPlusUsers } = await supabase
          .from('payments')
          .select('user_id')
          .in('user_id', spFollowerIds)
          .in('status', ['active', 'trialing'])
          .eq('subscription_level', 'premium_plus');

        if (premiumPlusUsers) {
          const premiumPlusUserIds = premiumPlusUsers.map(p => p.user_id);
          
          // Get emails from profiles
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, email')
            .in('id', premiumPlusUserIds)
            .not('email', 'is', null);

          speciesEmailUsers = profiles?.map(p => ({ user_id: p.id, email: p.email! })) || [];
        }
      }
    }
    console.log('Species email users (Premium+ only):', speciesEmailUsers.length);

    // ============================================
    // SEND PUSH NOTIFICATIONS
    // ============================================
    let pushSentCount = 0;
    
    if (pushUserIds.length > 0) {
      const { data: subscriptions } = await supabase
        .from('push_subscriptions')
        .select('*')
        .in('user_id', pushUserIds);

      if (subscriptions && subscriptions.length > 0) {
        const notificationPayload = {
          title: `🐟 Nouvel arrivage de ${fishermanName}`,
          body: `${speciesNames} - Vente le ${saleTime} à ${locationName}`,
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          data: {
            url: `/drop/${dropId}`,
            dropId,
          },
        };

        const sendPromises = subscriptions.map(async (sub) => {
          try {
            const vapidHeaders = await generateVAPIDHeaders(
              sub.endpoint,
              vapidPublicKey,
              vapidPrivateKey
            );

            const response = await fetch(sub.endpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': vapidHeaders.Authorization,
                'Crypto-Key': vapidHeaders['Crypto-Key'],
              },
              body: JSON.stringify(notificationPayload),
            });

            if (!response.ok) {
              throw new Error(`Push failed: ${response.status}`);
            }

            console.log(`Push sent to user ${sub.user_id}`);
            return true;
          } catch (error) {
            console.error(`Failed push to ${sub.user_id}:`, error);
            return false;
          }
        });

        const results = await Promise.all(sendPromises);
        pushSentCount = results.filter(Boolean).length;
      }
    }
    console.log(`Push notifications sent: ${pushSentCount}`);

    // ============================================
    // SEND EMAIL NOTIFICATIONS
    // ============================================
    let emailSentCount = 0;
    
    if (resendApiKey) {
      // Combine all email recipients (unique by email)
      const allEmailUsers = [...salePointEmailUsers, ...speciesEmailUsers];
      const uniqueEmails = Array.from(new Map(allEmailUsers.map(u => [u.email, u])).values());

      if (uniqueEmails.length > 0) {
        const dropUrl = `${siteUrl}/drop/${dropId}`;
        const fishermanUrl = fisherman.slug ? `${siteUrl}/p/${fisherman.slug}` : null;

        const emailSubject = `🐟 Nouvel arrivage : ${fishermanName} - ${speciesNames}`;
        
        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1a1a2e; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="${siteUrl}/logo-quaidirect.png" alt="QuaiDirect" style="height: 50px;" />
  </div>
  
  <div style="background: linear-gradient(135deg, #0077b6 0%, #00b4d8 100%); color: white; padding: 30px; border-radius: 12px; margin-bottom: 20px;">
    <h1 style="margin: 0 0 10px 0; font-size: 24px;">🐟 Nouvel arrivage !</h1>
    <p style="margin: 0; font-size: 18px; opacity: 0.9;">${fishermanName}</p>
  </div>

  <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
    <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #1a1a2e;">📦 Détails de l'arrivage</h2>
    <p style="margin: 5px 0;"><strong>Espèces :</strong> ${speciesNames}</p>
    <p style="margin: 5px 0;"><strong>Vente :</strong> ${saleTime}</p>
    <p style="margin: 5px 0;"><strong>Lieu :</strong> ${locationName}</p>
  </div>

  <div style="text-align: center; margin: 30px 0;">
    <a href="${dropUrl}" style="display: inline-block; background: #0077b6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
      Voir l'arrivage →
    </a>
  </div>

  ${fishermanUrl ? `
  <p style="text-align: center; color: #666; font-size: 14px;">
    <a href="${fishermanUrl}" style="color: #0077b6;">Voir le profil de ${fishermanName}</a>
  </p>
  ` : ''}

  <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;" />
  
  <p style="color: #999; font-size: 12px; text-align: center;">
    Vous recevez cet email car vous suivez ce point de vente ou ces espèces sur QuaiDirect.<br />
    <a href="${siteUrl}/dashboard/premium" style="color: #0077b6;">Gérer mes préférences</a>
  </p>
</body>
</html>
        `;

        for (const user of uniqueEmails) {
          const sent = await sendEmail(user.email, emailSubject, emailHtml, resendApiKey);
          if (sent) emailSentCount++;
        }
      }
    } else {
      console.log('RESEND_API_KEY not configured, skipping email notifications');
    }
    console.log(`Email notifications sent: ${emailSentCount}`);

    return new Response(
      JSON.stringify({
        message: 'Notifications sent',
        push: {
          targeted: pushUserIds.length,
          sent: pushSentCount,
        },
        email: {
          salePointUsers: salePointEmailUsers.length,
          speciesUsers: speciesEmailUsers.length,
          sent: emailSentCount,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in send-drop-notification:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
