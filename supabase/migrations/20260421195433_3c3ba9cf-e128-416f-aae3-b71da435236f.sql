DROP POLICY IF EXISTS "Users can view visible collages" ON public.family_collages;
CREATE POLICY "Anyone can view public collages"
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

DROP POLICY IF EXISTS "Users can view visible photos" ON public.family_photos;
CREATE POLICY "Anyone can view public photos"
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