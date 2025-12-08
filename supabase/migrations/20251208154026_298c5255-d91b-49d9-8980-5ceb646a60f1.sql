-- ============================================
-- MIGRATION: Modèle abonnement client 3 niveaux
-- ============================================

-- 1. Créer l'enum client_subscription_level
CREATE TYPE client_subscription_level AS ENUM (
  'follower',     -- Gratuit
  'premium',      -- 25€/an
  'premium_plus'  -- 40€/an
);

-- 2. Modifier la table payments
ALTER TABLE payments 
ADD COLUMN subscription_level client_subscription_level DEFAULT 'follower';

ALTER TABLE payments 
ADD COLUMN sms_pool_contribution_cents INTEGER DEFAULT 0;

COMMENT ON COLUMN payments.subscription_level IS 
  'Niveau abonnement client: follower (gratuit), premium (25€/an), premium_plus (40€/an)';

COMMENT ON COLUMN payments.sms_pool_contribution_cents IS 
  'Montant en centimes versé à la cagnotte SMS pêcheurs (Premium+ uniquement: 1500 cents/an)';

-- 3. Créer table sms_pool (Cagnotte SMS pêcheurs)
CREATE TABLE sms_pool (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fisherman_id UUID NOT NULL REFERENCES fishermen(id) ON DELETE CASCADE,
  balance_cents INTEGER NOT NULL DEFAULT 0,
  total_credited_cents INTEGER NOT NULL DEFAULT 0,
  total_used_cents INTEGER NOT NULL DEFAULT 0,
  last_credited_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT sms_pool_unique_fisherman UNIQUE(fisherman_id),
  CONSTRAINT sms_pool_positive_balance CHECK (balance_cents >= 0)
);

-- Index pour performance
CREATE INDEX idx_sms_pool_fisherman ON sms_pool(fisherman_id);

-- RLS Policies pour sms_pool
ALTER TABLE sms_pool ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Fishermen can view their own pool"
  ON sms_pool FOR SELECT
  USING (fisherman_id IN (
    SELECT id FROM fishermen WHERE user_id = auth.uid()
  ));

CREATE POLICY "Admins can view all pools"
  ON sms_pool FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can manage pools"
  ON sms_pool FOR ALL
  USING (true)
  WITH CHECK (true);

-- 4. Créer table sms_pool_contributions
CREATE TABLE sms_pool_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  fisherman_id UUID NOT NULL REFERENCES fishermen(id) ON DELETE CASCADE,
  contributor_user_id UUID NOT NULL,
  amount_cents INTEGER NOT NULL,
  contribution_month DATE NOT NULL,
  contributed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT sms_pool_contributions_positive_amount CHECK (amount_cents > 0)
);

-- Index pour reporting
CREATE INDEX idx_contributions_fisherman ON sms_pool_contributions(fisherman_id);
CREATE INDEX idx_contributions_month ON sms_pool_contributions(contribution_month);
CREATE INDEX idx_contributions_contributor ON sms_pool_contributions(contributor_user_id);

-- RLS Policies pour sms_pool_contributions
ALTER TABLE sms_pool_contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Fishermen can view their contributions"
  ON sms_pool_contributions FOR SELECT
  USING (fisherman_id IN (
    SELECT id FROM fishermen WHERE user_id = auth.uid()
  ));

CREATE POLICY "Contributors can view their own contributions"
  ON sms_pool_contributions FOR SELECT
  USING (contributor_user_id = auth.uid());

CREATE POLICY "Admins can view all contributions"
  ON sms_pool_contributions FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can manage contributions"
  ON sms_pool_contributions FOR ALL
  USING (true)
  WITH CHECK (true);

-- 5. Créer table notification_preferences
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  push_enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  email_frequency TEXT DEFAULT 'instant',
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON COLUMN notification_preferences.email_frequency IS 
  'Fréquence emails: instant, daily, weekly';

-- RLS Policies pour notification_preferences
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own preferences"
  ON notification_preferences FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all preferences"
  ON notification_preferences FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- 6. Modifier fishermen_sms_usage pour allocations mensuelles
ALTER TABLE fishermen_sms_usage 
ADD COLUMN monthly_allocation INTEGER DEFAULT 100;

ALTER TABLE fishermen_sms_usage 
ADD COLUMN bonus_sms_at_signup INTEGER DEFAULT 0;

COMMENT ON COLUMN fishermen_sms_usage.monthly_allocation IS 
  'SMS alloués par mois selon le plan (100 pour Pêcheur et Pêcheur PRO)';

COMMENT ON COLUMN fishermen_sms_usage.bonus_sms_at_signup IS 
  'SMS bonus à l''inscription (500 pour Pêcheur PRO, 0 pour Pêcheur)';

-- 7. Migration des abonnements premium existants
UPDATE payments 
SET subscription_level = 'premium'
WHERE plan IN ('premium', 'premium_monthly', 'premium_annual') 
  AND status = 'active'
  AND subscription_level IS NULL;

UPDATE payments 
SET subscription_level = 'premium_plus'
WHERE plan IN ('premium_plus', 'premium_plus_monthly', 'premium_plus_annual') 
  AND status = 'active'
  AND subscription_level IS NULL;