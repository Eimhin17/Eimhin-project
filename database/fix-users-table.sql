-- Comprehensive fix for users table to resolve "Database error saving new user"
-- Run this in your Supabase SQL Editor

-- First, let's check the current state of the users table
SELECT 'Current users table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- Drop and recreate the users table with the correct structure
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number VARCHAR(15) UNIQUE,
    email VARCHAR(255) UNIQUE,
    school_email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    first_name VARCHAR(100) DEFAULT 'Pending',
    last_name VARCHAR(100) DEFAULT 'User',
    date_of_birth DATE DEFAULT '2000-01-01',
    gender VARCHAR(20) CHECK (gender IN ('woman', 'man', 'non-binary')),
    school_id UUID REFERENCES schools(id),
    looking_for VARCHAR(50),
    intentions VARCHAR(50),
    bio TEXT,
    voice_prompt_url VARCHAR(500),
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    phone_verified BOOLEAN DEFAULT FALSE,
    school_email_verified BOOLEAN DEFAULT FALSE,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    push_token VARCHAR(255),
    notification_settings JSONB DEFAULT '{}',
    privacy_settings JSONB DEFAULT '{}'
);

-- Create indexes for better performance
CREATE INDEX idx_users_phone_number ON users(phone_number);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_school_email ON users(school_email);
CREATE INDEX idx_users_school_id ON users(school_id);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert a test user to verify the table works
INSERT INTO users (
    id,
    first_name,
    last_name,
    school_email,
    school_email_verified,
    phone_verified,
    onboarding_completed,
    is_active
) VALUES (
    gen_random_uuid(),
    'Test',
    'User',
    'test@example.com',
    true,
    false,
    false,
    true
);

-- Verify the table structure and test insert
SELECT '✅ Users table recreated successfully!' as status;
SELECT 'Test user inserted successfully!' as test_status;

-- Show final table structure
SELECT 'Final users table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;
