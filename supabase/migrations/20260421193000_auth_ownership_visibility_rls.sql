-- Phase 1 + 2 security hardening for family content
-- Ownership: user-based (auth.users.id)
-- Visibility: public/private
-- Admin override: platform admins (public.has_role(auth.uid(), 'admin'))
-- Soft delete + restore support + admin audit logs

-- 1) Schema upgrades
ALTER TABLE public.families
  ADD COLUMN IF NOT EXISTS admin_user_id uuid REFERENCES auth.users(id);

ALTER TABLE public.family_members
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

ALTER TABLE public.family_collages
  ADD COLUMN IF NOT EXISTS owner_user_id uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS locked_by_admin boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS lock_reason text,
  ADD COLUMN IF NOT EXISTS locked_at timestamptz,
  ADD COLUMN IF NOT EXISTS locked_by_user_id uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES auth.users(id);

ALTER TABLE public.family_photos
  ADD COLUMN IF NOT EXISTS owner_user_id uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS locked_by_admin boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS lock_reason text,
  ADD COLUMN IF NOT EXISTS locked_at timestamptz,
  ADD COLUMN IF NOT EXISTS locked_by_user_id uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES auth.users(id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'family_collages_visibility_check'
  ) THEN
    ALTER TABLE public.family_collages
      ADD CONSTRAINT family_collages_visibility_check CHECK (visibility IN ('public', 'private'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'family_photos_visibility_check'
  ) THEN
    ALTER TABLE public.family_photos
      ADD CONSTRAINT family_photos_visibility_check CHECK (visibility IN ('public', 'private'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_family_collages_owner ON public.family_collages(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_family_collages_visibility ON public.family_collages(visibility);
CREATE INDEX IF NOT EXISTS idx_family_collages_deleted_at ON public.family_collages(deleted_at);
CREATE INDEX IF NOT EXISTS idx_family_photos_owner ON public.family_photos(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_family_photos_visibility ON public.family_photos(visibility);
CREATE INDEX IF NOT EXISTS idx_family_photos_deleted_at ON public.family_photos(deleted_at);
CREATE INDEX IF NOT EXISTS idx_family_members_user_id ON public.family_members(user_id);
CREATE INDEX IF NOT EXISTS idx_families_admin_user_id ON public.families(admin_user_id);

-- Best-effort backfill based on existing device memberships (legacy migration bridge)
UPDATE public.families f
SET admin_user_id = fm.user_id
FROM public.family_members fm
WHERE f.admin_user_id IS NULL
  AND fm.device_id = f.admin_device_id
  AND fm.user_id IS NOT NULL
  AND fm.family_id = f.id;

UPDATE public.family_collages c
SET owner_user_id = map.user_id
FROM (
  SELECT fm.device_id, max(fm.joined_at) AS joined_at, max(fm.user_id) FILTER (WHERE fm.user_id IS NOT NULL) AS user_id
  FROM public.family_members fm
  GROUP BY fm.device_id
) AS map
WHERE c.owner_user_id IS NULL
  AND map.device_id = c.device_id
  AND map.user_id IS NOT NULL;

UPDATE public.family_photos p
SET owner_user_id = map.user_id
FROM (
  SELECT fm.device_id, max(fm.joined_at) AS joined_at, max(fm.user_id) FILTER (WHERE fm.user_id IS NOT NULL) AS user_id
  FROM public.family_members fm
  GROUP BY fm.device_id
) AS map
WHERE p.owner_user_id IS NULL
  AND map.device_id = p.device_id
  AND map.user_id IS NOT NULL;

-- 2) Default ownership helpers
CREATE OR REPLACE FUNCTION public.tg_assign_family_content_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.owner_user_id IS NULL AND auth.uid() IS NOT NULL THEN
    NEW.owner_user_id := auth.uid();
  END IF;

  IF NEW.visibility IS NULL THEN
    NEW.visibility := 'public';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_assign_family_collage_owner ON public.family_collages;
CREATE TRIGGER tg_assign_family_collage_owner
  BEFORE INSERT ON public.family_collages
  FOR EACH ROW EXECUTE FUNCTION public.tg_assign_family_content_owner();

DROP TRIGGER IF EXISTS tg_assign_family_photo_owner ON public.family_photos;
CREATE TRIGGER tg_assign_family_photo_owner
  BEFORE INSERT ON public.family_photos
  FOR EACH ROW EXECUTE FUNCTION public.tg_assign_family_content_owner();

-- 3) Admin audit log
CREATE TABLE IF NOT EXISTS public.admin_action_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid REFERENCES auth.users(id),
  table_name text NOT NULL,
  action text NOT NULL,
  record_id text,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_action_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read admin_action_audit" ON public.admin_action_audit;
CREATE POLICY "Admins can read admin_action_audit"
  ON public.admin_action_audit
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "No direct writes to admin_action_audit" ON public.admin_action_audit;
CREATE POLICY "No direct writes to admin_action_audit"
  ON public.admin_action_audit
  FOR ALL
  USING (false)
  WITH CHECK (false);

CREATE OR REPLACE FUNCTION public.tg_log_admin_mutation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor uuid;
  action_name text;
  record_key text;
BEGIN
  actor := auth.uid();
  IF actor IS NULL OR NOT public.has_role(actor, 'admin') THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  action_name := TG_OP;
  record_key := COALESCE((to_jsonb(NEW)->>'id'), (to_jsonb(OLD)->>'id'));

  INSERT INTO public.admin_action_audit(actor_user_id, table_name, action, record_id, before_data, after_data)
  VALUES (
    actor,
    TG_TABLE_NAME,
    action_name,
    record_key,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_family_collages ON public.family_collages;
CREATE TRIGGER trg_audit_family_collages
  AFTER INSERT OR UPDATE OR DELETE ON public.family_collages
  FOR EACH ROW EXECUTE FUNCTION public.tg_log_admin_mutation();

DROP TRIGGER IF EXISTS trg_audit_family_photos ON public.family_photos;
CREATE TRIGGER trg_audit_family_photos
  AFTER INSERT OR UPDATE OR DELETE ON public.family_photos
  FOR EACH ROW EXECUTE FUNCTION public.tg_log_admin_mutation();

DROP TRIGGER IF EXISTS trg_audit_families ON public.families;
CREATE TRIGGER trg_audit_families
  AFTER INSERT OR UPDATE OR DELETE ON public.families
  FOR EACH ROW EXECUTE FUNCTION public.tg_log_admin_mutation();

DROP TRIGGER IF EXISTS trg_audit_family_members ON public.family_members;
CREATE TRIGGER trg_audit_family_members
  AFTER INSERT OR UPDATE OR DELETE ON public.family_members
  FOR EACH ROW EXECUTE FUNCTION public.tg_log_admin_mutation();

-- 4) RLS hardening
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_collages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read families" ON public.families;
DROP POLICY IF EXISTS "Anyone can insert families" ON public.families;
DROP POLICY IF EXISTS "Anyone can update families" ON public.families;
DROP POLICY IF EXISTS "Anyone can delete families" ON public.families;

DROP POLICY IF EXISTS "Anyone can read family_members" ON public.family_members;
DROP POLICY IF EXISTS "Anyone can insert family_members" ON public.family_members;
DROP POLICY IF EXISTS "Anyone can update family_members" ON public.family_members;
DROP POLICY IF EXISTS "Anyone can delete family_members" ON public.family_members;

DROP POLICY IF EXISTS "Anyone can read family_collages" ON public.family_collages;
DROP POLICY IF EXISTS "Anyone can insert family_collages" ON public.family_collages;
DROP POLICY IF EXISTS "Anyone can update family_collages" ON public.family_collages;
DROP POLICY IF EXISTS "Anyone can delete family_collages" ON public.family_collages;

DROP POLICY IF EXISTS "Anyone can read family_photos" ON public.family_photos;
DROP POLICY IF EXISTS "Anyone can insert family_photos" ON public.family_photos;
DROP POLICY IF EXISTS "Anyone can update family_photos" ON public.family_photos;
DROP POLICY IF EXISTS "Anyone can delete family_photos" ON public.family_photos;

-- Families
CREATE POLICY "Families are readable"
  ON public.families
  FOR SELECT
  USING (
    true
  );

CREATE POLICY "Authenticated can create families"
  ON public.families
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (admin_user_id = auth.uid() OR admin_user_id IS NULL)
  );

CREATE POLICY "Family admins can update families"
  ON public.families
  FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'admin') OR admin_user_id = auth.uid()
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR admin_user_id = auth.uid()
  );

