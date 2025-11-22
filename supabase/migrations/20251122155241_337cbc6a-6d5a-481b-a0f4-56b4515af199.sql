-- Add onboarding management fields to fishermen table
ALTER TABLE public.fishermen
ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS onboarding_data JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS can_edit_profile BOOLEAN DEFAULT true;

-- Add comment for clarity
COMMENT ON COLUMN public.fishermen.onboarding_step IS 'Current step in onboarding process (1-5)';
COMMENT ON COLUMN public.fishermen.onboarding_data IS 'Temporary storage for incomplete onboarding data';
COMMENT ON COLUMN public.fishermen.can_edit_profile IS 'Whether fisherman can edit their profile (depends on payment status)';

-- Update existing fishermen to have edit rights
UPDATE public.fishermen
SET can_edit_profile = true
WHERE onboarding_paid_at IS NOT NULL;