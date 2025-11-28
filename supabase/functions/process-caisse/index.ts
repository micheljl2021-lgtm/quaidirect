import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PROCESS-CAISSE] ${step}${detailsStr}`);
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

// Generate PDF receipt content (HTML)
const generateReceiptHTML = (data: any) => {
  const {
    fisherman,
    port,
    reservation,
    offer,
    species,
    finalWeight,
    finalPrice,
    totalAmount,
    paidMethod,
    saleDate,
  } = data;

  // Escape all user-provided data to prevent XSS
  const safeBoatName = escapeHtml(fisherman.boat_name || '');
  const safeBoatRegistration = escapeHtml(fisherman.boat_registration || '');
  const safeSiret = escapeHtml(fisherman.siret || '');
  const safeLicense = escapeHtml(fisherman.license_number || 'N/A');
  const safePortName = escapeHtml(port.name || '');
  const safePortCity = escapeHtml(port.city || '');
  const safeSpeciesName = escapeHtml(species.name || '');
  const safeScientificName = escapeHtml(species.scientific_name || 'N/A');
  const safeOfferTitle = escapeHtml(offer.title || 'N/A');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    .header { text-align: center; margin-bottom: 30px; }
    .title { font-size: 24px; font-weight: bold; }
    .section { margin: 20px 0; }
    .label { font-weight: bold; }
    .info-grid { display: grid; grid-template-columns: 150px 1fr; gap: 10px; }
    .divider { border-top: 2px solid #333; margin: 20px 0; }
    .total { font-size: 20px; font-weight: bold; text-align: right; }
    .footer { margin-top: 40px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">REÇU DE VENTE - POISSON FRAIS</div>
    <p>QuaiDirect - Vente directe du pêcheur</p>
  </div>

  <div class="section">
    <h3>INFORMATIONS DU PÊCHEUR</h3>
    <div class="info-grid">
      <span class="label">Navire:</span>
      <span>${safeBoatName}</span>
      <span class="label">Immatriculation:</span>
      <span>${safeBoatRegistration}</span>
      <span class="label">SIRET:</span>
      <span>${safeSiret}</span>
      <span class="label">Licence:</span>
      <span>${safeLicense}</span>
    </div>
  </div>

  <div class="divider"></div>

  <div class="section">
    <h3>LIEU ET DATE</h3>
    <div class="info-grid">
      <span class="label">Port:</span>
      <span>${safePortName}, ${safePortCity}</span>
      <span class="label">Date de vente:</span>
      <span>${new Date(saleDate).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}</span>
    </div>
  </div>

  <div class="divider"></div>

  <div class="section">
    <h3>PRODUIT VENDU</h3>
    <div class="info-grid">
      <span class="label">Espèce:</span>
      <span>${safeSpeciesName} (${safeScientificName})</span>
      <span class="label">Code FAO:</span>
      <span>${safeOfferTitle}</span>
      <span class="label">Méthode de pêche:</span>
      <span>Ligne / Filet (selon déclaration)</span>
      <span class="label">Poids:</span>
      <span>${finalWeight} kg</span>
      <span class="label">Prix unitaire:</span>
      <span>${finalPrice.toFixed(2)} €/kg</span>
    </div>
  </div>

  <div class="divider"></div>

  <div class="section">
    <div class="info-grid">
      <span class="label">Mode de paiement:</span>
      <span>${paidMethod === 'cash' ? 'Espèces' : paidMethod === 'card' ? 'Carte Bancaire' : 'Stripe Terminal/Lien'}</span>
    </div>
  </div>

  <div class="section">
    <div class="total">
      TOTAL: ${totalAmount.toFixed(2)} € TTC
    </div>
    <p style="text-align: right; font-size: 12px; color: #666;">
      (TVA non applicable - Article 293 B du CGI)
    </p>
  </div>

  <div class="footer">
    <p>Document généré automatiquement par QuaiDirect</p>
    <p>Conformité réglementaire: Vente directe du pêcheur au consommateur</p>
    <p>Pour toute question: contact@quaidirect.fr</p>
  </div>
</body>
</html>
  `;
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
    if (userError || !userData.user) throw new Error('Not authenticated');

    const user = userData.user;
    logStep('User authenticated', { userId: user.id });

    const {
      reservationId,
      finalWeightKg,
      finalPricePerKg,
      paidMethod,
    } = await req.json();

    logStep('Request data', { reservationId, finalWeightKg, finalPricePerKg, paidMethod });

    // Fetch reservation with related data
    const { data: reservation, error: resError } = await supabaseClient
      .from('reservations')
      .select(`
        *,
        offer:offers(
          *,
          drop:drops(
            *,
            port:ports(*),
            fisherman:fishermen(*)
          ),
          species:species(*)
        ),
        user:profiles!reservations_user_id_fkey(*)
      `)
      .eq('id', reservationId)
      .single();

    if (resError || !reservation) {
      logStep('ERROR: Reservation not found', { error: resError });
      throw new Error('Reservation not found');
    }

    logStep('Reservation fetched', { reservationId: reservation.id });

    // Verify fisherman ownership
    const { data: fisherman } = await supabaseClient
      .from('fishermen')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!fisherman || fisherman.id !== reservation.offer.drop.fisherman_id) {
      throw new Error('Unauthorized: Not your reservation');
    }

    // Calculate total
    const totalAmount = finalWeightKg * finalPricePerKg;
    const totalAmountCents = Math.round(totalAmount * 100);

    // Update reservation status
    const { error: updateResError } = await supabaseClient
      .from('reservations')
      .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
      .eq('id', reservationId);

    if (updateResError) {
      logStep('ERROR updating reservation', { error: updateResError });
      throw updateResError;
    }

    logStep('Reservation confirmed');

    // Generate PDF HTML
    const receiptHTML = generateReceiptHTML({
      fisherman: reservation.offer.drop.fisherman,
      port: reservation.offer.drop.port,
      reservation,
      offer: reservation.offer,
      species: reservation.offer.species,
      finalWeight: finalWeightKg,
      finalPrice: finalPricePerKg,
      totalAmount,
      paidMethod,
      saleDate: new Date().toISOString(),
    });

    // Store PDF HTML as a file in storage (simple approach)
    const fileName = `receipt_${reservationId}_${Date.now()}.html`;
    const { error: uploadError } = await supabaseClient.storage
      .from('receipts')
      .upload(`${user.id}/${fileName}`, new Blob([receiptHTML], { type: 'text/html' }), {
        contentType: 'text/html',
      });

    if (uploadError) {
      logStep('ERROR uploading receipt', { error: uploadError });
      throw uploadError;
    }

    const receiptUrl = `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/receipts/${user.id}/${fileName}`;
    logStep('Receipt uploaded', { url: receiptUrl });

    // Create sale record
    const { error: saleError } = await supabaseClient
      .from('sales')
      .insert({
        reservation_id: reservationId,
        offer_id: reservation.offer_id,
        fisherman_id: fisherman.id,
        buyer_id: reservation.user_id,
        quantity: reservation.quantity,
        unit_price: finalPricePerKg,
        total_price: totalAmount,
        final_weight_kg: finalWeightKg,
        paid_method: paidMethod,
        receipt_pdf_url: receiptUrl,
        status: 'completed',
        completed_at: new Date().toISOString(),
      });

    if (saleError) {
      logStep('ERROR creating sale', { error: saleError });
      throw saleError;
    }

    logStep('Sale record created');

    // TODO: Send email with receipt (requires email service integration)
    // For now, we'll just return success

    return new Response(
      JSON.stringify({
        success: true,
        receiptUrl,
        message: 'Réservation confirmée ! Reçu envoyé par e-mail.',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep('ERROR in process-caisse', { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
