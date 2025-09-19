// Test Authentication Fix
// This script will test if the authentication is now working properly

const { createClient } = require('@supabase/supabase-js');

// Replace with your actual Supabase credentials
const supabaseUrl = 'https://tagjfsxeutihwntpudsk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZ2pmc3hldXRpaHdudHB1ZHNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTkwNzgsImV4cCI6MjA3MDA5NTA3OH0.pvcZjPWdvIAbBXoZakS_kOlXfEbiUcvidXY1Oy2eFN0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuthentication() {
  console.log('🧪 Testing Authentication Fix...\n');

  // Test 1: Check if user exists in auth.users
  console.log('1️⃣ Checking if user exists in auth.users...');
  try {
    const { data: authUser, error: authError } = await supabase
      .from('auth.users')
      .select('*')
      .eq('email', '19-0120@stkieranscollege.ie')
      .single();

    if (authError) {
      console.log('❌ Error accessing auth.users:', authError.message);
      console.log('   This is expected - auth.users is not directly accessible via client');
    } else {
      console.log('✅ User found in auth.users:', authUser.id);
    }
  } catch (error) {
    console.log('ℹ️ auth.users not accessible via client (this is normal)');
  }

  // Test 2: Check if user has a profile
  console.log('\n2️⃣ Checking if user has a profile...');
  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', '3ad52668-be48-4ee7-b87c-3f6a0465f26f') // Use the UID from your dashboard
      .single();

    if (profileError) {
      console.log('❌ Error accessing profile:', profileError.message);
    } else {
      console.log('✅ Profile found:', {
        id: profile.id,
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: profile.email,
        has_password: profile.password ? 'YES' : 'NO'
      });
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test 3: Check database schema
  console.log('\n3️⃣ Checking database schema...');
  try {
    const { data: columns, error: columnsError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (columnsError) {
      console.log('❌ Error checking schema:', columnsError.message);
    } else {
      console.log('✅ Profiles table accessible');
      if (columns && columns.length > 0) {
        const sampleProfile = columns[0];
        console.log('   Sample profile fields:', Object.keys(sampleProfile));
      }
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test 4: Check if password field exists
  console.log('\n4️⃣ Checking for password field in profiles...');
  try {
    const { data: testProfile, error: testError } = await supabase
      .from('profiles')
      .select('password')
      .limit(1);

    if (testError) {
      if (testError.message.includes('column "password" does not exist')) {
        console.log('✅ Password field removed from profiles table');
      } else {
        console.log('❌ Error checking password field:', testError.message);
      }
    } else {
      console.log('⚠️ Password field still exists in profiles table');
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  console.log('\n🎯 Authentication Fix Test Complete!');
  console.log('\n📋 Next Steps:');
  console.log('1. Try signing in with your app again');
  console.log('2. If it still fails, check the Supabase logs');
  console.log('3. Verify that the user exists in both auth.users and profiles');
}

// Run the test
testAuthentication().catch(console.error);
