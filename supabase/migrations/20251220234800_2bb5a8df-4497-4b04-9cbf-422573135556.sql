
-- ==========================================================
-- PHASE 2: DATABASE OPTIMIZATIONS (FIXED)
-- ==========================================================

-- 1. ADD MISSING INDEXES FOR RLS PERFORMANCE
-- ----------------------------------------

-- Index on feedback.user_id for RLS queries
CREATE INDEX IF NOT EXISTS idx_feedback_user_id 
ON public.feedback(user_id);

-- Index on fishermen_species_presets.fisherman_id for RLS queries
CREATE INDEX IF NOT EXISTS idx_fishermen_species_presets_fisherman_id 
ON public.fishermen_species_presets(fisherman_id);

-- Index on support_requests.fisherman_id for RLS queries
CREATE INDEX IF NOT EXISTS idx_support_requests_fisherman_id 
ON public.support_requests(fisherman_id);

-- Composite index for notifications (user_id + read_at for unread queries)
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
ON public.notifications(user_id, read_at) 
WHERE read_at IS NULL;

-- Index for drops visible_at queries (premium/public visibility)
CREATE INDEX IF NOT EXISTS idx_drops_visible_at 
ON public.drops(visible_at, public_visible_at) 
WHERE status IN ('scheduled', 'landed');

-- Index for payments status queries
CREATE INDEX IF NOT EXISTS idx_payments_status 
ON public.payments(status) 
WHERE status = 'active';

-- Index for reservations expiration check
CREATE INDEX IF NOT EXISTS idx_reservations_expires_at 
ON public.reservations(expires_at) 
WHERE status = 'pending';

-- 2. ADD MISSING CHECK CONSTRAINTS
-- --------------------------------

-- Constraint on launch_subscribers.status
ALTER TABLE public.launch_subscribers
DROP CONSTRAINT IF EXISTS launch_subscribers_status_check;

ALTER TABLE public.launch_subscribers
ADD CONSTRAINT launch_subscribers_status_check 
CHECK (status IN ('new', 'contacted', 'responded', 'converted', 'declined'));

-- Note: support_requests.status uses enum 'support_status' which is already constrained

-- 3. ADD COMMENTS FOR DOCUMENTATION
-- ----------------------------------

COMMENT ON TABLE public.audits IS 'Audit trail for all table modifications - INSERT/UPDATE/DELETE tracked';
COMMENT ON TABLE public.rate_limits IS 'Rate limiting tracker for API endpoints - cleaned periodically';
COMMENT ON TABLE public.sms_pool IS 'SMS credit pool per fisherman from premium subscriptions';
COMMENT ON TABLE public.sms_pool_contributions IS 'Individual contributions to fisherman SMS pools from premium users';
COMMENT ON TABLE public.support_requests IS 'Support requests from fishermen - status managed by support_status enum';

-- 4. OPTIMIZE EXISTING FUNCTIONS
-- ------------------------------

-- Add search_path to cleanup_rate_limits if not set
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM rate_limits
  WHERE window_start < now() - INTERVAL '1 hour';
END;
$$;

-- Create function to cleanup expired reservations
CREATE OR REPLACE FUNCTION public.cleanup_expired_reservations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE reservations
  SET 
    status = 'expired',
    cancelled_at = now(),
    updated_at = now()
  WHERE 
    status = 'pending'
    AND expires_at < now();
    
  -- Restore available units for expired reservations
  UPDATE offers o
  SET available_units = available_units + r.quantity
  FROM reservations r
  WHERE r.offer_id = o.id
  AND r.status = 'expired'
  AND r.cancelled_at > now() - INTERVAL '1 minute';
END;
$$;

-- Create function to get fisherman stats efficiently
CREATE OR REPLACE FUNCTION public.get_fisherman_stats(p_fisherman_id UUID)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_drops', (SELECT COUNT(*) FROM drops WHERE fisherman_id = p_fisherman_id),
    'active_drops', (SELECT COUNT(*) FROM drops WHERE fisherman_id = p_fisherman_id AND status IN ('scheduled', 'landed')),
    'total_sales', (SELECT COALESCE(SUM(total_price), 0) FROM sales s JOIN offers o ON s.offer_id = o.id JOIN drops d ON o.drop_id = d.id WHERE d.fisherman_id = p_fisherman_id),
    'followers_count', (SELECT COUNT(*) FROM fishermen_followers WHERE fisherman_id = p_fisherman_id),
    'contacts_count', (SELECT COUNT(*) FROM fishermen_contacts WHERE fisherman_id = p_fisherman_id)
  ) INTO result;
  
  RETURN result;
END;
$$;

-- 5. ADD MISSING UPDATE TRIGGER FOR updated_at
-- ---------------------------------------------

-- Ensure update_updated_at_column function exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Add trigger to sms_pool table
DROP TRIGGER IF EXISTS update_sms_pool_updated_at ON public.sms_pool;
CREATE TRIGGER update_sms_pool_updated_at 
BEFORE UPDATE ON public.sms_pool 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. ADD GRANT FOR cleanup functions to be callable via cron
-- -----------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.cleanup_rate_limits() TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_reservations() TO authenticated;
GRANT EXECUTE ON FUNCTION public.archive_expired_drops() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_fisherman_stats(UUID) TO authenticated;
