const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://tagjfsxeutihwntpudsk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZ2pmc3hldXRpaHdudHB1ZHNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTkwNzgsImV4cCI6MjA3MDA5NTA3OH0.pvcZjPWdvIAbBXoZakS_kOlXfEbiUcvidXY1Oy2eFN0'
);

async function testPFPCreation() {
  try {
    console.log('🧪 Testing PFP creation...');
    
    // First, let's try to create the table manually
    console.log('📋 Creating profile_pictures table...');
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS profile_pictures (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        pfp_url VARCHAR(500) NOT NULL,
        original_photo_url VARCHAR(500) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id)
      );
    `;
    
    // Try to execute via RPC
    const { data: createResult, error: createError } = await supabase.rpc('exec_sql', { 
      sql_query: createTableSQL 
    });
    
    if (createError) {
      console.log('❌ Error creating table via RPC:', createError.message);
      
      // Try alternative approach - check if table exists
      const { data: tableCheck, error: tableError } = await supabase
        .from('profile_pictures')
        .select('*')
        .limit(1);
      
      if (tableError) {
        console.log('❌ Table does not exist or no access:', tableError.message);
        console.log('💡 You may need to create the table manually in Supabase dashboard');
        return;
      }
    }
    
    console.log('✅ Table creation attempted');
    
    // Test if we can access the table now
    const { data: testData, error: testError } = await supabase
      .from('profile_pictures')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.log('❌ Still cannot access table:', testError.message);
    } else {
      console.log('✅ Table is now accessible');
      console.log('📊 Current PFPs:', testData?.length || 0);
    }
    
    // Test PFP creation for a real user
    console.log('🔍 Looking for users with photos...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, photos')
      .not('photos', 'is', null)
      .limit(1);
    
    if (profilesError) {
      console.log('❌ Error fetching profiles:', profilesError.message);
      return;
    }
    
    if (!profiles || profiles.length === 0) {
      console.log('⚠️ No profiles with photos found');
      return;
    }
    
    const testUser = profiles[0];
    console.log('👤 Test user:', testUser.id);
    console.log('📸 Photos:', testUser.photos);
    
    if (testUser.photos && testUser.photos.length > 0) {
      const mainPhoto = testUser.photos[0];
      const pfpUrl = `${mainPhoto}?circular=true&w=200&h=200&fit=crop&crop=center`;
      
      console.log('🔄 Creating PFP for test user...');
      
      const { data: pfpData, error: pfpError } = await supabase
        .from('profile_pictures')
        .upsert({
          user_id: testUser.id,
          pfp_url: pfpUrl,
          original_photo_url: mainPhoto
        }, { onConflict: 'user_id' })
        .select();
      
      if (pfpError) {
        console.log('❌ Error creating PFP:', pfpError.message);
      } else {
        console.log('✅ PFP created successfully:', pfpData);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testPFPCreation();
