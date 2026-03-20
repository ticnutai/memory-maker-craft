CREATE TABLE public.birthdays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL,
  name text NOT NULL,
  birth_date date NOT NULL,
  relation text DEFAULT 'משפחה',
  emoji text DEFAULT '🎂',
  notes text,
  color text DEFAULT '#f472b6',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.birthdays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read birthdays" ON public.birthdays
  FOR SELECT TO public USING (true);

CREATE POLICY "Anyone can insert birthdays" ON public.birthdays
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Anyone can update birthdays" ON public.birthdays
  FOR UPDATE TO public USING (true);

CREATE POLICY "Anyone can delete birthdays" ON public.birthdays
  FOR DELETE TO public USING (true);