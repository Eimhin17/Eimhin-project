const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://tagjfsxeutihwntpudsk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZ2pmc3hldXRpaHdudHB1ZHNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTkwNzgsImV4cCI6MjA3MDA5NTA3OH0.pvcZjPWdvIAbBXoZakS_kOlXfEbiUcvidXY1Oy2eFN0'
);

async function finalFix() {
  try {
    console.log('🔧 Final PFP fix...');
    
    // Get current PFPs
    const { data: pfps, error: pfpError } = await supabase
      .from('profile_pictures')
      .select('*');
    
    if (pfpError) {
      console.log('❌ PFP error:', pfpError.message);
      return;
    }
    
    console.log(`📊 Found ${pfps?.length || 0} PFPs`);
    
    // Get profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, first_name, photos');
    
    if (profilesError) {
      console.log('❌ Profiles error:', profilesError.message);
      return;
    }
    
    console.log(`📊 Found ${profiles?.length || 0} profiles`);
    
    // Update each PFP with correct URL
    for (const pfp of pfps || []) {
      const profile = profiles?.find(p => p.id === pfp.user_id);
      
      if (!profile || !profile.photos || profile.photos.length === 0) {
        console.log(`⚠️ No photos for user ${pfp.user_id}`);
        continue;
      }
      
      const correctUrl = profile.photos[0];
      
      console.log(`🔄 Updating PFP for ${profile.first_name}...`);
      console.log(`   Old: ${pfp.pfp_url.substring(0, 50)}...`);
      console.log(`   New: ${correctUrl.substring(0, 50)}...`);
      
      const { error: updateError } = await supabase
        .from('profile_pictures')
        .update({ pfp_url: correctUrl })
        .eq('id', pfp.id);
      
      if (updateError) {
        console.log(`❌ Update error:`, updateError.message);
      } else {
        console.log(`✅ Updated PFP for ${profile.first_name}`);
      }
    }
    
    console.log('\n🎉 PFP fix complete!');
    
    // Verify final state
    const { data: finalPfps, error: verifyError } = await supabase
      .from('profile_pictures')
      .select('*');
    
    if (verifyError) {
      console.log('❌ Verify error:', verifyError.message);
    } else {
      console.log('\n✅ Final PFP state:');
      finalPfps?.forEach((pfp, index) => {
        console.log(`   ${index + 1}. User: ${pfp.user_id}`);
        console.log(`      URL: ${pfp.pfp_url.substring(0, 60)}...`);
      });
    }
    
  } catch (err) {
    console.log('❌ Error:', err.message);
  }
}

finalFix();
