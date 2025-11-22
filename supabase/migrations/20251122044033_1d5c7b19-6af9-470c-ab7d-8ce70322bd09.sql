-- Add 'completed' to drop_status enum
ALTER TYPE drop_status ADD VALUE IF NOT EXISTS 'completed';

-- Create function to automatically archive expired drops
CREATE OR REPLACE FUNCTION archive_expired_drops()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE drops
  SET 
    status = 'completed',
    updated_at = now()
  WHERE 
    status IN ('scheduled', 'landed')
    AND (
      -- Si sale_start_time existe, archiver 6h après
      (sale_start_time IS NOT NULL AND sale_start_time + INTERVAL '6 hours' < now())
      OR
      -- Sinon, archiver 12h après l'ETA
      (sale_start_time IS NULL AND eta_at + INTERVAL '12 hours' < now())
    );
END;
$$;