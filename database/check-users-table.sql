-- Check what columns actually exist in the users table
-- Run this in your Supabase SQL Editor to see the real table structure

-- Show all columns in the users table
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- Show the table structure
\d users;

-- Check if specific columns exist
SELECT 
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'is_active'
    ) THEN 'is_active EXISTS' ELSE 'is_active MISSING' END as is_active_status,
    
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'last_active'
    ) THEN 'last_active EXISTS' ELSE 'last_active MISSING' END as last_active_status,
    
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'discovery_source'
    ) THEN 'discovery_source EXISTS' ELSE 'discovery_source MISSING' END as discovery_source_status,
    
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'push_notifications_enabled'
    ) THEN 'push_notifications_enabled EXISTS' ELSE 'push_notifications_enabled MISSING' END as push_notifications_status;
