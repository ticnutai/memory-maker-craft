-- Add volume level columns to game_settings
ALTER TABLE public.game_settings ADD COLUMN IF NOT EXISTS music_volume integer DEFAULT 50;
ALTER TABLE public.game_settings ADD COLUMN IF NOT EXISTS sound_volume integer DEFAULT 50;
ALTER TABLE public.game_settings ADD COLUMN IF NOT EXISTS speech_volume integer DEFAULT 50;
