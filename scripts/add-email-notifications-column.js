const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://tagjfsxeutihwntpudsk.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY environment variable.');
  console.error('   Please set SUPABASE_SERVICE_ROLE_KEY before running this script.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addEmailNotificationsColumn() {
  try {
    console.log('🔧 Adding email_notifications_enabled column to profiles table...');
    
    // Add the column
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE profiles 
        ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN DEFAULT true;
      `
    });

    if (alterError) {
      console.error('❌ Error adding column:', alterError);
      return;
    }

    console.log('✅ Column added successfully');

    // Update existing users to have email notifications enabled by default
    console.log('🔄 Updating existing users...');
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ email_notifications_enabled: true })
      .is('email_notifications_enabled', null);

    if (updateError) {
      console.error('❌ Error updating existing users:', updateError);
      return;
    }

    console.log('✅ Existing users updated');

    // Verify the column exists
    console.log('🔍 Verifying column exists...');
    const { data, error: verifyError } = await supabase
      .from('profiles')
      .select('email_notifications_enabled')
      .limit(1);

    if (verifyError) {
      console.error('❌ Error verifying column:', verifyError);
      return;
    }

    console.log('✅ Column verification successful:', data);
    console.log('🎉 email_notifications_enabled column added successfully!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the migration
addEmailNotificationsColumn();
