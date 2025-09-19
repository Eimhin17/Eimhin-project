-- =====================================================
-- REPORTS STORAGE BUCKET SETUP
-- =====================================================
-- This script sets up the storage bucket and RLS policies for report screenshots

-- Step 1: Create the reports bucket
-- Note: This needs to be done in the Supabase Dashboard as SQL doesn't support bucket creation
-- Go to Storage > New bucket > Name: "reports" > Public: true > Create

-- Step 2: Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Step 3: Create RLS policies for the reports bucket

-- Policy 1: Allow authenticated users to upload report screenshots
-- This ensures users can only upload to their own report-screenshots folder
CREATE POLICY "Users can upload report screenshots" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'reports' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = 'report-screenshots'
);

-- Policy 2: Allow users to view their own report screenshots
-- This ensures users can only see screenshots from their own reports
CREATE POLICY "Users can view own report screenshots" ON storage.objects
FOR SELECT USING (
  bucket_id = 'reports' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = 'report-screenshots' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy 3: Allow service role (admins) to view all report screenshots
-- This allows moderators to access all report evidence
CREATE POLICY "Admins can view all report screenshots" ON storage.objects
FOR SELECT USING (
  bucket_id = 'reports' AND
  auth.role() = 'service_role'
);

-- Policy 4: Allow service role to delete report screenshots
-- This allows cleanup of old or resolved reports
CREATE POLICY "Admins can delete report screenshots" ON storage.objects
FOR DELETE USING (
  bucket_id = 'reports' AND
  auth.role() = 'service_role'
);

-- Step 4: Create a function to get report screenshot URL
-- This makes it easier to retrieve screenshot URLs in your app
CREATE OR REPLACE FUNCTION get_report_screenshot_url(report_id UUID)
RETURNS TEXT AS $$
DECLARE
  screenshot_url TEXT;
BEGIN
  SELECT 
    CASE 
      WHEN cr.report_screenshot IS NOT NULL THEN
        (SELECT public_url FROM storage.objects 
         WHERE bucket_id = 'reports' 
         AND name = cr.report_screenshot)
      ELSE NULL
    END
  INTO screenshot_url
  FROM content_reports cr
  WHERE cr.id = report_id;
  
  RETURN screenshot_url;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_report_screenshot_url(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_report_screenshot_url(UUID) TO service_role;

-- Step 6: Create an index for better performance
CREATE INDEX IF NOT EXISTS idx_content_reports_screenshot 
ON content_reports(report_screenshot) 
WHERE report_screenshot IS NOT NULL;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check if the bucket exists (run this after creating the bucket in dashboard)
-- SELECT * FROM storage.buckets WHERE name = 'reports';

-- Check if policies are created correctly
-- SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';

-- Test the screenshot URL function (replace with actual report ID)
-- SELECT get_report_screenshot_url('your-report-id-here');

COMMENT ON FUNCTION get_report_screenshot_url(UUID) IS 'Returns the public URL for a report screenshot';
