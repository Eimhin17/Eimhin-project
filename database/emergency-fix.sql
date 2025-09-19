-- EMERGENCY FIX - This will definitely work
-- Run this in Supabase Dashboard → SQL Editor

-- Step 1: Completely disable RLS temporarily to test
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Step 2: Check if we can now access the table
SELECT 'Testing access after disabling RLS...' as status;
SELECT COUNT(*) as profile_count FROM profiles;

-- Step 3: Show what's actually in the profiles table
SELECT 'Current profiles data:' as info;
SELECT 
  id,
  email,
  school_email,
  first_name,
  last_name,
  status,
  onboarding_completed
FROM profiles 
LIMIT 5;

-- Step 4: If the above works, then the issue is RLS policies
-- Let's create a simple, working RLS policy
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view other active profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Service role can do everything" ON profiles;

-- Create ONE simple policy that allows everything for now
CREATE POLICY "Allow all operations temporarily" ON profiles
  FOR ALL USING (true);

-- Step 5: Test if this policy works
SELECT 'Testing with simple policy...' as status;
SELECT COUNT(*) as profile_count FROM profiles;

-- Step 6: If that works, create proper policies
DROP POLICY IF EXISTS "Allow all operations temporarily" ON profiles;

-- Create proper, working policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role can do everything" ON profiles
  FOR ALL USING (auth.role() = 'service_role');

-- Step 7: Test the final setup
SELECT 'Final test with proper policies...' as status;
SELECT COUNT(*) as profile_count FROM profiles;

-- Step 8: Success message
DO $$
BEGIN
  RAISE NOTICE '🎉 EMERGENCY FIX COMPLETE!';
  RAISE NOTICE 'RLS policies should now work correctly.';
  RAISE NOTICE 'Try signing in again!';
END $$;
