-- Add layout settings columns to game_settings
ALTER TABLE public.game_settings
  ADD COLUMN IF NOT EXISTS layout_mode TEXT DEFAULT 'grid',
  ADD COLUMN IF NOT EXISTS snap_to_grid BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS grid_size INTEGER DEFAULT 20,
  ADD COLUMN IF NOT EXISTS card_positions JSONB DEFAULT '[]';

-- Create layout presets table for "duplicate and save"
CREATE TABLE IF NOT EXISTS public.layout_presets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL,
  name TEXT NOT NULL,
  positions JSONB NOT NULL DEFAULT '[]',
  pair_count INTEGER NOT NULL DEFAULT 4,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.layout_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read presets" ON public.layout_presets FOR SELECT USING (true);
CREATE POLICY "Anyone can insert presets" ON public.layout_presets FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update presets" ON public.layout_presets FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete presets" ON public.layout_presets FOR DELETE USING (true);
