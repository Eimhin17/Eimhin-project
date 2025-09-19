# DebsMatch Matching System Guide

## Overview
This guide explains how the matching system works in DebsMatch, including how likes are stored, how matches are created, and how they appear in the Chats tab.

## Database Schema

### Likes Table
```sql
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  liker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  liked_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(liker_id, liked_user_id)
);
```

### Matches Table
```sql
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  matched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user1_id, user2_id)
);
```

## How Matching Works

### 1. User Likes Another User
When a user swipes right on another user's profile:
- A record is created in the `likes` table
- The `liker_id` is the current user's ID
- The `liked_user_id` is the profile they liked

### 2. Mutual Like Detection
When a user likes someone, the system checks if that person has already liked them:
- Queries the `likes` table for both directions
- If both users have liked each other, a match is created

### 3. Match Creation
When a mutual like is detected:
- A record is created in the `matches` table
- `user1_id` is always the smaller UUID for consistency
- `user2_id` is the larger UUID
- `matched_at` is set to the current timestamp
- `is_active` is set to true

### 4. Match Display in Chats
The Chats tab fetches matches by:
- Querying the `matches` table for the current user
- Looking for records where `user1_id` OR `user2_id` equals the current user's ID
- Joining with the `users` table to get the other user's information
- Ordering by `matched_at` (most recent first)

## RLS Policies

### Likes Table
- Users can only view likes where they are the liker or liked user
- Users can only create likes where they are the liker
- Users can delete their own likes
- No updates allowed (users should delete and recreate)

### Matches Table
- Users can view matches where they are user1 or user2
- Users can create matches (handled by the service)
- Users can update their matches (for marking as inactive)
- Users can delete their matches (for unmatching)

## Services

### LikesService
- `createLike(likerId, likedUserId)` - Creates a like
- `checkMutualLike(user1Id, user2Id)` - Checks if both users have liked each other
- `hasLiked(likerId, likedUserId)` - Checks if one user has liked another
- `removeLike(likerId, likedUserId)` - Removes a like

### MatchingService
- `checkForMatch(user1Id, user2Id)` - Checks if two users have matched
- `createMatch(user1Id, user2Id)` - Creates a match between two users
- `getExistingMatch(user1Id, user2Id)` - Checks if a match already exists
- `getUserMatches(userId)` - Gets all matches for a user

### ChatService
- `getMatches(userId)` - Gets all matches for the Chats tab
- `getMessages(matchId)` - Gets messages for a specific match
- `sendMessage(matchId, messageText)` - Sends a message
- `markMessagesAsRead(matchId)` - Marks messages as read

## Testing

To test the matching system:

1. Run the RLS policy fix:
   ```sql
   -- Run the contents of fix-matches-rls-policies.sql in your Supabase SQL editor
   ```

2. Test the matching flow:
   ```bash
   cd scripts
   node test-matching-flow.js
   ```

## Troubleshooting

### Common Issues

1. **Matches not appearing in Chats tab**
   - Check RLS policies are correct
   - Verify both users have liked each other
   - Check console logs for errors

2. **Duplicate matches**
   - The system checks for existing matches before creating new ones
   - If duplicates exist, clean them up manually

3. **RLS permission errors**
   - Ensure the RLS policies are applied correctly
   - Check that users are authenticated

### Debug Steps

1. Check if likes exist:
   ```sql
   SELECT * FROM likes WHERE liker_id = 'user-id' OR liked_user_id = 'user-id';
   ```

2. Check if matches exist:
   ```sql
   SELECT * FROM matches WHERE user1_id = 'user-id' OR user2_id = 'user-id';
   ```

3. Check RLS policies:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'matches';
   ```

## Security Considerations

- All database operations are protected by RLS policies
- Users can only access their own data
- Match creation is handled server-side
- No sensitive data is exposed to unauthorized users

## Performance Considerations

- Indexes are created on frequently queried columns
- Matches are ordered by `matched_at` for efficient retrieval
- Unread message counts are calculated efficiently
- Real-time subscriptions are used for live updates
