
-- 1. Restrict email column on profiles to service_role only (still readable via auth session)
REVOKE SELECT ON public.profiles FROM anon, authenticated;
GRANT SELECT (id, display_name, avatar_url, created_at, updated_at) ON public.profiles TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- 2. Storage: replace permissive INSERT policy with ownership-checked policy
DROP POLICY IF EXISTS "Authenticated users can upload photos" ON storage.objects;

CREATE POLICY "Users can upload photos to their own scope"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'photos'
  AND auth.uid() IS NOT NULL
  AND array_length(storage.foldername(name), 1) >= 2
  AND (
    -- Business-scoped uploads: only the business owner
    (
      (storage.foldername(name))[1] IN ('business-photos','business-covers','business-user-media','businesses')
      AND public.user_owns_business(auth.uid(), ((storage.foldername(name))[2])::uuid)
    )
    OR
    -- Review-scoped uploads: only the review author
    (
      (storage.foldername(name))[1] = 'review-photos'
      AND EXISTS (
        SELECT 1 FROM public.reviews r
        WHERE r.id::text = (storage.foldername(name))[2]
          AND r.user_id = auth.uid()
      )
    )
    OR
    -- Project-request uploads: only the project owner
    (
      (storage.foldername(name))[1] = 'project-requests'
      AND EXISTS (
        SELECT 1 FROM public.project_requests pr
        WHERE pr.id::text = (storage.foldername(name))[2]
          AND pr.user_id = auth.uid()
      )
    )
  )
);

-- 3. Add UPDATE policy with the same ownership rules
CREATE POLICY "Users can update their own scoped photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'photos'
  AND array_length(storage.foldername(name), 1) >= 2
  AND (
    (
      (storage.foldername(name))[1] IN ('business-photos','business-covers','business-user-media','businesses')
      AND public.user_owns_business(auth.uid(), ((storage.foldername(name))[2])::uuid)
    )
    OR (
      (storage.foldername(name))[1] = 'review-photos'
      AND EXISTS (SELECT 1 FROM public.reviews r WHERE r.id::text = (storage.foldername(name))[2] AND r.user_id = auth.uid())
    )
    OR (
      (storage.foldername(name))[1] = 'project-requests'
      AND EXISTS (SELECT 1 FROM public.project_requests pr WHERE pr.id::text = (storage.foldername(name))[2] AND pr.user_id = auth.uid())
    )
  )
)
WITH CHECK (
  bucket_id = 'photos'
  AND array_length(storage.foldername(name), 1) >= 2
  AND (
    (
      (storage.foldername(name))[1] IN ('business-photos','business-covers','business-user-media','businesses')
      AND public.user_owns_business(auth.uid(), ((storage.foldername(name))[2])::uuid)
    )
    OR (
      (storage.foldername(name))[1] = 'review-photos'
      AND EXISTS (SELECT 1 FROM public.reviews r WHERE r.id::text = (storage.foldername(name))[2] AND r.user_id = auth.uid())
    )
    OR (
      (storage.foldername(name))[1] = 'project-requests'
      AND EXISTS (SELECT 1 FROM public.project_requests pr WHERE pr.id::text = (storage.foldername(name))[2] AND pr.user_id = auth.uid())
    )
  )
);

-- 4. Allow owners to delete their own files (admin DELETE policy stays in place)
CREATE POLICY "Users can delete their own scoped photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'photos'
  AND array_length(storage.foldername(name), 1) >= 2
  AND (
    (
      (storage.foldername(name))[1] IN ('business-photos','business-covers','business-user-media','businesses')
      AND public.user_owns_business(auth.uid(), ((storage.foldername(name))[2])::uuid)
    )
    OR (
      (storage.foldername(name))[1] = 'review-photos'
      AND EXISTS (SELECT 1 FROM public.reviews r WHERE r.id::text = (storage.foldername(name))[2] AND r.user_id = auth.uid())
    )
    OR (
      (storage.foldername(name))[1] = 'project-requests'
      AND EXISTS (SELECT 1 FROM public.project_requests pr WHERE pr.id::text = (storage.foldername(name))[2] AND pr.user_id = auth.uid())
    )
  )
);
