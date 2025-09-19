const { createClient } = require('@supabase/supabase-js');

// Use your project's service role key for admin operations
const supabaseUrl = 'https://tagjfsxeutihwntpudsk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZ2pmc3hldXRpaHdudHB1ZHNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTkwNzgsImV4cCI6MjA3MDA5NTA3OH0.pvcZjPWdvIAbBXoZakS_kOlXfEbiUcvidXY1Oy2eFN0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupReportsBucket() {
  try {
    console.log('🔧 Setting up reports bucket and RLS policies...\n');

    // Step 1: Create the reports bucket
    console.log('1. Creating reports bucket...');
    const { data: bucketData, error: bucketError } = await supabase.storage
      .createBucket('reports', {
        public: false, // Private bucket
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        fileSizeLimit: 5242880, // 5MB limit
      });

    if (bucketError) {
      if (bucketError.message.includes('already exists')) {
        console.log('✅ Reports bucket already exists');
      } else {
        console.error('❌ Error creating bucket:', bucketError.message);
        return;
      }
    } else {
      console.log('✅ Reports bucket created successfully');
    }

    // Step 2: Create RLS policies
    console.log('\n2. Creating RLS policies...');
    
    // Policy 1: Allow authenticated users to upload screenshots
    const uploadPolicy = `
      CREATE POLICY "Users can upload report screenshots" ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (
        bucket_id = 'reports' AND
        auth.uid()::text = (storage.foldername(name))[1] AND
        (storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp')
      );
    `;

    // Policy 2: Allow users to view their own screenshots
    const viewPolicy = `
      CREATE POLICY "Users can view their own screenshots" ON storage.objects
      FOR SELECT TO authenticated
      USING (
        bucket_id = 'reports' AND
        auth.uid()::text = (storage.foldername(name))[1]
      );
    `;

    // Policy 3: Allow service role to access all screenshots (for moderation)
    const servicePolicy = `
      CREATE POLICY "Service role can access all screenshots" ON storage.objects
      FOR ALL TO service_role
      USING (bucket_id = 'reports');
    `;

    // Execute policies
    const policies = [
      { name: 'Upload Policy', sql: uploadPolicy },
      { name: 'View Policy', sql: viewPolicy },
      { name: 'Service Policy', sql: servicePolicy }
    ];

    for (const policy of policies) {
      try {
        const { error: policyError } = await supabase.rpc('exec_sql', {
          sql: policy.sql
        });

        if (policyError) {
          if (policyError.message.includes('already exists')) {
            console.log(`✅ ${policy.name} already exists`);
          } else {
            console.log(`⚠️ ${policy.name} error:`, policyError.message);
          }
        } else {
          console.log(`✅ ${policy.name} created successfully`);
        }
      } catch (err) {
        console.log(`⚠️ ${policy.name} error:`, err.message);
      }
    }

    // Step 3: Test the setup
    console.log('\n3. Testing the setup...');
    
    // Test upload
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
      console.log('\n📝 Manual setup required:');
      console.log('1. Go to Supabase Dashboard → Storage');
      console.log('2. Create a bucket named "reports"');
      console.log('3. Set it to private');
      console.log('4. Go to Authentication → Policies');
      console.log('5. Add the RLS policies manually');
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

    console.log('\n🎉 Setup complete!');
    console.log('\n📋 Next steps:');
    console.log('1. If upload test failed, set up the bucket manually in Supabase Dashboard');
    console.log('2. Make sure RLS policies are applied to "authenticated" users');
    console.log('3. Test screenshot upload in your app');

  } catch (error) {
    console.error('❌ Unexpected error during setup:', error);
  }
}

// Run the setup
setupReportsBucket();
