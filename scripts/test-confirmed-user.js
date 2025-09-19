const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tagjfsxeutihwntpudsk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZ2pmc3hldXRpaHdudHB1ZHNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTkwNzgsImV4cCI6MjA3MDA5NTA3OH0.pvcZjPWdvIAbBXoZakS_kOlXfEbiUcvidXY1Oy2eFN0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConfirmedUser() {
  console.log('🔐 === TESTING CONFIRMED USER ===');
  console.log('');

  const testEmail = '19-0120@stkieranscollege.ie';
  const testPassword = 'Rua&Luna1';

  console.log('🧪 Testing confirmed user:');
  console.log('📧 Email:', testEmail);
  console.log('🔑 Password:', testPassword);
  console.log('');

  try {
    // Try to sign in
    console.log('🔄 Attempting sign in...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (signInError) {
      console.log('❌ Sign in failed:', signInError.message);
      console.log('🔍 Error code:', signInError.code);
      
      if (signInError.message.includes('Invalid login credentials')) {
        console.log('');
        console.log('🚨 DIAGNOSIS: Password mismatch');
        console.log('🚨 User exists and is confirmed, but password is wrong');
        console.log('');
        console.log('💡 POSSIBLE CAUSES:');
        console.log('💡 1. Password was changed after account creation');
        console.log('💡 2. Onboarding used different password than expected');
        console.log('💡 3. Password got corrupted during onboarding flow');
        console.log('');
        console.log('💡 NEXT STEPS:');
        console.log('💡 1. Check what password was actually used during onboarding');
        console.log('💡 2. Reset password in Supabase Dashboard');
        console.log('💡 3. Test onboarding flow again with debugging');
      }
    } else {
      console.log('✅ Sign in successful!');
      console.log('👤 User ID:', signInData.user.id);
      console.log('🔐 Email confirmed:', signInData.user.email_confirmed_at ? 'Yes' : 'No');
      console.log('📅 Last sign in:', signInData.user.last_sign_in_at);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

async function main() {
  console.log('🚀 Confirmed User Password Test');
  console.log('================================');
  console.log('');

  await testConfirmedUser();

  console.log('');
  console.log('🏁 Test complete!');
}

if (require.main === module) {
  main().catch(console.error);
}

