import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
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
    let user = null;
    let isGuest = false;

    // Check if user is authenticated
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
      if (!userError && userData.user?.email) {
        user = userData.user;
        logStep('User authenticated', { userId: user.id, email: user.email });
      }
    }

    // If no authenticated user, this is a guest checkout
    if (!user) {
      isGuest = true;
      logStep('Guest checkout mode - no authentication required');
    }

    const { priceId, plan } = await req.json();
    if (!priceId || !plan) throw new Error('Missing priceId or plan');
    logStep('Request data validated', { priceId, plan, isGuest });

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2025-08-27.basil',
    });

    let customerId: string | undefined;

    // For authenticated users, check existing customer and subscription
    if (user) {
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        logStep('Existing customer found', { customerId });

        // Check for existing active/trialing subscription
        const existingActiveSubs = await stripe.subscriptions.list({
          customer: customerId,
          status: 'active',
          limit: 1
        });
        
        const existingTrialingSubs = await stripe.subscriptions.list({
          customer: customerId,
          status: 'trialing',
          limit: 1
        });

        if (existingActiveSubs.data.length > 0 || existingTrialingSubs.data.length > 0) {
          logStep('User already has an active/trialing subscription', { 
            activeCount: existingActiveSubs.data.length,
            trialingCount: existingTrialingSubs.data.length 
          });
          
          const portalSession = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: `${req.headers.get('origin') || 'https://quaidirect.fr'}/premium`,
          });

          return new Response(
            JSON.stringify({ 
              hasExistingSubscription: true,
              portalUrl: portalSession.url,
              message: 'Vous avez déjà un abonnement actif.'
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            }
          );
        }
        logStep('No existing subscription, proceeding with checkout');
      }
    }

    // Create checkout session
    const origin = req.headers.get('origin') || 'https://quaidirect.fr';
    const trialDays = 7;

    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${origin}/premium/success?session_id={CHECKOUT_SESSION_ID}&guest=${isGuest}`,
      cancel_url: `${origin}/premium?canceled=true`,
      metadata: {
        user_id: user?.id || 'guest',
        plan: plan,
        is_guest: isGuest ? 'true' : 'false',
      },
      subscription_data: {
        trial_period_days: trialDays,
        metadata: {
          user_id: user?.id || 'guest',
          plan: plan,
          is_guest: isGuest ? 'true' : 'false',
        },
      },
    };

    // Configure based on guest vs authenticated
    if (isGuest) {
      // Guest mode: let Stripe collect email, create customer
      sessionConfig.customer_creation = 'always';
      logStep('Guest session configured with customer_creation');
    } else if (customerId) {
      sessionConfig.customer = customerId;
    } else if (user?.email) {
      sessionConfig.customer_email = user.email;
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    logStep('Checkout session created', { sessionId: session.id, url: session.url, isGuest });

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep('ERROR in create-checkout', { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});