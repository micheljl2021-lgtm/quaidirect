-- Block anonymous access to messages table
CREATE POLICY "Block anonymous access to messages"
ON public.messages
FOR ALL
TO anon
USING (false)
WITH CHECK (false);