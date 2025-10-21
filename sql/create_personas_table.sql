-- Create personas table in Supabase
-- Run this SQL in Supabase Dashboard > SQL Editor

CREATE TABLE personas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  birth_date date,
  interests text[] DEFAULT '{}',
  notes text[] DEFAULT '{}',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index on user_id for better query performance
CREATE INDEX idx_personas_user_id ON personas(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own personas
CREATE POLICY "Users can view own personas" ON personas
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own personas
CREATE POLICY "Users can insert own personas" ON personas
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own personas
CREATE POLICY "Users can update own personas" ON personas
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own personas
CREATE POLICY "Users can delete own personas" ON personas
  FOR DELETE USING (auth.uid() = user_id);
