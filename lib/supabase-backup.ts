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

// Database types based on your actual schema from setup.sql
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          phone_number?: string;
          phone_verified?: boolean;
          school_id?: string;
          school_email?: string;
          school_email_verified?: boolean;
          first_name: string;
          last_name: string;
          date_of_birth: string;
          gender?: 'woman' | 'man' | 'non_binary';
          looking_for?: 'go_to_someones_debs' | 'bring_someone_to_my_debs';
          relationship_intention?: 'one_night_thing' | 'short_term_only' | 'short_term_but_open_to_long_term' | 'long_term_only' | 'long_term_but_open_to_short_term' | 'Serious relationship' | 'Casual dating' | 'Friendship';
          bio?: string;
          discovery_source?: string;
          push_notifications_enabled?: boolean;
          privacy_policy_accepted?: boolean;
          onboarding_completed?: boolean;
          status?: string;
          last_active?: string;
          created_at?: string;
          updated_at?: string;
        };
        Insert: {
          id?: string;
          phone_number?: string;
          phone_verified?: boolean;
          school_id?: string;
          school_email?: string;
          school_email_verified?: boolean;
          first_name: string;
          last_name: string;
          date_of_birth: string;
          gender?: 'woman' | 'man' | 'non_binary';
          looking_for?: 'go_to_someones_debs' | 'bring_someone_to_my_debs';
          relationship_intention?: 'one_night_thing' | 'short_term_only' | 'short_term_but_open_to_long_term' | 'long_term_only' | 'long_term_but_open_to_short_term' | 'Serious relationship' | 'Casual dating' | 'Friendship';
          bio?: string;
          discovery_source?: string;
          push_notifications_enabled?: boolean;
          privacy_policy_accepted?: boolean;
          onboarding_completed?: boolean;
          status?: string;
          last_active?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          phone_number?: string;
          phone_verified?: boolean;
          school_id?: string;
          school_email?: string;
          school_email_verified?: boolean;
          first_name?: string;
          last_name?: string;
          date_of_birth?: string;
          gender?: 'woman' | 'man' | 'non_binary';
          looking_for?: 'go_to_someones_debs' | 'bring_someone_to_my_debs';
          relationship_intention?: 'one_night_thing' | 'short_term_only' | 'short_term_but_open_to_long_term' | 'long_term_only' | 'long_term_but_open_to_short_term' | 'Serious relationship' | 'Casual dating' | 'Friendship';
          bio?: string;
          discovery_source?: string;
          push_notifications_enabled?: boolean;
          privacy_policy_accepted?: boolean;
          onboarding_completed?: boolean;
          status?: string;
          last_active?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      schools: {
        Row: {
          id: string;
          name: string;
          county?: string;
          address?: string;
          phone?: string;
          website?: string;
          created_at?: string;
          updated_at?: string;
        };
        Insert: {
          id?: string;
          name: string;
          county?: string;
          address?: string;
          phone?: string;
          website?: string;
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
          created_at?: string;
          updated_at?: string;
        };
      };
      user_photos: {
        Row: {
          id: string;
          user_id: string;
          photo_url: string;
          photo_order: number;
          is_primary: boolean;
          created_at?: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          photo_url: string;
          photo_order: number;
          is_primary?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          photo_url?: string;
          photo_order?: number;
          is_primary?: boolean;
          created_at?: string;
        };
      };
      swipes: {
        Row: {
          id: string;
          swiper_id: string;
          swiped_user_id: string;
          swipe_direction: 'left' | 'right';
          created_at?: string;
        };
        Insert: {
          id?: string;
          swiper_id: string;
          swiped_user_id: string;
          swipe_direction: 'left' | 'right';
          created_at?: string;
        };
        Update: {
          id?: string;
          swiper_id?: string;
          swiped_user_id?: string;
          swipe_direction?: 'left' | 'right';
          created_at?: string;
        };
      };
      matches: {
        Row: {
          id: string;
          user1_id: string;
          user2_id: string;
          matched_at?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Insert: {
          id?: string;
          user1_id: string;
          user2_id: string;
          matched_at?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user1_id?: string;
          user2_id?: string;
          matched_at?: string;
          is_active?: boolean;
          created_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          match_id: string;
          sender_id: string;
          message_text: string;
          is_read?: boolean;
          created_at?: string;
        };
        Insert: {
          id?: string;
          match_id: string;
          sender_id: string;
          message_text: string;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          match_id?: string;
          sender_id?: string;
          message_text?: string;
          is_read?: boolean;
          created_at?: string;
        };
      };
      interests: {
        Row: {
          id: string;
          name: string;
          category?: string;
          icon_name?: string;
          created_at?: string;
        };
        Insert: {
          id?: string;
          name: string;
          category?: string;
          icon_name?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          category?: string;
          icon_name?: string;
          created_at?: string;
        };
      };
      user_interests: {
        Row: {
          id: string;
          user_id: string;
          interest_id: string;
          created_at?: string;
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
          category?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Insert: {
          id?: string;
          prompt_text: string;
          category?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          prompt_text?: string;
          category?: string;
          is_active?: boolean;
          created_at?: string;
        };
      };
      user_profile_prompts: {
        Row: {
          id: string;
          user_id: string;
          prompt_id: string;
          response: string;
          created_at?: string;
          updated_at?: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          prompt_id: string;
          response: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          prompt_id?: string;
          response?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

// Chat-related types
export interface ChatMessage {
  id: string;
  match_id: string;
  sender_id: string;
  message_text: string;
  is_read: boolean;
  created_at: string;
  sender_name?: string;
  sender_avatar?: string;
}

export interface ChatMatch {
  id: string;
  user1_id: string;
  user2_id: string;
  matched_at: string;
  is_active: boolean;
  created_at: string;
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
