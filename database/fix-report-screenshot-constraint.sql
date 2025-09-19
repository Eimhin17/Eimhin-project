-- Fix report_screenshot constraint to allow proper URLs
-- This script checks and fixes the constraint that's preventing screenshot URLs from being saved

-- First, let's see what constraints exist on the report_screenshot column
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'content_reports'::regclass 
AND conname LIKE '%screenshot%';

-- Drop the existing constraint if it exists
ALTER TABLE content_reports DROP CONSTRAINT IF EXISTS check_report_screenshot_format;

-- Create a new constraint that allows proper URLs
-- This allows:
-- 1. NULL values (no screenshot)
-- 2. URLs starting with http:// or https:// (Supabase Storage URLs)
-- 3. URLs starting with file:// (local file URLs)
-- 4. URLs starting with data: (base64 data URLs as fallback)
ALTER TABLE content_reports 
ADD CONSTRAINT check_report_screenshot_format 
CHECK (
  report_screenshot IS NULL OR
  report_screenshot ~ '^https?://' OR
  report_screenshot ~ '^file://' OR
  report_screenshot ~ '^data:'
);

-- Add a comment to document the constraint
COMMENT ON CONSTRAINT check_report_screenshot_format ON content_reports 
IS 'Ensures report_screenshot contains a valid URL format (http/https, file, or data URL)';

-- Verify the constraint was created
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'content_reports'::regclass 
AND conname = 'check_report_screenshot_format';
