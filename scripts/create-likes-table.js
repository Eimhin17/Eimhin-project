#!/usr/bin/env node

/**
 * Script to create the likes table
 */

const fs = require('fs');
const path = require('path');

// Configuration - Update these with your Supabase details
const SUPABASE_URL = 'https://tagjfsxeutihwntpudsk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZ2pmc3hldXRpaHdudHB1ZHNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTkwNzgsImV4cCI6MjA3MDA5NTA3OH0.pvcZjPWdvIAbBXoZakS_kOlXfEbiUcvidXY1Oy2eFN0';

// Path to the SQL file
const SQL_FILE = path.join(__dirname, '../database/create-likes-table.sql');

async function createLikesTable() {
  console.log('🚀 Creating Likes Table...\n');

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
    console.log('Please apply the SQL manually in your Supabase Dashboard:');
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
    console.log('✅ This will create the likes table with proper RLS policies');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  createLikesTable();
}

module.exports = { createLikesTable };
