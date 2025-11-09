-- Enums
CREATE TYPE public.app_role AS ENUM ('admin', 'user', 'premium', 'fisherman');
CREATE TYPE public.drop_status AS ENUM ('scheduled', 'landed', 'cancelled');
CREATE TYPE public.reservation_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
CREATE TYPE public.sale_status AS ENUM ('pending', 'completed', 'refunded');

-- Table profiles (liée aux users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- Table user_roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

-- Fonction has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Table premium_subscriptions
CREATE TABLE public.premium_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.premium_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscription"
ON public.premium_subscriptions FOR SELECT
USING (auth.uid() = user_id);

-- Table ports
CREATE TABLE public.ports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  city TEXT NOT NULL,
  postal_code TEXT,
  latitude NUMERIC(10, 8) NOT NULL,
  longitude NUMERIC(11, 8) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view ports"
ON public.ports FOR SELECT
USING (true);

-- Table species
CREATE TABLE public.species (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  scientific_name TEXT,
  description TEXT,
  season_start INTEGER,
  season_end INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.species ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view species"
ON public.species FOR SELECT
USING (true);

-- Table fishermen
CREATE TABLE public.fishermen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  boat_name TEXT NOT NULL,
  boat_registration TEXT NOT NULL UNIQUE,
  siret TEXT NOT NULL UNIQUE,
  license_number TEXT,
  phone TEXT,
  bio TEXT,
  photo_url TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_fishermen_user_id ON public.fishermen(user_id);

ALTER TABLE public.fishermen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view verified fishermen"
ON public.fishermen FOR SELECT
USING (verified_at IS NOT NULL);

CREATE POLICY "Fishermen can view their own profile"
ON public.fishermen FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Fishermen can insert their own profile"
ON public.fishermen FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Fishermen can update their own profile"
ON public.fishermen FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all fishermen"
ON public.fishermen FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update fishermen"
ON public.fishermen FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Table drops
CREATE TABLE public.drops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fisherman_id UUID NOT NULL REFERENCES public.fishermen(id) ON DELETE CASCADE,
  port_id UUID NOT NULL REFERENCES public.ports(id) ON DELETE RESTRICT,
  status public.drop_status NOT NULL DEFAULT 'scheduled',
  eta_at TIMESTAMPTZ NOT NULL,
  landed_at TIMESTAMPTZ,
  latitude NUMERIC(10, 8),
  longitude NUMERIC(11, 8),
  is_premium BOOLEAN NOT NULL DEFAULT false,
  visible_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  public_visible_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_drops_fisherman ON public.drops(fisherman_id);
CREATE INDEX idx_drops_port ON public.drops(port_id);
CREATE INDEX idx_drops_eta ON public.drops(eta_at);
CREATE INDEX idx_drops_status ON public.drops(status);

ALTER TABLE public.drops ENABLE ROW LEVEL SECURITY;

-- Premium users see drops from visible_at
CREATE POLICY "Premium users can view drops from visible_at"
ON public.drops FOR SELECT
USING (
  public.has_role(auth.uid(), 'premium') 
  AND now() >= visible_at
);

-- Regular users see drops from public_visible_at
CREATE POLICY "Users can view drops from public_visible_at"
ON public.drops FOR SELECT
USING (
  public.has_role(auth.uid(), 'user')
  AND now() >= COALESCE(public_visible_at, visible_at + interval '30 minutes')
);

-- Fishermen can view their own drops
CREATE POLICY "Fishermen can view their own drops"
ON public.drops FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.fishermen
    WHERE fishermen.id = drops.fisherman_id
    AND fishermen.user_id = auth.uid()
  )
);

-- Fishermen can create drops
CREATE POLICY "Fishermen can create drops"
ON public.drops FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.fishermen
    WHERE fishermen.id = drops.fisherman_id
    AND fishermen.user_id = auth.uid()
    AND fishermen.verified_at IS NOT NULL
  )
);

-- Fishermen can update their own drops
CREATE POLICY "Fishermen can update their own drops"
ON public.drops FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.fishermen
    WHERE fishermen.id = drops.fisherman_id
    AND fishermen.user_id = auth.uid()
  )
);

