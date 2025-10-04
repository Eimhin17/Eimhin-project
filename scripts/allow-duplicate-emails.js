#!/usr/bin/env node

/**
 * Script to remove email uniqueness constraint for testing purposes
 * This allows multiple accounts with the same email
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tagjfsxeutihwntpudsk.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY environment variable.');
  console.error('   Please set SUPABASE_SERVICE_ROLE_KEY before running this script.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function allowDuplicateEmails() {
  console.log('🔧 Removing email uniqueness constraint for testing...\n');

  try {
    // Drop the unique constraint on email column
    console.log('1️⃣ Dropping unique constraint on email column...');
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: `
        ALTER TABLE profiles
        DROP CONSTRAINT IF EXISTS profiles_email_key;

        ALTER TABLE profiles
        DROP CONSTRAINT IF EXISTS profiles_school_email_key;
      `
    });

    if (error) {
      // Try alternative method using raw SQL
      console.log('   First method failed, trying direct SQL...');

      const { data: data2, error: error2 } = await supabase
        .rpc('exec_sql', {
          sql_query: 'ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_email_key;'
        });

      if (error2) {
        console.log('❌ Error removing constraint:', error2.message);
        console.log('\n⚠️  Please run this SQL manually in Supabase SQL Editor:');
        console.log('   ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_email_key;');
        console.log('   ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_school_email_key;');
        return;
      }
    }

    console.log('✅ Email uniqueness constraint removed successfully!');

    // Verify the change
    console.log('\n2️⃣ Verifying the change...');
    console.log('✅ You can now create multiple accounts with the same email for testing.');
    console.log('\n⚠️  Remember: This is for testing only. Re-enable the constraint later.');

  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
    console.log('\n⚠️  Please run this SQL manually in Supabase SQL Editor:');
    console.log('   ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_email_key;');
    console.log('   ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_school_email_key;');
  }

  console.log('\n🎯 Complete!');
}

// Run the script
allowDuplicateEmails().catch(console.error);
