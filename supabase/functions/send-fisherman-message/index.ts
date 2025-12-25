import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { getCorsHeaders, handleCors } from "../_shared/cors.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Use SITE_URL env variable - NO fallback to lovable.app
const SITE_URL = Deno.env.get("SITE_URL") || "https://quaidirect.fr";

// Request validation schema
const RequestSchema = z.object({
  message_type: z.enum(['invitation_initiale', 'new_drop', 'custom']),
  subject: z.string().max(200).optional(),
  body: z.string().max(5000).optional(),
  sent_to_group: z.string().max(100).optional(),
  drop_id: z.string().uuid().optional().nullable(),
  drop_details: z.object({
    time: z.string().optional(),
    location: z.string().optional(),
    species: z.string().optional(),
  }).optional(),
  contact_ids: z.array(z.string().uuid()).optional(),
  channel: z.enum(['email', 'sms', 'both']).default('email'),
});

// Rate limiting configuration - 10 messages per 5 minutes
const RATE_LIMIT = 10;
const RATE_WINDOW_MINUTES = 5;

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

// Security: HTML escape function
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

interface FishermanData {
  id: string;
  boat_name: string;
  slug: string | null;
  company_name?: string;
  main_fishing_zone?: string;
  favorite_photo_url?: string;
  photo_boat_1?: string;
  photo_url?: string;
  affiliate_code?: string;
}

const getFishermanPhoto = (fisherman: FishermanData): string | null => {
  return fisherman.favorite_photo_url || fisherman.photo_boat_1 || fisherman.photo_url || null;
};

/**
 * Build a tracked URL with referrer code
 */
