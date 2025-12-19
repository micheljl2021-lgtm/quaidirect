-- Add fields for public visitors who send messages (no account required)
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS sender_email text,
ADD COLUMN IF NOT EXISTS sender_name text;

-- Comment for clarity
COMMENT ON COLUMN public.messages.sender_email IS 'Email of visitor who sent message (for non-authenticated users)';
COMMENT ON COLUMN public.messages.sender_name IS 'Name of visitor who sent message (for non-authenticated users)';