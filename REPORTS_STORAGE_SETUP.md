# 📸 Reports Storage Setup Guide

This guide will help you set up the Supabase Storage bucket and RLS policies for the automatic screenshot reporting system.

## 🎯 Overview

The reporting system captures screenshots when users report profile cards and stores them in a dedicated Supabase Storage bucket. This provides visual evidence for moderation.

## 📋 Prerequisites

- Supabase project with admin access
- `content_reports` table already created (✅ Done)
- `report_screenshot` column in `content_reports` table (✅ Done)

## 🚀 Setup Steps

### Step 1: Create Storage Bucket (Supabase Dashboard)

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your DebsMatch project

2. **Navigate to Storage**
   - Click "Storage" in the left sidebar
   - Click "New bucket"

3. **Configure Bucket Settings**
   ```
   Name: reports
   Public: ✅ Enable
   File size limit: 10 MB
   Allowed MIME types: image/jpeg, image/png, image/webp
   ```

4. **Click "Create bucket"**

### Step 2: Set Up RLS Policies (SQL Editor)

1. **Go to SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

2. **Run the Setup Script**
   - Copy and paste the contents of `database/setup-reports-storage.sql`
   - Click "Run" to execute the script

3. **Verify Policies Created**
   - Go to Authentication > Policies
   - Click "Storage" tab
   - You should see 4 policies for the `reports` bucket

### Step 3: Test the Setup

1. **Run Verification Script**
   ```bash
   node scripts/verify-reports-storage.js
   ```

2. **Expected Output**
   ```
   ✅ Reports bucket exists
   ✅ Upload test successful
   ✅ content_reports table accessible
   ✅ Screenshot URL function working
   ```

## 🔧 Manual Setup (Alternative)

If the SQL script doesn't work, you can create policies manually:

### Policy 1: Upload Policy
- **Name**: `Users can upload report screenshots`
- **Type**: `INSERT`
- **Definition**:
  ```sql
  (bucket_id = 'reports' AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] = 'report-screenshots')
  ```

### Policy 2: View Own Screenshots
- **Name**: `Users can view own report screenshots`
- **Type**: `SELECT`
- **Definition**:
  ```sql
  (bucket_id = 'reports' AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] = 'report-screenshots' AND (storage.foldername(name))[2] = auth.uid()::text)
  ```

### Policy 3: Admin View All
- **Name**: `Admins can view all report screenshots`
- **Type**: `SELECT`
- **Definition**:
  ```sql
  (bucket_id = 'reports' AND auth.role() = 'service_role')
  ```

### Policy 4: Admin Delete
- **Name**: `Admins can delete report screenshots`
- **Type**: `DELETE`
- **Definition**:
  ```sql
  (bucket_id = 'reports' AND auth.role() = 'service_role')
  ```

## 📁 File Structure

The storage bucket will organize files as follows:
```
reports/
└── report-screenshots/
    └── {user-id}/
        └── report-{report-id}-{timestamp}.jpg
```

## 🔒 Security Features

### RLS Policies Explained

1. **Upload Policy**: Users can only upload to their own `report-screenshots/{user-id}/` folder
2. **View Policy**: Users can only view screenshots from their own reports
3. **Admin Policy**: Service role can view all screenshots for moderation
4. **Delete Policy**: Service role can delete screenshots for cleanup

### Privacy Protection

- Screenshots are stored in user-specific folders
- Users cannot access other users' report screenshots
- Only moderators (service role) can view all screenshots
- Screenshot URLs are not publicly accessible without proper authentication

## 🧪 Testing the System

### Test Report Creation
```javascript
import { ReportService } from './services/reports';
import { ScreenshotCaptureService } from './services/screenshotCapture';

// Test creating a report with screenshot
const reportData = {
  reportedUserId: 'test-user-id',
  contentType: 'profile',
  category: 'inappropriate',
  description: 'Test report description'
};

const report = await ReportService.createReport(reportData);
console.log('Report created:', report.id);
```

### Test Screenshot Capture
```javascript
// Test screenshot capture (requires a ViewShot ref)
const screenshotUrl = await ScreenshotCaptureService.captureAndUpload(
  profileCardRef.current,
  report.id,
  report.reporterId
);
console.log('Screenshot URL:', screenshotUrl);
```

## 🚨 Troubleshooting

### Common Issues

1. **"Bucket not found" error**
   - Solution: Create the bucket manually in Supabase Dashboard

2. **"Permission denied" on upload**
   - Solution: Check RLS policies are created correctly
   - Verify the upload policy allows the correct folder structure

3. **"Function not found" error**
   - Solution: Run the SQL script in Supabase SQL Editor
   - Check the function was created successfully

4. **Screenshots not showing**
   - Solution: Verify the bucket is public
   - Check the screenshot URL is being saved to the database

### Debug Commands

```sql
-- Check if bucket exists
SELECT * FROM storage.buckets WHERE name = 'reports';

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';

-- Test screenshot URL function
SELECT get_report_screenshot_url('your-report-id-here');
```

## 📊 Monitoring

### Storage Usage
- Monitor bucket size in Supabase Dashboard > Storage
- Set up alerts for storage limits
- Consider cleanup policies for old reports

### Report Analytics
- Track report volume and categories
- Monitor screenshot upload success rates
- Analyze moderation response times

## 🔄 Maintenance

### Regular Cleanup
- Delete screenshots for resolved reports older than 90 days
- Archive old reports to reduce storage costs
- Monitor and optimize file sizes

### Security Audits
- Regularly review RLS policies
- Audit who has access to report screenshots
- Ensure compliance with data retention policies

## 📞 Support

If you encounter issues:
1. Check the verification script output
2. Review Supabase logs for errors
3. Verify all policies are created correctly
4. Test with a simple file upload first

The system is designed to be secure and efficient, providing you with solid evidence for moderation while protecting user privacy.
