-- Add columns to launch_subscribers for inquiry management
ALTER TABLE launch_subscribers 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'launch_notification',
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'new',
ADD COLUMN IF NOT EXISTS admin_response TEXT,
ADD COLUMN IF NOT EXISTS responded_at TIMESTAMPTZ;

-- Update existing records to have proper type
UPDATE launch_subscribers SET type = 'launch_notification' WHERE type IS NULL;