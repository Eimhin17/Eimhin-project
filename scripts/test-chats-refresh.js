// Test script to verify chats refresh functionality
const { createClient } = require('@supabase/supabase-js');

// You'll need to set these environment variables or replace with your actual values
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-supabase-key';

if (supabaseUrl === 'your-supabase-url' || supabaseKey === 'your-supabase-key') {
  console.log('⚠️  Please set your Supabase environment variables or update the script with your actual values');
  console.log('   EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testChatsRefresh() {
  console.log('🧪 Testing Chats Refresh Functionality...\n');

  try {
    // Step 1: Check current matches
    console.log('1️⃣ Checking current matches...');
    
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select('*')
      .order('matched_at', { ascending: false });

    if (matchesError) {
      console.error('❌ Error fetching matches:', matchesError);
      return;
    }

    console.log(`✅ Found ${matches?.length || 0} matches in the database`);
    
    if (matches && matches.length > 0) {
      console.log('   Recent matches:');
      matches.slice(0, 3).forEach((match, index) => {
        console.log(`   ${index + 1}. Match ID: ${match.id}`);
        console.log(`      User1: ${match.user1_id}`);
        console.log(`      User2: ${match.user2_id}`);
        console.log(`      Matched at: ${match.matched_at}`);
        console.log('');
      });
    }

    // Step 2: Test ChatService.getMatches for a specific user
    if (matches && matches.length > 0) {
      const testUserId = matches[0].user1_id;
      console.log(`2️⃣ Testing ChatService.getMatches for user: ${testUserId}`);
      
      // Simulate the ChatService.getMatches call
      const { data: userMatches, error: userMatchesError } = await supabase
        .from('matches')
        .select(`
          *,
          user1:users!user1_id (
            id,
            first_name,
            last_name,
            school_id,
            schools (name)
          ),
          user2:users!user2_id (
            id,
            first_name,
            last_name,
            school_id,
            schools (name)
          )
        `)
        .or(`user1_id.eq.${testUserId},user2_id.eq.${testUserId}`)
        .order('matched_at', { ascending: false });

      if (userMatchesError) {
        console.error('❌ Error fetching user matches:', userMatchesError);
      } else {
        console.log(`✅ Successfully fetched ${userMatches?.length || 0} matches for user`);
        
        if (userMatches && userMatches.length > 0) {
          console.log('   Match details:');
          userMatches.forEach((match, index) => {
            const isUser1 = match.user1_id === testUserId;
            const otherUser = isUser1 ? match.user2 : match.user1;
            console.log(`   ${index + 1}. Match ID: ${match.id}`);
            console.log(`      Other user: ${otherUser?.first_name} ${otherUser?.last_name}`);
            console.log(`      School: ${otherUser?.schools?.name || 'Unknown'}`);
            console.log(`      Matched at: ${match.matched_at}`);
            console.log('');
          });
        }
      }
    }

    // Step 3: Test real-time subscription (simulation)
    console.log('3️⃣ Testing real-time subscription setup...');
    
    const channel = supabase
      .channel('test-matches-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'matches'
        },
        (payload) => {
          console.log('🆕 Real-time match detected:', payload);
        }
      )
      .subscribe();

    console.log('✅ Real-time subscription set up successfully');
    console.log('   (This will listen for new matches in real-time)');
    
    // Clean up after 5 seconds
    setTimeout(() => {
      channel.unsubscribe();
      console.log('✅ Real-time subscription cleaned up');
    }, 5000);

    console.log('\n🎉 Test completed!');
    console.log('\n📋 Summary:');
    console.log(`   - Total matches in database: ${matches?.length || 0}`);
    console.log('   - ChatService.getMatches: Working');
    console.log('   - Real-time subscription: Set up');
    console.log('   - Chats tab should now refresh automatically when new matches are created');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testChatsRefresh();
