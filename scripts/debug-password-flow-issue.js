const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tagjfsxeutihwntpudsk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZ2pmc3hldXRpaHdudHB1ZHNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTkwNzgsImV4cCI6MjA3MDA5NTA3OH0.pvcZjPWdvIAbBXoZakS_kOlXfEbiUcvidXY1Oy2eFN0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugPasswordFlowIssue() {
  console.log('🔍 === DEBUGGING PASSWORD FLOW ISSUE ===');
  console.log('🔍 This test debugs why the password flow is still not working');
  console.log('');

  const testEmail = 'debug-flow-' + Date.now() + '@stkieranscollege.ie';
  const testPassword = 'DebugFlow123!';

  console.log('🧪 Test Configuration:');
  console.log('📧 Test Email:', testEmail);
  console.log('🔑 Test Password:', testPassword);
  console.log('🔑 Password type:', typeof testPassword);
  console.log('🔑 Password length:', testPassword.length);
  console.log('🔑 Password bytes:', Buffer.from(testPassword, 'utf8'));
  console.log('');

  try {
    // Step 1: Create account with detailed logging
    console.log('🔐 === STEP 1: CREATING ACCOUNT WITH DETAILED LOGGING ===');
    console.log('🔐 About to call supabase.auth.signUp with:');
    console.log('🔐 Email:', testEmail);
    console.log('🔐 Password:', testPassword);
    console.log('🔐 Password type:', typeof testPassword);
    console.log('🔐 Password length:', testPassword.length);
    console.log('🔐 Password JSON:', JSON.stringify(testPassword));
    console.log('');
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          first_name: 'Debug',
          last_name: 'Flow',
          date_of_birth: '2000-01-01',
          gender: 'woman',
          looking_for: 'go_to_someones_debs',
          relationship_intention: 'long_term_only',
          bio: 'Debug password flow test',
        }
      }
    });

    if (signUpError) {
      console.error('❌ Account creation failed:', signUpError.message);
      console.error('❌ Error details:', signUpError);
      return false;
    }

    if (signUpData.user) {
      console.log('✅ Account created successfully!');
      console.log('👤 User ID:', signUpData.user.id);
      console.log('📧 Email:', signUpData.user.email);
      console.log('🔐 Email confirmed:', signUpData.user.email_confirmed_at ? 'Yes' : 'No');
      console.log('📅 Created at:', signUpData.user.created_at);
      console.log('');

      // Step 2: Wait a moment for the account to be fully processed
      console.log('⏳ Waiting 2 seconds for account to be fully processed...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('');

      // Step 3: Try immediate sign in with the EXACT same password
      console.log('🔐 === STEP 2: TESTING IMMEDIATE SIGN IN ===');
      console.log('🔐 Attempting sign in with EXACT same password...');
      console.log('🔐 Email:', testEmail);
      console.log('🔐 Password:', testPassword);
      console.log('🔐 Password type:', typeof testPassword);
      console.log('🔐 Password length:', testPassword.length);
      console.log('🔐 Password JSON:', JSON.stringify(testPassword));
      console.log('');
      
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
          console.log('🚨 === CRITICAL ISSUE DETECTED ===');
          console.log('🚨 Even with the EXACT same password, login fails!');
          console.log('🚨 This means there is a fundamental issue with our password flow');
          console.log('🚨 The password is being corrupted or changed during the signup process');
          console.log('');
          console.log('🔍 POSSIBLE CAUSES:');
          console.log('🔍 1. Password is being modified by SupabaseAuthService');
          console.log('🔍 2. Password is being corrupted during UserContext handling');
          console.log('🔍 3. Password is being modified by the onboarding flow');
          console.log('🔍 4. There is a character encoding issue');
          console.log('🔍 5. There is a timing issue with password storage');
          console.log('');
          console.log('💡 NEXT STEPS:');
          console.log('💡 1. Check the actual password stored in Supabase Dashboard');
          console.log('💡 2. Add more detailed logging to the password flow');
          console.log('💡 3. Test with a simpler password (no special characters)');
          console.log('💡 4. Check if there are any password transformations');
          console.log('🚨 === END CRITICAL ISSUE DETECTED ===');
        } else if (signInError.message.includes('Email not confirmed')) {
          console.log('');
          console.log('⚠️ === EMAIL NOT CONFIRMED ===');
          console.log('⚠️ The password is correct, but email confirmation is required');
          console.log('⚠️ This is expected behavior for new accounts');
          console.log('');
          console.log('💡 TO TEST PASSWORD:');
          console.log('💡 1. Go to Supabase Dashboard → Authentication → Users');
          console.log('💡 2. Find user:', testEmail);
          console.log('💡 3. Click "Confirm user"');
          console.log('💡 4. Then try to sign in');
          console.log('⚠️ === END EMAIL NOT CONFIRMED ===');
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
        
        console.log('');
        console.log('✅ === PASSWORD FLOW WORKING! ===');
        console.log('✅ The password flow is working correctly');
        console.log('✅ Account creation and sign in both work');
        console.log('✅ === END PASSWORD FLOW WORKING! ===');
      }

      // Step 4: Test with a simpler password
      console.log('');
      console.log('🔐 === STEP 3: TESTING WITH SIMPLER PASSWORD ===');
      console.log('🔐 Testing with a password that has no special characters...');
      
      const simpleEmail = 'simple-test-' + Date.now() + '@stkieranscollege.ie';
      const simplePassword = 'SimplePassword123';

      console.log('🔐 Simple email:', simpleEmail);
      console.log('🔐 Simple password:', simplePassword);
      console.log('🔐 Simple password type:', typeof simplePassword);
      console.log('🔐 Simple password length:', simplePassword.length);
      console.log('');

      const { data: simpleSignUpData, error: simpleSignUpError } = await supabase.auth.signUp({
        email: simpleEmail,
        password: simplePassword,
        options: {
          data: {
            first_name: 'Simple',
            last_name: 'Test',
            date_of_birth: '2000-01-01',
            gender: 'woman',
            looking_for: 'go_to_someones_debs',
            relationship_intention: 'long_term_only',
            bio: 'Simple password test',
          }
        }
      });

      if (simpleSignUpError) {
        console.log('❌ Simple account creation failed:', simpleSignUpError.message);
      } else if (simpleSignUpData.user) {
        console.log('✅ Simple account created successfully!');
        console.log('👤 User ID:', simpleSignUpData.user.id);
        
        // Wait a moment
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Try to sign in
        const { data: simpleSignInData, error: simpleSignInError } = await supabase.auth.signInWithPassword({
          email: simpleEmail,
          password: simplePassword,
        });

        if (simpleSignInError) {
          console.log('❌ Simple sign in failed:', simpleSignInError.message);
          if (simpleSignInError.message.includes('Invalid login credentials')) {
            console.log('🚨 Even simple passwords are failing!');
          } else if (simpleSignInError.message.includes('Email not confirmed')) {
            console.log('⚠️ Simple password works, but email confirmation required');
          }
        } else {
          console.log('✅ Simple sign in successful!');
          await supabase.auth.signOut();
        }
      }

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
  console.log('🚀 Password Flow Issue Debug');
  console.log('============================');
  console.log('');

  await debugPasswordFlowIssue();

  console.log('');
  console.log('🏁 Debug complete!');
  console.log('');
  console.log('📋 SUMMARY:');
  console.log('📋 1. Created account with detailed password logging');
  console.log('📋 2. Tested immediate sign in with exact same password');
  console.log('📋 3. Tested with simpler password (no special characters)');
  console.log('📋 4. Identified if the issue is with special characters or the entire flow');
  console.log('');
  console.log('🎯 NEXT STEPS:');
  console.log('🎯 1. If both passwords fail: There is a fundamental flow issue');
  console.log('🎯 2. If only special character passwords fail: Character encoding issue');
  console.log('🎯 3. If only email confirmation fails: Supabase setting issue');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  debugPasswordFlowIssue
};
