// Debug the test script key generation

const crypto = require('crypto');

class MilitaryGradeEncryptionService {
  static get VERSION() { return '4.0'; }
  static get SECRET_KEY() { return 'debsmatch-military-grade-key-2024-ultra-secure'; }

  static generateConversationKey(user1Id, user2Id) {
    try {
      const combined = user1Id < user2Id ? `${user1Id}_${user2Id}` : `${user2Id}_${user1Id}`;
      const salt = this.createConversationSalt(combined);
      const derivedKey = this.pbkdf2(this.SECRET_KEY, salt, 32, 100000);
      
      console.log('Debug - derivedKey length:', derivedKey.length);
      console.log('Debug - derivedKey:', derivedKey);
      
      // Ensure we have exactly 256 bits (64 hex characters)
      if (derivedKey.length < 64) {
        console.log('Key too short, adding padding...');
        const additionalKey = this.pbkdf2(derivedKey + this.SECRET_KEY, salt, 32, 1000);
        const result = (derivedKey + additionalKey).substring(0, 64);
        console.log('Debug - final key length:', result.length);
        console.log('Debug - final key:', result);
        return result;
      }
      
      const result = derivedKey.substring(0, 64);
      console.log('Debug - final key length:', result.length);
      console.log('Debug - final key:', result);
      return result;
    } catch (error) {
      throw new Error('Key generation failed');
    }
  }

  static createConversationSalt(conversationId) {
    const conversationHash = this.sha256(conversationId);
    const secretHash = this.sha256(this.SECRET_KEY);
    return this.sha256(conversationHash + secretHash);
  }

  static sha256(str) {
    return crypto.createHash('sha256').update(str).digest('hex');
  }

  static pbkdf2(password, salt, keylen, iterations) {
    return crypto.pbkdf2Sync(password, salt, iterations, keylen, 'sha256').toString('hex');
  }
}

console.log('🔍 DEBUGGING TEST KEY GENERATION\n');

const key = MilitaryGradeEncryptionService.generateConversationKey('test1', 'test2');
console.log('\nFinal result:');
console.log('Key length:', key.length);
console.log('Key:', key);
console.log('Is 64 chars?', key.length === 64);
