-- Create payments table for Stripe subscriptions
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  plan TEXT NOT NULL CHECK (plan IN ('monthly_4_99', 'monthly_3_49', 'monthly_6_99', 'annual_39')),
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Users can view their own payments
CREATE POLICY "Users can view their own payments"
  ON public.payments
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all payments
CREATE POLICY "Admins can view all payments"
  ON public.payments
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Service role can manage payments (for webhooks)
CREATE POLICY "Service role can manage payments"
  ON public.payments
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Add columns to sales table for caisse module
ALTER TABLE public.sales
ADD COLUMN IF NOT EXISTS final_weight_kg NUMERIC,
ADD COLUMN IF NOT EXISTS paid_method TEXT CHECK (paid_method IN ('card', 'cash', 'stripe_terminal', 'stripe_link')),
ADD COLUMN IF NOT EXISTS receipt_pdf_url TEXT;

-- Create storage bucket for receipts
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for receipts bucket
CREATE POLICY "Users can view their own receipts"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'receipts' AND
    (auth.uid()::text = (storage.foldername(name))[1])
  );

CREATE POLICY "Fishermen can view receipts for their sales"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'receipts' AND
    EXISTS (
      SELECT 1 FROM public.sales
      JOIN public.fishermen ON fishermen.id = sales.fisherman_id
      WHERE fishermen.user_id = auth.uid()
      AND sales.receipt_pdf_url LIKE '%' || name || '%'
    )
  );

CREATE POLICY "Service role can manage receipts"
  ON storage.objects
  FOR ALL
  USING (bucket_id = 'receipts' AND auth.jwt()->>'role' = 'service_role');

-- Add trigger for updated_at on payments
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_subscription_id ON public.payments(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_sales_paid_method ON public.sales(paid_method) WHERE paid_method IS NOT NULL;