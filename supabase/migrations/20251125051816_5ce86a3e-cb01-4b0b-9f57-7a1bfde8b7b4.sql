-- Table pour suivre les quotas SMS mensuels des pêcheurs
CREATE TABLE fishermen_sms_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fisherman_id UUID NOT NULL REFERENCES fishermen(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL,
  free_sms_used INT DEFAULT 0,
  paid_sms_balance INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(fisherman_id, month_year)
);

CREATE INDEX idx_sms_usage_fisherman ON fishermen_sms_usage(fisherman_id);
CREATE INDEX idx_sms_usage_month ON fishermen_sms_usage(month_year);

-- Table pour historique des achats de packs SMS
CREATE TABLE fishermen_sms_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fisherman_id UUID NOT NULL REFERENCES fishermen(id) ON DELETE CASCADE,
  pack_type TEXT NOT NULL,
  sms_quantity INT NOT NULL,
  price_paid DECIMAL(10,2) NOT NULL,
  stripe_payment_intent_id TEXT,
  purchased_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_sms_packs_fisherman ON fishermen_sms_packs(fisherman_id);

-- Ajouter colonnes SMS dans fishermen_messages
ALTER TABLE fishermen_messages
ADD COLUMN channel TEXT DEFAULT 'email',
ADD COLUMN sms_count INT DEFAULT 0,
ADD COLUMN email_count INT DEFAULT 0,
ADD COLUMN sms_cost DECIMAL(10,2) DEFAULT 0;

-- RLS policies pour fishermen_sms_usage
ALTER TABLE fishermen_sms_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Fishermen can view their own SMS usage"
ON fishermen_sms_usage FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM fishermen 
    WHERE fishermen.id = fishermen_sms_usage.fisherman_id 
    AND fishermen.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all SMS usage"
ON fishermen_sms_usage FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can manage SMS usage"
ON fishermen_sms_usage FOR ALL
USING (true);

-- RLS policies pour fishermen_sms_packs
ALTER TABLE fishermen_sms_packs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Fishermen can view their own packs"
ON fishermen_sms_packs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM fishermen 
    WHERE fishermen.id = fishermen_sms_packs.fisherman_id 
    AND fishermen.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all packs"
ON fishermen_sms_packs FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can manage SMS packs"
ON fishermen_sms_packs FOR ALL
USING (true);

-- Fonction pour réinitialiser les SMS gratuits mensuels
CREATE OR REPLACE FUNCTION reset_monthly_free_sms()
RETURNS void AS $$
BEGIN
  UPDATE fishermen_sms_usage
  SET free_sms_used = 0
  WHERE month_year < to_char(now(), 'YYYY-MM');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;