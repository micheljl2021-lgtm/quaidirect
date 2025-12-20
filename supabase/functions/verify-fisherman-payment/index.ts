import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-FISHERMAN-PAYMENT] ${step}${detailsStr}`);
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

    // Check if user already has payment record
    const { data: existingPayment } = await supabaseClient
      .from('payments')
      .select('id, plan, status')
      .eq('user_id', user.id)
      .ilike('plan', 'fisherman_%')
      .in('status', ['active', 'trialing'])
      .maybeSingle();

    if (existingPayment) {
      logStep('Payment already exists in database', { payment: existingPayment });
      return new Response(
        JSON.stringify({ 
          verified: true, 
          plan: existingPayment.plan,
          status: existingPayment.status,
          source: 'database'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Check Stripe directly for subscription
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep('No Stripe customer found');
      return new Response(
        JSON.stringify({ verified: false, reason: 'no_customer' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const customerId = customers.data[0].id;
    logStep('Found Stripe customer', { customerId });

    // Check for active/trialing subscriptions
    const activeSubscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 10
    });

    const trialingSubscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'trialing',
      limit: 10
    });

    const allSubscriptions = [...activeSubscriptions.data, ...trialingSubscriptions.data];
    
    // Find fisherman subscription
    const fishermanSub = allSubscriptions.find(sub => 
      sub.metadata?.payment_type === 'fisherman_onboarding' ||
      ['standard', 'pro', 'elite', 'basic'].includes(sub.metadata?.plan_type || '')
    );

    if (!fishermanSub) {
      logStep('No fisherman subscription found in Stripe');
      return new Response(
        JSON.stringify({ verified: false, reason: 'no_subscription' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    logStep('Found fisherman subscription in Stripe', { 
      subscriptionId: fishermanSub.id, 
      status: fishermanSub.status,
      planType: fishermanSub.metadata?.plan_type 
    });

    const planType = fishermanSub.metadata?.plan_type || 'standard';

    // Subscription exists in Stripe but not in database - create records now
    // This handles the case where webhook hasn't processed yet

    // 1. Create/update fisherman record
    const { data: existingFisherman } = await supabaseClient
      .from('fishermen')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!existingFisherman) {
      const tempSuffix = user.id.substring(0, 12);
      const { error: fishermanError } = await supabaseClient
        .from('fishermen')
        .insert({
          user_id: user.id,
          boat_name: 'À compléter',
          boat_registration: `TEMP-${tempSuffix}`,
          siret: `TEMP-SIRET-${tempSuffix}`,
          onboarding_payment_status: 'paid',
          onboarding_paid_at: new Date().toISOString(),
          email: user.email,
        });

      if (fishermanError) {
        logStep('Error creating fisherman record', { error: fishermanError });
      } else {
        logStep('Created fisherman record');
      }
    }

    // 2. Create payment record
    const currentPeriodStart = fishermanSub.current_period_start 
      ? new Date(fishermanSub.current_period_start * 1000).toISOString() 
      : new Date().toISOString();
    const currentPeriodEnd = fishermanSub.current_period_end 
      ? new Date(fishermanSub.current_period_end * 1000).toISOString() 
      : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    const trialEnd = fishermanSub.trial_end 
      ? new Date(fishermanSub.trial_end * 1000).toISOString() 
      : null;

    const { error: paymentError } = await supabaseClient
      .from('payments')
      .upsert({
        user_id: user.id,
        stripe_subscription_id: fishermanSub.id,
        stripe_customer_id: customerId,
        plan: `fisherman_${planType}`,
        status: fishermanSub.status === 'trialing' ? 'trialing' : 'active',
        current_period_start: currentPeriodStart,
        current_period_end: currentPeriodEnd,
        trial_end: trialEnd,
      }, {
        onConflict: 'user_id,stripe_subscription_id'
      });

    if (paymentError) {
      logStep('Error creating payment record', { error: paymentError });
    } else {
      logStep('Created/updated payment record');
    }

    // 3. Add fisherman role
    const { error: roleError } = await supabaseClient
      .from('user_roles')
      .upsert({
        user_id: user.id,
        role: 'fisherman'
      }, {
        onConflict: 'user_id,role',
        ignoreDuplicates: true
      });

    if (roleError) {
      logStep('Error adding fisherman role', { error: roleError });
    } else {
      logStep('Added fisherman role');
    }

    // 4. Add opening bonus SMS
    const bonusSmsMap: Record<string, number> = {
      standard: 200,
      pro: 1000,
      elite: 0,
    };
    const bonusSms = bonusSmsMap[planType] || 0;

    if (bonusSms > 0) {
      const { data: fishermanData } = await supabaseClient
        .from('fishermen')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fishermanData?.id) {
        // Check if bonus already added
        const { data: existingBonus } = await supabaseClient
          .from('fishermen_sms_wallet_history')
          .select('id')
          .eq('fisherman_id', fishermanData.id)
          .eq('operation_type', 'opening_bonus')
          .maybeSingle();

        if (!existingBonus) {
          const { error: walletError } = await supabaseClient.rpc('increment_wallet_balance', {
            p_fisherman_id: fishermanData.id,
            p_amount: bonusSms,
          });

          if (!walletError) {
            await supabaseClient
              .from('fishermen_sms_wallet_history')
              .insert({
                fisherman_id: fishermanData.id,
                operation_type: 'opening_bonus',
                sms_delta: bonusSms,
                notes: `Bonus ouverture plan ${planType}`,
              });
            logStep('Added opening bonus SMS', { bonusSms });
          }
        }
      }
    }

    logStep('Verification complete - payment synced from Stripe');
    
    return new Response(
      JSON.stringify({ 
        verified: true, 
        plan: `fisherman_${planType}`,
        status: fishermanSub.status,
        source: 'stripe_sync'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Verification failed';
    logStep('ERROR', { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage, verified: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
