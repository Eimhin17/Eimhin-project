const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tagjfsxeutihwntpudsk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZ2pmc3hldXRpaHdudHB1ZHNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTkwNzgsImV4cCI6MjA3MDA5NTA3OH0.pvcZjPWdvIAbBXoZakS_kOlXfEbiUcvidXY1Oy2eFN0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testTimingIssue() {
  console.log('🔍 === TESTING TIMING ISSUE ===');
  console.log('🔍 This test checks if there is a timing issue with password storage');
  console.log('');

  const testEmail = '19-0120@stkieranscollege.ie';
  const testPassword = 'Rua&Luna1';

  console.log('🧪 Test Configuration:');
  console.log('📧 Test Email:', testEmail);
  console.log('🔑 Test Password:', testPassword);
  console.log('');

  // Test multiple times with different delays
  const delays = [0, 5, 10, 30, 60]; // seconds

  for (let i = 0; i < delays.length; i++) {
    const delay = delays[i];
    
    console.log(`⏳ === TEST ${i + 1}: WAITING ${delay} SECONDS ===`);
    
    if (delay > 0) {
      console.log(`⏳ Waiting ${delay} seconds before testing...`);
      await new Promise(resolve => setTimeout(resolve, delay * 1000));
    }
    
    console.log('🔐 Attempting sign in...');
    
    try {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });

      if (signInError) {
        console.log(`❌ Test ${i + 1} failed:`, signInError.message);
        console.log(`🔍 Error code:`, signInError.code);
        
        if (signInError.message.includes('Invalid login credentials')) {
          console.log('🚨 Still getting "Invalid login credentials"');
        } else if (signInError.message.includes('Email not confirmed')) {
          console.log('⚠️ Getting "Email not confirmed" - this is expected');
          console.log('✅ This means the password is correct!');
          break; // Stop testing if we get email confirmation error
        }
      } else {
        console.log(`✅ Test ${i + 1} successful!`);
        console.log('👤 User ID:', signInData.user.id);
        console.log('📧 Email:', signInData.user.email);
        console.log('🔐 Email confirmed:', signInData.user.email_confirmed_at ? 'Yes' : 'No');
        
        // Sign out
        await supabase.auth.signOut();
        console.log('✅ Signed out successfully');
        
        console.log('');
        console.log('✅ === TIMING ISSUE RESOLVED! ===');
        console.log('✅ The password works after waiting', delay, 'seconds');
        console.log('✅ This was a timing issue with Supabase Auth');
        console.log('✅ === END TIMING ISSUE RESOLVED! ===');
        return true;
      }
    } catch (error) {
      console.error(`❌ Test ${i + 1} unexpected error:`, error);
    }
    
    console.log('');
  }
  
  console.log('🚨 === TIMING ISSUE NOT RESOLVED ===');
  console.log('🚨 Even after waiting up to 60 seconds, login still fails');
  console.log('🚨 This confirms it is NOT a timing issue');
  console.log('🚨 This is a fundamental Supabase Auth problem');
  console.log('🚨 === END TIMING ISSUE NOT RESOLVED ===');
  
  return false;
}

async function main() {
  console.log('🚀 Timing Issue Test');
  console.log('===================');
  console.log('');

  const resolved = await testTimingIssue();

  console.log('');
  console.log('🏁 Test complete!');
  console.log('');
  console.log('📋 SUMMARY:');
  console.log('📋 1. Tested login with multiple delays (0, 5, 10, 30, 60 seconds)');
  console.log('📋 2. Checked if timing affects password verification');
  console.log('📋 3. Identified if this is a timing issue or fundamental problem');
  console.log('');
  
  if (resolved) {
    console.log('🎯 CONCLUSION: This was a timing issue with Supabase Auth');
    console.log('🎯 SOLUTION: Wait longer after account creation before testing login');
  } else {
    console.log('🎯 CONCLUSION: This is NOT a timing issue');
    console.log('🎯 SOLUTION: There is a fundamental problem with Supabase Auth');
    console.log('🎯 NEXT STEPS: Check Supabase Dashboard and contact support');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testTimingIssue
};
