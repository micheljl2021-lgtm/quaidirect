-- Table pour les favoris de combinaisons d'espèces
CREATE TABLE IF NOT EXISTS fishermen_species_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fisherman_id UUID NOT NULL REFERENCES fishermen(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(10) DEFAULT '⭐',
  species_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  usage_count INT DEFAULT 0
);

-- RLS policies pour fishermen_species_presets
ALTER TABLE fishermen_species_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Fishermen can manage their own presets"
  ON fishermen_species_presets FOR ALL
  USING (
    fisherman_id IN (
      SELECT id FROM fishermen WHERE user_id = auth.uid()
    )
  );

-- Trigger pour notifications de réservation
CREATE OR REPLACE FUNCTION notify_fisherman_on_reservation()
RETURNS TRIGGER AS $$
DECLARE
  fisherman_user_id UUID;
  supabase_url TEXT := 'https://topqlhxdflykejrlbuqx.supabase.co';
  supabase_anon_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvcHFsaHhkZmx5a2VqcmxidXF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MzUyNDcsImV4cCI6MjA3ODIxMTI0N30.lJu6tlpvhsUpXWCwqHJ6iVEVpSYkxBq_GZQh9ZtNpKc';
BEGIN
  -- Récupérer le user_id du pêcheur
  SELECT user_id INTO fisherman_user_id
  FROM fishermen
  WHERE id = NEW.fisherman_id;

  -- Appeler l'Edge Function de notification
  IF fisherman_user_id IS NOT NULL THEN
    PERFORM
      net.http_post(
        url := supabase_url || '/functions/v1/send-reservation-notification',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || supabase_anon_key
        ),
        body := jsonb_build_object(
          'fishermanUserId', fisherman_user_id,
          'orderId', NEW.id,
          'basketId', NEW.basket_id
        )
      );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger sur basket_orders
DROP TRIGGER IF EXISTS on_basket_order_created ON basket_orders;
CREATE TRIGGER on_basket_order_created
  AFTER INSERT ON basket_orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_fisherman_on_reservation();