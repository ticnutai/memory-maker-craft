CREATE TABLE public.custom_card_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL,
  name text NOT NULL,
  emoji text DEFAULT '📷',
  color text DEFAULT '#60a5fa',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.custom_card_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  set_id uuid REFERENCES public.custom_card_sets(id) ON DELETE CASCADE NOT NULL,
  label text,
  emoji text DEFAULT '📷',
  image_url text,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_card_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_card_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read custom_card_sets" ON public.custom_card_sets FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert custom_card_sets" ON public.custom_card_sets FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can update custom_card_sets" ON public.custom_card_sets FOR UPDATE TO public USING (true);
CREATE POLICY "Anyone can delete custom_card_sets" ON public.custom_card_sets FOR DELETE TO public USING (true);

CREATE POLICY "Anyone can read custom_card_items" ON public.custom_card_items FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert custom_card_items" ON public.custom_card_items FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can update custom_card_items" ON public.custom_card_items FOR UPDATE TO public USING (true);
CREATE POLICY "Anyone can delete custom_card_items" ON public.custom_card_items FOR DELETE TO public USING (true);