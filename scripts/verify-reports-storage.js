const { createClient } = require('@supabase/supabase-js');

// Use your project's anon key for testing
const supabaseUrl = 'https://tagjfsxeutihwntpudsk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZ2pmc3hldXRpaHdudHB1ZHNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTkwNzgsImV4cCI6MjA3MDA5NTA3OH0.YourAnonKeyHere';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyReportsStorage() {
  try {
    console.log('🔍 Verifying reports storage setup...\n');

    // 1. Check if reports bucket exists
    console.log('1. Checking if reports bucket exists...');
    const { data: buckets, error: bucketsError } = await supabase.storage
      .listBuckets();

    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError.message);
      return;
    }

    const reportsBucket = buckets?.find(bucket => bucket.name === 'reports');
    
    if (reportsBucket) {
      console.log('✅ Reports bucket exists');
      console.log('   - Name:', reportsBucket.name);
      console.log('   - Public:', reportsBucket.public);
      console.log('   - Created:', reportsBucket.created_at);
    } else {
      console.log('❌ Reports bucket not found');
      console.log('   Please create the bucket in Supabase Dashboard:');
      console.log('   1. Go to Storage > New bucket');
      console.log('   2. Name: "reports"');
      console.log('   3. Public: true');
      console.log('   4. File size limit: 10 MB');
      console.log('   5. Allowed MIME types: image/jpeg, image/png, image/webp');
      return;
    }

    // 2. Test file upload (small test file)
    console.log('\n2. Testing file upload...');
    const testContent = 'test-screenshot-data';
    const testFileName = `test-${Date.now()}.txt`;
    const testFilePath = `report-screenshots/test-user/${testFileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('reports')
      .upload(testFilePath, testContent, {
        contentType: 'text/plain',
        upsert: false,
      });

    if (uploadError) {
      console.error('❌ Upload test failed:', uploadError.message);
      console.log('   This might be due to RLS policies not being set up correctly');
    } else {
      console.log('✅ Upload test successful');
      console.log('   - File path:', uploadData.path);
      
      // Clean up test file
      const { error: deleteError } = await supabase.storage
        .from('reports')
        .remove([testFilePath]);
      
      if (deleteError) {
        console.log('⚠️ Could not clean up test file:', deleteError.message);
      } else {
        console.log('✅ Test file cleaned up');
      }
    }

    // 3. Check content_reports table
    console.log('\n3. Checking content_reports table...');
    const { data: reports, error: reportsError } = await supabase
      .from('content_reports')
      .select('id, report_screenshot')
      .limit(1);

    if (reportsError) {
      console.error('❌ Error checking content_reports table:', reportsError.message);
    } else {
      console.log('✅ content_reports table accessible');
      console.log('   - Sample records:', reports?.length || 0);
    }

    // 4. Test screenshot URL function
    console.log('\n4. Testing screenshot URL function...');
    const { data: functionTest, error: functionError } = await supabase
      .rpc('get_report_screenshot_url', { report_id: '00000000-0000-0000-0000-000000000000' });

    if (functionError) {
      console.log('⚠️ Screenshot URL function not found or has issues:', functionError.message);
      console.log('   Make sure to run the SQL script in Supabase SQL Editor');
    } else {
      console.log('✅ Screenshot URL function working');
    }

    console.log('\n🎉 Storage verification complete!');
    console.log('\nNext steps:');
    console.log('1. If bucket creation failed, create it manually in Supabase Dashboard');
    console.log('2. Run the SQL script in Supabase SQL Editor to set up RLS policies');
    console.log('3. Test the reporting system in your app');

  } catch (error) {
    console.error('❌ Unexpected error during verification:', error);
  }
}

// Run the verification
verifyReportsStorage();