const buildTrackedUrl = (baseUrl: string, affiliateCode?: string): string => {
  if (!affiliateCode) return baseUrl;
  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}ref=${affiliateCode}`;
};

const getEmailTemplate = (type: string, fisherman: FishermanData, dropDetails?: any) => {
  const safeFishermanName = escapeHtml(fisherman.boat_name);
  const safeCompanyName = escapeHtml(fisherman.company_name || '');
  const safeZone = escapeHtml(fisherman.main_fishing_zone || '');
  const safeSubject = escapeHtml(dropDetails?.subject || '');
  const safeBody = escapeHtml(dropDetails?.body || '');
  const safeTime = escapeHtml(dropDetails?.time || '');
  const safeLocation = escapeHtml(dropDetails?.location || '');
  const safeSpecies = escapeHtml(dropDetails?.species || '');
  
  // Build tracked URLs with affiliate code - fallback to ID if slug is missing
  const affiliateCode = fisherman.affiliate_code;
  const fishermanSlugOrId = fisherman.slug || fisherman.id;
  const profileUrl = buildTrackedUrl(`${SITE_URL}/pecheurs/${fishermanSlugOrId}`, affiliateCode);
  const dropUrl = dropDetails?.drop_id 
    ? buildTrackedUrl(`${SITE_URL}/drop/${dropDetails.drop_id}`, affiliateCode)
    : buildTrackedUrl(`${SITE_URL}/arrivages`, affiliateCode);
  const premiumUrl = buildTrackedUrl(`${SITE_URL}/premium`, affiliateCode);
  
  const photoUrl = getFishermanPhoto(fisherman);
  
  // Common email wrapper with branding + premium mention
  const wrapEmail = (content: string, ctaText: string, ctaUrl: string) => `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #0066cc 0%, #0052a3 100%); padding: 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;">🐟 QuaiDirect</h1>
          <p style="color: #e0e7ff; margin: 8px 0 0 0; font-size: 14px;">Poisson frais, direct du pêcheur</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 32px 24px;">
          ${content}
          
          <!-- CTA Button -->
          <div style="text-align: center; margin: 32px 0;">
            <a href="${ctaUrl}" style="display: inline-block; background: linear-gradient(135deg, #0066cc 0%, #0052a3 100%); color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">${ctaText}</a>
          </div>
          
          <!-- Fisherman Mini Card -->
          <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; margin-top: 24px; border: 1px solid #e2e8f0;">
            <div style="display: flex; align-items: center;">
              ${photoUrl ? `<img src="${photoUrl}" alt="${safeFishermanName}" style="width: 64px; height: 64px; border-radius: 8px; object-fit: cover; margin-right: 16px;">` : ''}
              <div>
                <p style="margin: 0; font-weight: 600; font-size: 16px; color: #1e293b;">${safeFishermanName}</p>
                ${safeCompanyName ? `<p style="margin: 4px 0 0 0; font-size: 14px; color: #64748b;">${safeCompanyName}</p>` : ''}
                ${safeZone ? `<p style="margin: 4px 0 0 0; font-size: 13px; color: #94a3b8;">📍 ${safeZone}</p>` : ''}
              </div>
            </div>
            <a href="${profileUrl}" style="display: block; text-align: center; margin-top: 16px; color: #0066cc; font-size: 14px; text-decoration: none;">Voir le profil du pêcheur →</a>
          </div>
          
          <!-- Premium mention -->
          <div style="margin-top: 24px; padding: 16px; background-color: #fef3c7; border-radius: 8px; border: 1px solid #fcd34d;">
            <p style="margin: 0; font-size: 14px; color: #92400e;">
              <strong>💡 Astuce :</strong> Créez un compte <a href="${premiumUrl}" style="color: #0066cc; font-weight: 600;">Premium</a> pour recevoir des alertes prioritaires et soutenir directement ce pêcheur !
            </p>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f1f5f9; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0; font-size: 13px; color: #64748b;">
            Vous recevez cet email car vous êtes inscrit aux alertes de ${safeFishermanName}.
          </p>
          <p style="margin: 12px 0 0 0; font-size: 13px; color: #94a3b8;">
            <a href="${SITE_URL}" style="color: #0066cc; text-decoration: none;">QuaiDirect</a> • Poisson frais en circuit court
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  switch (type) {
    case 'invitation_initiale':
      return {
        subject: `${safeFishermanName} vous invite à découvrir ses arrivages !`,
        html: wrapEmail(
          `
            <h2 style="color: #1e293b; margin: 0 0 16px 0; font-size: 22px;">Bonjour !</h2>
            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
              <strong>${safeFishermanName}</strong> est maintenant sur <strong>QuaiDirect</strong> et souhaite vous tenir informé(e) de ses prochains arrivages.
            </p>
            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
              Retrouvez sur sa page :
            </p>
            <ul style="color: #475569; font-size: 15px; line-height: 1.8; margin: 0 0 16px 0; padding-left: 20px;">
              <li>Ses prochains arrivages et points de vente</li>
              <li>Les espèces qu'il pêche</li>
              <li>Ses horaires de vente à quai</li>
            </ul>
            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0;">
              Vous pouvez aussi créer un compte gratuit pour recevoir des alertes en priorité !
            </p>
          `,
          'Voir le profil',
          profileUrl
        )
      };
      
    case 'new_drop':
      return {
        subject: `🐟 ${safeFishermanName} - Nouvel arrivage disponible !`,
        html: wrapEmail(
          `
            <h2 style="color: #1e293b; margin: 0 0 16px 0; font-size: 22px;">Nouvel arrivage !</h2>
            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
              <strong>${safeFishermanName}</strong> vient de publier un nouvel arrivage de poisson frais.
            </p>
            
            <div style="background-color: #eff6ff; border-left: 4px solid #0066cc; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
              ${safeTime ? `<p style="margin: 0 0 8px 0; font-size: 15px; color: #1e40af;"><strong>🕐 Quand :</strong> ${safeTime}</p>` : ''}
              ${safeLocation ? `<p style="margin: 0 0 8px 0; font-size: 15px; color: #1e40af;"><strong>📍 Où :</strong> ${safeLocation}</p>` : ''}
              ${safeSpecies ? `<p style="margin: 0; font-size: 15px; color: #1e40af;"><strong>🐟 Espèces :</strong> ${safeSpecies}</p>` : ''}
            </div>
            
            <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0;">
              Rendez-vous à quai pour découvrir la pêche du jour !
            </p>
          `,
          'Voir l\'arrivage',
          dropUrl
        )
      };
      
    case 'custom':
    default:
      return {
        subject: safeSubject || `Message de ${safeFishermanName}`,
        html: wrapEmail(
          `
            <h2 style="color: #1e293b; margin: 0 0 16px 0; font-size: 22px;">Message de ${safeFishermanName}</h2>
            <div style="color: #475569; font-size: 16px; line-height: 1.6; white-space: pre-wrap;">${safeBody}</div>
          `,
          'Voir le profil',
          profileUrl
        )
      };
  }
};

