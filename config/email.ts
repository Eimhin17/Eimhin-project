export const EMAIL_CONFIG = {
  // Email verification settings
  verificationCodeLength: 6,
  resendCooldownSeconds: 30,
  maxVerificationAttempts: 3,
  
  // Allowed email domains for school verification
  allowedDomains: ['.ie', '.edu'],
  
  // Supabase email settings
  supabase: {
    emailRedirectTo: 'debsmatch://email-verification',
    emailTemplate: 'email_verification',
  },
  
  // Development settings
  development: {
    mockCode: '123456',
    enableMockVerification: true,
  },
};
