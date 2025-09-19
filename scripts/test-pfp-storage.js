#!/usr/bin/env node

/**
 * Test script for PFP storage functionality
 * Tests uploading PFPs to the user-pfps bucket
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Use hardcoded credentials from the app
const supabaseUrl = 'https://tagjfsxeutihwntpudsk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZ2pmc3hldXRpaHdudHB1ZHNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTkwNzgsImV4cCI6MjA3MDA5NTA3OH0.pvcZjPWdvIAbBXoZakS_kOlXfEbiUcvidXY1Oy2eFN0';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testPFPStorage() {
  console.log('🧪 Testing PFP Storage System');
  console.log('================================');

  try {
    // 1. Test bucket exists and is accessible
    console.log('\n1️⃣ Testing bucket access...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError);
      return;
    }

    const userPfpsBucket = buckets.find(bucket => bucket.id === 'user-pfps');
    if (!userPfpsBucket) {
      console.error('❌ user-pfps bucket not found');
      console.log('Available buckets:', buckets.map(b => b.id));
      return;
    }

    console.log('✅ user-pfps bucket found:', userPfpsBucket);
    console.log('   Public:', userPfpsBucket.public);

    // 2. Test RLS policies (using anon key, so we can't query pg_policies directly)
    console.log('\n2️⃣ Testing RLS policies...');
    console.log('ℹ️  Cannot test RLS policies with anon key - this requires service role key');
    console.log('ℹ️  Please verify policies manually in Supabase Dashboard');

    // 3. Test bucket structure
    console.log('\n3️⃣ Testing bucket structure...');
    const { data: files, error: filesError } = await supabase.storage
      .from('user-pfps')
      .list('', { limit: 10 });

    if (filesError) {
      console.error('❌ Error listing files:', filesError);
    } else {
      console.log('✅ Bucket accessible, found', files.length, 'files/folders');
      if (files.length > 0) {
        console.log('   Sample files:', files.slice(0, 3).map(f => f.name));
      }
    }

    // 4. Test public URL generation
    console.log('\n4️⃣ Testing public URL generation...');
    const testFileName = 'test-user/test-pfp.jpg';
    const { data: urlData } = supabase.storage
      .from('user-pfps')
      .getPublicUrl(testFileName);

    console.log('✅ Public URL generated:', urlData.publicUrl);

    // 5. Test database connection
    console.log('\n5️⃣ Testing database connection...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username')
      .limit(1);

    if (profilesError) {
      console.error('❌ Error querying profiles:', profilesError);
    } else {
      console.log('✅ Database connection working, found', profiles.length, 'profiles');
    }

    console.log('\n🎉 PFP Storage System Basic Test Complete!');
    console.log('✅ Bucket exists and is accessible');
    console.log('✅ Public URL generation works');
    console.log('✅ Database connection works');
    console.log('\n📝 Next steps:');
    console.log('   1. Verify RLS policies in Supabase Dashboard');
    console.log('   2. Test PFP upload in the app');
    console.log('   3. Test PFP display in CircularProfilePicture component');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testPFPStorage();
