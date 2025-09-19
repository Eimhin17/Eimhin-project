import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase project credentials
const supabaseUrl = 'https://tagjfsxeutihwntpudsk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhZ2pmc3hldXRpaHdudHB1ZHNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTkwNzgsImV4cCI6MjA3MDA5NTA3OH0.pvcZjPWdvIAbBXoZakS_kOlXfEbiUcvidXY1Oy2eFN0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
});

// =====================================================
// ENUM TYPES (matching database schema)
// =====================================================

export type GenderType = 'woman' | 'man' | 'non_binary';
export type SwipeDirection = 'left' | 'right';
export type RelationshipIntention = 
  | 'one_night_thing'
  | 'short_term_only'
  | 'short_term_but_open_to_long_term'
  | 'long_term_only'
  | 'long_term_but_open_to_short_term';
export type LookingForType = 'go_to_someones_debs' | 'bring_someone_to_my_debs';
export type UserStatusType = 'active' | 'suspended' | 'banned' | 'deleted';
export type VerificationStatusType = 'unverified' | 'pending' | 'verified' | 'rejected';
export type ContentModerationStatus = 'pending' | 'approved' | 'rejected' | 'flagged';
export type PrivacyLevelType = 'public' | 'friends_only' | 'private';
export type EventType = 
  | 'user_signup'
  | 'user_login'
  | 'profile_completed'
  | 'photo_uploaded'
  | 'swipe_left'
  | 'swipe_right'
  | 'match_created'
  | 'message_sent'
  | 'report_submitted'
  | 'user_deleted';

// =====================================================
// DATABASE TYPES (matching new schema)
// =====================================================

