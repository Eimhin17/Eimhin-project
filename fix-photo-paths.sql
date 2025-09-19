-- Update RLS policies to match new path structure
DROP POLICY IF EXISTS "user-photos-upload-policy" ON storage.objects;
DROP POLICY IF EXISTS "user-photos-read-policy" ON storage.objects;
DROP POLICY IF EXISTS "user-photos-delete-policy" ON storage.objects;

-- Create policies with corrected path logic (no user-photos prefix in folder name)
CREATE POLICY "user-photos-upload-policy" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'user-photos'
    AND (storage.foldername(name))[1] = (SELECT username FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "user-photos-read-policy" ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'user-photos'
    AND (storage.foldername(name))[1] = (SELECT username FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "user-photos-delete-policy" ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'user-photos'
    AND (storage.foldername(name))[1] = (SELECT username FROM public.profiles WHERE id = auth.uid())
);
