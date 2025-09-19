-- Add email_notifications_enabled column to profiles table
-- This column will store whether the user wants to receive email notifications

-- Add the column with a default value of true (most users want email notifications)
ALTER TABLE profiles 
ADD COLUMN email_notifications_enabled BOOLEAN DEFAULT true;

-- Add a comment to document the column
COMMENT ON COLUMN profiles.email_notifications_enabled IS 'Whether the user wants to receive email notifications';

-- Update existing users to have email notifications enabled by default
UPDATE profiles 
SET email_notifications_enabled = true 
WHERE email_notifications_enabled IS NULL;

-- Verify the column was added successfully
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('notifications_enabled', 'email_notifications_enabled')
ORDER BY column_name;
