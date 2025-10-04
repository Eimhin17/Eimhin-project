-- =====================================================
-- Update username column max length to 15 characters
-- =====================================================

-- 1. Check current username lengths
SELECT
    username,
    LENGTH(username) as length
FROM profiles
WHERE LENGTH(username) > 15
ORDER BY LENGTH(username) DESC
LIMIT 10;

-- 2. Truncate any usernames longer than 15 characters (if any exist)
-- WARNING: This will truncate existing long usernames!
UPDATE profiles
SET username = LEFT(username, 15)
WHERE LENGTH(username) > 15;

-- 3. Alter the column to VARCHAR(15)
ALTER TABLE profiles
ALTER COLUMN username TYPE VARCHAR(15);

-- 4. Verify the change
SELECT
    column_name,
    data_type,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'profiles'
    AND column_name = 'username';

-- 5. Success message
SELECT 'Username max length updated to 15 characters ✅' as status;
