
-- Add share_code column
ALTER TABLE public.family_collages
ADD COLUMN share_code TEXT UNIQUE;

-- Generate share codes for existing collages
UPDATE public.family_collages
SET share_code = substr(md5(random()::text), 1, 8)
WHERE share_code IS NULL;

-- Make share_code NOT NULL with a default
ALTER TABLE public.family_collages
ALTER COLUMN share_code SET DEFAULT substr(md5(random()::text), 1, 8),
ALTER COLUMN share_code SET NOT NULL;

-- Enable realtime for family_photos so collaborators see updates live
ALTER PUBLICATION supabase_realtime ADD TABLE public.family_photos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.family_collages;
