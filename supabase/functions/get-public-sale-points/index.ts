import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getCorsHeaders, handleCors } from '../_shared/cors.ts';

// Rate limiting configuration
const RATE_LIMIT = 30; // max requests (higher for public data endpoint)
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

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const origin = req.headers.get('origin');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Supabase environment variables are not configured');
    }

    const supabaseClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // Rate limiting - build robust identifier (avoid "unknown" global)
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('x-real-ip')
      || 'noip';
    const userAgent = req.headers.get('user-agent') || 'no-ua';
    // Create hash-like identifier from IP + shortened user-agent
    const uaHash = userAgent.substring(0, 32);
    const identifier = `${clientIP}:${uaHash}`;
    
    const { allowed, remaining } = await checkRateLimit(supabaseClient, identifier, 'get-public-sale-points');
    if (!allowed) {
      console.log(`[GET-PUBLIC-SALE-POINTS] Rate limit exceeded for identifier: ${identifier}`);
      return new Response(
        JSON.stringify({ error: 'Trop de requêtes. Veuillez patienter une minute.' }),
        {
          headers: { 
            ...getCorsHeaders(origin), 
            'Content-Type': 'application/json',
            'X-RateLimit-Remaining': '0',
            'Retry-After': '60'
          },
          status: 429,
        }
      );
    }

    const { data, error } = await supabaseClient
      .from('fisherman_sale_points')
      .select(`
        id,
        label,
        address,
        latitude,
        longitude,
        photo_url,
        fisherman_id,
        fishermen!fisherman_sale_points_fisherman_id_fkey (
          id,
          boat_name,
          photo_url,
          bio,
          fishing_methods,
          company_name,
          slug
        )
      `)
      .order('label');

    if (error) {
      console.error('[get-public-sale-points] Supabase error', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(data ?? []),
      { status: 200, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[get-public-sale-points] Unexpected error', message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
    );
  }
});
