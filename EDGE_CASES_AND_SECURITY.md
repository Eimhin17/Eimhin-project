# Edge Cases & Security Analysis

## ✅ Protected Areas (Secure)

### 1. **Profile Visibility in Swiping**
- ✅ **Status**: SECURE
- **Protection**: Database RLS policies filter `profile_completed = true`
- **Service Layer**: `realUsers.ts` also filters at application level
- **Result**: Incomplete profiles CANNOT appear in swipe stacks

### 2. **Likes System**
- ✅ **Status**: SECURE
- **Protection**: RLS policies ensure only completed profiles can like/be liked
- **Service Layer**: `likes.ts` filters for `profile_completed = true`
- **Result**: Incomplete profiles CANNOT send or receive likes

### 3. **Matches System**
- ✅ **Status**: SECURE
- **Protection**: RLS policies prevent incomplete profiles from matching
- **Service Layer**: `matching.ts` filters for completed profiles
- **Result**: Incomplete profiles CANNOT create matches

### 4. **Login & App Reentry**
- ✅ **Status**: SECURE
- **Protection**: Dual-check system catches incomplete profiles
  - `app/_layout.tsx`: Checks on app reentry
  - `app/(auth)/login.tsx`: Checks on login
- **Result**: Users are ALWAYS prompted to complete or restart

### 5. **Direct Navigation (Deep Links)**
- ✅ **Status**: SECURE
- **Protection**: Root layout checks profile completion before any navigation
- **Result**: Deep links won't bypass the incomplete profile check

## ⚠️ Expected Behavior (By Design)

### 1. **Photo Upload During Onboarding**
- ⚠️ **Status**: ALLOWED (By Design)
- **Why**: Users MUST upload photos during onboarding before completing profile
- **Services**: `photoUpload.ts` and `profilePicture.ts` allow uploads
- **Storage**: Photos saved to `user-photos` and `user-pfps` buckets
- **Cleanup**: If user deletes incomplete profile (start over), photos remain in storage
- **Recommendation**: Add cleanup function to delete orphaned photos

### 2. **Profile Data During Onboarding**
- ⚠️ **Status**: ALLOWED (By Design)
- **Why**: Progressive onboarding saves data page-by-page
- **Service**: `progressiveOnboarding.ts` updates profile incrementally
- **Result**: Incomplete profiles have partial data in database
- **Protection**: `profile_completed = false` prevents visibility

## 🔴 Potential Vulnerabilities (Need Attention)

### 1. **Messages/Chat Access**
- 🔴 **Status**: POTENTIALLY VULNERABLE
- **Issue**: No explicit RLS policies found for messages table filtering by `profile_completed`
- **Current Protection**:
  - Matches RLS prevents incomplete profiles from having matches
  - Can only message if you have a match
  - Indirect protection through matches table
- **Risk Level**: LOW (but should be hardened)
- **Recommendation**: Add explicit RLS policy to messages table

```sql
-- Add to secure-incomplete-profiles.sql
DROP POLICY IF EXISTS "Users can only message within completed profile matches" ON messages;
CREATE POLICY "Users can only message within completed profile matches"
  ON messages
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM matches m
      JOIN profiles p1 ON m.user1_id = p1.id
      JOIN profiles p2 ON m.user2_id = p2.id
      WHERE m.id = match_id
      AND p1.profile_completed = true
      AND p2.profile_completed = true
      AND (p1.id = auth.uid() OR p2.id = auth.uid())
    )
  );
```

