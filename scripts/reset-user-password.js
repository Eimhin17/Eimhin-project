const { createClient } = require('@supabase/supabase-js');

// Supabase configuration with SERVICE ROLE KEY for admin operations
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

async function resetUserPassword(email, newPassword) {
  console.log('🔐 Manual Password Reset Script');
  console.log('================================');
  console.log('📧 Email:', email);
  console.log('🔑 New Password:', newPassword);
  console.log('---');

  try {
    // Step 1: Check if user exists
    console.log('🔄 Step 1: Checking if user exists...');
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Error listing users:', listError.message);
      return false;
    }

    const user = users.find(u => u.email === email);
    if (!user) {
      console.error('❌ User not found:', email);
      return false;
    }

    console.log('✅ User found:', user.id);
    console.log('📧 Email:', user.email);
    console.log('🔐 Email confirmed:', user.email_confirmed_at ? 'Yes' : 'No');
    console.log('---');

    // Step 2: Update user password using admin API
    console.log('🔄 Step 2: Updating user password...');
    const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (updateError) {
      console.error('❌ Error updating password:', updateError.message);
      return false;
    }

    console.log('✅ Password updated successfully!');
    console.log('👤 User ID:', updateData.user.id);
    console.log('📧 Email:', updateData.user.email);
    console.log('---');

    // Step 3: Test the new password
    console.log('🔄 Step 3: Testing new password...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: email,
      password: newPassword
    });

    if (signInError) {
      console.error('❌ Error testing new password:', signInError.message);
      return false;
    }

    console.log('✅ Login successful with new password!');
    console.log('👤 Logged in user ID:', signInData.user.id);
    console.log('---');

    // Step 4: Sign out
    console.log('🔄 Step 4: Signing out...');
    const { error: signOutError } = await supabase.auth.signOut();
    
    if (signOutError) {
      console.error('❌ Error signing out:', signOutError.message);
    } else {
      console.log('✅ Signed out successfully');
    }

    console.log('---');
    console.log('🎉 Password reset completed successfully!');
    console.log('🔑 New password is now active');
    console.log('📧 User can login with:', email);
    console.log('🔐 Password:', newPassword);
    
    return true;

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

async function main() {
  // Configuration - CHANGE THESE VALUES
  const userEmail = '19-0120@stkieranscollege.ie';
  const newPassword = 'test123'; // Simple password for testing

  console.log('🚀 Supabase Admin Password Reset');
  console.log('================================');
  console.log('');

  if (!userEmail || !newPassword) {
    console.error('❌ Please set userEmail and newPassword in the script');
    process.exit(1);
  }

  const success = await resetUserPassword(userEmail, newPassword);
  
  if (success) {
    console.log('');
    console.log('✅ Password reset successful!');
    console.log('🔑 User can now login with the new password');
  } else {
    console.log('');
    console.log('❌ Password reset failed!');
    console.log('🔍 Check the error messages above');
  }

  console.log('');
  console.log('🏁 Script completed!');
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  resetUserPassword
};
