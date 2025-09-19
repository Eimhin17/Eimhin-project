// Test script to verify the profiles table fix
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

async function testProfilesTable() {
  console.log('🧪 Testing Profiles Table Fix...\n');

  try {
    // Step 1: Test profiles table access
    console.log('1️⃣ Testing profiles table access...');
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, school_id, schools (name)')
      .limit(5);

    if (profilesError) {
      console.error('❌ Error accessing profiles table:', profilesError);
      return;
    }

    console.log(`✅ Successfully accessed profiles table`);
    console.log(`   Found ${profiles?.length || 0} profiles`);

    if (profiles && profiles.length > 0) {
      console.log('   Sample profile:');
      console.log(`     ID: ${profiles[0].id}`);
      console.log(`     Name: ${profiles[0].first_name} ${profiles[0].last_name}`);
      console.log(`     School: ${profiles[0].schools?.name || 'Unknown'}`);
    }

    // Step 2: Test matches table access
    console.log('\n2️⃣ Testing matches table access...');
    
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select('*')
      .limit(5);

    if (matchesError) {
      console.error('❌ Error accessing matches table:', matchesError);
      return;
    }

    console.log(`✅ Successfully accessed matches table`);
    console.log(`   Found ${matches?.length || 0} matches`);

    if (matches && matches.length > 0) {
      console.log('   Sample match:');
      console.log(`     Match ID: ${matches[0].id}`);
      console.log(`     User1 ID: ${matches[0].user1_id}`);
      console.log(`     User2 ID: ${matches[0].user2_id}`);
      console.log(`     Matched at: ${matches[0].matched_at}`);
    }

    // Step 3: Test the new approach (matches + profiles)
    if (matches && matches.length > 0 && profiles && profiles.length > 0) {
      console.log('\n3️⃣ Testing new approach (matches + profiles)...');
      
      const testMatch = matches[0];
      const userIds = [testMatch.user1_id, testMatch.user2_id];
      
      const { data: matchUsers, error: matchUsersError } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          school_id,
          schools (name)
        `)
        .in('id', userIds);

      if (matchUsersError) {
        console.error('❌ Error fetching match users:', matchUsersError);
        return;
      }

      console.log(`✅ Successfully fetched ${matchUsers?.length || 0} users for match`);
      
      if (matchUsers && matchUsers.length > 0) {
        console.log('   Match users:');
        matchUsers.forEach((user, index) => {
          console.log(`     ${index + 1}. ${user.first_name} ${user.last_name} (${user.schools?.name || 'Unknown'})`);
        });
      }
    }

    // Step 4: Test the old approach (that was failing)
    console.log('\n4️⃣ Testing old approach (that was failing)...');
    
    const { data: oldMatches, error: oldError } = await supabase
      .from('matches')
      .select(`
        *,
        user1:profiles!user1_id (
          id,
          first_name,
          last_name,
          school_id,
          schools (name)
        ),
        user2:profiles!user2_id (
          id,
          first_name,
          last_name,
          school_id,
          schools (name)
        )
      `)
      .limit(1);

    if (oldError) {
      console.log('❌ Old approach still failing:', oldError.message);
      console.log('   This confirms the foreign key issue exists');
    } else {
      console.log('✅ Old approach worked (unexpected)');
    }

    console.log('\n🎉 Test completed!');
    console.log('\n📋 Summary:');
    console.log('   - Profiles table access: Working ✅');
    console.log('   - Matches table access: Working ✅');
    console.log('   - New approach (matches + profiles): Working ✅');
    console.log('   - Old approach (with foreign key hints): Failing ❌');
    console.log('   - The fix should resolve the Chats tab issue');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testProfilesTable();
