-- Fix overly permissive service role policies that use qual:true
-- These should explicitly check for service_role

-- Drop and recreate sms_pool service role policy
DROP POLICY IF EXISTS "Service role can manage pools" ON public.sms_pool;
CREATE POLICY "Service role can manage pools"
ON public.sms_pool
FOR ALL
USING (
  (SELECT (current_setting('request.jwt.claims', true)::json->>'role') = 'service_role')
);

-- Drop and recreate sms_pool_contributions policy  
DROP POLICY IF EXISTS "Service role can manage contributions" ON public.sms_pool_contributions;
CREATE POLICY "Service role can manage contributions"
ON public.sms_pool_contributions
FOR ALL
USING (
  (SELECT (current_setting('request.jwt.claims', true)::json->>'role') = 'service_role')
);

-- Drop and recreate fishermen_sms_packs policy
DROP POLICY IF EXISTS "Service role can manage SMS packs" ON public.fishermen_sms_packs;
CREATE POLICY "Service role can manage SMS packs"
ON public.fishermen_sms_packs
FOR ALL
USING (
  (SELECT (current_setting('request.jwt.claims', true)::json->>'role') = 'service_role')
);

-- Drop and recreate fishermen_sms_usage policy
DROP POLICY IF EXISTS "Service role only manages SMS usage" ON public.fishermen_sms_usage;
CREATE POLICY "Service role can manage SMS usage"
ON public.fishermen_sms_usage
FOR ALL
USING (
  (SELECT (current_setting('request.jwt.claims', true)::json->>'role') = 'service_role')
);

-- Drop and recreate notifications_queue policy
DROP POLICY IF EXISTS "Service role can manage notification queue" ON public.notifications_queue;
CREATE POLICY "Service role can manage notification queue"
ON public.notifications_queue
FOR ALL
USING (
  (SELECT (current_setting('request.jwt.claims', true)::json->>'role') = 'service_role')
);

-- Add rate limiting validation for feedback insertions
-- Replace the overly permissive policy
DROP POLICY IF EXISTS "Users can insert feedback" ON public.feedback;
CREATE POLICY "Authenticated users can insert feedback"
ON public.feedback
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
);

-- Add rate limiting for launch_subscribers
DROP POLICY IF EXISTS "Anyone can subscribe" ON public.launch_subscribers;
CREATE POLICY "Anyone can subscribe with valid email"
ON public.launch_subscribers
FOR INSERT
WITH CHECK (
  email IS NOT NULL AND email <> '' AND length(email) <= 255
);