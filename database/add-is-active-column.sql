-- Add missing is_active column to users table
-- This is a quick fix to get the app working while we plan the proper migration

-- Add the is_active column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update existing users to have is_active = true where status = 'active'
UPDATE users 
SET is_active = true 
WHERE status = 'active' AND is_active IS NULL;

-- Update existing users to have is_active = false where status != 'active'
UPDATE users 
SET is_active = false 
WHERE status != 'active' AND is_active IS NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Add a trigger to keep is_active in sync with status
CREATE OR REPLACE FUNCTION update_is_active_from_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update is_active when status changes
    IF NEW.status = 'active' THEN
        NEW.is_active = true;
    ELSE
        NEW.is_active = false;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger if it doesn't exist
DROP TRIGGER IF EXISTS trigger_update_is_active_from_status ON users;
CREATE TRIGGER trigger_update_is_active_from_status
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_is_active_from_status();

-- Verify the column was added
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'is_active';
