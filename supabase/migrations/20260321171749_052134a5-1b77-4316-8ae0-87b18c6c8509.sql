
CREATE TABLE public.voice_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  event_type TEXT NOT NULL DEFAULT 'match',
  audio_url TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.voice_recordings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read voice_recordings" ON public.voice_recordings FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert voice_recordings" ON public.voice_recordings FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can update voice_recordings" ON public.voice_recordings FOR UPDATE TO public USING (true);
CREATE POLICY "Anyone can delete voice_recordings" ON public.voice_recordings FOR DELETE TO public USING (true);

ALTER TABLE public.game_settings ADD COLUMN IF NOT EXISTS custom_voice_enabled BOOLEAN DEFAULT false;
