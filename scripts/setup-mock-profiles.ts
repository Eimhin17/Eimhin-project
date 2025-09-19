#!/usr/bin/env ts-node

/**
 * Mock Profile Setup Test Script
 * 
 * This script helps you test the mock profile setup
 * Run with: npx ts-node scripts/setup-mock-profiles.ts
 */

import { MockProfileService } from '../services/mockProfiles';

async function testMockProfileSetup() {
  console.log('🎭 Testing Mock Profile Setup...\n');

  try {
    // Test 1: Get available schools
    console.log('📚 Testing: Get Schools');
    const schoolsResult = await MockProfileService.getSchools();
    if (schoolsResult.success) {
      console.log(`✅ Found ${schoolsResult.schools?.length || 0} schools`);
    } else {
      console.log(`❌ Failed to get schools: ${schoolsResult.error}`);
    }

    // Test 2: Get available interests
    console.log('\n🎯 Testing: Get Interests');
    const interestsResult = await MockProfileService.getInterests();
    if (interestsResult.success) {
      console.log(`✅ Found ${interestsResult.interests?.length || 0} interests`);
    } else {
      console.log(`❌ Failed to get interests: ${interestsResult.error}`);
    }

    // Test 3: Get available profile prompts
    console.log('\n💬 Testing: Get Profile Prompts');
    const promptsResult = await MockProfileService.getProfilePrompts();
    if (promptsResult.success) {
      console.log(`✅ Found ${promptsResult.prompts?.length || 0} profile prompts`);
    } else {
      console.log(`❌ Failed to get profile prompts: ${promptsResult.error}`);
    }

    // Test 4: Get existing mock profiles
    console.log('\n👥 Testing: Get Existing Mock Profiles');
    const profilesResult = await MockProfileService.getActiveMockProfiles();
    if (profilesResult.success) {
      console.log(`✅ Found ${profilesResult.profiles?.length || 0} existing mock profiles`);
    } else {
      console.log(`❌ Failed to get profiles: ${profilesResult.error}`);
    }

    // Test 5: Create sample profiles (if none exist)
    if (profilesResult.success && profilesResult.profiles?.length === 0) {
      console.log('\n🚀 Testing: Create Sample Profiles');
      const createResult = await MockProfileService.createSampleMockProfiles();
      if (createResult.success) {
        console.log(`✅ Created ${createResult.count} sample profiles`);
      } else {
        console.log(`❌ Failed to create sample profiles: ${createResult.error}`);
      }
    }

    console.log('\n🎉 Mock Profile Setup Test Complete!');
    console.log('\nNext steps:');
    console.log('1. Check your app for the Mock Profiles tab');
    console.log('2. Navigate to Mock Profiles to see your profiles');
    console.log('3. Test swiping to see if mock profiles appear');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testMockProfileSetup();
}

export { testMockProfileSetup };
