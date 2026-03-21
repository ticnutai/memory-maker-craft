CREATE TABLE public.custom_bg_themes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL,
  name text NOT NULL DEFAULT 'ערכה חדשה',
  emoji text DEFAULT '🎨',
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_bg_themes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read custom_bg_themes" ON public.custom_bg_themes FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert custom_bg_themes" ON public.custom_bg_themes FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can update custom_bg_themes" ON public.custom_bg_themes FOR UPDATE TO public USING (true);
CREATE POLICY "Anyone can delete custom_bg_themes" ON public.custom_bg_themes FOR DELETE TO public USING (true);