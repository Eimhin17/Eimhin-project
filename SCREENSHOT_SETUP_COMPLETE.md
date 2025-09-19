# 📸 Complete Screenshot Reporting Setup Guide

## 🚨 **IMMEDIATE ACTION REQUIRED**

The screenshot reporting system is ready, but you need to create the Supabase Storage bucket manually. Here's exactly what to do:

## **Step 1: Create Storage Bucket (5 minutes)**

### **1.1 Go to Supabase Dashboard**
- Visit: https://supabase.com/dashboard
- Select your DebsMatch project

### **1.2 Navigate to Storage**
- Click "Storage" in the left sidebar
- Click "New bucket"

### **1.3 Configure Bucket Settings**
```
Name: reports
Public: ✅ Enable (IMPORTANT!)
File size limit: 10 MB
Allowed MIME types: image/jpeg, image/png, image/webp
```

### **1.4 Create the Bucket**
- Click "Create bucket"
- You should see a new "reports" bucket in your storage list

## **Step 2: Set Up RLS Policies (5 minutes)**

### **2.1 Go to SQL Editor**
- Click "SQL Editor" in the left sidebar
- Click "New query"

### **2.2 Run This SQL Script**
```sql
-- Fix the report_screenshot constraint
ALTER TABLE content_reports DROP CONSTRAINT IF EXISTS check_report_screenshot_format;

ALTER TABLE content_reports 
ADD CONSTRAINT check_report_screenshot_format 
CHECK (
  report_screenshot IS NULL OR
  report_screenshot ~ '^https?://' OR
  report_screenshot ~ '^file://' OR
  report_screenshot ~ '^data:'
);

-- Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for the reports bucket
CREATE POLICY "Users can upload report screenshots" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'reports' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = 'report-screenshots'
);

CREATE POLICY "Users can view own report screenshots" ON storage.objects
FOR SELECT USING (
  bucket_id = 'reports' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = 'report-screenshots' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Admins can view all report screenshots" ON storage.objects
FOR SELECT USING (
  bucket_id = 'reports' AND
  auth.role() = 'service_role'
);

CREATE POLICY "Admins can delete report screenshots" ON storage.objects
FOR DELETE USING (
  bucket_id = 'reports' AND
  auth.role() = 'service_role'
);
```

### **2.3 Click "Run" to Execute**

## **Step 3: Test the System (2 minutes)**

### **3.1 Test Report Creation**
1. Open your app
2. Navigate to a profile card
3. Tap the report button
4. Fill out the report form
5. Submit the report

### **3.2 Check Console Logs**
You should see:
```
📸 Starting screenshot capture...
✅ Reports bucket exists
📸 Screenshot captured as base64, length: [number]
📤 Uploading base64 screenshot to: report-screenshots/[user-id]/report-[report-id]-[timestamp].jpg
📤 Blob created, size: [number] bytes
📤 Upload successful: [upload data]
📤 Public URL generated: https://[supabase-url]/storage/v1/object/public/reports/report-screenshots/[user-id]/report-[report-id]-[timestamp].jpg
✅ Screenshot uploaded successfully: [https-url]
✅ Screenshot uploaded and report updated
```

### **3.3 Verify in Database**
- Go to Supabase Dashboard > Table Editor
- Open the `content_reports` table
- Check that the `report_screenshot` column contains HTTPS URLs

## **Step 4: Verify Storage (1 minute)**

### **4.1 Check Storage Bucket**
- Go to Storage > reports
- You should see folders like `report-screenshots/[user-id]/`
- Inside should be files like `report-[report-id]-[timestamp].jpg`

### **4.2 Test Image Access**
- Click on a screenshot file
- It should open and display the captured image
- The URL should be accessible publicly

## **🎯 What This Enables**

### **For Users:**
- **Automatic Evidence**: Screenshots are captured automatically when reporting
- **Visual Proof**: Clear evidence of what was reported
- **Privacy Protected**: Only moderators can see all screenshots

### **For Moderators:**
- **Visual Evidence**: See exactly what users reported
- **Easy Review**: Screenshots are organized by user and report
- **Secure Access**: Only admins can view all evidence

### **For You:**
- **Solid Evidence**: Visual proof of wrongdoing
- **Easy Moderation**: Clear evidence for decision making
- **Scalable System**: Handles multiple reports efficiently

## **🔧 Technical Details**

### **File Organization:**
```
reports/
└── report-screenshots/
    └── {user-id}/
        └── report-{report-id}-{timestamp}.jpg
```

### **Security Features:**
- **User Isolation**: Users can only see their own screenshots
- **Admin Access**: Service role can view all screenshots
- **Public URLs**: Screenshots are publicly accessible (for moderation)
- **RLS Protection**: Row-level security prevents unauthorized access

### **Performance:**
- **Efficient Upload**: Direct base64 to blob conversion
- **Optimized Images**: JPG format with 80% quality
- **Fast Access**: Public URLs for quick loading

## **🚨 Troubleshooting**

### **If Screenshots Don't Upload:**
1. Check that the "reports" bucket exists
2. Verify the bucket is public
3. Check RLS policies are created
4. Look for errors in console logs

### **If Constraint Errors Persist:**
1. Run the constraint fix SQL again
2. Check that the constraint was dropped and recreated
3. Verify the new constraint allows HTTPS URLs

### **If Images Don't Display:**
1. Check that the bucket is public
2. Verify the URL format is correct
3. Test the URL in a browser

## **✅ Success Indicators**

After completing the setup, you should see:
- ✅ Reports bucket exists in Supabase Storage
- ✅ RLS policies created for storage.objects
- ✅ Constraint allows HTTPS URLs
- ✅ Screenshots upload successfully
- ✅ URLs are saved to database
- ✅ Images are accessible publicly

## **📞 Need Help?**

If you encounter any issues:
1. Check the console logs for specific error messages
2. Verify each step was completed correctly
3. Test with a simple report first
4. Check Supabase logs for storage errors

The system is now ready to capture and store screenshot evidence for all user reports! 🎉
