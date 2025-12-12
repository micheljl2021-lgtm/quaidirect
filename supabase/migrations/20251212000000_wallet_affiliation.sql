-- ============================================
-- MIGRATION: Wallet SMS + Affiliation
-- ============================================
-- Implémente le système de wallet SMS et d'affiliation pour les pêcheurs

-- Table wallet SMS pêcheur
CREATE TABLE IF NOT EXISTS fishermen_sms_wallet (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fisherman_id UUID NOT NULL REFERENCES fishermen(id) ON DELETE CASCADE,
  balance_sms INTEGER NOT NULL DEFAULT 0,
  balance_eur_cents INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(fisherman_id)
);

COMMENT ON TABLE fishermen_sms_wallet IS 'Wallet SMS des pêcheurs : solde SMS et crédits en euros';
COMMENT ON COLUMN fishermen_sms_wallet.balance_sms IS 'Solde de SMS disponibles dans le wallet';
COMMENT ON COLUMN fishermen_sms_wallet.balance_eur_cents IS 'Solde en centimes d''euros (pour référence, conversion à 0.07€/SMS)';

-- Historique des opérations wallet
CREATE TABLE IF NOT EXISTS fishermen_sms_wallet_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fisherman_id UUID NOT NULL REFERENCES fishermen(id) ON DELETE CASCADE,
  operation_type TEXT NOT NULL CHECK (operation_type IN (
    'opening_bonus', 
    'pack_purchase', 
    'affiliate_premium', 
    'affiliate_premium_plus', 
    'sms_sent', 
    'manual_adjustment'
  )),
  sms_delta INTEGER NOT NULL,
  eur_cents_delta INTEGER DEFAULT 0,
  source_user_id UUID,
  source_payment_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE fishermen_sms_wallet_history IS 'Historique de toutes les opérations sur le wallet SMS';
COMMENT ON COLUMN fishermen_sms_wallet_history.operation_type IS 'Type d''opération : opening_bonus, pack_purchase, affiliate_premium, affiliate_premium_plus, sms_sent, manual_adjustment';
COMMENT ON COLUMN fishermen_sms_wallet_history.sms_delta IS 'Variation du solde SMS (positif = crédit, négatif = débit)';
COMMENT ON COLUMN fishermen_sms_wallet_history.source_user_id IS 'ID du user à l''origine de l''opération (pour affiliation)';
COMMENT ON COLUMN fishermen_sms_wallet_history.source_payment_id IS 'ID du paiement associé (pour affiliation ou achat pack)';

-- Lien affilié pêcheur
ALTER TABLE fishermen ADD COLUMN IF NOT EXISTS affiliate_code TEXT UNIQUE;

COMMENT ON COLUMN fishermen.affiliate_code IS 'Code unique d''affiliation du pêcheur pour le partage avec les clients';

-- Tracking affiliation sur payments
ALTER TABLE payments ADD COLUMN IF NOT EXISTS referrer_fisherman_id UUID REFERENCES fishermen(id);

COMMENT ON COLUMN payments.referrer_fisherman_id IS 'ID du pêcheur parrain si le paiement provient d''une affiliation';

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_wallet_fisherman ON fishermen_sms_wallet(fisherman_id);
CREATE INDEX IF NOT EXISTS idx_wallet_history_fisherman ON fishermen_sms_wallet_history(fisherman_id);
CREATE INDEX IF NOT EXISTS idx_wallet_history_operation ON fishermen_sms_wallet_history(operation_type);
CREATE INDEX IF NOT EXISTS idx_wallet_history_created ON fishermen_sms_wallet_history(created_at);
CREATE INDEX IF NOT EXISTS idx_payments_referrer ON payments(referrer_fisherman_id);
CREATE INDEX IF NOT EXISTS idx_fishermen_affiliate_code ON fishermen(affiliate_code);

-- RLS Policies pour fishermen_sms_wallet
ALTER TABLE fishermen_sms_wallet ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Fishermen can view their own wallet"
  ON fishermen_sms_wallet FOR SELECT
  USING (fisherman_id IN (
    SELECT id FROM fishermen WHERE user_id = auth.uid()
  ));

CREATE POLICY "Admins can view all wallets"
  ON fishermen_sms_wallet FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can manage wallets"
  ON fishermen_sms_wallet FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS Policies pour fishermen_sms_wallet_history
ALTER TABLE fishermen_sms_wallet_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Fishermen can view their own wallet history"
  ON fishermen_sms_wallet_history FOR SELECT
  USING (fisherman_id IN (
    SELECT id FROM fishermen WHERE user_id = auth.uid()
  ));

CREATE POLICY "Admins can view all wallet history"
  ON fishermen_sms_wallet_history FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can manage wallet history"
  ON fishermen_sms_wallet_history FOR ALL
  USING (true)
  WITH CHECK (true);

-- Fonction RPC pour incrémenter le wallet de manière atomique
CREATE OR REPLACE FUNCTION increment_wallet_balance(
  p_fisherman_id UUID,
  p_sms_delta INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert or update wallet
  INSERT INTO fishermen_sms_wallet (fisherman_id, balance_sms, updated_at)
  VALUES (p_fisherman_id, p_sms_delta, NOW())
  ON CONFLICT (fisherman_id)
  DO UPDATE SET 
    balance_sms = fishermen_sms_wallet.balance_sms + p_sms_delta,
    updated_at = NOW();
END;
$$;

COMMENT ON FUNCTION increment_wallet_balance IS 'Fonction atomique pour incrémenter/décrémenter le solde SMS d''un wallet';
