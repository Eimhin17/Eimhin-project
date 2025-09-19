# SMS Service Documentation

## Overview

The SMS service provides phone number verification functionality for the DebsMatch app. It supports multiple providers and includes a mock SMS service for development.

## Features

- ✅ **Mock SMS Service** (Development)
- 🔄 **Twilio Integration** (Production - Ready for implementation)
- 🔄 **Supabase Phone Auth** (Production - Ready for implementation)
- 📱 **Irish Phone Number Formatting**
- ⏰ **Verification Code Expiry**
- 🔒 **Rate Limiting** (Max attempts)
- ⏳ **Resend Cooldown**

## Configuration

### Development (Mock SMS)

```typescript
// config/sms.ts
export const SMS_CONFIG: SMSConfig = {
  provider: 'mock', // Uses mock SMS service
};
```

### Production (Twilio)

```typescript
// config/sms.ts
export const SMS_CONFIG: SMSConfig = {
  provider: 'twilio',
  apiKey: 'your_twilio_account_sid',
  apiSecret: 'your_twilio_auth_token',
  fromNumber: '+1234567890',
};
```

### Production (Supabase Phone Auth)

```typescript
// config/sms.ts
export const SMS_CONFIG: SMSConfig = {
  provider: 'supabase',
};
```

## Usage

### Sending Verification Code

```typescript
import { SMSService } from '../services/sms';

const result = await SMSService.sendVerificationCode('+353871234567');

if (result.success) {
  console.log('SMS sent successfully');
} else {
  console.error('Failed to send SMS:', result.error);
}
```

### Verifying Code

```typescript
const result = await SMSService.verifyCode('+353871234567', '123456');

if (result.success) {
  console.log('Phone number verified!');
} else {
  console.error('Verification failed:', result.error);
}
```

## Mock SMS Service (Development)

The mock SMS service simulates real SMS functionality:

- Generates random 6-digit verification codes
- Stores codes in memory with expiry (10 minutes)
- Limits verification attempts (max 3)
- Simulates network delays
- Shows codes in alerts for testing

### Mock SMS Flow

1. User enters phone number
2. Mock service generates 6-digit code
3. Code is stored in memory with expiry
4. User receives code via alert (in production, this would be SMS)
5. User enters code for verification
6. Service validates code and cleans up

## Phone Number Formatting

The service automatically formats Irish phone numbers:

- `087 123 4567` → `+353 87 123 4567`
- `086 123 4567` → `+353 86 123 4567`
- `+353 87 123 4567` → `+353 87 123 4567` (unchanged)

## Verification Settings

```typescript
export const VERIFICATION_CONFIG = {
  codeLength: 6,              // 6-digit codes
  codeExpiryMinutes: 10,      // Codes expire after 10 minutes
  maxAttempts: 3,             // Max 3 verification attempts
  resendCooldownSeconds: 30,  // 30-second cooldown between resends
};
```

## Security Features

- **Code Expiry**: Verification codes expire after 10 minutes
- **Rate Limiting**: Maximum 3 verification attempts per code
- **Resend Cooldown**: 30-second cooldown between resend requests
- **Secure Storage**: Codes are stored securely (in production, use database)

## Production Implementation

### Twilio Setup

1. Create Twilio account
2. Get Account SID and Auth Token
3. Purchase phone number
4. Update configuration
5. Implement `sendTwilioSMS` and `verifyTwilioCode` methods

### Supabase Phone Auth Setup

1. Enable phone auth in Supabase dashboard
2. Configure SMS provider (Twilio, etc.)
3. Update configuration
4. Implement `sendSupabaseSMS` and `verifySupabaseCode` methods

## Testing

### Mock SMS Testing

1. Set provider to 'mock' in config
2. Enter any phone number
3. Check console for generated code
4. Use code to verify

### Real SMS Testing

1. Set provider to 'twilio' or 'supabase'
2. Use real phone number
3. Receive actual SMS
4. Verify with received code

## Error Handling

The service provides detailed error messages:

- `No verification code found for this phone number`
- `Verification code has expired`
- `Too many verification attempts. Please request a new code.`
- `Invalid verification code`
- `Failed to send SMS`
- `Verification failed`

## Troubleshooting

### Common Issues

1. **Codes not working**: Check if mock service is enabled
2. **Resend not working**: Wait for cooldown period
3. **Verification fails**: Check attempt limits and expiry
4. **Phone formatting**: Ensure proper Irish format

### Debug Mode

Enable debug logging:

```typescript
// In your app
console.log('SMS Provider:', SMSService.getProviderName());
console.log('Mock Code:', SMSService.getMockCode(phoneNumber));
```

## Future Enhancements

- [ ] **Database Storage**: Store codes in Supabase instead of memory
- [ ] **Push Notifications**: Send push notifications for verification
- [ ] **Voice Calls**: Add voice call verification option
- [ ] **International Support**: Support for other countries
- [ ] **Analytics**: Track SMS delivery and verification rates
