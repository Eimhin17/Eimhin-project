#!/usr/bin/env node

/**
 * Test Email Sending Functionality
 * 
 * This script tests if the email verification system can send emails
 */

const { EmailVerificationService } = require('../services/emailVerification');

async function testEmailSending() {
  console.log('🧪 Testing Email Sending Functionality...\n');

  try {
    // Test with a real email address (replace with your email)
    const testEmail = 'your-email@example.com'; // Replace with your actual email
    
    console.log(`📧 Sending test verification email to: ${testEmail}`);
    
    const result = await EmailVerificationService.sendVerificationCode(testEmail);
    
    if (result.success) {
      console.log('✅ Email sent successfully!');
      console.log('📧 Check your email inbox for the verification code');
      console.log('📧 The code will be displayed in the console if in development mode');
    } else {
      console.error('❌ Failed to send email:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testEmailSending();
