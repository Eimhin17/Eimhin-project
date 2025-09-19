# Database Error Troubleshooting Guide

## Issue: "Database error saving new user"

This error occurs when Supabase tries to create a user profile in your database during email verification, but the database schema doesn't match what's expected.

## Quick Fix Steps

### Step 1: Run the Database Setup Script

1. **Go to your Supabase Dashboard**
2. **Navigate to SQL Editor**
3. **Run the complete setup script**:
   ```sql
   -- Copy and paste the entire contents of setup-fresh.sql
   -- This will create all tables with the correct schema
   ```

### Step 2: If Tables Already Exist, Run the Fix Script

If you get "relation already exists" errors, run the fix script instead:

```sql
-- Copy and paste the contents of fix-users-table.sql
-- This will update existing tables to be more flexible
```

### Step 3: Test the Database Connection

Run the test script to verify everything is working:

```sql
-- Copy and paste the contents of test-connection.sql
-- This will diagnose any remaining issues
```

## What Causes This Error

The error typically occurs because:

1. **Missing Database Tables** - The `users` table doesn't exist
2. **Schema Mismatch** - Required fields are missing or have wrong constraints
3. **Missing Columns** - New columns were added but not to existing tables
4. **Foreign Key Issues** - References to non-existent tables

## Database Schema Requirements

Your `users` table must have these columns:

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number VARCHAR(20) UNIQUE,
  phone_verified BOOLEAN DEFAULT false,
  school_id UUID REFERENCES schools(id),
  school_email VARCHAR(255) UNIQUE,
  school_email_verified BOOLEAN DEFAULT false,
  first_name VARCHAR(100) DEFAULT 'Pending',
  last_name VARCHAR(100) DEFAULT 'User',
  date_of_birth DATE DEFAULT '2000-01-01',
  gender gender_type,
  looking_for looking_for_type,
  relationship_intention relationship_intention,
  bio TEXT,
  discovery_source VARCHAR(100),
  push_notifications_enabled BOOLEAN DEFAULT true,
  privacy_policy_accepted BOOLEAN DEFAULT false,
  onboarding_completed BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Common Issues and Solutions

### Issue 1: "relation 'users' does not exist"
**Solution**: Run `setup-fresh.sql` to create all tables

### Issue 2: "column 'school_email' does not exist"
**Solution**: Run `fix-users-table.sql` to add missing columns

### Issue 3: "column 'first_name' is not null"
**Solution**: The fix script removes NOT NULL constraints and adds defaults

### Issue 4: "foreign key constraint fails"
**Solution**: Ensure all referenced tables exist by running the full setup

## Verification Steps

After running the fix scripts, verify:

1. **Tables exist**: Check if `users` table exists
2. **Columns present**: Verify all required columns are present
3. **Constraints correct**: Check that NOT NULL constraints are removed
4. **Defaults set**: Ensure default values are set for required fields

## Testing the Fix

1. **Run the test script** to verify database setup
2. **Try email verification** in your app again
3. **Check console logs** for any remaining errors
4. **Verify user creation** in Supabase dashboard

## If Issues Persist

If you still get errors after following these steps:

1. **Check Supabase logs** for detailed error messages
2. **Verify your Supabase credentials** in the app
3. **Ensure RLS policies** are properly configured
4. **Check if auth.users table** exists in Supabase

## Prevention

To avoid this issue in the future:

1. **Always run setup scripts** when setting up a new environment
2. **Test database operations** before deploying to production
3. **Keep database schema** in sync with your app requirements
4. **Use migration scripts** for schema changes

## Need Help?

If you're still experiencing issues:

1. **Check the console logs** in your app
2. **Run the test script** and share the output
3. **Verify Supabase project settings**
4. **Ensure all required extensions** are enabled
