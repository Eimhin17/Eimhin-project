// Test the real encryption flow to identify the base64 issue

const crypto = require('crypto');

// Mock the actual production encryption service
class ProductionEncryptionService {
  static get VERSION() { return '4.0'; }
  static get SECRET_KEY() { return 'debsmatch-military-grade-key-2024-ultra-secure'; }

  static generateConversationKey(user1Id, user2Id) {
    const combined = user1Id < user2Id ? `${user1Id}_${user2Id}` : `${user2Id}_${user1Id}`;
    const salt = this.createConversationSalt(combined);
    const derivedKey = this.pbkdf2(this.SECRET_KEY, salt, 32, 100000);
    
    if (derivedKey.length < 64) {
      const additionalKey = this.pbkdf2(derivedKey + this.SECRET_KEY, salt, 32, 1000);
      return (derivedKey + additionalKey).substring(0, 64);
    }
    
    return derivedKey.substring(0, 64);
  }

  static createConversationSalt(conversationId) {
    const conversationHash = this.sha256(conversationId);
    const secretHash = this.sha256(this.SECRET_KEY);
    return this.sha256(conversationHash + secretHash);
  }

  static createAAD(user1Id, user2Id) {
    const orderedIds = user1Id < user2Id ? `${user1Id}_${user2Id}` : `${user2Id}_${user1Id}`;
    const aadData = `${orderedIds}_${this.VERSION}`;
    return this.sha256(aadData);
  }

  static encryptMessage(messageText, user1Id, user2Id) {
    if (!messageText || !user1Id || !user2Id) {
      throw new Error('Invalid input parameters');
    }

    const conversationKey = this.generateConversationKey(user1Id, user2Id);
    const iv = this.randomBytes(12);
    const salt = this.randomBytes(32);
    const aad = this.createAAD(user1Id, user2Id);
    
    // Simulate AES encryption
    const encrypted = this.simulateAESGCM(messageText, conversationKey, iv);
    
    const result = {
      version: this.VERSION,
      iv: iv,
      salt: salt,
      ciphertext: Buffer.from(encrypted.ciphertext).toString('base64'),
      tag: encrypted.tag,
      aad: aad,
      timestamp: Date.now(),
      nonce: this.randomBytes(16)
    };

    return JSON.stringify(result);
  }

  static decryptMessage(encryptedData, user1Id, user2Id) {
    if (!encryptedData || !user1Id || !user2Id) {
      throw new Error('Invalid input parameters');
    }

    if (encryptedData.trim() === '' || encryptedData.trim() === '{}') {
      throw new Error('Empty or invalid encrypted data');
    }

    let data;
    try {
      data = JSON.parse(encryptedData);
    } catch (parseError) {
      throw new Error('Invalid JSON format in encrypted data');
    }
    
    if (typeof data !== 'object' || data === null) {
      throw new Error('Encrypted data must be a valid JSON object');
    }
    
    if (!data.version || data.version !== this.VERSION) {
      throw new Error(`Unsupported encryption version: ${data.version || 'undefined'}`);
    }

    const missingFields = [];
    if (!data.iv) missingFields.push('iv');
    if (!data.ciphertext) missingFields.push('ciphertext');
    if (!data.tag) missingFields.push('tag');
    if (!data.aad) missingFields.push('aad');
    
    if (missingFields.length > 0) {
      throw new Error(`Invalid encrypted data structure - missing fields: ${missingFields.join(', ')}`);
    }

    const conversationKey = this.generateConversationKey(user1Id, user2Id);
    
    const expectedAad = this.createAAD(user1Id, user2Id);
    if (data.aad !== expectedAad) {
      throw new Error('Authentication data mismatch - possible tampering');
    }
    
    // This is where the issue likely occurs - base64 decoding
    console.log('🔍 Debug - ciphertext:', data.ciphertext.substring(0, 50) + '...');
    console.log('🔍 Debug - ciphertext length:', data.ciphertext.length);
    
    try {
      const encrypted = Buffer.from(data.ciphertext, 'base64');
      console.log('✅ Base64 decode successful, length:', encrypted.length);
      
      const decrypted = this.simulateAESGCMDecrypt(encrypted, conversationKey, data.iv, data.tag);
      
      if (!decrypted) {
        throw new Error('Decryption failed - possible tampering or wrong key');
      }

      return decrypted;
    } catch (base64Error) {
      console.error('❌ Base64 decode error:', base64Error.message);
      console.error('❌ Problematic ciphertext:', data.ciphertext);
      throw new Error(`Base64 decode failed: ${base64Error.message}`);
    }
  }

