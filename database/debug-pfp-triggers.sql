-- =====================================================
-- DEBUG: Check PFP trigger functions and test them
-- =====================================================

-- Step 1: Check if the profile_pictures table exists and has data
SELECT 'Profile Pictures Table Check:' as info;
SELECT COUNT(*) as total_pfps FROM profile_pictures;

-- Step 2: Check if the user_pfps view exists and has data
SELECT 'User PFPs View Check:' as info;
SELECT COUNT(*) as total_user_pfps FROM user_pfps;

-- Step 3: Check the current trigger functions
SELECT 'Current PFP Trigger Functions:' as info;
SELECT 
  routine_name, 
  routine_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_name IN ('generate_user_pfp', 'generate_user_pfp_from_profiles')
AND routine_schema = 'public';

-- Step 4: Check if triggers are active
SELECT 'Active PFP Triggers:' as info;
SELECT 
  trigger_name,
  event_manipulation,
  action_statement,
  trigger_schema
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND event_object_table = 'profiles'
AND trigger_name LIKE '%pfp%';

-- Step 5: Test the PFP generation manually for a specific user
-- Replace 'USER_ID_HERE' with an actual user ID from your profiles table
SELECT 'Manual PFP Test:' as info;
SELECT 
  id,
  first_name,
  last_name,
  photos,
  array_length(photos, 1) as photo_count
FROM profiles 
WHERE photos IS NOT NULL 
AND array_length(photos, 1) > 0
LIMIT 1;
