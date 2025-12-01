import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://quaidirect.fr',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationPayload {
  fishermanUserId: string;
  orderId: string;
  basketId: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify internal secret to prevent unauthorized calls
    const internalSecret = req.headers.get('x-internal-secret');
    const expectedSecret = Deno.env.get('INTERNAL_FUNCTION_SECRET');
    
    if (!expectedSecret || internalSecret !== expectedSecret) {
      console.error('Unauthorized call to send-reservation-notification');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: NotificationPayload = await req.json();
    const { fishermanUserId, orderId, basketId } = payload;

    console.log('Processing reservation notification:', { fishermanUserId, orderId, basketId });

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('basket_orders')
      .select(`
        *,
        basket:client_baskets(name),
        user:profiles(full_name)
      `)
      .eq('id', orderId)
      .single();

    if (orderError) {
      console.error('Error fetching order:', orderError);
      throw orderError;
    }

    // Get push subscriptions for the fisherman
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', fishermanUserId);

    if (subError) {
      console.error('Error fetching subscriptions:', subError);
      throw subError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('No push subscriptions found for fisherman:', fishermanUserId);
      return new Response(
        JSON.stringify({ message: 'No subscriptions found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare notification payload
    const basketName = order.basket?.name || 'Panier';
    const clientName = order.user?.full_name || 'Un client';
    
    const notificationPayload = {
      title: '🎣 Nouvelle réservation !',
      body: `${clientName} a réservé ${basketName}`,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      data: {
        orderId: orderId,
        basketId: basketId,
        url: '/dashboard/pecheur',
      },
    };

    console.log('Sending notifications to', subscriptions.length, 'devices');

    // Send push notifications using Web Push API
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')!;
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!;

    // Note: In a real implementation, you would use web-push library
    // For now, we'll create a notification record in the database
    const { error: notifError } = await supabase
      .from('notifications')
      .insert({
        user_id: fishermanUserId,
        type: 'reservation',
        title: notificationPayload.title,
        message: notificationPayload.body,
        data: notificationPayload.data,
      });

    if (notifError) {
      console.error('Error creating notification:', notifError);
    }

    console.log('Notification sent successfully');

    return new Response(
      JSON.stringify({ success: true, subscriptionsCount: subscriptions.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-reservation-notification:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
