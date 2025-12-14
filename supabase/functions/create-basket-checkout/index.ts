import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://quaidirect.fr',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const RequestSchema = z.object({
  basketId: z.string().uuid('basketId must be a valid UUID'),
  priceId: z.string().min(1, 'priceId is required').regex(/^price_/, 'priceId must be a valid Stripe price ID'),
  fishermanId: z.string().uuid().optional().nullable(),
  dropId: z.string().uuid().optional().nullable(),
});

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-BASKET-CHECKOUT] ${step}${detailsStr}`);
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

    // Validate input with Zod
    const rawBody = await req.json();
    const validationResult = RequestSchema.safeParse(rawBody);
    
    if (!validationResult.success) {
      const errorMessages = validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      logStep('Validation failed', { errors: errorMessages });
      return new Response(
        JSON.stringify({ error: `Validation error: ${errorMessages}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { basketId, priceId, fishermanId, dropId } = validationResult.data;
    logStep('Request data validated', { basketId, priceId, fishermanId, dropId });

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2025-08-27.basil',
    });

    // Get basket price from Stripe to calculate commission
    const price = await stripe.prices.retrieve(priceId);
    if (!price.unit_amount) throw new Error('Price has no unit_amount');
    
    const basketPrice = price.unit_amount; // in cents
    const commission = Math.round(basketPrice * 0.08); // 8% commission
    const totalPrice = basketPrice + commission;
    
    logStep('Commission calculated', { basketPrice, commission, totalPrice });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep('Existing customer found', { customerId });
    } else {
      logStep('No existing customer, will create during checkout');
    }

    // Create checkout session for one-time payment with 8% commission
    const origin = req.headers.get('origin') || 'https://quaidirect.fr';
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            unit_amount: totalPrice,
            product_data: {
              name: 'Panier de poisson frais',
              description: `Panier incluant frais de service plateforme (8%)`,
            },
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/panier/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/panier?canceled=true`,
      metadata: {
        user_id: user.id,
        basket_id: basketId,
        fisherman_id: fishermanId || '',
        drop_id: dropId || '',
        basket_price_cents: basketPrice.toString(),
        commission_cents: commission.toString(),
        total_price_cents: totalPrice.toString(),
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
    logStep('ERROR in create-basket-checkout', { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
