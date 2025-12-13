-- Mettre à jour la contrainte CHECK pour supporter les nouveaux plans pêcheur
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_plan_check;

ALTER TABLE public.payments 
ADD CONSTRAINT payments_plan_check 
CHECK (plan IN (
  'monthly_4_99', 
  'monthly_3_49', 
  'monthly_6_99', 
  'annual_39',
  'fisherman_basic',
  'fisherman_standard',
  'fisherman_pro',
  'fisherman_elite'
));
