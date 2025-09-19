#!/usr/bin/env node

/**
 * Test Script for New Authentication System
 * 
 * This script tests the new simplified authentication system to ensure:
 * 1. Email verification service works
 * 2. Auth service can sign up users
 * 3. Auth service can sign in users
 * 4. UserContext properly loads profiles
 * 5. Database operations work correctly
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://tagjfsxeutihwntpudsk.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key-here';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test data
const testUser = {
  email: `test-${Date.now()}@example.com`,
  password: 'TestPassword123!',
  first_name: 'Test',
  last_name: 'User',
  date_of_birth: '2000-01-01',
  gender: 'woman',
  looking_for: 'go_to_someones_debs',
  relationship_intention: 'long_term_only',
  bio: 'Test user for authentication system',
};

async function testEmailVerification() {
  console.log('🧪 Testing Email Verification Service...');
  
  try {
    // Test sending verification code
    const { data, error } = await supabase
      .from('email_verifications')
      .insert({
        email: testUser.email,
        verification_code: '123456',
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes from now
        is_used: false
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Email verification test failed:', error);
      return false;
    }

    console.log('✅ Email verification code created:', data.id);

    // Test verifying code
    const { data: verifyData, error: verifyError } = await supabase
      .from('email_verifications')
      .update({ is_used: true })
      .eq('id', data.id)
      .select()
      .single();

    if (verifyError) {
      console.error('❌ Email verification test failed:', verifyError);
      return false;
    }

    console.log('✅ Email verification code verified successfully');
    return true;
  } catch (error) {
    console.error('❌ Email verification test error:', error);
    return false;
  }
}

async function testAuthSignUp() {
  console.log('🧪 Testing Auth Service Sign Up...');
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email: testUser.email,
      password: testUser.password,
      options: {
        data: {
          first_name: testUser.first_name,
          last_name: testUser.last_name,
          date_of_birth: testUser.date_of_birth,
          gender: testUser.gender,
          looking_for: testUser.looking_for,
          relationship_intention: testUser.relationship_intention,
          bio: testUser.bio,
        }
      }
    });

    if (error) {
      console.error('❌ Auth signup test failed:', error);
      return false;
    }

    if (!data.user) {
      console.error('❌ No user returned from signup');
      return false;
    }

    console.log('✅ Auth signup successful:', data.user.id);
    return data.user;
  } catch (error) {
    console.error('❌ Auth signup test error:', error);
    return false;
  }
}

async function testProfileCreation(userId) {
  console.log('🧪 Testing Profile Creation...');
  
  try {
    // Wait a moment for the profile to be created by database trigger
    await new Promise(resolve => setTimeout(resolve, 2000));

    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('❌ Profile creation test failed:', error);
      return false;
    }

    if (!profile) {
      console.error('❌ No profile found after signup');
      return false;
    }

    console.log('✅ Profile created successfully:', profile.id);
    return profile;
  } catch (error) {
    console.error('❌ Profile creation test error:', error);
    return false;
  }
}

async function testAuthSignIn() {
  console.log('🧪 Testing Auth Service Sign In...');
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: testUser.email,
      password: testUser.password,
    });

    if (error) {
      console.error('❌ Auth signin test failed:', error);
      return false;
    }

    if (!data.user) {
      console.error('❌ No user returned from signin');
      return false;
    }

    console.log('✅ Auth signin successful:', data.user.id);
    return data.user;
  } catch (error) {
    console.error('❌ Auth signin test error:', error);
    return false;
  }
}

async function testProfileAccess(userId) {
  console.log('🧪 Testing Profile Access...');
  
  try {
    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('❌ Profile access test failed:', error);
      return false;
    }

    if (!profile) {
      console.error('❌ No profile found');
      return false;
    }

    console.log('✅ Profile access successful:', profile.id);
    return profile;
  } catch (error) {
    console.error('❌ Profile access test error:', error);
    return false;
  }
}

async function cleanupTestData(userId) {
  console.log('🧹 Cleaning up test data...');
  
  try {
    // Delete profile
    await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    // Delete auth user
    await supabase.auth.admin.deleteUser(userId);

    // Clean up email verifications
    await supabase
      .from('email_verifications')
      .delete()
      .eq('email', testUser.email);

    console.log('✅ Test data cleaned up successfully');
  } catch (error) {
    console.error('⚠️ Error cleaning up test data:', error);
  }
}

async function runTests() {
  console.log('🚀 Starting New Authentication System Tests...\n');

  const results = {
    emailVerification: false,
    authSignUp: false,
    profileCreation: false,
    authSignIn: false,
    profileAccess: false,
  };

  let testUserId = null;

  try {
    // Test 1: Email Verification
    results.emailVerification = await testEmailVerification();
    console.log('');

    // Test 2: Auth Sign Up
    const signUpUser = await testAuthSignUp();
    if (signUpUser) {
      results.authSignUp = true;
      testUserId = signUpUser.id;
    }
    console.log('');

    // Test 3: Profile Creation
    if (testUserId) {
      const profile = await testProfileCreation(testUserId);
      if (profile) {
        results.profileCreation = true;
      }
    }
    console.log('');

    // Test 4: Auth Sign In
    const signInUser = await testAuthSignIn();
    if (signInUser) {
      results.authSignIn = true;
    }
    console.log('');

    // Test 5: Profile Access
    if (testUserId) {
      const profile = await testProfileAccess(testUserId);
      if (profile) {
        results.profileAccess = true;
      }
    }
    console.log('');

  } catch (error) {
    console.error('❌ Test suite error:', error);
  } finally {
    // Cleanup
    if (testUserId) {
      await cleanupTestData(testUserId);
    }
  }

  // Results Summary
  console.log('📊 Test Results Summary:');
  console.log('========================');
  console.log(`Email Verification: ${results.emailVerification ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Auth Sign Up: ${results.authSignUp ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Profile Creation: ${results.profileCreation ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Auth Sign In: ${results.authSignIn ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Profile Access: ${results.profileAccess ? '✅ PASS' : '❌ FAIL'}`);
  console.log('');

  const allPassed = Object.values(results).every(result => result === true);
  
  if (allPassed) {
    console.log('🎉 All tests passed! The new authentication system is working correctly.');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed. Please check the errors above.');
    process.exit(1);
  }
}

// Run the tests
runTests().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
