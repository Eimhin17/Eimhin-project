const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://tagjfsxeutihwntpudsk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZ2pmc3hldXRpaHdudHB1ZHNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTkwNzgsImV4cCI6MjA3MDA5NTA3OH0.pvcZjPWdvIAbBXoZakS_kOlXfEbiUcvidXY1Oy2eFN0'
);

async function testPFPAfterTableCreation() {
  try {
    console.log('🧪 Testing PFP system after table creation...');
    
    // Test if table is accessible
    const { data: tableTest, error: tableError } = await supabase
      .from('profile_pictures')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.log('❌ Table still not accessible:', tableError.message);
      console.log('💡 Please run the SQL script in Supabase dashboard first');
      return;
    }
    
    console.log('✅ profile_pictures table is accessible');
    
    // Find users with photos
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, photos')
      .not('photos', 'is', null)
      .limit(5);
    
    if (profilesError) {
      console.log('❌ Error fetching profiles:', profilesError.message);
      return;
    }
    
    console.log(`📊 Found ${profiles?.length || 0} profiles with photos`);
    
    if (!profiles || profiles.length === 0) {
      console.log('⚠️ No profiles with photos found');
      return;
    }
    
    // Test PFP creation for each profile
    for (const profile of profiles) {
      if (profile.photos && profile.photos.length > 0) {
        const mainPhoto = profile.photos[0];
        const pfpUrl = `${mainPhoto}?circular=true&w=200&h=200&fit=crop&crop=center`;
        
        console.log(`🔄 Creating PFP for user ${profile.id}...`);
        
        const { data: pfpData, error: pfpError } = await supabase
          .from('profile_pictures')
          .upsert({
            user_id: profile.id,
            pfp_url: pfpUrl,
            original_photo_url: mainPhoto
          }, { onConflict: 'user_id' })
          .select();
        
        if (pfpError) {
          console.log(`❌ Error creating PFP for ${profile.id}:`, pfpError.message);
        } else {
          console.log(`✅ PFP created for ${profile.id}:`, pfpData[0]);
        }
      }
    }
    
    // Check final count
    const { data: finalCount, error: countError } = await supabase
      .from('profile_pictures')
      .select('*', { count: 'exact' });
    
    if (countError) {
      console.log('❌ Error getting final count:', countError.message);
    } else {
      console.log(`📊 Total PFPs in database: ${finalCount?.length || 0}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testPFPAfterTableCreation();
