const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://tagjfsxeutihwntpudsk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZ2pmc3hldXRpaHdudHB1ZHNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTkwNzgsImV4cCI6MjA3MDA5NTA3OH0.pvcZjPWdvIAbBXoZakS_kOlXfEbiUcvidXY1Oy2eFN0'
);

// Simulate the ProfilePictureService logic
const ProfilePictureService = {
  async generateCircularPFP(originalPhotoUrl) {
    try {
      const pfpUrl = `${originalPhotoUrl}?circular=true&w=200&h=200&fit=crop&crop=center`;
      console.log('🔄 Generated PFP URL:', pfpUrl);
      return pfpUrl;
    } catch (error) {
      console.error('❌ Error generating circular PFP:', error);
      return null;
    }
  },

  async createPFP(userId, originalPhotoUrl) {
    try {
      console.log('🔄 Creating PFP for user:', userId);
      console.log('📸 Original photo URL:', originalPhotoUrl);

      // Generate circular PFP URL
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

async function verifyPFPFlow() {
  try {
    console.log('🧪 Verifying PFP Creation Flow...\n');

    // Step 1: Check if profile_pictures table exists
    console.log('1️⃣ Checking profile_pictures table...');
    const { data: tableCheck, error: tableError } = await supabase
      .from('profile_pictures')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.log('❌ Table access error:', tableError.message);
      console.log('💡 The profile_pictures table needs to be created first');
      console.log('📋 Run the SQL script: DebsMatch/database/create-pfp-table-manual.sql');
      return;
    }
    
    console.log('✅ profile_pictures table is accessible');

    // Step 2: Get profiles with photos
    console.log('\n2️⃣ Getting profiles with photos...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, photos')
      .not('photos', 'is', null)
      .limit(2);
    
    if (profilesError) {
      console.log('❌ Error fetching profiles:', profilesError.message);
      return;
    }
    
    console.log(`✅ Found ${profiles?.length || 0} profiles with photos`);

    if (!profiles || profiles.length === 0) {
      console.log('⚠️ No profiles with photos found for testing');
      return;
    }

    // Step 3: Test PFP creation for each profile
    console.log('\n3️⃣ Testing PFP creation...');
    for (let i = 0; i < profiles.length; i++) {
      const profile = profiles[i];
      console.log(`\n👤 Testing profile ${i + 1}: ${profile.first_name} ${profile.last_name}`);
      console.log(`   ID: ${profile.id}`);
      console.log(`   Photos: ${profile.photos?.length || 0} photos`);
      
      if (profile.photos && profile.photos.length > 0) {
        console.log(`   First photo: ${profile.photos[0].substring(0, 50)}...`);
        
        // Test PFP creation
        const result = await ProfilePictureService.createPFPFromMainPhoto(profile.id);
        
        if (result.success) {
          console.log('✅ PFP created successfully!');
          console.log(`   PFP URL: ${result.pfp.pfp_url}`);
          console.log(`   Original URL: ${result.pfp.original_photo_url}`);
        } else {
          console.log('❌ PFP creation failed:', result.error);
        }
      }
    }

    // Step 4: Check final count
    console.log('\n4️⃣ Checking final PFP count...');
    const { data: finalCount, error: countError } = await supabase
      .from('profile_pictures')
      .select('*', { count: 'exact' });
    
    if (countError) {
      console.log('❌ Error getting final count:', countError.message);
    } else {
      console.log(`📊 Total PFPs in database: ${finalCount?.length || 0}`);
    }

    console.log('\n✅ PFP flow verification complete!');

  } catch (error) {
    console.error('❌ Error during verification:', error.message);
  }
}

verifyPFPFlow();
