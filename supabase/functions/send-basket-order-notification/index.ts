import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-BASKET-ORDER-NOTIFICATION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify internal secret for webhook calls
    const internalSecret = req.headers.get('x-internal-secret');
    const expectedSecret = Deno.env.get('INTERNAL_FUNCTION_SECRET');
    
    if (!expectedSecret || internalSecret !== expectedSecret) {
      logStep('ERROR', 'Unauthorized: Invalid or missing internal secret');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (authError) {
    logStep('ERROR', 'Authentication check failed');
    return new Response(JSON.stringify({ error: 'Authentication failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } }
  );

  try {
    logStep('Function started');

    const { orderId } = await req.json();
    if (!orderId) throw new Error('Missing orderId');
    logStep('Order ID received', { orderId });

    // Get order details with basket, fisherman, drop, ports AND sale_points
    const { data: order, error: orderError } = await supabaseClient
      .from('basket_orders')
      .select(`
        *,
        client_baskets(name, price_cents, weight_kg),
        fishermen!basket_orders_fisherman_id_fkey(boat_name, company_name, user_id),
        drops(sale_start_time, ports(name, city), fisherman_sale_points(label, address))
      `)
      .eq('id', orderId)
      .single();

    if (orderError) throw orderError;
    if (!order) throw new Error('Order not found');
    logStep('Order details retrieved', { orderId });

    // Validate fisherman data
    if (!order.fishermen?.user_id) {
      throw new Error('Fisherman user_id not found in order');
    }

    // Get fisherman's email from auth.users
    const { data: { user: fishermanUser }, error: userError } = await supabaseClient.auth.admin.getUserById(
      order.fishermen.user_id
    );

    if (userError) throw userError;
    if (!fishermanUser?.email) throw new Error('Fisherman email not found');
    logStep('Fisherman email retrieved', { email: fishermanUser.email });

    // Get customer email
    const { data: { user: customerUser }, error: customerError } = await supabaseClient.auth.admin.getUserById(
      order.user_id
    );

    if (customerError) {
      logStep('WARNING: Could not retrieve customer user', { error: customerError });
    }
    const customerEmail = customerUser?.email || 'Client inconnu';

    // Build pickup location with fallback logic (sale_point > port > default)
    let pickupLocation = 'Point de vente à confirmer';
    if (order.drops?.fisherman_sale_points) {
      pickupLocation = order.drops.fisherman_sale_points.address || order.drops.fisherman_sale_points.label || pickupLocation;
    } else if (order.drops?.ports) {
      pickupLocation = `${order.drops.ports.name} - ${order.drops.ports.city}`;
    }

    // Format date with null safety
    let pickupDate = 'Horaire à confirmer';
    if (order.drops?.sale_start_time) {
      pickupDate = new Date(order.drops.sale_start_time).toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    // Basket info with null safety
    const basketName = order.client_baskets?.name || 'Panier';
    const basketWeight = order.client_baskets?.weight_kg || 0;
    const totalPrice = (order.total_price_cents / 100).toFixed(2);

    const emailResponse = await resend.emails.send({
      from: "QuaiDirect <support@quaidirect.fr>",
      to: [fishermanUser.email],
      subject: `Nouvelle commande panier : ${basketName}`,
      html: `
        <h1>📦 Nouvelle commande de panier !</h1>
        
        <h2>Détails de la commande :</h2>
        <ul>
          <li><strong>Panier :</strong> ${escapeHtml(basketName)}</li>
          <li><strong>Poids indicatif :</strong> ~${basketWeight}kg</li>
          <li><strong>Prix :</strong> ${totalPrice}€</li>
          <li><strong>Client :</strong> ${escapeHtml(customerEmail)}</li>
        </ul>

        <h2>📍 Retrait :</h2>
        <ul>
          <li><strong>Lieu :</strong> ${escapeHtml(pickupLocation)}</li>
          <li><strong>Date et heure :</strong> ${escapeHtml(pickupDate)}</li>
        </ul>

        ${order.notes ? `<p><strong>Notes du client :</strong> ${escapeHtml(order.notes)}</p>` : ''}

        <p style="margin-top: 30px;">
          <a href="${Deno.env.get('SITE_URL') || 'https://quaidirect.fr'}/dashboard/pecheur" 
             style="background: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Voir mes commandes
          </a>
        </p>

        <p style="margin-top: 30px; color: #666;">
          Cette notification est envoyée automatiquement.<br>
          L'équipe QuaiDirect
        </p>
      `,
    });

    logStep('Notification email sent', { emailResponse });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    logStep('ERROR', { message: error.message });
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
