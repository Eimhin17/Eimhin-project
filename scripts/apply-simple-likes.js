#!/usr/bin/env node

/**
 * Script to apply the simple likes table solution
 */

const fs = require('fs');
const path = require('path');

// Path to the SQL file
const SQL_FILE = path.join(__dirname, '../database/create-likes-table-simple.sql');

async function applySimpleLikes() {
  console.log('🚀 Applying Simple Likes Table Solution...\n');

  try {
    // Check if SQL file exists
    if (!fs.existsSync(SQL_FILE)) {
      throw new Error(`SQL file not found: ${SQL_FILE}`);
    }

    // Read the SQL file
    const sqlContent = fs.readFileSync(SQL_FILE, 'utf8');
    console.log('✅ SQL file loaded successfully');

    // Instructions for manual application
    console.log('\n📋 MANUAL APPLICATION REQUIRED');
    console.log('=====================================');
    console.log('This simple solution will fix the RLS permission issues:');
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
    console.log('   - Drop the existing problematic likes table');
    console.log('   - Create a new likes table that references profiles');
    console.log('   - Use simple RLS policies that actually work');
    console.log('   - Fix all permission denied errors');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  applySimpleLikes();
}

module.exports = { applySimpleLikes };
