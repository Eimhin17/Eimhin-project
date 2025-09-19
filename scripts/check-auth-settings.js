const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase configuration
const supabaseUrl = 'https://tagjfsxeutihwntpudsk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZ2pmc3hldXRpaHdudHB1ZHNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTkwNzgsImV4cCI6MjA3MDA5NTA3OH0.pvcZjPWdvIAbBXoZakS_kOlXfEbiUcvidXY1Oy2eFN0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAuthSettings() {
  console.log('🔐 === CHECKING SUPABASE AUTH SETTINGS ===');
  console.log('');

  try {
    // Test 1: Check if we can access auth settings
    console.log('🔄 Checking auth configuration...');
    
    // Note: We can't directly query auth settings from client
    // But we can infer them from behavior
    
    // Test 2: Create a test account and see what happens
    const testEmail = 'config-test-' + Date.now() + '@stkieranscollege.ie';
    const testPassword = 'password123';
    
    console.log('🧪 Creating test account to check settings...');
    console.log('📧 Test Email:', testEmail);
    console.log('🔑 Test Password:', testPassword);
    console.log('');
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });

    if (signUpError) {
      console.error('❌ Account creation failed:', signUpError.message);
      return;
    }

    if (signUpData.user) {
      console.log('✅ Account created successfully!');
      console.log('👤 User ID:', signUpData.user.id);
      console.log('📧 Email:', signUpData.user.email);
      console.log('🔐 Email confirmed:', signUpData.user.email_confirmed_at ? 'Yes' : 'No');
      console.log('📅 Created at:', signUpData.user.created_at);
      
      // Test 3: Try immediate sign in
      console.log('');
      console.log('🔄 Testing immediate sign in...');
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });

      if (signInError) {
        console.log('❌ Sign in failed:', signInError.message);
        console.log('🔍 Error code:', signInError.code);
        
        if (signInError.message.includes('Email not confirmed')) {
          console.log('');
          console.log('🚨 DIAGNOSIS: Email confirmation is REQUIRED');
          console.log('🚨 This is why your login is failing!');
          console.log('');
          console.log('💡 SOLUTION: Go to Supabase Dashboard → Authentication → Settings');
          console.log('💡 Turn OFF "Enable email confirmations" or turn ON "Auto-confirm emails"');
        }
      } else {
        console.log('✅ Sign in successful!');
        console.log('🔐 Email confirmation is NOT required');
      }
      
      // Clean up
      await supabase.auth.signOut();
    }

  } catch (error) {
    console.error('❌ Error checking auth settings:', error);
  }
}

async function testExistingUser() {
  console.log('');
  console.log('🔐 === TESTING EXISTING USER ===');
  console.log('');

  const testEmail = '19-0120@stkieranscollege.ie';
  const testPassword = 'Rua&Luna1';

  try {
    // Check if user exists and what their status is
    console.log('🔄 Checking existing user status...');
    
    // Try to sign in to see the exact error
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (signInError) {
      console.log('❌ Sign in failed:', signInError.message);
      console.log('🔍 Error code:', signInError.code);
      
      if (signInError.message.includes('Invalid login credentials')) {
        console.log('');
        console.log('🚨 DIAGNOSIS: Invalid credentials');
        console.log('🚨 This could mean:');
        console.log('🚨 1. Password is wrong');
        console.log('🚨 2. Email confirmation required');
        console.log('🚨 3. Account not properly created');
        console.log('');
        console.log('💡 NEXT STEP: Check Supabase Dashboard → Authentication → Users');
        console.log('💡 Look for user with email: 19-0120@stkieranscollege.ie');
        console.log('💡 Check if email is confirmed and what the actual password hash is');
      }
    } else {
      console.log('✅ Sign in successful!');
      console.log('👤 User ID:', signInData.user.id);
      console.log('🔐 Email confirmed:', signInData.user.email_confirmed_at ? 'Yes' : 'No');
    }

  } catch (error) {
    console.error('❌ Error testing existing user:', error);
  }
}

async function main() {
  console.log('🚀 Supabase Auth Configuration Checker');
  console.log('=====================================');
  console.log('');

  await checkAuthSettings();
  await testExistingUser();

  console.log('');
  console.log('🏁 Configuration check complete!');
  console.log('');
  console.log('📋 SUMMARY:');
  console.log('📋 1. Check Supabase Dashboard → Authentication → Settings');
  console.log('📋 2. Look for "Enable email confirmations" setting');
  console.log('📋 3. If ON, either turn OFF or enable "Auto-confirm emails"');
  console.log('📋 4. Check Authentication → Users for your existing user');
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  checkAuthSettings,
  testExistingUser
};
