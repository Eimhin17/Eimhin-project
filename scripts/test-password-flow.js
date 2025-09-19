const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase configuration - use the same as your app
const supabaseUrl = 'https://tagjfsxeutihwntpudsk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZ2pmc3hldXRpaHdudHB1ZHNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTkwNzgsImV4cCI6MjA3MDA5NTA3OH0.pvcZjPWdvIAbBXoZakS_kOlXfEbiUcvidXY1Oy2eFN0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testPasswordFlow() {
  console.log('🔐 === TESTING PASSWORD FLOW ===');
  console.log('🔐 This will test the exact same flow that happens during onboarding');
  console.log('');

  // Test credentials - CHANGE THESE TO MATCH YOUR USER
  const testEmail = '19-0120@stkieranscollege.ie';
  const testPassword = 'Rua&Luna1'; // This should be the password you created during onboarding

  console.log('🧪 Test Configuration:');
  console.log('📧 Test Email:', testEmail);
  console.log('🔑 Test Password:', testPassword);
  console.log('');

  try {
    // Step 1: Try to sign in with the credentials
    console.log('🔄 Step 1: Testing sign in with credentials...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (signInError) {
      console.error('❌ Sign in failed:', signInError.message);
      console.error('🔍 Error details:', signInError);
      
      // Step 2: Check what's actually stored in auth.users
      console.log('');
      console.log('🔄 Step 2: Checking what\'s stored in auth.users...');
      
      // Note: We can't directly query auth.users from client, but we can check the error
      if (signInError.message.includes('Invalid login credentials')) {
        console.log('🚨 INVALID LOGIN CREDENTIALS ERROR');
        console.log('🚨 This means either:');
        console.log('🚨 1. The password is wrong');
        console.log('🚨 2. The account was created with a different password');
        console.log('🚨 3. The account wasn\'t created properly');
      }
      
      return false;
    }

    if (signInData.user) {
      console.log('✅ Sign in successful!');
      console.log('👤 User ID:', signInData.user.id);
      console.log('📧 Email:', signInData.user.email);
      console.log('📅 Created at:', signInData.user.created_at);
      console.log('🔐 Email confirmed:', signInData.user.email_confirmed_at ? 'Yes' : 'No');
      
      // Step 3: Check if profile exists
      console.log('');
      console.log('🔄 Step 3: Checking if profile exists...');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', signInData.user.id)
        .single();
      
      if (profileError) {
        console.error('❌ Profile fetch error:', profileError.message);
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
    } else {
      console.error('❌ No user data returned from signin');
      return false;
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

async function testAccountCreation() {
  console.log('');
  console.log('🔐 === TESTING ACCOUNT CREATION ===');
  console.log('🔐 This will test creating a new account to see what happens');
  console.log('');

  const testEmail = 'test-' + Date.now() + '@stkieranscollege.ie';
  const testPassword = 'TestPassword123!';

  console.log('🧪 Test Account Creation:');
  console.log('📧 Test Email:', testEmail);
  console.log('🔑 Test Password:', testPassword);
  console.log('');

  try {
    // Create a new account
    console.log('🔄 Creating new account...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          first_name: 'Test',
          last_name: 'User',
          date_of_birth: '2000-01-01',
          gender: 'woman',
          looking_for: 'go_to_someones_debs',
          relationship_intention: 'long_term_only',
          bio: 'Test user for debugging',
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
      
      // Try to sign in immediately
      console.log('');
      console.log('🔄 Testing immediate sign in...');
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });

      if (signInError) {
        console.error('❌ Immediate sign in failed:', signInError.message);
      } else {
        console.log('✅ Immediate sign in successful!');
      }
      
      // Clean up - sign out
      await supabase.auth.signOut();
      return true;
    } else {
      console.error('❌ No user data returned from signup');
      return false;
    }

  } catch (error) {
    console.error('❌ Unexpected error in account creation:', error);
    return false;
  }
}

async function testSimplePassword() {
  console.log('');
  console.log('🔐 === TESTING SIMPLE PASSWORD ===');
  console.log('🔐 This will test with a simple password to rule out complexity issues');
  console.log('');

  const testEmail = 'simple-test-' + Date.now() + '@stkieranscollege.ie';
  const simplePassword = 'password123'; // Simple password without special characters

  console.log('🧪 Simple Password Test:');
  console.log('📧 Test Email:', testEmail);
  console.log('🔑 Simple Password:', simplePassword);
  console.log('');

  try {
    // Create account with simple password
    console.log('🔄 Creating account with simple password...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
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

    if (signUpError) {
      console.error('❌ Simple password account creation failed:', signUpError.message);
      return false;
    }

    if (signUpData.user) {
      console.log('✅ Simple password account created successfully!');
      console.log('👤 User ID:', signUpData.user.id);
      console.log('📧 Email:', signUpData.user.email);
      
      // Try to sign in immediately
      console.log('');
      console.log('🔄 Testing immediate sign in with simple password...');
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: simplePassword,
      });

      if (signInError) {
        console.error('❌ Simple password sign in failed:', signInError.message);
        console.error('🔍 Error details:', signInError);
      } else {
        console.log('✅ Simple password sign in successful!');
      }
      
      // Clean up - sign out
      await supabase.auth.signOut();
      return true;
    } else {
      console.error('❌ No user data returned from simple password signup');
      return false;
    }

  } catch (error) {
    console.error('❌ Unexpected error in simple password test:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Password Flow Debugging Script');
  console.log('==================================');
  console.log('');

  // Test 1: Try to sign in with existing credentials
  const signInSuccess = await testPasswordFlow();
  
  if (!signInSuccess) {
    console.log('');
    console.log('💡 Sign in failed. Testing account creation to see if that works...');
    await testAccountCreation();
    
    console.log('');
    console.log('💡 Testing with simple password to rule out complexity issues...');
    await testSimplePassword();
  }

  console.log('');
  console.log('🏁 Testing complete!');
  console.log('');
  
  if (!signInSuccess) {
    console.log('🔍 DIAGNOSIS:');
    console.log('🔍 The password flow issue is likely one of these:');
    console.log('🔍 1. Password not properly saved during onboarding');
    console.log('🔍 2. Account created with fallback password');
    console.log('🔍 3. Password lost between UserContext and account creation');
    console.log('🔍 4. Database trigger not working properly');
    console.log('🔍 5. Supabase Auth configuration issues');
    console.log('🔍 6. Email confirmation required before login');
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testPasswordFlow,
  testAccountCreation
};
