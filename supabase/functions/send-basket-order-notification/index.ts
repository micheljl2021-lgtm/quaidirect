import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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

    // Get order details with basket, fisherman, drop, and user info
    const { data: order, error: orderError } = await supabaseClient
      .from('basket_orders')
      .select(`
        *,
        client_baskets(name, price_cents, weight_kg),
        fishermen!basket_orders_fisherman_id_fkey(boat_name, company_name, user_id),
        drops(sale_start_time, ports(name, city))
      `)
      .eq('id', orderId)
      .single();

    if (orderError) throw orderError;
    if (!order) throw new Error('Order not found');
    logStep('Order details retrieved', { orderId });

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

    if (customerError) throw customerError;
    const customerEmail = customerUser?.email || 'Client inconnu';

    // Format date
    const pickupDate = new Date(order.drops.sale_start_time).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const emailResponse = await resend.emails.send({
      from: "QuaiDirect <support@quaidirect.fr>",
      to: [fishermanUser.email],
      subject: `Nouvelle commande panier : ${order.client_baskets.name}`,
      html: `
        <h1>📦 Nouvelle commande de panier !</h1>
        
        <h2>Détails de la commande :</h2>
        <ul>
          <li><strong>Panier :</strong> ${order.client_baskets.name}</li>
          <li><strong>Poids indicatif :</strong> ~${order.client_baskets.weight_kg}kg</li>
          <li><strong>Prix :</strong> ${(order.total_price_cents / 100).toFixed(2)}€</li>
          <li><strong>Client :</strong> ${customerEmail}</li>
        </ul>

        <h2>📍 Retrait :</h2>
        <ul>
          <li><strong>Lieu :</strong> ${order.drops.ports.name} - ${order.drops.ports.city}</li>
          <li><strong>Date et heure :</strong> ${pickupDate}</li>
        </ul>

        ${order.notes ? `<p><strong>Notes du client :</strong> ${order.notes}</p>` : ''}

        <p style="margin-top: 30px;">
          <a href="https://quaidirect.fr/dashboard/pecheur" 
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
