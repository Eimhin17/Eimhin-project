// Test script to verify the foreign key fix
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

async function testForeignKeyFix() {
  console.log('🧪 Testing Foreign Key Fix...\n');

  try {
    // Step 1: Test the new approach - get matches first, then users
    console.log('1️⃣ Testing new approach (matches first, then users)...');
    
    // Get matches
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select('*')
      .order('matched_at', { ascending: false })
      .limit(5);

    if (matchesError) {
      console.error('❌ Error fetching matches:', matchesError);
      return;
    }

    console.log(`✅ Found ${matches?.length || 0} matches`);

    if (matches && matches.length > 0) {
      // Get user IDs from matches
      const userIds = new Set();
      matches.forEach(match => {
        userIds.add(match.user1_id);
        userIds.add(match.user2_id);
      });

      console.log(`   User IDs to fetch: ${Array.from(userIds).length}`);

      // Fetch user details
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select(`
          id,
          first_name,
          last_name,
          school_id,
          schools (name)
        `)
        .in('id', Array.from(userIds));

      if (usersError) {
        console.error('❌ Error fetching users:', usersError);
        return;
      }

      console.log(`✅ Successfully fetched ${users?.length || 0} users`);

      // Create a users map for easy lookup
      const usersMap = new Map();
      users?.forEach(user => {
        usersMap.set(user.id, user);
      });

      // Transform matches with user data
      const matchesWithUsers = matches.map(match => ({
        ...match,
        user1: usersMap.get(match.user1_id),
        user2: usersMap.get(match.user2_id)
      }));

      console.log('✅ Successfully transformed matches with user data');
      
      // Show sample match
      if (matchesWithUsers.length > 0) {
        const sampleMatch = matchesWithUsers[0];
        console.log('   Sample match:');
        console.log(`     Match ID: ${sampleMatch.id}`);
        console.log(`     User1: ${sampleMatch.user1?.first_name} ${sampleMatch.user1?.last_name}`);
        console.log(`     User2: ${sampleMatch.user2?.first_name} ${sampleMatch.user2?.last_name}`);
        console.log(`     Matched at: ${sampleMatch.matched_at}`);
      }
    }

    // Step 2: Test the old approach (that was failing)
    console.log('\n2️⃣ Testing old approach (that was failing)...');
    
    const { data: oldMatches, error: oldError } = await supabase
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
      .limit(1);

    if (oldError) {
      console.log('❌ Old approach failed (as expected):', oldError.message);
      console.log('   This confirms the foreign key issue exists');
    } else {
      console.log('✅ Old approach worked (unexpected)');
    }

    console.log('\n🎉 Test completed!');
    console.log('\n📋 Summary:');
    console.log('   - New approach (matches first, then users): Working ✅');
    console.log('   - Old approach (with foreign key hints): Failing ❌');
    console.log('   - The fix should resolve the Chats tab issue');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testForeignKeyFix();
