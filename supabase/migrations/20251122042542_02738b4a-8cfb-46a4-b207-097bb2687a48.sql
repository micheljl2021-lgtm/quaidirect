-- Create fishermen_followers table for following fishermen
CREATE TABLE fishermen_followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fisherman_id UUID NOT NULL REFERENCES fishermen(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, fisherman_id)
);

-- Index for performance
CREATE INDEX idx_fishermen_followers_user_id ON fishermen_followers(user_id);
CREATE INDEX idx_fishermen_followers_fisherman_id ON fishermen_followers(fisherman_id);

-- Enable RLS
ALTER TABLE fishermen_followers ENABLE ROW LEVEL SECURITY;

-- Users can follow fishermen
CREATE POLICY "Users can follow fishermen"
ON fishermen_followers
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can unfollow fishermen
CREATE POLICY "Users can unfollow fishermen"
ON fishermen_followers
FOR DELETE
USING (auth.uid() = user_id);

-- Users can view their own follows
CREATE POLICY "Users can view their own follows"
ON fishermen_followers
FOR SELECT
USING (auth.uid() = user_id);

-- Fishermen can view their followers
CREATE POLICY "Fishermen can view their followers"
ON fishermen_followers
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM fishermen
    WHERE fishermen.id = fishermen_followers.fisherman_id
    AND fishermen.user_id = auth.uid()
  )
);