  static isEncryptedByThisService(encryptedData) {
    try {
      const data = JSON.parse(encryptedData);
      return data.version === this.VERSION && 
             data.iv && 
             data.ciphertext && 
             data.tag && 
             data.aad &&
             data.timestamp &&
             data.nonce;
    } catch (error) {
      return false;
    }
  }

  // Helper methods
  static sha256(str) {
    return crypto.createHash('sha256').update(str).digest('hex');
  }

  static pbkdf2(password, salt, keylen, iterations) {
    return crypto.pbkdf2Sync(password, salt, iterations, keylen, 'sha256').toString('hex');
  }

  static randomBytes(length) {
    return crypto.randomBytes(length).toString('hex');
  }

  static simulateAESGCM(text, key, iv) {
    const encrypted = this.simpleEncrypt(text, key, iv);
    const tag = this.sha256(encrypted + key + iv).slice(-32);
    return { ciphertext: encrypted, tag };
  }

  static simulateAESGCMDecrypt(encrypted, key, iv, tag) {
    const expectedTag = this.sha256(encrypted + key + iv).slice(-32);
    if (expectedTag !== tag) {
      throw new Error('Authentication tag mismatch');
    }
    return this.simpleDecrypt(encrypted.toString(), key, iv);
  }

  static simpleEncrypt(text, key, iv) {
    let encrypted = '';
    const keyStr = key.slice(0, 32);
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i) ^ keyStr.charCodeAt(i % keyStr.length);
      encrypted += String.fromCharCode(charCode);
    }
    return encrypted;
  }

  static simpleDecrypt(encrypted, key, iv) {
    let decrypted = '';
    const keyStr = key.slice(0, 32);
    for (let i = 0; i < encrypted.length; i++) {
      const charCode = encrypted.charCodeAt(i) ^ keyStr.charCodeAt(i % keyStr.length);
      decrypted += String.fromCharCode(charCode);
    }
    return decrypted;
  }
}

async function testRealEncryptionFlow() {
  console.log('🔍 TESTING REAL ENCRYPTION FLOW\n');
  
  const testMessage = "Hello, this is a test message!";
  const user1Id = "user-123-abc";
  const user2Id = "user-456-def";

  try {
    console.log('📝 Test message:', testMessage);
    console.log('👤 User 1:', user1Id);
    console.log('👤 User 2:', user2Id);
    console.log('');

    // Step 1: Encrypt
    console.log('🔐 Step 1: Encrypting message...');
    const encrypted = ProductionEncryptionService.encryptMessage(testMessage, user1Id, user2Id);
    console.log('✅ Encryption successful');
    console.log('Encrypted data length:', encrypted.length);
    console.log('Encrypted data preview:', encrypted.substring(0, 100) + '...');
    console.log('');

    // Step 2: Check if it's recognized as encrypted
    console.log('🔍 Step 2: Checking if encrypted by this service...');
    const isEncrypted = ProductionEncryptionService.isEncryptedByThisService(encrypted);
    console.log('Is encrypted by this service:', isEncrypted);
    console.log('');

    // Step 3: Decrypt
    console.log('🔓 Step 3: Decrypting message...');
    const decrypted = ProductionEncryptionService.decryptMessage(encrypted, user1Id, user2Id);
    console.log('✅ Decryption successful');
    console.log('Decrypted message:', decrypted);
    console.log('');

    // Step 4: Verify
    console.log('✅ Step 4: Verifying...');
    const isMatch = testMessage === decrypted;
    console.log('Original matches decrypted:', isMatch);
    
    if (isMatch) {
      console.log('🎉 SUCCESS: Encryption/decryption flow works correctly!');
    } else {
      console.log('❌ FAILURE: Original message does not match decrypted message');
    }

  } catch (error) {
    console.error('❌ Error in encryption flow:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

testRealEncryptionFlow();
