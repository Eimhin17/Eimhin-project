const { createClient } = require('@supabase/supabase-js');

// Your Supabase configuration
const supabaseUrl = 'https://tagjfsxeutihwntpudsk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZ2pmc3hldXRpaHdudHB1ZHNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTkwNzgsImV4cCI6MjA3MDA5NTA3OH0.pvcZjPWdvIAbBXoZakS_kOlXfEbiUcvidXY1Oy2eFN0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixMessagesRLS() {
  try {
    console.log('🔧 Fixing messages table RLS policies...');
    
    // First, let's check if we can access the messages table
    console.log('   Checking current messages table access...');
    const { data: testData, error: testError } = await supabase
      .from('messages')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.log('   Current error:', testError.message);
    } else {
      console.log('   Messages table is accessible');
    }
    
    // Since we can't directly modify RLS policies with the anon key,
    // we'll provide the SQL commands to run manually
    console.log('\n📋 MANUAL FIX REQUIRED');
    console.log('=====================================');
    console.log('Please run these SQL commands in your Supabase Dashboard:');
    console.log('');
    console.log('1. Go to: https://supabase.com/dashboard/project/tagjfsxeutihwntpudsk');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Run the following SQL commands:');
    console.log('');
    console.log('-- Drop existing policies');
    console.log('DROP POLICY IF EXISTS "Users can view messages in their matches" ON messages;');
    console.log('DROP POLICY IF EXISTS "Users can send messages in their matches" ON messages;');
    console.log('');
    console.log('-- Create corrected policies that check both user1_id and user2_id');
    console.log('CREATE POLICY "Users can view messages in their matches" ON messages');
    console.log('  FOR SELECT USING (');
    console.log('    EXISTS (');
    console.log('      SELECT 1 FROM matches');
    console.log('      WHERE matches.id = messages.match_id');
    console.log('      AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())');
    console.log('    )');
    console.log('  );');
    console.log('');
    console.log('CREATE POLICY "Users can send messages in their matches" ON messages');
    console.log('  FOR INSERT WITH CHECK (');
    console.log('    EXISTS (');
    console.log('      SELECT 1 FROM matches');
    console.log('      WHERE matches.id = messages.match_id');
    console.log('      AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())');
    console.log('    )');
    console.log('  );');
    console.log('');
    console.log('CREATE POLICY "Users can update messages in their matches" ON messages');
    console.log('  FOR UPDATE USING (');
    console.log('    EXISTS (');
    console.log('      SELECT 1 FROM matches');
    console.log('      WHERE matches.id = messages.match_id');
    console.log('      AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())');
    console.log('    )');
    console.log('  );');
    console.log('');
    console.log('-- Ensure RLS is enabled');
    console.log('ALTER TABLE messages ENABLE ROW LEVEL SECURITY;');
    console.log('');
    console.log('✅ After running these commands, your messaging should work!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the fix
fixMessagesRLS();
