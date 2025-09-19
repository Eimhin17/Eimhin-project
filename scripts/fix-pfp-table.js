const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client
const supabase = createClient(
  'https://tagjfsxeutihwntpudsk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZ2pmc3hldXRpaHdudHB1ZHNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTkwNzgsImV4cCI6MjA3MDA5NTA3OH0.pvcZjPWdvIAbBXoZakS_kOlXfEbiUcvidXY1Oy2eFN0'
);

async function fixPFPTable() {
  try {
    console.log('🔧 Fixing profile_pictures table...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, '../database/create-pfp-table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('❌ Error executing SQL:', error);
      return;
    }
    
    console.log('✅ profile_pictures table created/updated successfully');
    
    // Test the table
    const { data: testData, error: testError } = await supabase
      .from('profile_pictures')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.error('❌ Error testing table:', testError);
    } else {
      console.log('✅ Table is accessible');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixPFPTable();
