
-- 1) הרחבת family_collages לשדות היררכיה/מטא/ארכיון
ALTER TABLE public.family_collages
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS location_tag text,
  ADD COLUMN IF NOT EXISTS cover_url text,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz,
  ADD COLUMN IF NOT EXISTS archived_by text,
  ADD COLUMN IF NOT EXISTS purge_after timestamptz;

-- 2) אינדקסים לביצועים
CREATE INDEX IF NOT EXISTS idx_family_collages_parent ON public.family_collages(parent_id);
CREATE INDEX IF NOT EXISTS idx_family_collages_category ON public.family_collages(category);
CREATE INDEX IF NOT EXISTS idx_family_collages_year ON public.family_collages(year_tag);
CREATE INDEX IF NOT EXISTS idx_family_collages_location ON public.family_collages(location_tag);
CREATE INDEX IF NOT EXISTS idx_family_collages_archived_at ON public.family_collages(archived_at);
CREATE INDEX IF NOT EXISTS idx_family_collages_purge_after ON public.family_collages(purge_after);
CREATE INDEX IF NOT EXISTS idx_family_collages_tags ON public.family_collages USING GIN(tags);

-- 3) טבלת העדפות משתמש
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  slideshow_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- 4) מדיניות גישה ל-user_preferences
DROP POLICY IF EXISTS "Users can read own preferences" ON public.user_preferences;
CREATE POLICY "Users can read own preferences"
  ON public.user_preferences FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can upsert own preferences" ON public.user_preferences;
CREATE POLICY "Users can upsert own preferences"
  ON public.user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences;
CREATE POLICY "Users can update own preferences"
  ON public.user_preferences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own preferences" ON public.user_preferences;
CREATE POLICY "Users can delete own preferences"
  ON public.user_preferences FOR DELETE
  USING (auth.uid() = user_id);

-- 5) טריגר עדכון updated_at
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.proname = 'tg_set_updated_at' AND n.nspname = 'public'
  ) THEN
    DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON public.user_preferences;
    CREATE TRIGGER update_user_preferences_updated_at
      BEFORE UPDATE ON public.user_preferences
      FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
  END IF;
END $$;

-- 6) הוספה ל-realtime
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_preferences;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN undefined_object THEN NULL;
  END;
END $$;

-- 7) פונקציית ניקוי ארכיון
CREATE OR REPLACE FUNCTION public.purge_expired_family_collages()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.family_collages
  WHERE purge_after IS NOT NULL AND purge_after <= now();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;
