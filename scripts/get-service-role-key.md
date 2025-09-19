# 🔑 Get Service Role Key for Password Reset

## 📍 **Where to Find Your Service Role Key:**

### **1. Go to Supabase Dashboard**
- Visit: https://supabase.com/dashboard
- Sign in to your account
- Select your project: `tagjfsxeutihwntpudsk`

### **2. Navigate to Settings**
- Click on **"Settings"** in the left sidebar
- Click on **"API"** tab

### **3. Copy the Service Role Key**
- Look for **"service_role"** key (it's longer than the anon key)
- Click **"Copy"** button
- **⚠️ Keep this secret - it has admin privileges!**

### **4. Update the Script**
- Open: `DebsMatch/scripts/reset-user-password.js`
- Replace the `supabaseAnonKey` with your service role key
- Run the script again

## 🚀 **Alternative: Quick Dashboard Reset**

**Faster option - just reset via dashboard:**
1. Go to **Authentication** → **Users**
2. Find: `19-0120@stkieranscollege.ie`
3. Click **"Reset Password"**
4. Set to: `test123`
5. Click **"Update"**

## ⏱️ **Time Comparison:**
- **Getting service role key:** 3-5 minutes
- **Dashboard reset:** 2 minutes
- **Dashboard is faster!**

---

**Which option do you prefer?** 🤔



