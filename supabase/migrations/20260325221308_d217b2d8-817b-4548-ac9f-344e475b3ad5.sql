
-- Create custom_animations table
CREATE TABLE public.custom_animations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  event_type TEXT NOT NULL DEFAULT 'match',
  animation_type TEXT NOT NULL DEFAULT 'gif',
  animation_url TEXT NOT NULL,
  thumbnail_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  duration_ms INTEGER DEFAULT 2000,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.custom_animations ENABLE ROW LEVEL SECURITY;

-- Open RLS policies (matching project pattern)
CREATE POLICY "Anyone can read custom_animations" ON public.custom_animations FOR SELECT USING (true);
CREATE POLICY "Anyone can insert custom_animations" ON public.custom_animations FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update custom_animations" ON public.custom_animations FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete custom_animations" ON public.custom_animations FOR DELETE USING (true);

-- Create storage bucket for animations
INSERT INTO storage.buckets (id, name, public) VALUES ('game-animations', 'game-animations', true);

-- Storage policies
CREATE POLICY "Anyone can upload animations" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'game-animations');
CREATE POLICY "Anyone can read animations" ON storage.objects FOR SELECT USING (bucket_id = 'game-animations');
CREATE POLICY "Anyone can delete animations" ON storage.objects FOR DELETE USING (bucket_id = 'game-animations');
