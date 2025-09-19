#!/usr/bin/env node

/**
 * Create Supabase Auth User
 * 
 * This script creates a user in Supabase Auth for an existing database user
 * Run with: node scripts/create-supabase-user.js
 */

console.log('🔐 Creating Supabase Auth User...\n');

const email = '19-0120@stkieranscollege.ie';
const password = 'Rua&Luna1';

console.log(`📧 Email: ${email}`);
console.log(`🔑 Password: ${password}`);
console.log(`\n🎯 This script will:`);
console.log(`1. Create user in Supabase Auth`);
console.log(`2. Update the database user ID to match`);
console.log(`3. Enable login with the new system`);

console.log(`\n⚠️ IMPORTANT: You need to run this in your Supabase dashboard:`);
console.log(`\n📱 Steps:`);
console.log(`1. Go to Supabase Dashboard → Authentication → Users`);
console.log(`2. Click "Add User"`);
console.log(`3. Enter:`);
console.log(`   - Email: ${email}`);
console.log(`   - Password: ${password}`);
console.log(`4. Click "Create User"`);
console.log(`5. Copy the new User ID (UUID)`);
console.log(`6. Run this SQL in your database:`);

console.log(`\n🔧 SQL to Update Database User:`);
console.log(`--------------------------------------------------`);
console.log(`-- First, get the new Supabase Auth User ID`);
console.log(`-- Then run this (replace UUID_HERE with the actual ID):`);
console.log(`UPDATE users SET id = 'UUID_HERE' WHERE email = '${email}';`);
console.log(`--------------------------------------------------`);

console.log(`\n✅ After this, the user will be able to log in with:`);
console.log(`   Email: ${email}`);
console.log(`   Password: ${password}`);

console.log(`\n🚀 The new Supabase Auth system will handle all password security automatically!`);
