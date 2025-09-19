#!/usr/bin/env ts-node

/**
 * Create Test User Script
 * 
 * This script creates a simple test user in the database
 * Run with: npx ts-node scripts/create-test-user.ts
 */

import { supabase } from '../lib/supabase';

async function createTestUser() {
  console.log('👤 Creating Test User...\n');

  try {
    // First, let's check if we have any schools
    const { data: schools, error: schoolsError } = await supabase
      .from('schools')
      .select('id, name')
      .limit(1);

    if (schoolsError || !schools || schools.length === 0) {
      console.log('❌ No schools found. Please run the database setup first.');
      return;
    }

    const schoolId = schools[0].id;
    console.log(`✅ Using school: ${schools[0].name}`);

    // Create a test user
    const testUser = {
      id: 'test-user-123', // We'll use a simple ID for testing
      school_email: 'test@example.com',
      school_email_verified: true,
      first_name: 'Test',
      last_name: 'User',
      date_of_birth: '2005-06-15',
      gender: 'woman',
      looking_for: 'go_to_someones_debs',
      relationship_intention: 'short_term_but_open_to_long_term',
      bio: 'This is a test user for testing the login system',
      school_id: schoolId,
      onboarding_completed: true,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('school_email', testUser.school_email)
      .single();

    if (existingUser && !checkError) {
      console.log('ℹ️ Test user already exists');
      console.log('📧 Email: test@example.com');
      console.log('🔑 Password: any password will work');
      return;
    }

    // Insert the test user
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert(testUser)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Failed to create test user:', insertError);
      return;
    }

    console.log('✅ Test user created successfully!');
    console.log('📧 Email: test@example.com');
    console.log('🔑 Password: any password will work');
    console.log('👤 Name: Test User');
    console.log('🏫 School: ' + schools[0].name);
    console.log('\n🚀 You can now test the login system with these credentials!');

  } catch (error) {
    console.error('❌ Error creating test user:', error);
  }
}

// Run the function if this script is executed directly
if (require.main === module) {
  createTestUser();
}

export { createTestUser };
