-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow all users to read profile_pictures" ON profile_pictures;
DROP POLICY IF EXISTS "Allow users to insert their own profile_pictures" ON profile_pictures;
DROP POLICY IF EXISTS "Allow users to update their own profile_pictures" ON profile_pictures;
DROP POLICY IF EXISTS "Allow users to delete their own profile_pictures" ON profile_pictures;

-- Create new RLS policies
CREATE POLICY "Allow all users to read profile_pictures" ON profile_pictures
  FOR SELECT USING (true);

CREATE POLICY "Allow users to insert their own profile_pictures" ON profile_pictures
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own profile_pictures" ON profile_pictures
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own profile_pictures" ON profile_pictures
  FOR DELETE USING (auth.uid() = user_id);

-- Also allow service role to do everything
CREATE POLICY "Allow service role full access" ON profile_pictures
  FOR ALL USING (auth.role() = 'service_role');
