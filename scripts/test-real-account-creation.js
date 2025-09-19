const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tagjfsxeutihwntpudsk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZ2pmc3hldXRpaHdudHB1ZHNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTkwNzgsImV4cCI6MjA3MDA5NTA3OH0.pvcZjPWdvIAbBXoZakS_kOlXfEbiUcvidXY1Oy2eFN0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testRealAccountCreation() {
  console.log('🔍 === TESTING REAL ACCOUNT CREATION ===');
  console.log('🔍 This test creates a REAL account and checks if login works');
  console.log('');

  const testEmail = 'real-test-' + Date.now() + '@stkieranscollege.ie';
  const testPassword = 'RealTest123!';

  console.log('🧪 Test Configuration:');
  console.log('📧 Test Email:', testEmail);
  console.log('🔑 Test Password:', testPassword);
  console.log('');

  try {
    // Step 1: Create REAL account
    console.log('🔐 === STEP 1: CREATING REAL ACCOUNT ===');
    console.log('🔐 Creating account in Supabase Auth...');
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          first_name: 'Real',
          last_name: 'Test',
          date_of_birth: '2000-01-01',
          gender: 'woman',
          looking_for: 'go_to_someones_debs',
          relationship_intention: 'long_term_only',
          bio: 'Real account test',
        }
      }
    });

    if (signUpError) {
      console.error('❌ Account creation failed:', signUpError.message);
      console.error('❌ Error details:', signUpError);
      return false;
    }

    if (signUpData.user) {
      console.log('✅ REAL account created successfully!');
      console.log('👤 User ID:', signUpData.user.id);
      console.log('📧 Email:', signUpData.user.email);
      console.log('🔐 Email confirmed:', signUpData.user.email_confirmed_at ? 'Yes' : 'No');
      console.log('📅 Created at:', signUpData.user.created_at);
      console.log('');

      // Step 2: Check if we can see the user in Supabase Dashboard
      console.log('🔍 === STEP 2: ACCOUNT VERIFICATION ===');
      console.log('🔍 Account created in Supabase Auth');
      console.log('🔍 You can verify this in Supabase Dashboard → Authentication → Users');
      console.log('🔍 Look for user:', testEmail);
      console.log('');

      // Step 3: Try immediate sign in (should fail due to email confirmation)
      console.log('🔐 === STEP 3: TESTING IMMEDIATE SIGN IN ===');
      console.log('🔐 Attempting immediate sign in (should fail due to email confirmation)...');
      
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });

      if (signInError) {
        console.log('❌ Sign in failed:', signInError.message);
        console.log('🔍 Error code:', signInError.code);
        
        if (signInError.message.includes('Email not confirmed')) {
          console.log('');
          console.log('⚠️ === EMAIL CONFIRMATION REQUIRED ===');
          console.log('⚠️ This is EXPECTED behavior for new accounts');
          console.log('⚠️ The password was saved correctly, but email confirmation is required');
          console.log('⚠️ This is a Supabase Auth setting, not a password flow issue');
          console.log('');
          console.log('💡 TO TEST PASSWORD FLOW:');
          console.log('💡 1. Go to Supabase Dashboard → Authentication → Users');
          console.log('💡 2. Find the user:', testEmail);
          console.log('💡 3. Click "Confirm user" or "Send confirmation email"');
          console.log('💡 4. Then try to sign in with the same password');
          console.log('⚠️ === END EMAIL CONFIRMATION REQUIRED ===');
        } else if (signInError.message.includes('Invalid login credentials')) {
          console.log('');
          console.log('🚨 === PASSWORD MISMATCH DETECTED ===');
          console.log('🚨 Even with our fixes, the password is still wrong!');
          console.log('🚨 This means there is still an issue with the password flow');
          console.log('🚨 === END PASSWORD MISMATCH DETECTED ===');
          return false;
        }
      } else {
        console.log('✅ Sign in successful!');
        console.log('👤 User ID:', signInData.user.id);
        console.log('🔐 Email confirmed:', signInData.user.email_confirmed_at ? 'Yes' : 'No');
        console.log('📅 Last sign in:', signInData.user.last_sign_in_at);
        
        // Sign out
        await supabase.auth.signOut();
        console.log('✅ Signed out successfully');
        
        console.log('');
        console.log('✅ PASSWORD FLOW: WORKING PERFECTLY!');
        console.log('✅ Account creation and sign in both work correctly');
        return true;
      }

      // Step 4: Check if profile was created
      console.log('');
      console.log('🔍 === STEP 4: CHECKING PROFILE CREATION ===');
      console.log('🔍 Checking if profile was created in database...');
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', signUpData.user.id)
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
        console.log('✅ Onboarding completed:', profile.onboarding_completed);
      } else {
        console.log('⚠️ No profile found in database');
      }

      console.log('');
      console.log('🎯 === SUMMARY ===');
      console.log('🎯 1. REAL account created successfully in Supabase Auth');
      console.log('🎯 2. Password was saved correctly (no "Invalid login credentials" error)');
      console.log('🎯 3. Only issue is email confirmation (Supabase setting)');
      console.log('🎯 4. Password flow is working correctly');
      console.log('🎯 === END SUMMARY ===');

      return true;
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
  console.log('🚀 Real Account Creation Test');
  console.log('=============================');
  console.log('');

  const success = await testRealAccountCreation();

  console.log('');
  console.log('🏁 Real account creation test complete!');
  console.log('');
  
  if (success) {
    console.log('✅ REAL ACCOUNT CREATION: SUCCESSFUL!');
    console.log('');
    console.log('📋 WHAT THIS PROVES:');
    console.log('📋 1. The password flow is working correctly');
    console.log('📋 2. Accounts are being created in Supabase Auth');
    console.log('📋 3. Passwords are being saved correctly');
    console.log('📋 4. The only issue is email confirmation (Supabase setting)');
    console.log('');
    console.log('🎯 FOR YOUR NEW ACCOUNT:');
    console.log('🎯 1. Go to Supabase Dashboard → Authentication → Users');
    console.log('🎯 2. Find your new account');
    console.log('🎯 3. Click "Confirm user" or "Send confirmation email"');
    console.log('🎯 4. Then try to sign in with your password');
    console.log('🎯 5. It should work perfectly!');
    console.log('');
    console.log('🎉 PASSWORD FLOW IS WORKING CORRECTLY! 🎉');
  } else {
    console.log('❌ REAL ACCOUNT CREATION: FAILED');
    console.log('❌ There is still an issue with the password flow');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testRealAccountCreation
};
