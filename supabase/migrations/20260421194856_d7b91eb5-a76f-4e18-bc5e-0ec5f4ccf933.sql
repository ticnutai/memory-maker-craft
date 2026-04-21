ALTER TABLE public.families
  ADD COLUMN IF NOT EXISTS admin_user_id uuid;

ALTER TABLE public.family_members
  ADD COLUMN IF NOT EXISTS user_id uuid;

ALTER TABLE public.family_collages
  ADD COLUMN IF NOT EXISTS owner_user_id uuid,
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS locked_by_admin boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS lock_reason text,
  ADD COLUMN IF NOT EXISTS locked_at timestamptz,
  ADD COLUMN IF NOT EXISTS locked_by_user_id uuid,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid;

ALTER TABLE public.family_photos
  ADD COLUMN IF NOT EXISTS owner_user_id uuid,
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS locked_by_admin boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS lock_reason text,
  ADD COLUMN IF NOT EXISTS locked_at timestamptz,
  ADD COLUMN IF NOT EXISTS locked_by_user_id uuid,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid;

CREATE INDEX IF NOT EXISTS idx_families_admin_user_id ON public.families(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_family_members_user_id ON public.family_members(user_id);
CREATE INDEX IF NOT EXISTS idx_family_collages_owner_user_id ON public.family_collages(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_family_collages_visibility ON public.family_collages(visibility);
CREATE INDEX IF NOT EXISTS idx_family_collages_deleted_at ON public.family_collages(deleted_at);
CREATE INDEX IF NOT EXISTS idx_family_photos_owner_user_id ON public.family_photos(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_family_photos_visibility ON public.family_photos(visibility);
CREATE INDEX IF NOT EXISTS idx_family_photos_deleted_at ON public.family_photos(deleted_at);

CREATE OR REPLACE FUNCTION public.is_family_admin(_family_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.families f
    WHERE f.id = _family_id
      AND (
        f.admin_user_id = _user_id
        OR public.has_role(_user_id, 'admin')
      )
  )
$$;

CREATE OR REPLACE FUNCTION public.is_family_member(_family_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.family_members fm
    WHERE fm.family_id = _family_id
      AND fm.user_id = _user_id
  )
$$;

ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_collages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can delete families" ON public.families;
DROP POLICY IF EXISTS "Anyone can insert families" ON public.families;
DROP POLICY IF EXISTS "Anyone can read families" ON public.families;
DROP POLICY IF EXISTS "Anyone can update families" ON public.families;

DROP POLICY IF EXISTS "Anyone can delete family_members" ON public.family_members;
DROP POLICY IF EXISTS "Anyone can insert family_members" ON public.family_members;
DROP POLICY IF EXISTS "Anyone can read family_members" ON public.family_members;
DROP POLICY IF EXISTS "Anyone can update family_members" ON public.family_members;

DROP POLICY IF EXISTS "Anyone can delete family_collages" ON public.family_collages;
DROP POLICY IF EXISTS "Anyone can insert family_collages" ON public.family_collages;
DROP POLICY IF EXISTS "Anyone can read family_collages" ON public.family_collages;
DROP POLICY IF EXISTS "Anyone can update family_collages" ON public.family_collages;

DROP POLICY IF EXISTS "Anyone can delete family_photos" ON public.family_photos;
DROP POLICY IF EXISTS "Anyone can insert family_photos" ON public.family_photos;
DROP POLICY IF EXISTS "Anyone can read family_photos" ON public.family_photos;
DROP POLICY IF EXISTS "Anyone can update family_photos" ON public.family_photos;

CREATE POLICY "Users can view their families"
ON public.families
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND (
    public.is_family_member(id, auth.uid())
    OR public.is_family_admin(id, auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  )
);

CREATE POLICY "Users can create their families"
ON public.families
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (
    admin_user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  )
);

CREATE POLICY "Family admins can update families"
ON public.families
FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND (
    admin_user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (
    admin_user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  )
);

CREATE POLICY "Family admins can delete families"
ON public.families
FOR DELETE
USING (
  auth.uid() IS NOT NULL
  AND (
    admin_user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  )
);

CREATE POLICY "Family members can view memberships"
ON public.family_members
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND (
    user_id = auth.uid()
    OR public.is_family_admin(family_id, auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  )
);

CREATE POLICY "Users can join families as themselves"
ON public.family_members
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (
    user_id = auth.uid()
    OR public.is_family_admin(family_id, auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  )
);

CREATE POLICY "Members or admins can update memberships"
ON public.family_members
FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND (
    user_id = auth.uid()
    OR public.is_family_admin(family_id, auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (
    user_id = auth.uid()
    OR public.is_family_admin(family_id, auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  )
);

CREATE POLICY "Members or admins can delete memberships"
ON public.family_members
FOR DELETE
USING (
  auth.uid() IS NOT NULL
  AND (
    user_id = auth.uid()
    OR public.is_family_admin(family_id, auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  )
);

CREATE POLICY "Users can view visible collages"
ON public.family_collages
FOR SELECT
USING (
  deleted_at IS NULL
  AND (
    visibility = 'public'
    OR (
      auth.uid() IS NOT NULL
      AND (
        owner_user_id = auth.uid()
        OR public.has_role(auth.uid(), 'admin')
      )
    )
  )
);

CREATE POLICY "Users can create their own collages"
ON public.family_collages
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (
    owner_user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  )
);

CREATE POLICY "Owners or admins can update collages"
ON public.family_collages
FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND (
    (
      owner_user_id = auth.uid()
      AND COALESCE(locked_by_admin, false) = false
    )
    OR public.has_role(auth.uid(), 'admin')
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (
    owner_user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  )
);

CREATE POLICY "Owners or admins can delete collages"
ON public.family_collages
FOR DELETE
USING (
  auth.uid() IS NOT NULL
  AND (
    (
      owner_user_id = auth.uid()
      AND COALESCE(locked_by_admin, false) = false
    )
    OR public.has_role(auth.uid(), 'admin')
  )
);

CREATE POLICY "Users can view visible photos"
ON public.family_photos
FOR SELECT
USING (
  deleted_at IS NULL
  AND (
    visibility = 'public'
    OR (
      auth.uid() IS NOT NULL
      AND (
        owner_user_id = auth.uid()
        OR public.has_role(auth.uid(), 'admin')
      )
    )
  )
);

CREATE POLICY "Users can create their own photos"
ON public.family_photos
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (
    owner_user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  )
);

CREATE POLICY "Owners or admins can update photos"
ON public.family_photos
FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND (
    (
      owner_user_id = auth.uid()
      AND COALESCE(locked_by_admin, false) = false
    )
    OR public.has_role(auth.uid(), 'admin')
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (
    owner_user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  )
);

CREATE POLICY "Owners or admins can delete photos"
ON public.family_photos
FOR DELETE
USING (
  auth.uid() IS NOT NULL
  AND (
    (
      owner_user_id = auth.uid()
      AND COALESCE(locked_by_admin, false) = false
    )
    OR public.has_role(auth.uid(), 'admin')
  )
);

DROP POLICY IF EXISTS "Anyone can delete family photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update family photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload family photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view family photos" ON storage.objects;

CREATE POLICY "Owners or admins can upload family photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'family-photos'
  AND auth.uid() IS NOT NULL
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(), 'admin')
  )
);

CREATE POLICY "Visible family photos can be viewed"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'family-photos'
  AND EXISTS (
    SELECT 1
    FROM public.family_photos fp
    WHERE fp.deleted_at IS NULL
      AND (
        fp.image_url LIKE '%' || storage.objects.name
        OR fp.thumbnail_url LIKE '%' || storage.objects.name
      )
      AND (
        fp.visibility = 'public'
        OR (
          auth.uid() IS NOT NULL
          AND (
            fp.owner_user_id = auth.uid()
            OR public.has_role(auth.uid(), 'admin')
          )
        )
      )
  )
);

CREATE POLICY "Owners or admins can update family photos files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'family-photos'
  AND auth.uid() IS NOT NULL
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(), 'admin')
  )
)
WITH CHECK (
  bucket_id = 'family-photos'
  AND auth.uid() IS NOT NULL
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(), 'admin')
  )
);

CREATE POLICY "Owners or admins can delete family photos files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'family-photos'
  AND auth.uid() IS NOT NULL
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(), 'admin')
  )
);