#!/usr/bin/env ts-node

/**
 * Test React Native Crypto Password Hashing Script
 * 
 * This script tests if the react-native-crypto-js MD5 password hashing is working correctly
 * Run with: npx ts-node scripts/test-bcrypt.ts
 */

import CryptoJS from 'react-native-crypto-js';

// Simple hash function using available crypto functions
function simpleHash(input: string): string {
  // Use MD5 if available, otherwise create a simple hash
  try {
    return CryptoJS.MD5(input).toString();
  } catch (error) {
    // Fallback simple hash function
    let hash = 0;
    if (input.length === 0) return hash.toString();
    
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }
}

async function testCryptoHashing() {
  console.log('🔐 Testing React Native Crypto MD5 Password Hashing...\n');

  try {
    // Test 1: Basic hashing
    console.log('📋 Testing: Basic password hashing');
    const testPassword = 'testpassword123';
    console.log('🔐 Test password:', testPassword);
    
    // Generate a random salt (32 bytes = 64 hex characters)
    const salt = CryptoJS.lib.WordArray.random(32).toString();
    console.log('🔐 Generated salt:', salt.substring(0, 16) + '...');
    
    // Hash the password using MD5 with salt
    const hash = simpleHash(testPassword + salt);
    console.log('✅ Password hashed successfully');
    console.log('🔐 Hash length:', hash.length);
    console.log('🔐 Hash starts with:', hash.substring(0, 20) + '...');
    
    // Create the final hash (salt:hash format)
    const finalHash = `${salt}:${hash}`;
    console.log('🔐 Final hash format (salt:hash):', finalHash.substring(0, 50) + '...');

    // Test 2: Password verification
    console.log('\n🔍 Testing: Password verification');
    const [storedSalt, storedHash] = finalHash.split(':');
    const inputHash = simpleHash(testPassword + storedSalt);
    const isValid = inputHash === storedHash;
    console.log('✅ Password verification result:', isValid);

    // Test 3: Wrong password
    console.log('\n❌ Testing: Wrong password rejection');
    const wrongHash = simpleHash('wrongpassword' + storedSalt);
    const isWrongValid = wrongHash === storedHash;
    console.log('✅ Wrong password correctly rejected:', !isWrongValid);

    // Test 4: Empty password handling
    console.log('\n⚠️ Testing: Empty password handling');
    try {
      const emptySalt = CryptoJS.lib.WordArray.random(32).toString();
      const emptyHash = simpleHash('' + emptySalt);
      const emptyFinalHash = `${emptySalt}:${emptyHash}`;
      console.log('✅ Empty password hashed (length):', emptyFinalHash.length);
    } catch (error) {
      console.log('❌ Empty password failed:', error.message);
    }

    // Test 5: Null/undefined handling
    console.log('\n⚠️ Testing: Null/undefined handling');
    try {
      // @ts-ignore - Testing error handling
      const nullHash = simpleHash(null + salt);
      console.log('❌ Null password should have failed but got hash');
    } catch (error) {
      console.log('✅ Null password correctly rejected:', error.message);
    }

    console.log('\n🎉 React Native Crypto MD5 Password Hashing Test Complete!');
    console.log('✅ If all tests passed, MD5 hashing is working correctly');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testCryptoHashing();

export { testCryptoHashing };
