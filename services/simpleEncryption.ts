// Simple encryption service for React Native compatibility
// This uses a simpler approach that works better in React Native environments

export class SimpleEncryptionService {
  private static readonly SECRET_KEY = process.env.EXPO_PUBLIC_ENCRYPTION_KEY || 'debsmatch-default-key-2024';

  // Simple XOR encryption (better for React Native)
  static encryptMessage(messageText: string, user1Id: string, user2Id: string): string {
    try {
      const key = this.generateSimpleKey(user1Id, user2Id);
      let encrypted = '';
      
      for (let i = 0; i < messageText.length; i++) {
        const charCode = messageText.charCodeAt(i) ^ key.charCodeAt(i % key.length);
        encrypted += String.fromCharCode(charCode);
      }
      
      // Encode to base64 for safe storage
      return btoa(encrypted);
    } catch (error) {
      console.error('Error encrypting message:', error);
      return btoa(messageText); // Fallback to base64
    }
  }

  static decryptMessage(encryptedText: string, user1Id: string, user2Id: string): string {
    try {
      const key = this.generateSimpleKey(user1Id, user2Id);
      
      // Decode from base64 first
      const decoded = atob(encryptedText);
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
        return atob(encryptedText);
      } catch (fallbackError) {
        console.error('Fallback decryption failed:', fallbackError);
        return encryptedText;
      }
    }
  }

  private static generateSimpleKey(user1Id: string, user2Id: string): string {
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
