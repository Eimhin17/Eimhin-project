const { createClient } = require('@supabase/supabase-js');

// Use your project's anon key for testing
const supabaseUrl = 'https://tagjfsxeutihwntpudsk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZ2pmc3hldXRpaHdudHB1ZHNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTkwNzgsImV4cCI6MjA3MDA5NTA3OH0.pvcZjPWdvIAbBXoZakS_kOlXfEbiUcvidXY1Oy2eFN0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function renameScreenshotToExtraNotes() {
  try {
    console.log('🔄 Renaming report_screenshot column to extra_notes...\n');

    // Read the SQL file
    const fs = require('fs');
    const path = require('path');
    const sqlPath = path.join(__dirname, '../database/rename-screenshot-to-extra-notes.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    console.log('📄 SQL to execute:');
    console.log(sqlContent);
    console.log('\n');

    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: sqlContent
    });

    if (error) {
      console.error('❌ Error executing SQL:', error);
      console.log('\n📝 Manual execution required:');
      console.log('1. Go to Supabase Dashboard → SQL Editor');
      console.log('2. Run the SQL from rename-screenshot-to-extra-notes.sql');
      return;
    }

    console.log('✅ Successfully renamed report_screenshot to extra_notes');
    console.log('✅ Column now stores user descriptions instead of screenshot URLs');
    console.log('✅ Photos will be stored in storage bucket only');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the script
renameScreenshotToExtraNotes();
