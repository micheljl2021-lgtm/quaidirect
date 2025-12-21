import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { getCorsHeaders, handleCors } from '../_shared/cors.ts';

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GET-COMPANY-INFO] ${step}${detailsStr}`);
};

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const origin = req.headers.get('origin');

  try {
    logStep('Function started');
    
    const { siret } = await req.json();
    logStep('Request received', { siret });

    if (!siret || siret.length !== 14) {
      throw new Error('SIRET invalide (doit contenir 14 chiffres)');
    }

    const apiToken = Deno.env.get('PAPPERS_API_TOKEN');
    if (!apiToken) {
      throw new Error('PAPPERS_API_TOKEN non configuré');
    }
    logStep('Pappers API token verified');

    logStep('Calling Pappers API', { siret });
    const response = await fetch(
      `https://api.pappers.fr/v2/entreprise?api_token=${apiToken}&siret=${siret}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      logStep('Pappers API error', { status: response.status, error: errorText });
      
      if (response.status === 404) {
        throw new Error('SIRET introuvable');
      }
      
      if (response.status === 401) {
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.message || 'Clé API Pappers invalide ou crédits épuisés');
        } catch {
          throw new Error('Clé API Pappers invalide ou crédits épuisés');
        }
      }
      
      throw new Error('Erreur API Pappers');
    }

    const data = await response.json();
    logStep('Company data retrieved', { siren: data.siren });

    const companyInfo = {
      companyName: data.nom_entreprise || data.denomination || '',
      siren: data.siren || '',
      siret: data.siret || siret,
      address: data.siege?.adresse_ligne_1 || '',
      postalCode: data.siege?.code_postal || '',
      city: data.siege?.ville || '',
      activityCode: data.code_naf || '',
      activityLabel: data.libelle_code_naf || '',
    };

    logStep('Company info extracted', companyInfo);

    return new Response(JSON.stringify(companyInfo), {
      headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la récupération des informations';
    logStep('ERROR', { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
