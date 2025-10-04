# Progressive Onboarding Implementation

## Problem
Currently, all user data is processed at once on the community guidelines page. This creates a bottleneck where:
- Photo uploads happen all at once (can timeout)
- Database writes happen simultaneously
- Users get stuck waiting on the community guidelines page
- If creation fails, users end up with default/incomplete accounts

## Solution: Progressive Onboarding
Similar to Tinder, Bumble, and Hinge, we now save data incrementally as users progress through onboarding.

## Implementation Status

### ✅ Completed

1. **Using Existing Column**
   - Using existing `onboarding_completed` column in profiles table
   - Default value: `FALSE` (still onboarding)
   - Set to `TRUE` when onboarding completes
   - **No migration needed** - column already exists!

2. **Minimal Account Creation** (`app/(onboarding)/email-code.tsx`)
   - After email verification, creates minimal profile with:
     - `id` (from auth.users)
     - `email`
     - `onboarding_completed = false`
     - `status = 'active'`
   - **Also saves pre-verification data** collected before email verification:
     - School selection (from school-selection screen)
     - Blocked schools (from blocked-schools screen)
   - No heavy processing, relatively fast

3. **Password Saved Immediately** (`app/(onboarding)/password-creation.tsx`)
   - Password is set via `supabase.auth.updateUser()` immediately
   - No longer waits until end of onboarding

4. **Progressive Onboarding Service** (`services/progressiveOnboarding.ts`)
   - `updateProfile()` - Update profile fields from any screen
   - `uploadPhotos()` - Upload photos immediately with progress
   - `completeOnboarding()` - Flip completion flags
   - `getOrCreateSchool()` - Helper for school selection

### 🔨 Remaining Work

You need to update each onboarding screen to save its data immediately using the `ProgressiveOnboardingService`:

#### 1. Basic Details Screen (`app/(onboarding)/basic-details.tsx`)
Add after user enters their details:
```typescript
import { ProgressiveOnboardingService } from '../../services/progressiveOnboarding';

const handleContinue = async () => {
  // Save basic details immediately
  const result = await ProgressiveOnboardingService.updateProfile({
    first_name: firstName,
    username: username,
    date_of_birth: dateOfBirth.toISOString().split('T')[0],
  });

  if (!result.success) {
    Alert.alert('Error', 'Failed to save details. Please try again.');
    return;
  }

  // Continue to next screen
  router.push('/(onboarding)/next-screen');
};
```

#### 2. School Selection Screen (`app/(onboarding)/school-selection.tsx`)
Add after school selection:
```typescript
const handleSchoolSelect = async (schoolName: string) => {
  // Get or create school
  const schoolResult = await ProgressiveOnboardingService.getOrCreateSchool(schoolName);

  if (!schoolResult.success) {
    Alert.alert('Error', 'Failed to save school. Please try again.');
    return;
  }

  // Update profile with school
  await ProgressiveOnboardingService.updateProfile({
    school_id: schoolResult.schoolId,
    school_name: schoolName,
  });

  // Continue
  router.push('/(onboarding)/next-screen');
};
```

#### 3. Gender/Preferences Screens
```typescript
await ProgressiveOnboardingService.updateProfile({
  gender: selectedGender,
  match_preferences: selectedPreference,
  looking_for_friends_or_dates: lookingFor,
  relationship_status: status,
});
```

#### 4. Photo Upload Screen (`app/(onboarding)/photo-upload.tsx`)
**IMPORTANT**: Upload photos as soon as user selects them, show progress:
```typescript
const handlePhotoSelect = async (photoUri: string) => {
  // Show loading
  setUploadingPhoto(true);

  // Upload immediately
  const result = await ProgressiveOnboardingService.uploadPhotos([photoUri]);

  setUploadingPhoto(false);

  if (!result.success) {
    Alert.alert('Error', 'Failed to upload photo. Please try again.');
    return;
  }

  // Add to displayed photos
  setPhotos([...photos, result.urls[0]]);
};
```

#### 5. Profile Prompts Screen
```typescript
await ProgressiveOnboardingService.updateProfile({
  profile_prompts: promptsObject,
});
```

#### 6. Other Onboarding Screens
Update each screen to save its specific data:
- Bio screen → `bio`
- Interests screen → `interests`
- Dating intentions → `dating_intentions`, `looking_for_debs`
- Blocked schools → `blocked_schools`

#### 7. Community Guidelines Screen (`app/(onboarding)/community-guidelines.tsx`)
**MAJOR CHANGE**: Remove the entire `createUserAccount()` function. Replace with:
```typescript
const handleContinue = async () => {
  if (!agreedToGuidelines) return;

  // Just flip the completion flag - all data already saved!
  const result = await ProgressiveOnboardingService.completeOnboarding();

  if (!result.success) {
    Alert.alert('Error', 'Failed to complete onboarding. Please try again.');
    return;
  }

  // Navigate to app
  router.push('/(tabs)');
};
```

This should be **instant** since there's no heavy processing.

### 8. Update Matching Algorithms

In all files that query profiles for matching, add this filter:
```typescript
// In services/matching.ts, etc.
const { data: profiles } = await supabase
  .from('profiles')
  .select('*')
  .eq('onboarding_completed', true)  // ← ADD THIS
  .eq('status', 'active')
  // ... other filters
```

This ensures incomplete profiles don't appear in discovery.

## Onboarding Flow & Save Points

### Before Email Verification (No authenticated user yet)
These screens save to **Context only**:
1. `mascot-intro` → No data saved
2. `school-selection` → Saves school to context
3. `blocked-schools` → Saves blocked schools to context

### Email Verification (Account Creation)
4. `email-verification` → Sends verification code
5. `email-code` → **Creates account + saves all pre-verification data**
   - Creates minimal profile
   - Saves school to database
   - Saves blocked schools to database

### After Email Verification (Authenticated user exists)
These screens save to **Database immediately**:
6. `password-creation` → Saves password via auth.updateUser()
7. `basic-details` → Saves first_name, username
8. `date-of-birth` → Saves date_of_birth
9. `gender-selection` → Saves gender
10. `gender-preference` → Saves match_preferences
11. `photo-upload` → **Uploads photos immediately** as selected
12. `profile-prompts` → Saves profile_prompts
13. `community-guidelines` → **Just flips onboarding_completed flag**

## Benefits

1. **No single point of failure** - each screen saves independently (after email verification)
2. **Better UX** - users see immediate feedback as data saves
3. **Photo uploads spread out** - not all at once, with progress bars
4. **Resumable** - users can quit and resume later
5. **Fast completion** - final screen just flips a flag
6. **Pre-verification data preserved** - school/blocked schools saved to context, then DB after account creation

## Testing Checklist

- [ ] Test email verification creates minimal profile with `onboarding_completed = false`
- [ ] Test each onboarding screen saves its data immediately
- [ ] Test photo upload shows progress
- [ ] Test community guidelines completes instantly (just flips flag to `true`)
- [ ] Test incomplete profiles (`onboarding_completed = false`) don't appear in discovery
- [ ] Test users can resume onboarding after quitting
- [ ] Verify existing users with `onboarding_completed = true` still work normally
