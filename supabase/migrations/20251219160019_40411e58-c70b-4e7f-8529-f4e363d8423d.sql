-- Add needs_correction to drop_status enum
ALTER TYPE public.drop_status ADD VALUE IF NOT EXISTS 'needs_correction';

-- Add correction_message column to drops for admin feedback
ALTER TABLE public.drops 
ADD COLUMN IF NOT EXISTS correction_message text,
ADD COLUMN IF NOT EXISTS correction_requested_at timestamptz,
ADD COLUMN IF NOT EXISTS correction_requested_by uuid;