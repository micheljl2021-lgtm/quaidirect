-- Create table for tracking AI usage per user per day
CREATE TABLE public.ai_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
    request_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, usage_date)
);

-- Enable RLS
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

-- Users can only see their own usage
CREATE POLICY "Users can view own AI usage"
ON public.ai_usage
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own usage
CREATE POLICY "Users can insert own AI usage"
ON public.ai_usage
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own usage
CREATE POLICY "Users can update own AI usage"
ON public.ai_usage
FOR UPDATE
USING (auth.uid() = user_id);

-- Function to get or create today's usage and check quota
CREATE OR REPLACE FUNCTION public.check_and_increment_ai_usage(p_user_id UUID, p_user_role TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_limit INTEGER;
    v_current_count INTEGER;
    v_result JSON;
BEGIN
    -- Set limit based on role
    CASE p_user_role
        WHEN 'admin' THEN v_limit := -1; -- unlimited
        WHEN 'fisherman' THEN v_limit := 20;
        WHEN 'premium' THEN v_limit := 5;
        ELSE v_limit := 0; -- no access
    END CASE;

    -- Get or create today's usage
    INSERT INTO public.ai_usage (user_id, usage_date, request_count)
    VALUES (p_user_id, CURRENT_DATE, 0)
    ON CONFLICT (user_id, usage_date) DO NOTHING;

    -- Get current count
    SELECT request_count INTO v_current_count
    FROM public.ai_usage
    WHERE user_id = p_user_id AND usage_date = CURRENT_DATE;

    -- Check if allowed
    IF v_limit = 0 THEN
        RETURN json_build_object('allowed', false, 'remaining', 0, 'limit', 0, 'reason', 'no_access');
    ELSIF v_limit > 0 AND v_current_count >= v_limit THEN
        RETURN json_build_object('allowed', false, 'remaining', 0, 'limit', v_limit, 'reason', 'quota_exceeded');
    END IF;

    -- Increment counter
    UPDATE public.ai_usage
    SET request_count = request_count + 1, updated_at = now()
    WHERE user_id = p_user_id AND usage_date = CURRENT_DATE;

    -- Return result
    IF v_limit = -1 THEN
        RETURN json_build_object('allowed', true, 'remaining', -1, 'limit', -1, 'reason', 'unlimited');
    ELSE
        RETURN json_build_object('allowed', true, 'remaining', v_limit - v_current_count - 1, 'limit', v_limit, 'reason', 'ok');
    END IF;
END;
$$;

-- Function to get current usage without incrementing
CREATE OR REPLACE FUNCTION public.get_ai_usage(p_user_id UUID, p_user_role TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_limit INTEGER;
    v_current_count INTEGER;
BEGIN
    -- Set limit based on role
    CASE p_user_role
        WHEN 'admin' THEN v_limit := -1;
        WHEN 'fisherman' THEN v_limit := 20;
        WHEN 'premium' THEN v_limit := 5;
        ELSE v_limit := 0;
    END CASE;

    -- Get current count (default 0 if no record)
    SELECT COALESCE(request_count, 0) INTO v_current_count
    FROM public.ai_usage
    WHERE user_id = p_user_id AND usage_date = CURRENT_DATE;

    IF v_current_count IS NULL THEN
        v_current_count := 0;
    END IF;

    IF v_limit = -1 THEN
        RETURN json_build_object('used', v_current_count, 'remaining', -1, 'limit', -1);
    ELSE
        RETURN json_build_object('used', v_current_count, 'remaining', GREATEST(0, v_limit - v_current_count), 'limit', v_limit);
    END IF;
END;
$$;