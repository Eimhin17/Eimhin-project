// Simple test to see if database changes were applied
// This will help us understand what's still broken

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tagjfsxeutihwntpudsk.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZ2pmc3hldXRpaHdudHB1ZHNrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDUxOTA3OCwiZXhwIjoyMDcwMDk1MDc4fQ.yrYprmDqWm02TOLR_eJEPBTF8wprvxuM8Qpu2Jonoqo';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testDatabaseAccess() {
  console.log('🧪 TESTING DATABASE ACCESS\n');
  
  try {
    // Test 1: Try to access profiles table directly
    console.log('1️⃣ Testing direct access to profiles table...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, school_email')
      .limit(1);
      
    if (profilesError) {
      console.log('❌ Still can\'t access profiles table:', profilesError.message);
    } else {
      console.log('✅ Can access profiles table!');
      console.log('   Sample data:', profiles);
    }
    
    // Test 2: Try to create a test profile
    console.log('\n2️⃣ Testing profile creation...');
    const testProfile = {
      id: 'test-user-123',
      email: 'test@example.com',
      school_email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      status: 'active'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('profiles')
      .insert(testProfile)
      .select();
      
    if (insertError) {
      console.log('❌ Can\'t insert into profiles:', insertError.message);
    } else {
      console.log('✅ Can insert into profiles!');
      
      // Clean up test data
      await supabase
        .from('profiles')
        .delete()
        .eq('id', 'test-user-123');
    }
    
    // Test 3: Check if RLS is enabled
    console.log('\n3️⃣ Checking RLS status...');
    const { data: rlsStatus, error: rlsError } = await supabase
      .from('information_schema.tables')
      .select('table_name, is_insertable_into, is_updatable, is_deletable')
      .eq('table_name', 'profiles');
      
    if (rlsError) {
      console.log('❌ Can\'t check RLS status:', rlsError.message);
    } else {
      console.log('✅ RLS status:', rlsStatus);
    }
    
  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
  }
  
  console.log('\n🎯 Database access test complete!');
}

// Run the test
testDatabaseAccess().catch(console.error);
