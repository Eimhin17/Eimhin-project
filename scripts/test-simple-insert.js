const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://tagjfsxeutihwntpudsk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZ2pmc3hldXRpaHdudHB1ZHNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTkwNzgsImV4cCI6MjA3MDA5NTA3OH0.pvcZjPWdvIAbBXoZakS_kOlXfEbiUcvidXY1Oy2eFN0'
);

async function testSimpleInsert() {
  try {
    console.log('🔍 Testing simple insert...');
    
    // Get a real user ID
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (profilesError) {
      console.log('❌ Profiles error:', profilesError.message);
      return;
    }
    
    const userId = profiles[0].id;
    console.log('📊 Using user ID:', userId);
    
    // Try a simple insert
    const { data, error } = await supabase
      .from('profile_pictures')
      .insert({
        user_id: userId,
        pfp_url: 'https://example.com/test.jpg'
      });
    
    if (error) {
      console.log('❌ Insert error:', error.message);
      console.log('📋 Error code:', error.code);
      console.log('📋 Error details:', error.details);
    } else {
      console.log('✅ Insert successful!');
    }
    
  } catch (err) {
    console.log('❌ Error:', err.message);
  }
}

testSimpleInsert();
