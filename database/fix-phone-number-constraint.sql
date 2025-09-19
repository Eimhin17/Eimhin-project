-- Fix phone_number constraint issue
-- This allows multiple users to have no phone number

-- Drop the unique constraint on phone_number
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_phone_number_key;

-- Make phone_number nullable (it should already be, but just to be sure)
ALTER TABLE users ALTER COLUMN phone_number DROP NOT NULL;

-- Drop the existing index if it exists, then recreate it
DROP INDEX IF EXISTS idx_users_phone_number_unique;

-- Add a partial unique constraint that only applies to non-null phone numbers
-- This ensures phone numbers are unique when provided, but multiple users can have no phone number
CREATE UNIQUE INDEX idx_users_phone_number_unique 
ON users (phone_number) 
WHERE phone_number IS NOT NULL;

-- Verify the change
SELECT 
    column_name, 
    is_nullable, 
    column_default,
    data_type
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'phone_number';

-- Show the new index
SELECT 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE tablename = 'users' AND indexname = 'idx_users_phone_number_unique';
