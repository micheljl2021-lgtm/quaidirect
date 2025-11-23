-- Add RLS policies for admin access to all tables (drop and recreate to handle existing ones)

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view all sales" ON public.sales;
DROP POLICY IF EXISTS "Admins can view all reservations" ON public.reservations;
DROP POLICY IF EXISTS "Admins can view all premium subscriptions" ON public.premium_subscriptions;
DROP POLICY IF EXISTS "Admins can view all offers" ON public.offers;
DROP POLICY IF EXISTS "Admins can manage all notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all fishermen followers" ON public.fishermen_followers;
DROP POLICY IF EXISTS "Admins can view all follow ports" ON public.follow_ports;
DROP POLICY IF EXISTS "Admins can view all follow species" ON public.follow_species;

-- Create all admin policies
CREATE POLICY "Admins can view all sales"
ON public.sales
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view all reservations"
ON public.reservations
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view all premium subscriptions"
ON public.premium_subscriptions
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view all offers"
ON public.offers
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage all notifications"
ON public.notifications
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage user roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view all fishermen followers"
ON public.fishermen_followers
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view all follow ports"
ON public.follow_ports
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view all follow species"
ON public.follow_species
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));