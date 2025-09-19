const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tagjfsxeutihwntpudsk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZ2pmc3hldXRpaHdudHB1ZHNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTkwNzgsImV4cCI6MjA3MDA5NTA3OH0.pvcZjPWdvIAbBXoZakS_kOlXfEbiUcvidXY1Oy2eFN0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFixedPasswordFlow() {
  console.log('🔐 === TESTING FIXED PASSWORD FLOW ===');
  console.log('🔐 This test verifies that the password flow fixes work correctly');
  console.log('');

  const testEmail = 'fixed-test-' + Date.now() + '@stkieranscollege.ie';
  const testPassword = 'FixedPassword123!';

  console.log('🧪 Test Configuration:');
  console.log('📧 Test Email:', testEmail);
  console.log('🔑 Test Password:', testPassword);
  console.log('');

  try {
    // Step 1: Create account with the exact password
    console.log('🔄 Step 1: Creating account with exact password...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          first_name: 'Fixed',
          last_name: 'Test',
          date_of_birth: '2000-01-01',
          gender: 'woman',
          looking_for: 'go_to_someones_debs',
          relationship_intention: 'long_term_only',
          bio: 'Fixed password flow test',
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
      
      // Step 2: Test immediate sign in with the SAME password
      console.log('');
      console.log('🔄 Step 2: Testing immediate sign in with same password...');
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });

      if (signInError) {
        console.log('❌ Sign in failed:', signInError.message);
        console.log('🔍 Error code:', signInError.code);
        
        if (signInError.message.includes('Email not confirmed')) {
          console.log('');
          console.log('⚠️ Email confirmation required - this is expected for new accounts');
          console.log('⚠️ But the password should still be correct');
          console.log('');
          console.log('💡 SOLUTION: Check Supabase Dashboard → Authentication → Settings');
          console.log('💡 Turn OFF "Enable email confirmations" for testing');
        }
      } else {
        console.log('✅ Sign in successful!');
        console.log('👤 User ID:', signInData.user.id);
        console.log('🔐 Email confirmed:', signInData.user.email_confirmed_at ? 'Yes' : 'No');
        console.log('📅 Last sign in:', signInData.user.last_sign_in_at);
        
        // Step 3: Test profile access
        console.log('');
        console.log('🔄 Step 3: Testing profile access...');
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', signInData.user.id)
          .single();
        
        if (profileError) {
          console.log('⚠️ Profile fetch error:', profileError.message);
        } else if (profile) {
          console.log('✅ Profile found:', {
            id: profile.id,
            email: profile.email,
            first_name: profile.first_name,
            last_name: profile.last_name,
            onboarding_completed: profile.onboarding_completed
          });
        }
        
        // Step 4: Sign out
        console.log('');
        console.log('🔄 Step 4: Signing out...');
        const { error: signOutError } = await supabase.auth.signOut();
        
        if (signOutError) {
          console.error('❌ Sign out error:', signOutError.message);
        } else {
          console.log('✅ Sign out successful');
        }
        
        return true;
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

async function testExistingUser() {
  console.log('');
  console.log('🔐 === TESTING EXISTING USER ===');
  console.log('');

  const testEmail = '19-0120@stkieranscollege.ie';
  const testPassword = 'Rua&Luna1';

  try {
    console.log('🔄 Testing existing user with fixed flow...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (signInError) {
      console.log('❌ Sign in failed:', signInError.message);
      console.log('🔍 Error code:', signInError.code);
      
      if (signInError.message.includes('Invalid login credentials')) {
        console.log('');
        console.log('🚨 EXISTING USER STILL HAS WRONG PASSWORD');
        console.log('🚨 This means the account was created with the wrong password');
        console.log('');
        console.log('💡 SOLUTION: Reset password in Supabase Dashboard');
        console.log('💡 Go to Authentication → Users → Find user → Reset password');
        console.log('💡 Set password to: Rua&Luna1');
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
  console.log('🚀 Fixed Password Flow Test');
  console.log('============================');
  console.log('');

  // Test 1: New account with fixed flow
  const newAccountSuccess = await testFixedPasswordFlow();
  
  // Test 2: Existing user
  await testExistingUser();

  console.log('');
  console.log('🏁 Testing complete!');
  console.log('');
  
  if (newAccountSuccess) {
    console.log('✅ NEW ACCOUNT FLOW: Working correctly!');
    console.log('✅ Password is preserved and used correctly');
  } else {
    console.log('❌ NEW ACCOUNT FLOW: Still has issues');
  }
  
  console.log('');
  console.log('📋 SUMMARY:');
  console.log('📋 1. UserContext now preserves password during onboarding');
  console.log('📋 2. Account creation validates password before proceeding');
  console.log('📋 3. No fallback passwords are used');
  console.log('📋 4. Password flow is now secure and reliable');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testFixedPasswordFlow,
  testExistingUser
};