CREATE POLICY "Family admins can delete families"
  ON public.families
  FOR DELETE
  USING (
    public.has_role(auth.uid(), 'admin') OR admin_user_id = auth.uid()
  );

-- Family members
CREATE POLICY "Family members are readable"
  ON public.family_members
  FOR SELECT
  USING (true);

CREATE POLICY "Users can join as themselves"
  ON public.family_members
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      user_id = auth.uid()
      OR public.has_role(auth.uid(), 'admin')
    )
  );

CREATE POLICY "Users/admins can update members"
  ON public.family_members
  FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'admin')
    OR user_id = auth.uid()
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR user_id = auth.uid()
  );

CREATE POLICY "Users/admins can delete members"
  ON public.family_members
  FOR DELETE
  USING (
    public.has_role(auth.uid(), 'admin')
    OR user_id = auth.uid()
  );

-- Family collages
CREATE POLICY "Collages can be viewed by visibility"
  ON public.family_collages
  FOR SELECT
  USING (
    deleted_at IS NULL
    AND (
      visibility = 'public'
      OR owner_user_id = auth.uid()
      OR public.has_role(auth.uid(), 'admin')
    )
  );

CREATE POLICY "Authenticated can create collages"
  ON public.family_collages
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      owner_user_id = auth.uid()
      OR (public.has_role(auth.uid(), 'admin') AND owner_user_id IS NOT NULL)
    )
  );

