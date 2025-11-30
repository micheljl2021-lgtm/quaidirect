-- Unify payments and premium_subscriptions tables
-- This migration consolidates subscription tracking into the payments table

-- First, migrate existing premium_subscriptions data to payments table
INSERT INTO public.payments (
  user_id,
  plan,
  status,
  stripe_customer_id,
  stripe_subscription_id,
  current_period_start,
  current_period_end,
  started_at,
  created_at,
  updated_at
)
SELECT 
  user_id,
  'premium' as plan,
  status,
  stripe_customer_id,
  stripe_subscription_id,
  current_period_start,
  current_period_end,
  created_at as started_at,
  created_at,
  updated_at
FROM public.premium_subscriptions
WHERE NOT EXISTS (
  SELECT 1 FROM public.payments p 
  WHERE p.user_id = premium_subscriptions.user_id
  AND p.stripe_subscription_id = premium_subscriptions.stripe_subscription_id
)
ON CONFLICT DO NOTHING;

-- Drop the premium_subscriptions table as it's now redundant
DROP TABLE IF EXISTS public.premium_subscriptions CASCADE;

-- Add indexes on payments table for better performance
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_subscription_id ON public.payments(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

-- Add comment explaining the unified table
COMMENT ON TABLE public.payments IS 'Unified payment tracking table for all subscription types (fisherman, premium client). Replaces deprecated premium_subscriptions table.';