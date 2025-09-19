-- Fix database access issues
-- Run this in Supabase SQL Editor

-- 1. First, let's check what tables exist and their structure
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('profiles', 'users') 
ORDER BY table_name, ordinal_position;

-- 2. Check if RLS is enabled on profiles table
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles';

-- 3. Check existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles';

-- 4. Drop all existing policies on profiles table
DROP POLICY IF EXISTS "Allow viewing active profiles" ON profiles;
DROP POLICY IF EXISTS "Allow viewing own profile" ON profiles;
DROP POLICY IF EXISTS "Allow inserting own profile" ON profiles;
DROP POLICY IF EXISTS "Allow updating own profile" ON profiles;
DROP POLICY IF EXISTS "Service role full access" ON profiles;
DROP POLICY IF EXISTS "Users can view other active profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Service role can do everything" ON profiles;

-- 5. Create new, simple policies
CREATE POLICY "Enable read access for all users" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON profiles
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for users based on user_id" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- 6. Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 7. Test the query
SELECT id, first_name, last_name, email, status, onboarding_completed, profile_completed 
FROM profiles 
ORDER BY created_at DESC;
