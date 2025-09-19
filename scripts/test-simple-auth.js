// Simple Authentication Test
// This will test the basic Supabase Auth functionality

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tagjfsxeutihwntpudsk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZ2pmc3hldXRpaHdudHB1ZHNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTkwNzgsImV4cCI6MjA3MDA5NTA3OH0.pvcZjPWdvIAbBXoZakS_kOlXfEbiUcvidXY1Oy2eFN0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSimpleAuth() {
  console.log('🧪 Simple Authentication Test\n');

  const testEmail = '19-0120@stkieranscollege.ie';
  
  // Test with the exact password that was set by the reset script
  const testPassword = 'test123'; // This is what the reset script set

  console.log('📧 Testing with email:', testEmail);
  console.log('🔑 Testing with password:', testPassword);
  console.log('');

  try {
    // Test 1: Basic sign in
    console.log('1️⃣ Testing basic sign in...');
    const { data, error } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (error) {
      console.log('❌ Sign in failed:', error.message);
      console.log('   Error code:', error.status);
      console.log('   Full error:', error);
      
      // If simple password fails, the issue is deeper
      console.log('\n💡 Since simple password failed, the issue is:');
      console.log('   - Password hash mismatch');
      console.log('   - User recreation didn\'t work properly');
      console.log('   - Need to reset password via dashboard');
      
    } else {
      console.log('✅ Sign in successful!');
      console.log('   User ID:', data.user?.id);
      console.log('   Email:', data.user?.email);
      console.log('   Session:', data.session ? 'Valid' : 'None');
    }

  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
  }

  console.log('\n🎯 Test complete!');
  console.log('\n📋 Next steps:');
  console.log('1. Go to Supabase Dashboard → Authentication → Users');
  console.log('2. Click on your user');
  console.log('3. Click "Reset password"');
  console.log('4. Set a new password (try Test123!)');
  console.log('5. Test again');
}

// Run the test
testSimpleAuth().catch(console.error);
