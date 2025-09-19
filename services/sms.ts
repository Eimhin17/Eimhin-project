import { SMS_CONFIG, VERIFICATION_CONFIG } from '../config/sms';

export interface SMSConfig {
  provider: 'mock' | 'twilio' | 'supabase';
  apiKey?: string;
  apiSecret?: string;
  fromNumber?: string;
}

export interface SendSMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface VerifySMSCodeResult {
  success: boolean;
  error?: string;
}

export class SMSService {
  private static config: SMSConfig = SMS_CONFIG;

  static configure(config: Partial<SMSConfig>) {
    this.config = { ...this.config, ...config };
  }

  static async sendVerificationCode(phoneNumber: string): Promise<SendSMSResult> {
    switch (this.config.provider) {
      case 'mock':
        return this.sendMockSMS(phoneNumber);
      case 'twilio':
        return this.sendTwilioSMS(phoneNumber);
      case 'supabase':
        return this.sendSupabaseSMS(phoneNumber);
      default:
        return { success: false, error: 'Unknown SMS provider' };
    }
  }

  static async verifyCode(phoneNumber: string, code: string): Promise<VerifySMSCodeResult> {
    switch (this.config.provider) {
      case 'mock':
        return this.verifyMockCode(phoneNumber, code);
      case 'twilio':
        return this.verifyTwilioCode(phoneNumber, code);
      case 'supabase':
        return this.verifySupabaseCode(phoneNumber, code);
      default:
        return { success: false, error: 'Unknown SMS provider' };
    }
  }

  // Mock SMS Service (Development)
  private static async sendMockSMS(phoneNumber: string): Promise<SendSMSResult> {
    try {
      // Generate a 6-digit verification code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store the code temporarily (in production, this would be in a database)
      if (!global.mockSMSCodes) {
        global.mockSMSCodes = new Map();
      }
      global.mockSMSCodes.set(phoneNumber, {
        code: verificationCode,
        expiresAt: Date.now() + (VERIFICATION_CONFIG.codeExpiryMinutes * 60 * 1000),
        attempts: 0,
      });

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log(`📱 Mock SMS sent to ${phoneNumber}: ${verificationCode}`);
      
      return {
        success: true,
        messageId: `mock_${Date.now()}`,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to send mock SMS',
      };
    }
  }

  private static async verifyMockCode(phoneNumber: string, code: string): Promise<VerifySMSCodeResult> {
    try {
      const storedData = global.mockSMSCodes?.get(phoneNumber);
      
      if (!storedData) {
        return { success: false, error: 'No verification code found for this phone number' };
      }

      // Check if code has expired
      if (Date.now() > storedData.expiresAt) {
        global.mockSMSCodes.delete(phoneNumber);
        return { success: false, error: 'Verification code has expired' };
      }

      // Check if too many attempts
      if (storedData.attempts >= VERIFICATION_CONFIG.maxAttempts) {
        global.mockSMSCodes.delete(phoneNumber);
        return { success: false, error: 'Too many verification attempts. Please request a new code.' };
      }

      // Increment attempts
      storedData.attempts++;

      // Check if code matches
      if (storedData.code === code) {
        // Clean up after successful verification
        global.mockSMSCodes.delete(phoneNumber);
        return { success: true };
      } else {
        return { success: false, error: 'Invalid verification code' };
      }
    } catch (error) {
      return { success: false, error: 'Verification failed' };
    }
  }

  // Twilio SMS Service (Production)
  private static async sendTwilioSMS(phoneNumber: string): Promise<SendSMSResult> {
    if (!this.config.apiKey || !this.config.apiSecret || !this.config.fromNumber) {
      return { success: false, error: 'Twilio configuration incomplete' };
    }

    try {
      // This would integrate with Twilio's API
      // For now, return an error indicating Twilio is not fully implemented
      return { success: false, error: 'Twilio SMS service not yet implemented' };
    } catch (error) {
      return { success: false, error: 'Failed to send Twilio SMS' };
    }
  }

  private static async verifyTwilioCode(phoneNumber: string, code: string): Promise<VerifySMSCodeResult> {
    try {
      // This would verify with Twilio's verification API
      return { success: false, error: 'Twilio verification not yet implemented' };
    } catch (error) {
      return { success: false, error: 'Twilio verification failed' };
    }
  }

  // Supabase Phone Auth Service (Production)
  private static async sendSupabaseSMS(phoneNumber: string): Promise<SendSMSResult> {
    try {
      // This would use Supabase's built-in phone authentication
      // For now, return an error indicating Supabase phone auth is not fully implemented
      return { success: false, error: 'Supabase phone auth not yet implemented' };
    } catch (error) {
      return { success: false, error: 'Failed to send Supabase SMS' };
    }
  }

  private static async verifySupabaseCode(phoneNumber: string, code: string): Promise<VerifySMSCodeResult> {
    try {
      // This would verify with Supabase's phone auth
      return { success: false, error: 'Supabase verification not yet implemented' };
    } catch (error) {
      return { success: false, error: 'Supabase verification failed' };
    }
  }

  // Utility methods
  static getMockCode(phoneNumber: string): string | null {
    const storedData = global.mockSMSCodes?.get(phoneNumber);
    if (storedData && Date.now() <= storedData.expiresAt) {
      return storedData.code;
    }
    return null;
  }

  static clearMockCode(phoneNumber: string): void {
    global.mockSMSCodes?.delete(phoneNumber);
  }

  static isMockProvider(): boolean {
    return this.config.provider === 'mock';
  }

  static getProviderName(): string {
    return this.config.provider;
  }
}

// Type declarations for global variables
declare global {
  var mockSMSCodes: Map<string, {
    code: string;
    expiresAt: number;
    attempts: number;
  }>;
  var mockPhoneNumber: string;
  var verifiedPhoneNumber: string;
}
