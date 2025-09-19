const { createClient } = require('@supabase/supabase-js');

// You'll need to replace these with your actual Supabase credentials
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixNullLookingFor() {
  try {
    console.log('🔧 Fixing NULL looking_for_debs values...');
    
    // Update all NULL looking_for_debs values to default
    const { data, error } = await supabase
      .from('profiles')
      .update({ looking_for_debs: 'go_to_someones_debs' })
      .is('looking_for_debs', null)
      .select('id, username, first_name, looking_for_debs');
    
    if (error) {
      console.error('❌ Error updating NULL values:', error);
      return;
    }
    
    console.log('✅ Updated profiles:', data);
    console.log(`📈 Fixed ${data.length} profiles with NULL looking_for_debs`);
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

fixNullLookingFor();
