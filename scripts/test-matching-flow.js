const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testMatchingFlow() {
  console.log('🧪 Testing Matching Flow...\n');

  try {
    // Step 1: Create two test users
    console.log('1️⃣ Creating test users...');
    
    const { data: user1, error: user1Error } = await supabase.auth.signUp({
      email: 'testuser1@example.com',
      password: 'testpassword123',
    });

    if (user1Error) {
      console.error('❌ Error creating user1:', user1Error);
      return;
    }

    const { data: user2, error: user2Error } = await supabase.auth.signUp({
      email: 'testuser2@example.com',
      password: 'testpassword123',
    });

    if (user2Error) {
      console.error('❌ Error creating user2:', user2Error);
      return;
    }

    console.log('✅ Test users created');
    console.log('   User1 ID:', user1.user.id);
    console.log('   User2 ID:', user2.user.id);

    // Step 2: Create user profiles
    console.log('\n2️⃣ Creating user profiles...');
    
    const { error: profile1Error } = await supabase
      .from('users')
      .insert({
        id: user1.user.id,
        first_name: 'Test',
        last_name: 'User1',
        date_of_birth: '2000-01-01',
        gender: 'woman',
        looking_for: 'go_to_someones_debs',
        relationship_intention: 'short_term_but_open_to_long_term',
        bio: 'Test user 1 bio',
        onboarding_completed: true,
        is_active: true,
      });

    if (profile1Error) {
      console.error('❌ Error creating profile1:', profile1Error);
      return;
    }

    const { error: profile2Error } = await supabase
      .from('users')
      .insert({
        id: user2.user.id,
        first_name: 'Test',
        last_name: 'User2',
        date_of_birth: '2000-01-01',
        gender: 'man',
        looking_for: 'bring_someone_to_my_debs',
        relationship_intention: 'short_term_but_open_to_long_term',
        bio: 'Test user 2 bio',
        onboarding_completed: true,
        is_active: true,
      });

    if (profile2Error) {
      console.error('❌ Error creating profile2:', profile2Error);
      return;
    }

    console.log('✅ User profiles created');

    // Step 3: User1 likes User2
    console.log('\n3️⃣ User1 likes User2...');
    
    const { data: like1, error: like1Error } = await supabase
      .from('likes')
      .insert({
        liker_id: user1.user.id,
        liked_user_id: user2.user.id,
      })
      .select()
      .single();

    if (like1Error) {
      console.error('❌ Error creating like1:', like1Error);
      return;
    }

    console.log('✅ User1 liked User2');

    // Step 4: User2 likes User1 (this should create a match)
    console.log('\n4️⃣ User2 likes User1 (should create match)...');
    
    const { data: like2, error: like2Error } = await supabase
      .from('likes')
      .insert({
        liker_id: user2.user.id,
        liked_user_id: user1.user.id,
      })
      .select()
      .single();

    if (like2Error) {
      console.error('❌ Error creating like2:', like2Error);
      return;
    }

    console.log('✅ User2 liked User1');

    // Step 5: Check if match was created
    console.log('\n5️⃣ Checking for match...');
    
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select('*')
      .or(`and(user1_id.eq.${user1.user.id},user2_id.eq.${user2.user.id}),and(user1_id.eq.${user2.user.id},user2_id.eq.${user1.user.id})`)
      .eq('is_active', true);

    if (matchesError) {
      console.error('❌ Error fetching matches:', matchesError);
      return;
    }

    if (matches && matches.length > 0) {
      console.log('✅ Match created successfully!');
      console.log('   Match ID:', matches[0].id);
      console.log('   User1 ID:', matches[0].user1_id);
      console.log('   User2 ID:', matches[0].user2_id);
      console.log('   Matched at:', matches[0].matched_at);
    } else {
      console.log('❌ No match found - this indicates an issue with the matching logic');
    }

    // Step 6: Test ChatService.getMatches for both users
    console.log('\n6️⃣ Testing ChatService.getMatches...');
    
    // Test for User1
    const { data: user1Matches, error: user1MatchesError } = await supabase
      .from('matches')
      .select(`
        *,
        user1:users!matches_user1_id_fkey (
          id,
          first_name,
          last_name,
          school_id,
          schools (name)
        ),
        user2:users!matches_user2_id_fkey (
          id,
          first_name,
          last_name,
          school_id,
          schools (name)
        )
      `)
      .or(`user1_id.eq.${user1.user.id},user2_id.eq.${user1.user.id}`)
      .eq('is_active', true);

    if (user1MatchesError) {
      console.error('❌ Error fetching user1 matches:', user1MatchesError);
    } else {
      console.log('✅ User1 matches:', user1Matches?.length || 0);
      if (user1Matches && user1Matches.length > 0) {
        const match = user1Matches[0];
        const isUser1 = match.user1_id === user1.user.id;
        const otherUser = isUser1 ? match.user2 : match.user1;
        console.log('   Other user:', otherUser.first_name, otherUser.last_name);
      }
    }

    // Test for User2
    const { data: user2Matches, error: user2MatchesError } = await supabase
      .from('matches')
      .select(`
        *,
        user1:users!matches_user1_id_fkey (
          id,
          first_name,
          last_name,
          school_id,
          schools (name)
        ),
        user2:users!matches_user2_id_fkey (
          id,
          first_name,
          last_name,
          school_id,
          schools (name)
        )
      `)
      .or(`user1_id.eq.${user2.user.id},user2_id.eq.${user2.user.id}`)
      .eq('is_active', true);

    if (user2MatchesError) {
      console.error('❌ Error fetching user2 matches:', user2MatchesError);
    } else {
      console.log('✅ User2 matches:', user2Matches?.length || 0);
      if (user2Matches && user2Matches.length > 0) {
        const match = user2Matches[0];
        const isUser1 = match.user1_id === user2.user.id;
        const otherUser = isUser1 ? match.user2 : match.user1;
        console.log('   Other user:', otherUser.first_name, otherUser.last_name);
      }
    }

    console.log('\n🎉 Matching flow test completed!');
    
    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    
    // Delete likes
    await supabase.from('likes').delete().eq('liker_id', user1.user.id);
    await supabase.from('likes').delete().eq('liker_id', user2.user.id);
    
    // Delete matches
    await supabase.from('matches').delete().or(`and(user1_id.eq.${user1.user.id},user2_id.eq.${user2.user.id}),and(user1_id.eq.${user2.user.id},user2_id.eq.${user1.user.id})`);
    
    // Delete user profiles
    await supabase.from('users').delete().eq('id', user1.user.id);
    await supabase.from('users').delete().eq('id', user2.user.id);
    
    // Delete auth users
    await supabase.auth.admin.deleteUser(user1.user.id);
    await supabase.auth.admin.deleteUser(user2.user.id);
    
    console.log('✅ Cleanup completed');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testMatchingFlow();
