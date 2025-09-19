-- =====================================================
-- FIX LIKES RLS FOR LAUNCH - SIMPLE MATHEMATICAL SOLUTION
-- This fixes the schema mismatch between auth.users and profiles
-- =====================================================

-- Step 1: Drop existing likes table and recreate with correct schema
DROP TABLE IF EXISTS likes CASCADE;

-- Step 2: Create likes table that references profiles (not auth.users)
-- This matches what the application code expects
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  liker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  liked_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure a user can only like another user once
  UNIQUE(liker_id, liked_user_id)
);

-- Step 3: Create indexes for optimal performance
CREATE INDEX idx_likes_liker_id ON likes(liker_id);
CREATE INDEX idx_likes_liked_user_id ON likes(liked_user_id);
CREATE INDEX idx_likes_created_at ON likes(created_at);

-- Step 4: Enable RLS
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- Step 5: Create simple, working RLS policies
-- Policy 1: Users can read likes where they are involved
CREATE POLICY "Users can read their likes" ON likes
  FOR SELECT USING (
    liker_id = (SELECT id FROM profiles WHERE user_id = auth.uid()) OR
    liked_user_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Policy 2: Users can create likes where they are the liker
CREATE POLICY "Users can create likes" ON likes
  FOR INSERT WITH CHECK (
    liker_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Policy 3: Users can delete their own likes
CREATE POLICY "Users can delete their own likes" ON likes
  FOR DELETE USING (
    liker_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Policy 4: No updates allowed (users should delete and recreate)
CREATE POLICY "No updates on likes" ON likes
  FOR UPDATE USING (false);

-- Step 6: Grant necessary permissions
GRANT ALL ON likes TO authenticated;
GRANT ALL ON likes TO service_role;
