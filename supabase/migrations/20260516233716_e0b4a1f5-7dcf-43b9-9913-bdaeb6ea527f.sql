
-- 1) Harden user_roles: block self-grant of admin
DROP POLICY IF EXISTS "Users can insert own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can update own roles" ON public.user_roles;

CREATE POLICY "Users can insert own non-admin roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND role IN ('user'::public.app_role, 'merchant'::public.app_role)
);

CREATE POLICY "Users can update own non-admin roles"
ON public.user_roles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND role <> 'admin'::public.app_role)
WITH CHECK (
  auth.uid() = user_id
  AND role IN ('user'::public.app_role, 'merchant'::public.app_role)
);

-- Admin can manage any role (idempotent)
DROP POLICY IF EXISTS "Admins can update any role" ON public.user_roles;
CREATE POLICY "Admins can update any role"
ON public.user_roles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can delete any role" ON public.user_roles;
CREATE POLICY "Admins can delete any role"
ON public.user_roles FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 2) Harden businesses INSERT
DROP POLICY IF EXISTS "Authenticated users can create business" ON public.businesses;

CREATE POLICY "Authenticated users can create owned business"
ON public.businesses FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (owner_user_id IS NULL OR owner_user_id = auth.uid())
  AND is_claimed = false
);

-- 3) Storage: restrict deletes on the photos bucket
DROP POLICY IF EXISTS "Users can delete own photos" ON storage.objects;

CREATE POLICY "Admins can delete photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'photos'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);
