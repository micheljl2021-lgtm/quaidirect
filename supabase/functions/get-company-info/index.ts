import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GET-COMPANY-INFO] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('Function started');
    
    const { siret } = await req.json();
    logStep('Request received', { siret });

    if (!siret || siret.length !== 14) {
      throw new Error('SIRET invalide (doit contenir 14 chiffres)');
    }

    const apiToken = Deno.env.get('API_ENTREPRISE_TOKEN');
    if (!apiToken) {
      throw new Error('API_ENTREPRISE_TOKEN non configuré');
    }
    logStep('API token verified');

    logStep('Calling API Entreprise', { siret });
    const response = await fetch(
      `https://entreprise.api.gouv.fr/v3/insee/sirene/etablissements/${siret}`,
      {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('SIRET introuvable');
      }
      const errorText = await response.text();
      logStep('API error', { status: response.status, error: errorText });
      throw new Error('Erreur API Entreprise');
    }

    const data = await response.json();
    const etablissement = data.data;
    logStep('Company data retrieved', { siren: etablissement.siren });

    const companyInfo = {
      companyName: etablissement.unite_legale?.denomination || 
                   `${etablissement.unite_legale?.prenom_usuel || ''} ${etablissement.unite_legale?.nom || ''}`.trim(),
      siren: etablissement.siren,
      siret: etablissement.siret,
      address: `${etablissement.adresse?.numero_voie || ''} ${etablissement.adresse?.type_voie || ''} ${etablissement.adresse?.libelle_voie || ''}`.trim(),
      postalCode: etablissement.adresse?.code_postal || '',
      city: etablissement.adresse?.libelle_commune || '',
      activityCode: etablissement.activite_principale?.code || '',
      activityLabel: etablissement.activite_principale?.libelle || '',
    };

    logStep('Company info extracted', companyInfo);

    return new Response(JSON.stringify(companyInfo), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la récupération des informations';
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
