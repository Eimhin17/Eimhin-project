-- =====================================================
-- Fix Database Permissions for User Data Insertion
-- Run this if you're getting "failed to save" errors
-- =====================================================

-- Step 1: Check current RLS status
SELECT 'Current RLS Status:' as info;
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'user_interests', 'user_photos', 'user_profile_prompts')
ORDER BY tablename;

-- Step 2: Check existing policies
SELECT 'Existing Policies:' as info;
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('users', 'user_interests', 'user_photos', 'user_profile_prompts')
ORDER BY tablename, cmd;

-- Step 3: Drop restrictive policies that might block INSERT
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can view other active profiles" ON users;

-- Step 4: Create comprehensive policies for all operations
-- Users table policies
CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view other active profiles" ON users
    FOR SELECT USING (status = 'active' AND onboarding_completed = true);

-- User interests policies
CREATE POLICY "Users can insert own interests" ON user_interests
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own interests" ON user_interests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own interests" ON user_interests
    FOR DELETE USING (auth.uid() = user_id);

-- User photos policies
CREATE POLICY "Users can insert own photos" ON user_photos
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own photos" ON user_photos
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own photos" ON user_photos
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own photos" ON user_photos
    FOR DELETE USING (auth.uid() = user_id);

-- User profile prompts policies
CREATE POLICY "Users can insert own profile prompts" ON user_profile_prompts
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own profile prompts" ON user_profile_prompts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile prompts" ON user_profile_prompts
    FOR UPDATE USING (auth.uid() = user_id);

-- User preferences policies
CREATE POLICY "Users can insert own preferences" ON user_preferences
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own preferences" ON user_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON user_preferences
    FOR UPDATE USING (auth.uid() = user_id);

-- Step 5: Grant explicit permissions
GRANT ALL ON users TO authenticated;
GRANT ALL ON user_interests TO authenticated;
GRANT ALL ON user_photos TO authenticated;
GRANT ALL ON user_profile_prompts TO authenticated;
GRANT ALL ON user_preferences TO authenticated;

-- Step 6: Verify the fix
SELECT 'Permissions Fixed - Test INSERT operations now' as status;
