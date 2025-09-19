const { createClient } = require('@supabase/supabase-js');

// You'll need to replace these with your actual Supabase credentials
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSwapsSave() {
  try {
    console.log('🧪 Testing swaps save...');
    
    // First, let's check what the current enum values are
    console.log('📊 Checking enum values...');
    const { data: enumData, error: enumError } = await supabase
      .rpc('get_enum_values', { enum_name: 'looking_for_type' });
    
    if (enumError) {
      console.log('⚠️ Could not check enum values directly, trying alternative method...');
      
      // Try to get a sample profile to see what values are allowed
      const { data: sampleProfile, error: sampleError } = await supabase
        .from('profiles')
        .select('looking_for_debs')
        .limit(1)
        .single();
      
      if (sampleError) {
        console.error('❌ Error getting sample profile:', sampleError);
        return;
      }
      
      console.log('📊 Sample looking_for_debs value:', sampleProfile.looking_for_debs);
    } else {
      console.log('📊 Enum values:', enumData);
    }
    
    // Now let's try to update a profile with 'swaps'
    console.log('🔧 Testing update with swaps value...');
    
    // Get a test user ID (you might need to replace this with an actual user ID)
    const { data: testUser, error: userError } = await supabase
      .from('profiles')
      .select('id, username, looking_for_debs')
      .limit(1)
      .single();
    
    if (userError) {
      console.error('❌ Error getting test user:', userError);
      return;
    }
    
    console.log('👤 Test user:', testUser);
    
    // Try to update with swaps
    const { data: updateResult, error: updateError } = await supabase
      .from('profiles')
      .update({ looking_for_debs: 'swaps' })
      .eq('id', testUser.id)
      .select('id, username, looking_for_debs');
    
    if (updateError) {
      console.error('❌ Error updating with swaps:', updateError);
      console.error('❌ Error details:', updateError.message);
    } else {
      console.log('✅ Successfully updated with swaps:', updateResult);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testSwapsSave();
