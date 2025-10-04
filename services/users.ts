import { supabase } from '../lib/supabase';
import { Inserts, Updates } from '../lib/supabase';

export interface UserProfile {
  id: string;
  email: string;
  phone_number?: string;
  first_name: string;
  username: string;
  date_of_birth: string;
  gender: string;
  school_id?: string;
  looking_for: string;
  intentions: string;
  bio?: string;
  email_verified: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface UserPhoto {
  id: string;
  user_id: string;
  photo_url: string;
  photo_order: number;
  is_primary: boolean;
  created_at: string;
}

export interface UserInterest {
  id: string;
  user_id: string;
  interest_id: string;
  created_at: string;
}

export interface UserProfilePrompt {
  id: string;
  user_id: string;
  prompt_id: string;
  response: string;
  created_at: string;
}

export class UserService {
  // Get user profile by ID
  static async getUserProfile(userId: string): Promise<{ profile: UserProfile | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        return { profile: null, error: error.message };
      }

      return { profile: data, error: null };
    } catch (error) {
      return { profile: null, error: 'An unexpected error occurred' };
    }
  }

  // Update user profile
  static async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<{ profile: UserProfile | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        return { profile: null, error: error.message };
      }

      return { profile: data, error: null };
    } catch (error) {
      return { profile: null, error: 'An unexpected error occurred' };
    }
  }

  // Upload user photos
  static async uploadUserPhotos(userId: string, photos: { url: string; order: number; isPrimary: boolean }[]): Promise<{ photos: UserPhoto[] | null; error: string | null }> {
    try {
      const photoData = photos.map(photo => ({
        user_id: userId,
        photo_url: photo.url,
        photo_order: photo.order,
        is_primary: photo.isPrimary,
      }));

      const { data, error } = await supabase
        .from('user_photos')
        .insert(photoData)
        .select();

      if (error) {
        return { photos: null, error: error.message };
      }

      return { photos: data, error: null };
    } catch (error) {
      return { photos: null, error: 'An unexpected error occurred' };
    }
  }

  // Get user photos
  static async getUserPhotos(userId: string): Promise<{ photos: UserPhoto[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('user_photos')
        .select('*')
        .eq('user_id', userId)
        .order('photo_order', { ascending: true });

      if (error) {
        return { photos: null, error: error.message };
      }

      return { photos: data, error: null };
    } catch (error) {
      return { photos: null, error: 'An unexpected error occurred' };
    }
  }

  // Add user interests
  static async addUserInterests(userId: string, interestNames: string[]): Promise<{ interests: string[] | null; error: string | null }> {
    try {
      // Update the interests in the profiles table
      const { data, error } = await supabase
        .from('profiles')
        .update({
          interests: interestNames,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select('interests');

      if (error) {
        return { interests: null, error: error.message };
      }

      return { interests: data?.[0]?.interests || [], error: null };
    } catch (error) {
      return { interests: null, error: 'An unexpected error occurred' };
    }
  }

  // Get user interests
  static async getUserInterests(userId: string): Promise<{ interests: string[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('interests')
        .eq('id', userId)
        .single();

      if (error) {
        return { interests: null, error: error.message };
      }

      return { interests: data?.interests || [], error: null };
    } catch (error) {
      return { interests: null, error: 'An unexpected error occurred' };
    }
  }

  // Add user profile prompts
  static async addUserProfilePrompts(userId: string, prompts: { promptId: string; response: string }[]): Promise<{ prompts: UserProfilePrompt[] | null; error: string | null }> {
    try {
      const promptData = prompts.map(prompt => ({
        user_id: userId,
        prompt_id: prompt.promptId,
        response: prompt.response,
      }));

      const { data, error } = await supabase
        .from('user_profile_prompts')
        .insert(promptData)
        .select();

      if (error) {
        return { prompts: null, error: error.message };
      }

      return { prompts: data, error: null };
    } catch (error) {
      return { prompts: null, error: 'An unexpected error occurred' };
    }
  }

  // Get potential matches (users to swipe on)
  static async getPotentialMatches(userId: string, filters?: {
    gender?: string;
    school_id?: string;
    looking_for?: string;
    relationship_intention?: string;
    intentions?: string;
  }): Promise<{ users: any[] | null; error: string | null }> {
    try {
      let query = supabase
        .from('profiles')
        .select(`
          *,
          user_photos (*)
        `)
        .eq('status', 'active')
        .eq('email_verified', true)
        .neq('id', userId);

      // Apply filters
      if (filters?.gender) {
        query = query.eq('gender', filters.gender);
      }
      if (filters?.school_id) {
        query = query.eq('school_id', filters.school_id);
      }
      if (filters?.looking_for) {
        query = query.eq('looking_for', filters.looking_for);
      }
      if (filters?.intentions) {
        query = query.eq('intentions', filters.intentions);
      }

      const { data, error } = await query;

      if (error) {
        return { users: null, error: error.message };
      }

      return { users: data, error: null };
    } catch (error) {
      return { users: null, error: 'An unexpected error occurred' };
    }
  }

  // Get schools
  static async getSchools(): Promise<{ schools: any[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        return { schools: null, error: error.message };
      }

      return { schools: data, error: null };
    } catch (error) {
      return { schools: null, error: 'An unexpected error occurred' };
    }
  }

  // Get interests
  static async getInterests(): Promise<{ interests: any[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('interests')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        return { interests: null, error: error.message };
      }

      return { interests: data, error: null };
    } catch (error) {
      return { interests: null, error: 'An unexpected error occurred' };
    }
  }

  // Get profile prompts
  static async getProfilePrompts(): Promise<{ prompts: any[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('profile_prompts')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: true });

      if (error) {
        return { prompts: null, error: error.message };
      }

      return { prompts: data, error: null };
    } catch (error) {
      return { prompts: null, error: 'An unexpected error occurred' };
    }
  }
}
