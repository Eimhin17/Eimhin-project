-- =====================================================
-- TEMPORARILY DISABLE RLS FOR LIKES TABLE
-- Use this for testing, then re-enable with proper policies
-- =====================================================

-- Temporarily disable RLS for testing
ALTER TABLE likes DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS (uncomment when ready)
-- ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (if any)
DROP POLICY IF EXISTS "Users can read their own likes" ON likes;
DROP POLICY IF EXISTS "Users can create likes" ON likes;
DROP POLICY IF EXISTS "Users can delete their own likes" ON likes;
DROP POLICY IF EXISTS "No updates allowed on likes" ON likes;
DROP POLICY IF EXISTS "Allow authenticated users to create likes" ON likes;

-- Create new, simpler policies
CREATE POLICY "Allow all operations for authenticated users" ON likes
  FOR ALL USING (auth.role() = 'authenticated');
