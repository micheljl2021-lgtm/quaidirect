import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendSmsInvitationRequest {
  contact_ids: string[];
  template_id?: string;
  custom_message?: string;
}

const logStep = (step: string, details?: any) => {
  console.log(`[SEND-SMS-INVITATION] ${step}`, details ? JSON.stringify(details) : '');
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
      .select('id, boat_name, user_id')
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
    const { contact_ids, template_id, custom_message }: SendSmsInvitationRequest = await req.json();

    if (!contact_ids || !Array.isArray(contact_ids) || contact_ids.length === 0) {
      return new Response(
        JSON.stringify({ error: 'At least one contact ID is required' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get contacts with valid phone numbers
    const { data: contacts, error: contactsError } = await supabase
      .from('fishermen_contacts')
      .select('id, phone, first_name, last_name')
      .in('id', contact_ids)
      .eq('fisherman_id', fisherman.id)
      .not('phone', 'is', null);

    if (contactsError || !contacts || contacts.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No contacts found with valid phone numbers' }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    logStep('Contacts loaded', { count: contacts.length });

    // Get message template or use custom message
    let messageTemplate = custom_message;
    
    if (!messageTemplate && template_id) {
      const { data: template } = await supabase
        .from('sms_templates')
        .select('body')
        .eq('id', template_id)
        .eq('fisherman_id', fisherman.id)
        .single();
      
      if (template) {
        messageTemplate = template.body;
      }
    }

    // Default message if none provided
    if (!messageTemplate) {
      const { data: defaultTemplate } = await supabase
        .from('sms_templates')
        .select('body')
        .eq('fisherman_id', fisherman.id)
        .eq('type', 'invitation')
        .eq('is_default', true)
        .single();
      
      messageTemplate = defaultTemplate?.body || 
        `Bonjour ! ${fisherman.boat_name} vous invite à découvrir du poisson frais sur QuaiDirect : {{signup_link}}`;
    }

    // Generate signup link
    const signupLink = `${Deno.env.get('SITE_URL') || 'https://quaidirect.fr'}/auth?ref=${fisherman.id}`;

    // Check SMS quota
    const currentMonth = new Date().toISOString().slice(0, 7);
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

    if (contacts.length > totalAvailable) {
      return new Response(
        JSON.stringify({ 
          error: 'INSUFFICIENT_QUOTA', 
          message: `Quota insuffisant. ${contacts.length} SMS requis, ${totalAvailable} disponibles.`,
          quota: { needed: contacts.length, available: totalAvailable }
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send SMS via Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
    const twilioAuth = btoa(`${twilioAccountSid}:${twilioAuthToken}`);

    const results = [];
    let successCount = 0;
    let failCount = 0;

    for (const contact of contacts) {
      try {
        // Replace variables in message
        const message = messageTemplate
          .replace(/{{signup_link}}/g, signupLink)
          .replace(/{{first_name}}/g, contact.first_name || '')
          .replace(/{{last_name}}/g, contact.last_name || '');

        const response = await fetch(twilioUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${twilioAuth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: contact.phone,
            From: twilioPhoneNumber,
            Body: message,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          successCount++;
          results.push({ phone: contact.phone, success: true, sid: data.sid });
          
          // Save to sms_messages table
          await supabase
            .from('sms_messages')
            .insert({
              fisherman_id: fisherman.id,
              contact_id: contact.id,
              phone: contact.phone,
              message,
              type: 'invitation',
              status: 'sent',
              twilio_sid: data.sid,
              sent_at: new Date().toISOString(),
            });
          
          logStep('SMS sent successfully', { phone: contact.phone, sid: data.sid });
        } else {
          failCount++;
          results.push({ phone: contact.phone, success: false, error: data.message || 'Unknown error' });
          
          // Save failed attempt
          await supabase
            .from('sms_messages')
            .insert({
              fisherman_id: fisherman.id,
              contact_id: contact.id,
              phone: contact.phone,
              message,
              type: 'invitation',
              status: 'failed',
              error: data.message || 'Unknown error',
            });
          
          logStep('SMS failed', { phone: contact.phone, error: data });
        }
      } catch (error: any) {
        failCount++;
        results.push({ phone: contact.phone, success: false, error: error.message });
        
        // Save error
        await supabase
          .from('sms_messages')
          .insert({
            fisherman_id: fisherman.id,
            contact_id: contact.id,
            phone: contact.phone,
            message: messageTemplate,
            type: 'invitation',
            status: 'failed',
            error: error.message,
          });
        
        logStep('SMS error', { phone: contact.phone, error: error.message });
      }
    }

    // Update quota
    if (successCount > 0) {
      let smsToDeduct = successCount;
      let newFreeUsed = freeUsed;
      let newPaidBalance = paidBalance;

      const freeToUse = Math.min(smsToDeduct, freeRemaining);
      if (freeToUse > 0) {
        newFreeUsed = freeUsed + freeToUse;
        smsToDeduct -= freeToUse;
      }

      if (smsToDeduct > 0) {
        newPaidBalance = Math.max(0, paidBalance - smsToDeduct);
      }

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

    // Update last_contacted_at for contacts
    if (successCount > 0) {
      await supabase
        .from('fishermen_contacts')
        .update({ last_contacted_at: new Date().toISOString() })
        .in('id', contacts.filter((_, i) => results[i].success).map(c => c.id));
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent: successCount,
        failed: failCount,
        results,
        quota: {
          free_remaining: Math.max(0, freeRemaining - Math.min(successCount, freeRemaining)),
          paid_balance: Math.max(0, successCount > freeRemaining ? paidBalance - (successCount - freeRemaining) : paidBalance),
          total_available: totalAvailable - successCount,
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
