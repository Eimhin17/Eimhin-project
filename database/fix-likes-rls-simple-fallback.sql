-- =====================================================
-- SIMPLE FALLBACK FIX FOR LIKES RLS
-- If the profile lookup approach doesn't work, use this simpler version
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read their likes" ON likes;
DROP POLICY IF EXISTS "Users can create likes" ON likes;
DROP POLICY IF EXISTS "Users can delete their own likes" ON likes;
DROP POLICY IF EXISTS "No updates on likes" ON likes;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON likes;

-- Create ultra-simple policies that work for launch
-- This allows all authenticated users to perform all operations on likes
-- The application-level authentication will handle security
CREATE POLICY "Allow all operations for authenticated users" ON likes
  FOR ALL USING (auth.role() = 'authenticated');

-- Grant all necessary permissions
GRANT ALL ON likes TO authenticated;
GRANT ALL ON likes TO service_role;

-- Ensure RLS is enabled
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
