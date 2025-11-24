import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-FISHERMAN-MESSAGE] ${step}${detailsStr}`);
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

    // Récupérer le fisherman_id
    const { data: fisherman, error: fishermanError } = await supabaseClient
      .from('fishermen')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (fishermanError || !fisherman) throw new Error('Fisherman not found');
    logStep('Fisherman found', { fishermanId: fisherman.id });

    const { message_type, subject, body, sent_to_group, drop_id } = await req.json();

    // Récupérer les contacts
    let query = supabaseClient
      .from('fishermen_contacts')
      .select('*')
      .eq('fisherman_id', fisherman.id);

    if (sent_to_group && sent_to_group !== 'all') {
      query = query.eq('contact_group', sent_to_group);
    }

    const { data: contacts, error: contactsError } = await query;
    if (contactsError) throw contactsError;

    logStep('Contacts retrieved', { count: contacts?.length });

    // Pour l'instant, on enregistre juste le message
    // L'envoi réel d'emails/SMS nécessiterait Resend/Twilio
    const { error: messageError } = await supabaseClient
      .from('fishermen_messages')
      .insert({
        fisherman_id: fisherman.id,
        message_type,
        subject,
        body,
        sent_to_group: sent_to_group || null,
        drop_id: drop_id || null,
        recipient_count: contacts?.length || 0
      });

    if (messageError) throw messageError;

    // Mettre à jour last_contacted_at pour les contacts
    if (contacts && contacts.length > 0) {
      const contactIds = contacts.map(c => c.id);
      await supabaseClient
        .from('fishermen_contacts')
        .update({ last_contacted_at: new Date().toISOString() })
        .in('id', contactIds);
    }

    logStep('Message saved and contacts updated');

    return new Response(
      JSON.stringify({
        success: true,
        recipient_count: contacts?.length || 0,
        message: 'Message enregistré. L\'envoi réel nécessite configuration Resend/Twilio.'
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
