-- Fix RLS policies to allow profile viewing
-- This script should be run in the Supabase SQL Editor

-- First, let's check what policies currently exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles';

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view other active profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Service role can do everything" ON profiles;

-- Create new policies that allow proper access
-- Allow users to view all active profiles (for swiping)
CREATE POLICY "Allow viewing active profiles" ON profiles
  FOR SELECT USING (status = 'active' AND onboarding_completed = true);

-- Allow users to view their own profile
CREATE POLICY "Allow viewing own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Allow users to insert their own profile
CREATE POLICY "Allow inserting own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Allow updating own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Allow service role to do everything (for admin operations)
CREATE POLICY "Service role full access" ON profiles
  FOR ALL USING (auth.role() = 'service_role');

-- Also ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Test the policies by checking if we can see profiles
-- This should work after running the above policies
SELECT id, first_name, last_name, email, status, onboarding_completed 
FROM profiles 
WHERE status = 'active' AND onboarding_completed = true;


