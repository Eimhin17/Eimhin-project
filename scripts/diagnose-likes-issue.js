#!/usr/bin/env node

/**
 * Script to diagnose the likes table issue
 */

const { createClient } = require('@supabase/supabase-js');

// Use your actual Supabase credentials
const supabaseUrl = 'https://tagjfsxeutihwntpudsk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZ2pmc3hldXRpaHdudHB1ZHNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTkwNzgsImV4cCI6MjA3MDA5NTA3OH0.pvcZjPWdvIAbBXoZakS_kOlXfEbiUcvidXY1Oy2eFN0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnoseLikesIssue() {
  console.log('🔍 Diagnosing Likes Table Issue...\n');

  try {
    // 1. Check if likes table exists
    console.log('1. Checking if likes table exists...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'likes');

    if (tablesError) {
      console.log('❌ Error checking tables:', tablesError.message);
    } else if (tables && tables.length > 0) {
      console.log('✅ Likes table exists');
    } else {
      console.log('❌ Likes table does not exist');
    }

    // 2. Check RLS status
    console.log('\n2. Checking RLS status...');
    const { data: rlsData, error: rlsError } = await supabase
      .rpc('get_table_rls_status', { table_name: 'likes' })
      .single();

    if (rlsError) {
      console.log('⚠️ Could not check RLS status (this is normal):', rlsError.message);
    } else {
      console.log('RLS Status:', rlsData);
    }

    // 3. Check if we can read from likes table
    console.log('\n3. Testing read access to likes table...');
    const { data: likesData, error: likesError } = await supabase
      .from('likes')
      .select('*')
      .limit(1);

    if (likesError) {
      console.log('❌ Cannot read from likes table:', likesError.message);
    } else {
      console.log('✅ Can read from likes table');
    }

    // 4. Check profiles table
    console.log('\n4. Checking profiles table...');
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, first_name')
      .limit(1);

    if (profilesError) {
      console.log('❌ Cannot read from profiles table:', profilesError.message);
    } else {
      console.log('✅ Can read from profiles table');
      if (profilesData && profilesData.length > 0) {
        console.log('Sample profile ID:', profilesData[0].id);
      }
    }

    // 5. Try to create a test like (this will likely fail)
    console.log('\n5. Testing like creation...');
    if (profilesData && profilesData.length >= 2) {
      const testLikerId = profilesData[0].id;
      const testLikedId = profilesData[1].id;
      
      const { data: testLike, error: testError } = await supabase
        .from('likes')
        .insert({
          liker_id: testLikerId,
          liked_user_id: testLikedId,
        })
        .select()
        .single();

      if (testError) {
        console.log('❌ Cannot create like:', testError.message);
        console.log('Error code:', testError.code);
        console.log('Error details:', testError.details);
      } else {
        console.log('✅ Successfully created test like:', testLike);
        
        // Clean up test like
        await supabase
          .from('likes')
          .delete()
          .eq('id', testLike.id);
        console.log('🧹 Cleaned up test like');
      }
    } else {
      console.log('⚠️ Not enough profiles to test like creation');
    }

  } catch (error) {
    console.error('❌ Error during diagnosis:', error);
  }
}

// Run the diagnosis
if (require.main === module) {
  diagnoseLikesIssue();
}

module.exports = { diagnoseLikesIssue };

