-- Create gift_recommendations table to store generated gift ideas
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS private.gift_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  persona_id uuid NOT NULL REFERENCES private.personas(id) ON DELETE CASCADE,
  
  -- Gift recommendation details
  title text NOT NULL,
  reason text,
  confidence integer DEFAULT 80,
  
  -- AI metadata
  ai_generated boolean DEFAULT true,
  model_used text,
  
  -- Status
  is_favorite boolean DEFAULT false,
  is_purchased boolean DEFAULT false,
  
  -- Timestamps
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Metadata
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_gift_recommendations_user_id ON private.gift_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_gift_recommendations_persona_id ON private.gift_recommendations(persona_id);
CREATE INDEX IF NOT EXISTS idx_gift_recommendations_created_at ON private.gift_recommendations(created_at DESC);

-- Enable Row Level Security
ALTER TABLE private.gift_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY gift_recommendations_select_own ON private.gift_recommendations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY gift_recommendations_insert_own ON private.gift_recommendations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY gift_recommendations_update_own ON private.gift_recommendations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY gift_recommendations_delete_own ON private.gift_recommendations
  FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_gift_recommendations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_gift_recommendations_updated_at
    BEFORE UPDATE ON private.gift_recommendations
    FOR EACH ROW
    EXECUTE FUNCTION update_gift_recommendations_updated_at();

-- Verify table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'private' 
  AND table_name = 'gift_recommendations' 
ORDER BY ordinal_position;
