-- Add created_at column to profiles table
-- This column tracks when the profile was created

-- Add the column with default value
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Set created_at for existing profiles that don't have it
-- Use the earliest available timestamp or current time
UPDATE profiles
SET created_at = COALESCE(updated_at, NOW())
WHERE created_at IS NULL;

-- Make it NOT NULL after setting values
ALTER TABLE profiles
ALTER COLUMN created_at SET NOT NULL;

-- Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_created_at
ON profiles(created_at);

-- Add a comment to the column for documentation
COMMENT ON COLUMN profiles.created_at IS 'Timestamp when the profile was created';
