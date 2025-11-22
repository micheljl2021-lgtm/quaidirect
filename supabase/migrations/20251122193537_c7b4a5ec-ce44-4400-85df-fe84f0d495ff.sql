-- Fix security warning: Set search_path for notify_drop_followers function
CREATE OR REPLACE FUNCTION notify_drop_followers()
RETURNS TRIGGER AS $$
DECLARE
  follower_count INTEGER;
  supabase_url TEXT := 'https://topqlhxdflykejrlbuqx.supabase.co';
  supabase_anon_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvcHFsaHhkZmx5a2VqcmxidXF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MzUyNDcsImV4cCI6MjA3ODIxMTI0N30.lJu6tlpvhsUpXWCwqHJ6iVEVpSYkxBq_GZQh9ZtNpKc';
BEGIN
  -- Compter les followers pour ce pêcheur
  SELECT COUNT(*) INTO follower_count
  FROM fishermen_followers
  WHERE fisherman_id = NEW.fisherman_id;

  -- Si le pêcheur a des followers, déclencher la notification
  IF follower_count > 0 THEN
    -- Utiliser pg_net pour appeler l'edge function de manière asynchrone
    PERFORM
      net.http_post(
        url := supabase_url || '/functions/v1/send-drop-notification',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || supabase_anon_key
        ),
        body := jsonb_build_object('dropId', NEW.id)
      );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;