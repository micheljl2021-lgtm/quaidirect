-- Enable pg_net so net.http_post exists (used by notification triggers)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Make notification triggers best-effort: never block the main transaction
CREATE OR REPLACE FUNCTION public.notify_drop_followers()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  follower_count INTEGER;
  supabase_url TEXT := 'https://topqlhxdflykejrlbuqx.supabase.co';
  supabase_anon_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvcHFsaHhkZmx5a2VqcmxidXF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MzUyNDcsImV4cCI6MjA3ODIxMTI0N30.lJu6tlpvhsUpXWCwqHJ6iVEVpSYkxBq_GZQh9ZtNpKc';
BEGIN
  SELECT COUNT(*) INTO follower_count
  FROM fishermen_followers
  WHERE fisherman_id = NEW.fisherman_id;

  IF follower_count > 0 THEN
    BEGIN
      PERFORM
        net.http_post(
          url := supabase_url || '/functions/v1/send-drop-notification',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || supabase_anon_key
          ),
          body := jsonb_build_object('dropId', NEW.id)
        );
    EXCEPTION WHEN OTHERS THEN
      -- Best-effort only: never fail drop creation because notifications failed.
      NULL;
    END;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_fisherman_on_reservation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  fisherman_user_id UUID;
  supabase_url TEXT := 'https://topqlhxdflykejrlbuqx.supabase.co';
  supabase_anon_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvcHFsaHhkZmx5a2VqcmxidXF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MzUyNDcsImV4cCI6MjA3ODIxMTI0N30.lJu6tlpvhsUpXWCwqHJ6iVEVpSYkxBq_GZQh9ZtNpKc';
BEGIN
  SELECT user_id INTO fisherman_user_id
  FROM fishermen
  WHERE id = NEW.fisherman_id;

  IF fisherman_user_id IS NOT NULL THEN
    BEGIN
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
    EXCEPTION WHEN OTHERS THEN
      -- Best-effort only: never fail basket order creation because notifications failed.
      NULL;
    END;
  END IF;

  RETURN NEW;
END;
$$;
