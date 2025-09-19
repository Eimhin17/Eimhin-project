-- Update profiles table schema to use username instead of last_name
-- This script will:
-- 1. Add username column
-- 2. Drop last_name column
-- 3. Add constraints and indexes

-- Step 1: Add username column (nullable initially)
ALTER TABLE profiles 
ADD COLUMN username VARCHAR(50);

-- Step 2: Update existing rows with temporary usernames
-- This handles any existing data before making the column NOT NULL
UPDATE profiles 
SET username = CONCAT('user_', id::text)
WHERE username IS NULL;

-- Step 3: Now make username NOT NULL
ALTER TABLE profiles 
ALTER COLUMN username SET NOT NULL;

-- Step 4: Add unique constraint for username
ALTER TABLE profiles 
ADD CONSTRAINT profiles_username_unique UNIQUE (username);

-- Step 5: Drop the last_name column
ALTER TABLE profiles 
DROP COLUMN last_name;

-- Step 6: Add index for username lookups (performance optimization)
CREATE INDEX idx_profiles_username ON profiles(username);

-- Step 7: Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('first_name', 'last_name', 'username')
ORDER BY ordinal_position;
