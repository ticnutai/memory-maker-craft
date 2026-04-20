
-- Add folder hierarchy support to family_collages
ALTER TABLE public.family_collages 
  ADD COLUMN parent_id UUID REFERENCES public.family_collages(id) ON DELETE CASCADE DEFAULT NULL,
  ADD COLUMN is_folder BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN category TEXT DEFAULT NULL,
  ADD COLUMN year_tag INTEGER DEFAULT NULL,
  ADD COLUMN family_tag TEXT DEFAULT NULL,
  ADD COLUMN event_tag TEXT DEFAULT NULL;

-- Index for fast tree queries
CREATE INDEX idx_family_collages_parent ON public.family_collages(parent_id);
CREATE INDEX idx_family_collages_category ON public.family_collages(category);
CREATE INDEX idx_family_collages_year ON public.family_collages(year_tag);
