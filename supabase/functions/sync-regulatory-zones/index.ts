import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DATA_GOUV_API_BASE = 'https://api-tabulaire.data.gouv.fr/api/resources';
const RESOURCE_ID = '8132049d-6548-4720-9a2c-97402636a04a';

interface DataGouvRow {
  thematique?: string;
  zone?: string;
  nom_zone?: string;
  reglementations?: string;
  geometry?: string;
  WKT?: string;
  region?: string;
  departement?: string;
  url?: string;
  [key: string]: unknown;
}

// Simple WKT to GeoJSON converter for polygons
function wktToGeoJSON(wkt: string | null | undefined): object | null {
  if (!wkt) return null;
  
  try {
    // Handle POLYGON
    const polygonMatch = wkt.match(/POLYGON\s*\(\(([\d\s,.-]+)\)\)/i);
    if (polygonMatch) {
      const coords = polygonMatch[1].split(',').map(pair => {
        const [lon, lat] = pair.trim().split(/\s+/).map(Number);
        return [lon, lat];
      });
      return {
        type: 'Polygon',
        coordinates: [coords]
      };
    }
    
    // Handle MULTIPOLYGON
    const multiMatch = wkt.match(/MULTIPOLYGON\s*\(\(\(([\s\S]+)\)\)\)/i);
    if (multiMatch) {
      const polygons = multiMatch[1].split(')),((').map(polyStr => {
        return polyStr.split(',').map(pair => {
          const [lon, lat] = pair.trim().split(/\s+/).map(Number);
          return [lon, lat];
        });
      });
      return {
        type: 'MultiPolygon',
        coordinates: polygons.map(p => [p])
      };
    }
    
    // Handle POINT
    const pointMatch = wkt.match(/POINT\s*\(([\d\s.-]+)\)/i);
    if (pointMatch) {
      const [lon, lat] = pointMatch[1].trim().split(/\s+/).map(Number);
      return {
        type: 'Point',
        coordinates: [lon, lat]
      };
    }
    
    return null;
  } catch {
    console.error('Error parsing WKT:', wkt.substring(0, 100));
    return null;
  }
}

