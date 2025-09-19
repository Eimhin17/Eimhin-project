-- =====================================================
-- CREATE LIKES TABLE
-- Table to store user likes/swipes
-- =====================================================

-- Create likes table
CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  liker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  liked_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure a user can only like another user once
  UNIQUE(liker_id, liked_user_id)
);

-- Create indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_likes_liker_id ON likes(liker_id);
CREATE INDEX IF NOT EXISTS idx_likes_liked_user_id ON likes(liked_user_id);
CREATE INDEX IF NOT EXISTS idx_likes_created_at ON likes(created_at);

-- Enable RLS
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can read likes where they are the liker or the liked user
CREATE POLICY "Users can read their own likes" ON likes
  FOR SELECT USING (
    liker_id = auth.uid() OR 
    liked_user_id = auth.uid()
  );

-- Users can insert likes where they are the liker
CREATE POLICY "Users can create likes" ON likes
  FOR INSERT WITH CHECK (liker_id = auth.uid());

-- Users can delete their own likes
CREATE POLICY "Users can delete their own likes" ON likes
  FOR DELETE USING (liker_id = auth.uid());

-- Prevent users from updating likes (they should delete and recreate)
CREATE POLICY "No updates allowed on likes" ON likes
  FOR UPDATE USING (false);

-- Additional policy to allow authenticated users to insert likes
-- This is a fallback in case the main policy doesn't work
CREATE POLICY "Allow authenticated users to create likes" ON likes
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
