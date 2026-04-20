
CREATE TABLE public.family_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL,
  name TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'custom',
  emoji TEXT DEFAULT '📅',
  color TEXT DEFAULT '#60a5fa',
  notes TEXT,
  recurring BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.family_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read family_events" ON public.family_events FOR SELECT USING (true);
CREATE POLICY "Anyone can insert family_events" ON public.family_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update family_events" ON public.family_events FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete family_events" ON public.family_events FOR DELETE USING (true);
