const { createClient } = require('@supabase/supabase-js');

// You'll need to replace these with your actual Supabase credentials
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugLookingForField() {
  try {
    console.log('🔍 Checking looking_for_debs field in profiles table...');
    
    // Check the current schema
    const { data: schemaData, error: schemaError } = await supabase
      .from('profiles')
      .select('looking_for_debs')
      .limit(5);
    
    if (schemaError) {
      console.error('❌ Error checking schema:', schemaError);
      return;
    }
    
    console.log('📊 Sample looking_for_debs values:', schemaData);
    
    // Check if the column exists and what values are there
    const { data: allProfiles, error: allError } = await supabase
      .from('profiles')
      .select('id, looking_for_debs, first_name, username')
      .limit(10);
    
    if (allError) {
      console.error('❌ Error fetching profiles:', allError);
      return;
    }
    
    console.log('👥 All profiles looking_for_debs values:');
    allProfiles.forEach(profile => {
      console.log(`- ${profile.username || profile.first_name}: ${profile.looking_for_debs || 'NULL'}`);
    });
    
    // Check for NULL values
    const nullCount = allProfiles.filter(p => p.looking_for_debs === null).length;
    console.log(`\n📈 Profiles with NULL looking_for_debs: ${nullCount}/${allProfiles.length}`);
    
    if (nullCount > 0) {
      console.log('🔧 Fixing NULL values...');
      
      // Update NULL values to default
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ looking_for_debs: 'go_to_someones_debs' })
        .is('looking_for_debs', null);
      
      if (updateError) {
        console.error('❌ Error updating NULL values:', updateError);
      } else {
        console.log('✅ Updated NULL values to default');
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

debugLookingForField();
