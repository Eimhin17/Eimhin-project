-- Fix permissions and Row Level Security for the users table
-- This will allow your app to create and manage user profiles

-- 1. Enable Row Level Security on the users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 2. Create policy to allow users to insert their own profile
CREATE POLICY "Users can insert their own profile" ON users
    FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- 3. Create policy to allow users to view their own profile
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT 
    USING (auth.uid() = id);

-- 4. Create policy to allow users to update their own profile
CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE 
    USING (auth.uid() = id);

-- 5. Create policy to allow users to delete their own profile
CREATE POLICY "Users can delete their own profile" ON users
    FOR DELETE 
    USING (auth.uid() = id);

-- 6. Grant necessary permissions to the authenticated role
GRANT ALL ON users TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 7. Verify the policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'users';

-- 8. Test if we can insert a user (this should work now)
-- Note: This will only work if you're authenticated as a Supabase user
SELECT 'Permissions should now be working. Try creating a user profile again.' as status;
