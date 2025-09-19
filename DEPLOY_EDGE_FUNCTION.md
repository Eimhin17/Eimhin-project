# 🚀 Deploy Edge Function for Real Email Sending

To enable real email sending from `noreply@debsmatch.ie`, you need to deploy the Edge Function to Supabase.

## **📋 Prerequisites**

1. **Supabase CLI installed**
2. **Logged into Supabase**
3. **Your project linked**

## **🔧 Step-by-Step Deployment**

### **Step 1: Install Supabase CLI**
```bash
npm install -g supabase
```

### **Step 2: Login to Supabase**
```bash
supabase login
```

### **Step 3: Link Your Project**
```bash
# Navigate to your project directory
cd DebsMatch

# Link to your Supabase project
supabase link --project-ref tagjfsxeutihwntpudsk
```

### **Step 4: Deploy the Edge Function**
```bash
# Deploy the email verification function
supabase functions deploy send-verification-email
```

### **Step 5: Verify Deployment**
```bash
# List your functions
supabase functions list

# Check function logs
supabase functions logs send-verification-email
```

## **⚙️ Alternative: Deploy via Dashboard**

If CLI deployment doesn't work, you can deploy manually:

### **Option A: Copy-Paste Method**
1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**: `tagjfsxeutihwntpudsk`
3. **Navigate to**: Edge Functions
4. **Click**: "Create a new function"
5. **Function name**: `send-verification-email`
6. **Copy the code** from `supabase/functions/send-verification-email/index.ts`
7. **Paste and save**

### **Option B: Import from GitHub**
1. **Push your code to GitHub**
2. **Connect GitHub to Supabase**
3. **Auto-deploy from repository**

## **🧪 Test the Function**

### **Test 1: Function Invocation**
```bash
# Test the function directly
supabase functions invoke send-verification-email --body '{"email":"test@example.com","code":"123456","template":"verification"}'
```

### **Test 2: From Your App**
1. **Run your DebsMatch app**
2. **Go to email verification**
3. **Enter an email address**
4. **Check console for Edge Function logs**

## **🔍 Troubleshooting**

### **Common Issues:**

#### **Issue 1: Function Not Found**
```bash
# Re-deploy the function
supabase functions deploy send-verification-email --no-verify-jwt
```

#### **Issue 2: Permission Denied**
```bash
# Check your service role key
supabase status
```

#### **Issue 3: Environment Variables Missing**
The function needs these environment variables:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

These are automatically set when you deploy via CLI.

## **📧 What Happens Now**

### **Before Deployment:**
- ❌ Emails don't send
- ❌ Edge Function doesn't exist
- ❌ Users don't receive verification codes

### **After Deployment:**
- ✅ Real emails sent from `noreply@debsmatch.ie`
- ✅ Professional email templates
- ✅ Verification codes delivered to users
- ✅ Full branding and customization

## **🎯 Expected Results**

### **Console Logs:**
```
🚀 handleSendCode called with email: user@example.com
📧 Attempting to send verification email...
⏳ Loading state set to true
📤 Calling EmailService.sendVerificationCode...
📧 EmailService.sendVerificationCode called with: user@example.com
🔧 Configuration: { useEdgeFunctions: true, developmentMode: false, domain: 'debsmatch.ie' }
🔑 Generated verification code: 123456
💾 Code stored in pending verifications
🚀 Using Edge Functions for email sending...
📤 sendCustomEmailViaSupabase called with: { email: 'user@example.com', code: '123456' }
✅ Custom email sent successfully via Supabase Edge Function!
📨 Email sending result: true
✅ Email sent successfully!
📨 Email service result: { success: true }
✅ Email sent successfully!
🏁 Setting loading state to false
```

### **Email Received:**
- **From**: noreply@debsmatch.ie
- **Subject**: Verify your DebsMatch account
- **Content**: Professional HTML template with verification code
- **Branding**: DebsMatch colors and logo

## **🚀 Quick Start Commands**

```bash
# Install and setup
npm install -g supabase
supabase login
cd DebsMatch
supabase link --project-ref tagjfsxeutihwntpudsk

# Deploy function
supabase functions deploy send-verification-email

# Test function
supabase functions invoke send-verification-email --body '{"email":"test@example.com","code":"123456","template":"verification"}'
```

## **📞 Need Help?**

### **Check Function Status:**
```bash
supabase functions list
supabase functions logs send-verification-email
```

### **Common Solutions:**
1. **Re-deploy function** if it fails
2. **Check project linking** if function not found
3. **Verify service role key** if permission denied
4. **Check function logs** for specific errors

---

**Once deployed, your users will receive beautiful, professional verification emails from noreply@debsmatch.ie! 🎉**
