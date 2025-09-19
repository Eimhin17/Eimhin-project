#!/usr/bin/env ts-node

/**
 * Fix User Password Script
 * 
 * This script fixes a user's password by updating it with the new hash function
 * Run with: npx ts-node scripts/fix-user-password.ts
 */

import { supabase } from '../lib/supabase';

// Simple hash function (same as in auth.ts)
function simpleHash(input: string): string {
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
  console.log('🔧 Fixing User Password...\n');

  const email = '19-0120@stkieranscollege.ie';
  const password = 'Rua&Luna1';
  
  try {
    // Generate new hash
    const newHash = simpleHash(password);
    console.log(`📝 New hash for password "${password}": ${newHash}`);
    
    // Create salt (using the same method as before)
    const salt = 'bc4ad1e74243155a5d3eee3e8c9be38195ac0c71e9d8a2f9d48e30599e02a539';
    
    // Combine salt and hash
    const fullHash = `${salt}:${newHash}`;
    console.log(`🔐 Full hash: ${fullHash}`);
    
    // Update the user's password in the database
    const { data, error } = await supabase
      .from('users')
      .update({ 
        password_hash: fullHash,
        updated_at: new Date().toISOString()
      })
      .eq('email', email)
      .select();
    
    if (error) {
      console.error('❌ Failed to update password:', error);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('✅ Password updated successfully!');
      console.log(`👤 User: ${data[0].email}`);
      console.log(`🔐 New hash stored: ${data[0].password_hash}`);
      
      console.log('\n🎯 Now try logging in with:');
      console.log(`📧 Email: ${email}`);
      console.log(`🔑 Password: ${password}`);
    } else {
      console.log('❌ User not found');
    }
    
  } catch (error) {
    console.error('❌ Script failed:', error);
  }
}

// Run the script if executed directly
if (require.main === module) {
  fixUserPassword();
}

export { fixUserPassword };
