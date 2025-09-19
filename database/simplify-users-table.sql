-- Simplify the users table to only include essential columns
-- This removes complex columns and keeps only what's needed for basic user profiles

-- First, let's see what columns currently exist
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- Create a backup of the current users table
CREATE TABLE IF NOT EXISTS users_backup AS SELECT * FROM users;

-- Drop the existing users table
DROP TABLE IF EXISTS users CASCADE;

-- Create a simplified users table with only essential columns
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE NOT NULL,
  gender VARCHAR(20) NOT NULL,
  looking_for VARCHAR(50) NOT NULL,
  relationship_intention VARCHAR(50) NOT NULL,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_gender ON users(gender);
CREATE INDEX idx_users_looking_for ON users(looking_for);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Insert the existing user data (if any) with only the columns we need
INSERT INTO users (
  id,
  email,
  first_name,
  last_name,
  date_of_birth,
  gender,
  looking_for,
  relationship_intention,
  bio,
  created_at,
  updated_at
)
SELECT 
  id,
  email,
  COALESCE(first_name, 'Unknown') as first_name,
  COALESCE(last_name, 'Unknown') as last_name,
  COALESCE(date_of_birth, '2000-01-01') as date_of_birth,
  COALESCE(gender, 'woman') as gender,
  COALESCE(looking_for, 'go_to_someones_debs') as looking_for,
  COALESCE(relationship_intention, 'short_term_only') as relationship_intention,
  COALESCE(bio, '') as bio,
  COALESCE(created_at, NOW()) as created_at,
  NOW() as updated_at
FROM users_backup;

-- Verify the simplified table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- Show the data in the simplified table
SELECT * FROM users;
