const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tagjfsxeutihwntpudsk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZ2pmc3hldXRpaHdudHB1ZHNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTkwNzgsImV4cCI6MjA3MDA5NTA3OH0.pvcZjPWdvIAbBXoZakS_kOlXfEbiUcvidXY1Oy2eFN0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSpecificUser19_0120() {
  console.log('🔍 === TESTING SPECIFIC USER 19-0120@stkieranscollege.ie ===');
  console.log('🔍 This test specifically tests the user that is failing to login');
  console.log('');

  const testEmail = '19-0120@stkieranscollege.ie';
  const testPassword = 'Rua&Luna1';

  console.log('🧪 Testing User:');
  console.log('📧 Email:', testEmail);
  console.log('🔑 Password:', testPassword);
  console.log('');

  try {
    // Step 1: Try to sign in with the exact credentials
    console.log('🔍 === STEP 1: ATTEMPTING SIGN IN ===');
    console.log('🔍 Attempting to sign in with provided credentials...');
    console.log('🔍 Password type:', typeof testPassword);
    console.log('🔍 Password length:', testPassword.length);
    console.log('🔍 Password value:', testPassword);
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
        console.log('🚨 === PASSWORD MISMATCH CONFIRMED ===');
        console.log('🚨 The password "Rua&Luna1" does NOT match what Supabase has stored');
        console.log('🚨 This confirms that the user was created with a different password');
        console.log('');
        console.log('🔍 POSSIBLE CAUSES:');
        console.log('🔍 1. User was created with a fallback password (before our fixes)');
        console.log('🔍 2. User was created with a corrupted password');
        console.log('🔍 3. User was created with a different password entirely');
        console.log('🔍 4. Character encoding issue during account creation');
        console.log('');
        console.log('💡 SOLUTION:');
        console.log('💡 1. Go to Supabase Dashboard → Authentication → Users');
        console.log('💡 2. Find user: 19-0120@stkieranscollege.ie');
        console.log('💡 3. Click "Reset password"');
        console.log('💡 4. Set new password to: Rua&Luna1');
        console.log('💡 5. Save changes');
        console.log('💡 6. User will then be able to login');
        console.log('🚨 === END PASSWORD MISMATCH CONFIRMED ===');
      } else if (signInError.message.includes('Email not confirmed')) {
        console.log('');
        console.log('⚠️ === EMAIL NOT CONFIRMED ===');
        console.log('⚠️ The password is correct, but email confirmation is required');
        console.log('⚠️ This is a Supabase Auth setting');
        console.log('');
        console.log('💡 SOLUTION:');
        console.log('💡 1. Go to Supabase Dashboard → Authentication → Users');
        console.log('💡 2. Find user: 19-0120@stkieranscollege.ie');
        console.log('💡 3. Click "Confirm user" or "Send confirmation email"');
        console.log('💡 4. Then try to sign in again');
        console.log('⚠️ === END EMAIL NOT CONFIRMED ===');
      } else {
        console.log('');
        console.log('❓ === UNKNOWN ERROR ===');
        console.log('❓ Unexpected error:', signInError.message);
        console.log('❓ === END UNKNOWN ERROR ===');
      }
    } else {
      console.log('✅ Sign in successful!');
      console.log('👤 User ID:', signInData.user.id);
      console.log('📧 Email:', signInData.user.email);
      console.log('🔐 Email confirmed:', signInData.user.email_confirmed_at ? 'Yes' : 'No');
      console.log('📅 Last sign in:', signInData.user.last_sign_in_at);
      console.log('📅 Created at:', signInData.user.created_at);
      
      // Sign out
      await supabase.auth.signOut();
      console.log('✅ Signed out successfully');
      
      console.log('');
      console.log('✅ === LOGIN WORKS! ===');
      console.log('✅ The password "Rua&Luna1" is correct for this user');
      console.log('✅ The user can login successfully');
      console.log('✅ === END LOGIN WORKS! ===');
    }

    // Step 2: Check if user exists in profiles table
    console.log('');
    console.log('🔍 === STEP 2: CHECKING PROFILES TABLE ===');
    console.log('🔍 Looking for user profile in database...');
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', testEmail)
      .single();

    if (profileError) {
      console.log('❌ Profile fetch error:', profileError.message);
      console.log('🔍 Error code:', profileError.code);
      
      if (profileError.code === 'PGRST116') {
        console.log('⚠️ No profile found in database (user exists in auth but not in profiles)');
      }
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
    }

    // Step 3: Try different password variations to see if there's a character issue
    console.log('');
    console.log('🔍 === STEP 3: TESTING PASSWORD VARIATIONS ===');
    console.log('🔍 Testing different password variations to identify the issue...');
    
    const passwordVariations = [
      'Rua&Luna1',
      'Rua&Luna1 ',
      ' Rua&Luna1',
      'Rua&Luna1\n',
      'Rua&Luna1\r',
      'Rua&Luna1\t',
      'Rua&Luna1\u00A0', // non-breaking space
      'Rua&Luna1\u200B', // zero-width space
      'Rua&Luna1\u200C', // zero-width non-joiner
      'Rua&Luna1\u200D', // zero-width joiner
      'Rua&Luna1\uFEFF', // zero-width no-break space
    ];

    for (let i = 0; i < passwordVariations.length; i++) {
      const variation = passwordVariations[i];
      console.log(`🔍 Testing variation ${i + 1}: "${variation}" (length: ${variation.length})`);
      
      const { data: testSignInData, error: testSignInError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: variation,
      });

      if (!testSignInError) {
        console.log(`✅ SUCCESS! Password variation ${i + 1} worked!`);
        console.log(`✅ The correct password is: "${variation}"`);
        await supabase.auth.signOut();
        break;
      } else if (testSignInError.message.includes('Invalid login credentials')) {
        console.log(`❌ Variation ${i + 1} failed: Invalid login credentials`);
      } else {
        console.log(`❌ Variation ${i + 1} failed: ${testSignInError.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

async function main() {
  console.log('🚀 Specific User 19-0120 Test');
  console.log('=============================');
  console.log('');

  await testSpecificUser19_0120();

  console.log('');
  console.log('🏁 Test complete!');
  console.log('');
  console.log('📋 SUMMARY:');
  console.log('📋 1. Tested sign in with exact credentials');
  console.log('📋 2. Checked if user exists in profiles table');
  console.log('📋 3. Tested password variations for character issues');
  console.log('📋 4. Identified the exact issue with this user');
  console.log('');
  console.log('🎯 NEXT STEPS:');
  console.log('🎯 1. If password mismatch: Reset password in Supabase Dashboard');
  console.log('🎯 2. If email not confirmed: Confirm user in Supabase Dashboard');
  console.log('🎯 3. If character issue: Use the correct password variation');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testSpecificUser19_0120
};
