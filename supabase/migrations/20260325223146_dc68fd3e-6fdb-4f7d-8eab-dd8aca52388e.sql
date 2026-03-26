
CREATE TABLE public.layout_presets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id text NOT NULL,
  name text NOT NULL DEFAULT 'פריסה חדשה',
  cols integer NOT NULL DEFAULT 3,
  gap integer NOT NULL DEFAULT 12,
  align text NOT NULL DEFAULT 'center',
  pattern text NOT NULL DEFAULT 'grid',
  is_custom boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.layout_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read layout_presets" ON public.layout_presets FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert layout_presets" ON public.layout_presets FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can update layout_presets" ON public.layout_presets FOR UPDATE TO public USING (true);
CREATE POLICY "Anyone can delete layout_presets" ON public.layout_presets FOR DELETE TO public USING (true);
