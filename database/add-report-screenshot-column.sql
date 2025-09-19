-- Add report_screenshot column to content_reports table
-- This will store the URL/path to the screenshot image

ALTER TABLE content_reports 
ADD COLUMN report_screenshot TEXT;

-- Add comment to document the column
COMMENT ON COLUMN content_reports.report_screenshot IS 'URL or path to the screenshot image attached to the report';
