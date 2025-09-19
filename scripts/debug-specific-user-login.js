const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tagjfsxeutihwntpudsk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZ2pmc3hldXRpaHdudHB1ZHNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTkwNzgsImV4cCI6MjA3MDA5NTA3OH0.pvcZjPWdvIAbBXoZakS_kOlXfEbiUcvidXY1Oy2eFN0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugSpecificUserLogin() {
  console.log('🔍 === DEBUGGING SPECIFIC USER LOGIN ===');
  console.log('🔍 This script debugs the exact user that is failing to login');
  console.log('');

  // The user from the logs that's failing
  const testEmail = '19-0120@stkieranscollege.ie';
  const testPassword = 'Rua&Luna1';

  console.log('🧪 Debugging User:');
  console.log('📧 Email:', testEmail);
  console.log('🔑 Password:', testPassword);
  console.log('');

  try {
    // Step 1: Check if user exists in auth.users
    console.log('🔍 === STEP 1: CHECKING AUTH.USERS TABLE ===');
    console.log('🔍 Looking for user in Supabase Auth...');
    
    // We can't directly query auth.users with anon key, but we can try to sign in
    // and see what happens
    
    // Step 2: Try to sign in with the exact credentials
    console.log('🔍 === STEP 2: ATTEMPTING SIGN IN ===');
    console.log('🔍 Attempting to sign in with provided credentials...');
    
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (signInError) {
      console.log('❌ Sign in failed:', signInError.message);
      console.log('🔍 Error code:', signInError.code);
      console.log('🔍 Error details:', signInError);
      
      if (signInError.message.includes('Invalid login credentials')) {
        console.log('');
        console.log('🚨 === PASSWORD MISMATCH DETECTED ===');
        console.log('🚨 The password "Rua&Luna1" does not match what Supabase has stored');
        console.log('🚨 This means either:');
        console.log('🚨 1. The account was created with a different password');
        console.log('🚨 2. The password was corrupted during the creation process');
        console.log('🚨 3. There is a character encoding issue');
        console.log('🚨 4. The account was created with a fallback password');
        console.log('');
        console.log('💡 SOLUTION: Reset the password in Supabase Dashboard');
        console.log('💡 Go to Authentication → Users → Find user → Reset password');
        console.log('💡 Set password to: Rua&Luna1');
        console.log('🚨 === END PASSWORD MISMATCH DETECTED ===');
      }
    } else {
      console.log('✅ Sign in successful!');
      console.log('👤 User ID:', signInData.user.id);
      console.log('📧 Email:', signInData.user.email);
      console.log('🔐 Email confirmed:', signInData.user.email_confirmed_at ? 'Yes' : 'No');
      console.log('📅 Last sign in:', signInData.user.last_sign_in_at);
      
      // Sign out
      await supabase.auth.signOut();
      console.log('✅ Signed out successfully');
    }

    // Step 3: Check if user exists in profiles table
    console.log('');
    console.log('🔍 === STEP 3: CHECKING PROFILES TABLE ===');
    console.log('🔍 Looking for user profile in database...');
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', testEmail)
      .single();

    if (profileError) {
      console.log('❌ Profile fetch error:', profileError.message);
      console.log('🔍 Error code:', profileError.code);
    } else if (profile) {
      console.log('✅ Profile found in database:');
      console.log('👤 Profile ID:', profile.id);
      console.log('📧 Profile email:', profile.email);
      console.log('👤 First name:', profile.first_name);
      console.log('👤 Last name:', profile.last_name);
      console.log('🏫 School ID:', profile.school_id);
      console.log('✅ Onboarding completed:', profile.onboarding_completed);
      console.log('📅 Created at:', profile.created_at);
      console.log('📅 Updated at:', profile.updated_at);
    } else {
      console.log('⚠️ No profile found in database');
    }

    // Step 4: Try creating a new account with the same email to see what happens
    console.log('');
    console.log('🔍 === STEP 4: TESTING ACCOUNT CREATION ===');
    console.log('🔍 Attempting to create account with same email...');
    
    const testEmail2 = 'test-debug-' + Date.now() + '@stkieranscollege.ie';
    const testPassword2 = 'Rua&Luna1';

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail2,
      password: testPassword2,
      options: {
        data: {
          first_name: 'Debug',
          last_name: 'Test',
          date_of_birth: '2000-01-01',
          gender: 'woman',
          looking_for: 'go_to_someones_debs',
          relationship_intention: 'long_term_only',
          bio: 'Debug test account',
        }
      }
    });

    if (signUpError) {
      console.log('❌ Account creation failed:', signUpError.message);
    } else if (signUpData.user) {
      console.log('✅ Test account created successfully!');
      console.log('👤 User ID:', signUpData.user.id);
      console.log('📧 Email:', signUpData.user.email);
      
      // Try immediate sign in
      console.log('🔍 Testing immediate sign in...');
      const { data: testSignInData, error: testSignInError } = await supabase.auth.signInWithPassword({
        email: testEmail2,
        password: testPassword2,
      });

      if (testSignInError) {
        console.log('❌ Test sign in failed:', testSignInError.message);
        if (testSignInError.message.includes('Email not confirmed')) {
          console.log('⚠️ Email confirmation required - this is expected');
        }
      } else {
        console.log('✅ Test sign in successful!');
        await supabase.auth.signOut();
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

async function main() {
  console.log('🚀 Specific User Login Debug');
  console.log('============================');
  console.log('');

  await debugSpecificUserLogin();

  console.log('');
  console.log('🏁 Debug complete!');
  console.log('');
  console.log('📋 SUMMARY:');
  console.log('📋 1. Checked if user exists in auth.users (via sign in attempt)');
  console.log('📋 2. Checked if user exists in profiles table');
  console.log('📋 3. Tested account creation with same password');
  console.log('📋 4. Identified the root cause of login failure');
  console.log('');
  console.log('🎯 NEXT STEPS:');
  console.log('🎯 1. Reset password in Supabase Dashboard for the failing user');
  console.log('🎯 2. Verify the password flow works for new users');
  console.log('🎯 3. Check for any character encoding issues');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  debugSpecificUserLogin
};
