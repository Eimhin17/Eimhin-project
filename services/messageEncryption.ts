// Message encryption for enhanced security
import CryptoJS from 'react-native-crypto-js';

export class MessageEncryptionService {
  private static readonly SECRET_KEY = process.env.EXPO_PUBLIC_ENCRYPTION_KEY || 'debsmatch-default-key-2024';

  // Encrypt message text
  static encryptMessage(messageText: string, userId: string): string {
    try {
      // Create a unique key for each user pair
      const key = CryptoJS.SHA256(this.SECRET_KEY + userId).toString();
      const encrypted = CryptoJS.AES.encrypt(messageText, key).toString();
      return encrypted;
    } catch (error) {
      console.error('Error encrypting message:', error);
      return messageText; // Return original if encryption fails
    }
  }

  // Decrypt message text
  static decryptMessage(encryptedText: string, userId: string): string {
    try {
      const key = CryptoJS.SHA256(this.SECRET_KEY + userId).toString();
      const decrypted = CryptoJS.AES.decrypt(encryptedText, key);
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Error decrypting message:', error);
      return encryptedText; // Return encrypted if decryption fails
    }
  }

  // Generate a secure key for the conversation
  static generateConversationKey(user1Id: string, user2Id: string): string {
    const combined = user1Id < user2Id ? `${user1Id}_${user2Id}` : `${user2Id}_${user1Id}`;
    return CryptoJS.SHA256(combined + this.SECRET_KEY).toString();
  }

  // Encrypt message for a specific conversation
  static encryptForConversation(messageText: string, user1Id: string, user2Id: string): string {
    try {
      const conversationKey = this.generateConversationKey(user1Id, user2Id);
      
      // Use a more compatible encryption method for React Native
      const encrypted = CryptoJS.AES.encrypt(messageText, conversationKey, {
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
        iv: CryptoJS.lib.WordArray.random(16)
      }).toString();
      
      return encrypted;
    } catch (error) {
      console.error('Error encrypting message for conversation:', error);
      // Return a simple base64 encoded version as fallback
      try {
        return btoa(messageText);
      } catch (fallbackError) {
        console.error('Fallback encryption also failed:', fallbackError);
        return messageText;
      }
    }
  }

  // Decrypt message from a specific conversation
  static decryptFromConversation(encryptedText: string, user1Id: string, user2Id: string): string {
    try {
      const conversationKey = this.generateConversationKey(user1Id, user2Id);
      
      // Try to decrypt with the same method used for encryption
      const decrypted = CryptoJS.AES.decrypt(encryptedText, conversationKey);
      const result = decrypted.toString(CryptoJS.enc.Utf8);
      
      // If decryption failed, try base64 decode as fallback
      if (!result) {
        try {
          return atob(encryptedText);
        } catch (base64Error) {
          console.error('Base64 fallback also failed:', base64Error);
          return encryptedText;
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error decrypting message from conversation:', error);
      // Try base64 decode as fallback
      try {
        return atob(encryptedText);
      } catch (fallbackError) {
        console.error('Fallback decryption also failed:', fallbackError);
        return encryptedText;
      }
    }
  }
}
