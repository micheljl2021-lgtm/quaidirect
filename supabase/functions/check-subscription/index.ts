import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
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
    if (!authHeader) {
      logStep('No authorization header');
      return new Response(
        JSON.stringify({ subscribed: false, plan: null }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      logStep('User not authenticated', { error: userError });
      return new Response(
        JSON.stringify({ subscribed: false, plan: null }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    const user = userData.user;
    logStep('User authenticated', { userId: user.id });

    // Check for active or trialing subscription in payments table
    const { data: payment, error: paymentError } = await supabaseClient
      .from('payments')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (paymentError) {
      logStep('ERROR querying payments', { error: paymentError });
      throw paymentError;
    }

    // If no payment found, check user_roles as fallback (for cases where payment processing is delayed)
    if (!payment) {
      logStep('No active payment found, checking user_roles fallback');
      
      const { data: premiumRole } = await supabaseClient
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'premium')
        .maybeSingle();
      
      if (premiumRole) {
        logStep('Premium role found in user_roles (fallback)');
        return new Response(
          JSON.stringify({ 
            subscribed: true, 
            plan: 'premium',
            currentPeriodEnd: null,
            fallback: true
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }
      
      logStep('No active subscription found');
      return new Response(
        JSON.stringify({ 
          subscribed: false, 
          plan: null,
          currentPeriodEnd: null 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Check if subscription is still valid (not expired)
    const now = new Date();
    const periodEnd = new Date(payment.current_period_end);
    const isExpired = now > periodEnd;

    if (isExpired) {
      logStep('Subscription expired', { periodEnd: payment.current_period_end });
      return new Response(
        JSON.stringify({ 
          subscribed: false, 
          plan: payment.plan,
          expired: true,
          currentPeriodEnd: payment.current_period_end 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    logStep('Active subscription found', { 
      plan: payment.plan,
      periodEnd: payment.current_period_end 
    });

    return new Response(
      JSON.stringify({ 
        subscribed: true, 
        plan: payment.plan,
        stripeSubscriptionId: payment.stripe_subscription_id,
        currentPeriodStart: payment.current_period_start,
        currentPeriodEnd: payment.current_period_end,
        trialEnd: payment.trial_end,
        cancelAt: payment.cancel_at
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep('ERROR in check-subscription', { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
