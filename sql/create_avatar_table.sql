-- Create persona_avatars table in public schema
-- Run this SQL in Supabase Dashboard > SQL Editor

-- Create persona_avatars table
CREATE TABLE IF NOT EXISTS public.persona_avatars (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  persona_id uuid NOT NULL REFERENCES public.personas(id) ON DELETE CASCADE,
  bucket text NOT NULL DEFAULT 'avatars',
  object_path text NOT NULL,
  content_type text,
  bytes integer,
  is_current boolean DEFAULT true,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_persona_avatars_persona_id ON public.persona_avatars(persona_id);
CREATE INDEX IF NOT EXISTS idx_persona_avatars_is_current ON public.persona_avatars(is_current);

-- Enable RLS
ALTER TABLE public.persona_avatars ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DO $$ 
BEGIN
    -- Users can only see avatars of their own personas
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'persona_avatars' AND policyname = 'avatar_select_own') THEN
        CREATE POLICY avatar_select_own ON public.persona_avatars
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM public.personas p 
            WHERE p.id = persona_id AND p.user_id = auth.uid()
          )
        );
    END IF;

    -- Users can insert avatars for their own personas
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'persona_avatars' AND policyname = 'avatar_insert_own') THEN
        CREATE POLICY avatar_insert_own ON public.persona_avatars
        FOR INSERT WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.personas p 
            WHERE p.id = persona_id AND p.user_id = auth.uid()
          )
        );
    END IF;

    -- Users can update avatars of their own personas
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'persona_avatars' AND policyname = 'avatar_update_own') THEN
        CREATE POLICY avatar_update_own ON public.persona_avatars
        FOR UPDATE USING (
          EXISTS (
            SELECT 1 FROM public.personas p 
            WHERE p.id = persona_id AND p.user_id = auth.uid()
          )
        );
    END IF;

    -- Users can delete avatars of their own personas
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'persona_avatars' AND policyname = 'avatar_delete_own') THEN
        CREATE POLICY avatar_delete_own ON public.persona_avatars
        FOR DELETE USING (
          EXISTS (
            SELECT 1 FROM public.personas p 
            WHERE p.id = persona_id AND p.user_id = auth.uid()
          )
        );
    END IF;
END $$;

-- Trigger to unset other avatars when setting is_current = true
CREATE OR REPLACE FUNCTION unset_other_current_avatars()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_current = true THEN
    UPDATE public.persona_avatars 
    SET is_current = false 
    WHERE persona_id = NEW.persona_id 
      AND id != NEW.id 
      AND is_current = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_unset_other_current_avatars ON public.persona_avatars;
CREATE TRIGGER trigger_unset_other_current_avatars
  BEFORE INSERT OR UPDATE ON public.persona_avatars
  FOR EACH ROW
  EXECUTE FUNCTION unset_other_current_avatars();

-- Create avatars storage bucket (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars bucket
DO $$
BEGIN
    -- Allow authenticated users to upload avatars
    IF NOT EXISTS (SELECT 1 FROM storage.policies WHERE bucket_id = 'avatars' AND name = 'avatar_upload_policy') THEN
        CREATE POLICY avatar_upload_policy ON storage.objects
        FOR INSERT WITH CHECK (
          bucket_id = 'avatars' AND 
          auth.role() = 'authenticated'
        );
    END IF;

    -- Allow users to view avatars
    IF NOT EXISTS (SELECT 1 FROM storage.policies WHERE bucket_id = 'avatars' AND name = 'avatar_select_policy') THEN
        CREATE POLICY avatar_select_policy ON storage.objects
        FOR SELECT USING (
          bucket_id = 'avatars'
        );
    END IF;

    -- Allow users to update their own avatars
    IF NOT EXISTS (SELECT 1 FROM storage.policies WHERE bucket_id = 'avatars' AND name = 'avatar_update_policy') THEN
        CREATE POLICY avatar_update_policy ON storage.objects
        FOR UPDATE USING (
          bucket_id = 'avatars' AND 
          auth.role() = 'authenticated'
        );
    END IF;

    -- Allow users to delete their own avatars
    IF NOT EXISTS (SELECT 1 FROM storage.policies WHERE bucket_id = 'avatars' AND name = 'avatar_delete_policy') THEN
        CREATE POLICY avatar_delete_policy ON storage.objects
        FOR DELETE USING (
          bucket_id = 'avatars' AND 
          auth.role() = 'authenticated'
        );
    END IF;
END $$;