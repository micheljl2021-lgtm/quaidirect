-- Create messages table for internal messaging
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  subject TEXT,
  body TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'general', -- 'general', 'correction_request', 'support', 'fisherman_to_fisherman'
  related_drop_id UUID REFERENCES public.drops(id) ON DELETE SET NULL,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Users can view their own messages (sent or received)
CREATE POLICY "Users can view their own messages"
ON public.messages
FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Users can send messages
CREATE POLICY "Users can send messages"
ON public.messages
FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- Users can update their own received messages (mark as read)
CREATE POLICY "Users can update received messages"
ON public.messages
FOR UPDATE
USING (auth.uid() = recipient_id);

-- Admins can view all messages
CREATE POLICY "Admins can view all messages"
ON public.messages
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can send messages
CREATE POLICY "Admins can send messages"
ON public.messages
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster queries
CREATE INDEX idx_messages_recipient ON public.messages(recipient_id, created_at DESC);
CREATE INDEX idx_messages_sender ON public.messages(sender_id, created_at DESC);
CREATE INDEX idx_messages_related_drop ON public.messages(related_drop_id);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Add trigger for updated_at
CREATE TRIGGER update_messages_updated_at
BEFORE UPDATE ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();