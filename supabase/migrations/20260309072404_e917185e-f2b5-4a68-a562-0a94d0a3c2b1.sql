
-- Create photos storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('photos', 'photos', true);

-- Allow authenticated users to upload photos
CREATE POLICY "Authenticated users can upload photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'photos');

-- Allow public read access
CREATE POLICY "Public read access for photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'photos');

-- Allow owners to delete their photos
CREATE POLICY "Users can delete own photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'photos');
