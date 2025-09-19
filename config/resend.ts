// Resend Email Service Configuration
// Get your API key from: https://resend.com

export const RESEND_CONFIG = {
  // Your Resend API key - replace with your actual key
  API_KEY: 're_hjoNzmts_HozVpQXfQre1jTeLyzKKHX7Q',
  
  // From email address - use Resend's test domain for now
  FROM_EMAIL: 'onboarding@resend.dev',
  
  // Set to false when you want to send real emails
  DEVELOPMENT_MODE: false
};

// Instructions:
// 1. Go to https://resend.com and sign up
// 2. Get your API key from the dashboard
// 3. Replace 're_YOUR_API_KEY_HERE' with your actual key
// 4. Set DEVELOPMENT_MODE to false
// 5. Test with a real email address
