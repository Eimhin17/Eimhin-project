# Quick Email Setup - Get Real Emails Working in 5 Minutes

## Step 1: Get Resend API Key
1. Go to [resend.com](https://resend.com)
2. Click "Sign Up" and create an account
3. Go to your dashboard
4. Copy your API key (starts with `re_`)

## Step 2: Update the Email Service
Open `services/email.ts` and replace line 25:

```typescript
// Change this line:
private static readonly RESEND_API_KEY = 're_YOUR_API_KEY_HERE';

// To your actual key:
private static readonly RESEND_API_KEY = 're_1234567890abcdef...';
```

## Step 3: Enable Real Email Sending
In the same file, change line 26:

```typescript
// Change this line:
private static readonly DEVELOPMENT_MODE = true;

// To:
private static readonly DEVELOPMENT_MODE = false;
```

## Step 4: Test Real Email Sending
1. Run the app: `npm run start`
2. Go to email verification
3. Enter your real email address
4. Click "Send Verification Code"
5. Check your email inbox
6. Use the 6-digit code to verify

## What Happens Now:
- ✅ **Real emails sent** to actual email addresses
- ✅ **Beautiful HTML template** with DebsMatch branding
- ✅ **6-digit codes** delivered to inbox
- ✅ **Professional verification** flow

## Troubleshooting:
- **Check spam folder** if you don't see the email
- **Verify API key** is correct
- **Check console logs** for any error messages
- **Resend free tier** allows 100 emails/day

## Next Steps:
Once working, you can:
- Verify your own domain for `noreply@debsmatch.com`
- Customize email templates
- Add email tracking
- Set up email analytics

The email verification will now work with real emails! 🚀
