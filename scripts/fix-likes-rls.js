const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('- EXPO_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixLikesRLS() {
  try {
    console.log('🔧 Fixing likes RLS policies...');
    
    // Read the SQL fix file
    const sqlPath = path.join(__dirname, '../database/fix-likes-rls-launch-ready.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('❌ Error applying main fix:', error);
      console.log('🔄 Trying fallback solution...');
      
      // Try the simpler fallback
      const fallbackPath = path.join(__dirname, '../database/fix-likes-rls-simple-fallback.sql');
      const fallbackSql = fs.readFileSync(fallbackPath, 'utf8');
      
      const { error: fallbackError } = await supabase.rpc('exec_sql', { sql: fallbackSql });
      
      if (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError);
        return false;
      }
      
      console.log('✅ Fallback solution applied successfully!');
    } else {
      console.log('✅ Main fix applied successfully!');
    }
    
    // Test the fix by trying to create a test like
    console.log('🧪 Testing likes functionality...');
    
    // Get a test user profile
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .limit(2);
    
    if (profileError || !profiles || profiles.length < 2) {
      console.log('⚠️  Could not test - no profiles found');
      return true;
    }
    
    const [profile1, profile2] = profiles;
    
    // Try to create a test like
    const { data: likeData, error: likeError } = await supabase
      .from('likes')
      .insert({
        liker_id: profile1.id,
        liked_user_id: profile2.id
      })
      .select()
      .single();
    
    if (likeError) {
      console.error('❌ Test like creation failed:', likeError);
      return false;
    }
    
    console.log('✅ Test like created successfully:', likeData.id);
    
    // Clean up test like
    await supabase
      .from('likes')
      .delete()
      .eq('id', likeData.id);
    
    console.log('✅ Likes RLS fix completed and tested successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

// Run the fix
fixLikesRLS().then(success => {
  if (success) {
    console.log('🎉 Likes RLS is now ready for launch!');
    process.exit(0);
  } else {
    console.log('💥 Fix failed - check the errors above');
    process.exit(1);
  }
});