-- Allow admins to upload professional photos
CREATE POLICY "Admins can upload professional avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Allow admins to update professional photos
CREATE POLICY "Admins can update professional avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Allow admins to delete professional photos
CREATE POLICY "Admins can delete professional avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND public.has_role(auth.uid(), 'admin')
);