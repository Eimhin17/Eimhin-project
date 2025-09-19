const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tagjfsxeutihwntpudsk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZ2pmc3hldXRpaHdudHB1ZHNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTkwNzgsImV4cCI6MjA3MDA5NTA3OH0.pvcZjPWdvIAbBXoZakS_kOlXfEbiUcvidXY1Oy2eFN0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAppVsScriptFlow() {
  console.log('🔍 === TESTING APP VS SCRIPT FLOW ===');
  console.log('🔍 This test compares how our scripts create accounts vs how the app creates accounts');
  console.log('');

  const testEmail = 'app-vs-script-' + Date.now() + '@stkieranscollege.ie';
  const testPassword = 'AppVsScript123!';

  console.log('🧪 Test Configuration:');
  console.log('📧 Test Email:', testEmail);
  console.log('🔑 Test Password:', testPassword);
  console.log('');

  try {
    // Step 1: Create account using the EXACT same method as SupabaseAuthService.signUp
    console.log('🔐 === STEP 1: CREATING ACCOUNT LIKE SUPABASEAUTHSERVICE ===');
    console.log('🔐 Simulating the exact SupabaseAuthService.signUp call...');
    console.log('🔐 This is how the app creates accounts through the onboarding flow');
    console.log('');

    // This is the EXACT same call that SupabaseAuthService.signUp makes
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          first_name: 'App',
          last_name: 'Test',
          date_of_birth: '2000-01-01',
          gender: 'woman',
          looking_for: 'go_to_someones_debs',
          relationship_intention: 'long_term_only',
          bio: 'App vs script test',
        }
      }
    });

    if (signUpError) {
      console.error('❌ Account creation failed:', signUpError.message);
      return false;
    }

    if (signUpData.user) {
      console.log('✅ Account created successfully!');
      console.log('👤 User ID:', signUpData.user.id);
      console.log('📧 Email:', signUpData.user.email);
      console.log('🔐 Email confirmed:', signUpData.user.email_confirmed_at ? 'Yes' : 'No');
      console.log('');

      // Step 2: Wait for account to be processed
      console.log('⏳ Waiting 3 seconds for account to be fully processed...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      console.log('');

      // Step 3: Try to sign in with the EXACT same password
      console.log('🔐 === STEP 2: TESTING SIGN IN WITH EXACT SAME PASSWORD ===');
      console.log('🔐 Attempting sign in with the exact same password used for creation...');
      console.log('🔐 Email:', testEmail);
      console.log('🔐 Password:', testPassword);
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
          console.log('🚨 === CRITICAL ISSUE FOUND ===');
          console.log('🚨 Even with the EXACT same SupabaseAuthService.signUp call, login fails!');
          console.log('🚨 This means there is a fundamental issue with Supabase Auth itself');
          console.log('🚨 OR there is a timing issue with password storage');
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
          console.log('🚨 === END CRITICAL ISSUE FOUND ===');
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

      // Step 4: Check what's actually stored in Supabase
      console.log('');
      console.log('🔍 === STEP 3: CHECKING WHAT IS STORED IN SUPABASE ===');
      console.log('🔍 You can verify this in Supabase Dashboard:');
      console.log('🔍 1. Go to Authentication → Users');
      console.log('🔍 2. Find user:', testEmail);
      console.log('🔍 3. Check the "Last sign in" field');
      console.log('🔍 4. Check if the user is confirmed');
      console.log('🔍 5. Try to reset the password and see what happens');
      console.log('');

    } else {
      console.error('❌ No user data returned from signup');
      return false;
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 App vs Script Flow Test');
  console.log('==========================');
  console.log('');

  await testAppVsScriptFlow();

  console.log('');
  console.log('🏁 Test complete!');
  console.log('');
  console.log('📋 SUMMARY:');
  console.log('📋 1. Created account using exact SupabaseAuthService.signUp method');
  console.log('📋 2. Tested sign in with exact same password');
  console.log('📋 3. Identified if the issue is with our code or Supabase itself');
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
  testAppVsScriptFlow
};
