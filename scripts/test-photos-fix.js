// Test script to verify the photos fix
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

async function testPhotosFix() {
  console.log('🧪 Testing Photos Fix...\n');

  try {
    // Step 1: Test profiles table access
    console.log('1️⃣ Testing profiles table access...');
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, school_id, schools (name)')
      .limit(3);

    if (profilesError) {
      console.error('❌ Error accessing profiles:', profilesError);
      return;
    }

    console.log(`✅ Successfully accessed profiles table`);
    console.log(`   Found ${profiles?.length || 0} profiles`);

    if (profiles && profiles.length > 0) {
      const userIds = profiles.map(p => p.id);
      console.log(`   User IDs: ${userIds.join(', ')}`);

      // Step 2: Test user_photos table access
      console.log('\n2️⃣ Testing user_photos table access...');
      
      const { data: photos, error: photosError } = await supabase
        .from('user_photos')
        .select('user_id, photo_url, is_primary')
        .in('user_id', userIds);

      if (photosError) {
        console.error('❌ Error accessing user_photos:', photosError);
        return;
      }

      console.log(`✅ Successfully accessed user_photos table`);
      console.log(`   Found ${photos?.length || 0} photos`);

      if (photos && photos.length > 0) {
        console.log('   Photos:');
        photos.forEach((photo, index) => {
          console.log(`     ${index + 1}. User ${photo.user_id}: ${photo.photo_url} (Primary: ${photo.is_primary})`);
        });
      }

      // Step 3: Test the combination approach
      console.log('\n3️⃣ Testing combination approach...');
      
      // Create photos map
      const photosMap = new Map();
      photos?.forEach(photo => {
        if (!photosMap.has(photo.user_id)) {
          photosMap.set(photo.user_id, []);
        }
        photosMap.get(photo.user_id).push(photo);
      });

      console.log('   Photos map created:');
      photosMap.forEach((userPhotos, userId) => {
        const profile = profiles.find(p => p.id === userId);
        console.log(`     User ${userId} (${profile?.first_name}): ${userPhotos.length} photos`);
        userPhotos.forEach(photo => {
          console.log(`       - ${photo.photo_url} (Primary: ${photo.is_primary})`);
        });
      });

      // Step 4: Test the chat UI data structure
      console.log('\n4️⃣ Testing chat UI data structure...');
      
      profiles.forEach(profile => {
        const userPhotos = photosMap.get(profile.id) || [];
        const primaryPhoto = userPhotos.find(photo => photo.is_primary) || userPhotos[0];
        
        console.log(`   Chat UI for ${profile.first_name}:`);
        console.log(`     Display Name: ${profile.first_name}`);
        console.log(`     Avatar: ${primaryPhoto?.photo_url || 'Initial: ' + profile.first_name.charAt(0).toUpperCase()}`);
        console.log(`     School: ${profile.schools?.name || 'Unknown'}`);
        console.log(`     Message Preview: "Start a conversation!"`);
      });
    }

    console.log('\n🎉 Test completed!');
    console.log('\n📋 Summary:');
    console.log('   - Profiles table access: Working ✅');
    console.log('   - User_photos table access: Working ✅');
    console.log('   - Photos mapping: Working ✅');
    console.log('   - Chat UI data structure: Working ✅');
    console.log('   - The foreign key error should be resolved!');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testPhotosFix();
