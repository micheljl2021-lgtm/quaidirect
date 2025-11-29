-- Create ENUM types for support requests
CREATE TYPE public.support_category AS ENUM (
  'profile_modification',
  'technical',
  'commercial',
  'other'
);

CREATE TYPE public.support_status AS ENUM (
  'pending',
  'in_progress',
  'resolved',
  'rejected'
);

-- Create support_requests table
CREATE TABLE public.support_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fisherman_id UUID NOT NULL REFERENCES public.fishermen(id) ON DELETE CASCADE,
  category support_category NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status support_status NOT NULL DEFAULT 'pending',
  admin_response TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.support_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Fishermen can view their own requests
CREATE POLICY "Fishermen can view their own support requests"
ON public.support_requests
FOR SELECT
USING (
  fisherman_id IN (
    SELECT id FROM public.fishermen WHERE user_id = auth.uid()
  )
);

-- Policy: Fishermen can create their own requests
CREATE POLICY "Fishermen can create support requests"
ON public.support_requests
FOR INSERT
WITH CHECK (
  fisherman_id IN (
    SELECT id FROM public.fishermen WHERE user_id = auth.uid()
  )
);

-- Policy: Admins can view all requests
CREATE POLICY "Admins can view all support requests"
ON public.support_requests
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Policy: Admins can update all requests
CREATE POLICY "Admins can update support requests"
ON public.support_requests
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_support_requests_updated_at
BEFORE UPDATE ON public.support_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();