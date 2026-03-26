ALTER TABLE public.game_settings ADD COLUMN IF NOT EXISTS sfx_mode text NOT NULL DEFAULT 'builtin';
ALTER TABLE public.game_settings ADD COLUMN IF NOT EXISTS elevenlabs_voice_id text DEFAULT NULL;
ALTER TABLE public.game_settings ADD COLUMN IF NOT EXISTS elevenlabs_effects_enabled boolean NOT NULL DEFAULT false;