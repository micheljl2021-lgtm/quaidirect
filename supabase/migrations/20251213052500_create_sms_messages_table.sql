-- Create sms_messages table for detailed SMS tracking and analytics
CREATE TABLE IF NOT EXISTS sms_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fisherman_id UUID NOT NULL REFERENCES fishermen(id) ON DELETE CASCADE,
  contact_phone TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('invitation', 'notification', 'promotion')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('sent', 'failed', 'pending', 'delivered')),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  error_message TEXT,
  twilio_sid TEXT,
  retries INTEGER DEFAULT 0,
  cost_cents INTEGER DEFAULT 5,
  drop_id UUID REFERENCES drops(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sms_messages_fisherman ON sms_messages(fisherman_id);
CREATE INDEX IF NOT EXISTS idx_sms_messages_sent_at ON sms_messages(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_messages_status ON sms_messages(status);
CREATE INDEX IF NOT EXISTS idx_sms_messages_type ON sms_messages(type);
CREATE INDEX IF NOT EXISTS idx_sms_messages_contact_phone ON sms_messages(contact_phone);

-- RLS Policies
ALTER TABLE sms_messages ENABLE ROW LEVEL SECURITY;

-- Fishermen can view their own SMS messages
CREATE POLICY "Fishermen can view their own sms messages"
  ON sms_messages FOR SELECT
  USING (
    fisherman_id IN (
      SELECT id FROM fishermen WHERE user_id = auth.uid()
    )
  );

-- Admins can view all SMS messages
CREATE POLICY "Admins can view all sms messages"
  ON sms_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Service role can manage SMS messages
CREATE POLICY "Service role can manage sms messages"
  ON sms_messages FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add comment for documentation
COMMENT ON TABLE sms_messages IS 'Detailed SMS message history for analytics and tracking';
COMMENT ON COLUMN sms_messages.type IS 'Type of SMS: invitation, notification, promotion';
COMMENT ON COLUMN sms_messages.status IS 'SMS status: pending, sent, failed, delivered';
COMMENT ON COLUMN sms_messages.cost_cents IS 'Cost in cents (default 5 cents = 0.05€)';
