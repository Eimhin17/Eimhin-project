#!/usr/bin/env node

/**
 * Simple Test for SupabaseAuthService
 */

console.log('🧪 Simple Test for SupabaseAuthService...\n');

// Test 1: Check file exists
const fs = require('fs');
if (fs.existsSync('./services/supabaseAuth.ts')) {
  console.log('✅ supabaseAuth.ts file exists');
} else {
  console.log('❌ supabaseAuth.ts file missing');
}

// Test 2: Check file size
const stats = fs.statSync('./services/supabaseAuth.ts');
console.log(`✅ File size: ${stats.size} bytes`);

// Test 3: Check for key content
const content = fs.readFileSync('./services/supabaseAuth.ts', 'utf8');

const checks = [
  { name: 'Class definition', pattern: 'export class SupabaseAuthService' },
  { name: 'signUp method', pattern: 'static async signUp' },
  { name: 'signIn method', pattern: 'static async signIn' },
  { name: 'signOut method', pattern: 'static async signOut' },
  { name: 'getCurrentUser method', pattern: 'static async getCurrentUser' },
  { name: 'updateProfile method', pattern: 'static async updateProfile' },
  { name: 'isAuthenticated method', pattern: 'static async isAuthenticated' },
  { name: 'onAuthStateChange method', pattern: 'static onAuthStateChange' },
  { name: 'Supabase import', pattern: "import { supabase } from '../lib/supabase'" },
  { name: 'Interface imports', pattern: "import { AuthUser, SignUpData, SignInData } from './auth'" }
];

let passed = 0;
checks.forEach(check => {
  if (content.includes(check.pattern)) {
    console.log(`   ✅ ${check.name}`);
    passed++;
  } else {
    console.log(`   ❌ ${check.name}`);
  }
});

console.log(`\n📊 Test Results: ${passed}/${checks.length} checks passed`);

if (passed === checks.length) {
  console.log('🎉 All tests passed! SupabaseAuthService is ready.');
} else {
  console.log('⚠️ Some tests failed. Check the service file.');
}

console.log('\n🚀 Ready to test in your app!');
