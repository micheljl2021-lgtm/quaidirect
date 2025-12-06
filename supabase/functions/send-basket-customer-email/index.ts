import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://quaidirect.fr",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-BASKET-CUSTOMER-EMAIL] ${step}${detailsStr}`);
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

    // Get order details with basket, fisherman, drop, and sale point info
    const { data: order, error: orderError } = await supabaseClient
      .from('basket_orders')
      .select(`
        *,
        client_baskets(name, price_cents, weight_kg, description),
        fishermen!basket_orders_fisherman_id_fkey(boat_name, company_name),
        drops(sale_start_time, ports(name, city), fisherman_sale_points(label, address))
      `)
      .eq('id', orderId)
      .single();

    if (orderError) throw orderError;
    if (!order) throw new Error('Order not found');
    logStep('Order details retrieved', { orderId });

    // Get customer email
    const { data: { user: customerUser }, error: customerError } = await supabaseClient.auth.admin.getUserById(
      order.user_id
    );

    if (customerError) throw customerError;
    if (!customerUser?.email) throw new Error('Customer email not found');
    logStep('Customer email retrieved', { email: customerUser.email });

    // Format date
    const pickupDate = order.drops?.sale_start_time 
      ? new Date(order.drops.sale_start_time).toLocaleDateString('fr-FR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : 'À confirmer';

    // Determine pickup location
    let pickupLocation = 'Point de vente à confirmer';
    if (order.drops?.ports) {
      pickupLocation = `${order.drops.ports.name} - ${order.drops.ports.city}`;
    } else if (order.drops?.fisherman_sale_points) {
      pickupLocation = order.drops.fisherman_sale_points.address || order.drops.fisherman_sale_points.label;
    } else if (order.pickup_location) {
      pickupLocation = order.pickup_location;
    }

    const fishermanName = order.fishermen?.boat_name || order.fishermen?.company_name || 'Votre pêcheur';

    const emailResponse = await resend.emails.send({
      from: "QuaiDirect <support@quaidirect.fr>",
      to: [customerUser.email],
      subject: `Confirmation de commande : ${order.client_baskets.name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px;">
            
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #0066cc; margin: 0;">🎣 QuaiDirect</h1>
              <p style="color: #666; margin: 10px 0 0 0;">Poisson frais, circuit court</p>
            </div>

            <div style="background: linear-gradient(135deg, #0066cc, #004d99); color: white; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
              <h2 style="margin: 0 0 10px 0; font-size: 24px;">✅ Commande confirmée !</h2>
              <p style="margin: 0; opacity: 0.9;">Merci pour votre achat</p>
            </div>

            <div style="background: #f8f9fa; padding: 25px; border-radius: 12px; margin-bottom: 25px;">
              <h3 style="margin: 0 0 20px 0; color: #333;">📦 Votre panier</h3>
              
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #e0e0e0;">
                <span style="color: #666;">Panier</span>
                <strong style="color: #333;">${order.client_baskets.name}</strong>
              </div>
              
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #e0e0e0;">
                <span style="color: #666;">Poids indicatif</span>
                <strong style="color: #333;">~${order.client_baskets.weight_kg}kg</strong>
              </div>
              
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #e0e0e0;">
                <span style="color: #666;">Pêcheur</span>
                <strong style="color: #333;">${fishermanName}</strong>
              </div>
              
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #666;">Total payé</span>
                <strong style="color: #0066cc; font-size: 20px;">${(order.total_price_cents / 100).toFixed(2)}€</strong>
              </div>
            </div>

            <div style="background: #e8f4ff; padding: 25px; border-radius: 12px; margin-bottom: 25px; border-left: 4px solid #0066cc;">
              <h3 style="margin: 0 0 15px 0; color: #0066cc;">📍 Retrait de votre commande</h3>
              
              <p style="margin: 0 0 10px 0; color: #333;">
                <strong>Lieu :</strong> ${pickupLocation}
              </p>
              
              <p style="margin: 0; color: #333;">
                <strong>Date et heure :</strong> ${pickupDate}
              </p>
            </div>

            <div style="background: #fff8e6; padding: 20px; border-radius: 12px; margin-bottom: 25px;">
              <p style="margin: 0; color: #856404; font-size: 14px;">
                💡 <strong>Conseil :</strong> Présentez-vous au point de vente à l'heure indiquée avec cet email ou votre pièce d'identité.
              </p>
            </div>

            <div style="text-align: center; margin-bottom: 30px;">
              <a href="https://quaidirect.fr/arrivages" 
                 style="display: inline-block; background: #0066cc; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                Voir d'autres arrivages
              </a>
            </div>

            <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; text-align: center; color: #666; font-size: 12px;">
              <p style="margin: 0 0 10px 0;">
                Référence commande : ${order.id.slice(0, 8).toUpperCase()}
              </p>
              <p style="margin: 0;">
                Une question ? Contactez-nous à <a href="mailto:support@quaidirect.fr" style="color: #0066cc;">support@quaidirect.fr</a>
              </p>
              <p style="margin: 15px 0 0 0;">
                © ${new Date().getFullYear()} QuaiDirect - Poisson frais en circuit court
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    logStep('Customer confirmation email sent', { emailResponse });

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
