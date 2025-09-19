# Email Verification Service Documentation

## Overview

The Email Verification Service provides secure email verification for school email addresses using Supabase authentication. It supports both development (mock) and production (Supabase) verification methods.

## Features

- ✅ **Supabase Integration** - Uses Supabase Auth for secure email verification
- 🔄 **Mock Verification** - Development-friendly testing with mock codes
- 📧 **School Email Validation** - Only accepts .ie and .edu domains
- ⏰ **Resend Cooldown** - Prevents spam with 30-second cooldown
- 🔒 **Secure Verification** - Magic link-based authentication
- 📱 **Mobile Deep Linking** - Handles verification redirects

## Configuration

### Email Settings (`config/email.ts`)

```typescript
export const EMAIL_CONFIG = {
  verificationCodeLength: 6,
  resendCooldownSeconds: 30,
  maxVerificationAttempts: 3,
  allowedDomains: ['.ie', '.edu'],
  supabase: {
    emailRedirectTo: 'debsmatch://email-verification',
    emailTemplate: 'email_verification',
  },
  development: {
    mockCode: '123456',
    enableMockVerification: true,
  },
};
```

## How It Works

### 1. Email Verification Flow

1. **User enters school email** (must be .ie or .edu domain)
2. **Supabase sends magic link** to the email address
3. **User clicks link** or enters mock code for development
4. **Email is verified** and user continues onboarding

### 2. Supabase Integration

The service uses Supabase's `signInWithOtp` method:

```typescript
const { data, error } = await supabase.auth.signInWithOtp({
  email: email,
  options: {
    emailRedirectTo: 'debsmatch://email-verification',
    data: {
      type: 'email_verification',
      phone_number: global.verifiedPhoneNumber || '',
    }
  }
});
```

### 3. Development Mode

For development, the service includes a mock verification system:

- **Mock Code**: `123456` (configurable)
- **Bypasses Supabase** for quick testing
- **Stores verification state** in global variables

## Usage

### Sending Verification Email

```typescript
import { EmailService } from '../services/email';

const result = await EmailService.sendVerificationCode('student@school.ie');

if (result.success) {
  console.log('Verification email sent!');
} else {
  console.error('Failed:', result.error);
}
```

### Verifying Email Code

```typescript
const result = await EmailService.verifyEmailCode('123456');

if (result.success) {
  console.log('Email verified!');
} else {
  console.error('Verification failed:', result.error);
}
```

### Email Domain Validation

```typescript
const isValid = EmailService.validateEmailDomain('student@school.ie');
// Returns true for .ie and .edu domains
```

## Production Setup

### 1. Supabase Configuration

1. **Enable Email Auth** in Supabase dashboard
2. **Configure Email Templates** for verification emails
3. **Set Redirect URLs** for your app
4. **Customize Email Content** and branding

### 2. Deep Link Setup

Configure your app to handle verification redirects:

```typescript
// app.json or app.config.js
{
  "expo": {
    "scheme": "debsmatch",
    "ios": {
      "bundleIdentifier": "com.yourapp.debsmatch"
    },
    "android": {
      "package": "com.yourapp.debsmatch"
    }
  }
}
```

### 3. Email Templates

Customize Supabase email templates:

- **Subject**: "Verify your DebsMatch account"
- **Content**: Include your app branding and verification link
- **Styling**: Match your app's design language

## Development Testing

### Mock Verification

1. **Enable mock mode** in config
2. **Use mock code**: `123456`
3. **Test verification flow** without real emails

### Testing Real Emails

1. **Disable mock mode** in config
2. **Use real .ie/.edu email**
3. **Check email inbox** for verification link
4. **Click link** to complete verification

## Error Handling

### Common Errors

- `No pending email verification found` - Go back and resend
- `Invalid verification code` - Check code or request new one
- `Failed to send verification email` - Check Supabase configuration
- `Email domain not allowed` - Use .ie or .edu domain

### Error Recovery

- **Resend verification** after cooldown period
- **Check email domain** format
- **Verify Supabase** configuration
- **Check network** connectivity

## Security Features

- **Domain Validation** - Only school emails allowed
- **Magic Link Authentication** - Secure verification method
- **Rate Limiting** - Prevents abuse
- **Session Management** - Secure user sessions
- **Data Encryption** - Supabase handles security

## Future Enhancements

- [ ] **Custom Email Templates** - Branded verification emails
- [ ] **SMS Fallback** - Alternative verification method
- [ ] **Multi-language Support** - International school emails
- [ ] **Analytics** - Track verification success rates
- [ ] **Advanced Validation** - School-specific domain lists

## Troubleshooting

### Email Not Received

1. **Check spam folder**
2. **Verify email address** format
3. **Check Supabase** email settings
4. **Test with mock mode** first

### Verification Fails

1. **Use correct mock code** (123456)
2. **Check global state** variables
3. **Verify Supabase** integration
4. **Check console** for errors

### Supabase Issues

1. **Verify project URL** and API keys
2. **Check email auth** is enabled
3. **Verify redirect URLs** are configured
4. **Check email templates** are set up

## API Reference

### EmailService Methods

- `sendVerificationCode(email: string)` - Send verification email
- `verifyEmailCode(code: string)` - Verify email with code
- `resendVerificationCode(email: string)` - Resend verification email
- `validateEmailDomain(email: string)` - Validate email domain
- `isEmailVerified(email: string)` - Check verification status
- `clearVerificationData()` - Clear stored verification data

### Configuration Options

- `verificationCodeLength` - Length of verification codes
- `resendCooldownSeconds` - Cooldown between resends
- `maxVerificationAttempts` - Maximum verification attempts
- `allowedDomains` - Allowed email domains
- `emailRedirectTo` - Deep link for verification
- `mockCode` - Development verification code
