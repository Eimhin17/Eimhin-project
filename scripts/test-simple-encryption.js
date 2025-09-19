// Test the simple encryption service (JavaScript version)
class SimpleEncryptionService {
  static get SECRET_KEY() {
    return 'debsmatch-default-key-2024';
  }

  static encryptMessage(messageText, user1Id, user2Id) {
    try {
      const key = this.generateSimpleKey(user1Id, user2Id);
      let encrypted = '';
      
      for (let i = 0; i < messageText.length; i++) {
        const charCode = messageText.charCodeAt(i) ^ key.charCodeAt(i % key.length);
        encrypted += String.fromCharCode(charCode);
      }
      
      // Encode to base64 for safe storage
      return Buffer.from(encrypted).toString('base64');
    } catch (error) {
      console.error('Error encrypting message:', error);
      return Buffer.from(messageText).toString('base64'); // Fallback to base64
    }
  }

  static decryptMessage(encryptedText, user1Id, user2Id) {
    try {
      const key = this.generateSimpleKey(user1Id, user2Id);
      
      // Decode from base64 first
      const decoded = Buffer.from(encryptedText, 'base64').toString();
      let decrypted = '';
      
      for (let i = 0; i < decoded.length; i++) {
        const charCode = decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length);
        decrypted += String.fromCharCode(charCode);
      }
      
      return decrypted;
    } catch (error) {
      console.error('Error decrypting message:', error);
      // Try base64 decode as fallback
      try {
        return Buffer.from(encryptedText, 'base64').toString();
      } catch (fallbackError) {
        console.error('Fallback decryption failed:', fallbackError);
        return encryptedText;
      }
    }
  }

  static generateSimpleKey(user1Id, user2Id) {
    const combined = user1Id < user2Id ? `${user1Id}_${user2Id}` : `${user2Id}_${user1Id}`;
    const keyString = combined + this.SECRET_KEY;
    
    // Create a simple hash-like key
    let hash = 0;
    for (let i = 0; i < keyString.length; i++) {
      const char = keyString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Convert to a string key
    return Math.abs(hash).toString(16).padStart(8, '0').repeat(4);
  }
}

async function testSimpleEncryption() {
  console.log('🔐 Testing Simple Encryption System...\n');
  
  try {
    // Test data
    const testMessage = "Hello! This is a test message for DebsMatch encryption! 🎉";
    const user1Id = "user-123-abc";
    const user2Id = "user-456-def";
    
    console.log('📝 Test Message:', testMessage);
    console.log('👤 User 1 ID:', user1Id);
    console.log('👤 User 2 ID:', user2Id);
    console.log('');
    
    // Test 1: Basic encryption/decryption
    console.log('1️⃣ Testing basic encryption/decryption...');
    const encrypted = SimpleEncryptionService.encryptMessage(testMessage, user1Id, user2Id);
    console.log('✅ Encrypted:', encrypted.substring(0, 50) + '...');
    
    const decrypted = SimpleEncryptionService.decryptMessage(encrypted, user1Id, user2Id);
    console.log('✅ Decrypted:', decrypted);
    console.log('✅ Match:', testMessage === decrypted ? 'PASS' : 'FAIL');
    console.log('');
    
    // Test 2: Different user order (should work the same)
    console.log('2️⃣ Testing different user order...');
    const encrypted2 = SimpleEncryptionService.encryptMessage(testMessage, user2Id, user1Id);
    console.log('✅ Encrypted (swapped order):', encrypted2.substring(0, 50) + '...');
    
    const decrypted2 = SimpleEncryptionService.decryptMessage(encrypted2, user1Id, user2Id);
    console.log('✅ Decrypted (swapped order):', decrypted2);
    console.log('✅ Match:', testMessage === decrypted2 ? 'PASS' : 'FAIL');
    console.log('');
    
    // Test 3: Same encryption key for same conversation
    console.log('3️⃣ Testing consistent encryption keys...');
    const encrypted3 = SimpleEncryptionService.encryptMessage(testMessage, user1Id, user2Id);
    console.log('✅ Same conversation, same key:', encrypted === encrypted3 ? 'PASS' : 'FAIL');
    console.log('');
    
    // Test 4: Different conversation (different key)
    console.log('4️⃣ Testing different conversation keys...');
    const user3Id = "user-789-ghi";
    const encrypted4 = SimpleEncryptionService.encryptMessage(testMessage, user1Id, user3Id);
    console.log('✅ Different conversation, different key:', encrypted !== encrypted4 ? 'PASS' : 'FAIL');
    console.log('');
    
    // Test 5: Cross-decryption (should fail)
    console.log('5️⃣ Testing cross-decryption (should fail)...');
    const wrongDecrypt = SimpleEncryptionService.decryptMessage(encrypted, user1Id, user3Id);
    console.log('✅ Cross-decryption result:', wrongDecrypt);
    console.log('✅ Cross-decryption should be different:', wrongDecrypt !== testMessage ? 'PASS' : 'FAIL');
    console.log('');
    
    // Test 6: Special characters and emojis
    console.log('6️⃣ Testing special characters and emojis...');
    const specialMessage = "Hello! 🌟 This has émojis, spéciál chârs, and 123 numbers! 🎉";
    const encryptedSpecial = SimpleEncryptionService.encryptMessage(specialMessage, user1Id, user2Id);
    const decryptedSpecial = SimpleEncryptionService.decryptMessage(encryptedSpecial, user1Id, user2Id);
    console.log('✅ Special chars match:', specialMessage === decryptedSpecial ? 'PASS' : 'FAIL');
    console.log('');
    
    // Test 7: Long message
    console.log('7️⃣ Testing long message...');
    const longMessage = "This is a very long message that tests the encryption system with a lot of text. ".repeat(10);
    const encryptedLong = SimpleEncryptionService.encryptMessage(longMessage, user1Id, user2Id);
    const decryptedLong = SimpleEncryptionService.decryptMessage(encryptedLong, user1Id, user2Id);
    console.log('✅ Long message match:', longMessage === decryptedLong ? 'PASS' : 'FAIL');
    console.log('');
    
    console.log('🎉 All simple encryption tests completed!');
    console.log('');
    console.log('📋 Next Steps:');
    console.log('1. Test messaging in your app');
    console.log('2. Check database to see encrypted messages');
    console.log('3. Verify messages appear correctly in chat UI');
    
  } catch (error) {
    console.error('❌ Simple encryption test failed:', error);
  }
}

// Run the test
testSimpleEncryption();
