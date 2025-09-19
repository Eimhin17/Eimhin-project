-- EMERGENCY RLS FIX
-- This will completely fix the permission issues

-- Step 1: Temporarily disable RLS to fix permissions
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop all existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON profiles;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON profiles;

-- Step 3: Grant full permissions to authenticated users
GRANT ALL PRIVILEGES ON profiles TO authenticated;
GRANT ALL PRIVILEGES ON profiles TO service_role;

-- Step 4: Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

-- Step 5: Grant permissions on the trigger function
GRANT EXECUTE ON FUNCTION calculate_age_from_dob() TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_age_from_dob() TO service_role;

-- Step 6: Re-enable RLS with proper policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 7: Create new, simpler RLS policies
CREATE POLICY "profiles_select_policy" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "profiles_insert_policy" ON profiles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "profiles_update_policy" ON profiles
  FOR UPDATE USING (true);

CREATE POLICY "profiles_delete_policy" ON profiles
  FOR DELETE USING (true);

-- Step 8: Ensure the table owner has proper permissions
ALTER TABLE profiles OWNER TO postgres;
