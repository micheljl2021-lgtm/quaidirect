-- Ajouter colonnes pour le tracking du paiement d'inscription pêcheur
ALTER TABLE public.fishermen 
ADD COLUMN onboarding_payment_status TEXT DEFAULT 'pending' CHECK (onboarding_payment_status IN ('pending', 'paid', 'free'));

ALTER TABLE public.fishermen 
ADD COLUMN onboarding_payment_id TEXT;

ALTER TABLE public.fishermen 
ADD COLUMN onboarding_paid_at TIMESTAMP WITH TIME ZONE;

-- Les pêcheurs existants passent en "free" (pas besoin de payer rétroactivement)
UPDATE public.fishermen 
SET onboarding_payment_status = 'free' 
WHERE onboarding_payment_status = 'pending' AND verified_at IS NOT NULL;