const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://tagjfsxeutihwntpudsk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZ2pmc3hldXRpaHdudHB1ZHNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTkwNzgsImV4cCI6MjA3MDA5NTA3OH0.pvcZjPWdvIAbBXoZakS_kOlXfEbiUcvidXY1Oy2eFN0'
);

async function forceRefresh() {
  try {
    console.log('🔄 Force refreshing PFP data...');
    
    // Delete all existing PFPs
    const { error: deleteError } = await supabase
      .from('profile_pictures')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (deleteError) {
      console.log('❌ Delete error:', deleteError.message);
      return;
    }
    
    console.log('✅ All PFPs deleted');
    
    // Get all profiles with photos
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, first_name, photos');
    
    if (profilesError) {
      console.log('❌ Profiles error:', profilesError.message);
      return;
    }
    
    console.log(`📊 Found ${profiles?.length || 0} profiles`);
    
    // Recreate PFPs
    for (const profile of profiles || []) {
      if (!profile.photos || profile.photos.length === 0) {
        console.log(`⚠️ No photos for ${profile.first_name}, skipping`);
        continue;
      }
      
      const { error: insertError } = await supabase
        .from('profile_pictures')
        .insert({
          user_id: profile.id,
          pfp_url: profile.photos[0]
        });
      
      if (insertError) {
        console.log(`❌ Error creating PFP for ${profile.first_name}:`, insertError.message);
      } else {
        console.log(`✅ Created PFP for ${profile.first_name}`);
      }
    }
    
    console.log('\n🎉 PFP refresh complete!');
    
    // Verify the results
    const { data: newPfps, error: verifyError } = await supabase
      .from('profile_pictures')
      .select('*');
    
    if (verifyError) {
      console.log('❌ Verify error:', verifyError.message);
    } else {
      console.log('\n✅ Final PFP data:');
      newPfps?.forEach((pfp, index) => {
        console.log(`   ${index + 1}. User: ${pfp.user_id}`);
        console.log(`      PFP URL: ${pfp.pfp_url.substring(0, 60)}...`);
      });
    }
    
  } catch (err) {
    console.log('❌ Error:', err.message);
  }
}

forceRefresh();
