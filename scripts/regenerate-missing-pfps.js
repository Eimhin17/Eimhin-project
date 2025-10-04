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

async function regenerateMissingPFPs() {
  console.log('🔄 Starting PFP regeneration for users missing PFPs\n');

  try {
    // Get all users
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username')
      .limit(1000);

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
      return;
    }

    console.log(`📊 Found ${profiles.length} total users\n`);

    let missingCount = 0;
    let regeneratedCount = 0;
    let failedCount = 0;

    for (const profile of profiles) {
      // Check if user has a PFP
      const { data: pfpFiles, error: pfpError } = await supabase.storage
        .from('user-pfps')
        .list(profile.username, { limit: 1 });

      if (pfpError) {
        console.log(`⚠️  ${profile.username}: Error checking PFP - ${pfpError.message}`);
        continue;
      }

      // If PFP exists, skip
      if (pfpFiles && pfpFiles.length > 0) {
        continue;
      }

      missingCount++;
      console.log(`\n🔍 ${profile.username}: No PFP found, checking for photos...`);

      // Check if user has photos
      const { data: photoFiles, error: photosError } = await supabase.storage
        .from('user-photos')
        .list(profile.username, {
          limit: 10,
          sortBy: { column: 'created_at', order: 'asc' }
        });

      if (photosError) {
        console.log(`   ❌ Error checking photos - ${photosError.message}`);
        failedCount++;
        continue;
      }

      if (!photoFiles || photoFiles.length === 0) {
        console.log(`   ⚠️  No photos found, skipping`);
        failedCount++;
        continue;
      }

      console.log(`   ✅ Found ${photoFiles.length} photos`);

      // Get the first photo
      const firstPhoto = photoFiles.find(f =>
        f.name.toLowerCase().endsWith('.jpg') ||
        f.name.toLowerCase().endsWith('.jpeg') ||
        f.name.toLowerCase().endsWith('.png')
      );

      if (!firstPhoto) {
        console.log(`   ⚠️  No valid image files found`);
        failedCount++;
        continue;
      }

      console.log(`   📸 Using photo: ${firstPhoto.name}`);

      // Download the photo
      const photoPath = `${profile.username}/${firstPhoto.name}`;
      const { data: photoData, error: downloadError } = await supabase.storage
        .from('user-photos')
        .download(photoPath);

      if (downloadError) {
        console.log(`   ❌ Error downloading photo - ${downloadError.message}`);
        failedCount++;
        continue;
      }

      console.log(`   ✅ Downloaded photo (${photoData.size} bytes)`);

      // Upload to user-pfps bucket
      const timestamp = Date.now();
      const pfpPath = `${profile.username}/pfp-${timestamp}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('user-pfps')
        .upload(pfpPath, photoData, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (uploadError) {
        console.log(`   ❌ Error uploading PFP - ${uploadError.message}`);
        failedCount++;
        continue;
      }

      console.log(`   ✅ PFP created successfully at ${pfpPath}`);
      regeneratedCount++;
    }

    console.log('\n\n📊 REGENERATION SUMMARY');
    console.log('========================');
    console.log(`Total users: ${profiles.length}`);
    console.log(`Users missing PFPs: ${missingCount}`);
    console.log(`✅ Successfully regenerated: ${regeneratedCount}`);
    console.log(`❌ Failed to regenerate: ${failedCount}`);
    console.log(`📈 Success rate: ${missingCount > 0 ? ((regeneratedCount / missingCount) * 100).toFixed(1) : 0}%`);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

regenerateMissingPFPs();
