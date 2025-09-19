-- =====================================================
-- FIX MATCHES RLS POLICIES - SAFE VERSION
-- This script safely handles existing policies
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Drop existing policies if they exist (ignore errors if they don't exist)
DO $$ 
BEGIN
    -- Drop existing policies
    DROP POLICY IF EXISTS "Users can view own matches" ON matches;
    DROP POLICY IF EXISTS "Users can view their matches" ON matches;
    DROP POLICY IF EXISTS "Users can create matches" ON matches;
    DROP POLICY IF EXISTS "Users can update own matches" ON matches;
    DROP POLICY IF EXISTS "Users can update their matches" ON matches;
    DROP POLICY IF EXISTS "Users can delete own matches" ON matches;
    DROP POLICY IF EXISTS "Users can delete their matches" ON matches;
    
    -- Create new policies
    CREATE POLICY "Users can view their matches" ON matches
      FOR SELECT USING (
        user1_id = auth.uid() OR 
        user2_id = auth.uid()
      );

    CREATE POLICY "Users can create matches" ON matches
      FOR INSERT WITH CHECK (
        user1_id = auth.uid() OR 
        user2_id = auth.uid()
      );

    CREATE POLICY "Users can update their matches" ON matches
      FOR UPDATE USING (
        user1_id = auth.uid() OR 
        user2_id = auth.uid()
      );

    CREATE POLICY "Users can delete their matches" ON matches
      FOR DELETE USING (
        user1_id = auth.uid() OR 
        user2_id = auth.uid()
      );
      
    RAISE NOTICE 'RLS policies for matches table have been updated successfully';
END $$;

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'matches'
ORDER BY policyname;
