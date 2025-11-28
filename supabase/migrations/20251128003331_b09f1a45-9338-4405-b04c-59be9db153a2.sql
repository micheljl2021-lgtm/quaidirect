-- CRITICAL SECURITY FIXES: Strengthen RLS policies on sensitive tables

-- ============================================================================
-- 1. PROFILES TABLE - Restrict access to personal data
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create strict policies
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================================
-- 2. FISHERMEN TABLE - Hide sensitive personal data from public
-- ============================================================================

-- Drop existing select policies
DROP POLICY IF EXISTS "Fishermen can view their own profile" ON public.fishermen;
DROP POLICY IF EXISTS "Admins can view all fishermen" ON public.fishermen;

-- Recreate with strict access control
CREATE POLICY "Fishermen can view their own profile"
ON public.fishermen
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all fishermen"
ON public.fishermen
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Public can only see verified fishermen with LIMITED fields (no SIRET, phone, email, address)
-- This is handled by the public_fishermen view which already filters sensitive data

-- ============================================================================
-- 3. FISHERMEN_CONTACTS - Private contact database
-- ============================================================================

-- Already has correct policies (owner + admin only)
-- No changes needed

-- ============================================================================
-- 4. FISHERMEN_MESSAGES - Private message history
-- ============================================================================

-- Already has correct policies (owner + admin only)
-- No changes needed

-- ============================================================================
-- 5. AI_CONVERSATIONS - Private AI chat history
-- ============================================================================

-- Already has correct policies (owner + admin only)
-- No changes needed

-- ============================================================================
-- 6. PAYMENTS - Sensitive payment data
-- ============================================================================

-- Already has correct policies (user + admin + service_role only)
-- No changes needed

-- ============================================================================
-- 7. PREMIUM_SUBSCRIPTIONS - Subscription data
-- ============================================================================

-- Already has correct policies (user + admin only)
-- No changes needed

-- ============================================================================
-- 8. BASKET_ORDERS - Customer order data
-- ============================================================================

-- Already has correct policies (user + fisherman + admin only)
-- No changes needed

-- ============================================================================
-- 9. SALES - Sales transaction data
-- ============================================================================

-- Verify sales policies exist and are correct
DROP POLICY IF EXISTS "Fishermen can view their own sales" ON public.sales;
DROP POLICY IF EXISTS "Buyers can view their purchases" ON public.sales;
DROP POLICY IF EXISTS "Admins can view all sales" ON public.sales;

CREATE POLICY "Fishermen can view their own sales"
ON public.sales
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM fishermen
    WHERE fishermen.id = sales.fisherman_id
    AND fishermen.user_id = auth.uid()
  )
);

CREATE POLICY "Buyers can view their purchases"
ON public.sales
FOR SELECT
TO authenticated
USING (auth.uid() = buyer_id);

CREATE POLICY "Admins can view all sales"
ON public.sales
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================================
-- 10. RESERVATIONS - Reservation data
-- ============================================================================

-- Already has correct policies (user + fisherman + admin only)
-- No changes needed

-- ============================================================================
-- 11. NOTIFICATIONS - Private user notifications
-- ============================================================================

-- Already has correct policies (user + admin only)
-- No changes needed

-- ============================================================================
-- 12. PUSH_SUBSCRIPTIONS - Device endpoints (sensitive)
-- ============================================================================

-- Already has correct policies (user only for CRUD)
-- No changes needed

-- ============================================================================
-- SECURITY AUDIT SUMMARY
-- ============================================================================
-- ✅ profiles: Restricted to owner + admin
-- ✅ fishermen: Sensitive data hidden from public (via public_fishermen view)
-- ✅ fishermen_contacts: Owner + admin only
-- ✅ fishermen_messages: Owner + admin only
-- ✅ ai_conversations: Owner + admin only
-- ✅ payments: User + admin + service_role only
-- ✅ premium_subscriptions: User + admin only
-- ✅ basket_orders: User + fisherman + admin only
-- ✅ sales: Buyer + fisherman + admin only
-- ✅ reservations: User + fisherman + admin only
-- ✅ notifications: User + admin only
-- ✅ push_subscriptions: User only