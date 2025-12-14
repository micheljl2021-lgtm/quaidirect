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
  priceId: z.string()
    .min(1, 'priceId is required')
    .regex(/^price_/, 'priceId must be a valid Stripe price ID'),
  planType: z.enum(['standard', 'pro', 'elite'], {
    errorMap: () => ({ message: 'planType must be standard, pro, or elite' })
  }),
});

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-FISHERMAN-PAYMENT] ${step}${detailsStr}`);
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
    if (!authHeader) throw new Error('No authorization header');

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw userError;
    
    const user = userData.user;
    if (!user?.email) throw new Error('User not authenticated');
    logStep('User authenticated', { userId: user.id, email: user.email });

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2025-08-27.basil',
    });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId = customers.data.length > 0 ? customers.data[0].id : undefined;
    
    const origin = req.headers.get('origin') || 'https://quaidirect.fr';

    if (customerId) {
      logStep('Existing customer found', { customerId });

      // CRITICAL: Check for existing active/trialing fisherman subscription to prevent duplicates
      const existingActiveSubs = await stripe.subscriptions.list({
        customer: customerId,
        status: 'active',
        limit: 5
      });
      
      const existingTrialingSubs = await stripe.subscriptions.list({
        customer: customerId,
        status: 'trialing',
        limit: 5
      });

      // Check if any subscription is a fisherman subscription (by metadata or by checking payments table)
      const allExistingSubs = [...existingActiveSubs.data, ...existingTrialingSubs.data];
      const hasFishermanSub = allExistingSubs.some(sub => 
        sub.metadata?.payment_type === 'fisherman_onboarding' ||
        sub.metadata?.plan_type === 'basic' ||
        sub.metadata?.plan_type === 'standard' ||
        sub.metadata?.plan_type === 'pro' ||
        sub.metadata?.plan_type === 'elite'
      );

      if (hasFishermanSub) {
        logStep('User already has an active/trialing fisherman subscription', { 
          subscriptionCount: allExistingSubs.length 
        });
        
        // Create portal session for user to manage existing subscription
        const portalSession = await stripe.billingPortal.sessions.create({
          customer: customerId,
          return_url: `${origin}/dashboard/pecheur`,
        });

        return new Response(
          JSON.stringify({ 
            error: 'Vous avez déjà un abonnement pêcheur actif. Gérez-le via le portail client.',
            hasExistingSubscription: true,
            portalUrl: portalSession.url 
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        );
      }
      logStep('No existing fisherman subscription, proceeding with checkout');
    } else {
      logStep('No existing customer');
    }

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
    
    const { priceId, planType } = validationResult.data;
    logStep('Request data validated', { priceId, planType });

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${origin}/pecheur/payment-success?plan=${planType}`,
      cancel_url: `${origin}/pecheur/payment?canceled=true`,
      metadata: {
        user_id: user.id,
        payment_type: 'fisherman_onboarding',
        plan_type: planType,
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          payment_type: 'fisherman_onboarding',
          plan_type: planType,
        },
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
    const errorMessage = error instanceof Error ? error.message : 'Payment creation failed';
    logStep('ERROR', { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