serve(async (req) => {
  // Handle CORS preflight with domain restriction
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const origin = req.headers.get('Origin');

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

    // Get fisherman with more fields for email template + affiliate_code for tracking
    const { data: fisherman, error: fishermanError } = await supabaseClient
      .from('fishermen')
      .select('id, boat_name, slug, company_name, main_fishing_zone, favorite_photo_url, photo_boat_1, photo_url, affiliate_code')
      .eq('user_id', user.id)
      .single();

    if (fishermanError || !fisherman) throw new Error('Fisherman not found');
    logStep('Fisherman found', { fishermanId: fisherman.id, hasAffiliateCode: !!fisherman.affiliate_code });

    // Auto-generate affiliate_code if missing
    if (!fisherman.affiliate_code) {
      const newAffiliateCode = fisherman.id.slice(0, 8).toUpperCase();
      const { error: updateError } = await supabaseClient
        .from('fishermen')
        .update({ affiliate_code: newAffiliateCode })
        .eq('id', fisherman.id);
      
      if (!updateError) {
        fisherman.affiliate_code = newAffiliateCode;
        logStep('Auto-generated affiliate_code', { affiliateCode: newAffiliateCode });
      } else {
        logStep('Failed to auto-generate affiliate_code', { error: updateError });
      }
    }

    // Rate limiting check
    const { allowed, remaining } = await checkRateLimit(supabaseClient, user.id, 'send-fisherman-message');
    if (!allowed) {
      logStep('Rate limit exceeded', { userId: user.id });
      return new Response(
        JSON.stringify({ error: 'Limite de messages atteinte (10 envois / 5 min). Veuillez patienter quelques minutes.' }),
        {
          headers: { 
            ...getCorsHeaders(origin), 
            'Content-Type': 'application/json',
            'X-RateLimit-Remaining': '0',
            'Retry-After': '300'
          },
          status: 429,
        }
      );
    }
    logStep('Rate limit check passed', { remaining });

    // Parse and validate request body
    const rawBody = await req.json();
    const parseResult = RequestSchema.safeParse(rawBody);
    
    if (!parseResult.success) {
      logStep('Validation error', { errors: parseResult.error.flatten() });
      return new Response(
        JSON.stringify({ 
          error: 'Données invalides', 
          details: parseResult.error.flatten().fieldErrors 
        }),
        {
          headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    const { message_type, subject, body, sent_to_group, drop_id, drop_details, contact_ids, channel } = parseResult.data;

    // Get contacts
    let query = supabaseClient
      .from('fishermen_contacts')
      .select('*')
      .eq('fisherman_id', fisherman.id);

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

    // Prepare email template with tracked URLs
    const emailTemplate = getEmailTemplate(message_type, fisherman, {
      ...drop_details,
      subject,
      body,
      drop_id,
    });

    let emailSuccessCount = 0;
    let smsSuccessCount = 0;

    // Send emails if channel is 'email' or 'both'
    if (channel === 'email' || channel === 'both') {
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

      const emailResults = await Promise.allSettled(emailPromises);
      emailSuccessCount = emailResults.filter(r => r.status === 'fulfilled').length;
      logStep('Emails sent', { successCount: emailSuccessCount, totalAttempts: emailPromises.length });
    }

    // Send SMS if channel is 'sms' or 'both'
    if (channel === 'sms' || channel === 'both') {
      const contactsWithPhone = contacts.filter(c => c.phone);
      
      if (contactsWithPhone.length > 0) {
        let smsMessage = '';
        // Include tracking link in SMS - fallback to ID if slug missing
        const smsSlugOrId = fisherman.slug || fisherman.id;
        const smsProfileUrl = fisherman.affiliate_code 
          ? `https://quaidirect.fr/pecheurs/${smsSlugOrId}?ref=${fisherman.affiliate_code}`
          : `https://quaidirect.fr/pecheurs/${smsSlugOrId}`;
        
        switch (message_type) {
          case 'invitation_initiale':
            smsMessage = `${fisherman.boat_name} est sur QuaiDirect ! Arrivages: ${smsProfileUrl}`;
            break;
          case 'new_drop':
            smsMessage = `${fisherman.boat_name} - Arrivage ! ${drop_details?.time || ''} ${drop_details?.location || ''}. ${smsProfileUrl}`;
            break;
          case 'custom':
          default:
            smsMessage = body?.slice(0, 120) || 'Message de votre pêcheur';
            smsMessage += ` ${smsProfileUrl}`;
            break;
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const phones = contactsWithPhone.map(c => c.phone);
        
        try {
          const smsResponse = await fetch(`${supabaseUrl}/functions/v1/send-sms`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': req.headers.get('Authorization') || '',
            },
            body: JSON.stringify({ phones, message: smsMessage }),
          });

          const smsResult = await smsResponse.json();
          
          if (smsResult.error === 'TWILIO_NOT_CONFIGURED') {
            logStep('SMS skipped - Twilio not configured');
          } else if (smsResult.ok) {
            smsSuccessCount = smsResult.sent || 0;
            logStep('SMS sent', { successCount: smsSuccessCount });
          } else {
            logStep('SMS failed', { error: smsResult.error });
          }
        } catch (smsError) {
          logStep('SMS error', { error: smsError });
        }
      }
    }

    // recipient_count = unique contacts touched (not sum of email+sms)
    const uniqueRecipientCount = contacts?.length || 0;

    // Save message
    const { error: messageError } = await supabaseClient
      .from('fishermen_messages')
      .insert({
        fisherman_id: fisherman.id,
        message_type,
        subject: emailTemplate.subject,
        body: body || emailTemplate.html,
        sent_to_group: sent_to_group || null,
        drop_id: drop_id || null,
        recipient_count: uniqueRecipientCount,
        email_count: emailSuccessCount,
        sms_count: smsSuccessCount,
        channel: channel,
      });

    if (messageError) {
      logStep('ERROR inserting message', { error: JSON.stringify(messageError) });
      throw new Error(messageError.message || 'Failed to save message');
    }

    // Update last_contacted_at for contacts
    if (contacts && contacts.length > 0) {
      const contactIdsList = contacts.map(c => c.id);
      await supabaseClient
        .from('fishermen_contacts')
        .update({ last_contacted_at: new Date().toISOString() })
        .in('id', contactIdsList);
    }

    logStep('Message saved and contacts updated', { affiliateCode: fisherman.affiliate_code });

    return new Response(
      JSON.stringify({
        success: true,
        recipient_count: uniqueRecipientCount,
        email_count: emailSuccessCount,
        sms_count: smsSuccessCount,
        affiliate_code: fisherman.affiliate_code,
      }),
      {
        headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    logStep('ERROR', { message: error.message });
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...getCorsHeaders(null), 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
