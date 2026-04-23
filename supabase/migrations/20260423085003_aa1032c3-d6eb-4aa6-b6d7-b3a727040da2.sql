DROP POLICY IF EXISTS "Public read access for photos" ON storage.objects;

CREATE POLICY "Public read access for photos"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'photos'
  AND lower(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp', 'gif', 'mp4', 'mov', 'webm')
  AND array_length(storage.foldername(name), 1) >= 1
  AND (storage.foldername(name))[1] IN ('business-photos', 'business-covers', 'review-photos', 'business-user-media')
);