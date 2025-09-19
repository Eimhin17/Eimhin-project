/**
 * Test script for the Profile Picture (PFP) system
 * Tests PFP creation, retrieval, and management
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Import the ProfilePictureService (we'll need to adapt this for Node.js)
const ProfilePictureService = {
  async createPFP(userId, originalPhotoUrl) {
    try {
      console.log('🔄 Creating PFP for user:', userId);
      console.log('📸 Original photo URL:', originalPhotoUrl);

      // Generate circular PFP URL using a simple approach
      const pfpUrl = await this.generateCircularPFP(originalPhotoUrl);

      if (!pfpUrl) {
        return {
          success: false,
          error: 'Failed to generate circular PFP'
        };
      }

      // Check if PFP already exists for this user
      const { data: existingPFP, error: checkError } = await supabase
        .from('profile_pictures')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('❌ Error checking existing PFP:', checkError);
        return {
          success: false,
          error: 'Failed to check existing PFP'
        };
      }

      let pfp;

      if (existingPFP) {
        // Update existing PFP
        const { data: updatedPFP, error: updateError } = await supabase
          .from('profile_pictures')
          .update({
            pfp_url: pfpUrl,
            original_photo_url: originalPhotoUrl,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .select()
          .single();

        if (updateError) {
          console.error('❌ Error updating PFP:', updateError);
          return {
            success: false,
            error: 'Failed to update PFP'
          };
        }

        pfp = updatedPFP;
        console.log('✅ PFP updated successfully');
      } else {
        // Create new PFP
        const { data: newPFP, error: insertError } = await supabase
          .from('profile_pictures')
          .insert({
            user_id: userId,
            pfp_url: pfpUrl,
            original_photo_url: originalPhotoUrl
          })
          .select()
          .single();

        if (insertError) {
          console.error('❌ Error creating PFP:', insertError);
          return {
            success: false,
            error: 'Failed to create PFP'
          };
        }

        pfp = newPFP;
        console.log('✅ PFP created successfully');
      }

      return {
        success: true,
        pfp
      };

    } catch (error) {
      console.error('❌ Error in createPFP:', error);
      return {
        success: false,
        error: 'An unexpected error occurred while creating PFP'
      };
    }
  },

  async generateCircularPFP(originalPhotoUrl) {
    try {
      // For now, we'll use a simple approach that adds circular styling parameters
      const pfpUrl = `${originalPhotoUrl}?circular=true&w=200&h=200&fit=crop&crop=center`;
      
      console.log('🔄 Generated PFP URL:', pfpUrl);
      return pfpUrl;

    } catch (error) {
      console.error('❌ Error generating circular PFP:', error);
      return null;
    }
  },

  async getPFP(userId) {
    try {
      const { data: pfp, error } = await supabase
        .from('profile_pictures')
        .select('pfp_url')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No PFP found
          return null;
        }
        console.error('❌ Error fetching PFP:', error);
        return null;
      }

      return pfp?.pfp_url || null;

    } catch (error) {
      console.error('❌ Error in getPFP:', error);
      return null;
    }
  },

  async createPFPFromMainPhoto(userId) {
    try {
      console.log('🔄 Creating PFP from main photo for user:', userId);

      // Get user's profile to find their main photo
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('photos')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('❌ Error fetching user profile:', profileError);
        return {
          success: false,
          error: 'Failed to fetch user profile'
        };
      }

      if (!profile?.photos || profile.photos.length === 0) {
        console.log('⚠️ No photos found for user, skipping PFP creation');
        return {
          success: false,
          error: 'No photos found for user'
        };
      }

      // Use the first photo as the main photo
      const mainPhotoUrl = profile.photos[0];
      console.log('📸 Using main photo:', mainPhotoUrl);

      // Create the PFP
      return await this.createPFP(userId, mainPhotoUrl);

    } catch (error) {
      console.error('❌ Error in createPFPFromMainPhoto:', error);
      return {
        success: false,
        error: 'An unexpected error occurred while creating PFP from main photo'
      };
    }
  }
};

async function testPFPSystem() {
  console.log('🧪 Testing PFP System');
  console.log('====================');

  try {
    // First, let's find a user with photos to test with
    console.log('🔍 Looking for users with photos...');
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, photos')
      .not('photos', 'is', null)
      .limit(5);

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
      return;
    }

    if (!profiles || profiles.length === 0) {
      console.log('⚠️ No profiles with photos found. Creating a test profile...');
      
      // Create a test profile with a photo
      const testPhotoUrl = 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop';
      const { data: testProfile, error: testError } = await supabase
        .from('profiles')
        .insert({
          id: '00000000-0000-0000-0000-000000000001', // Test UUID
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'User',
          date_of_birth: '2000-01-01',
          gender: 'woman',
          looking_for: 'both',
          relationship_intention: 'short_term',
          photos: [testPhotoUrl]
        })
        .select()
        .single();

      if (testError) {
        console.error('❌ Error creating test profile:', testError);
        return;
      }

      console.log('✅ Test profile created:', testProfile.id);
      profiles.push(testProfile);
    }

    const testUser = profiles[0];
    console.log('👤 Testing with user:', testUser.first_name, testUser.last_name);
    console.log('📸 User has', testUser.photos?.length || 0, 'photos');

    // Test 1: Create PFP from main photo
    console.log('\n🧪 Test 1: Creating PFP from main photo');
    const pfpResult = await ProfilePictureService.createPFPFromMainPhoto(testUser.id);
    
    if (pfpResult.success) {
      console.log('✅ PFP created successfully');
      console.log('🖼️ PFP URL:', pfpResult.pfp.pfp_url);
      console.log('📸 Original URL:', pfpResult.pfp.original_photo_url);
    } else {
      console.log('❌ PFP creation failed:', pfpResult.error);
    }

    // Test 2: Retrieve PFP
    console.log('\n🧪 Test 2: Retrieving PFP');
    const pfpUrl = await ProfilePictureService.getPFP(testUser.id);
    
    if (pfpUrl) {
      console.log('✅ PFP retrieved successfully');
      console.log('🖼️ PFP URL:', pfpUrl);
    } else {
      console.log('❌ No PFP found for user');
    }

    // Test 3: Test with multiple users
    console.log('\n🧪 Test 3: Testing with multiple users');
    for (let i = 0; i < Math.min(3, profiles.length); i++) {
      const user = profiles[i];
      console.log(`\n👤 Testing with user ${i + 1}: ${user.first_name} ${user.last_name}`);
      
      const result = await ProfilePictureService.createPFPFromMainPhoto(user.id);
      if (result.success) {
        console.log('✅ PFP created for', user.first_name);
      } else {
        console.log('❌ PFP creation failed for', user.first_name, ':', result.error);
      }
    }

    // Test 4: List all PFPs
    console.log('\n🧪 Test 4: Listing all PFPs');
    const { data: allPFPs, error: allPFPsError } = await supabase
      .from('profile_pictures')
      .select('*')
      .order('created_at', { ascending: false });

    if (allPFPsError) {
      console.error('❌ Error fetching all PFPs:', allPFPsError);
    } else {
      console.log('📊 Total PFPs in database:', allPFPs.length);
      allPFPs.forEach((pfp, index) => {
        console.log(`${index + 1}. User: ${pfp.user_id}`);
        console.log(`   PFP URL: ${pfp.pfp_url}`);
        console.log(`   Created: ${new Date(pfp.created_at).toLocaleString()}`);
        console.log('');
      });
    }

    console.log('\n✅ PFP System Test Complete!');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testPFPSystem();