export interface Database {
  public: {
    Tables: {
      // Core Tables
      profiles: {
        Row: {
          id: string; // References auth.users.id
          first_name: string;
          last_name: string;
          date_of_birth: string;
          gender: GenderType;
          bio?: string;
          looking_for: LookingForType;
          relationship_intention: RelationshipIntention;
          discovery_source?: string;
          school_id?: string;
          current_location?: string; // POINT type stored as string
          privacy_level: PrivacyLevelType;
          push_notifications_enabled: boolean;
          email_notifications_enabled: boolean;
          sms_notifications_enabled: boolean;
          terms_of_service_accepted: boolean;
          privacy_policy_accepted: boolean;
          age_verification_accepted: boolean;
          data_processing_consent: boolean;
          status: UserStatusType;
          onboarding_completed: boolean;
          profile_completed: boolean;
          last_active: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string; // Must be provided (auth.users.id)
          first_name: string;
          last_name: string;
          date_of_birth: string;
          gender: GenderType;
          bio?: string;
          looking_for: LookingForType;
          relationship_intention: RelationshipIntention;
          discovery_source?: string;
          school_id?: string;
          current_location?: string;
          privacy_level?: PrivacyLevelType;
          push_notifications_enabled?: boolean;
          email_notifications_enabled?: boolean;
          sms_notifications_enabled?: boolean;
          terms_of_service_accepted?: boolean;
          privacy_policy_accepted?: boolean;
          age_verification_accepted?: boolean;
          data_processing_consent?: boolean;
          status?: UserStatusType;
          onboarding_completed?: boolean;
          profile_completed?: boolean;
          last_active?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          first_name?: string;
          last_name?: string;
          date_of_birth?: string;
          gender?: GenderType;
          bio?: string;
          looking_for?: LookingForType;
          relationship_intention?: RelationshipIntention;
          discovery_source?: string;
          school_id?: string;
          current_location?: string;
          privacy_level?: PrivacyLevelType;
          push_notifications_enabled?: boolean;
          email_notifications_enabled?: boolean;
          sms_notifications_enabled?: boolean;
          terms_of_service_accepted?: boolean;
          privacy_policy_accepted?: boolean;
          age_verification_accepted?: boolean;
          data_processing_consent?: boolean;
          status?: UserStatusType;
          onboarding_completed?: boolean;
          profile_completed?: boolean;
          last_active?: string;
          created_at?: string;
          updated_at?: string;
        };
      };

      schools: {
        Row: {
          id: string;
          name: string;
          county: string;
          address?: string;
          phone?: string;
          website?: string;
          coordinates?: string; // POINT type stored as string
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          county: string;
          address?: string;
          phone?: string;
          website?: string;
          coordinates?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          county?: string;
          address?: string;
          phone?: string;
          website?: string;
          coordinates?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };

      interests: {
        Row: {
          id: string;
          name: string;
          category: string;
          icon_name?: string;
          is_active: boolean;
          popularity_score: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category: string;
          icon_name?: string;
          is_active?: boolean;
          popularity_score?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          category?: string;
          icon_name?: string;
          is_active?: boolean;
          popularity_score?: number;
          created_at?: string;
        };
      };

      // Content Tables
      user_photos: {
        Row: {
          id: string;
          user_id: string;
          photo_url: string;
          photo_order: number;
          is_primary: boolean;
          moderation_status: ContentModerationStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          photo_url: string;
          photo_order: number;
          is_primary?: boolean;
          moderation_status?: ContentModerationStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          photo_url?: string;
          photo_order?: number;
          is_primary?: boolean;
          moderation_status?: ContentModerationStatus;
          created_at?: string;
        };
      };

      user_interests: {
        Row: {
          id: string;
          user_id: string;
          interest_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          interest_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          interest_id?: string;
          created_at?: string;
        };
      };

      profile_prompts: {
        Row: {
          id: string;
          prompt_text: string;
          category: string;
          is_active: boolean;
          is_required: boolean;
          max_length: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          prompt_text: string;
          category: string;
          is_active?: boolean;
          is_required?: boolean;
          max_length?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          prompt_text?: string;
          category?: string;
          is_active?: boolean;
          is_required?: boolean;
          max_length?: number;
          created_at?: string;
        };
      };

      user_profile_prompts: {
        Row: {
          id: string;
          user_id: string;
          prompt_id: string;
          response: string;
          moderation_status: ContentModerationStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          prompt_id: string;
          response: string;
          moderation_status?: ContentModerationStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          prompt_id?: string;
          response?: string;
          moderation_status?: ContentModerationStatus;
          created_at?: string;
          updated_at?: string;
        };
      };

      voice_prompts: {
        Row: {
          id: string;
          prompt_text: string;
          category: string;
          is_active: boolean;
          is_required: boolean;
          max_duration_seconds: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          prompt_text: string;
          category: string;
          is_active?: boolean;
          is_required?: boolean;
          max_duration_seconds?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          prompt_text?: string;
          category?: string;
          is_active?: boolean;
          is_required?: boolean;
          max_duration_seconds?: number;
          created_at?: string;
        };
      };

      user_voice_prompts: {
        Row: {
          id: string;
          user_id: string;
          prompt_id: string;
          audio_url: string;
          duration_seconds?: number;
          transcription?: string;
          moderation_status: ContentModerationStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          prompt_id: string;
          audio_url: string;
          duration_seconds?: number;
          transcription?: string;
          moderation_status?: ContentModerationStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          prompt_id?: string;
          audio_url?: string;
          duration_seconds?: number;
          transcription?: string;
          moderation_status?: ContentModerationStatus;
          created_at?: string;
        };
      };

      // Matching & Interaction Tables
      user_preferences: {
        Row: {
          id: string;
          user_id: string;
          min_age: number;
          max_age: number;
          max_distance_km: number;
          preferred_schools: string[]; // UUID array
          min_common_interests: number;
          must_have_photos: boolean;
          must_have_bio: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          min_age?: number;
          max_age?: number;
          max_distance_km?: number;
          preferred_schools?: string[];
          min_common_interests?: number;
          must_have_photos?: boolean;
          must_have_bio?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          min_age?: number;
          max_age?: number;
          max_distance_km?: number;
          preferred_schools?: string[];
          min_common_interests?: number;
          must_have_photos?: boolean;
          must_have_bio?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };

      swipes: {
        Row: {
          id: string;
          swiper_id: string;
          swiped_user_id: string;
          direction: SwipeDirection;
          created_at: string;
        };
        Insert: {
          id?: string;
          swiper_id: string;
          swiped_user_id: string;
          direction: SwipeDirection;
          created_at?: string;
        };
        Update: {
          id?: string;
          swiper_id?: string;
          swiped_user_id?: string;
          direction?: SwipeDirection;
          created_at?: string;
        };
      };

      matches: {
        Row: {
          id: string;
          user1_id: string;
          user2_id: string;
          matched_at: string;
        };
        Insert: {
          id?: string;
          user1_id: string;
          user2_id: string;
          matched_at?: string;
        };
        Update: {
          id?: string;
          user1_id?: string;
          user2_id?: string;
          matched_at?: string;
        };
      };

      messages: {
        Row: {
          id: string;
          match_id: string;
          sender_id: string;
          content: string;
          message_type: string;
          is_read: boolean;
          moderation_status: ContentModerationStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          match_id: string;
          sender_id: string;
          content: string;
          message_type?: string;
          is_read?: boolean;
          moderation_status?: ContentModerationStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          match_id?: string;
          sender_id?: string;
          content?: string;
          message_type?: string;
          is_read?: boolean;
          moderation_status?: ContentModerationStatus;
          created_at?: string;
        };
      };

      // Analytics & Metrics Tables
      user_demographics: {
        Row: {
          id: string;
          user_id: string;
          age_group?: string;
          county?: string;
          school_type?: string;
          total_swipes: number;
          total_matches: number;
          total_messages: number;
          profile_completion_percentage: number;
          days_since_signup: number;
          last_activity_days: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          age_group?: string;
          county?: string;
          school_type?: string;
          total_swipes?: number;
          total_matches?: number;
          total_messages?: number;
          profile_completion_percentage?: number;
          days_since_signup?: number;
          last_activity_days?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          age_group?: string;
          county?: string;
          school_type?: string;
          total_swipes?: number;
          total_matches?: number;
          total_messages?: number;
          profile_completion_percentage?: number;
          days_since_signup?: number;
          last_activity_days?: number;
          created_at?: string;
          updated_at?: string;
        };
      };

      app_events: {
        Row: {
          id: string;
          user_id?: string;
          event_type: EventType;
          event_data?: any; // JSONB
          session_id?: string;
          device_type?: string;
          app_version?: string;
          ip_address?: string;
          user_agent?: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          event_type: EventType;
          event_data?: any;
          session_id?: string;
          device_type?: string;
          app_version?: string;
          ip_address?: string;
          user_agent?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          event_type?: EventType;
          event_data?: any;
          session_id?: string;
          device_type?: string;
          app_version?: string;
          ip_address?: string;
          user_agent?: string;
          created_at?: string;
        };
      };

      // Legal & Compliance Tables
      legal_documents: {
        Row: {
          id: string;
          document_type: string;
          version: string;
          title: string;
          content: string;
          is_active: boolean;
          effective_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          document_type: string;
          version: string;
          title: string;
          content: string;
          is_active?: boolean;
          effective_date: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          document_type?: string;
          version?: string;
          title?: string;
          content?: string;
          is_active?: boolean;
          effective_date?: string;
          created_at?: string;
        };
      };

      user_legal_acceptances: {
        Row: {
          id: string;
          user_id: string;
          document_id: string;
          accepted_at: string;
          ip_address?: string;
          user_agent?: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          document_id: string;
          accepted_at?: string;
          ip_address?: string;
          user_agent?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          document_id?: string;
          accepted_at?: string;
          ip_address?: string;
          user_agent?: string;
        };
      };

      // Moderation & Safety Tables
      content_reports: {
        Row: {
          id: string;
          reporter_id: string;
          reported_user_id: string;
          content_type: string;
          content_id?: string;
          reason: string;
          description?: string;
          status: string;
          moderator_notes?: string;
          created_at: string;
          resolved_at?: string;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          reported_user_id: string;
          content_type: string;
          content_id?: string;
          reason: string;
          description?: string;
          status?: string;
          moderator_notes?: string;
          created_at?: string;
          resolved_at?: string;
        };
        Update: {
          id?: string;
          reporter_id?: string;
          reported_user_id?: string;
          content_type?: string;
          content_id?: string;
          reason?: string;
          description?: string;
          status?: string;
          moderator_notes?: string;
          created_at?: string;
          resolved_at?: string;
        };
      };

      // Mock Profiles (for testing)
      mock_profiles: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          date_of_birth: string;
          gender: GenderType;
          looking_for: LookingForType;
          relationship_intention: RelationshipIntention;
          bio?: string;
          school_id?: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          first_name: string;
          last_name: string;
          date_of_birth: string;
          gender: GenderType;
          looking_for: LookingForType;
          relationship_intention: RelationshipIntention;
          bio?: string;
          school_id?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          first_name?: string;
          last_name?: string;
          date_of_birth?: string;
          gender?: GenderType;
          looking_for?: LookingForType;
          relationship_intention?: RelationshipIntention;
          bio?: string;
          school_id?: string;
          is_active?: boolean;
          created_at?: string;
        };
      };
    };
  };
}