### 2. **Real-time Subscriptions**
- 🔴 **Status**: POTENTIALLY VULNERABLE
- **Issue**: Real-time channels don't check `profile_completed` before subscribing
- **Current Protection**: Indirect through matches (can't subscribe to non-existent match)
- **Risk Level**: LOW
- **Recommendation**: Add server-side check before allowing channel subscription

### 3. **Storage Bucket Policies**
- 🔴 **Status**: UNKNOWN
- **Issue**: Haven't verified storage bucket RLS policies
- **Buckets**: `user-photos`, `user-pfps`
- **Risk Level**: MEDIUM
- **Recommendation**: Verify bucket policies restrict access to completed profiles only (except during onboarding)

```sql
-- Recommended bucket policies
-- user-photos: Allow read only for completed profiles
-- user-pfps: Allow read only for completed profiles
-- Exception: Owner can always access their own photos during onboarding
```

### 4. **Push Notifications**
- 🔴 **Status**: UNKNOWN
- **Issue**: Haven't verified if incomplete profiles can receive push notifications
- **Risk Level**: LOW (annoying but not a security breach)
- **Recommendation**: Check `push_tokens` table and notification service

### 5. **Orphaned Photos in Storage**
- 🔴 **Status**: RESOURCE LEAK
- **Issue**: When user "starts over", photos are uploaded but not deleted
- **Impact**: Wasted storage space, potential privacy issue
- **Risk Level**: MEDIUM
- **Recommendation**: Add cleanup function

```typescript
// Add to ProgressiveOnboardingService.resetOnboarding()
static async deleteUserPhotos(userId: string) {
  // Get username
  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', userId)
    .single();

  if (profile?.username) {
    // Delete all photos for this user
    await supabase.storage
      .from('user-photos')
      .remove([`${profile.username}`]);

    await supabase.storage
      .from('user-pfps')
      .remove([`${profile.username}`]);
  }
}
```

### 6. **Chat Service Profile Fetch**
- 🔴 **Status**: DEFENSIVE CHECK MISSING
- **Issue**: `chat.ts` fetches profiles without `profile_completed` filter
- **Current Protection**: Only fetches for existing matches (which require completed profiles)
- **Risk Level**: LOW
- **Recommendation**: Add defensive filter for safety

```typescript
// In chat.ts, line 37-46
const { data: users, error: usersError } = await supabase
  .from('profiles')
  .select(`
    id,
    first_name,
    username,
    school_id,
    schools (school_name)
  `)
  .in('id', Array.from(userIds))
  .eq('profile_completed', true)  // ADD THIS
  .eq('status', 'active');        // ADD THIS
```

### 7. **Profile Data Exposure in Separate Tables**
- 🔴 **Status**: POTENTIALLY VULNERABLE
- **Tables**: `user_interests`, `user_profile_prompts`, `user_photos`
- **Issue**: These tables might not have RLS policies checking `profile_completed`
- **Risk Level**: MEDIUM
- **Recommendation**: Add RLS policies to all related tables

```sql
-- Example for user_interests
CREATE POLICY "Interests only visible for completed profiles"
  ON user_interests
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = user_interests.user_id
      AND profile_completed = true
    )
  );
```

## 🛡️ Additional Security Recommendations

### 1. **Rate Limiting**
- Add rate limiting to prevent abuse:
  - Profile creation attempts
  - Photo uploads
  - Password reset requests

### 2. **Session Management**
- Track multiple sessions per user
- Invalidate all sessions when "starting over"
- Prevent concurrent onboarding sessions

### 3. **Data Validation**
- Add server-side validation for all onboarding fields
- Prevent SQL injection in bio/prompts
- Sanitize user input

### 4. **Audit Logging**
- Log when profiles are marked as complete
- Log when profiles are deleted (start over)
- Track suspicious activity (multiple incomplete profiles from same IP)

### 5. **Monitoring Alerts**
- Alert on high number of incomplete profiles
- Alert on abandoned profiles (30+ days)
- Alert on unusual activity patterns

## 📋 Action Items (Priority Order)

### High Priority
1. ✅ Add messages RLS policy filtering by `profile_completed`
2. ✅ Add related tables RLS policies (interests, prompts, photos)
3. ✅ Implement photo cleanup when user "starts over"
4. ✅ Add defensive `profile_completed` check in chat service

### Medium Priority
5. ✅ Verify and secure storage bucket policies
6. ✅ Add push notification checks for incomplete profiles
7. ✅ Implement orphaned photo cleanup cron job

### Low Priority
8. ✅ Add rate limiting
9. ✅ Implement audit logging
10. ✅ Set up monitoring alerts

## 🧪 Additional Testing Scenarios

### Test Case 1: Direct API Calls
1. Use Postman/curl to call Supabase API directly
2. Try to fetch incomplete profiles
3. Try to create likes/matches with incomplete profile
4. Expected: All should fail due to RLS

### Test Case 2: Concurrent Sessions
1. Start onboarding on Device A
2. Log in on Device B with same email
3. Expected: Both should show resume modal

### Test Case 3: Storage Access
1. Create incomplete profile with photos
2. Log in as different user
3. Try to access photos via direct URL
4. Expected: Should fail (403 Forbidden)

### Test Case 4: Real-time Channels
1. Create incomplete profile
2. Try to subscribe to matches/messages channel
3. Expected: Should not receive any data

### Test Case 5: Race Conditions
1. Mark profile as complete
2. Immediately try to appear in swipe stack
3. Expected: Should work (no caching issues)

## 📝 Summary

**Overall Security Rating**: 🟡 MOSTLY SECURE with some gaps

**Protected**:
- ✅ Profile visibility (swiping)
- ✅ Likes system
- ✅ Matches system
- ✅ Login/reentry checks
- ✅ Deep link protection

**Needs Attention**:
- 🔴 Messages RLS policies
- 🔴 Real-time subscription validation
- 🔴 Storage bucket policies
- 🔴 Related tables RLS (interests, prompts, photos)
- 🔴 Photo cleanup on "start over"
- 🔴 Push notification access

**Expected Behavior**:
- ⚠️ Photos can be uploaded during onboarding
- ⚠️ Partial profile data exists for incomplete profiles

The system is well-designed with multi-layer protection, but a few edge cases need hardening for complete security.
