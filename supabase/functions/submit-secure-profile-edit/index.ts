import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://quaidirect.fr",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting configuration
const RATE_LIMIT = 5; // max requests
const RATE_WINDOW_MINUTES = 1; // per minute

// URL regex pattern for validation
const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;

// Input validation schema with comprehensive field validation
const ProfileEditSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  boat_name: z.string().max(100, 'Boat name must be less than 100 characters').optional(),
  company_name: z.string().max(200, 'Company name must be less than 200 characters').optional(),
  description: z.string().max(2000, 'Description must be less than 2000 characters').optional(),
  phone: z.string()
    .regex(/^(\+33|0)[1-9]\d{8}$/, 'Invalid French phone number format')
    .optional()
    .or(z.literal('')),
  fishing_methods: z.array(z.string().max(50)).max(10, 'Maximum 10 fishing methods').optional(),
  fishing_zones: z.array(z.string().max(100)).max(20, 'Maximum 20 fishing zones').optional(),
  main_fishing_zone: z.string().max(100, 'Main fishing zone must be less than 100 characters').optional(),
  photo_url: z.string().url('Invalid photo URL').max(500).optional().or(z.literal('')),
  photo_boat_1: z.string().url('Invalid photo URL').max(500).optional().or(z.literal('')),
  photo_boat_2: z.string().url('Invalid photo URL').max(500).optional().or(z.literal('')),
  photo_dock_sale: z.string().url('Invalid photo URL').max(500).optional().or(z.literal('')),
  instagram_url: z.string()
    .regex(/^(https?:\/\/)?(www\.)?instagram\.com\/[a-zA-Z0-9._]+\/?$/, 'Invalid Instagram URL')
    .max(200)
    .optional()
    .or(z.literal('')),
  facebook_url: z.string()
    .regex(/^(https?:\/\/)?(www\.)?facebook\.com\/[a-zA-Z0-9.]+\/?$/, 'Invalid Facebook URL')
    .max(200)
    .optional()
    .or(z.literal('')),
  website_url: z.string()
    .regex(urlPattern, 'Invalid website URL')
    .max(200)
    .optional()
    .or(z.literal('')),
  bio: z.string().max(1000, 'Bio must be less than 1000 characters').optional(),
});

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

// Sanitize text to prevent XSS
const sanitizeText = (text: string | undefined): string | undefined => {
  if (!text) return text;
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Rate limiting - use IP address for unauthenticated endpoint
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const { allowed, remaining } = await checkRateLimit(supabaseClient, clientIP, 'submit-secure-profile-edit');
    if (!allowed) {
      console.log(`[SUBMIT-PROFILE-EDIT] Rate limit exceeded for IP ${clientIP}`);
      return new Response(
        JSON.stringify({ success: false, error: 'Trop de requêtes. Veuillez patienter.' }),
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

    // Validate input with Zod
    const rawBody = await req.json();
    const validationResult = ProfileEditSchema.safeParse(rawBody);
    
    if (!validationResult.success) {
      const errorMessages = validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      console.error("[SUBMIT-PROFILE-EDIT] Validation error:", errorMessages);
      return new Response(
        JSON.stringify({ success: false, error: `Validation error: ${errorMessages}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { token, ...updateData } = validationResult.data;

    // Revalider le token
    const { data: tokenData, error: tokenError } = await supabaseClient
      .from("secure_edit_tokens")
      .select("*")
      .eq("token", token)
      .single();

    if (tokenError || !tokenData) {
      throw new Error("Token invalide");
    }

    // Vérifications de sécurité
    const now = new Date();
    const expiresAt = new Date(tokenData.expires_at);
    if (now > expiresAt) throw new Error("Token expiré");
    if (tokenData.used_at) throw new Error("Token déjà utilisé");
    if (tokenData.revoked_at) throw new Error("Token révoqué");

    // Récupérer les anciennes données pour l'audit
    const { data: oldData } = await supabaseClient
      .from("fishermen")
      .select("*")
      .eq("id", tokenData.fisherman_id)
      .single();

    // Préparer les données de mise à jour (exclure les champs sensibles)
    const allowedFields = [
      'boat_name', 'company_name', 'description', 'phone',
      'fishing_methods', 'fishing_zones', 'main_fishing_zone',
      'photo_url', 'photo_boat_1', 'photo_boat_2', 'photo_dock_sale',
      'instagram_url', 'facebook_url', 'website_url', 'bio'
    ];

    // Filter and sanitize update data
    const filteredUpdate = Object.fromEntries(
      Object.entries(updateData)
        .filter(([key]) => allowedFields.includes(key))
        .map(([key, value]) => {
          // Sanitize text fields
          if (typeof value === 'string' && !key.includes('url')) {
            return [key, sanitizeText(value)];
          }
          return [key, value];
        })
    );

    // Mettre à jour le profil
    const { error: updateError } = await supabaseClient
      .from("fishermen")
      .update({
        ...filteredUpdate,
        updated_at: new Date().toISOString()
      })
      .eq("id", tokenData.fisherman_id);

    if (updateError) throw new Error(`Erreur mise à jour: ${updateError.message}`);

    // Calculer les champs modifiés
    const fieldsChanged = Object.keys(filteredUpdate).filter(
      key => JSON.stringify(oldData[key]) !== JSON.stringify(filteredUpdate[key])
    );

    // Logger les modifications pour audit
    await supabaseClient
      .from("profile_edit_logs")
      .insert({
        fisherman_id: tokenData.fisherman_id,
        token_id: tokenData.id,
        old_data: oldData,
        new_data: { ...oldData, ...filteredUpdate },
        fields_changed: fieldsChanged,
        ip_address: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
        user_agent: req.headers.get("user-agent")
      });

    // Marquer le token comme utilisé
    await supabaseClient
      .from("secure_edit_tokens")
      .update({ used_at: new Date().toISOString() })
      .eq("id", tokenData.id);

    // Résoudre la demande support associée si elle existe
    if (tokenData.support_request_id) {
      await supabaseClient
        .from("support_requests")
        .update({ 
          status: "resolved",
          updated_at: new Date().toISOString()
        })
        .eq("id", tokenData.support_request_id);
    }

    console.log(`Profil mis à jour pour pêcheur ${tokenData.fisherman_id}, ${fieldsChanged.length} champs modifiés`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Votre profil a été mis à jour avec succès",
        fieldsChanged
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("Erreur submit-secure-profile-edit:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
};

serve(handler);
