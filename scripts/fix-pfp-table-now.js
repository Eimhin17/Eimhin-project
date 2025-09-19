const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://tagjfsxeutihwntpudsk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZ2pmc3hldXRpaHdudHB1ZHNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTkwNzgsImV4cCI6MjA3MDA5NTA3OH0.pvcZjPWdvIAbBXoZakS_kOlXfEbiUcvidXY1Oy2eFN0'
);

async function createPfpTable() {
  try {
    console.log('🔧 Creating profile_pictures table...');
    
    // First, try to drop any existing table/view
    console.log('1️⃣ Dropping any existing table/view...');
    const dropResult = await supabase.rpc('exec_sql', {
      sql: `
        DROP TABLE IF EXISTS profile_pictures CASCADE;
        DROP VIEW IF EXISTS user_pfps CASCADE;
      `
    });
    
    if (dropResult.error) {
      console.log('⚠️ Drop warning (may be expected):', dropResult.error.message);
    }
    
    // Create the table
    console.log('2️⃣ Creating profile_pictures table...');
    const createResult = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE profile_pictures (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
          pfp_url TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id)
        );
      `
    });
    
    if (createResult.error) {
      console.log('❌ Create table error:', createResult.error.message);
      return;
    }
    
    console.log('✅ Table created successfully!');
    
    // Create indexes
    console.log('3️⃣ Creating indexes...');
    const indexResult = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX idx_profile_pictures_user_id ON profile_pictures(user_id);
        CREATE INDEX idx_profile_pictures_created_at ON profile_pictures(created_at);
      `
    });
    
    if (indexResult.error) {
      console.log('⚠️ Index warning:', indexResult.error.message);
    } else {
      console.log('✅ Indexes created!');
    }
    
    // Enable RLS
    console.log('4️⃣ Enabling RLS...');
    const rlsResult = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE profile_pictures ENABLE ROW LEVEL SECURITY;
      `
    });
    
    if (rlsResult.error) {
      console.log('⚠️ RLS warning:', rlsResult.error.message);
    } else {
      console.log('✅ RLS enabled!');
    }
    
    // Create RLS policies
    console.log('5️⃣ Creating RLS policies...');
    const policyResult = await supabase.rpc('exec_sql', {
      sql: `
        -- Allow all users to read profile pictures
        CREATE POLICY "Allow all users to read profile_pictures" ON profile_pictures
          FOR SELECT USING (true);
        
        -- Allow authenticated users to insert their own profile pictures
        CREATE POLICY "Allow users to insert their own profile_pictures" ON profile_pictures
          FOR INSERT WITH CHECK (auth.uid() = user_id);
        
        -- Allow users to update their own profile pictures
        CREATE POLICY "Allow users to update their own profile_pictures" ON profile_pictures
          FOR UPDATE USING (auth.uid() = user_id);
        
        -- Allow users to delete their own profile pictures
        CREATE POLICY "Allow users to delete their own profile_pictures" ON profile_pictures
          FOR DELETE USING (auth.uid() = user_id);
      `
    });
    
    if (policyResult.error) {
      console.log('⚠️ Policy warning:', policyResult.error.message);
    } else {
      console.log('✅ RLS policies created!');
    }
    
    // Test the table
    console.log('6️⃣ Testing table access...');
    const testResult = await supabase
      .from('profile_pictures')
      .select('*')
      .limit(1);
    
    if (testResult.error) {
      console.log('❌ Test error:', testResult.error.message);
    } else {
      console.log('✅ Table is accessible!');
      console.log('📊 Current records:', testResult.data?.length || 0);
    }
    
  } catch (err) {
    console.log('❌ Error:', err.message);
  }
}

createPfpTable();
