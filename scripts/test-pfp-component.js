const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://tagjfsxeutihwntpudsk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZ2pmc3hldXRpaHdudHB1ZHNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTkwNzgsImV4cCI6MjA3MDA5NTA3OH0.pvcZjPWdvIAbBXoZakS_kOlXfEbiUcvidXY1Oy2eFN0'
);

async function testPfpComponent() {
  try {
    console.log('🔍 Testing PFP component logic...');
    
    // Simulate what the CircularProfilePicture component does
    const userId = 'e8512772-53a8-4511-b5f2-fbbe6f7a2573';
    
    console.log(`Testing with user ID: ${userId}`);
    
    // Step 1: Try to get PFP from profile_pictures table
    const { data: pfpData, error: pfpError } = await supabase
      .from('profile_pictures')
      .select('pfp_url')
      .eq('user_id', userId)
      .single();
    
    if (pfpError) {
      console.log('❌ PFP fetch error:', pfpError.message);
      console.log('📋 Component will show fallback (user initial)');
      return;
    }
    
    console.log('✅ PFP found in database');
    console.log('📊 PFP URL:', pfpData.pfp_url);
    
    // Check if the URL is valid
    if (pfpData.pfp_url.startsWith('http')) {
      console.log('✅ Valid HTTP URL - should work in app');
    } else if (pfpData.pfp_url.startsWith('file://')) {
      console.log('⚠️ Local file URL - might not work in app');
      console.log('📋 This could be why you see the fallback');
    } else {
      console.log('❓ Unknown URL format:', pfpData.pfp_url);
    }
    
    // Step 2: If no PFP, try to get from profiles.photos
    if (!pfpData.pfp_url || pfpData.pfp_url.startsWith('https://example.com')) {
      console.log('\\n🔄 PFP URL is invalid, trying to get from profiles.photos...');
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('photos')
        .eq('id', userId)
        .single();
      
      if (profileError) {
        console.log('❌ Profile error:', profileError.message);
        return;
      }
      
      if (profile.photos && profile.photos.length > 0) {
        console.log('✅ Found photos in profiles table');
        console.log('📊 First photo:', profile.photos[0]);
        console.log('📋 Component should use this as fallback');
      } else {
        console.log('❌ No photos found in profiles table');
        console.log('📋 Component will show user initial');
      }
    }
    
  } catch (err) {
    console.log('❌ Error:', err.message);
  }
}

testPfpComponent();
