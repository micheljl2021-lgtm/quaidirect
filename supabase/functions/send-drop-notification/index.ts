import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { getCorsHeaders, jsonResponse, errorResponse } from "../_shared/cors.ts";

// Input validation schema
const RequestSchema = z.object({
  dropId: z.string().uuid('dropId must be a valid UUID'),
});

// Haversine distance calculation (returns km)
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Send email via Resend
async function sendEmail(to: string, subject: string, htmlContent: string, resendApiKey: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'QuaiDirect <notification@quaidirect.fr>', to: [to], subject, html: htmlContent }),
    });
    if (!response.ok) {
      console.error(`Email send failed: ${response.status}`);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

serve(async (req) => {
  const origin = req.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const internalSecret = req.headers.get('x-internal-secret');
    const expectedSecret = Deno.env.get('INTERNAL_FUNCTION_SECRET');
    const authHeader = req.headers.get('authorization') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    
    const hasValidInternalSecret = expectedSecret && internalSecret === expectedSecret;
    const isDbTriggerCall = authHeader.includes(supabaseAnonKey) && supabaseAnonKey.length > 20;
    
    if (!hasValidInternalSecret && !isDbTriggerCall) {
      return errorResponse('Unauthorized', 401, origin);
    }

    const rawBody = await req.json();
    const validationResult = RequestSchema.safeParse(rawBody);
    
    if (!validationResult.success) {
      return errorResponse(`Validation error`, 400, origin);
    }
    
    const { dropId } = validationResult.data;
    console.log(`Processing notification for drop: ${dropId}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const siteUrl = Deno.env.get('SITE_URL') || 'https://quaidirect.fr';

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: drop, error: dropError } = await supabase
      .from('drops')
      .select(`id, sale_start_time, fisherman_id, sale_point_id, latitude, longitude,
        fishermen!inner(boat_name, company_name, display_name_preference, slug),
        offers(species(id, name)),
        ports(id, name, city, latitude, longitude),
        fisherman_sale_points(id, label, address, latitude, longitude)`)
      .eq('id', dropId)
      .single();

    if (dropError || !drop) throw new Error('Drop not found');

    const fisherman = drop.fishermen as any;
    const fishermanName = fisherman.display_name_preference === 'company_name'
      ? (fisherman.company_name || fisherman.boat_name) : fisherman.boat_name;

    const speciesNames = (drop.offers as any[])?.map((o: any) => o.species?.name).filter(Boolean).slice(0, 3).join(', ') || 'Produits frais';
    const speciesIds = (drop.offers as any[])?.map((o: any) => o.species?.id).filter(Boolean) || [];

    const saleTime = new Date(drop.sale_start_time).toLocaleString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });

    let locationName = 'Point de vente';
    let dropLat: number | null = null, dropLon: number | null = null;

    if (drop.fisherman_sale_points) {
      const sp = drop.fisherman_sale_points as any;
      locationName = sp.address || sp.label || 'Point de vente';
      dropLat = sp.latitude; dropLon = sp.longitude;
    } else if (drop.ports) {
      const port = drop.ports as any;
      locationName = `${port.name}, ${port.city}`;
      dropLat = port.latitude; dropLon = port.longitude;
    }

    // Get followers
    const { data: fishermenFollowers } = await supabase.from('fishermen_followers').select('user_id').eq('fisherman_id', drop.fisherman_id);
    const fishermenFollowerIds = fishermenFollowers?.map(f => f.user_id) || [];

    let portProximityUserIds: string[] = [];
    if (dropLat && dropLon) {
      const { data: allPortFollows } = await supabase.from('follow_ports').select(`user_id, ports(latitude, longitude)`);
      if (allPortFollows) {
        portProximityUserIds = allPortFollows.filter(fp => {
          const port = fp.ports as any;
          if (!port?.latitude || !port?.longitude) return false;
          return haversineDistance(dropLat!, dropLon!, port.latitude, port.longitude) <= 10;
        }).map(fp => fp.user_id);
      }
    }

    const pushUserIds = Array.from(new Set([...fishermenFollowerIds, ...portProximityUserIds]));
    console.log('Total PUSH users:', pushUserIds.length);

    // Note: Push notifications require proper VAPID implementation - for now we log subscriptions
    let pushSentCount = 0;
    if (pushUserIds.length > 0) {
      const { data: subscriptions } = await supabase.from('push_subscriptions').select('*').in('user_id', pushUserIds);
      console.log(`Found ${subscriptions?.length || 0} push subscriptions (push sending requires VAPID library)`);
      // TODO: Implement proper web-push with external service or library
    }

    // Email notifications
    let emailSentCount = 0;
    if (resendApiKey && speciesIds.length > 0) {
      const { data: speciesFollowers } = await supabase.from('follow_species').select('user_id').in('species_id', speciesIds);
      if (speciesFollowers?.length) {
        const { data: premiumPlusUsers } = await supabase.from('payments').select('user_id').in('user_id', speciesFollowers.map(f => f.user_id)).in('status', ['active', 'trialing']).eq('subscription_level', 'premium_plus');
        if (premiumPlusUsers?.length) {
          const { data: profiles } = await supabase.from('profiles').select('id, email').in('id', premiumPlusUsers.map(p => p.user_id)).not('email', 'is', null);
          
          const dropUrl = `${siteUrl}/drop/${dropId}`;
          const emailHtml = `<h1>🐟 Nouvel arrivage de ${fishermanName}</h1><p>${speciesNames} - ${saleTime} à ${locationName}</p><a href="${dropUrl}">Voir l'arrivage</a>`;
          
          for (const p of profiles || []) {
            if (await sendEmail(p.email!, `🐟 ${fishermanName} - ${speciesNames}`, emailHtml, resendApiKey)) emailSentCount++;
          }
        }
      }
    }

    return jsonResponse({ message: 'Notifications sent', push: { targeted: pushUserIds.length, sent: pushSentCount }, email: { sent: emailSentCount } }, 200, origin);
  } catch (error) {
    console.error('Error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Unknown error', 500, origin);
  }
});
