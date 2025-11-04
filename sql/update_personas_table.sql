-- Update personas table to support ALL PersonaForm fields
-- Run this SQL in Supabase Dashboard > SQL Editor

-- Add ALL missing columns to public.personas table
ALTER TABLE public.personas 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS name text NOT NULL,
ADD COLUMN IF NOT EXISTS birth_date date,
ADD COLUMN IF NOT EXISTS interests text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS notes text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS notes_text text,
ADD COLUMN IF NOT EXISTS role text,
ADD COLUMN IF NOT EXISTS age_min integer,
ADD COLUMN IF NOT EXISTS age_max integer,
ADD COLUMN IF NOT EXISTS goals text,
ADD COLUMN IF NOT EXISTS challenges text,
ADD COLUMN IF NOT EXISTS interests_raw text,
ADD COLUMN IF NOT EXISTS behavioral_insights text,
ADD COLUMN IF NOT EXISTS budget_min integer,
ADD COLUMN IF NOT EXISTS budget_max integer,
ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_personas_user_id ON public.personas(user_id);
CREATE INDEX IF NOT EXISTS idx_personas_created_at ON public.personas(created_at);

-- Enable Row Level Security (RLS) if not already enabled
ALTER TABLE public.personas ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public.personas (if not exist)
DO $$ 
BEGIN
    -- Users can only see their own personas
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'personas' AND policyname = 'personas_select_own') THEN
        CREATE POLICY personas_select_own ON public.personas
        FOR SELECT USING (auth.uid() = user_id);
    END IF;

    -- Users can insert their own personas  
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'personas' AND policyname = 'personas_insert_own') THEN
        CREATE POLICY personas_insert_own ON public.personas
        FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    -- Users can update their own personas
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'personas' AND policyname = 'personas_update_own') THEN
        CREATE POLICY personas_update_own ON public.personas
        FOR UPDATE USING (auth.uid() = user_id);
    END IF;

    -- Users can delete their own personas
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'personas' AND policyname = 'personas_delete_own') THEN
        CREATE POLICY personas_delete_own ON public.personas
        FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_personas_updated_at ON public.personas;
CREATE TRIGGER update_personas_updated_at
    BEFORE UPDATE ON public.personas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verify the table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'personas' 
ORDER BY ordinal_position;