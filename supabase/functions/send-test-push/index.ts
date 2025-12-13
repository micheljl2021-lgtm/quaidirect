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
    // Get user from JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')!;
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!;

    if (!vapidPublicKey || !vapidPrivateKey) {
      return new Response(
        JSON.stringify({ error: 'VAPID keys not configured' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Create Supabase client with user's JWT
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`[Push Test] Sending test notification to user ${user.id}`);

    // Get user's push subscriptions
    const { data: subscriptions, error: subError } = await supabaseClient
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', user.id);

    if (subError) {
      console.error('[Push Test] Error fetching subscriptions:', subError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch subscriptions' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('[Push Test] No subscriptions found for user');
      return new Response(
        JSON.stringify({ error: 'No push subscriptions found' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Create test notification payload
    const notificationPayload = {
      title: '🔔 Notification de test',
      body: 'Si vous voyez ce message, les notifications push fonctionnent correctement !',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: {
        url: '/push-diagnostic',
        test: true,
        timestamp: new Date().toISOString(),
      },
    };

    // Send push notifications to all user subscriptions
    const sendPromises = subscriptions.map(async (sub) => {
      try {
        console.log(`[Push Test] Sending to endpoint: ${sub.endpoint.substring(0, 50)}...`);

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

        console.log(`[Push Test] Notification sent successfully`);
        return { success: true, endpoint: sub.endpoint };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[Push Test] Failed to send notification:`, errorMessage);
        return { success: false, endpoint: sub.endpoint, error: errorMessage };
      }
    });

    const results = await Promise.all(sendPromises);
    const successCount = results.filter(r => r.success).length;

    console.log(`[Push Test] Sent ${successCount}/${subscriptions.length} test notifications`);

    return new Response(
      JSON.stringify({
        message: 'Test notifications sent',
        sent: successCount,
        total: subscriptions.length,
        results: results.map(r => ({
          success: r.success,
          error: r.success ? undefined : r.error,
        })),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Push Test] Error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