// =====================================================
// TYPE HELPERS
// =====================================================

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

// =====================================================
// COMMON TYPE ALIASES
// =====================================================

export type Profile = Tables<'profiles'>;
export type School = Tables<'schools'>;
export type Interest = Tables<'interests'>;
export type UserPhoto = Tables<'user_photos'>;
export type UserInterest = Tables<'user_interests'>;
export type ProfilePrompt = Tables<'profile_prompts'>;
export type UserProfilePrompt = Tables<'user_profile_prompts'>;
export type VoicePrompt = Tables<'voice_prompts'>;
export type UserVoicePrompt = Tables<'user_voice_prompts'>;
export type UserPreference = Tables<'user_preferences'>;
export type Swipe = Tables<'swipes'>;
export type Match = Tables<'matches'>;
export type Message = Tables<'messages'>;
export type UserDemographic = Tables<'user_demographics'>;
export type AppEvent = Tables<'app_events'>;
export type LegalDocument = Tables<'legal_documents'>;
export type UserLegalAcceptance = Tables<'user_legal_acceptances'>;
export type ContentReport = Tables<'content_reports'>;
export type MockProfile = Tables<'mock_profiles'>;

// =====================================================
// CHAT-RELATED TYPES (Updated for new schema)
// =====================================================

export interface ChatMessage {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  is_read: boolean;
  moderation_status: string;
  created_at: string;
  sender_name?: string;
  sender_avatar?: string;
}

