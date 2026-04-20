-- Add media_type column to support videos alongside photos
ALTER TABLE public.family_photos
  ADD COLUMN IF NOT EXISTS media_type text NOT NULL DEFAULT 'image',
  ADD COLUMN IF NOT EXISTS duration_ms integer;

-- Helpful index for filtering by collage + type
CREATE INDEX IF NOT EXISTS idx_family_photos_collage_type
  ON public.family_photos(collage_id, media_type);