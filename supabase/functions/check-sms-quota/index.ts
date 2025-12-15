import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

// Dynamic CORS - same pattern as create-checkout
const ALLOWED_ORIGINS = [
  'https://quaidirect.fr',
  'https://www.quaidirect.fr',
  'http://localhost:5173',
  'http://localhost:3000',
];

// Accept Lovable preview domains dynamically
const isAllowedOrigin = (origin: string | null): boolean => {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  // Allow Lovable preview domains
  if (origin.endsWith('.lovableproject.com') || origin.endsWith('.lovable.dev')) return true;
  return false;
};

const getCorsHeaders = (origin: string | null) => ({
  'Access-Control-Allow-Origin': isAllowedOrigin(origin) ? origin! : 'https://quaidirect.fr',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
});

// SMS quotas by plan - must match src/config/pricing.ts
const PLAN_SMS_QUOTAS: Record<string, number> = {
  'fisherman_standard': 50,
  'fisherman_pro': 200,
  'fisherman_elite': 1500,
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SMS-QUOTA] ${step}${detailsStr}`);
};

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  
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
    if (!user?.id) throw new Error('User not authenticated');
    logStep('User authenticated', { userId: user.id });

    // Get fisherman
    const { data: fisherman, error: fishermanError } = await supabaseClient
      .from('fishermen')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (fishermanError || !fisherman) throw new Error('Fisherman not found');
    logStep('Fisherman found', { fishermanId: fisherman.id });

    // Get fisherman's active subscription plan
    const { data: payment, error: paymentError } = await supabaseClient
      .from('payments')
      .select('plan, status')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (paymentError) {
      logStep('Payment query error', { error: paymentError.message });
    }

    // Determine SMS quota based on plan
    let monthlyQuota = 0;
    let planName = 'none';
    
    if (payment?.plan) {
      planName = payment.plan;
      // Match plan name to quota
      if (payment.plan.includes('elite')) {
        monthlyQuota = PLAN_SMS_QUOTAS['fisherman_elite'];
      } else if (payment.plan.includes('pro')) {
        monthlyQuota = PLAN_SMS_QUOTAS['fisherman_pro'];
      } else if (payment.plan.includes('standard') || payment.plan.includes('basic')) {
        monthlyQuota = PLAN_SMS_QUOTAS['fisherman_standard'];
      } else {
        // Default fallback for unknown plans
        monthlyQuota = PLAN_SMS_QUOTAS['fisherman_standard'];
      }
    }

    logStep('Plan detected', { plan: planName, monthlyQuota });

    // Get current month usage
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    const { data: usage, error: usageError } = await supabaseClient
      .from('fishermen_sms_usage')
      .select('*')
      .eq('fisherman_id', fisherman.id)
      .eq('month_year', currentMonth)
      .maybeSingle();

    if (usageError) throw usageError;

    const smsUsed = usage?.free_sms_used || 0;
    const paidBalance = usage?.paid_sms_balance || 0;
    const bonusSms = usage?.bonus_sms_at_signup || 0;
    
    // Calculate remaining quota
    const quotaRemaining = Math.max(0, monthlyQuota - smsUsed);
    const totalAvailable = quotaRemaining + paidBalance + bonusSms;

    logStep('SMS quota calculated', {
      plan: planName,
      monthlyQuota,
      smsUsed,
      quotaRemaining,
      paidBalance,
      bonusSms,
      totalAvailable
    });

    return new Response(
      JSON.stringify({
        plan: planName,
        monthly_quota: monthlyQuota,
        free_used: smsUsed,
        free_remaining: quotaRemaining,
        paid_balance: paidBalance,
        bonus_sms: bonusSms,
        total_available: totalAvailable
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
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
