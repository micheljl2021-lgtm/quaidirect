import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple VAPID header generation for Web Push
async function generateVAPIDHeaders(
  endpoint: string,
  publicKey: string,
  privateKey: string
): Promise<Record<string, string>> {
  const url = new URL(endpoint);
  const audience = `${url.protocol}//${url.host}`;
  
  const header = {
    typ: 'JWT',
    alg: 'ES256',
  };
  
  const jwtPayload = {
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 43200,
    sub: 'mailto:contact@quaidirect.fr',
  };
  
  return {
    'Authorization': `vapid t=${publicKey}, k=${privateKey}`,
    'Crypto-Key': `p256ecdsa=${publicKey}`,
  };
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

    const { dropId } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')!;
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch drop details with species
    const { data: drop, error: dropError } = await supabase
      .from('drops')
      .select(`
        id,
        sale_start_time,
        fisherman_id,
        fishermen!inner(
          boat_name,
          company_name,
          display_name_preference
        ),
        offers(
          species(
            id,
            name
          )
        ),
        ports(
          name,
          city
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

    // Get Premium users who follow these species
    const { data: premiumFollowers, error: followersError } = await supabase
      .from('follow_species')
      .select(`
        user_id,
        user_roles!inner(role)
      `)
      .in('species_id', speciesIds)
      .eq('user_roles.role', 'premium');

    if (followersError) {
      console.error('Error fetching premium followers:', followersError);
    }

    const premiumUserIds = premiumFollowers?.map(f => f.user_id) || [];
    console.log('Premium users to notify:', premiumUserIds.length);

    // Also get regular fisherman followers
    const { data: fishermenFollowers, error: fishermenFollowersError } = await supabase
      .from('fishermen_followers')
      .select('user_id')
      .eq('fisherman_id', drop.fisherman_id);

    if (fishermenFollowersError) {
      console.error('Error fetching fishermen followers:', fishermenFollowersError);
    }

    const fishermenFollowerIds = fishermenFollowers?.map(f => f.user_id) || [];

    // Combine both lists (unique users)
    const allUserIds = Array.from(new Set([...premiumUserIds, ...fishermenFollowerIds]));
    console.log('Total users to notify:', allUserIds.length);

    if (allUserIds.length === 0) {
      console.log('No users to notify');
      return new Response(JSON.stringify({ message: 'No users to notify' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get push subscriptions for these users
    const { data: subscriptions, error: subsError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .in('user_id', allUserIds);

    if (subsError) {
      console.error('Error fetching subscriptions:', subsError);
      throw subsError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('No push subscriptions found');
      return new Response(JSON.stringify({ message: 'No subscriptions to notify' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Prepare notification data
    const fisherman = drop.fishermen as any;
    const port = drop.ports as any;
    
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

    const portName = `${port.name}, ${port.city}`;

    const notificationPayload = {
      title: `🐟 Nouvel arrivage de ${fishermanName}`,
      body: `${speciesNames} - Vente le ${saleTime} à ${portName}`,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: {
        url: `/arrivages?drop=${dropId}`,
        dropId,
      },
    };

    // Send push notifications using Web Push Protocol
    const sendPromises = subscriptions.map(async (sub) => {
      try {
        // Generate VAPID auth headers
        const vapidHeaders = await generateVAPIDHeaders(
          sub.endpoint,
          vapidPublicKey,
          vapidPrivateKey
        );

        // Send push notification via HTTP
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
          throw new Error(`Push failed: ${response.status} ${response.statusText}`);
        }

        console.log(`Notification sent to user ${sub.user_id}`);
        return { success: true, userId: sub.user_id };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Failed to send notification to user ${sub.user_id}:`, errorMessage);
        return { success: false, userId: sub.user_id, error: errorMessage };
      }
    });

    const results = await Promise.all(sendPromises);
    const successCount = results.filter(r => r.success).length;

    console.log(`Sent ${successCount}/${subscriptions.length} notifications`);

    return new Response(
      JSON.stringify({
        message: 'Notifications sent',
        sent: successCount,
        total: subscriptions.length,
        results,
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
