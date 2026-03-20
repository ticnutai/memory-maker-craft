
-- Create table for persisting game settings per device
CREATE TABLE public.game_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL UNIQUE,
  pair_count INTEGER NOT NULL DEFAULT 4,
  card_max_w INTEGER NOT NULL DEFAULT 480,
  emoji_scale NUMERIC NOT NULL DEFAULT 1,
  sound_enabled BOOLEAN NOT NULL DEFAULT true,
  flip_duration NUMERIC NOT NULL DEFAULT 1,
  music_type TEXT NOT NULL DEFAULT 'none',
  builtin_melody_id TEXT DEFAULT 'twinkle',
  custom_music TEXT,
  custom_music_name TEXT,
  theme TEXT DEFAULT 'girl',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.game_settings ENABLE ROW LEVEL SECURITY;

-- Public access since this is a kids game without auth
CREATE POLICY "Anyone can read settings" ON public.game_settings FOR SELECT USING (true);
CREATE POLICY "Anyone can insert settings" ON public.game_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update settings" ON public.game_settings FOR UPDATE USING (true);
