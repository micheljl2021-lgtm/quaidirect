-- Allow users to upsert their own FCM tokens (upsert may perform UPDATE)
CREATE POLICY "Users can update their own FCM tokens"
ON public.fcm_tokens
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
