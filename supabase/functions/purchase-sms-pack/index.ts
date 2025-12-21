import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { handleCors, getCorsHeaders, jsonResponse, errorResponse } from "../_shared/cors.ts";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PURCHASE-SMS-PACK] ${step}${detailsStr}`);
};

// SMS Packs with standard and Pro pricing (priceCentsPro)
const SMS_PACKS = {
  'pack_500': { quantity: 500, price: 4900, pricePro: 4500, name: 'Pack 500 SMS' },
  'pack_lancement': { quantity: 1000, price: 9500, pricePro: 8500, name: 'Pack 1000 SMS' },
  'pack_2000': { quantity: 2000, price: 19500, pricePro: 18000, name: 'Pack 2000 SMS' },
  'pack_5000': { quantity: 5000, price: 45000, pricePro: 42000, name: 'Pack 5000 SMS' },
};

// Input validation schema
const inputSchema = z.object({
  pack_type: z.enum(['pack_500', 'pack_lancement', 'pack_2000', 'pack_5000']),
});

serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const origin = req.headers.get("Origin");

  // Use service role key for checking payment status
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } }
  );

  // Use anon key for auth verification
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  );

  try {
    logStep('Function started');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return errorResponse('No authorization header provided', 401, origin);
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) {
      return errorResponse(`Authentication error: ${userError.message}`, 401, origin);
    }
    
    const user = userData.user;
    if (!user?.email) {
      return errorResponse('User not authenticated or email not available', 401, origin);
    }
    logStep('User authenticated', { userId: user.id, email: user.email });

    // Validate input
    const rawBody = await req.json();
    const parseResult = inputSchema.safeParse(rawBody);
    if (!parseResult.success) {
      const errorMessage = parseResult.error.errors
        .map(e => `${e.path.join('.')}: ${e.message}`)
        .join(', ');
      return errorResponse(errorMessage, 400, origin);
    }

    const { pack_type } = parseResult.data;
    const pack = SMS_PACKS[pack_type];
    logStep('Pack selected', { pack_type, pack });

    // Get fisherman with payment status to determine pricing tier
    const { data: fisherman, error: fishermanError } = await supabaseAdmin
      .from('fishermen')
      .select('id, onboarding_payment_status')
      .eq('user_id', user.id)
      .single();

    if (fishermanError || !fisherman) {
      return errorResponse('Fisherman not found', 404, origin);
    }
    logStep('Fisherman found', { fishermanId: fisherman.id, paymentStatus: fisherman.onboarding_payment_status });

    // Determine if Pro pricing applies
    // Pro pricing applies if onboarding_payment_status is 'pro' or matches Pro plan payment
    const isProPlan = fisherman.onboarding_payment_status === 'pro' || 
                      fisherman.onboarding_payment_status === 'fisherman_pro';
    
    const finalPrice = isProPlan ? pack.pricePro : pack.price;
    logStep('Pricing determined', { isProPlan, standardPrice: pack.price, proPrice: pack.pricePro, finalPrice });

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

    // Create one-time payment session for SMS pack with appropriate pricing
    const requestOrigin = req.headers.get('origin') || 'https://quaidirect.fr';
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: pack.name + (isProPlan ? ' (tarif Pro)' : ''),
              description: `${pack.quantity} SMS pour vos communications clients`,
            },
            unit_amount: finalPrice,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${requestOrigin}/dashboard/pecheur?sms_purchase=success`,
      cancel_url: `${requestOrigin}/dashboard/pecheur?sms_purchase=canceled`,
      metadata: {
        user_id: user.id,
        fisherman_id: fisherman.id,
        payment_type: 'sms_pack',
        pack_type: pack_type,
        sms_quantity: pack.quantity.toString(),
        is_pro_pricing: isProPlan.toString(),
      },
    });

    logStep('Checkout session created', { sessionId: session.id, url: session.url, isProPricing: isProPlan });

    return jsonResponse({ url: session.url, sessionId: session.id }, 200, origin);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep('ERROR in purchase-sms-pack', { message: errorMessage });
    return errorResponse(errorMessage, 500, origin);
  }
});
