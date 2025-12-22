-- Create FCM tokens table to store Firebase Cloud Messaging tokens
CREATE TABLE IF NOT EXISTS public.fcm_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  token TEXT NOT NULL,
  device_info TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, token)
);

-- Enable RLS
ALTER TABLE public.fcm_tokens ENABLE ROW LEVEL SECURITY;

-- Users can view their own tokens
CREATE POLICY "Users can view their own FCM tokens"
ON public.fcm_tokens
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own tokens
CREATE POLICY "Users can insert their own FCM tokens"
ON public.fcm_tokens
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own tokens
CREATE POLICY "Users can delete their own FCM tokens"
ON public.fcm_tokens
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_user_id ON public.fcm_tokens(user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_fcm_tokens_updated_at
BEFORE UPDATE ON public.fcm_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();