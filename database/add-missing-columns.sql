-- Add all missing columns that the code expects
-- This is a comprehensive fix to get the app working with the current codebase

-- 1. Add school_email and school_email_verified columns
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS school_email VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS school_email_verified BOOLEAN DEFAULT false;

-- 2. Copy data from email to school_email if school_email is null
UPDATE users 
SET school_email = email 
WHERE school_email IS NULL AND email IS NOT NULL;

-- 3. Copy data from email_verified to school_email_verified if school_email_verified is null
UPDATE users 
SET school_email_verified = email_verified 
WHERE school_email_verified IS NULL AND email_verified IS NOT NULL;

-- 4. Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_users_school_email ON users(school_email);

-- 5. Add a trigger to keep school_email in sync with email
CREATE OR REPLACE FUNCTION sync_school_email_with_email()
RETURNS TRIGGER AS $$
BEGIN
    -- Update school_email when email changes
    IF NEW.email IS DISTINCT FROM OLD.email THEN
        NEW.school_email = NEW.email;
    END IF;
    
    -- Update school_email_verified when email_verified changes
    IF NEW.email_verified IS DISTINCT FROM OLD.email_verified THEN
        NEW.school_email_verified = NEW.email_verified;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger if it doesn't exist
DROP TRIGGER IF EXISTS trigger_sync_school_email_with_email ON users;
CREATE TRIGGER trigger_sync_school_email_with_email
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION sync_school_email_with_email();

-- 6. Verify all columns exist
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('is_active', 'school_email', 'school_email_verified', 'status')
ORDER BY column_name;
