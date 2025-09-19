# 🎭 Mock Profiles Setup Guide for DebsMatch

This guide will walk you through setting up mock profiles and fixing email verification in your DebsMatch app.

## 📋 What We've Implemented

1. ✅ **Fixed Email Verification** - Now actually verifies codes instead of simulating
2. ✅ **Updated Database Schema** - Complete schema with mock profile support
3. ✅ **Mock Profile Service** - Service for creating/managing mock profiles
4. ✅ **Mock Profile Management Screen** - UI for managing mock profiles
5. ✅ **Tab Navigation** - Added mock profiles tab

## 🚀 Step-by-Step Implementation

### **Step 1: Reset Your Supabase Database**

1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Copy the entire contents of `database/setup-complete.sql`
4. Paste and run the script
5. This will completely reset your database with the new schema

**⚠️ WARNING: This will delete ALL existing data!**

### **Step 2: Test Email Verification**

1. Run your app
2. Go through the onboarding flow
3. Enter your email and request a verification code
4. Check your email for the code
5. Enter the code in the app
6. Verify it actually works (should show success and proceed to next step)

### **Step 3: Create Your First Mock Profiles**

1. In your app, navigate to the **Mock Profiles** tab
2. Tap **"Create Sample Profiles"**
3. This will create 3 sample profiles:
   - Emma O'Connor (Woman, looking for someone to go to debs with)
   - James Murphy (Man, looking for someone to bring to his debs)
   - Sophie Walsh (Woman, looking for someone to go to debs with)

### **Step 4: Test Mock Profiles in Swiping**

1. Go to the **Swiping** tab
2. You should now see the mock profiles you created
3. Swipe through them to test the functionality
4. Mock profiles will appear just like real user profiles

## 🔧 How to Create Custom Mock Profiles

### **Option 1: Use the Sample Creation**
The easiest way is to use the built-in sample creation and then modify them.

### **Option 2: Create Custom Profiles via Code**
You can create custom profiles by calling the service directly:

```typescript
import { MockProfileService } from '../services/mockProfiles';

const customProfile = {
  first_name: 'Your Custom Name',
  last_name: 'Your Custom Last Name',
  date_of_birth: '2005-01-01', // YYYY-MM-DD format
  gender: 'woman', // 'woman', 'man', or 'non_binary'
  looking_for: 'go_to_someones_debs', // or 'bring_someone_to_my_debs'
  relationship_intention: 'short_term_but_open_to_long_term',
  bio: 'Your custom bio here...',
  discovery_source: 'Custom source',
  photos: [
    {
      photo_url: 'https://your-photo-url.com/photo.jpg',
      photo_order: 1,
      is_primary: true
    }
  ],
  interests: [
    { interest_id: '1' }, // Football
    { interest_id: '10' } // Music
  ],
  prompts: [
    {
      prompt_id: '1',
      response: 'Your response to the prompt'
    }
  ]
};

const result = await MockProfileService.createMockProfile(customProfile);
```

## 📱 Mock Profile Features

### **What Each Mock Profile Includes:**
- **Basic Info**: Name, age, gender, school
- **Photos**: Multiple photos with primary photo designation
- **Interests**: Up to 4 interests from predefined categories
- **Profile Prompts**: Responses to 2-3 profile questions
- **Preferences**: Dating intentions and what they're looking for

### **Mock Profile Management:**
- **View All**: See all your created mock profiles
- **Create Samples**: One-click creation of 3 sample profiles
- **Delete**: Remove profiles you no longer need
- **Statistics**: View counts of profiles by gender

## 🐛 Troubleshooting

### **Email Verification Not Working:**
1. Check your Supabase Edge Function is deployed
2. Verify your email configuration in Supabase dashboard
3. Check the console logs for any errors
4. Ensure the verification code is being sent to your email

### **Mock Profiles Not Appearing:**
1. Verify the database schema was created correctly
2. Check that the mock profiles were created successfully
3. Ensure the RLS policies are working correctly
4. Check the console for any database errors

### **Database Connection Issues:**
1. Verify your Supabase URL and API keys
2. Check that the database is accessible
3. Ensure all tables were created successfully
4. Verify RLS policies are in place

## 🔄 Updating Mock Profiles

### **To Modify an Existing Profile:**
```typescript
const updates = {
  bio: 'Updated bio text',
  is_active: false, // Deactivate a profile
  status: 'testing' // Change status
};

const result = await MockProfileService.updateMockProfile(profileId, updates);
```

### **To Delete a Profile:**
```typescript
const result = await MockProfileService.deleteMockProfile(profileId);
```

## 📊 Database Schema Overview

### **New Tables Added:**
- `mock_profiles` - Main mock profile data
- `mock_profile_photos` - Photos for mock profiles
- `mock_profile_interests` - Interests for mock profiles
- `mock_profile_prompts` - Profile prompt responses

### **Updated Tables:**
- `swipes` - Now supports both real users and mock profiles
- `matches` - Now supports both real users and mock profiles

### **Key Features:**
- **Row Level Security (RLS)** - Proper access control
- **Foreign Key Constraints** - Data integrity
- **Indexes** - Performance optimization
- **Triggers** - Automatic timestamp updates

## 🎯 Next Steps

1. **Test the complete flow** - From email verification to seeing mock profiles
2. **Create more diverse profiles** - Add different ages, schools, interests
3. **Test swiping functionality** - Ensure mock profiles appear in the main swiping flow
4. **Customize the experience** - Modify the sample profiles to match your testing needs

## 🆘 Need Help?

If you encounter any issues:

1. Check the console logs for error messages
2. Verify your Supabase configuration
3. Ensure all files were created correctly
4. Check that the database schema matches exactly

## 🎉 Success Indicators

You'll know everything is working when:
- ✅ Email verification completes successfully
- ✅ Mock profiles appear in the Mock Profiles tab
- ✅ Mock profiles show up in the main swiping flow
- ✅ You can swipe on mock profiles
- ✅ Mock profiles can be created, viewed, and deleted

---

**Happy Testing! 🚀**
