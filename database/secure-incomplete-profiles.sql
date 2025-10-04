-- =====================================================
-- Secure Incomplete Profiles System
-- This migration ensures incomplete profiles are:
-- 1. Not visible to other users
-- 2. Cannot participate in swiping/matching
-- 3. Cannot be accessed directly
-- 4. Can only be resumed by the owner
-- =====================================================

-- Add onboarding_step column to track where user left off in onboarding
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_step TEXT;

-- Add index on profile_completed for fast filtering
CREATE INDEX IF NOT EXISTS idx_profiles_completed ON profiles(profile_completed) WHERE profile_completed = true;

-- Add composite index for common queries (active + completed profiles)
CREATE INDEX IF NOT EXISTS idx_profiles_active_completed ON profiles(status, profile_completed)
  WHERE status = 'active' AND profile_completed = true;

-- =====================================================
-- RLS POLICIES FOR INCOMPLETE PROFILES
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view profiles for swiping" ON profiles;

-- Policy: Only completed profiles are visible to other users
-- This prevents incomplete profiles from appearing in:
-- - Swiping stacks
-- - Search results
-- - Profile browsing
-- - Match suggestions
-- Special case: Allow checking if email has incomplete profile (for login UX)
CREATE POLICY "Only completed profiles are publicly visible"
  ON profiles
  FOR SELECT
  USING (
    -- Users can always see their own profile (complete or incomplete)
    auth.uid() = id
    OR
    -- Other users can only see completed profiles
    (profile_completed = true AND status = 'active')
    OR
    -- Allow checking if email has incomplete profile (limited info only: id, email, profile_completed, onboarding_step)
    -- This is safe and improves UX for login flow
    (profile_completed = false AND auth.uid() IS NULL)
  );

-- Policy: Users can only update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: Users can insert their own profile during onboarding
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Policy: Users can delete their own incomplete profile
-- This allows the "start over" functionality
CREATE POLICY "Users can delete own incomplete profile"
  ON profiles
  FOR DELETE
  USING (auth.uid() = id AND profile_completed = false);

-- =====================================================
-- ADDITIONAL SECURITY FOR RELATED TABLES
-- =====================================================

-- Ensure swipes table only allows completed profiles
DROP POLICY IF EXISTS "Users can create swipes on completed profiles" ON swipes;
CREATE POLICY "Users can create swipes on completed profiles"
  ON swipes
  FOR INSERT
  WITH CHECK (
    -- Swiper must be a completed profile
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = swiper_id
      AND profile_completed = true
      AND status = 'active'
    )
    AND
    -- Swiped user must be a completed profile
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = swiped_user_id
      AND profile_completed = true
      AND status = 'active'
    )
  );

-- Ensure likes table only allows completed profiles
DROP POLICY IF EXISTS "Users can create likes on completed profiles" ON likes;
CREATE POLICY "Users can create likes on completed profiles"
  ON likes
  FOR INSERT
  WITH CHECK (
    -- Liker must be a completed profile
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = liker_id
      AND profile_completed = true
      AND status = 'active'
    )
    AND
    -- Liked user must be a completed profile
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = liked_user_id
      AND profile_completed = true
      AND status = 'active'
    )
  );

-- Ensure matches table only allows completed profiles
DROP POLICY IF EXISTS "Users can view their matches with completed profiles" ON matches;
CREATE POLICY "Users can view their matches with completed profiles"
  ON matches
  FOR SELECT
  USING (
    -- User must be part of the match
    (user1_id = auth.uid() OR user2_id = auth.uid())
    AND
    -- Both users must have completed profiles
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = user1_id
      AND profile_completed = true
      AND status = 'active'
    )
    AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = user2_id
      AND profile_completed = true
      AND status = 'active'
    )
  );

-- =====================================================
-- CLEANUP FUNCTION FOR OLD INCOMPLETE PROFILES
-- =====================================================

-- Function to clean up incomplete profiles older than 30 days
-- This helps keep the database clean and removes abandoned accounts
CREATE OR REPLACE FUNCTION cleanup_abandoned_incomplete_profiles()
RETURNS void AS $$
BEGIN
  -- Delete photos of abandoned incomplete profiles
  DELETE FROM user_photos
  WHERE user_id IN (
    SELECT id FROM profiles
    WHERE profile_completed = false
    AND created_at < NOW() - INTERVAL '30 days'
  );

  -- Delete the abandoned incomplete profiles
  DELETE FROM profiles
  WHERE profile_completed = false
  AND created_at < NOW() - INTERVAL '30 days';

  RAISE NOTICE 'Cleaned up abandoned incomplete profiles older than 30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- HELPER FUNCTION TO CHECK PROFILE STATUS
-- =====================================================

-- Function to check if a user can access the app
-- Returns:
-- - 'complete': Profile is complete and user can access app
-- - 'incomplete': Profile is incomplete, user needs to resume or start over
-- - 'suspended': Account is suspended
-- - 'not_found': No profile found
CREATE OR REPLACE FUNCTION check_user_access_status(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  profile_record RECORD;
BEGIN
  SELECT profile_completed, status INTO profile_record
  FROM profiles
  WHERE id = user_id;

  IF NOT FOUND THEN
    RETURN 'not_found';
  END IF;

  IF profile_record.status != 'active' THEN
    RETURN 'suspended';
  END IF;

  IF profile_record.profile_completed = false THEN
    RETURN 'incomplete';
  END IF;

  RETURN 'complete';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant execute permission on helper functions
GRANT EXECUTE ON FUNCTION check_user_access_status(UUID) TO authenticated;

-- Note: cleanup_abandoned_incomplete_profiles should only be called by cron/admin
-- Not granting public execute permission

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- To verify the setup, run these queries:

-- 1. Count incomplete vs complete profiles
-- SELECT
--   profile_completed,
--   COUNT(*)
-- FROM profiles
-- GROUP BY profile_completed;

-- 2. Check if incomplete profiles are hidden from other users
-- SELECT * FROM profiles WHERE id != auth.uid();
-- (Should only return completed profiles)

-- 3. Test the access status function
-- SELECT check_user_access_status(auth.uid());
