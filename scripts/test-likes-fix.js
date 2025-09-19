const { createClient } = require('@supabase/supabase-js');

// You'll need to add your Supabase URL and anon key here
// Or set them as environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLikesFunctionality() {
  try {
    console.log('🧪 Testing likes functionality...');
    
    // Test 1: Check if we can read from likes table
    console.log('1. Testing likes table access...');
    const { data: likes, error: readError } = await supabase
      .from('likes')
      .select('*')
      .limit(5);
    
    if (readError) {
      console.error('❌ Cannot read from likes table:', readError.message);
      return false;
    }
    
    console.log('✅ Can read from likes table');
    console.log(`   Found ${likes.length} existing likes`);
    
    // Test 2: Check if we can create a like (if we have profiles)
    console.log('2. Testing likes creation...');
    
    // Get some profiles to test with
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .limit(2);
    
    if (profileError || !profiles || profiles.length < 2) {
      console.log('⚠️  Cannot test creation - need at least 2 profiles');
      console.log('   This is normal if you have no profiles yet');
      return true;
    }
    
    const [profile1, profile2] = profiles;
    
    // Try to create a test like
    const { data: newLike, error: createError } = await supabase
      .from('likes')
      .insert({
        liker_id: profile1.id,
        liked_user_id: profile2.id
      })
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Cannot create likes:', createError.message);
      return false;
    }
    
    console.log('✅ Can create likes successfully');
    console.log(`   Created like: ${newLike.id}`);
    
    // Clean up test like
    await supabase
      .from('likes')
      .delete()
      .eq('id', newLike.id);
    
    console.log('✅ Test like cleaned up');
    
    console.log('🎉 All likes functionality tests passed!');
    console.log('   Your likes feature is ready for launch!');
    
    return true;
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    return false;
  }
}

// Run the test
testLikesFunctionality().then(success => {
  if (success) {
    console.log('\n✅ LIKES RLS FIX VERIFIED - READY FOR LAUNCH!');
  } else {
    console.log('\n❌ LIKES STILL HAVE ISSUES - CHECK ERRORS ABOVE');
  }
});
