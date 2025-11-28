-- ============================================================
-- SÉCURITÉ : Blocage explicite accès anonyme sur tables sensibles
-- ============================================================
-- Best practice : avoir des policies explicites bloquant l'accès anonyme
-- plutôt que de compter uniquement sur l'absence de policies permissives

-- 1. PROFILES - Données clients sensibles
CREATE POLICY "Block anonymous access to profiles"
ON public.profiles
FOR ALL
TO anon
USING (false);

-- 2. FISHERMEN - Données business sensibles
CREATE POLICY "Block anonymous access to fishermen"
ON public.fishermen
FOR ALL
TO anon
USING (false);

-- 3. FISHERMEN_CONTACTS - Listes de contacts clients
CREATE POLICY "Block anonymous access to contacts"
ON public.fishermen_contacts
FOR ALL
TO anon
USING (false);

-- 4. BASKET_ORDERS - Commandes clients
CREATE POLICY "Block anonymous access to basket orders"
ON public.basket_orders
FOR ALL
TO anon
USING (false);

-- 5. SALES - Transactions commerciales
CREATE POLICY "Block anonymous access to sales"
ON public.sales
FOR ALL
TO anon
USING (false);

-- 6. PAYMENTS - Paiements et abonnements
CREATE POLICY "Block anonymous access to payments"
ON public.payments
FOR ALL
TO anon
USING (false);

-- 7. PREMIUM_SUBSCRIPTIONS - Abonnements premium
CREATE POLICY "Block anonymous access to premium subscriptions"
ON public.premium_subscriptions
FOR ALL
TO anon
USING (false);

-- 8. AI_CONVERSATIONS - Conversations IA sensibles
CREATE POLICY "Block anonymous access to AI conversations"
ON public.ai_conversations
FOR ALL
TO anon
USING (false);

-- 9. FISHERMEN_MESSAGES - Messages des pêcheurs
CREATE POLICY "Block anonymous access to fishermen messages"
ON public.fishermen_messages
FOR ALL
TO anon
USING (false);