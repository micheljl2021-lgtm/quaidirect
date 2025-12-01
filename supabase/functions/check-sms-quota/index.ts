import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://quaidirect.fr',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SMS-QUOTA] ${step}${detailsStr}`);
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

    // Get current month quota
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    const { data: usage, error: usageError } = await supabaseClient
      .from('fishermen_sms_usage')
      .select('*')
      .eq('fisherman_id', fisherman.id)
      .eq('month_year', currentMonth)
      .maybeSingle();

    if (usageError) throw usageError;

    const FREE_SMS_QUOTA = 100;
    const freeRemaining = usage ? FREE_SMS_QUOTA - (usage.free_sms_used || 0) : FREE_SMS_QUOTA;
    const paidBalance = usage?.paid_sms_balance || 0;
    const totalAvailable = Math.max(0, freeRemaining) + paidBalance;

    logStep('SMS quota calculated', {
      freeRemaining,
      paidBalance,
      totalAvailable,
      freeUsed: usage?.free_sms_used || 0
    });

    return new Response(
      JSON.stringify({
        free_remaining: Math.max(0, freeRemaining),
        paid_balance: paidBalance,
        total_available: totalAvailable,
        free_quota: FREE_SMS_QUOTA,
        free_used: usage?.free_sms_used || 0
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
