// Debug the test logic for empty JSON handling

const crypto = require('crypto');

class MilitaryGradeEncryptionService {
  static get VERSION() { return '4.0'; }
  static get SECRET_KEY() { return 'debsmatch-military-grade-key-2024-ultra-secure'; }

  static decryptMessage(encryptedData, user1Id, user2Id) {
    try {
      if (!encryptedData || !user1Id || !user2Id) {
        throw new Error('Invalid input parameters');
      }

      // Handle empty JSON and malformed JSON
      if (encryptedData.trim() === '' || encryptedData.trim() === '{}') {
        throw new Error('Empty or invalid encrypted data');
      }

      let data;
      try {
        data = JSON.parse(encryptedData);
      } catch (parseError) {
        throw new Error('Invalid JSON format in encrypted data');
      }
      
      // Check if data is an object
      if (typeof data !== 'object' || data === null) {
        throw new Error('Encrypted data must be a valid JSON object');
      }
      
      if (!data.version || data.version !== this.VERSION) {
        throw new Error(`Unsupported encryption version: ${data.version || 'undefined'}`);
      }

      // Verify required fields with detailed error messages
      const missingFields = [];
      if (!data.iv) missingFields.push('iv');
      if (!data.ciphertext) missingFields.push('ciphertext');
      if (!data.tag) missingFields.push('tag');
      if (!data.aad) missingFields.push('aad');
      
      if (missingFields.length > 0) {
        throw new Error(`Invalid encrypted data structure - missing fields: ${missingFields.join(', ')}`);
      }

      return 'decrypted message';
    } catch (error) {
      throw new Error(`Message decryption failed: ${error.message}`);
    }
  }
}

console.log('🔍 DEBUGGING TEST LOGIC\n');

// Test the exact logic from the test script
function runTest(testName, testFunction) {
  try {
    const result = testFunction();
    if (result) {
      console.log(`✅ ${testName}: PASS`);
      return true;
    } else {
      console.log(`❌ ${testName}: FAIL`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${testName}: ERROR - ${error.message}`);
    return false;
  }
}

// Test empty JSON handling
runTest('Empty JSON Handling', () => {
  try {
    MilitaryGradeEncryptionService.decryptMessage('{}', 'test1', 'test2');
    return false; // Should fail
  } catch (error) {
    return true; // Expected to fail
  }
});

// Test malformed JSON handling
runTest('Malformed JSON Handling', () => {
  try {
    MilitaryGradeEncryptionService.decryptMessage('invalid json', 'test1', 'test2');
    return false; // Should fail
  } catch (error) {
    return true; // Expected to fail
  }
});

// Test empty string handling
runTest('Empty String Handling', () => {
  try {
    MilitaryGradeEncryptionService.decryptMessage('', 'test1', 'test2');
    return false; // Should fail
  } catch (error) {
    return true; // Expected to fail
  }
});
