// Import the encryption service (we'll test it directly)
const CryptoJS = require('crypto-js');

// Copy the encryption service logic for testing
class MessageEncryptionService {
  static get SECRET_KEY() {
    return 'debsmatch-default-key-2024';
  }

  static generateConversationKey(user1Id, user2Id) {
    const combined = user1Id < user2Id ? `${user1Id}_${user2Id}` : `${user2Id}_${user1Id}`;
    return CryptoJS.SHA256(combined + this.SECRET_KEY).toString();
  }

  static encryptForConversation(messageText, user1Id, user2Id) {
    try {
      const conversationKey = this.generateConversationKey(user1Id, user2Id);
      const encrypted = CryptoJS.AES.encrypt(messageText, conversationKey).toString();
      return encrypted;
    } catch (error) {
      console.error('Error encrypting message for conversation:', error);
      return messageText;
    }
  }

  static decryptFromConversation(encryptedText, user1Id, user2Id) {
    try {
      const conversationKey = this.generateConversationKey(user1Id, user2Id);
      const decrypted = CryptoJS.AES.decrypt(encryptedText, conversationKey);
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Error decrypting message from conversation:', error);
      return encryptedText;
    }
  }
}

async function testEncryption() {
  console.log('🔐 Testing Message Encryption System...\n');
  
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
    const encrypted = MessageEncryptionService.encryptForConversation(testMessage, user1Id, user2Id);
    console.log('✅ Encrypted:', encrypted.substring(0, 50) + '...');
    
    const decrypted = MessageEncryptionService.decryptFromConversation(encrypted, user1Id, user2Id);
    console.log('✅ Decrypted:', decrypted);
    console.log('✅ Match:', testMessage === decrypted ? 'PASS' : 'FAIL');
    console.log('');
    
    // Test 2: Different user order (should work the same)
    console.log('2️⃣ Testing different user order...');
    const encrypted2 = MessageEncryptionService.encryptForConversation(testMessage, user2Id, user1Id);
    console.log('✅ Encrypted (swapped order):', encrypted2.substring(0, 50) + '...');
    
    const decrypted2 = MessageEncryptionService.decryptFromConversation(encrypted2, user1Id, user2Id);
    console.log('✅ Decrypted (swapped order):', decrypted2);
    console.log('✅ Match:', testMessage === decrypted2 ? 'PASS' : 'FAIL');
    console.log('');
    
    // Test 3: Same encryption key for same conversation
    console.log('3️⃣ Testing consistent encryption keys...');
    const encrypted3 = MessageEncryptionService.encryptForConversation(testMessage, user1Id, user2Id);
    console.log('✅ Same conversation, same key:', encrypted === encrypted3 ? 'PASS' : 'FAIL');
    console.log('');
    
    // Test 4: Different conversation (different key)
    console.log('4️⃣ Testing different conversation keys...');
    const user3Id = "user-789-ghi";
    const encrypted4 = MessageEncryptionService.encryptForConversation(testMessage, user1Id, user3Id);
    console.log('✅ Different conversation, different key:', encrypted !== encrypted4 ? 'PASS' : 'FAIL');
    console.log('');
    
    // Test 5: Cross-decryption (should fail)
    console.log('5️⃣ Testing cross-decryption (should fail)...');
    try {
      const wrongDecrypt = MessageEncryptionService.decryptFromConversation(encrypted, user1Id, user3Id);
      console.log('❌ Cross-decryption should have failed but got:', wrongDecrypt);
    } catch (error) {
      console.log('✅ Cross-decryption correctly failed:', error.message);
    }
    console.log('');
    
    // Test 6: Special characters and emojis
    console.log('6️⃣ Testing special characters and emojis...');
    const specialMessage = "Hello! 🌟 This has émojis, spéciál chârs, and 123 numbers! 🎉";
    const encryptedSpecial = MessageEncryptionService.encryptForConversation(specialMessage, user1Id, user2Id);
    const decryptedSpecial = MessageEncryptionService.decryptFromConversation(encryptedSpecial, user1Id, user2Id);
    console.log('✅ Special chars match:', specialMessage === decryptedSpecial ? 'PASS' : 'FAIL');
    console.log('');
    
    // Test 7: Long message
    console.log('7️⃣ Testing long message...');
    const longMessage = "This is a very long message that tests the encryption system with a lot of text. ".repeat(10);
    const encryptedLong = MessageEncryptionService.encryptForConversation(longMessage, user1Id, user2Id);
    const decryptedLong = MessageEncryptionService.decryptFromConversation(encryptedLong, user1Id, user2Id);
    console.log('✅ Long message match:', longMessage === decryptedLong ? 'PASS' : 'FAIL');
    console.log('');
    
    console.log('🎉 All encryption tests completed!');
    console.log('');
    console.log('📋 Next Steps:');
    console.log('1. Set your encryption key in .env file');
    console.log('2. Test messaging in your app');
    console.log('3. Check database to see encrypted messages');
    
  } catch (error) {
    console.error('❌ Encryption test failed:', error);
  }
}

// Run the test
testEncryption();
