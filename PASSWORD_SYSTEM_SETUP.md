# 🔐 Password System Setup Guide for DebsMatch

This guide will walk you through setting up the new password-based authentication system for your DebsMatch app.

## 🎯 What We've Implemented

1. ✅ **Secure Password Hashing** - Using bcryptjs for industry-standard password security
2. ✅ **Password Storage** - Added `password_hash` field to users table
3. ✅ **Password Verification** - Secure password checking during login
4. ✅ **Password Setup for Existing Users** - Easy password creation for existing accounts
5. ✅ **Updated Login Flow** - Smart detection of users without passwords

## 🚀 Step-by-Step Setup

### **Step 1: Update Your Database Schema**

1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Copy the entire contents of `database/add-password-support.sql`
4. Paste and run the script
5. This will add the `password_hash` column to your users table

**⚠️ IMPORTANT: This script is safe to run multiple times - it won't overwrite existing data**

### **Step 2: Test the Password System**

1. Run the test script to verify everything works:
   ```bash
   npx ts-node scripts/test-password-system.ts
   ```

2. This will create a test user with credentials:
   - **Email**: `testuser@example.com`
   - **Password**: `testpassword123`

### **Step 3: Test the Login System**

1. Start your app: `npm start`
2. Navigate to the login screen
3. Try logging in with the test credentials above
4. Verify that the login works correctly

## 🔧 How the New System Works

### **For New Users:**
- Users complete onboarding and create an account
- Password is securely hashed and stored in the database
- Users can log in with their email and password

### **For Existing Users (like Eimhin and Ly):**
- When they try to log in, the system detects they have no password
- Offers to set a password for their existing account
- Password is securely hashed and stored
- User is automatically logged in after password setup

### **Password Security Features:**
- **bcrypt Hashing**: Industry-standard password hashing with salt
- **Salt Rounds**: 12 rounds for optimal security vs performance
- **Secure Storage**: Only hashed passwords are stored, never plain text
- **Verification**: Secure password comparison during login

## 📱 User Experience Flow

### **First-Time Login (Existing User):**
1. User enters email and any password
2. System detects account exists but no password set
3. Prompts user to set a password
4. Password is securely stored
5. User is logged in and can use the app

### **Returning User:**
1. User enters email and password
2. System verifies credentials
3. User is logged in immediately

### **New User Signup:**
1. User completes onboarding
2. Password is securely hashed and stored
3. User can log in with their credentials

## 🧪 Testing Scenarios

### **Test 1: Existing User Password Setup**
- Use one of your existing profiles (e.g., `19-0120@stkieranscollege.ie`)
- Enter any password
- System should offer to set the password
- After setup, user should be logged in

### **Test 2: New User Creation**
- Complete the onboarding flow
- Set a password during account creation
- Verify you can log in with the new credentials

### **Test 3: Password Verification**
- Try logging in with wrong password
- System should reject invalid credentials
- Try logging in with correct password
- System should accept valid credentials

## 🔒 Security Features

- **No Plain Text Passwords**: Passwords are never stored in plain text
- **Salt Protection**: Each password has a unique salt for additional security
- **Hash Strength**: bcrypt with 12 rounds provides excellent security
- **Database Security**: Password hashes are protected by RLS policies

## 🐛 Troubleshooting

### **Password Hash Column Not Found:**
- Run the database migration script first
- Check that the SQL executed successfully
- Verify the column was added to the users table

### **Login Not Working:**
- Check console logs for error messages
- Verify the user exists in the database
- Ensure the password_hash field is populated

### **Password Setup Failing:**
- Check that the user exists in the database
- Verify the user doesn't already have a password
- Check console logs for specific error messages

## 🎉 Success Indicators

You'll know everything is working when:
- ✅ Database migration completes successfully
- ✅ Test script creates a test user with password
- ✅ Login works with test credentials
- ✅ Existing users can set passwords
- ✅ New users can create accounts with passwords
- ✅ Wrong passwords are rejected
- ✅ Correct passwords are accepted

## 🚀 Next Steps

1. **Test the complete flow** - From password setup to login
2. **Create more test users** - Test different scenarios
3. **Test with your existing profiles** - Set passwords for Eimhin and Ly
4. **Verify security** - Ensure passwords are properly hashed
5. **User testing** - Have others test the login system

## 🆘 Need Help?

If you encounter any issues:

1. Check the console logs for detailed error messages
2. Verify your database schema matches the migration script
3. Ensure all dependencies are installed (`bcryptjs`)
4. Check that the RLS policies are working correctly

---

**Happy Secure Logging! 🔐✨**
