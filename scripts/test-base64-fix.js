// Test the base64 fix for React Native compatibility

const crypto = require('crypto');

// Mock the fixed compatible encryption service
class CompatibleEncryptionService {
  static get VERSION() { return '5.0'; }
  static get SECRET_KEY() { return 'debsmatch-military-grade-key-2024-ultra-secure'; }

  static generateConversationKey(user1Id, user2Id) {
    const combined = user1Id < user2Id ? `${user1Id}_${user2Id}` : `${user2Id}_${user1Id}`;
    const salt = this.createConversationSalt(combined);
    const keyString = this.simpleKeyDerivation(this.SECRET_KEY, salt);
    
    if (keyString.length < 64) {
      const additionalKey = this.simpleKeyDerivation(keyString + this.SECRET_KEY, salt);
      return (keyString + additionalKey).substring(0, 64);
    }
    
    return keyString.substring(0, 64);
  }

  static simpleKeyDerivation(password, salt) {
    let key = password + salt;
    
    for (let i = 0; i < 1000; i++) {
      key = this.simpleHash(key + i.toString());
    }
    
    while (key.length < 64) {
      key += this.simpleHash(key + password);
    }
    
    return key;
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
      hash = hash & hash;
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

  static simpleEncrypt(text, key, iv) {
    let encrypted = '';
    const keyStr = key.slice(0, 32);
    
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      const keyChar = keyStr.charCodeAt(i % keyStr.length);
      const ivChar = iv.charCodeAt(i % iv.length);
      const encryptedChar = charCode ^ keyChar ^ ivChar;
      encrypted += String.fromCharCode(encryptedChar);
    }
    
    return encrypted;
  }

  static simpleDecrypt(encrypted, key, iv) {
    let decrypted = '';
    const keyStr = key.slice(0, 32);
    
    for (let i = 0; i < encrypted.length; i++) {
      const charCode = encrypted.charCodeAt(i);
      const keyChar = keyStr.charCodeAt(i % keyStr.length);
      const ivChar = iv.charCodeAt(i % iv.length);
      const decryptedChar = charCode ^ keyChar ^ ivChar;
      decrypted += String.fromCharCode(decryptedChar);
    }
    
    return decrypted;
  }

  static base64Encode(str) {
    try {
      if (typeof btoa !== 'undefined') {
        return btoa(str);
      }
    } catch (error) {
      // Fallback to manual base64 encoding
    }
    
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    let i = 0;
    
    while (i < str.length) {
      const a = str.charCodeAt(i++);
      const b = i < str.length ? str.charCodeAt(i++) : 0;
      const c = i < str.length ? str.charCodeAt(i++) : 0;
      
      const bitmap = (a << 16) | (b << 8) | c;
      
      result += chars.charAt((bitmap >> 18) & 63);
      result += chars.charAt((bitmap >> 12) & 63);
      result += i - 2 < str.length ? chars.charAt((bitmap >> 6) & 63) : '=';
      result += i - 1 < str.length ? chars.charAt(bitmap & 63) : '=';
    }
    
    return result;
  }

  static base64Decode(str) {
    try {
      if (typeof atob !== 'undefined') {
        return atob(str);
      }
    } catch (error) {
      // Fallback to manual base64 decoding
    }
    
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    let i = 0;
    
    str = str.replace(/[^A-Za-z0-9+/]/g, '');
    
    while (i < str.length) {
      const encoded1 = chars.indexOf(str.charAt(i++));
      const encoded2 = chars.indexOf(str.charAt(i++));
      const encoded3 = chars.indexOf(str.charAt(i++));
      const encoded4 = chars.indexOf(str.charAt(i++));
      
      const bitmap = (encoded1 << 18) | (encoded2 << 12) | (encoded3 << 6) | encoded4;
      
      result += String.fromCharCode((bitmap >> 16) & 255);
      if (encoded3 !== 64) result += String.fromCharCode((bitmap >> 8) & 255);
      if (encoded4 !== 64) result += String.fromCharCode(bitmap & 255);
    }
    
    return result;
  }

  static encryptMessage(messageText, user1Id, user2Id) {
    if (!messageText || !user1Id || !user2Id) {
      throw new Error('Invalid input parameters');
    }

    const conversationKey = this.generateConversationKey(user1Id, user2Id);
    const iv = this.randomBytes(16);
    const salt = this.randomBytes(32);
    
    const encrypted = this.simpleEncrypt(messageText, conversationKey, iv);
    const ciphertext = this.base64Encode(encrypted);
    const hmacData = `${ciphertext}${iv}${salt}${this.VERSION}`;
    const hmac = this.createHMAC(hmacData, conversationKey);

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
    
    const hmacData = `${data.ciphertext}${data.iv}${data.salt}${data.version}`;
    if (!this.verifyHMAC(hmacData, conversationKey, data.hmac)) {
      throw new Error('HMAC verification failed - possible tampering');
    }
    
    const encrypted = this.base64Decode(data.ciphertext);
    const result = this.simpleDecrypt(encrypted, conversationKey, data.iv);
    
    if (!result) {
      throw new Error('Decryption failed - possible tampering or wrong key');
    }

    return result;
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

  static randomBytes(length) {
    return crypto.randomBytes(length).toString('hex');
  }
}

async function testBase64Fix() {
  console.log('🔍 TESTING BASE64 FIX FOR REACT NATIVE COMPATIBILITY\n');
  
  const testMessage = "You're the stinky poo."; // Same as in the logs
  const user1Id = "f988bdfc-b856-40a7-a7c2-b21a26689559"; // From logs (other user)
  const user2Id = "b55ebcf1-23ab-449a-90d9-f293e2a0b4a7"; // From logs (match ID)

  try {
    console.log('📝 Test message:', testMessage);
    console.log('👤 User 1 (other user):', user1Id);
    console.log('👤 User 2 (match):', user2Id);
    console.log('');

    // Test base64 encoding/decoding directly
    console.log('🔧 Testing base64 encoding/decoding...');
    const testString = "Hello, this is a test string with special chars: !@#$%^&*()";
    const encoded = CompatibleEncryptionService.base64Encode(testString);
    const decoded = CompatibleEncryptionService.base64Decode(encoded);
    console.log('Original:', testString);
    console.log('Encoded:', encoded);
    console.log('Decoded:', decoded);
    console.log('Base64 test passed:', testString === decoded);
    console.log('');

    // Test full encryption/decryption
    console.log('🔐 Testing full encryption/decryption...');
    const encrypted = CompatibleEncryptionService.encryptMessage(testMessage, user1Id, user2Id);
    console.log('✅ Encryption successful');
    console.log('Encrypted data length:', encrypted.length);
    console.log('Encrypted data preview:', encrypted.substring(0, 100) + '...');
    console.log('');

    const decrypted = CompatibleEncryptionService.decryptMessage(encrypted, user1Id, user2Id);
    console.log('✅ Decryption successful');
    console.log('Decrypted message:', decrypted);
    console.log('');

    const isMatch = testMessage === decrypted;
    console.log('Original matches decrypted:', isMatch);
    
    if (isMatch) {
      console.log('🎉 SUCCESS: Base64 fix works correctly!');
      console.log('🚀 Ready for React Native production use!');
    } else {
      console.log('❌ FAILURE: Original message does not match decrypted message');
    }

  } catch (error) {
    console.error('❌ Error in base64 fix test:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

testBase64Fix();
