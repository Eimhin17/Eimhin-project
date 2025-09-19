# DebsMatch Database Setup Guide

This guide will walk you through setting up your complete database in Supabase for the DebsMatch app.

## 🚀 Quick Setup Steps

### 1. Access Your Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign in
2. Select your project: `tagjfsxeutihwntpudsk`
3. Navigate to the **SQL Editor** in the left sidebar

### 2. Run the Database Setup Script
1. In the SQL Editor, click **"New Query"**
2. Copy the entire contents of `setup.sql` from this folder
3. Paste it into the SQL Editor
4. Click **"Run"** to execute the script

### 3. Verify the Setup
After running the script, you should see:
- ✅ All tables created successfully
- ✅ Sample data inserted (schools, interests, profile prompts)
- ✅ Row Level Security (RLS) policies enabled
- ✅ Indexes created for performance

## 📊 Database Tables Created

### Core Tables
- **`users`** - User profiles and authentication data
- **`schools`** - Irish secondary schools
- **`interests`** - Hobbies and activities
- **`profile_prompts`** - Hinge-style profile questions

### User Data Tables
- **`user_photos`** - Profile photos
- **`user_interests`** - User's selected interests
- **`user_profile_prompts`** - User's responses to prompts
- **`user_voice_prompts`** - Voice recordings (future feature)
- **`user_preferences`** - Dating preferences and filters

### Interaction Tables
- **`swipes`** - Left/right swipes
- **`matches`** - Successful matches between users
- **`messages`** - Chat messages between matches

## 🔐 Security Features

### Row Level Security (RLS)
- Users can only see their own data
- Users can see other active users' public information
- Swipes and matches are properly secured
- Messages are only visible to matched users

### Authentication Integration
- All tables integrate with Supabase Auth
- User IDs automatically link to `auth.users`
- Secure session management

## 📱 App Integration

Your app is now fully configured to work with this database:

- **Authentication Service** - Handles user sign up/sign in
- **User Service** - Manages profiles, photos, interests
- **Matching Service** - Handles swipes and matches
- **Chat Service** - Manages messaging between matches

## 🧪 Testing the Setup

### 1. Create a Test User
1. Go to **Authentication > Users** in Supabase
2. Create a new user manually or test the sign-up flow

### 2. Check Sample Data
1. Go to **Table Editor** in Supabase
2. Browse the `schools`, `interests`, and `profile_prompts` tables
3. Verify sample data is present

### 3. Test App Connection
1. Run your DebsMatch app
2. Try to sign up or sign in
3. Check that data is being saved to the database

## 🔧 Customization Options

### Add More Schools
```sql
INSERT INTO schools (name, county) VALUES 
('Your School Name', 'County');
```

### Add More Interests
```sql
INSERT INTO interests (name, category) VALUES 
('Interest Name', 'Category');
```

### Add More Profile Prompts
```sql
INSERT INTO profile_prompts (prompt_text, category) VALUES 
('Your prompt text here', 'Category');
```

## 🚨 Troubleshooting

### Common Issues

**"Permission denied" errors:**
- Make sure you're running the script as a superuser
- Check that RLS policies are properly configured

**"Table already exists" errors:**
- Drop existing tables first: `DROP TABLE IF EXISTS table_name CASCADE;`
- Or modify the script to use `CREATE TABLE IF NOT EXISTS`

**Authentication issues:**
- Verify your Supabase URL and anon key in `lib/supabase.ts`
- Check that RLS policies allow the operations you need

### Need Help?
- Check the Supabase documentation
- Review the RLS policies in the setup script
- Test with a simple query first: `SELECT * FROM schools LIMIT 5;`

## 🎯 Next Steps

After setting up your database:

1. **Test the app** - Make sure authentication works
2. **Add real data** - Replace sample schools with actual Irish schools
3. **Configure storage** - Set up Supabase Storage for photo uploads
4. **Enable real-time** - Test real-time features for matches and messages
5. **Set up backups** - Configure automated database backups

Your DebsMatch app is now ready to store and retrieve all user data securely! 🎉
