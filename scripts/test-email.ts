#!/usr/bin/env ts-node

/**
 * Test script for DebsMatch email verification
 * Run with: npx ts-node scripts/test-email.ts
 */

import { EmailService } from '../services/email';
import { SUPABASE_EMAIL_CONFIG } from '../config/supabase-email';

async function testEmailSetup() {
  console.log('🧪 Testing DebsMatch Email Configuration...\n');

  // Test 1: Configuration Status
  console.log('1️⃣ Checking email configuration...');
  const configStatus = await EmailService.getEmailConfigStatus();
  console.log(`   ✅ Configured: ${configStatus.configured}`);
  console.log(`   🌐 Domain: ${configStatus.domain}`);
  console.log(`   📧 Provider: ${configStatus.provider}\n`);

  // Test 2: Send Test Email
  console.log('2️⃣ Testing email sending...');
  const testEmail = 'test@example.com';
  const sendResult = await EmailService.sendVerificationCode(testEmail);
  
  if (sendResult.success) {
    console.log(`   ✅ Email sent successfully to ${testEmail}`);
    console.log(`   📧 Check console for verification code (development mode)\n`);
  } else {
    console.log(`   ❌ Failed to send email: ${sendResult.error}\n`);
  }

  // Test 3: Test Configuration
  console.log('3️⃣ Running configuration test...');
  const testResult = await EmailService.testEmailConfiguration();
  console.log(`   ${testResult.success ? '✅' : '❌'} ${testResult.message}\n`);

  // Test 4: Configuration Summary
  console.log('4️⃣ Configuration Summary:');
  console.log(`   📧 From Address: ${SUPABASE_EMAIL_CONFIG.from.verification}`);
  console.log(`   🎨 App Name: ${SUPABASE_EMAIL_CONFIG.branding.appName}`);
  console.log(`   🎨 Primary Color: ${SUPABASE_EMAIL_CONFIG.branding.primaryColor}`);
  console.log(`   ⏰ Code Expiry: ${SUPABASE_EMAIL_CONFIG.settings.codeExpiryMinutes} minutes`);
  console.log(`   🔄 Max Retries: ${SUPABASE_EMAIL_CONFIG.settings.maxRetries}\n`);

  // Test 5: Next Steps
  console.log('5️⃣ Next Steps:');
  if (configStatus.domain === 'debsmatch.ie') {
    console.log('   ✅ Domain configured correctly: debsmatch.ie');
  } else {
    console.log('   ⚠️  Domain configuration issue detected');
  }
  
  console.log('   📋 Check SUPABASE_EMAIL_SETUP.md for detailed setup instructions');
  console.log('   🚀 Test with real emails once domain is verified');
  console.log('   🔧 Enable Edge Functions if you want custom email templates\n');

  console.log('🎉 Email testing complete!');
}

// Run the test
testEmailSetup().catch(console.error);
