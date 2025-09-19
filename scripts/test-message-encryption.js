const { createClient } = require('@supabase/supabase-js');

// Your Supabase configuration
const supabaseUrl = 'https://tagjfsxeutihwntpudsk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZ2pmc3hldXRpaHdudHB1ZHNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTkwNzgsImV4cCI6MjA3MDA5NTA3OH0.pvcZjPWdvIAbBXoZakS_kOlXfEbiUcvidXY1Oy2eFN0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testMessageEncryption() {
  console.log('🔐 Testing Message Encryption in Database...\n');
  
  try {
    // Check recent messages to see if they're encrypted
    console.log('1️⃣ Checking recent messages in database...');
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (error) {
      console.error('❌ Error fetching messages:', error);
      return;
    }
    
    if (!messages || messages.length === 0) {
      console.log('✅ No messages found in database');
      console.log('   This means either:');
      console.log('   - No messages have been sent yet');
      console.log('   - Messages are being encrypted but not stored');
      return;
    }
    
    console.log(`✅ Found ${messages.length} recent messages:`);
    messages.forEach((msg, index) => {
      console.log(`\n   Message ${index + 1}:`);
      console.log(`   ID: ${msg.id}`);
      console.log(`   Content: ${msg.content}`);
      console.log(`   Content length: ${msg.content.length}`);
      console.log(`   Looks encrypted: ${msg.content.includes('U2FsdGVkX1') ? 'YES' : 'NO'}`);
      console.log(`   Created: ${msg.created_at}`);
    });
    
    // Check if any messages look like they're not encrypted
    const unencryptedMessages = messages.filter(msg => 
      !msg.content.includes('U2FsdGVkX1') && 
      msg.content.length < 100 && 
      /^[a-zA-Z0-9\s.,!?]+$/.test(msg.content)
    );
    
    if (unencryptedMessages.length > 0) {
      console.log(`\n❌ Found ${unencryptedMessages.length} messages that appear to be unencrypted:`);
      unencryptedMessages.forEach((msg, index) => {
        console.log(`   Message ${index + 1}: "${msg.content}"`);
      });
      console.log('\n🔧 This suggests encryption is not being applied!');
    } else {
      console.log('\n✅ All messages appear to be encrypted!');
    }
    
    // Check matches table
    console.log('\n2️⃣ Checking matches table...');
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select('*')
      .limit(3);
    
    if (matchesError) {
      console.error('❌ Error fetching matches:', matchesError);
    } else {
      console.log(`✅ Found ${matches?.length || 0} matches`);
      if (matches && matches.length > 0) {
        console.log('   Sample match:', {
          id: matches[0].id,
          user1_id: matches[0].user1_id,
          user2_id: matches[0].user2_id
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testMessageEncryption();