-- Admins can do everything
CREATE POLICY "Admins can view all drops"
ON public.drops FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Table offers
CREATE TABLE public.offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drop_id UUID NOT NULL REFERENCES public.drops(id) ON DELETE CASCADE,
  species_id UUID NOT NULL REFERENCES public.species(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  description TEXT,
  photo_url TEXT,
  unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price > 0),
  total_units INTEGER NOT NULL CHECK (total_units > 0),
  available_units INTEGER NOT NULL CHECK (available_units >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT available_lte_total CHECK (available_units <= total_units)
);

CREATE INDEX idx_offers_drop ON public.offers(drop_id);
CREATE INDEX idx_offers_species ON public.offers(species_id);

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- Same visibility rules as drops
CREATE POLICY "Premium users can view offers"
ON public.offers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.drops
    WHERE drops.id = offers.drop_id
    AND public.has_role(auth.uid(), 'premium')
    AND now() >= drops.visible_at
  )
);

CREATE POLICY "Users can view offers from public window"
ON public.offers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.drops
    WHERE drops.id = offers.drop_id
    AND public.has_role(auth.uid(), 'user')
    AND now() >= COALESCE(drops.public_visible_at, drops.visible_at + interval '30 minutes')
  )
);

CREATE POLICY "Fishermen can view their own offers"
ON public.offers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.drops
    JOIN public.fishermen ON fishermen.id = drops.fisherman_id
    WHERE drops.id = offers.drop_id
    AND fishermen.user_id = auth.uid()
  )
);

CREATE POLICY "Fishermen can create offers"
ON public.offers FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.drops
    JOIN public.fishermen ON fishermen.id = drops.fisherman_id
    WHERE drops.id = offers.drop_id
    AND fishermen.user_id = auth.uid()
  )
);

CREATE POLICY "Fishermen can update their own offers"
ON public.offers FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.drops
    JOIN public.fishermen ON fishermen.id = drops.fisherman_id
    WHERE drops.id = offers.drop_id
    AND fishermen.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all offers"
ON public.offers FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Table reservations
CREATE TABLE public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0 AND quantity <= 5),
  status public.reservation_status NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ NOT NULL,
  confirmed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reservations_offer ON public.reservations(offer_id);
CREATE INDEX idx_reservations_user ON public.reservations(user_id);
CREATE INDEX idx_reservations_expires ON public.reservations(expires_at) WHERE status = 'pending';

ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reservations"
ON public.reservations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Premium users can create reservations"
ON public.reservations FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND public.has_role(auth.uid(), 'premium')
);

CREATE POLICY "Users can update their own reservations"
ON public.reservations FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Fishermen can view reservations for their offers"
ON public.reservations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.offers
    JOIN public.drops ON drops.id = offers.drop_id
    JOIN public.fishermen ON fishermen.id = drops.fisherman_id
    WHERE offers.id = reservations.offer_id
    AND fishermen.user_id = auth.uid()
  )
);

CREATE POLICY "Fishermen can update reservations for their offers"
ON public.reservations FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.offers
    JOIN public.drops ON drops.id = offers.drop_id
    JOIN public.fishermen ON fishermen.id = drops.fisherman_id
    WHERE offers.id = reservations.offer_id
    AND fishermen.user_id = auth.uid()
  )
);

-- Table sales
CREATE TABLE public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID REFERENCES public.reservations(id) ON DELETE SET NULL,
  offer_id UUID NOT NULL REFERENCES public.offers(id) ON DELETE RESTRICT,
  fisherman_id UUID NOT NULL REFERENCES public.fishermen(id) ON DELETE RESTRICT,
  buyer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price > 0),
  total_price NUMERIC(10, 2) NOT NULL CHECK (total_price > 0),
  status public.sale_status NOT NULL DEFAULT 'pending',
  completed_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sales_fisherman ON public.sales(fisherman_id);
CREATE INDEX idx_sales_buyer ON public.sales(buyer_id);
CREATE INDEX idx_sales_offer ON public.sales(offer_id);

ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sales"
ON public.sales FOR SELECT
USING (auth.uid() = buyer_id);

