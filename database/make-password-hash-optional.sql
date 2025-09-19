-- Make password_hash field optional in users table
-- This is the production-ready approach since Supabase Auth handles passwords

-- Check current constraint
SELECT 
    column_name, 
    is_nullable, 
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'password_hash';

-- Make password_hash nullable (remove NOT NULL constraint)
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- Verify the change
SELECT 
    column_name, 
    is_nullable, 
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'password_hash';

-- Add comment explaining why this field is optional
COMMENT ON COLUMN users.password_hash IS 'Optional field - Supabase Auth handles password management securely';

-- Show final table structure
\d users;
