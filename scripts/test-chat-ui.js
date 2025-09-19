// Test script to verify the chat UI updates
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

async function testChatUI() {
  console.log('🧪 Testing Chat UI Updates...\n');

  try {
    // Step 1: Test profiles with photos
    console.log('1️⃣ Testing profiles with photos...');
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        school_id,
        schools (name),
        user_photos (photo_url, is_primary)
      `)
      .limit(3);

    if (profilesError) {
      console.error('❌ Error accessing profiles:', profilesError);
      return;
    }

    console.log(`✅ Successfully accessed profiles with photos`);
    console.log(`   Found ${profiles?.length || 0} profiles`);

    if (profiles && profiles.length > 0) {
      profiles.forEach((profile, index) => {
        console.log(`   Profile ${index + 1}:`);
        console.log(`     Name: ${profile.first_name} ${profile.last_name}`);
        console.log(`     School: ${profile.schools?.name || 'Unknown'}`);
        console.log(`     Photos: ${profile.user_photos?.length || 0}`);
        
        if (profile.user_photos && profile.user_photos.length > 0) {
          const primaryPhoto = profile.user_photos.find(photo => photo.is_primary) || profile.user_photos[0];
          console.log(`     Primary Photo: ${primaryPhoto.photo_url}`);
        } else {
          console.log(`     No photos - will show initial: ${profile.first_name?.charAt(0)?.toUpperCase()}`);
        }
        console.log('');
      });
    }

    // Step 2: Test matches with user data
    console.log('2️⃣ Testing matches with user data...');
    
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select('*')
      .limit(3);

    if (matchesError) {
      console.error('❌ Error accessing matches:', matchesError);
      return;
    }

    console.log(`✅ Successfully accessed matches`);
    console.log(`   Found ${matches?.length || 0} matches`);

    if (matches && matches.length > 0) {
      matches.forEach((match, index) => {
        console.log(`   Match ${index + 1}:`);
        console.log(`     Match ID: ${match.id}`);
        console.log(`     User1 ID: ${match.user1_id}`);
        console.log(`     User2 ID: ${match.user2_id}`);
        console.log(`     Matched at: ${match.matched_at}`);
      });
    }

    // Step 3: Test the complete flow (matches + profiles + photos)
    if (matches && matches.length > 0 && profiles && profiles.length > 0) {
      console.log('\n3️⃣ Testing complete chat flow...');
      
      const testMatch = matches[0];
      const userIds = [testMatch.user1_id, testMatch.user2_id];
      
      const { data: matchUsers, error: matchUsersError } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          school_id,
          schools (name),
          user_photos (photo_url, is_primary)
        `)
        .in('id', userIds);

      if (matchUsersError) {
        console.error('❌ Error fetching match users:', matchUsersError);
        return;
      }

      console.log(`✅ Successfully fetched ${matchUsers?.length || 0} users for match`);
      
      if (matchUsers && matchUsers.length > 0) {
        console.log('   Chat UI would display:');
        matchUsers.forEach((user, index) => {
          const primaryPhoto = user.user_photos?.find(photo => photo.is_primary) || user.user_photos?.[0];
          const displayName = user.first_name; // Just first name now
          const avatarDisplay = primaryPhoto?.photo_url || `${user.first_name?.charAt(0)?.toUpperCase()}`;
          
          console.log(`     ${index + 1}. ${displayName}`);
          console.log(`        Avatar: ${primaryPhoto?.photo_url ? 'Profile Photo' : 'Initial Letter'}`);
          console.log(`        School: ${user.schools?.name || 'Unknown'}`);
          console.log(`        Message Preview: "Start a conversation!"`);
        });
      }
    }

    console.log('\n🎉 Test completed!');
    console.log('\n📋 Summary:');
    console.log('   - Profiles with photos: Working ✅');
    console.log('   - Matches data: Working ✅');
    console.log('   - Chat UI will show:');
    console.log('     • User profile pictures (or initials)');
    console.log('     • Just first names');
    console.log('     • Message previews');
    console.log('     • "Start a conversation!" for new matches');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testChatUI();
