# DebsMatch Supabase Auth Database Schema Guide

## Overview

This document describes the new database schema that integrates with Supabase Auth, replacing the custom authentication system with a clean, maintainable architecture.

## Key Changes from Previous Schema

1. **Authentication**: Now uses Supabase Auth exclusively - no more custom auth tables
2. **Profiles Table**: New `profiles` table linked to `auth.users` via foreign key
3. **Metrics & Analytics**: Added `user_demographics` and `app_events` tables
4. **Cleaner Structure**: Removed redundant fields and simplified relationships
5. **Better Security**: Enhanced RLS policies and proper user isolation

## Database Schema

### Core Tables

#### 1. `profiles` - User Profiles (Linked to Supabase Auth)
- **Primary Key**: `id` (references `auth.users.id`)
- **Purpose**: Stores all user profile information
- **Key Fields**:
  - Basic info: `first_name`, `last_name`, `date_of_birth`, `gender`
  - Preferences: `looking_for`, `relationship_intention`
  - School: `school_id` (references `schools.id`)
  - Privacy: `privacy_level`, notification settings
  - Legal: Terms acceptance flags
  - Status: `onboarding_completed`, `profile_completed`

#### 2. `schools` - Irish Secondary Schools
- **Purpose**: Master list of schools for user selection
- **Key Fields**: `name`, `county`, `address`, `coordinates`
- **Sample Data**: 22 schools across Ireland (Dublin, Cork, Limerick, Galway, Louth)

#### 3. `interests` - User Interests
- **Purpose**: Categorized interests for matching
- **Key Fields**: `name`, `category`, `icon_name`, `popularity_score`
- **Categories**: Sports, Arts, Leisure, Technology, Lifestyle

### Content Tables

#### 4. `user_photos` - User Photos
- **Purpose**: Multiple photos per user with primary photo designation
- **Key Fields**: `photo_url`, `photo_order`, `is_primary`, `moderation_status`
- **Constraints**: Only one primary photo per user

#### 5. `profile_prompts` - Profile Questions
- **Purpose**: Questions users can answer to enhance profiles
- **Key Fields**: `prompt_text`, `category`, `is_required`, `max_length`
- **Sample Data**: 15 prompts across Dating, Personality, Opinions, etc.

#### 6. `voice_prompts` - Audio Questions
- **Purpose**: Audio-based profile questions
- **Key Fields**: `prompt_text`, `max_duration_seconds`

### Matching & Interaction Tables

#### 7. `user_preferences` - Matching Preferences
- **Purpose**: User preferences for the matching algorithm
- **Key Fields**: Age range, distance, school preferences, interest requirements

#### 8. `swipes` - User Interactions
- **Purpose**: Tracks left/right swipes between users
- **Key Fields**: `swiper_id`, `swiped_user_id`, `direction`

#### 9. `matches` - Mutual Matches
- **Purpose**: Records when two users both like each other
- **Key Fields**: `user1_id`, `user2_id`, `matched_at`
- **Constraint**: `user1_id < user2_id` for consistency

#### 10. `messages` - Chat Messages
- **Purpose**: Messages between matched users
- **Key Fields**: `match_id`, `sender_id`, `content`, `message_type`

### Analytics & Metrics Tables

#### 11. `user_demographics` - User Analytics
- **Purpose**: Track user demographics and engagement metrics
- **Key Fields**:
  - Demographics: `age_group`, `county`, `school_type`
  - Usage: `total_swipes`, `total_matches`, `total_messages`
  - Engagement: `profile_completion_percentage`, `days_since_signup`

#### 12. `app_events` - Application Events
- **Purpose**: Track user actions and app usage for analytics
- **Key Fields**: `event_type`, `event_data` (JSONB), `session_id`, `device_type`
- **Event Types**: signup, login, swipe, match, message, etc.

### Legal & Compliance Tables

#### 13. `legal_documents` - Terms & Policies
- **Purpose**: Store legal documents with versioning
- **Key Fields**: `document_type`, `version`, `content`, `effective_date`

