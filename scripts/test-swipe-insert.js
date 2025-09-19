const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://tagjfsxeutihwntpudsk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZ2pmc3hldXRpaHdudHB1ZHNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTkwNzgsImV4cCI6MjA3MDA5NTA3OH0.pvcZjPWdvIAbBXoZakS_kOlXfEbiUcvidXY1Oy2eFN0'
);

async function testSwipeInsert() {
  try {
    console.log('🧪 Testing swipe insert...');
    
    // First, let's check if the swipes table exists and what columns it has
    console.log('📋 Checking swipes table structure...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('swipes')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.log('❌ Table structure error:', tableError.message);
      return;
    }
    
    console.log('✅ Swipes table exists');
    
    // Get a real user ID to test with
    console.log('👤 Fetching a real user ID...');
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .limit(2);
    
    if (profileError || !profiles || profiles.length < 2) {
      console.log('❌ Could not fetch profiles:', profileError?.message);
      return;
    }
    
    const [user1, user2] = profiles;
    console.log('✅ Found users:', user1.id, user2.id);
    
    // Try to insert a test swipe
    console.log('🔄 Attempting to insert test swipe...');
    const { data: swipeData, error: swipeError } = await supabase
      .from('swipes')
      .insert({
        swiper_id: user1.id,
        swiped_user_id: user2.id,
        direction: 'left'
      })
      .select()
      .single();
    
    if (swipeError) {
      console.log('❌ Swipe insert error:', swipeError);
      console.log('Error details:', JSON.stringify(swipeError, null, 2));
    } else {
      console.log('✅ Swipe inserted successfully:', swipeData);
    }
    
    // Check if the swipe was actually inserted
    console.log('🔍 Checking if swipe exists in database...');
    const { data: checkData, error: checkError } = await supabase
      .from('swipes')
      .select('*')
      .eq('swiper_id', user1.id)
      .eq('swiped_user_id', user2.id);
    
    if (checkError) {
      console.log('❌ Check error:', checkError.message);
    } else {
      console.log('✅ Found swipes:', checkData?.length || 0);
      if (checkData && checkData.length > 0) {
        console.log('Swipe data:', checkData[0]);
      }
    }
    
  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
  }
}

testSwipeInsert();