CREATE POLICY "Owners/admins can update collages"
  ON public.family_collages
  FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'admin')
    OR (owner_user_id = auth.uid() AND coalesce(locked_by_admin, false) = false)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR owner_user_id = auth.uid()
  );

CREATE POLICY "Only admins can hard delete collages"
  ON public.family_collages
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Family photos
CREATE POLICY "Photos can be viewed by visibility"
  ON public.family_photos
  FOR SELECT
  USING (
    deleted_at IS NULL
    AND (
      visibility = 'public'
      OR owner_user_id = auth.uid()
      OR public.has_role(auth.uid(), 'admin')
    )
  );

CREATE POLICY "Authenticated can create photos"
  ON public.family_photos
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      owner_user_id = auth.uid()
      OR (public.has_role(auth.uid(), 'admin') AND owner_user_id IS NOT NULL)
    )
  );

CREATE POLICY "Owners/admins can update photos"
  ON public.family_photos
  FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'admin')
    OR (owner_user_id = auth.uid() AND coalesce(locked_by_admin, false) = false)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR owner_user_id = auth.uid()
  );

CREATE POLICY "Only admins can hard delete photos"
  ON public.family_photos
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- 5) Storage hardening for family-photos
DROP POLICY IF EXISTS "Anyone can view family photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload family photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update family photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete family photos" ON storage.objects;

CREATE POLICY "Family photos can be viewed by visibility"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'family-photos'
    AND EXISTS (
      SELECT 1
      FROM public.family_photos p
      JOIN public.family_collages c ON c.id = p.collage_id
      WHERE c.deleted_at IS NULL
        AND p.deleted_at IS NULL
        AND (
          p.image_url LIKE '%' || storage.objects.name
          OR coalesce(p.thumbnail_url, '') LIKE '%' || storage.objects.name
        )
        AND (
          p.visibility = 'public'
          OR p.owner_user_id = auth.uid()
          OR c.owner_user_id = auth.uid()
          OR public.has_role(auth.uid(), 'admin')
        )
    )
  );

CREATE POLICY "Owners/admins can upload family photos"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'family-photos'
    AND auth.uid() IS NOT NULL
    AND (
      split_part(name, '/', 1) = auth.uid()::text
      OR public.has_role(auth.uid(), 'admin')
    )
  );

CREATE POLICY "Owners/admins can update family photos objects"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'family-photos'
    AND auth.uid() IS NOT NULL
    AND (
      split_part(name, '/', 1) = auth.uid()::text
      OR public.has_role(auth.uid(), 'admin')
    )
  );

CREATE POLICY "Owners/admins can delete family photos objects"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'family-photos'
    AND auth.uid() IS NOT NULL
    AND (
      split_part(name, '/', 1) = auth.uid()::text
      OR public.has_role(auth.uid(), 'admin')
    )
  );
