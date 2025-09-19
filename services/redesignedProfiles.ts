// =====================================================
// REDESIGNED PROFILES SERVICE
// Optimized for easy data retrieval from single table
// =====================================================

import { supabase } from '../lib/supabase';

export interface RedesignedProfile {
  // Primary Key
  id: string;
  
  // 1. School Information
  school_id?: string;
  school_name?: string;
  
  // 2. Contact Information  
  email: string;
  
  // 3. Notification Preferences
  notifications_enabled: boolean;
  
  // 4. Basic Personal Information
  first_name: string;
  last_name: string;
  date_of_birth: string;
  age: number;
  gender: 'woman' | 'man' | 'non_binary';
  
  // 5. Profile Content
  bio?: string;
  
  // 6. Legal Compliance
  agreed_to_terms_and_conditions: boolean;
  
  // 7. Match Preferences
  match_preferences: Record<string, any>;
  
  // 8. Relationship Preferences
  looking_for_friends_or_dates: string;
  relationship_status: string;
  looking_for_debs: 'go_to_someones_debs' | 'bring_someone_to_my_debs';
  dating_intentions: string;
  
  // 9. Interests and Content
  interests: string[];
  photos: string[];
  profile_prompts: Record<string, string>;
  
  // 10. Activity Tracking
  last_active_at: string;
  account_created_at: string;
  
  // 11. System Fields
  status: 'active' | 'suspended' | 'banned' | 'deleted';
  onboarding_completed: boolean;
  profile_completed: boolean;
  updated_at: string;
}

export class RedesignedProfileService {
  /**
   * Get all active profiles for swiping
   */
  static async getAllActiveProfiles(excludeUserId?: string): Promise<{
    success: boolean;
    profiles?: RedesignedProfile[];
    error?: string;
  }> {
    try {
      let query = supabase
        .from('profiles_new')
        .select('*')
        .eq('status', 'active')
        .eq('onboarding_completed', true);

      if (excludeUserId) {
        query = query.neq('id', excludeUserId);
      }

      const { data: profiles, error } = await query;

      if (error) {
        console.error('Error fetching redesigned profiles:', error);
        return { success: false, error: 'Failed to fetch profiles' };
      }

      console.log(`✅ Fetched ${profiles?.length || 0} redesigned profiles`);
      return { success: true, profiles: profiles || [] };
    } catch (error) {
      console.error('Error in getAllActiveProfiles:', error);
      return { success: false, error: 'Failed to fetch profiles' };
    }
  }

  /**
   * Get a single profile by ID
   */
  static async getProfileById(userId: string): Promise<{
    success: boolean;
    profile?: RedesignedProfile;
    error?: string;
  }> {
    try {
      const { data: profile, error } = await supabase
        .from('profiles_new')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile by ID:', error);
        return { success: false, error: 'Failed to fetch profile' };
      }

      return { success: true, profile };
    } catch (error) {
      console.error('Error in getProfileById:', error);
      return { success: false, error: 'Failed to fetch profile' };
    }
  }

  /**
   * Update a profile
   */
  static async updateProfile(userId: string, updates: Partial<RedesignedProfile>): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { error } = await supabase
        .from('profiles_new')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('Error updating profile:', error);
        return { success: false, error: 'Failed to update profile' };
      }

      console.log(`✅ Updated profile ${userId}`);
      return { success: true };
    } catch (error) {
      console.error('Error in updateProfile:', error);
      return { success: false, error: 'Failed to update profile' };
    }
  }

  /**
   * Calculate age from date of birth
   */
  static calculateAge(dateOfBirth: string): number {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Create a new profile
   */
  static async createProfile(profileData: Omit<RedesignedProfile, 'id' | 'account_created_at' | 'updated_at' | 'age'> & { date_of_birth: string }): Promise<{
    success: boolean;
    profile?: RedesignedProfile;
    error?: string;
  }> {
    try {
      // Calculate age
      const age = this.calculateAge(profileData.date_of_birth);
      
      const { data: profile, error } = await supabase
        .from('profiles_new')
        .insert({
          ...profileData,
          age,
          account_created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        return { success: false, error: 'Failed to create profile' };
      }

      console.log(`✅ Created profile ${profile.id}`);
      return { success: true, profile };
    } catch (error) {
      console.error('Error in createProfile:', error);
      return { success: false, error: 'Failed to create profile' };
    }
  }

  /**
   * Get profiles with specific filters
   */
  static async getFilteredProfiles(filters: {
    gender?: string[];
    looking_for_debs?: string[];
    dating_intentions?: string[];
    min_age?: number;
    max_age?: number;
    school_ids?: string[];
    exclude_ids?: string[];
  }): Promise<{
    success: boolean;
    profiles?: RedesignedProfile[];
    error?: string;
  }> {
    try {
      let query = supabase
        .from('profiles_new')
        .select('*')
        .eq('status', 'active')
        .eq('onboarding_completed', true);

      // Apply filters
      if (filters.gender && filters.gender.length > 0) {
        query = query.in('gender', filters.gender);
      }

      if (filters.looking_for_debs && filters.looking_for_debs.length > 0) {
        query = query.in('looking_for_debs', filters.looking_for_debs);
      }

      if (filters.dating_intentions && filters.dating_intentions.length > 0) {
        query = query.in('dating_intentions', filters.dating_intentions);
      }

      if (filters.min_age) {
        query = query.gte('age', filters.min_age);
      }

      if (filters.max_age) {
        query = query.lte('age', filters.max_age);
      }

      if (filters.school_ids && filters.school_ids.length > 0) {
        query = query.in('school_id', filters.school_ids);
      }

      if (filters.exclude_ids && filters.exclude_ids.length > 0) {
        query = query.not('id', 'in', `(${filters.exclude_ids.join(',')})`);
      }

      const { data: profiles, error } = await query;

      if (error) {
        console.error('Error fetching filtered profiles:', error);
        return { success: false, error: 'Failed to fetch profiles' };
      }

      console.log(`✅ Fetched ${profiles?.length || 0} filtered profiles`);
      return { success: true, profiles: profiles || [] };
    } catch (error) {
      console.error('Error in getFilteredProfiles:', error);
      return { success: false, error: 'Failed to fetch profiles' };
    }
  }
}
