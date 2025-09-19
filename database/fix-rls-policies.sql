-- Fix RLS policies for the profiles table
-- Run this in Supabase Dashboard → SQL Editor

-- Step 1: Check current RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'profiles';

-- Step 2: Check existing policies
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
WHERE tablename = 'profiles';

-- Step 3: Drop existing policies (if any)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view other active profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Service role can do everything" ON profiles;

-- Step 4: Create new, more permissive policies
-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow users to view other active profiles (for matching)
CREATE POLICY "Users can view other active profiles" ON profiles
  FOR SELECT USING (status = 'active' AND onboarding_completed = true);

-- Allow service role to do everything (for admin operations)
CREATE POLICY "Service role can do everything" ON profiles
  FOR ALL USING (auth.role() = 'service_role');

-- Step 5: Verify the policies were created
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
WHERE tablename = 'profiles';

-- Step 6: Test if we can now access the user's profile
-- This should work after the policies are fixed
SELECT 
  id,
  email,
  first_name,
  last_name,
  onboarding_completed,
  status
FROM profiles 
WHERE email = 'eimhinohare@gmail.com';

-- Step 7: Check if there are any other permission issues
-- Look for any missing columns or constraints
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;