#### 14. `user_legal_acceptances` - User Consent
- **Purpose**: Track user acceptance of legal documents
- **Key Fields**: `user_id`, `document_id`, `accepted_at`, `ip_address`

### Moderation & Safety Tables

#### 15. `content_reports` - User Reports
- **Purpose**: Handle user reports of inappropriate content
- **Key Fields**: `reporter_id`, `reported_user_id`, `content_type`, `reason`

#### 16. `mock_profiles` - Testing Profiles
- **Purpose**: Mock profiles for testing and development
- **Key Fields**: Basic profile information without auth integration

## Database Functions

### 1. `calculate_user_age(birth_date)`
- Returns user age from date of birth
- Used for age verification and preferences

### 2. `can_users_match(user1_id, user2_id)`
- Checks if two users can match based on age and other criteria
- Returns boolean for match validation

### 3. `handle_new_user()`
- **Trigger Function**: Automatically creates profile when user signs up
- Extracts data from `auth.users.raw_user_meta_data`
- Ensures profile creation is automatic and consistent

## Row Level Security (RLS)

### Enabled on All User Tables
- `profiles`, `user_photos`, `user_interests`, etc.
- Ensures users can only access their own data

### Basic Policies
1. **Own Profile**: Users can view/update their own profile
2. **Other Profiles**: Users can view other active, completed profiles
3. **Content**: Users can only access their own content

## Triggers

### 1. `update_updated_at_column()`
- Automatically updates `updated_at` timestamp on table updates
- Applied to: `profiles`, `user_preferences`, `user_profile_prompts`, `user_demographics`

### 2. `on_auth_user_created`
- Automatically creates profile when user signs up via Supabase Auth
- Extracts metadata from auth signup process

## Sample Data

The schema includes comprehensive sample data:
- **22 Irish secondary schools** across major counties
- **30 interests** across 5 categories
- **15 profile prompts** for user engagement
- **5 voice prompts** for audio content
- **3 legal documents** (terms, privacy, age verification)

## Usage Examples

### Creating a New User
```sql
-- User signs up via Supabase Auth
-- Profile is automatically created via trigger
-- No manual profile creation needed
```

### Querying User Profile
```sql
SELECT p.*, s.name as school_name
FROM profiles p
LEFT JOIN schools s ON p.school_id = s.id
WHERE p.id = auth.uid();
```

### Getting User Interests
```sql
SELECT i.name, i.category
FROM user_interests ui
JOIN interests i ON ui.interest_id = i.id
WHERE ui.user_id = auth.uid();
```

### Analytics Query
```sql
SELECT 
  age_group,
  county,
  COUNT(*) as user_count,
  AVG(profile_completion_percentage) as avg_completion
FROM user_demographics
GROUP BY age_group, county;
```

## Migration Notes

Since you're deleting all users, this schema provides:
1. **Clean Slate**: No legacy data to migrate
2. **Fresh Start**: All tables start with sample data only
3. **No Migration Scripts**: Direct schema application
4. **Immediate Use**: Ready for new user signups

## Security Considerations

1. **RLS Enabled**: All user tables have row-level security
2. **Auth Integration**: Direct link to Supabase Auth users
3. **Data Isolation**: Users can only access their own data
4. **Moderation**: Content moderation status on all user-generated content

## Performance Optimizations

1. **Proper Indexing**: Strategic indexes on frequently queried fields
2. **GIN Indexes**: Full-text search on text fields
3. **Composite Indexes**: Optimized for common query patterns
4. **Efficient Joins**: Proper foreign key relationships

## Next Steps

1. **Apply Schema**: Run the SQL file in your Supabase database
2. **Update Types**: Modify your TypeScript types to match new schema
3. **Update Services**: Modify your service layer to use new table structure
4. **Test Integration**: Verify Supabase Auth integration works correctly
5. **Update UI**: Modify frontend to work with new data structure

## Support

This schema is designed to be:
- **Maintainable**: Clear structure and relationships
- **Scalable**: Proper indexing and efficient queries
- **Secure**: RLS policies and proper data isolation
- **Flexible**: JSONB fields for extensible data storage
