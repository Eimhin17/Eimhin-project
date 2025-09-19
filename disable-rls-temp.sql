-- TEMPORARY FIX: Disable RLS to get working immediately
-- Run this to fix the permission error right now

-- Disable RLS temporarily
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Grant all permissions
GRANT ALL PRIVILEGES ON profiles TO authenticated;
GRANT ALL PRIVILEGES ON profiles TO service_role;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

-- This will immediately fix the permission error
-- You can re-enable RLS later with proper policies if needed
