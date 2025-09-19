// App Configuration
export const APP_CONFIG = {
  name: 'DebsMatch',
  version: '1.0.0',
  description: 'Find your perfect Debs date',
};

// Supabase Configuration
export const SUPABASE_CONFIG = {
  url: 'https://tagjfsxeutihwntpudsk.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZ2pmc3hldXRpaHdudHB1ZHNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTkwNzgsImV4cCI6MjA3MDA5NTA3OH0.pvcZjPWdvIAbBXoZakS_kOlXfEbiUcvidXY1Oy2eFN0',
};

// App Settings
export const APP_SETTINGS = {
  minAge: 18,
  maxPhotos: 6,
  minPhotos: 4,
  maxInterests: 5,
  maxProfilePrompts: 3,
  swipeTimeout: 300, // milliseconds
};

// Feature Flags
export const FEATURES = {
  enableRealTimeChat: true,
  enablePushNotifications: true,
  enablePhotoUpload: true,
  enableVoicePrompts: false, // Coming soon
};
