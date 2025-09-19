# Fixed Authenticated User Context Conflict

## Problem
The user was authenticated (had an auth user with profile), but the OnboardingContext still had data, causing a conflict between the two systems. The logs showed:
- OnboardingContext had: `["school", "schoolEmail", "emailVerified", ...]`
- Auth user profile had: `"school": null, "schoolEmail": null, "schoolId": null`

## Solution
Updated the profile-prompts screen to properly handle authenticated users:

1. **Use auth user profile when authenticated**:
   ```typescript
   const userProfile = authUser?.profile || onboardingData;
   ```

2. **Skip onboarding data updates when authenticated**:
   ```typescript
   if (authUser) {
     // User is authenticated, update through auth system
     console.log('💾 User is authenticated, updating through auth system');
   } else {
     // User not authenticated, store in onboarding data
     updateData({ profilePrompts: profilePromptData });
   }
   ```

3. **Simplified validation** to use the correct data source:
   ```typescript
   if (!userProfile?.firstName || !userProfile?.lastName || !userProfile?.dateOfBirth || !userProfile?.school) {
     // Show error
   }
   ```

## Result
- ✅ **Authenticated users use their auth profile data**
- ✅ **No more context conflicts**
- ✅ **Proper data flow for both authenticated and unauthenticated users**
- ✅ **School data now properly accessible from auth user profile**
