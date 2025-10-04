const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://tagjfsxeutihwntpudsk.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY environment variable.');
  console.error('   Please set SUPABASE_SERVICE_ROLE_KEY before running this script.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createReportsBucket() {
  try {
    console.log('🪣 Creating reports bucket...');
    
    // Check if bucket already exists
    const { data: buckets, error: listError } = await supabase.storage
      .listBuckets();

    if (listError) {
      console.error('❌ Error listing buckets:', listError);
      return;
    }

    const reportsBucket = buckets?.find(bucket => bucket.name === 'reports');
    
    if (reportsBucket) {
      console.log('✅ Reports bucket already exists');
      return;
    }

    // Create the bucket
    const { data, error } = await supabase.storage.createBucket('reports', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      fileSizeLimit: 10 * 1024 * 1024, // 10MB limit
    });

    if (error) {
      console.error('❌ Error creating reports bucket:', error);
      return;
    }

    console.log('✅ Reports bucket created successfully:', data);

    // Set up RLS policies for the bucket
    console.log('🔒 Setting up RLS policies...');
    
    // Allow authenticated users to upload reports
    const { error: uploadPolicyError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Users can upload report screenshots" ON storage.objects
        FOR INSERT WITH CHECK (
          bucket_id = 'reports' AND
          auth.role() = 'authenticated' AND
          (storage.foldername(name))[1] = 'report-screenshots'
        );
      `
    });

    if (uploadPolicyError) {
      console.log('⚠️ Upload policy error (may already exist):', uploadPolicyError.message);
    }

    // Allow users to view their own report screenshots
    const { error: viewPolicyError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Users can view own report screenshots" ON storage.objects
        FOR SELECT USING (
          bucket_id = 'reports' AND
          auth.role() = 'authenticated' AND
          (storage.foldername(name))[1] = 'report-screenshots' AND
          (storage.foldername(name))[2] = auth.uid()::text
        );
      `
    });

    if (viewPolicyError) {
      console.log('⚠️ View policy error (may already exist):', viewPolicyError.message);
    }

    console.log('✅ Reports bucket setup complete!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the script
createReportsBucket();