CREATE POLICY "Fishermen can view their sales"
ON public.sales FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.fishermen
    WHERE fishermen.id = sales.fisherman_id
    AND fishermen.user_id = auth.uid()
  )
);

CREATE POLICY "Fishermen can create sales"
ON public.sales FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.fishermen
    WHERE fishermen.id = sales.fisherman_id
    AND fishermen.user_id = auth.uid()
  )
);

CREATE POLICY "Fishermen can update their sales"
ON public.sales FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.fishermen
    WHERE fishermen.id = sales.fisherman_id
    AND fishermen.user_id = auth.uid()
  )
);

-- Table notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  data JSONB,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read_at) WHERE read_at IS NULL;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

-- Table audits
CREATE TABLE public.audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data JSONB,
  new_data JSONB,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audits_table_record ON public.audits(table_name, record_id);
CREATE INDEX idx_audits_user ON public.audits(user_id);

ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audits"
ON public.audits FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Table push_subscriptions
CREATE TABLE public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own push subscriptions"
ON public.push_subscriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own push subscriptions"
ON public.push_subscriptions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own push subscriptions"
ON public.push_subscriptions FOR DELETE
USING (auth.uid() = user_id);

-- Table follow_ports
CREATE TABLE public.follow_ports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  port_id UUID NOT NULL REFERENCES public.ports(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, port_id)
);

CREATE INDEX idx_follow_ports_user_id ON public.follow_ports(user_id);
CREATE INDEX idx_follow_ports_port_id ON public.follow_ports(port_id);

ALTER TABLE public.follow_ports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own port follows"
ON public.follow_ports FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own port follows"
ON public.follow_ports FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own port follows"
ON public.follow_ports FOR DELETE
USING (auth.uid() = user_id);

-- Table follow_species
CREATE TABLE public.follow_species (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  species_id UUID NOT NULL REFERENCES public.species(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, species_id)
);

CREATE INDEX idx_follow_species_user_id ON public.follow_species(user_id);
CREATE INDEX idx_follow_species_species_id ON public.follow_species(species_id);

ALTER TABLE public.follow_species ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own species follows"
ON public.follow_species FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own species follows"
ON public.follow_species FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own species follows"
ON public.follow_species FOR DELETE
USING (auth.uid() = user_id);

-- Table notifications_queue
CREATE TABLE public.notifications_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drop_id UUID NOT NULL REFERENCES public.drops(id) ON DELETE CASCADE,
  audience TEXT NOT NULL CHECK (audience IN ('premium', 'public')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_queue_scheduled ON public.notifications_queue(scheduled_at) WHERE sent_at IS NULL;
CREATE INDEX idx_notifications_queue_drop ON public.notifications_queue(drop_id);

ALTER TABLE public.notifications_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage notification queue"
ON public.notifications_queue FOR ALL
USING (true);

-- Triggers pour updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fishermen_updated_at
BEFORE UPDATE ON public.fishermen
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_drops_updated_at
BEFORE UPDATE ON public.drops
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_offers_updated_at
BEFORE UPDATE ON public.offers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Activer Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.drops;
ALTER PUBLICATION supabase_realtime ADD TABLE public.offers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reservations;

-- Seed data: ports
INSERT INTO public.ports (name, city, postal_code, latitude, longitude) VALUES
('Port d''Hyères', 'Hyères', '83400', 43.0833, 6.1500),
('Port de Toulon', 'Toulon', '83000', 43.1167, 5.9333),
('Port-en-Bessin', 'Port-en-Bessin-Huppain', '14520', 49.3458, -0.7544),
('Grandcamp-Maisy', 'Grandcamp-Maisy', '14450', 49.3900, -1.0450);

-- Seed data: species
INSERT INTO public.species (name, scientific_name, season_start, season_end) VALUES
('Bar de ligne', 'Dicentrarchus labrax', 1, 12),
('Sole', 'Solea solea', 1, 12),
('Lieu jaune', 'Pollachius pollachius', 1, 12),
('Saint-Pierre', 'Zeus faber', 1, 12),
('Turbot', 'Scophthalmus maximus', 1, 12),
('Daurade royale', 'Sparus aurata', 1, 12),
('Rouget', 'Mullus surmuletus', 1, 12);