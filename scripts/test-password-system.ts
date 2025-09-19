#!/usr/bin/env ts-node

/**
 * Test Password System Script
 * 
 * This script tests the new password-based authentication system
 * Run with: npx ts-node scripts/test-password-system.ts
 */

import { supabase } from '../lib/supabase';
import bcrypt from 'bcryptjs';

async function testPasswordSystem() {
  console.log('🔐 Testing Password System...\n');

  try {
    // Test 1: Check if password_hash column exists
    console.log('📋 Testing: Check password_hash column');
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'users')
      .eq('column_name', 'password_hash');

    if (columnsError) {
      console.log('❌ Error checking columns:', columnsError);
      return;
    }

    if (columns && columns.length > 0) {
      console.log('✅ password_hash column exists');
    } else {
      console.log('❌ password_hash column not found. Please run the database migration first.');
      console.log('📝 Run the SQL in database/add-password-support.sql in your Supabase dashboard');
      return;
    }

    // Test 2: Create a test user with password
    console.log('\n👤 Testing: Create test user with password');
    const testEmail = 'testuser@example.com';
    const testPassword = 'testpassword123';
    
    // Hash the password
    const passwordHash = await bcrypt.hash(testPassword, 12);
    console.log('✅ Password hashed successfully');

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('school_email', testEmail)
      .single();

    if (existingUser && !checkError) {
      console.log('ℹ️ Test user already exists, updating password');
      
      // Update the existing user's password
      const { error: updateError } = await supabase
        .from('users')
        .update({
          password_hash: passwordHash,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingUser.id);

      if (updateError) {
        console.log('❌ Failed to update password:', updateError);
        return;
      }
      
      console.log('✅ Test user password updated');
    } else {
      console.log('ℹ️ Creating new test user');
      
      // Get a school ID
      const { data: schools, error: schoolsError } = await supabase
        .from('schools')
        .select('id')
        .limit(1);

      if (schoolsError || !schools || schools.length === 0) {
        console.log('❌ No schools found. Please run the database setup first.');
        return;
      }

      const schoolId = schools[0].id;
      
      // Create the test user
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          id: 'test-user-' + Date.now(),
          school_email: testEmail,
          password_hash: passwordHash,
          first_name: 'Test',
          last_name: 'User',
          date_of_birth: '2005-06-15',
          gender: 'woman',
          looking_for: 'go_to_someones_debs',
          relationship_intention: 'short_term_but_open_to_long_term',
          bio: 'This is a test user for testing the password system',
          school_id: schoolId,
          school_email_verified: true,
          onboarding_completed: true,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        console.log('❌ Failed to create test user:', insertError);
        return;
      }
      
      console.log('✅ Test user created successfully');
    }

    // Test 3: Verify password works
    console.log('\n🔍 Testing: Verify password verification');
    const { data: userToVerify, error: verifyError } = await supabase
      .from('users')
      .select('password_hash')
      .eq('school_email', testEmail)
      .single();

    if (verifyError || !userToVerify) {
      console.log('❌ Failed to get user for verification:', verifyError);
      return;
    }

    const isPasswordValid = await bcrypt.compare(testPassword, userToVerify.password_hash);
    
    if (isPasswordValid) {
      console.log('✅ Password verification successful');
    } else {
      console.log('❌ Password verification failed');
      return;
    }

    // Test 4: Test with wrong password
    console.log('\n❌ Testing: Wrong password rejection');
    const isWrongPasswordValid = await bcrypt.compare('wrongpassword', userToVerify.password_hash);
    
    if (!isWrongPasswordValid) {
      console.log('✅ Wrong password correctly rejected');
    } else {
      console.log('❌ Wrong password incorrectly accepted');
      return;
    }

    console.log('\n🎉 Password System Test Complete!');
    console.log('\nTest Credentials:');
    console.log('📧 Email: testuser@example.com');
    console.log('🔑 Password: testpassword123');
    console.log('\n🚀 You can now test the login system with these credentials!');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testPasswordSystem();
}

export { testPasswordSystem };
