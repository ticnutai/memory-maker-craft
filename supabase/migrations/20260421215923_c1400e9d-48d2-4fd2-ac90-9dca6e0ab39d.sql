ALTER TABLE public.families 
ADD COLUMN home_collage_id uuid REFERENCES public.family_collages(id) ON DELETE SET NULL DEFAULT NULL;