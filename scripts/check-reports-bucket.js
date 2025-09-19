const { createClient } = require('@supabase/supabase-js');

// Use your project's anon key for testing
const supabaseUrl = 'https://tagjfsxeutihwntpudsk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZ2pmc3hldXRpaHdudHB1ZHNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTkwNzgsImV4cCI6MjA3MDA5NTA3OH0.pvcZjPWdvIAbBXoZakS_kOlXfEbiUcvidXY1Oy2eFN0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkReportsBucket() {
  try {
    console.log('🔍 Checking reports bucket status...\n');

    // Check if bucket exists
    console.log('1. Checking if reports bucket exists...');
    const { data: buckets, error: bucketsError } = await supabase.storage
      .listBuckets();

    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError.message);
      return;
    }

    const reportsBucket = buckets?.find(bucket => bucket.name === 'reports');
    
    if (!reportsBucket) {
      console.log('❌ Reports bucket not found');
      console.log('\n📝 Manual setup required:');
      console.log('1. Go to Supabase Dashboard → Storage');
      console.log('2. Click "New bucket"');
      console.log('3. Name: "reports"');
      console.log('4. Set to Private');
      console.log('5. Click "Create bucket"');
      return;
    }

    console.log('✅ Reports bucket found:', reportsBucket.name);
    console.log('   - Public:', reportsBucket.public);
    console.log('   - Created:', reportsBucket.created_at);

    // Test upload
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
      console.log('❌ Upload test failed:', uploadError.message);
      console.log('\n📝 RLS Policy Issue:');
      console.log('1. Go to Supabase Dashboard → Storage → reports bucket');
      console.log('2. Click "Policies" tab');
      console.log('3. Make sure you have these policies:');
      console.log('   - "Users can upload report screenshots" (for authenticated users)');
      console.log('   - "Users can view their own screenshots" (for authenticated users)');
      console.log('4. Make sure Target Roles is set to "authenticated", not "public"');
    } else {
      console.log('✅ Upload test successful!');
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

    console.log('\n🎉 Check complete!');

  } catch (error) {
    console.error('❌ Unexpected error during check:', error);
  }
}

// Run the check
checkReportsBucket();
