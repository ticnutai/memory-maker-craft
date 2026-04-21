ALTER TABLE public.family_collages
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS location_tag text,
  ADD COLUMN IF NOT EXISTS cover_url text,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz,
  ADD COLUMN IF NOT EXISTS archived_by text,
  ADD COLUMN IF NOT EXISTS purge_after timestamptz;

CREATE INDEX IF NOT EXISTS idx_family_collages_archived_at ON public.family_collages(archived_at);
CREATE INDEX IF NOT EXISTS idx_family_collages_purge_after ON public.family_collages(purge_after);
CREATE INDEX IF NOT EXISTS idx_family_collages_location ON public.family_collages(location_tag);
CREATE INDEX IF NOT EXISTS idx_family_collages_tags ON public.family_collages USING GIN(tags);

-- Helper for periodic cleanup of expired archived folders/albums.
CREATE OR REPLACE FUNCTION public.purge_expired_family_collages()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.family_collages
  WHERE purge_after IS NOT NULL
    AND purge_after <= now();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;
