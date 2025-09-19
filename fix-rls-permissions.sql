-- Fix RLS permissions for profiles table
-- This script ensures proper access to the profiles table

-- First, drop existing policies to recreate them
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON profiles;

-- Recreate RLS policies with proper permissions
CREATE POLICY "Enable read access for all users" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON profiles
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for users based on user_id" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Also add a policy for DELETE if needed
CREATE POLICY "Enable delete for users based on user_id" ON profiles
  FOR DELETE USING (auth.uid() = id);

-- Grant necessary permissions to authenticated users
GRANT ALL ON profiles TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Ensure the trigger function has proper permissions
GRANT EXECUTE ON FUNCTION calculate_age() TO authenticated;
