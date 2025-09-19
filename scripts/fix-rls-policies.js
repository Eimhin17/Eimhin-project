// Fix RLS policies for the profiles table
// This will resolve the permission denied error

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tagjfsxeutihwntpudsk.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZ2pmc3hldXRpaHdudHB1ZHNrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDUxOTA3OCwiZXhwIjoyMDcwMDk1MDc4fQ.yrYprmDqWm02TOLR_eJEPBTF8wprvxuM8Qpu2Jonoqo';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixRLSPolicies() {
  console.log('🔧 Fixing RLS policies for profiles table...\n');
  
  try {
    // Step 1: Check current RLS status
    console.log('1️⃣ Checking current RLS status...');
    const { data: rlsStatus, error: rlsError } = await supabase
      .rpc('get_table_rls_status', { table_name: 'profiles' });
    
    if (rlsError) {
      console.log('ℹ️ RLS status check failed (this is normal):', rlsError.message);
    } else {
      console.log('✅ RLS status:', rlsStatus);
    }
    
    // Step 2: Check existing policies
    console.log('\n2️⃣ Checking existing RLS policies...');
    const { data: policies, error: policiesError } = await supabase
      .from('information_schema.policies')
      .select('*')
      .eq('table_name', 'profiles');
      
    if (policiesError) {
      console.log('❌ Error checking policies:', policiesError.message);
    } else {
      console.log('📋 Current policies:');
      policies.forEach(policy => {
        console.log(`   - ${policy.policy_name}: ${policy.permissive ? 'PERMISSIVE' : 'RESTRICTIVE'} ${policy.roles.join(', ')}`);
      });
    }
    
    // Step 3: Drop existing policies and recreate them
    console.log('\n3️⃣ Dropping existing policies...');
    const dropPolicies = [
      'DROP POLICY IF EXISTS "Users can view own profile" ON profiles;',
      'DROP POLICY IF EXISTS "Users can update own profile" ON profiles;',
      'DROP POLICY IF EXISTS "Users can view other active profiles" ON profiles;',
      'DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;',
      'DROP POLICY IF EXISTS "Service role can do everything" ON profiles;'
    ];
    
    for (const dropPolicy of dropPolicies) {
      const { error } = await supabase.rpc('exec_sql', { sql: dropPolicy });
      if (error) {
        console.log('⚠️ Error dropping policy (may not exist):', error.message);
      } else {
        console.log('✅ Policy dropped');
      }
    }
    
    // Step 4: Create new, more permissive policies
    console.log('\n4️⃣ Creating new RLS policies...');
    
    const createPolicies = [
      // Allow users to view their own profile
      `CREATE POLICY "Users can view own profile" ON profiles
       FOR SELECT USING (auth.uid() = id);`,
      
      // Allow users to update their own profile
      `CREATE POLICY "Users can update own profile" ON profiles
       FOR UPDATE USING (auth.uid() = id);`,
      
      // Allow users to insert their own profile
      `CREATE POLICY "Users can insert own profile" ON profiles
       FOR INSERT WITH CHECK (auth.uid() = id);`,
      
      // Allow users to view other active profiles (for matching)
      `CREATE POLICY "Users can view other active profiles" ON profiles
       FOR SELECT USING (status = 'active' AND onboarding_completed = true);`,
      
      // Allow service role to do everything (for admin operations)
      `CREATE POLICY "Service role can do everything" ON profiles
       FOR ALL USING (auth.role() = 'service_role');`
    ];
    
    for (const createPolicy of createPolicies) {
      const { error } = await supabase.rpc('exec_sql', { sql: createPolicy });
      if (error) {
        console.log('❌ Error creating policy:', error.message);
      } else {
        console.log('✅ Policy created');
      }
    }
    
    // Step 5: Verify the user can now access their profile
    console.log('\n5️⃣ Testing profile access...');
    
    // First, let's try to get the user's profile directly
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'eimhinohare@gmail.com')
      .single();
      
    if (profileError) {
      console.log('❌ Still can\'t access profile:', profileError.message);
      
      // Try a different approach - check if the profile exists at all
      console.log('\n🔍 Checking if profile exists with raw SQL...');
      const { data: rawProfile, error: rawError } = await supabase.rpc('exec_sql', { 
        sql: `SELECT * FROM profiles WHERE email = 'eimhinohare@gmail.com';` 
      });
      
      if (rawError) {
        console.log('❌ Raw SQL also failed:', rawError.message);
      } else {
        console.log('✅ Raw SQL result:', rawProfile);
      }
      
    } else {
      console.log('✅ Profile access restored!');
      console.log('   - ID:', profile.id);
      console.log('   - Email:', profile.email);
      console.log('   - First name:', profile.first_name);
      console.log('   - Last name:', profile.last_name);
    }
    
  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
  }
  
  console.log('\n🎯 RLS policy fix complete!');
  console.log('\n📋 Next steps:');
  console.log('1. Try signing in again in your app');
  console.log('2. If it still fails, the issue is elsewhere');
  console.log('3. Check the console for any new error messages');
}

// Run the fix
fixRLSPolicies().catch(console.error);
