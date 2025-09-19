-- Rename report_screenshot column to extra_notes in content_reports table
-- This will store the user's detailed description instead of screenshot URLs

-- First, drop the existing constraint if it exists
ALTER TABLE content_reports DROP CONSTRAINT IF EXISTS check_report_screenshot_format;

-- Rename the column from report_screenshot to extra_notes
ALTER TABLE content_reports RENAME COLUMN report_screenshot TO extra_notes;

-- Add a new constraint for extra_notes (text field, no URL format required)
ALTER TABLE content_reports 
ADD CONSTRAINT check_extra_notes_length 
CHECK (extra_notes IS NULL OR LENGTH(extra_notes) <= 2000);

-- Add a comment to explain the column purpose
COMMENT ON COLUMN content_reports.extra_notes IS 'User-provided detailed description of the reported issue';
