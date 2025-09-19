# Email Verification Setup Guide

## Current Status
The app now generates 6-digit verification codes and has the infrastructure to send real emails, but currently simulates email sending for development.

## Option 1: Quick Test (Current)
Right now, the app will:
1. Generate a 6-digit code
2. Log it to the console
3. Simulate email sending
4. Store the code for verification

**To test:**
1. Run the app
2. Go to email verification
3. Enter your email
4. Check the console/logs for the code
5. Use that code to verify

## Option 2: Real Email Sending with Resend

### Step 1: Get Resend API Key
1. Go to [resend.com](https://resend.com)
2. Sign up for a free account
3. Get your API key from the dashboard
4. The free tier allows 100 emails/day

### Step 2: Update the Email Service
Replace `'re_YOUR_API_KEY_HERE'` in `services/email.ts` with your actual API key:

```typescript
private static readonly RESEND_API_KEY = 're_1234567890abcdef...';
```

### Step 3: Verify Your Domain (Optional)
For production, you'll want to verify your domain to send from `noreply@debsmatch.com`. For testing, you can use Resend's test domain.

### Step 4: Enable Real Email Sending
In the `sendEmail` method, replace the simulation code with the actual Resend API call:

```typescript
// Replace the simulation code with this:
const response = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${this.RESEND_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(emailData)
});

if (response.ok) {
  return true;
} else {
  console.error('Resend API error:', await response.text());
  return false;
}
```

## Option 3: Use Gmail SMTP (Free)
If you prefer to use Gmail instead:

1. Enable 2-factor authentication on your Gmail
2. Generate an app password
3. Use a library like `nodemailer` to send emails

## Option 4: Use Supabase Auth (Simplest)
Since you already have Supabase, you could use their built-in email verification:

```typescript
const { data, error } = await supabase.auth.signUp({
  email: email,
  password: 'temporary-password', // You'd need to handle this
  options: {
    emailRedirectTo: 'debsmatch://email-verified'
  }
});
```

## Recommendation
For now, use **Option 1** to test the flow. When you're ready for production, implement **Option 2** with Resend for a professional email service.

## Testing the Current Setup
1. The app generates codes and stores them
2. Check console logs for the generated code
3. Use that code to verify in the app
4. The verification flow works end-to-end

The email infrastructure is ready - you just need to connect it to a real email service when you're ready! 🚀
