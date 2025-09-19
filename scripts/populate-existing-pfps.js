const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://tagjfsxeutihwntpudsk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZ2pmc3hldXRpaHdudHB1ZHNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTkwNzgsImV4cCI6MjA3MDA5NTA3OH0.pvcZjPWdvIAbBXoZakS_kOlXfEbiUcvidXY1Oy2eFN0'
);

async function populateExistingPfps() {
  try {
    console.log('🔄 Populating existing PFPs...');
    
    // Get all profiles with photos
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, photos')
      .not('photos', 'is', null);
    
    if (profilesError) {
      console.log('❌ Error fetching profiles:', profilesError.message);
      return;
    }
    
    console.log(`📊 Found ${profiles?.length || 0} profiles with photos`);
    
    if (!profiles || profiles.length === 0) {
      console.log('⚠️ No profiles with photos found');
      return;
    }
    
    // Check which profiles already have PFPs
    const { data: existingPfps, error: pfpError } = await supabase
      .from('profile_pictures')
      .select('user_id');
    
    if (pfpError) {
      console.log('❌ Error fetching existing PFPs:', pfpError.message);
      return;
    }
    
    const existingUserIds = new Set(existingPfps?.map(pfp => pfp.user_id) || []);
    console.log(`📊 Found ${existingUserIds.size} existing PFPs`);
    
    // Create PFPs for profiles that don't have them
    let created = 0;
    let skipped = 0;
    
    for (const profile of profiles) {
      if (existingUserIds.has(profile.id)) {
        skipped++;
        continue;
      }
      
      // Get the first photo URL
      const photos = Array.isArray(profile.photos) ? profile.photos : [];
      if (photos.length === 0) {
        skipped++;
        continue;
      }
      
      const firstPhotoUrl = photos[0];
      if (!firstPhotoUrl) {
        skipped++;
        continue;
      }
      
      // Create PFP entry
      const { error: insertError } = await supabase
        .from('profile_pictures')
        .insert({
          user_id: profile.id,
          pfp_url: firstPhotoUrl
        });
      
      if (insertError) {
        console.log(`❌ Error creating PFP for user ${profile.id}:`, insertError.message);
      } else {
        created++;
        console.log(`✅ Created PFP for user ${profile.id}`);
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   Created: ${created} PFPs`);
    console.log(`   Skipped: ${skipped} profiles`);
    console.log(`   Total processed: ${profiles.length} profiles`);
    
  } catch (err) {
    console.log('❌ Error:', err.message);
  }
}

populateExistingPfps();
