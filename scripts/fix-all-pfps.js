const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://tagjfsxeutihwntpudsk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZ2pmc3hldXRpaHdudHB1ZHNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTkwNzgsImV4cCI6MjA3MDA5NTA3OH0.pvcZjPWdvIAbBXoZakS_kOlXfEbiUcvidXY1Oy2eFN0'
);

async function fixAllPfps() {
  try {
    console.log('🔧 Fixing all PFPs with correct photo URLs...');
    
    // Get all profiles with photos
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, first_name, photos');
    
    if (profilesError) {
      console.log('❌ Profiles error:', profilesError.message);
      return;
    }
    
    console.log(`📊 Found ${profiles?.length || 0} profiles`);
    
    // Get all existing PFPs
    const { data: existingPfps, error: pfpError } = await supabase
      .from('profile_pictures')
      .select('*');
    
    if (pfpError) {
      console.log('❌ PFP error:', pfpError.message);
      return;
    }
    
    console.log(`📊 Found ${existingPfps?.length || 0} existing PFPs`);
    
    // Update each PFP with the correct photo URL
    for (const pfp of existingPfps || []) {
      const profile = profiles?.find(p => p.id === pfp.user_id);
      
      if (!profile || !profile.photos || profile.photos.length === 0) {
        console.log(`⚠️ No photos found for user ${pfp.user_id}, skipping`);
        continue;
      }
      
      // Use the first photo as the PFP
      const firstPhotoUrl = profile.photos[0];
      
      console.log(`🔄 Updating PFP for user ${profile.first_name} (${pfp.user_id})`);
      console.log(`   Old URL: ${pfp.pfp_url.substring(0, 50)}...`);
      console.log(`   New URL: ${firstPhotoUrl.substring(0, 50)}...`);
      
      const { error: updateError } = await supabase
        .from('profile_pictures')
        .update({ pfp_url: firstPhotoUrl })
        .eq('id', pfp.id);
      
      if (updateError) {
        console.log(`❌ Error updating PFP for user ${pfp.user_id}:`, updateError.message);
      } else {
        console.log(`✅ Updated PFP for user ${profile.first_name}`);
      }
    }
    
    console.log('\\n🎉 All PFPs updated!');
    
    // Verify the updates
    console.log('\\n🔍 Verifying updates...');
    const { data: updatedPfps, error: verifyError } = await supabase
      .from('profile_pictures')
      .select('*');
    
    if (verifyError) {
      console.log('❌ Verify error:', verifyError.message);
    } else {
      console.log('✅ Final PFP data:');
      updatedPfps?.forEach((pfp, index) => {
        console.log(`   ${index + 1}. User: ${pfp.user_id}`);
        console.log(`      PFP URL: ${pfp.pfp_url.substring(0, 60)}...`);
      });
    }
    
  } catch (err) {
    console.log('❌ Error:', err.message);
  }
}

fixAllPfps();
