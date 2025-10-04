-- Allow authenticated users to read any photo in the user-photos bucket
-- This enables viewing other users' profile photos on swiping, likes, and chats.

-- Drop the restrictive read policy if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'user-photos-read-policy'
  ) THEN
    EXECUTE 'DROP POLICY "user-photos-read-policy" ON storage.objects;';
  END IF;
END $$;

-- Create a permissive read policy for authenticated users
CREATE POLICY "user-photos-read-policy" ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'user-photos'
);

-- Optional: verify policy is in place
-- SELECT policyname, roles, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'user-photos-read-policy';

