// Check user status in Supabase Auth
// This will help diagnose why signin is failing despite successful signup

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tagjfsxeutihwntpudsk.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZ2pmc3hldXRpaHdudHB1ZHNrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDUxOTA3OCwiZXhwIjoyMDcwMDk1MDc4fQ.yrYprmDqWm02TOLR_eJEPBTF8wprvxuM8Qpu2Jonoqo';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkUserStatus() {
  console.log('🔍 Checking user status in Supabase Auth...\n');

  const testEmail = 'eimhinohare@gmail.com';
  
  try {
    // Check if user exists in auth.users
    console.log('1️⃣ Checking if user exists in auth.users...');
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.log('❌ Error listing users:', listError.message);
      return;
    }
    
    const user = users.find(u => u.email === testEmail);
    
    if (user) {
      console.log('✅ User found in auth.users:');
      console.log('   - ID:', user.id);
      console.log('   - Email:', user.email);
      console.log('   - Email confirmed:', user.email_confirmed_at ? 'Yes' : 'No');
      console.log('   - Phone confirmed:', user.phone_confirmed_at ? 'Yes' : 'No');
      console.log('   - Created at:', user.created_at);
      console.log('   - Last sign in:', user.last_sign_in_at);
      console.log('   - User metadata:', user.user_metadata);
      console.log('   - App metadata:', user.app_metadata);
      console.log('   - Confirmation sent at:', user.confirmation_sent_at);
      console.log('   - Recovery sent at:', user.recovery_sent_at);
      console.log('   - Banned until:', user.banned_until);
      console.log('   - Reauthentication sent at:', user.reauthentication_sent_at);
      console.log('   - Role:', user.role);
      console.log('   - Aud:', user.aud);
      console.log('   - Factor ID:', user.factor_id);
      console.log('   - Factors:', user.factors);
      console.log('   - Identities:', user.identities);
      console.log('   - Invited at:', user.invited_at);
      console.log('   - Password updated at:', user.password_updated_at);
      console.log('   - Email change confirm status:', user.email_change_confirm_status);
      console.log('   - Phone change confirm status:', user.phone_change_confirm_status);
      
      // Check if user is confirmed
      if (!user.email_confirmed_at) {
        console.log('\n⚠️ USER EMAIL NOT CONFIRMED!');
        console.log('   This could be why signin is failing.');
        console.log('   The user needs to confirm their email first.');
      } else {
        console.log('\n✅ User email is confirmed');
      }
      
    } else {
      console.log('❌ User NOT found in auth.users');
      console.log('   This means the signup failed silently');
    }
    
    // Also check the profiles table
    console.log('\n2️⃣ Checking profiles table...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', testEmail)
      .single();
      
    if (profileError) {
      console.log('❌ Error fetching profile:', profileError.message);
    } else if (profile) {
      console.log('✅ Profile found in profiles table:');
      console.log('   - ID:', profile.id);
      console.log('   - Email:', profile.email);
      console.log('   - First name:', profile.first_name);
      console.log('   - Last name:', profile.last_name);
      console.log('   - Onboarding completed:', profile.onboarding_completed);
      console.log('   - Status:', profile.status);
    } else {
      console.log('❌ No profile found in profiles table');
    }
    
  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
  }
  
  console.log('\n🎯 Check complete!');
}

// Run the check
checkUserStatus().catch(console.error);
