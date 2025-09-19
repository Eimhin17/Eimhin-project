#!/usr/bin/env node

/**
 * Fix User Password Script
 * 
 * This script fixes a user's password by updating it with the new simple hash function
 * Run with: node scripts/fix-password.js
 */

// Simple hash function (same as in auth.ts - NO SALT)
function simpleHash(input) {
  let hash = 0;
  if (input.length === 0) return '00000000';
  
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  const positiveHash = Math.abs(hash).toString(16);
  return positiveHash.padStart(8, '0');
}

async function fixUserPassword() {
  console.log('🔧 Fixing User Password with NEW Simple Hash System...\n');

  const email = '19-0120@stkieranscollege.ie';
  const password = 'Rua&Luna1';
  
  try {
    // Generate new hash (NO SALT - just the password)
    const newHash = simpleHash(password);
    console.log(`📝 New hash for password "${password}": ${newHash}`);
    console.log(`🔐 This is the ONLY hash stored (no salt, no colon)`);
    
    console.log('\n🎯 To fix this user, run this SQL in your Supabase dashboard:');
    console.log('--------------------------------------------------');
    console.log(`UPDATE users SET password_hash = '${newHash}', updated_at = NOW() WHERE email = '${email}';`);
    console.log('--------------------------------------------------');
    
    console.log('\n📱 Or manually update the user in your Supabase dashboard:');
    console.log(`1. Go to Authentication > Users`);
    console.log(`2. Find user: ${email}`);
    console.log(`3. Update password_hash to: ${newHash}`);
    console.log(`4. IMPORTANT: Remove any salt (no more colon or long string)`);
    
    console.log('\n✅ After this update, the login will work because:');
    console.log(`   - Input password generates: ${newHash}`);
    console.log(`   - Database stores: ${newHash}`);
    console.log(`   - They match perfectly!`);
    
  } catch (error) {
    console.error('❌ Script failed:', error);
  }
}

// Run the script
fixUserPassword();
