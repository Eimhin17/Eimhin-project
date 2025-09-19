// Debug empty JSON handling

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

console.log('🔍 DEBUGGING EMPTY JSON HANDLING\n');

// Test empty JSON
console.log('Testing empty JSON "{}":');
try {
  MilitaryGradeEncryptionService.decryptMessage('{}', 'test1', 'test2');
  console.log('❌ Should have failed but succeeded');
} catch (error) {
  console.log('✅ Correctly failed:', error.message);
}

// Test empty string
console.log('\nTesting empty string "":');
try {
  MilitaryGradeEncryptionService.decryptMessage('', 'test1', 'test2');
  console.log('❌ Should have failed but succeeded');
} catch (error) {
  console.log('✅ Correctly failed:', error.message);
}

// Test whitespace
console.log('\nTesting whitespace "   ":');
try {
  MilitaryGradeEncryptionService.decryptMessage('   ', 'test1', 'test2');
  console.log('❌ Should have failed but succeeded');
} catch (error) {
  console.log('✅ Correctly failed:', error.message);
}
