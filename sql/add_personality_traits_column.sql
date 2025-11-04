-- Add personality_traits column to match your existing table structure
-- Run this in Supabase SQL Editor

ALTER TABLE private.personas 
ADD COLUMN IF NOT EXISTS personality_traits text[] DEFAULT '{}';

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'private' 
  AND table_name = 'personas' 
  AND column_name = 'personality_traits';