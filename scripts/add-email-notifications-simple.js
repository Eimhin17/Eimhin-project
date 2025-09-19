const { createClient } = require('@supabase/supabase-js');

// Use the same configuration as the app
const supabaseUrl = 'https://tagjfsxeutihwntpudsk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZ2pmc3hldXRpaHdudHB1ZHNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTkwNzgsImV4cCI6MjA3MDA5NTA3OH0.pvcZjPWdvIAbBXoZakS_kOlXfEbiUcvidXY1Oy2eFN0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function addEmailNotificationsColumn() {
  try {
    console.log('🔧 Attempting to add email_notifications_enabled column...');
    
    // Try to add the column using a raw SQL query
    const { data, error } = await supabase.rpc('exec', {
      sql: 'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN DEFAULT true;'
    });

    if (error) {
      console.log('❌ RPC exec failed, trying alternative approach...');
      console.log('Error:', error.message);
      
      // Alternative: Try to update a profile with the new field to trigger schema update
      console.log('🔄 Trying to update a profile with email_notifications_enabled...');
      
      const { data: profiles, error: fetchError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);

      if (fetchError) {
        console.error('❌ Error fetching profiles:', fetchError);
        return;
      }

      if (profiles && profiles.length > 0) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ email_notifications_enabled: true })
          .eq('id', profiles[0].id);

        if (updateError) {
          console.error('❌ Error updating profile:', updateError);
          console.log('💡 The column may not exist yet. You may need to add it manually in the Supabase dashboard.');
          console.log('SQL to run in Supabase SQL Editor:');
          console.log('ALTER TABLE profiles ADD COLUMN email_notifications_enabled BOOLEAN DEFAULT true;');
        } else {
          console.log('✅ Successfully updated profile with email_notifications_enabled');
        }
      }
    } else {
      console.log('✅ Column added successfully:', data);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    console.log('💡 You may need to add the column manually in the Supabase dashboard.');
    console.log('SQL to run in Supabase SQL Editor:');
    console.log('ALTER TABLE profiles ADD COLUMN email_notifications_enabled BOOLEAN DEFAULT true;');
  }
}

// Run the migration
addEmailNotificationsColumn();
