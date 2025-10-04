// Check the REAL database state to see what's actually happening
// This will help us understand why authentication is still failing

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tagjfsxeutihwntpudsk.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY environment variable.');
  console.error('   Please set SUPABASE_SERVICE_ROLE_KEY before running this script.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkRealDatabaseState() {
  console.log('🔍 CHECKING REAL DATABASE STATE\n');
  
  const testEmail = '19-0120@stkieranscollege.ie';
  
  try {
    // Step 1: Check if user exists in auth.users
    console.log('1️⃣ Checking auth.users table...');
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.log('❌ Error listing users:', listError.message);
      return;
    }
    
    const authUser = users.find(u => u.email === testEmail);
    
    if (authUser) {
      console.log('✅ User found in auth.users:');
      console.log('   - ID:', authUser.id);
      console.log('   - Email:', authUser.email);
      console.log('   - Email confirmed:', authUser.email_confirmed_at ? 'Yes' : 'No');
      console.log('   - Created at:', authUser.created_at);
      console.log('   - Last sign in:', authUser.last_sign_in_at);
      console.log('   - User metadata:', authUser.user_metadata);
      
      // Step 2: Check if profile exists in profiles table
      console.log('\n2️⃣ Checking profiles table...');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();
        
      if (profileError) {
        console.log('❌ Error fetching profile:', profileError.message);
        
        // Try to see what columns actually exist
        console.log('\n🔍 Checking what columns exist in profiles table...');
        const { data: columns, error: columnsError } = await supabase.rpc('exec_sql', { 
          sql: `SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'profiles' ORDER BY ordinal_position;` 
        });
        
        if (columnsError) {
          console.log('❌ Could not check columns:', columnsError.message);
        } else {
          console.log('📋 Available columns in profiles table:');
          columns.forEach(col => {
            console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
          });
        }
        
      } else if (profile) {
        console.log('✅ Profile found in profiles table:');
        console.log('   - ID:', profile.id);
        console.log('   - Email fields:', {
          email: profile.email,
          school_email: profile.school_email,
          email_verified: profile.email_verified,
          school_email_verified: profile.school_email_verified
        });
        console.log('   - First name:', profile.first_name);
        console.log('   - Last name:', profile.last_name);
        console.log('   - Onboarding completed:', profile.onboarding_completed);
        console.log('   - Status:', profile.status);
        
        // Step 3: Check if we can access this profile with RLS
        console.log('\n3️⃣ Testing RLS access to profile...');
        const { data: rlsProfile, error: rlsError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();
          
        if (rlsError) {
          console.log('❌ RLS blocked access:', rlsError.message);
        } else {
          console.log('✅ RLS access successful');
        }
      }
      
      // Step 4: Check if the trigger function exists and works
      console.log('\n4️⃣ Checking trigger function...');
      const { data: functions, error: funcError } = await supabase.rpc('exec_sql', { 
        sql: `SELECT routine_name, routine_type FROM information_schema.routines WHERE routine_name = 'handle_new_user';` 
      });
      
      if (funcError) {
        console.log('❌ Could not check functions:', funcError.message);
      } else if (functions && functions.length > 0) {
        console.log('✅ Trigger function exists');
        
        // Check if trigger exists
        const { data: triggers, error: triggerError } = await supabase.rpc('exec_sql', { 
          sql: `SELECT trigger_name, event_manipulation, event_object_table FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created';` 
        });
        
        if (triggerError) {
          console.log('❌ Could not check triggers:', triggerError.message);
        } else if (triggers && triggers.length > 0) {
          console.log('✅ Trigger exists');
        } else {
          console.log('❌ Trigger does not exist');
        }
      } else {
        console.log('❌ Trigger function does not exist');
      }
      
    } else {
      console.log('❌ User NOT found in auth.users');
      console.log('   This means the signup failed completely');
    }
    
  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
  }
  
  console.log('\n🎯 Database state check complete!');
}

// Run the check
checkRealDatabaseState().catch(console.error);