export interface ChatMatch {
  id: string;
  user1_id: string;
  user2_id: string;
  matched_at: string;
  other_user: {
    id: string;
    first_name: string;
    last_name: string;
    school_id?: string;
    school_name?: string;
    photos?: { photo_url: string; is_primary: boolean }[];
  };
  last_message?: ChatMessage;
  unread_count: number;
}

export interface TypingStatus {
  match_id: string;
  user_id: string;
  is_typing: boolean;
  timestamp: string;
}

// =====================================================
// AUTH USER TYPE (for Supabase Auth integration)
// =====================================================

export interface AuthUser {
  id: string;
  email: string;
  email_verified?: boolean;
  phone?: string;
  phone_verified?: boolean;
  created_at: string;
  updated_at: string;
  last_sign_in?: string;
  profile?: Profile; // Linked profile data
}

// =====================================================
// ONBOARDING TYPES
// =====================================================

export interface OnboardingData {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: GenderType;
  looking_for: LookingForType;
  relationship_intention: RelationshipIntention;
  bio?: string;
  school_id?: string;
  discovery_source?: string;
  interests?: string[]; // Interest IDs
  photos?: File[]; // Photo files for upload
  profile_prompts?: { prompt_id: string; response: string }[];
  voice_prompts?: { prompt_id: string; audio_file: File }[];
  terms_accepted: boolean;
  privacy_policy_accepted: boolean;
  age_verification_accepted: boolean;
  data_processing_consent: boolean;
}

// =====================================================
// MATCHING TYPES
// =====================================================

export interface MatchCandidate {
  profile: Profile;
  school?: School;
  photos: UserPhoto[];
  interests: Interest[];
  profile_prompts: UserProfilePrompt[];
  common_interests: number;
  distance_km?: number;
  match_score: number;
}

export interface MatchPreferences {
  min_age: number;
  max_age: number;
  max_distance_km: number;
  preferred_schools: string[];
  min_common_interests: number;
  must_have_photos: boolean;
  must_have_bio: boolean;
}

// =====================================================
// ANALYTICS TYPES
// =====================================================

export interface UserAnalytics {
  demographics: UserDemographic;
  events: AppEvent[];
  engagement_metrics: {
    total_swipes: number;
    total_matches: number;
    total_messages: number;
    profile_completion_percentage: number;
    days_since_signup: number;
    last_activity_days: number;
  };
}

export interface AppAnalytics {
  total_users: number;
  active_users: number;
  new_signups_today: number;
  total_matches: number;
  total_messages: number;
  user_demographics: {
    age_groups: Record<string, number>;
    counties: Record<string, number>;
    school_types: Record<string, number>;
  };
}
