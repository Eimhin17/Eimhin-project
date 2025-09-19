const { createClient } = require('@supabase/supabase-js');

// Use your project's anon key for testing
const supabaseUrl = 'https://tagjfsxeutihwntpudsk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZ2pmc3hldXRpaHdudHB1ZHNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTkwNzgsImV4cCI6MjA3MDA5NTA3OH0.pvcZjPWdvIAbBXoZakS_kOlXfEbiUcvidXY1Oy2eFN0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testScreenshotUpload() {
  try {
    console.log('🧪 Testing screenshot upload to reports bucket...\n');

    // Test 1: Check if bucket is accessible
    console.log('1. Checking reports bucket access...');
    const { data: files, error: listError } = await supabase.storage
      .from('reports')
      .list('report-screenshots', {
        limit: 1
      });

    if (listError) {
      console.error('❌ Error accessing reports bucket:', listError.message);
      console.log('📝 Make sure the reports bucket exists and RLS policies are correct');
      return;
    }

    console.log('✅ Reports bucket is accessible');

    // Test 2: Try to upload a test image file
    console.log('\n2. Testing file upload...');
    // Create a simple base64 image (1x1 pixel JPEG)
    const testImageBase64 = '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A8A';
    const testFileName = `test-${Date.now()}.jpg`;
    const testFilePath = `report-screenshots/test-user/${testFileName}`;

    // Convert base64 to blob
    const byteCharacters = atob(testImageBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/jpeg' });

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('reports')
      .upload(testFilePath, blob, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (uploadError) {
      console.error('❌ Upload test failed:', uploadError.message);
      console.log('   This indicates an RLS policy issue');
      
      // Check if it's an authentication issue
      if (uploadError.message.includes('JWT')) {
        console.log('   💡 This might be an authentication issue');
      }
      
      // Check if it's a policy issue
      if (uploadError.message.includes('policy') || uploadError.message.includes('RLS')) {
        console.log('   💡 This is likely an RLS policy issue');
        console.log('   💡 The policies might need to be more specific');
      }
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

    // Test 3: Check RLS policies
    console.log('\n3. Checking RLS policies...');
    const { data: policies, error: policiesError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
              schemaname,
              tablename,
              policyname,
              permissive,
              roles,
              cmd,
              qual,
              with_check
          FROM pg_policies 
          WHERE tablename = 'objects' 
          AND schemaname = 'storage'
          AND policyname LIKE '%screenshot%';
        `
      });

    if (policiesError) {
      console.log('⚠️ Could not check policies (may not have exec_sql function):', policiesError.message);
    } else {
      console.log('📋 Screenshot-related policies:', policies);
    }

    console.log('\n🎉 Test complete!');
    
    if (uploadError) {
      console.log('\n📝 Next steps:');
      console.log('1. Check the RLS policies in Supabase Dashboard');
      console.log('2. Make sure policies are applied to "authenticated" users, not "public"');
      console.log('3. Verify the policy conditions are correct');
    } else {
      console.log('\n✅ Screenshot upload should work in your app now!');
    }

  } catch (error) {
    console.error('❌ Unexpected error during test:', error);
  }
}

// Run the test
testScreenshotUpload();