// Detect region from zone name or departement
function detectRegion(zone: string, departement?: string): string {
  const zoneLower = zone.toLowerCase();
  
  // Méditerranée keywords
  const medKeywords = ['méditerranée', 'mediterranée', 'golfe du lion', 'corse', 'var', 'bouches', 'hérault', 'aude', 'pyrénées-orientales', 'alpes-maritimes'];
  if (medKeywords.some(k => zoneLower.includes(k))) return 'Méditerranée';
  
  // Manche keywords
  const mancheKeywords = ['manche', 'nord', 'pas-de-calais', 'somme', 'seine-maritime', 'calvados', 'cotentin'];
  if (mancheKeywords.some(k => zoneLower.includes(k))) return 'Manche';
  
  // Atlantic keywords
  const atlKeywords = ['atlantique', 'bretagne', 'gascogne', 'golfe de gascogne', 'vendée', 'charente', 'gironde', 'landes', 'pays basque'];
  if (atlKeywords.some(k => zoneLower.includes(k))) return 'Atlantique';
  
  // Check departement code
  if (departement) {
    const medDepts = ['06', '11', '13', '20', '2A', '2B', '30', '34', '66', '83'];
    const mancheDepts = ['14', '22', '29', '35', '50', '56', '62', '76', '80'];
    if (medDepts.includes(departement)) return 'Méditerranée';
    if (mancheDepts.includes(departement)) return 'Manche';
  }
  
  return 'France'; // Default
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔄 Starting regulatory zones sync from data.gouv.fr...');
    
    const allRows: DataGouvRow[] = [];
    let page = 1;
    const pageSize = 100;
    let hasMore = true;

    // Fetch all pages from data.gouv.fr API
    while (hasMore && page <= 20) { // Max 20 pages (2000 records)
      const apiUrl = `${DATA_GOUV_API_BASE}/${RESOURCE_ID}/data/?page=${page}&page_size=${pageSize}`;
      console.log(`📥 Fetching page ${page}...`);
      
      const response = await fetch(apiUrl);
      if (!response.ok) {
        console.error(`API error: ${response.status}`);
        break;
      }
      
      const data = await response.json();
      const rows = data.data || data.results || [];
      
      if (rows.length === 0) {
        hasMore = false;
      } else {
        allRows.push(...rows);
        page++;
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log(`📊 Fetched ${allRows.length} zones from API`);

    // Get existing zones to detect changes
    const { data: existingZones } = await supabase
      .from('regulatory_fishing_zones')
      .select('external_id, reglementations');
    
    const existingMap = new Map(
      (existingZones || []).map(z => [z.external_id, z.reglementations])
    );

    // Process and upsert zones
    const zonesToUpsert = [];
    const changes = [];
    
    for (const row of allRows) {
      const zoneName = row.nom_zone || row.zone || row.thematique || 'Zone sans nom';
      const externalId = `datagouv_${row.id || zoneName.replace(/\s+/g, '_').toLowerCase().substring(0, 50)}`;
      const wkt = row.WKT || row.geometry || null;
      const geoJson = wktToGeoJSON(wkt);
      const region = detectRegion(zoneName, row.departement as string);
      
      const zoneData = {
        external_id: externalId,
        thematique: row.thematique || 'Général',
        zone_name: zoneName,
        reglementations: row.reglementations || null,
        geometry_wkt: wkt,
        geometry_geojson: geoJson,
        region: region,
        departement: row.departement || null,
        source_url: row.url || `https://www.data.gouv.fr/fr/datasets/reglementation-des-peches-cartographiee/`,
        last_updated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      zonesToUpsert.push(zoneData);
      
      // Check for changes
      const existingRegs = existingMap.get(externalId);
      if (existingRegs !== undefined && existingRegs !== row.reglementations) {
        changes.push({
          external_id: externalId,
          change_type: 'updated',
          old_reglementations: existingRegs,
          new_reglementations: row.reglementations,
        });
      } else if (existingRegs === undefined) {
        changes.push({
          external_id: externalId,
          change_type: 'new',
          new_reglementations: row.reglementations,
        });
      }
    }

    // Upsert in batches
    const batchSize = 50;
    let inserted = 0;
    let updated = 0;
    
    for (let i = 0; i < zonesToUpsert.length; i += batchSize) {
      const batch = zonesToUpsert.slice(i, i + batchSize);
      const { error } = await supabase
        .from('regulatory_fishing_zones')
        .upsert(batch, { onConflict: 'external_id' });
      
      if (error) {
        console.error('Upsert error:', error);
      } else {
        inserted += batch.length;
      }
    }

    // Record changes for notification
    if (changes.length > 0) {
      // Get zone IDs for changes
      const { data: zonesWithIds } = await supabase
        .from('regulatory_fishing_zones')
        .select('id, external_id')
        .in('external_id', changes.map(c => c.external_id));
      
      const idMap = new Map((zonesWithIds || []).map(z => [z.external_id, z.id]));
      
      const changeRecords = changes
        .filter(c => idMap.has(c.external_id))
        .map(c => ({
          zone_id: idMap.get(c.external_id),
          change_type: c.change_type,
          old_reglementations: c.old_reglementations || null,
          new_reglementations: c.new_reglementations || null,
        }));
      
      if (changeRecords.length > 0) {
        await supabase
          .from('regulatory_zone_changes')
          .insert(changeRecords);
      }
    }

    console.log(`✅ Sync complete: ${inserted} zones processed, ${changes.length} changes detected`);

    return new Response(
      JSON.stringify({
        success: true,
        zones_processed: inserted,
        changes_detected: changes.length,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Sync error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
