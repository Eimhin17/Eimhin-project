#!/usr/bin/env node

/**
 * Script to apply the new Supabase Auth database schema
 * Run this after setting up your Supabase project
 */

const fs = require('fs');
const path = require('path');

// Configuration - Update these with your Supabase details
const SUPABASE_URL = 'https://tagjfsxeutihwntpudsk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZ2pmc3hldXRpaHdudHB1ZHNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTkwNzgsImV4cCI6MjA3MDA5NTA3OH0.pvcZjPWdvIAbBXoZakS_kOlXfEbiUcvidXY1Oy2eFN0';

// Path to the schema file
const SCHEMA_FILE = path.join(__dirname, '../database/supabase-auth-schema.sql');

async function applySchema() {
  console.log('🚀 Starting DebsMatch Supabase Auth Schema Application...\n');

  try {
    // Check if schema file exists
    if (!fs.existsSync(SCHEMA_FILE)) {
      throw new Error(`Schema file not found: ${SCHEMA_FILE}`);
    }

    // Read the schema file
    const schemaSQL = fs.readFileSync(SCHEMA_FILE, 'utf8');
    console.log('✅ Schema file loaded successfully');

    // Instructions for manual application
    console.log('\n📋 MANUAL APPLICATION REQUIRED');
    console.log('=====================================');
    console.log('Since this involves database structure changes, please apply the schema manually:');
    console.log('');
    console.log('1. Go to your Supabase Dashboard: https://supabase.com/dashboard');
    console.log('2. Select your project');
    console.log('3. Go to SQL Editor');
    console.log('4. Copy and paste the contents of: database/supabase-auth-schema.sql');
    console.log('5. Click "Run" to execute the schema');
    console.log('');
    console.log('⚠️  IMPORTANT: This will drop existing tables and recreate them!');
    console.log('⚠️  Make sure you have backed up any important data!');
    console.log('');
    console.log('📁 Schema file location: database/supabase-auth-schema.sql');
    console.log('📚 Documentation: database/SUPABASE_AUTH_SCHEMA_GUIDE.md');

    // Show schema preview
    console.log('\n📖 SCHEMA PREVIEW (first 500 characters):');
    console.log('=====================================');
    console.log(schemaSQL.substring(0, 500) + '...');
    console.log('\n... (truncated for preview)');

    // Verification steps
    console.log('\n🔍 VERIFICATION STEPS AFTER APPLICATION:');
    console.log('=====================================');
    console.log('1. Check that all tables were created successfully');
    console.log('2. Verify RLS policies are enabled on user tables');
    console.log('3. Confirm sample data was inserted (schools, interests, etc.)');
    console.log('4. Test that the auth.users trigger works correctly');
    console.log('5. Verify permissions are set correctly');

    // Next steps
    console.log('\n🚀 NEXT STEPS AFTER SCHEMA APPLICATION:');
    console.log('=====================================');
    console.log('1. Update your TypeScript types in lib/supabase.ts');
    console.log('2. Modify your services to use the new table structure');
    console.log('3. Update your AuthContext to work with Supabase Auth');
    console.log('4. Test user signup and profile creation');
    console.log('5. Verify all existing functionality works with new schema');

    console.log('\n✅ Schema application instructions completed!');
    console.log('📚 Check the documentation for detailed information.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  applySchema();
}

module.exports = { applySchema };
