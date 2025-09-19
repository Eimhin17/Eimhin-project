const { createClient } = require('@supabase/supabase-js');

// Use hardcoded values from config
const supabaseUrl = 'https://tagjfsxeutihwntpudsk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZ2pmc3hldXRpaHdudHB1ZHNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTkwNzgsImV4cCI6MjA3MDA5NTA3OH0.pvcZjPWdvIAbBXoZakS_kOlXfEbiUcvidXY1Oy2eFN0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkGenderPreferenceColumn() {
  try {
    console.log('🔍 Checking if gender_preference column exists...');
    
    // Try to select from the column
    const { data, error } = await supabase
      .from('profiles')
      .select('gender_preference')
      .limit(1);
    
    if (error) {
      if (error.code === '42703') {
        console.log('❌ Column "gender_preference" does not exist in profiles table');
        console.log('📋 You need to run the database migration: add-gender-preferences.sql');
        return false;
      } else {
        console.error('❌ Error checking column:', error);
        return false;
      }
    }
    
    console.log('✅ Column "gender_preference" exists in profiles table');
    return true;
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

checkGenderPreferenceColumn().then(exists => {
  if (exists) {
    console.log('🎉 Database is ready!');
  } else {
    console.log('⚠️ Database migration needed!');
  }
  process.exit(0);
});
