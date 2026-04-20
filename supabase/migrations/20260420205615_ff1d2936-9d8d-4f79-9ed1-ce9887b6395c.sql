
-- Families table: groups devices under one shared code
CREATE TABLE public.families (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE DEFAULT substr(md5(random()::text), 1, 8),
  name TEXT NOT NULL DEFAULT 'המשפחה שלי',
  admin_device_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read families" ON public.families FOR SELECT USING (true);
CREATE POLICY "Anyone can insert families" ON public.families FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update families" ON public.families FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete families" ON public.families FOR DELETE USING (true);

-- Family members: links device_ids to a family
CREATE TABLE public.family_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  nickname TEXT,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(family_id, device_id)
);

ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read family_members" ON public.family_members FOR SELECT USING (true);
CREATE POLICY "Anyone can insert family_members" ON public.family_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update family_members" ON public.family_members FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete family_members" ON public.family_members FOR DELETE USING (true);

-- Index for fast lookup by device
CREATE INDEX idx_family_members_device ON public.family_members(device_id);
CREATE INDEX idx_family_members_family ON public.family_members(family_id);
