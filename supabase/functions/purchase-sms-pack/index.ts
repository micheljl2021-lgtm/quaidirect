import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://quaidirect.fr',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PURCHASE-SMS-PACK] ${step}${detailsStr}`);
};

const SMS_PACKS = {
  'pack_500': { quantity: 500, price: 4900, name: 'Pack 500 SMS' }, // €49.00
  'pack_2000': { quantity: 2000, price: 14900, name: 'Pack 2000 SMS' }, // €149.00
  'pack_5000': { quantity: 5000, price: 29900, name: 'Pack 5000 SMS' }, // €299.00
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  );

  try {
    logStep('Function started');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header provided');

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error('User not authenticated or email not available');
    logStep('User authenticated', { userId: user.id, email: user.email });

    const { pack_type } = await req.json();
    if (!pack_type || !SMS_PACKS[pack_type as keyof typeof SMS_PACKS]) {
      throw new Error('Invalid pack type');
    }

    const pack = SMS_PACKS[pack_type as keyof typeof SMS_PACKS];
    logStep('Pack selected', { pack_type, pack });

    // Get fisherman
    const { data: fisherman, error: fishermanError } = await supabaseClient
      .from('fishermen')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (fishermanError || !fisherman) throw new Error('Fisherman not found');
    logStep('Fisherman found', { fishermanId: fisherman.id });

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2025-08-27.basil',
    });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep('Existing customer found', { customerId });
    } else {
      logStep('No existing customer, will create during checkout');
    }

    // Create one-time payment session for SMS pack
    const origin = req.headers.get('origin') || 'http://localhost:3000';
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: pack.name,
              description: `${pack.quantity} SMS pour vos communications clients`,
            },
            unit_amount: pack.price,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/dashboard/pecheur?sms_purchase=success`,
      cancel_url: `${origin}/dashboard/pecheur?sms_purchase=canceled`,
      metadata: {
        user_id: user.id,
        fisherman_id: fisherman.id,
        payment_type: 'sms_pack',
        pack_type: pack_type,
        sms_quantity: pack.quantity.toString(),
      },
    });

    logStep('Checkout session created', { sessionId: session.id, url: session.url });

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep('ERROR in purchase-sms-pack', { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
