import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://quaidirect.fr',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Rate limiting configuration
const RATE_LIMIT = 3; // max messages
const RATE_WINDOW_MINUTES = 1; // per minute

const checkRateLimit = async (
  supabase: any,
  identifier: string,
  endpoint: string
): Promise<{ allowed: boolean; remaining: number }> => {
  const windowStart = new Date(Date.now() - RATE_WINDOW_MINUTES * 60 * 1000).toISOString();
  
  const { data: existing, error: fetchError } = await supabase
    .from('rate_limits')
    .select('id, request_count')
    .eq('identifier', identifier)
    .eq('endpoint', endpoint)
    .gte('window_start', windowStart)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error('Rate limit check error:', fetchError);
    return { allowed: true, remaining: RATE_LIMIT };
  }

  if (existing) {
    if (existing.request_count >= RATE_LIMIT) {
      return { allowed: false, remaining: 0 };
    }
    await supabase
      .from('rate_limits')
      .update({ request_count: existing.request_count + 1 })
      .eq('id', existing.id);
    return { allowed: true, remaining: RATE_LIMIT - existing.request_count - 1 };
  }

  await supabase.from('rate_limits').insert({
    identifier,
    endpoint,
    request_count: 1,
    window_start: new Date().toISOString(),
  });
  return { allowed: true, remaining: RATE_LIMIT - 1 };
};

// Security: HTML escape function to prevent XSS attacks
const escapeHtml = (unsafe: string): string => {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-FISHERMAN-MESSAGE] ${step}${detailsStr}`);
};

const getEmailTemplate = (type: string, fishermanName: string, dropDetails?: any) => {
  // Escape all user-provided content to prevent XSS
  const safeFishermanName = escapeHtml(fishermanName);
  const safeSubject = escapeHtml(dropDetails?.subject || '');
  const safeBody = escapeHtml(dropDetails?.body || '');
  const safeTime = escapeHtml(dropDetails?.time || '');
  const safeLocation = escapeHtml(dropDetails?.location || '');
  const safeSpecies = escapeHtml(dropDetails?.species || '');
  
  switch (type) {
    case 'invitation_initiale':
      return {
        subject: `${safeFishermanName} rejoint QuaiDirect !`,
        html: `
          <h1>Bonjour !</h1>
          <p>Je suis maintenant sur <strong>QuaiDirect</strong> !</p>
          <p>Retrouvez tous mes arrivages et points de vente sur ma page :</p>
          <p><a href="${dropDetails?.profileUrl}" style="background: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Voir mon profil</a></p>
          <p>À très bientôt,<br>${safeFishermanName}</p>
        `
      };
    case 'new_drop':
      return {
        subject: `${safeFishermanName} - Nouvel arrivage disponible !`,
        html: `
          <h1>Nouvel arrivage !</h1>
          <p><strong>${safeFishermanName}</strong> vend du poisson frais :</p>
          <ul>
            <li><strong>Quand :</strong> ${safeTime}</li>
            <li><strong>Où :</strong> ${safeLocation}</li>
            <li><strong>Espèces :</strong> ${safeSpecies}</li>
          </ul>
          <p><a href="${dropDetails?.dropUrl}" style="background: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Voir les détails</a></p>
          <p>À très bientôt,<br>${safeFishermanName}</p>
        `
      };
    case 'custom':
    default:
      return {
        subject: safeSubject || `Message de ${safeFishermanName}`,
        html: `
          <h1>Message de ${safeFishermanName}</h1>
          <p>${safeBody}</p>
          <p>Cordialement,<br>${safeFishermanName}</p>
        `
      };
  }
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

    // Récupérer le fisherman
    const { data: fisherman, error: fishermanError } = await supabaseClient
      .from('fishermen')
      .select('id, boat_name, slug')
      .eq('user_id', user.id)
      .single();

    if (fishermanError || !fisherman) throw new Error('Fisherman not found');
    logStep('Fisherman found', { fishermanId: fisherman.id });

    // Rate limiting check
    const { allowed, remaining } = await checkRateLimit(supabaseClient, user.id, 'send-fisherman-message');
    if (!allowed) {
      logStep('Rate limit exceeded', { userId: user.id });
      return new Response(
        JSON.stringify({ error: 'Limite de messages atteinte. Veuillez patienter 1 minute.' }),
        {
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'X-RateLimit-Remaining': '0',
            'Retry-After': '60'
          },
          status: 429,
        }
      );
    }
    logStep('Rate limit check passed', { remaining });

    const { message_type, subject, body, sent_to_group, drop_id, drop_details, contact_ids } = await req.json();

    // Récupérer les contacts
    let query = supabaseClient
      .from('fishermen_contacts')
      .select('*')
      .eq('fisherman_id', fisherman.id);

    // Si contact_ids fourni, filtrer par ces IDs spécifiques
    if (contact_ids && Array.isArray(contact_ids) && contact_ids.length > 0) {
      query = query.in('id', contact_ids);
      logStep('Filtering by specific contact_ids', { count: contact_ids.length });
    } else if (sent_to_group && sent_to_group !== 'all') {
      query = query.eq('contact_group', sent_to_group);
    }

    const { data: contacts, error: contactsError } = await query;
    if (contactsError) throw contactsError;

    logStep('Contacts retrieved', { count: contacts?.length });

    if (!contacts || contacts.length === 0) {
      throw new Error('Aucun contact à contacter');
    }

    // Préparer le template email
    const origin = req.headers.get('origin') || 'https://quaidirect.lovable.app';
    const emailTemplate = getEmailTemplate(message_type, fisherman.boat_name, {
      ...drop_details,
      subject,
      body,
      profileUrl: `${origin}/pecheur/${fisherman.slug}`,
      dropUrl: drop_id ? `${origin}/arrivages?drop=${drop_id}` : `${origin}/arrivages`,
    });

    // Envoyer les emails via Resend
    const emailPromises = contacts
      .filter(c => c.email)
      .map(contact => 
        resend.emails.send({
          from: 'QuaiDirect <contact@quaidirect.fr>',
          to: [contact.email],
          subject: emailTemplate.subject,
          html: emailTemplate.html,
        })
      );

    const results = await Promise.allSettled(emailPromises);
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    
    logStep('Emails sent', { successCount, totalAttempts: emailPromises.length });

    // Enregistrer le message
    const { error: messageError } = await supabaseClient
      .from('fishermen_messages')
      .insert({
        fisherman_id: fisherman.id,
        message_type,
        subject: emailTemplate.subject,
        body: body || emailTemplate.html,
        sent_to_group: sent_to_group || null,
        drop_id: drop_id || null,
        recipient_count: successCount,
        email_count: successCount,
        channel: 'email'
      });

    if (messageError) {
      logStep('ERROR inserting message', { error: JSON.stringify(messageError) });
      throw new Error(messageError.message || 'Failed to save message');
    }

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
        recipient_count: successCount,
        message: `${successCount} emails envoyés avec succès`
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': String(remaining)
        },
        status: 200,
      }
    );
  } catch (error) {
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null) {
      errorMessage = JSON.stringify(error);
    } else {
      errorMessage = String(error);
    }
    logStep('ERROR', { message: errorMessage, error });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});