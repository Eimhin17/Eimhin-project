# 🚨 Email Troubleshooting Guide

If emails aren't sending from your DebsMatch app, follow these steps to fix the issue.

## 🔍 **Quick Diagnosis**

### 1. **Check Console Logs**
Open your browser console or React Native debugger and look for:
- ✅ `✅ Supabase email sent successfully from noreply@debsmatch.ie!`
- ❌ `❌ Supabase email error: [error details]`
- ❌ `❌ Failed to send email via Supabase: [error details]`

### 2. **Check Development Mode**
If you see `🔑 DEVELOPMENT MODE: Your verification code is: [code]`, emails are working but in development mode.

## 🛠️ **Common Issues & Fixes**

### **Issue 1: Emails Not Sending at All**

**Symptoms:**
- No console logs about email sending
- App crashes when trying to send email
- No error messages

**Fix:**
1. **Check Supabase Connection**
   ```typescript
   // In your app, test the connection:
   const { data, error } = await supabase.auth.signInWithOtp({
     email: 'test@example.com'
   });
   console.log('Connection test:', { data, error });
   ```

2. **Verify API Keys**
   - Check `lib/supabase.ts` has correct URL and anon key
   - Ensure your Supabase project is active

### **Issue 2: Supabase Auth Errors**

**Symptoms:**
- Console shows: `Supabase email error: [error]`
- Authentication-related error messages

**Fix:**
1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard
   - Select your project: `tagjfsxeutihwntpudsk`

2. **Check Authentication Settings**
   - Go to: **Authentication → Settings**
   - Ensure **"Enable email confirmations"** is ON
   - Check **"Enable email change confirmations"** is ON

3. **Verify Email Templates**
   - Go to: **Authentication → Email Templates**
   - Ensure **"Confirm signup"** template exists and is enabled

### **Issue 3: Domain Configuration Issues**

**Symptoms:**
- Emails send but from generic addresses
- Domain verification errors
- Emails going to spam

**Fix:**
1. **Check Domain Verification**
   - Go to: **Settings → API → SMTP Settings**
   - Verify your domain `debsmatch.ie` is listed and verified

2. **Add DNS Records** (if not done)
   ```
   Type: TXT
   Name: @
   Value: v=spf1 include:_spf.supabase.com ~all
   ```

3. **Wait for DNS Propagation**
   - DNS changes can take up to 48 hours
   - Use tools like https://dnschecker.org to verify

### **Issue 4: Edge Function Errors**

**Symptoms:**
- Console shows: `Supabase Edge Function error: [error]`
- Function invocation failures

**Fix:**
1. **Deploy Edge Functions**
   ```bash
   # Install Supabase CLI
   npm install -g supabase
   
   # Login to Supabase
   supabase login
   
   # Deploy functions
   supabase functions deploy send-verification-email
   ```

2. **Check Function Logs**
   - Go to: **Edge Functions → send-verification-email**
   - Check for deployment errors

## 🔧 **Quick Fixes to Try**

### **Fix 1: Enable Development Mode**
```typescript
// In config/supabase-email.ts
export const EMAIL_VERIFICATION_CONFIG = {
  fallbackToDevMode: true, // This will show codes in console
  // ...
}
```

### **Fix 2: Use Built-in Emails (Simplest)**
```typescript
// In config/supabase-email.ts
export const EMAIL_VERIFICATION_CONFIG = {
  useEdgeFunctions: false, // Use Supabase built-in emails
  // ...
}
```

### **Fix 3: Test with Simple Email**
```typescript
// Test basic email functionality
const { data, error } = await supabase.auth.signInWithOtp({
  email: 'your-email@example.com'
});
console.log('Test result:', { data, error });
```

## 📱 **Testing Your Fix**

### **Step 1: Test Basic Connection**
```typescript
// Add this to your email verification screen
useEffect(() => {
  const testConnection = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        email: 'test@example.com'
      });
      console.log('Connection test:', { data, error });
    } catch (err) {
      console.error('Connection failed:', err);
    }
  };
  
  testConnection();
}, []);
```

### **Step 2: Check Console Output**
Look for these messages:
- ✅ `Connection test: { data: {...}, error: null }`
- ❌ `Connection test: { data: null, error: {...} }`
- ❌ `Connection failed: [error]`

### **Step 3: Test Email Sending**
1. Enter an email in your verification screen
2. Check console for email-related logs
3. Look for success/error messages

## 🚀 **Alternative Solutions**

### **Option 1: Use Supabase Built-in Emails**
- ✅ Simple setup
- ✅ Automatic domain verification
- ✅ Built-in templates
- ❌ Limited customization

### **Option 2: Use Edge Functions**
- ✅ Full customization
- ✅ Professional templates
- ✅ Your domain branding
- ❌ More complex setup

### **Option 3: Use External Email Service**
- ✅ Reliable delivery
- ✅ Professional templates
- ✅ Easy setup
- ❌ Additional cost

## 📞 **Getting Help**

### **1. Check Supabase Status**
- Visit: https://status.supabase.com/
- Check for any service issues

### **2. Review Supabase Logs**
- Go to: **Logs** in your dashboard
- Look for email-related errors

### **3. Test with Different Email**
- Try with a different email address
- Check if it's a specific email issue

### **4. Check Project Limits**
- Verify you haven't hit email limits
- Check your Supabase plan

## 🎯 **Most Likely Solutions**

Based on common issues, try these in order:

1. **Enable development mode** to see codes in console
2. **Check Supabase authentication settings**
3. **Verify email templates are enabled**
4. **Test basic connection first**
5. **Check domain verification status**

---

**Need more help?** Check the console logs and let me know what specific error messages you're seeing! 🔍
