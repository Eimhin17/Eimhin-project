#!/usr/bin/env node

/**
 * Script to immediately fix RLS issues
 */

const fs = require('fs');
const path = require('path');

// Path to the SQL file
const SQL_FILE = path.join(__dirname, '../database/disable-rls-temporarily.sql');

async function fixRLSImmediately() {
  console.log('🚨 URGENT: Fixing RLS Issues Immediately...\n');

  try {
    // Check if SQL file exists
    if (!fs.existsSync(SQL_FILE)) {
      throw new Error(`SQL file not found: ${SQL_FILE}`);
    }

    // Read the SQL file
    const sqlContent = fs.readFileSync(SQL_FILE, 'utf8');
    console.log('✅ SQL file loaded successfully');

    // Instructions for immediate application
    console.log('\n🚨 IMMEDIATE ACTION REQUIRED');
    console.log('=====================================');
    console.log('The RLS policies are blocking ALL access to your tables.');
    console.log('This SQL will fix it immediately:');
    console.log('');
    console.log('1. Go to your Supabase Dashboard: https://supabase.com/dashboard');
    console.log('2. Select your project');
    console.log('3. Go to SQL Editor');
    console.log('4. Copy and paste the following SQL:');
    console.log('');
    console.log('📄 SQL TO EXECUTE:');
    console.log('=====================================');
    console.log(sqlContent);
    console.log('');
    console.log('5. Click "Run" to execute the SQL');
    console.log('');
    console.log('✅ This will:');
    console.log('   - Disable overly restrictive RLS policies');
    console.log('   - Create permissive policies that actually work');
    console.log('   - Allow your app to access both profiles and likes tables');
    console.log('   - Fix the permission denied errors immediately');
    console.log('');
    console.log('⚠️  NOTE: These are permissive policies for development.');
    console.log('   You can tighten them later once everything is working.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  fixRLSImmediately();
}

module.exports = { fixRLSImmediately };

