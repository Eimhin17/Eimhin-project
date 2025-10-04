# Incomplete Profile Security System

## Overview

This system prevents incomplete profiles from being treated as real accounts in the DebsMatch app. It ensures that only fully completed profiles can:
- Be seen by other users when swiping
- Send or receive likes
- Create matches
- Appear in search results
- Be accessed directly

## How It Works

### 1. Profile Completion Tracking

Every profile has two key fields:
- `profile_completed` (BOOLEAN): Set to `false` by default, becomes `true` when user completes onboarding
- `onboarding_step` (TEXT): Tracks the last page the user was on during onboarding

### 2. Setting Profile as Completed

The profile is marked as completed in `app/(onboarding)/community-guidelines.tsx` when the user:
1. Agrees to the community guidelines
2. Presses the "Continue" button

This happens via the `ProgressiveOnboardingService.completeOnboarding()` method which sets:
- `profile_completed = true`
- `onboarding_completed = true`

### 3. Resume Modal Logic - Two Triggers

The `ResumeOnboardingModal` appears in **two scenarios**:

#### A. When User Reenters the App (`app/_layout.tsx`)

When the app starts and a user is authenticated:

1. **Check Profile Status**: The root layout checks if `profile_completed = true` in the database
2. **If Incomplete**: Shows `ResumeOnboardingModal` with two options:
   - **Resume Progress**: Takes user to their last onboarding step (saved in `onboarding_step` field)
   - **Start Over**: Deletes the incomplete profile and starts onboarding from scratch
3. **If Complete**: Proceeds normally to the main app

#### B. When User Logs In (`app/(auth)/login.tsx`)

When a user logs in with credentials:

1. **Check Profile Status**: After successful authentication, the system checks if `profile_completed = true`
2. **If Incomplete**: Shows `ResumeOnboardingModal` with the same two options
3. **If Complete**: Proceeds normally to the main app

This dual-check ensures incomplete profiles are caught whether the user:
- Opens the app while already logged in (session persists)
- Explicitly logs in with email/password

### 4. Database Security (RLS Policies)

The file `database/secure-incomplete-profiles.sql` contains:

#### RLS Policies
- **Public Profile Visibility**: Only profiles with `profile_completed = true` and `status = 'active'` are visible to other users
- **Own Profile Access**: Users can always see their own profile (even if incomplete)
- **Swipe Protection**: Only completed profiles can swipe and be swiped on
- **Like Protection**: Only completed profiles can like and be liked
- **Match Protection**: Only completed profiles can have matches

#### Indexes
- `idx_profiles_completed`: Fast filtering on `profile_completed = true`
- `idx_profiles_active_completed`: Composite index for common queries

#### Helper Functions
- `check_user_access_status(user_id)`: Returns profile status ('complete', 'incomplete', 'suspended', 'not_found')
- `cleanup_abandoned_incomplete_profiles()`: Removes incomplete profiles older than 30 days

### 5. Service Layer Filters

All profile queries have been updated to filter incomplete profiles:

#### `/services/realUsers.ts`
- `getActiveUserProfiles()`: Filters for `profile_completed = true`
- `getUserProfilesForSwiping()`: Filters for `profile_completed = true`
- Added `profile_completed` field to `RealUserProfile` interface

#### `/services/matching.ts`
- `getUserMatches()`: Only returns matches with completed profiles

#### `/services/likes.ts`
- `getLikesReceived()`: Only shows likes from completed profiles
- `getLikesGiven()`: Only shows likes to completed profiles

## Database Migration

To apply this system to your database, run:

```bash
psql "$DATABASE_URL" -f database/secure-incomplete-profiles.sql
```

This will:
1. Add the `onboarding_step` column to profiles table
2. Create indexes for fast filtering
3. Set up RLS policies to protect incomplete profiles
4. Create helper functions for profile status checking and cleanup

## Security Features

