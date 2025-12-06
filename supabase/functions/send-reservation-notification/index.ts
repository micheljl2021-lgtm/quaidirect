import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

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

    // Get push subscriptions for the fisherman
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', fishermanUserId);

    if (subError) {
      console.error('Error fetching subscriptions:', subError);
    }

    const subscriptionsCount = subscriptions?.length || 0;
    console.log('Found', subscriptionsCount, 'push subscriptions for fisherman:', fishermanUserId);

    // Create notification record in database
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

    // Send email to fisherman
    const { data: fishermanData } = await supabase
      .from('fishermen')
      .select('email')
      .eq('user_id', fishermanUserId)
      .single();

    // Fallback to auth user email if fisherman email not set
    let fishermanEmail = fishermanData?.email;
    if (!fishermanEmail) {
      const { data: { user: authUser } } = await supabase.auth.admin.getUserById(fishermanUserId);
      fishermanEmail = authUser?.email;
    }

    if (fishermanEmail) {
      const safeBasketName = escapeHtml(basketName);
      const safeClientName = escapeHtml(clientName);
      const totalPriceFormatted = order.total_price_cents 
        ? `${(order.total_price_cents / 100).toFixed(2)}€` 
        : '';
      
      try {
        await resend.emails.send({
          from: 'QuaiDirect <support@quaidirect.fr>',
          to: [fishermanEmail],
          subject: `🎣 Nouvelle réservation : ${safeBasketName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #0066cc;">Nouvelle réservation !</h1>
              <p><strong>${safeClientName}</strong> a réservé un <strong>${safeBasketName}</strong>${totalPriceFormatted ? ` (${totalPriceFormatted})` : ''}.</p>
              <p>Rendez-vous sur votre dashboard pour voir les détails de la commande :</p>
              <p style="text-align: center; margin: 30px 0;">
                <a href="https://quaidirect.fr/dashboard/pecheur" 
                   style="background: #0066cc; color: white; padding: 14px 28px; 
                          text-decoration: none; border-radius: 6px; display: inline-block;">
                  Voir la commande
                </a>
              </p>
              <p style="color: #666;">Bonne pêche !<br>L'équipe QuaiDirect</p>
            </div>
          `
        });
        console.log(`Email sent to fisherman ${fishermanEmail}`);
      } catch (emailError) {
        console.error('Error sending email to fisherman:', emailError);
        // Continue even if email fails - notification was already created
      }
    } else {
      console.log('No email found for fisherman:', fishermanUserId);
    }

    console.log('Notification sent successfully');

    return new Response(
      JSON.stringify({ success: true, subscriptionsCount, emailSent: !!fishermanEmail }),
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
