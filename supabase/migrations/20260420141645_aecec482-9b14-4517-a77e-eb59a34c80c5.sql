
-- Create family collages table
CREATE TABLE public.family_collages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT 'קולאז׳ חדש',
  emoji TEXT DEFAULT '📸',
  layout_type TEXT NOT NULL DEFAULT 'grid',
  cols INTEGER NOT NULL DEFAULT 3,
  gap INTEGER NOT NULL DEFAULT 8,
  background TEXT DEFAULT '#ffffff',
  background_image TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create family photos table
CREATE TABLE public.family_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  collage_id UUID NOT NULL REFERENCES public.family_collages(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  image_url TEXT NOT NULL,
  caption TEXT,
  photo_date TEXT,
  frame_style TEXT DEFAULT 'none',
  filter_style TEXT DEFAULT 'none',
  sort_order INTEGER DEFAULT 0,
  pos_x NUMERIC,
  pos_y NUMERIC,
  width NUMERIC,
  height NUMERIC,
  rotation NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.family_collages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_photos ENABLE ROW LEVEL SECURITY;

-- RLS policies for family_collages
CREATE POLICY "Anyone can read family_collages" ON public.family_collages FOR SELECT USING (true);
CREATE POLICY "Anyone can insert family_collages" ON public.family_collages FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update family_collages" ON public.family_collages FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete family_collages" ON public.family_collages FOR DELETE USING (true);

-- RLS policies for family_photos
CREATE POLICY "Anyone can read family_photos" ON public.family_photos FOR SELECT USING (true);
CREATE POLICY "Anyone can insert family_photos" ON public.family_photos FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update family_photos" ON public.family_photos FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete family_photos" ON public.family_photos FOR DELETE USING (true);

-- Storage bucket for family photos
INSERT INTO storage.buckets (id, name, public) VALUES ('family-photos', 'family-photos', true);

CREATE POLICY "Anyone can view family photos" ON storage.objects FOR SELECT USING (bucket_id = 'family-photos');
CREATE POLICY "Anyone can upload family photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'family-photos');
CREATE POLICY "Anyone can update family photos" ON storage.objects FOR UPDATE USING (bucket_id = 'family-photos');
CREATE POLICY "Anyone can delete family photos" ON storage.objects FOR DELETE USING (bucket_id = 'family-photos');
