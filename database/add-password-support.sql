-- Add Password Support Migration Script
-- Run this in your Supabase SQL Editor to add password support to existing users

-- Add password_hash column to users table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'password_hash'
    ) THEN
        ALTER TABLE users ADD COLUMN password_hash VARCHAR(255);
        RAISE NOTICE 'Added password_hash column to users table';
    ELSE
        RAISE NOTICE 'password_hash column already exists';
    END IF;
END $$;

-- Create an index on password_hash for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_password_hash ON users(password_hash);

-- Update RLS policies to allow password-based authentication
-- Users can read their own password hash for verification
CREATE POLICY "Users can read own password hash" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own password hash
CREATE POLICY "Users can update own password hash" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Allow password hash updates during signup
CREATE POLICY "Allow password hash during signup" ON users
  FOR INSERT WITH CHECK (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Create a function to hash passwords (for future use)
CREATE OR REPLACE FUNCTION hash_password(password TEXT)
RETURNS TEXT AS $$
BEGIN
    -- This is a placeholder - actual hashing will be done in the application
    -- In production, you'd use a proper hashing library like bcrypt
    RETURN 'hashed_' || password;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to verify passwords
CREATE OR REPLACE FUNCTION verify_password(user_id UUID, password TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- This is a placeholder - actual verification will be done in the application
    -- In production, you'd use a proper verification library
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE id = user_id 
        AND password_hash = 'hashed_' || password
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
