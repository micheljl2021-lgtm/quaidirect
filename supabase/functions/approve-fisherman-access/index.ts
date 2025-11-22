import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify admin role
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error('Authentication error:', userError);
      return new Response(
        JSON.stringify({ error: 'Non authentifié' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin using service role client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: hasRole, error: roleError } = await supabaseAdmin
      .rpc('has_role', { _user_id: user.id, _role: 'admin' });

    if (roleError || !hasRole) {
      console.error('Role verification error:', roleError);
      return new Response(
        JSON.stringify({ error: 'Accès refusé - Admin uniquement' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { email } = await req.json();
    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const emailLower = email.toLowerCase().trim();
    console.log(`Admin ${user.email} approving free access for ${emailLower}`);

    // Find user by email (case-insensitive)
    const { data: { users }, error: searchError } = await supabaseAdmin.auth.admin.listUsers();
    if (searchError) {
      console.error('Error searching users:', searchError);
      throw searchError;
    }

    const targetUser = users.find(u => u.email?.toLowerCase() === emailLower);
    if (!targetUser) {
      return new Response(
        JSON.stringify({ error: 'Utilisateur non trouvé' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user already has a fisherman profile
    const { data: existingFisherman, error: checkError } = await supabaseAdmin
      .from('fishermen')
      .select('id, onboarding_payment_status')
      .eq('user_id', targetUser.id)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing fisherman:', checkError);
      throw checkError;
    }

    if (existingFisherman) {
      return new Response(
        JSON.stringify({ 
          error: 'Cet utilisateur a déjà un profil pêcheur',
          status: existingFisherman.onboarding_payment_status
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create fisherman entry with free status
    const { data: newFisherman, error: insertError } = await supabaseAdmin
      .from('fishermen')
      .insert({
        user_id: targetUser.id,
        boat_name: 'À compléter',
        boat_registration: 'À compléter',
        siret: 'À compléter',
        onboarding_payment_status: 'free',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating fisherman:', insertError);
      throw insertError;
    }

    console.log(`✅ Free access approved for ${email} by admin ${user.email}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Accès pêcheur gratuit approuvé pour ${email}`,
        fisherman: newFisherman
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Error in approve-fisherman-access:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erreur inconnue' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
