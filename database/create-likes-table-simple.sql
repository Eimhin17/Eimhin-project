-- =====================================================
-- SIMPLE LIKES TABLE - References profiles table
-- This matches the app's actual data structure
-- =====================================================

-- Drop existing likes table if it exists
DROP TABLE IF EXISTS likes CASCADE;

-- Create likes table that references profiles (not auth.users)
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  liker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  liked_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure a user can only like another user once
  UNIQUE(liker_id, liked_user_id)
);

-- Create indexes for optimal performance
CREATE INDEX idx_likes_liker_id ON likes(liker_id);
CREATE INDEX idx_likes_liked_user_id ON likes(liked_user_id);
CREATE INDEX idx_likes_created_at ON likes(created_at);

-- Enable RLS
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- Simple RLS policy - allow all operations for authenticated users
-- This is safe because the app handles authentication at the application level
CREATE POLICY "Allow all operations for authenticated users" ON likes
  FOR ALL USING (true);

-- Alternative: More restrictive policy (uncomment if you prefer)
-- CREATE POLICY "Users can manage their own likes" ON likes
--   FOR ALL USING (
--     liker_id IN (SELECT id FROM profiles WHERE id = auth.uid()) OR
--     liked_user_id IN (SELECT id FROM profiles WHERE id = auth.uid())
--   );
