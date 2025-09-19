const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase configuration
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Make sure you have EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSignIn(email, password) {
  console.log('🔐 Testing Supabase Auth Sign In...');
  console.log('📧 Email:', email);
  console.log('🔑 Password:', password);
  console.log('---');

  try {
    // Test 1: Sign In with Email/Password
    console.log('🔄 Attempting sign in...');
      const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
      });
      
      if (error) {
      console.error('❌ Sign in failed:', error.message);
      console.error('🔍 Error details:', error);
        return false;
    }

    if (data.user) {
      console.log('✅ Sign in successful!');
      console.log('👤 User ID:', data.user.id);
      console.log('📧 Email:', data.user.email);
      console.log('📅 Created at:', data.user.created_at);
      console.log('🔐 Email confirmed:', data.user.email_confirmed_at ? 'Yes' : 'No');
      console.log('📱 Phone confirmed:', data.user.phone_confirmed_at ? 'Yes' : 'No');
      console.log('🎭 User metadata:', data.user.user_metadata);
      console.log('---');
      
      // Test 2: Get current user
      console.log('🔄 Getting current user...');
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('❌ Get user failed:', userError.message);
      } else if (user) {
        console.log('✅ Current user retrieved successfully');
        console.log('👤 Current user ID:', user.id);
      }
      
      // Test 3: Get user profile from database
      console.log('🔄 Getting user profile from database...');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
      
      if (profileError) {
        console.error('❌ Get profile failed:', profileError.message);
      } else if (profile) {
        console.log('✅ User profile retrieved successfully');
        console.log('📊 Profile data:', JSON.stringify(profile, null, 2));
      }
      
      return true;
    } else {
      console.error('❌ No user data returned');
      return false;
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
        return false;
  }
}

async function testSignOut() {
  console.log('🔄 Testing sign out...');
  
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('❌ Sign out failed:', error.message);
          return false;
        }
        
    console.log('✅ Sign out successful');
          return true;
  } catch (error) {
    console.error('❌ Unexpected error during sign out:', error);
          return false;
        }
      }
      
async function testPasswordReset(email) {
  console.log('🔄 Testing password reset...');
  console.log('📧 Email:', email);
  
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'http://localhost:3000/reset-password'
    });
    
    if (error) {
      console.error('❌ Password reset failed:', error.message);
      return false;
    }
    
    console.log('✅ Password reset email sent successfully');
    console.log('📧 Check your email for the reset link');
    return true;
  } catch (error) {
    console.error('❌ Unexpected error during password reset:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Supabase Auth Testing Script');
  console.log('================================');
  console.log('');

  // Test credentials - CHANGE THESE TO MATCH YOUR USER
  const testEmail = '19-0120@stkieranscollege.ie';
  const testPassword = 'Rua&Luna1'; // Change this to the actual password

  console.log('🧪 Test Configuration:');
  console.log('📧 Test Email:', testEmail);
  console.log('🔑 Test Password:', testPassword);
  console.log('');

  // Test 1: Sign In
  const signInSuccess = await testSignIn(testEmail, testPassword);
  
  if (signInSuccess) {
    console.log('🎉 All tests completed successfully!');
    
    // Test 2: Sign Out
    await testSignOut();
        } else {
    console.log('💡 Testing password reset as fallback...');
    await testPasswordReset(testEmail);
  }

  console.log('');
  console.log('🏁 Testing complete!');
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testSignIn,
  testSignOut,
  testPasswordReset
};
