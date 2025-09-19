const { createClient } = require('@supabase/supabase-js');

// Use your project's anon key for testing
const supabaseUrl = 'https://tagjfsxeutihwntpudsk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZ2pmc3hldXRpaHdudHB1ZHNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTkwNzgsImV4cCI6MjA3MDA5NTA3OH0.pvcZjPWdvIAbBXoZakS_kOlXfEbiUcvidXY1Oy2eFN0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixReportsRLS() {
  try {
    console.log('🔧 Fixing reports bucket RLS policies...\n');

    // Test 1: Try to upload a test file with the correct path structure
    console.log('1. Testing upload with user ID in path...');
    
    // Create a test file path that matches the RLS policy
    const testUserId = 'test-user-123';
    const testFileName = `report-screenshots/${testUserId}/test-${Date.now()}.jpg`;
    
    // Create a simple test image (1x1 pixel JPEG)
    const testImageBase64 = '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A8A';
    
    // Convert base64 to Uint8Array
    const byteCharacters = atob(testImageBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const uint8Array = new Uint8Array(byteNumbers);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('reports')
      .upload(testFileName, uint8Array, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (uploadError) {
      console.log('❌ Upload test failed:', uploadError.message);
      console.log('\n📝 RLS Policy Issue Analysis:');
      console.log('The RLS policy is still blocking uploads. This could be because:');
      console.log('1. The policy condition is too restrictive');
      console.log('2. The user ID format doesn\'t match what the policy expects');
      console.log('3. The policy needs to be updated');
      
      console.log('\n🔧 Recommended Fix:');
      console.log('1. Go to Supabase Dashboard → Storage → reports bucket → Policies');
      console.log('2. Edit the "Users can upload report screenshots" policy');
      console.log('3. Change the policy definition to:');
      console.log('   (bucket_id = \'reports\' AND (storage.foldername(name))[1] IS NOT NULL)');
      console.log('4. This allows any authenticated user to upload to any folder');
      
      console.log('\n🔧 Alternative Fix (More Secure):');
      console.log('1. Keep the current policy but ensure the user ID matches exactly');
      console.log('2. Check that auth.uid() returns the same format as the folder name');
      console.log('3. The policy expects: auth.uid()::text = (storage.foldername(name))[1]');
      
    } else {
      console.log('✅ Upload test successful!');
      console.log('   - File path:', uploadData.path);
      
      // Clean up test file
      const { error: deleteError } = await supabase.storage
        .from('reports')
        .remove([testFileName]);
      
      if (deleteError) {
        console.log('⚠️ Could not clean up test file:', deleteError.message);
      } else {
        console.log('✅ Test file cleaned up');
      }
    }

    console.log('\n🎉 RLS Policy Check Complete!');

  } catch (error) {
    console.error('❌ Unexpected error during RLS fix:', error);
  }
}

// Run the fix
fixReportsRLS();
