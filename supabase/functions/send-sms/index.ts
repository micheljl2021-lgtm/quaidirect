import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendSmsRequest {
  phones: string[];
  message: string;
}

const logStep = (step: string, details?: any) => {
  console.log(`[SEND-SMS] ${step}`, details ? JSON.stringify(details) : '');
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check Twilio configuration
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      logStep('Twilio not configured');
      return new Response(
        JSON.stringify({ 
          error: 'TWILIO_NOT_CONFIGURED', 
          message: 'SMS non disponible - configuration Twilio en attente. Contactez l\'administrateur.' 
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    logStep('User authenticated', { userId: user.id });

    // Get fisherman record
    const { data: fisherman, error: fishermanError } = await supabase
      .from('fishermen')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (fishermanError || !fisherman) {
      return new Response(
        JSON.stringify({ error: 'Fisherman not found' }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    logStep('Fisherman found', { fishermanId: fisherman.id });

    // Parse request
    const { phones, message }: SendSmsRequest = await req.json();

    if (!phones || !Array.isArray(phones) || phones.length === 0) {
      return new Response(
        JSON.stringify({ error: 'At least one phone number is required' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!message || message.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check SMS quota
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    
    const { data: usage } = await supabase
      .from('fishermen_sms_usage')
      .select('*')
      .eq('fisherman_id', fisherman.id)
      .eq('month_year', currentMonth)
      .single();

    const freeQuota = usage?.monthly_allocation || 100;
    const freeUsed = usage?.free_sms_used || 0;
    const paidBalance = usage?.paid_sms_balance || 0;
    const freeRemaining = Math.max(0, freeQuota - freeUsed);
    const totalAvailable = freeRemaining + paidBalance;

    const smsNeeded = phones.length;

    if (smsNeeded > totalAvailable) {
      return new Response(
        JSON.stringify({ 
          error: 'INSUFFICIENT_QUOTA', 
          message: `Quota insuffisant. ${smsNeeded} SMS requis, ${totalAvailable} disponibles.`,
          quota: { needed: smsNeeded, available: totalAvailable }
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    logStep('Quota check passed', { needed: smsNeeded, available: totalAvailable });

    // Send SMS via Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
    const twilioAuth = btoa(`${twilioAccountSid}:${twilioAuthToken}`);

    const results = [];
    let successCount = 0;
    let failCount = 0;

    for (const phone of phones) {
      try {
        const response = await fetch(twilioUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${twilioAuth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: phone,
            From: twilioPhoneNumber,
            Body: message,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          successCount++;
          results.push({ phone, success: true, sid: data.sid });
          logStep('SMS sent successfully', { phone, sid: data.sid });
          
          // Log to sms_messages table
          await supabase.from('sms_messages').insert({
            fisherman_id: fisherman.id,
            contact_phone: phone,
            message: message,
            type: 'notification',
            status: 'sent',
            sent_at: new Date().toISOString(),
            twilio_sid: data.sid,
            cost_cents: 5,
          });
        } else {
          failCount++;
          results.push({ phone, success: false, error: data.message || 'Unknown error' });
          logStep('SMS failed', { phone, error: data });
          
          // Log failed SMS to sms_messages table
          await supabase.from('sms_messages').insert({
            fisherman_id: fisherman.id,
            contact_phone: phone,
            message: message,
            type: 'notification',
            status: 'failed',
            error_message: data.message || 'Unknown error',
            cost_cents: 5,
          });
        }
      } catch (error: any) {
        failCount++;
        results.push({ phone, success: false, error: error.message });
        logStep('SMS error', { phone, error: error.message });
        
        // Log error to sms_messages table
        await supabase.from('sms_messages').insert({
          fisherman_id: fisherman.id,
          contact_phone: phone,
          message: message,
          type: 'notification',
          status: 'failed',
          error_message: error.message,
          cost_cents: 5,
        });
      }
    }

    // Update quota (deduct from free first, then paid)
    if (successCount > 0) {
      let smsToDeduct = successCount;
      let newFreeUsed = freeUsed;
      let newPaidBalance = paidBalance;

      // Use free SMS first
      const freeToUse = Math.min(smsToDeduct, freeRemaining);
      if (freeToUse > 0) {
        newFreeUsed = freeUsed + freeToUse;
        smsToDeduct -= freeToUse;
      }

      // Use paid SMS for remainder
      if (smsToDeduct > 0) {
        newPaidBalance = Math.max(0, paidBalance - smsToDeduct);
      }

      // Upsert usage record
      await supabase
        .from('fishermen_sms_usage')
        .upsert({
          fisherman_id: fisherman.id,
          month_year: currentMonth,
          free_sms_used: newFreeUsed,
          paid_sms_balance: newPaidBalance,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'fisherman_id,month_year'
        });

      logStep('Quota updated', { newFreeUsed, newPaidBalance });
    }

    // Calculate remaining quota
    const newFreeRemaining = Math.max(0, freeQuota - (freeUsed + Math.min(successCount, freeRemaining)));
    const newPaidBalance = successCount > freeRemaining ? paidBalance - (successCount - freeRemaining) : paidBalance;
    const newTotalAvailable = newFreeRemaining + Math.max(0, newPaidBalance);

    return new Response(
      JSON.stringify({
        success: true,
        sent: successCount,
        failed: failCount,
        results,
        quota: {
          free_remaining: newFreeRemaining,
          paid_balance: Math.max(0, newPaidBalance),
          total_available: newTotalAvailable,
        }
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    logStep('Unexpected error', { error: error.message });
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
