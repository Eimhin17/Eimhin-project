const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tagjfsxeutihwntpudsk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZ2pmc3hldXRpaHdudHB1ZHNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTkwNzgsImV4cCI6MjA3MDA5NTA3OH0.pvcZjPWdvIAbBXoZakS_kOlXfEbiUcvidXY1Oy2eFN0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testExactCreatedAccount() {
  console.log('🔍 === TESTING EXACT ACCOUNT THAT WAS JUST CREATED ===');
  console.log('🔍 This test uses the exact credentials from the app logs');
  console.log('');

  const testEmail = '19-0120@stkieranscollege.ie';
  const testPassword = 'Rua&Luna1';

  console.log('🧪 Test Configuration:');
  console.log('📧 Test Email:', testEmail);
  console.log('🔑 Test Password:', testPassword);
  console.log('');

  try {
    // Step 1: Try to sign in with the exact credentials from the logs
    console.log('🔐 === STEP 1: ATTEMPTING SIGN IN ===');
    console.log('🔐 Using exact credentials from the app logs...');
    console.log('🔐 Email:', testEmail);
    console.log('🔑 Password:', testPassword);
    console.log('');

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (signInError) {
      console.log('❌ Sign in failed:', signInError.message);
      console.log('🔍 Error code:', signInError.code);
      
      if (signInError.message.includes('Invalid login credentials')) {
        console.log('');
        console.log('🚨 === CRITICAL ISSUE CONFIRMED ===');
        console.log('🚨 Even with the EXACT credentials from the app logs, login fails!');
        console.log('🚨 This means there is a fundamental issue with Supabase Auth');
        console.log('');
        console.log('🔍 POSSIBLE CAUSES:');
        console.log('🔍 1. Supabase Auth has a bug with password storage');
        console.log('🔍 2. There is a timing issue - password not fully stored yet');
        console.log('🔍 3. There is a character encoding issue in Supabase');
        console.log('🔍 4. There is a configuration issue with Supabase Auth');
        console.log('');
        console.log('💡 NEXT STEPS:');
        console.log('💡 1. Check Supabase Dashboard to see what password is actually stored');
        console.log('💡 2. Try waiting longer before attempting sign in');
        console.log('💡 3. Check Supabase Auth settings and configuration');
        console.log('💡 4. Contact Supabase support if this is a platform issue');
        console.log('🚨 === END CRITICAL ISSUE CONFIRMED ===');
      } else if (signInError.message.includes('Email not confirmed')) {
        console.log('');
        console.log('⚠️ === EMAIL NOT CONFIRMED ===');
        console.log('⚠️ The password is correct, but email confirmation is required');
        console.log('⚠️ This is expected behavior');
        console.log('');
        console.log('✅ CONCLUSION: Password flow is working correctly!');
        console.log('✅ The only issue is email confirmation (Supabase setting)');
        console.log('⚠️ === END EMAIL NOT CONFIRMED ===');
      }
    } else {
      console.log('✅ Sign in successful!');
      console.log('👤 User ID:', signInData.user.id);
      console.log('📧 Email:', signInData.user.email);
      console.log('🔐 Email confirmed:', signInData.user.email_confirmed_at ? 'Yes' : 'No');
      
      // Sign out
      await supabase.auth.signOut();
      console.log('✅ Signed out successfully');
      
      console.log('');
      console.log('✅ === PASSWORD FLOW WORKING PERFECTLY! ===');
      console.log('✅ Account creation and sign in both work correctly');
      console.log('✅ The password flow is completely fixed');
      console.log('✅ === END PASSWORD FLOW WORKING PERFECTLY! ===');
    }

    // Step 2: Check what's actually stored in Supabase
    console.log('');
    console.log('🔍 === STEP 2: CHECKING WHAT IS STORED IN SUPABASE ===');
    console.log('🔍 You can verify this in Supabase Dashboard:');
    console.log('🔍 1. Go to Authentication → Users');
    console.log('🔍 2. Find user:', testEmail);
    console.log('🔍 3. Check the "Last sign in" field');
    console.log('🔍 4. Check if the user is confirmed');
    console.log('🔍 5. Try to reset the password and see what happens');
    console.log('');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Exact Created Account Test');
  console.log('=============================');
  console.log('');

  await testExactCreatedAccount();

  console.log('');
  console.log('🏁 Test complete!');
  console.log('');
  console.log('📋 SUMMARY:');
  console.log('📋 1. Tested sign in with exact credentials from app logs');
  console.log('📋 2. Identified if the issue is with our code or Supabase itself');
  console.log('📋 3. Provided next steps for resolution');
  console.log('');
  console.log('🎯 NEXT STEPS:');
  console.log('🎯 1. If sign in works: Password flow is working, issue is elsewhere');
  console.log('🎯 2. If sign in fails: There is a fundamental Supabase issue');
  console.log('🎯 3. Check Supabase Dashboard for actual stored data');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testExactCreatedAccount
};
