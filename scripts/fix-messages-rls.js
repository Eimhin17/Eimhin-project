const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Required: EXPO_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixMessagesRLS() {
  try {
    console.log('🔧 Fixing messages table RLS policies...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, '..', 'fix-messages-rls.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('❌ Error executing SQL:', error);
      return;
    }
    
    console.log('✅ Messages RLS policies fixed successfully!');
    console.log('📝 Applied changes:');
    console.log('   - Fixed SELECT policy to check both user1_id and user2_id');
    console.log('   - Fixed INSERT policy to check both user1_id and user2_id');
    console.log('   - Added UPDATE policy for marking messages as read');
    
  } catch (error) {
    console.error('❌ Error fixing messages RLS:', error);
  }
}

// Alternative approach using direct SQL execution
async function fixMessagesRLSDirect() {
  try {
    console.log('🔧 Fixing messages table RLS policies (direct approach)...');
    
    // Drop existing policies
    console.log('   Dropping existing policies...');
    await supabase.rpc('exec_sql', { 
      sql: 'DROP POLICY IF EXISTS "Users can view messages in their matches" ON messages;' 
    });
    await supabase.rpc('exec_sql', { 
      sql: 'DROP POLICY IF EXISTS "Users can send messages in their matches" ON messages;' 
    });
    
    // Create corrected policies
    console.log('   Creating corrected policies...');
    
    // SELECT policy
    await supabase.rpc('exec_sql', { 
      sql: `CREATE POLICY "Users can view messages in their matches" ON messages
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM matches 
            WHERE matches.id = messages.match_id 
            AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
          )
        );`
    });
    
    // INSERT policy
    await supabase.rpc('exec_sql', { 
      sql: `CREATE POLICY "Users can send messages in their matches" ON messages
        FOR INSERT WITH CHECK (
          EXISTS (
            SELECT 1 FROM matches 
            WHERE matches.id = messages.match_id 
            AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
          )
        );`
    });
    
    // UPDATE policy
    await supabase.rpc('exec_sql', { 
      sql: `CREATE POLICY "Users can update messages in their matches" ON messages
        FOR UPDATE USING (
          EXISTS (
            SELECT 1 FROM matches 
            WHERE matches.id = messages.match_id 
            AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
          )
        );`
    });
    
    console.log('✅ Messages RLS policies fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing messages RLS:', error);
  }
}

// Run the fix
fixMessagesRLSDirect();
