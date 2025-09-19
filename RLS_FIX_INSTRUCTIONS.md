# Fix Database Trigger RLS Issue

## Problem
The database trigger is failing with "Database error saving new user" because of Row Level Security (RLS) policies preventing the trigger from inserting into the profiles table.

## Solution
Apply the SQL fix in `fix-rls-trigger.sql` to your Supabase database.

## Steps to Fix

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `fix-rls-trigger.sql`
4. Click "Run" to execute the SQL

### Option 2: Command Line (if you have service role key)
```bash
node apply-rls-fix.js
```

## What the Fix Does
1. **Drops the existing trigger and function** that's causing the RLS issue
2. **Creates a new function with `SECURITY DEFINER`** - this allows the function to bypass RLS policies
3. **Recreates the trigger** to use the new function
4. **Grants proper permissions** to the function

## Expected Result
After applying this fix:
- ✅ User signup will work without "Database error saving new user"
- ✅ Profiles will be automatically created when users sign up
- ✅ Login will work properly

## Verification
After applying the fix, test by:
1. Going through the onboarding flow
2. Entering your email
3. The signup should complete successfully without database errors
