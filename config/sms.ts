import { SMSConfig } from '../services/sms';

// SMS Configuration
export const SMS_CONFIG: SMSConfig = {
  // For development, use mock SMS
  provider: 'mock',
  
  // For production, you can switch to:
  // provider: 'twilio',
  // apiKey: 'your_twilio_account_sid',
  // apiSecret: 'your_twilio_auth_token',
  // fromNumber: '+1234567890',
  
  // Or use Supabase phone auth:
  // provider: 'supabase',
};

// Phone number formatting rules for Ireland
export const PHONE_CONFIG = {
  defaultCountryCode: '+353',
  maxLength: 15,
  minLength: 10,
  allowedFormats: [
    '+353 87 123 4567',
    '+353 86 123 4567',
    '+353 85 123 4567',
    '+353 83 123 4567',
    '+353 89 123 4567',
    '087 123 4567',
    '086 123 4567',
    '085 123 4567',
    '083 123 4567',
    '089 123 4567',
  ],
};

// Verification code settings
export const VERIFICATION_CONFIG = {
  codeLength: 6,
  codeExpiryMinutes: 10,
  maxAttempts: 3,
  resendCooldownSeconds: 30,
};
