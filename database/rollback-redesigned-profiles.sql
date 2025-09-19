-- =====================================================
-- ROLLBACK SCRIPT: Redesigned Profiles → Original Profiles
-- =====================================================

-- Step 1: Verify both tables exist
SELECT 
  'Original profiles' as table_name, 
  COUNT(*) as count 
FROM profiles
UNION ALL
SELECT 
  'New profiles' as table_name, 
  COUNT(*) as count 
FROM profiles_new;

-- Step 2: If rollback is needed, you can:
-- 1. Drop the new table: DROP TABLE IF EXISTS profiles_new;
-- 2. Or rename tables to switch back:
--    ALTER TABLE profiles RENAME TO profiles_old;
--    ALTER TABLE profiles_new RENAME TO profiles;

-- Step 3: Update any references in your app code to use the original table name

-- This script is for reference - only run if you need to rollback
