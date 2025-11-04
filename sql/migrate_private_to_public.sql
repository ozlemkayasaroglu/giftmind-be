-- Migrate personas from private to public schema
-- Run this SQL in Supabase Dashboard > SQL Editor

-- 1. First create the new public table with all fields
CREATE TABLE IF NOT EXISTS public.personas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  birth_date date,
  interests text[] DEFAULT '{}',
  notes text[] DEFAULT '{}',
  description text,
  notes_text text,
  role text,
  age_min integer,
  age_max integer,
  goals text,
  challenges text,
  interests_raw text,
  behavioral_insights text,
  budget_min integer,
  budget_max integer,
  avatar_url text,
  is_active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Copy data from private.personas to public.personas (if private table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'private' AND table_name = 'personas') THEN
        INSERT INTO public.personas (
            id, user_id, name, birth_date, interests, notes, description,
            role, age_min, age_max, goals, challenges, interests_raw,
            behavioral_insights, budget_min, budget_max, avatar_url,
            is_active, metadata, created_at, updated_at
        )
        SELECT 
            id, user_id, name, birth_date, 
            COALESCE(interests, '{}'), 
            COALESCE(notes, '{}'), 
            description,
            role, age_min, age_max, goals, challenges, interests_raw,
            behavioral_insights, budget_min, budget_max, avatar_url,
            COALESCE(is_active, true),
            COALESCE(metadata, '{}'::jsonb),
            COALESCE(created_at, now()),
            COALESCE(updated_at, now())
        FROM private.personas
        ON CONFLICT (id) DO NOTHING;
        
        RAISE NOTICE 'Data migrated from private.personas to public.personas';
    ELSE
        RAISE NOTICE 'private.personas table does not exist, skipping data migration';
    END IF;
END $$;

-- 3. Create indexes
CREATE INDEX IF NOT EXISTS idx_personas_user_id ON public.personas(user_id);
CREATE INDEX IF NOT EXISTS idx_personas_created_at ON public.personas(created_at);
CREATE INDEX IF NOT EXISTS idx_personas_is_active ON public.personas(is_active);

-- 4. Enable RLS and create policies
ALTER TABLE public.personas ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    -- Users can only see their own active personas
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'personas' AND policyname = 'personas_select_own') THEN
        CREATE POLICY personas_select_own ON public.personas
        FOR SELECT USING (auth.uid() = user_id AND is_active = true);
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

-- 5. Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_personas_updated_at ON public.personas;
CREATE TRIGGER update_personas_updated_at
    BEFORE UPDATE ON public.personas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. Verify migration
SELECT 
    'public.personas' as table_name,
    COUNT(*) as row_count,
    array_agg(DISTINCT user_id) as user_ids
FROM public.personas;

-- 7. Show table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'personas' 
ORDER BY ordinal_position;