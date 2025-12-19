import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const url = new URL(req.url);
    const region = url.searchParams.get('region');
    const thematique = url.searchParams.get('thematique');
    const search = url.searchParams.get('search');
    const departement = url.searchParams.get('departement');
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('page_size') || '50');
    const withGeometry = url.searchParams.get('with_geometry') === 'true';

    console.log(`📍 Fetching regulatory zones - region: ${region}, thematique: ${thematique}, search: ${search}`);

    // Build query
    let query = supabase
      .from('regulatory_fishing_zones')
      .select(withGeometry 
        ? '*' 
        : 'id, external_id, thematique, zone_name, reglementations, region, departement, source_url, last_updated_at, created_at'
      , { count: 'exact' });

    // Apply filters
    if (region) {
      query = query.eq('region', region);
    }
    
    if (thematique) {
      query = query.eq('thematique', thematique);
    }
    
    if (departement) {
      query = query.eq('departement', departement);
    }
    
    if (search) {
      query = query.ilike('zone_name', `%${search}%`);
    }

    // Pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to).order('zone_name');

    const { data: zones, error, count } = await query;

    if (error) {
      console.error('Query error:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get unique thematiques and regions for filters
    const { data: thematiques } = await supabase
      .from('regulatory_fishing_zones')
      .select('thematique')
      .not('thematique', 'is', null);
    
    const uniqueThematiques = [...new Set((thematiques || []).map(t => t.thematique))].filter(Boolean).sort();

    const { data: regions } = await supabase
      .from('regulatory_fishing_zones')
      .select('region')
      .not('region', 'is', null);
    
    const uniqueRegions = [...new Set((regions || []).map(r => r.region))].filter(Boolean).sort();

    return new Response(
      JSON.stringify({
        zones: zones || [],
        total: count || 0,
        page,
        page_size: pageSize,
        total_pages: Math.ceil((count || 0) / pageSize),
        filters: {
          thematiques: uniqueThematiques,
          regions: uniqueRegions,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
