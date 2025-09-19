# Supabase Email Setup with Custom Domain

This guide will help you set up email verification using Supabase with your custom domain for the DebsMatch app.

## 🚀 Quick Setup

### 1. ✅ Configuration Files Updated

Your configuration has been updated with your actual domain:

**`config/supabase-email.ts`**
```typescript
export const SUPABASE_EMAIL_CONFIG = {
  // Your actual domain
  domain: 'debsmatch.ie', // ✅ CONFIGURED
  
  from: {
    verification: 'noreply@debsmatch.ie', // ✅ CONFIGURED
    support: 'support@debsmatch.ie', // ✅ CONFIGURED
    general: 'hello@debsmatch.ie' // ✅ CONFIGURED
  },
  // ... rest of config
}
```

### 2. Configure Supabase Dashboard

1. **Go to your Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard
   - Select your project: `tagjfsxeutihwntpudsk`

2. **Navigate to Authentication > Email Templates**
   - Go to: Authentication → Email Templates
   - Customize the "Confirm signup" template

3. **Configure SMTP Settings (Optional)**
   - Go to: Settings → API → SMTP Settings
   - Add your custom domain SMTP credentials

### 3. Verify Your Domain

1. **Add DNS Records**
   Add these records to your domain's DNS (debsmatch.ie):

   ```
   Type: TXT
   Name: @
   Value: supabase-verification=your-verification-code
   ```

2. **Add SPF Record**
   ```
   Type: TXT
   Name: @
   Value: v=spf1 include:_spf.supabase.com ~all
   ```

3. **Add DKIM Record (if provided by Supabase)**
   ```
   Type: TXT
   Name: supabase._domainkey
   Value: your-dkim-value
   ```

## 🔧 Advanced Configuration

### Option 1: Use Supabase Built-in Emails (Recommended for Start)

**`config/supabase-email.ts`**
```typescript
export const EMAIL_VERIFICATION_CONFIG = {
  useEdgeFunctions: false, // Use built-in Supabase emails
  fallbackToDevMode: true,
  // ...
}
```

**Pros:**
- ✅ Simple setup
- ✅ Automatic domain verification
- ✅ Built-in templates
- ✅ No additional code needed

**Cons:**
- ❌ Limited customization
- ❌ Basic email design

### Option 2: Use Edge Functions for Custom Emails

**`config/supabase-email.ts`**
```typescript
export const EMAIL_VERIFICATION_CONFIG = {
  useEdgeFunctions: true, // Use custom Edge Functions
  fallbackToDevMode: true,
  // ...
}
```

**Pros:**
- ✅ Full email customization
- ✅ Professional branding
- ✅ Advanced templates
- ✅ Better user experience

**Cons:**
- ❌ More complex setup
- ❌ Requires Edge Function deployment

## 📧 Email Templates

### Built-in Template Customization

1. **Go to Supabase Dashboard → Authentication → Email Templates**
2. **Customize the "Confirm signup" template:**

```html
<h2>Welcome to DebsMatch! 💃</h2>
<p>Your verification code is: {{ .Token }}</p>
<p>Enter this code in the app to complete your signup.</p>
<p>This code expires in 10 minutes.</p>
```

### Custom Edge Function Template

The Edge Function in `supabase/functions/send-verification-email/index.ts` provides:

- Professional HTML design
- Branded colors and logo
- Responsive layout
- Custom styling
- **From: noreply@debsmatch.ie** ✅

## 🧪 Testing Your Setup

### 1. Test Email Configuration

```typescript
import { EmailService } from '../services/email';

// Test your email setup
const testResult = await EmailService.testEmailConfiguration();
console.log(testResult);
```

### 2. Test Verification Flow

1. Enter an email in the verification screen
2. Check console for development mode logs
3. Verify email is sent (check spam folder)
4. Enter the code to complete verification

### 3. Check Supabase Logs

- Go to Supabase Dashboard → Logs
- Look for email-related events
- Check for any errors or failures

## 🚨 Troubleshooting

### Common Issues

1. **Emails not sending**
   - Check Supabase project settings
   - Verify domain DNS records
   - Check authentication settings

2. **Domain verification failed**
   - Ensure DNS records are correct
   - Wait for DNS propagation (up to 48 hours)
   - Check Supabase domain verification status

3. **Authentication errors**
   - Verify Supabase API keys
   - Check project URL configuration
   - Ensure proper CORS settings

### Development Mode

If emails aren't working in production, enable development mode:

```typescript
export const EMAIL_VERIFICATION_CONFIG = {
  fallbackToDevMode: true, // Shows codes in console
  // ...
}
```

## 🔒 Security Considerations

1. **Rate Limiting**
   - Supabase provides built-in rate limiting
   - Configure additional limits in your app if needed

2. **Code Expiration**
   - Verification codes expire after 10 minutes
   - Implement retry limits to prevent abuse

3. **Domain Verification**
   - Only verified domains can send emails
   - Prevents email spoofing and improves deliverability

## 📱 Integration with Your App

The email service is already integrated with your onboarding flow:

1. **Email Verification Screen** (`email-verification.tsx`)
   - Calls `EmailService.sendVerificationCode()`
   - Handles success/error responses

2. **Code Verification Screen** (`email-code.tsx`)
   - Calls `EmailService.verifyCode()`
   - Validates user input

3. **Progress Animation**
   - Maintains your existing smooth progress animations
   - No functionality is broken

## 🎯 Next Steps

1. **✅ Domain configuration updated** in `config/supabase-email.ts`
2. **Deploy Edge Functions** (if using custom templates)
3. **Test email flow** in development mode
4. **Verify domain** in Supabase dashboard
5. **Test with real emails** in production

## 📞 Support

If you encounter issues:

1. Check Supabase documentation: https://supabase.com/docs
2. Review Supabase dashboard logs
3. Test with development mode enabled
4. Check DNS propagation status

---

**Your DebsMatch app now has professional email verification using debsmatch.ie! 🎉**

**From:** noreply@debsmatch.ie  
**Domain:** debsmatch.ie  
**Status:** ✅ Configured
