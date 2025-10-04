const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tagjfsxeutihwntpudsk.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY environment variable.');
  console.error('   Please set SUPABASE_SERVICE_ROLE_KEY before running this script.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function diagnosePFPSystem() {
  console.log('🔍 Starting PFP System Diagnosis\n');

  try {
    // 1. Check how many users exist
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username')
      .limit(20);

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
      return;
    }

    console.log(`📊 Found ${profiles.length} profiles to check\n`);

    let successCount = 0;
    let failureCount = 0;
    let noPfpCount = 0;

    // 2. Check each user's PFP
    for (const profile of profiles) {
      console.log(`\n---\n👤 Checking user: ${profile.username} (${profile.id})`);

      // Check if PFP folder exists
      const { data: files, error: listError } = await supabase.storage
        .from('user-pfps')
        .list(profile.username, {
          limit: 10,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (listError) {
        console.log('❌ Error listing PFP folder:', listError.message);
        failureCount++;
        continue;
      }

      if (!files || files.length === 0) {
        console.log('⚠️  No PFP found in storage');
        noPfpCount++;

        // Check if they have photos in user-photos
        const { data: photos, error: photosError } = await supabase.storage
          .from('user-photos')
          .list(profile.username, { limit: 1 });

        if (!photosError && photos && photos.length > 0) {
          console.log('📸 User has photos but no PFP - PFP creation may have failed');
        } else {
          console.log('📸 User has no photos in user-photos either');
        }
        continue;
      }

      console.log(`✅ Found ${files.length} PFP file(s):`, files.map(f => f.name));

      // Try to create signed URL for the most recent PFP
      const latestPFP = files[0];
      const filePath = `${profile.username}/${latestPFP.name}`;

      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('user-pfps')
        .createSignedUrl(filePath, 3600);

      if (signedUrlError) {
        console.log('❌ Error creating signed URL:', signedUrlError.message);
        failureCount++;
      } else {
        console.log('✅ Signed URL created successfully');
        console.log('🔗 URL:', signedUrlData.signedUrl.substring(0, 100) + '...');
        successCount++;
      }
    }

    console.log('\n\n📊 SUMMARY');
    console.log('==========');
    console.log(`Total profiles checked: ${profiles.length}`);
    console.log(`✅ PFPs working: ${successCount}`);
    console.log(`⚠️  No PFP found: ${noPfpCount}`);
    console.log(`❌ Errors: ${failureCount}`);
    console.log(`\n📈 Success rate: ${((successCount / profiles.length) * 100).toFixed(1)}%`);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

diagnosePFPSystem();
