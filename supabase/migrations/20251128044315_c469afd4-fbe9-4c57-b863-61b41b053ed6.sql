-- ============================================
-- PHASE 1: SÉCURITÉ CRITIQUE - RLS POLICIES
-- ============================================

-- 1. Renforcer la table profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 2. Renforcer la table fishermen
DROP POLICY IF EXISTS "Fishermen can view their own profile" ON public.fishermen;

CREATE POLICY "Fishermen can view their own profile"
ON public.fishermen
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

-- 3. Renforcer la table fishermen_contacts
DROP POLICY IF EXISTS "Fishermen can manage their own contacts" ON public.fishermen_contacts;

CREATE POLICY "Fishermen can view their own contacts"
ON public.fishermen_contacts
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM fishermen
    WHERE fishermen.id = fishermen_contacts.fisherman_id
    AND fishermen.user_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin')
);

CREATE POLICY "Fishermen can insert their own contacts"
ON public.fishermen_contacts
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM fishermen
    WHERE fishermen.id = fishermen_contacts.fisherman_id
    AND fishermen.user_id = auth.uid()
  )
);

CREATE POLICY "Fishermen can update their own contacts"
ON public.fishermen_contacts
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM fishermen
    WHERE fishermen.id = fishermen_contacts.fisherman_id
    AND fishermen.user_id = auth.uid()
  )
);

CREATE POLICY "Fishermen can delete their own contacts"
ON public.fishermen_contacts
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM fishermen
    WHERE fishermen.id = fishermen_contacts.fisherman_id
    AND fishermen.user_id = auth.uid()
  )
);

-- 4. Renforcer la table basket_orders
DROP POLICY IF EXISTS "Users can view their own basket orders" ON public.basket_orders;
DROP POLICY IF EXISTS "Users can create their own basket orders" ON public.basket_orders;
DROP POLICY IF EXISTS "Users can update their own basket orders" ON public.basket_orders;

CREATE POLICY "Users can view their own basket orders"
ON public.basket_orders
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM fishermen
    WHERE fishermen.id = basket_orders.fisherman_id
    AND fishermen.user_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can create their own basket orders"
ON public.basket_orders
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own basket orders"
ON public.basket_orders
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- 5. Renforcer la table sales (buyer_id est de type string/text)
DROP POLICY IF EXISTS "Fishermen can view their own sales" ON public.sales;

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
  OR (buyer_id IS NOT NULL AND buyer_id::uuid = auth.uid())
  OR has_role(auth.uid(), 'admin')
);

-- 6. Renforcer la table payments
DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;

CREATE POLICY "Users can view their own payments"
ON public.payments
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

-- 7. Renforcer ai_conversations
DROP POLICY IF EXISTS "Fishermen can manage their AI conversations" ON public.ai_conversations;

CREATE POLICY "Fishermen can view their own AI conversations"
ON public.ai_conversations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM fishermen
    WHERE fishermen.id = ai_conversations.fisherman_id
    AND fishermen.user_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin')
);

CREATE POLICY "Fishermen can create their own AI conversations"
ON public.ai_conversations
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM fishermen
    WHERE fishermen.id = ai_conversations.fisherman_id
    AND fishermen.user_id = auth.uid()
  )
);

CREATE POLICY "Fishermen can update their own AI conversations"
ON public.ai_conversations
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM fishermen
    WHERE fishermen.id = ai_conversations.fisherman_id
    AND fishermen.user_id = auth.uid()
  )
);

-- 8. Renforcer push_subscriptions
DROP POLICY IF EXISTS "Users can view their own push subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users can insert their own push subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users can delete their own push subscriptions" ON public.push_subscriptions;

CREATE POLICY "Users can view their own push subscriptions"
ON public.push_subscriptions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own push subscriptions"
ON public.push_subscriptions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own push subscriptions"
ON public.push_subscriptions
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);