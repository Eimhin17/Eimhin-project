const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://tagjfsxeutihwntpudsk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZ2pmc3hldXRpaHdudHB1ZHNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTkwNzgsImV4cCI6MjA3MDA5NTA3OH0.pvcZjPWdvIAbBXoZakS_kOlXfEbiUcvidXY1Oy2eFN0'
);

async function testPfpTable() {
  try {
    console.log('🔍 Testing profile_pictures table...');
    
    // First get a real user ID from profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (profilesError) {
      console.log('❌ Profiles error:', profilesError.message);
      return;
    }
    
    if (!profiles || profiles.length === 0) {
      console.log('❌ No profiles found');
      return;
    }
    
    const userId = profiles[0].id;
    console.log('📊 Found user ID:', userId);
    
    // Try to read from profile_pictures
    console.log('🔍 Testing read from profile_pictures...');
    const { data: readData, error: readError } = await supabase
      .from('profile_pictures')
      .select('*')
      .limit(1);
    
    if (readError) {
      console.log('❌ Read error:', readError.message);
      console.log('📋 Error code:', readError.code);
    } else {
      console.log('✅ Read successful!');
      console.log('📊 Current records:', readData?.length || 0);
    }
    
    // Try to insert a test PFP
    console.log('🔍 Testing insert into profile_pictures...');
    const { data: insertData, error: insertError } = await supabase
      .from('profile_pictures')
      .insert({
        user_id: userId,
        pfp_url: 'https://example.com/test.jpg'
      })
      .select();
    
    if (insertError) {
      console.log('❌ Insert error:', insertError.message);
      console.log('📋 Error code:', insertError.code);
    } else {
      console.log('✅ Insert successful!');
      console.log('📊 Inserted data:', insertData);
    }
    
  } catch (err) {
    console.log('❌ Error:', err.message);
  }
}

testPfpTable();
