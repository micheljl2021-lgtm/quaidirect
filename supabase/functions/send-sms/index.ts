import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Dynamic CORS - same pattern as check-sms-quota
const ALLOWED_ORIGINS = [
  'https://quaidirect.fr',
  'https://www.quaidirect.fr',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:8080',
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
});

interface SendSmsRequest {
  phones: string[];
  message: string;
}

const logStep = (step: string, details?: any) => {
  console.log(`[SEND-SMS] ${step}`, details ? JSON.stringify(details) : '');
};

function normalizePhoneToE164(phone: string): string | null {
  // 1. Clean: trim, remove spaces/dots/dashes/parentheses
  let cleaned = phone.trim().replace(/[\s.\-()]/g, '');
  
  // 2. If starts with 0 and length 10 (French format) -> +33
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    cleaned = '+33' + cleaned.substring(1);
  }
  
  // 3. If starts with 33 (without +) -> add +
  if (cleaned.startsWith('33')) {
    cleaned = '+' + cleaned;
  }
  
  // 4. If starts with 00 (international format) -> replace with +
  if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.substring(2);
  }
  
  // 5. Final validation: must match /^\+\d{8,15}$/
  if (!/^\+\d{8,15}$/.test(cleaned)) {
    return null; // Invalid number
  }
  
  return cleaned;
}

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  
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
    
    // Get fisherman's plan to determine quota
    const { data: payment } = await supabase
      .from('payments')
      .select('plan')
      .eq('user_id', user.id)
      .ilike('plan', 'fisherman_%')
      .in('status', ['active', 'trialing'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Plan-aware SMS quotas (same as check-sms-quota)
    const PLAN_SMS_QUOTAS: Record<string, number> = {
      standard: 50,
      pro: 200,
      elite: 1500,
    };
    const planType = payment?.plan?.replace('fisherman_', '') || 'standard';
    const freeQuota = PLAN_SMS_QUOTAS[planType] || 50;

    logStep('Plan detected', { plan: payment?.plan, planType, freeQuota });
    
    const { data: usage } = await supabase
      .from('fishermen_sms_usage')
      .select('*')
      .eq('fisherman_id', fisherman.id)
      .eq('month_year', currentMonth)
      .single();
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

    // Normalize and validate phone numbers
    const validatedPhones: Array<{ original: string; normalized: string }> = [];
    const invalidPhones: Array<{ phone: string; reason: string }> = [];

    for (const phone of phones) {
      const normalized = normalizePhoneToE164(phone);
      if (normalized) {
        validatedPhones.push({ original: phone, normalized });
      } else {
        invalidPhones.push({ phone, reason: 'Invalid phone format (expected E.164)' });
        logStep('Invalid phone number', { phone, reason: 'Failed E.164 normalization' });
      }
    }

    // If no valid phones, return error
    if (validatedPhones.length === 0) {
      return new Response(
        JSON.stringify({ 
          ok: false,
          error: 'NO_VALID_PHONES',
          message: 'Aucun numéro valide. Format attendu: 06XXXXXXXX ou +33XXXXXXXXX',
          failed: phones.length,
          errors: invalidPhones.map(p => ({
            phone: p.phone,
            code: 'INVALID_FORMAT',
            message: p.reason
          }))
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    logStep('Phone validation complete', { 
      valid: validatedPhones.length, 
      invalid: invalidPhones.length 
    });

    // Send SMS via Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
    const twilioAuth = btoa(`${twilioAccountSid}:${twilioAuthToken}`);

    const messageIds: string[] = [];
    const errors: Array<{ phone: string; code: string; message: string }> = [];
    let successCount = 0;
    let failCount = 0;

    // Add invalid phones to errors
    for (const invalid of invalidPhones) {
      errors.push({
        phone: invalid.phone,
        code: 'INVALID_FORMAT',
        message: invalid.reason
      });
      failCount++;
    }

    for (const { original, normalized } of validatedPhones) {
      try {
        const response = await fetch(twilioUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${twilioAuth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: normalized,
            From: twilioPhoneNumber,
            Body: message,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          successCount++;
          messageIds.push(data.sid);
          logStep('SMS sent successfully', { phone: original, normalized, sid: data.sid });
        } else {
          failCount++;
          const errorCode = data.code || 'TWILIO_ERROR';
          const errorMessage = data.message || 'Unknown error';
          errors.push({
            phone: original,
            code: errorCode,
            message: errorMessage
          });
          logStep('Twilio error', { 
            code: errorCode, 
            message: errorMessage,
            phone: original,
            normalized
          });
        }
      } catch (error: any) {
        failCount++;
        errors.push({
          phone: original,
          code: 'NETWORK_ERROR',
          message: error.message
        });
        logStep('SMS error', { phone: original, normalized, error: error.message });
      }
    }

    // Update quota (deduct from free first, then paid)
    let newFreeRemaining = freeRemaining;
    let newPaidBalance = paidBalance;
    
    if (successCount > 0) {
      let smsToDeduct = successCount;
      let newFreeUsed = freeUsed;

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

      // Calculate new remaining values
      newFreeRemaining = Math.max(0, freeQuota - newFreeUsed);

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

    const newTotalAvailable = newFreeRemaining + Math.max(0, newPaidBalance);

    return new Response(
      JSON.stringify({
        ok: successCount > 0,
        sent: successCount,
        failed: failCount,
        messageIds: messageIds.length > 0 ? messageIds : undefined,
        errors: errors.length > 0 ? errors : undefined,
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
