# 🔐 Manual Password Reset via Supabase Dashboard

Since the admin API requires the service role key, here's how to reset the password manually:

## 📋 **Step-by-Step Instructions:**

### **1. Go to Supabase Dashboard**
- Visit: https://supabase.com/dashboard
- Sign in to your account
- Select your project: `tagjfsxeutihwntpudsk`

### **2. Navigate to Authentication**
- Click on **"Authentication"** in the left sidebar
- Click on **"Users"** tab

### **3. Find Your User**
- Look for: `19-0120@stkieranscollege.ie`
- Click on the user row to open details

### **4. Reset Password**
- Click **"Reset Password"** button
- Enter new password: `test123`
- Click **"Update"**

### **5. Test Login**
- Go back to your app
- Try logging in with:
  - **Email:** `19-0120@stkieranscollege.ie`
  - **Password:** `test123`

## 🚀 **Alternative: Quick Test Script**

If you want to test the login functionality immediately, you can also:

1. **Delete the user** from Supabase Auth
2. **Create a new user** through your app's signup flow
3. **Use the new credentials** for testing

## 📱 **Test the Login:**

After resetting the password, test in your app:
- Go to login page
- Enter: `19-0120@stkieranscollege.ie`
- Enter: `test123`
- Click login

## ✅ **Expected Result:**
- ✅ Login successful
- ✅ User redirected to main app
- ✅ No more "Invalid login credentials" errors

## 🔍 **If Still Having Issues:**
- Check if email is verified
- Check if user exists in both `auth.users` and `profiles` tables
- Check browser console for any errors

---

**The dashboard method is the safest and most reliable way to reset passwords!** 🎯
