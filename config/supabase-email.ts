export const SUPABASE_EMAIL_CONFIG = {
  // Your custom domain configuration
  domain: 'debsmatch.ie', // Your actual domain
  
  // Email addresses
  from: {
    verification: 'noreply@debsmatch.ie', // Your actual verification email
    support: 'support@debsmatch.ie', // Support email
    general: 'hello@debsmatch.ie' // General contact email
  },
  
  // Email templates
  templates: {
    verification: 'verification',
    welcome: 'welcome',
    passwordReset: 'password-reset',
    matchNotification: 'match-notification'
  },
  
  // Email settings
  settings: {
    codeExpiryMinutes: 10,
    maxRetries: 3,
    retryDelayMs: 1000
  },
  
  // Branding configuration
  branding: {
    appName: 'DebsMatch',
    logo: '💃',
    primaryColor: '#6C4AB6',
    secondaryColor: '#FF4F81'
  }
}

// Email verification flow configuration
export const EMAIL_VERIFICATION_CONFIG = {
  // Use Supabase built-in emails (simpler) or Edge Functions (more control)
  useEdgeFunctions: false, // Set to false to use Supabase built-in emails (more reliable)
  
  // Fallback to development mode if email fails
  fallbackToDevMode: false, // Disabled for production - real email sending enabled
  
  // Custom email content
  branding: {
    appName: 'DebsMatch',
    logo: '💃',
    primaryColor: '#6C4AB6',
    secondaryColor: '#FF4F81'
  }
}

// Supabase email provider configuration
export const SUPABASE_EMAIL_PROVIDER = {
  // Your Supabase project settings
  projectId: 'tagjfsxeutihwntpudsk', // From your supabase.ts file
  
  // Email provider settings
  provider: 'supabase', // Built-in Supabase email
  
  // Custom domain verification status
  customDomainVerified: true, // Set to true once you've verified your domain
  
  // Email limits and quotas
  limits: {
    dailyEmails: 1000, // Adjust based on your Supabase plan
    hourlyEmails: 100,
    maxRecipientsPerEmail: 1
  }
}
