-- =====================================================
-- Enhanced Incomplete Profile Security
-- Additional RLS policies to close security gaps
-- =====================================================

-- =====================================================
-- 1. MESSAGES TABLE - Enhanced Security
-- =====================================================

-- Drop existing message policies
DROP POLICY IF EXISTS "Users can view messages in their matches" ON messages;
DROP POLICY IF EXISTS "Users can send messages in their matches" ON messages;

-- Enhanced policy: Only completed profiles can view messages
CREATE POLICY "Only completed profiles can view messages"
  ON messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM matches m
      JOIN profiles p1 ON m.user1_id = p1.id
      JOIN profiles p2 ON m.user2_id = p2.id
      WHERE m.id = messages.match_id
      AND p1.profile_completed = true
      AND p1.status = 'active'
      AND p2.profile_completed = true
      AND p2.status = 'active'
      AND (p1.id = auth.uid() OR p2.id = auth.uid())
    )
  );

-- Enhanced policy: Only completed profiles can send messages
CREATE POLICY "Only completed profiles can send messages"
  ON messages
  FOR INSERT
  WITH CHECK (
    -- Sender must have completed profile
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND profile_completed = true
      AND status = 'active'
    )
    AND
    -- Match must exist between two completed profiles
    EXISTS (
      SELECT 1 FROM matches m
      JOIN profiles p1 ON m.user1_id = p1.id
      JOIN profiles p2 ON m.user2_id = p2.id
      WHERE m.id = messages.match_id
      AND p1.profile_completed = true
      AND p1.status = 'active'
      AND p2.profile_completed = true
      AND p2.status = 'active'
      AND (p1.id = auth.uid() OR p2.id = auth.uid())
    )
  );

-- =====================================================
-- 2. USER_INTERESTS TABLE - Privacy Protection
-- =====================================================

DROP POLICY IF EXISTS "Users can view own interests" ON user_interests;
DROP POLICY IF EXISTS "Public interests viewable" ON user_interests;

-- Only show interests for completed profiles
CREATE POLICY "Interests only visible for completed profiles"
  ON user_interests
  FOR SELECT
  USING (
    -- Users can always see their own interests (even if incomplete)
    user_id = auth.uid()
    OR
    -- Others can only see interests of completed profiles
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = user_interests.user_id
      AND profile_completed = true
      AND status = 'active'
    )
  );

-- Users can manage their own interests during onboarding
CREATE POLICY "Users can manage own interests"
  ON user_interests
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- 3. USER_PROFILE_PROMPTS TABLE - Privacy Protection
-- =====================================================

DROP POLICY IF EXISTS "Users can view own prompts" ON user_profile_prompts;
DROP POLICY IF EXISTS "Public prompts viewable" ON user_profile_prompts;

-- Only show prompts for completed profiles
CREATE POLICY "Prompts only visible for completed profiles"
  ON user_profile_prompts
  FOR SELECT
  USING (
    -- Users can always see their own prompts (even if incomplete)
    user_id = auth.uid()
    OR
    -- Others can only see prompts of completed profiles
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = user_profile_prompts.user_id
      AND profile_completed = true
      AND status = 'active'
    )
  );

-- Users can manage their own prompts during onboarding
CREATE POLICY "Users can manage own prompts"
  ON user_profile_prompts
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- 4. USER_PHOTOS TABLE - Privacy Protection
-- =====================================================

DROP POLICY IF EXISTS "Users can view own photos" ON user_photos;
DROP POLICY IF EXISTS "Public photos viewable" ON user_photos;

-- Only show photos for completed profiles
CREATE POLICY "Photos only visible for completed profiles"
  ON user_photos
  FOR SELECT
  USING (
    -- Users can always see their own photos (even if incomplete)
    user_id = auth.uid()
    OR
    -- Others can only see photos of completed profiles
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = user_photos.user_id
      AND profile_completed = true
      AND status = 'active'
    )
  );

-- Users can manage their own photos during onboarding
CREATE POLICY "Users can manage own photos"
  ON user_photos
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- 5. PUSH_TOKENS TABLE - Prevent Spam
-- =====================================================

-- If push_tokens table exists, add policy
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'push_tokens') THEN
    -- Drop existing policies
    DROP POLICY IF EXISTS "Users can manage own push tokens" ON push_tokens;

    -- Only completed profiles can register for push notifications
    EXECUTE 'CREATE POLICY "Only completed profiles can register push tokens"
      ON push_tokens
      FOR ALL
      USING (
        user_id = auth.uid()
        AND EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid()
          AND profile_completed = true
          AND status = ''active''
        )
      )
      WITH CHECK (
        user_id = auth.uid()
        AND EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid()
          AND profile_completed = true
          AND status = ''active''
        )
      )';
  END IF;
END $$;

-- =====================================================
-- 6. STORAGE BUCKET POLICIES
-- =====================================================

-- Note: Storage bucket policies are managed in Supabase Dashboard
-- Recommended policies:

-- user-photos bucket:
-- SELECT: authenticated users can read photos of completed profiles
-- INSERT: authenticated users can upload their own photos during onboarding
-- UPDATE: users can update their own photos
-- DELETE: users can delete their own photos

-- user-pfps bucket:
-- SELECT: authenticated users can read PFPs of completed profiles
-- INSERT: authenticated users can upload their own PFP during onboarding
-- UPDATE: users can update their own PFP
-- DELETE: users can delete their own PFP

-- =====================================================
-- 7. HELPER FUNCTION - Check if user can access profile data
-- =====================================================

CREATE OR REPLACE FUNCTION can_access_profile_data(target_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- User can always access their own data
  IF target_user_id = auth.uid() THEN
    RETURN TRUE;
  END IF;

  -- Others can only access completed profiles
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = target_user_id
    AND profile_completed = true
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION can_access_profile_data(UUID) TO authenticated;

-- =====================================================
-- 8. FUNCTION - Clean up orphaned photos
-- =====================================================

CREATE OR REPLACE FUNCTION cleanup_orphaned_photos(target_user_id UUID)
RETURNS void AS $$
DECLARE
  username_val TEXT;
BEGIN
  -- Get username
  SELECT username INTO username_val
  FROM profiles
  WHERE id = target_user_id;

  IF username_val IS NOT NULL THEN
    -- Note: Actual file deletion must be done via Supabase client
    -- This function just documents the cleanup logic
    RAISE NOTICE 'Clean up photos for user: % with username: %', target_user_id, username_val;

    -- Delete photo records from database
    DELETE FROM user_photos WHERE user_id = target_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION cleanup_orphaned_photos(UUID) TO authenticated;

-- =====================================================
-- 9. DEFENSIVE INDEXES
-- =====================================================

-- Add indexes for faster policy checks
CREATE INDEX IF NOT EXISTS idx_messages_match_id ON messages(match_id);
CREATE INDEX IF NOT EXISTS idx_user_interests_user_id ON user_interests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profile_prompts_user_id ON user_profile_prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_photos_user_id ON user_photos(user_id);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Test that incomplete profiles can't access other users' data
-- SELECT * FROM user_interests WHERE user_id != auth.uid();
-- (Should only return data if those users have profile_completed = true)

-- Test that incomplete profiles can't send messages
-- INSERT INTO messages (match_id, sender_id, content) VALUES (...);
-- (Should fail if sender doesn't have profile_completed = true)

-- Test that incomplete profiles' data is hidden
-- SELECT * FROM profiles WHERE profile_completed = false AND id != auth.uid();
-- (Should return no rows)

RAISE NOTICE '✅ Enhanced incomplete profile security policies applied successfully';