### 1. Row-Level Security (RLS)
- Incomplete profiles are invisible to other users
- Users can only access their own incomplete profile
- Database-level enforcement (can't be bypassed by client code)

### 2. Multi-Layer Protection
- Database RLS policies (primary security)
- Service layer filters (performance optimization)
- Application logic (user experience)

### 3. Data Cleanup
- Automatic cleanup function for abandoned incomplete profiles (30+ days old)
- Can be run manually or scheduled as a cron job

## Testing the System

### 1. Test Incomplete Profile - Login Flow (NEW!)
1. Start onboarding but don't complete it
2. Close the app (or log out)
3. Try to log in with the email (enter password)
4. Should see the "Resume Progress" or "Start Over" modal IMMEDIATELY (before auth attempt) ✅
5. No "Invalid credentials" error for incomplete accounts ✅

### 2. Test Incomplete Profile - App Reentry
1. Start onboarding but don't complete it
2. Close the app (don't log out - session persists)
3. Reopen the app
4. Should see the "Resume Progress" or "Start Over" modal ✅

### 3. Test Profile Invisibility
1. Create an incomplete profile
2. Log in with a different account
3. Incomplete profile should NOT appear in swiping stack ✅

### 4. Test Resume Functionality
1. Start onboarding, stop at any page
2. Close and reopen app OR log in again
3. Click "Resume Progress"
4. Should return to the exact page you left off ✅

### 5. Test Start Over - Authenticated User
1. Start onboarding, complete authentication, stop at any page
2. Close and reopen app OR log in again
3. Click "Start Over"
4. Profile should be deleted from database
5. Should restart onboarding from the beginning ✅

### 6. Test Start Over - Unauthenticated User
1. Start onboarding, DON'T complete email verification
2. Close and reopen app
3. Click "Start Over"
4. Only local data cleared (no database deletion needed)
5. Can start fresh onboarding ✅

## Monitoring & Maintenance

### Check Incomplete Profiles
```sql
SELECT
  profile_completed,
  COUNT(*)
FROM profiles
GROUP BY profile_completed;
```

### Find Abandoned Profiles
```sql
SELECT id, email, created_at
FROM profiles
WHERE profile_completed = false
AND created_at < NOW() - INTERVAL '30 days';
```

### Cleanup Abandoned Profiles
```sql
SELECT cleanup_abandoned_incomplete_profiles();
```

## Important Notes

1. **Existing Users**: Existing complete profiles will continue to work normally. The `profile_completed` field defaults to `false`, so you may need to run a migration to set it to `true` for existing complete profiles:

```sql
UPDATE profiles
SET profile_completed = true
WHERE onboarding_completed = true;
```

2. **Onboarding Step Tracking**: Each onboarding page should call:
```typescript
ProgressiveOnboardingService.updateProfile({
  onboarding_step: ONBOARDING_STEPS.CURRENT_PAGE
});
```

3. **Email Verification**: This system works alongside email verification. A user needs BOTH:
   - Verified email (from OTP)
   - Completed profile (`profile_completed = true`)

## Additional Security Enhancements

The system includes several additional security features:

1. **Profile Completion Validation**: Only the community guidelines page can set `profile_completed = true`

2. **Cascade Deletion**: When a user deletes their incomplete profile (start over), all associated data is deleted via `ON DELETE CASCADE`

3. **Status Checking**: Helper function to check profile status before allowing actions

4. **Automatic Cleanup**: Old incomplete profiles are automatically cleaned up (preventing database bloat)

## Future Improvements

Consider implementing:

1. **Analytics**: Track how many users resume vs start over
2. **Email Reminders**: Send email to users with incomplete profiles
3. **Time Limits**: Automatically delete incomplete profiles after X days
4. **Progress Bar**: Show users how much of onboarding they've completed

## Troubleshooting

### Issue: Users can't log in
- **Check**: Is `profile_completed = true` in their profile?
- **Fix**: Run `UPDATE profiles SET profile_completed = true WHERE id = 'user_id';`

### Issue: Incomplete profiles still showing
- **Check**: Are RLS policies enabled? `SELECT * FROM pg_policies WHERE tablename = 'profiles';`
- **Fix**: Re-run the migration script

### Issue: Resume not working
- **Check**: Is `onboarding_step` being saved? Check the database.
- **Fix**: Ensure each onboarding page calls `updateProfile({ onboarding_step: ... })`

## Summary

This system provides comprehensive protection against incomplete profiles by:
- ✅ Using database-level RLS policies for security
- ✅ Filtering at the service layer for performance
- ✅ Providing a smooth user experience with resume/restart options
- ✅ Tracking onboarding progress for easy resumption
- ✅ Automatically cleaning up abandoned profiles
- ✅ Preventing incomplete profiles from participating in app features

The implementation is secure, performant, and user-friendly.
