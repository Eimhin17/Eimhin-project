const { createClient } = require('@supabase/supabase-js');

// Your Supabase configuration
const supabaseUrl = 'https://tagjfsxeutihwntpudsk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZ2pmc3hldXRpaHdudHB1ZHNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTkwNzgsImV4cCI6MjA3MDA5NTA3OH0.pvcZjPWdvIAbBXoZakS_kOlXfEbiUcvidXY1Oy2eFN0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testMessagingFix() {
  try {
    console.log('🧪 Testing messaging system after RLS fix...\n');
    
    // Step 1: Check if we can access messages table
    console.log('1️⃣ Testing messages table access...');
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .limit(5);
    
    if (messagesError) {
      console.error('❌ Error accessing messages table:', messagesError);
      return;
    }
    
    console.log('✅ Messages table accessible');
    console.log(`   Found ${messages?.length || 0} messages`);
    
    // Step 2: Check matches table
    console.log('\n2️⃣ Testing matches table access...');
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select('*')
      .limit(5);
    
    if (matchesError) {
      console.error('❌ Error accessing matches table:', matchesError);
      return;
    }
    
    console.log('✅ Matches table accessible');
    console.log(`   Found ${matches?.length || 0} matches`);
    
    // Step 3: Test RLS policies by trying to insert a test message
    console.log('\n3️⃣ Testing RLS policies...');
    console.log('   Note: This will fail without authentication, but should show the correct error');
    
    const { data: testMessage, error: testError } = await supabase
      .from('messages')
      .insert({
        match_id: '00000000-0000-0000-0000-000000000000', // Dummy match ID
        sender_id: '00000000-0000-0000-0000-000000000000', // Dummy sender ID
        content: 'Test message',
        message_type: 'text',
        is_read: false,
        moderation_status: 'pending'
      })
      .select();
    
    if (testError) {
      if (testError.code === '42501') {
        console.log('✅ RLS is working - got expected permission denied error');
        console.log('   Error message:', testError.message);
      } else {
        console.log('⚠️  Got different error (this might be expected):', testError.message);
      }
    } else {
      console.log('⚠️  Message was inserted without authentication (RLS might be disabled)');
    }
    
    // Step 4: Check if there are any existing matches to test with
    if (matches && matches.length > 0) {
      console.log('\n4️⃣ Found existing matches - you can test messaging with these:');
      matches.forEach((match, index) => {
        console.log(`   Match ${index + 1}: ${match.user1_id} <-> ${match.user2_id} (ID: ${match.id})`);
      });
    } else {
      console.log('\n4️⃣ No existing matches found - create some matches first to test messaging');
    }
    
    console.log('\n✅ Messaging system test completed!');
    console.log('\n📋 NEXT STEPS:');
    console.log('1. Apply the RLS policy fix in your Supabase Dashboard');
    console.log('2. Test sending messages in your app');
    console.log('3. If you still get errors, check that users are properly authenticated');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testMessagingFix();
