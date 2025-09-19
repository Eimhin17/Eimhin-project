-- Fix the insert policy to allow service role and authenticated users
DROP POLICY IF EXISTS "Allow users to insert their own profile_pictures" ON profile_pictures;

-- Create a more permissive insert policy
CREATE POLICY "Allow authenticated users to insert profile_pictures" ON profile_pictures
  FOR INSERT WITH CHECK (true);

-- Also allow service role to do everything
CREATE POLICY "Allow service role full access" ON profile_pictures
  FOR ALL USING (auth.role() = 'service_role');
