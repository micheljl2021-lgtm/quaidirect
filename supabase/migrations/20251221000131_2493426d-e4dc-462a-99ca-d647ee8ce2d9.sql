-- ============================================
-- PHASE 6: CORRECTIONS BACKEND RLS & CONSTRAINTS
-- ============================================

-- ===== 1. POLICIES INSERT MANQUANTES =====

-- Policy INSERT pour audits (système via triggers)
DROP POLICY IF EXISTS "Service role can insert audits" ON public.audits;
CREATE POLICY "Service role can insert audits"
ON public.audits FOR INSERT
TO service_role
WITH CHECK (true);

-- Policy INSERT pour notifications (système via Edge Functions)
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;
CREATE POLICY "Service role can insert notifications"
ON public.notifications FOR INSERT
TO service_role
WITH CHECK (true);

-- Admin peut aussi créer notifications
DROP POLICY IF EXISTS "Admins can insert notifications" ON public.notifications;
CREATE POLICY "Admins can insert notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ===== 2. POLICIES DELETE MANQUANTES =====

-- Fishermen can delete their drops
DROP POLICY IF EXISTS "Fishermen can delete their drops" ON public.drops;
CREATE POLICY "Fishermen can delete their drops"
ON public.drops FOR DELETE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.fishermen
  WHERE fishermen.id = drops.fisherman_id
  AND fishermen.user_id = auth.uid()
));

-- Admin can delete drops
DROP POLICY IF EXISTS "Admins can delete drops" ON public.drops;
CREATE POLICY "Admins can delete drops"
ON public.drops FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Fishermen can delete their offers
DROP POLICY IF EXISTS "Fishermen can delete their offers" ON public.offers;
CREATE POLICY "Fishermen can delete their offers"
ON public.offers FOR DELETE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.drops
  JOIN public.fishermen ON fishermen.id = drops.fisherman_id
  WHERE drops.id = offers.drop_id
  AND fishermen.user_id = auth.uid()
));

-- Admin can delete offers
DROP POLICY IF EXISTS "Admins can delete offers" ON public.offers;
CREATE POLICY "Admins can delete offers"
ON public.offers FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Users can delete/cancel their reservations
DROP POLICY IF EXISTS "Users can delete their reservations" ON public.reservations;
CREATE POLICY "Users can delete their reservations"
ON public.reservations FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Fishermen can delete reservations on their drops
DROP POLICY IF EXISTS "Fishermen can delete reservations on their drops" ON public.reservations;
CREATE POLICY "Fishermen can delete reservations on their drops"
ON public.reservations FOR DELETE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.offers
  JOIN public.drops ON drops.id = offers.drop_id
  JOIN public.fishermen ON fishermen.id = drops.fisherman_id
  WHERE offers.id = reservations.offer_id
  AND fishermen.user_id = auth.uid()
));

-- Fishermen can delete their drop photos
DROP POLICY IF EXISTS "Fishermen can delete their drop photos" ON public.drop_photos;
CREATE POLICY "Fishermen can delete their drop photos"
ON public.drop_photos FOR DELETE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.drops
  JOIN public.fishermen ON fishermen.id = drops.fisherman_id
  WHERE drops.id = drop_photos.drop_id
  AND fishermen.user_id = auth.uid()
));

-- Admin can delete drop photos
DROP POLICY IF EXISTS "Admins can delete drop photos" ON public.drop_photos;
CREATE POLICY "Admins can delete drop photos"
ON public.drop_photos FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Fishermen can delete their offer photos
DROP POLICY IF EXISTS "Fishermen can delete their offer photos" ON public.offer_photos;
CREATE POLICY "Fishermen can delete their offer photos"
ON public.offer_photos FOR DELETE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.offers
  JOIN public.drops ON drops.id = offers.drop_id
  JOIN public.fishermen ON fishermen.id = drops.fisherman_id
  WHERE offers.id = offer_photos.offer_id
  AND fishermen.user_id = auth.uid()
));

-- Admin can delete offer photos
DROP POLICY IF EXISTS "Admins can delete offer photos" ON public.offer_photos;
CREATE POLICY "Admins can delete offer photos"
ON public.offer_photos FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ===== 3. CONTRAINTES DB MANQUANTES =====

-- Constraint status sur basket_orders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'basket_orders_status_check'
  ) THEN
    ALTER TABLE public.basket_orders
    ADD CONSTRAINT basket_orders_status_check
    CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'refunded'));
  END IF;
END $$;

-- Constraint channel sur fishermen_messages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fishermen_messages_channel_check'
  ) THEN
    ALTER TABLE public.fishermen_messages
    ADD CONSTRAINT fishermen_messages_channel_check
    CHECK (channel IS NULL OR channel IN ('email', 'sms', 'both'));
  END IF;
END $$;

-- Constraint status sur fishermen_messages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fishermen_messages_status_check'
  ) THEN
    ALTER TABLE public.fishermen_messages
    ADD CONSTRAINT fishermen_messages_status_check
    CHECK (status IS NULL OR status IN ('pending', 'sent', 'failed', 'partial'));
  END IF;
END $$;

-- ===== 4. INDEX PERFORMANCE RLS =====

CREATE INDEX IF NOT EXISTS idx_drops_status_visibility 
ON public.drops(status, public_visible_at, visible_at);

CREATE INDEX IF NOT EXISTS idx_drops_fisherman_status 
ON public.drops(fisherman_id, status);

CREATE INDEX IF NOT EXISTS idx_offers_drop_id 
ON public.offers(drop_id);

CREATE INDEX IF NOT EXISTS idx_reservations_user_status 
ON public.reservations(user_id, status);

CREATE INDEX IF NOT EXISTS idx_fishermen_user_id 
ON public.fishermen(user_id);

CREATE INDEX IF NOT EXISTS idx_fishermen_verified 
ON public.fishermen(verified_at) 
WHERE verified_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_drop_photos_drop_id 
ON public.drop_photos(drop_id);

CREATE INDEX IF NOT EXISTS idx_offer_photos_offer_id 
ON public.offer_photos(offer_id);