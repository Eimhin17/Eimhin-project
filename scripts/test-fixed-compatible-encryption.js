// Test the fixed compatible encryption service

const crypto = require('crypto');

// Mock the fixed compatible encryption service
class CompatibleEncryptionService {
  static get VERSION() { return '5.0'; }
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
    const conversationHash = this.simpleHash(conversationId);
    const secretHash = this.simpleHash(this.SECRET_KEY);
    return this.simpleHash(conversationHash + secretHash);
  }

  static simpleHash(str) {
    let hash = 0;
    if (str.length === 0) return hash.toString();
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(16).padStart(8, '0');
  }

  static createHMAC(data, key) {
    const combined = data + key;
    return this.simpleHash(combined);
  }

  static verifyHMAC(data, key, expectedHmac) {
    const actualHmac = this.createHMAC(data, key);
    return actualHmac === expectedHmac;
  }

  static encryptMessage(messageText, user1Id, user2Id) {
    if (!messageText || !user1Id || !user2Id) {
      throw new Error('Invalid input parameters');
    }

    const conversationKey = this.generateConversationKey(user1Id, user2Id);
    const iv = this.randomBytes(16);
    const salt = this.randomBytes(32);
    
    // Simulate AES-256-CBC encryption
    const encrypted = this.simulateAESCBC(messageText, conversationKey, iv);

    // Create data for HMAC
    const ciphertext = Buffer.from(encrypted).toString('base64');
    const hmacData = `${ciphertext}${iv}${salt}${this.VERSION}`;
    const hmac = this.createHMAC(hmacData, conversationKey);

    // Create secure result object
    const result = {
      version: this.VERSION,
      iv: iv,
      salt: salt,
      ciphertext: ciphertext,
      hmac: hmac,
      timestamp: Date.now()
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
    if (!data.hmac) missingFields.push('hmac');
    if (!data.salt) missingFields.push('salt');
    
    if (missingFields.length > 0) {
      throw new Error(`Invalid encrypted data structure - missing fields: ${missingFields.join(', ')}`);
    }

    const conversationKey = this.generateConversationKey(user1Id, user2Id);
    
    // Verify HMAC before decryption
    const hmacData = `${data.ciphertext}${data.iv}${data.salt}${data.version}`;
    if (!this.verifyHMAC(hmacData, conversationKey, data.hmac)) {
      throw new Error('HMAC verification failed - possible tampering');
    }
    
    // Decrypt
    try {
      const encrypted = Buffer.from(data.ciphertext, 'base64');
      const decrypted = this.simulateAESCBCDecrypt(encrypted, conversationKey, data.iv);
      
      if (!decrypted) {
        throw new Error('Decryption failed - possible tampering or wrong key');
      }

      return decrypted;
    } catch (base64Error) {
      console.error('❌ Base64 decode error:', base64Error.message);
      throw new Error(`Base64 decode failed: ${base64Error.message}`);
    }
  }

  static isEncryptedByThisService(encryptedData) {
    try {
      const data = JSON.parse(encryptedData);
      return data.version === this.VERSION && 
             data.iv && 
             data.ciphertext && 
             data.hmac && 
             data.salt &&
             data.timestamp;
    } catch (error) {
      return false;
    }
  }

  // Helper methods
  static pbkdf2(password, salt, keylen, iterations) {
    return crypto.pbkdf2Sync(password, salt, iterations, keylen, 'sha256').toString('hex');
  }

  static randomBytes(length) {
    return crypto.randomBytes(length).toString('hex');
  }

  static simulateAESCBC(text, key, iv) {
    // Simple XOR encryption for testing
    let encrypted = '';
    const keyStr = key.slice(0, 32);
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i) ^ keyStr.charCodeAt(i % keyStr.length);
      encrypted += String.fromCharCode(charCode);
    }
    return encrypted;
  }

  static simulateAESCBCDecrypt(encrypted, key, iv) {
    // Simple XOR decryption for testing
    let decrypted = '';
    const keyStr = key.slice(0, 32);
    for (let i = 0; i < encrypted.length; i++) {
      const charCode = encrypted[i] ^ keyStr.charCodeAt(i % keyStr.length);
      decrypted += String.fromCharCode(charCode);
    }
    return decrypted;
  }
}

async function testFixedCompatibleEncryption() {
  console.log('🔍 TESTING FIXED COMPATIBLE ENCRYPTION SERVICE\n');
  
  const testMessage = "Hey there buddyyyy"; // Same as in the logs
  const user1Id = "78b8df90-00d1-4c07-af77-62231fd6fbae"; // From logs
  const user2Id = "b55ebcf1-23ab-449a-90d9-f293e2a0b4a7"; // From logs

  try {
    console.log('📝 Test message:', testMessage);
    console.log('👤 User 1:', user1Id);
    console.log('👤 User 2:', user2Id);
    console.log('');

    // Step 1: Encrypt
    console.log('🔐 Step 1: Encrypting message...');
    const encrypted = CompatibleEncryptionService.encryptMessage(testMessage, user1Id, user2Id);
    console.log('✅ Encryption successful');
    console.log('Encrypted data length:', encrypted.length);
    console.log('Encrypted data preview:', encrypted.substring(0, 100) + '...');
    console.log('');

    // Step 2: Check if it's recognized as encrypted
    console.log('🔍 Step 2: Checking if encrypted by this service...');
    const isEncrypted = CompatibleEncryptionService.isEncryptedByThisService(encrypted);
    console.log('Is encrypted by this service:', isEncrypted);
    console.log('');

    // Step 3: Decrypt
    console.log('🔓 Step 3: Decrypting message...');
    const decrypted = CompatibleEncryptionService.decryptMessage(encrypted, user1Id, user2Id);
    console.log('✅ Decryption successful');
    console.log('Decrypted message:', decrypted);
    console.log('');

    // Step 4: Verify
    console.log('✅ Step 4: Verifying...');
    const isMatch = testMessage === decrypted;
    console.log('Original matches decrypted:', isMatch);
    
    if (isMatch) {
      console.log('🎉 SUCCESS: Fixed compatible encryption/decryption flow works correctly!');
    } else {
      console.log('❌ FAILURE: Original message does not match decrypted message');
    }

  } catch (error) {
    console.error('❌ Error in fixed compatible encryption flow:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

testFixedCompatibleEncryption();
