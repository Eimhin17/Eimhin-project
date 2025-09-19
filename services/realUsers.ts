import { supabase } from '../lib/supabase';

export interface RealUserProfile {
  id: string;
  first_name: string;
  username: string;
  date_of_birth: string;
  gender: 'woman' | 'man' | 'non_binary';
  looking_for_debs: 'go_to_someones_debs' | 'bring_someone_to_my_debs';
  dating_intentions: string;
  bio?: string;
  school_id?: string;
  school_name?: string;
  county?: string;
  status: string;
  onboarding_completed: boolean;
  created_at: string;
  // New schema fields
  looking_for_friends_or_dates?: string;
  relationship_status?: string;
  interests?: string[];
  photos?: string[];
  profile_prompts?: Record<string, string>;
  blocked_schools?: string[];
}

export class RealUserService {
  /**
   * Get all active real user profiles for swiping
   */
  static async getActiveUserProfiles(excludeUserId?: string): Promise<{ 
    success: boolean; 
    profiles?: RealUserProfile[]; 
    error?: string 
  }> {
    try {
      let query = supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          username,
          date_of_birth,
          gender,
          looking_for_debs,
          dating_intentions,
          bio,
          school_id,
          school_name,
          county,
          status,
          onboarding_completed,
          updated_at,
          looking_for_friends_or_dates,
          relationship_status,
          interests,
          profile_prompts,
          blocked_schools
        `)
        .eq('status', 'active')
        .eq('onboarding_completed', true);

      // Exclude current user if provided
      if (excludeUserId) {
        query = query.neq('id', excludeUserId);
      }

      const { data: profiles, error } = await query;

      if (error) {
        console.error('Error fetching real user profiles:', error);
        return { success: false, error: 'Failed to fetch user profiles' };
      }

      // Transform the data to match our interface
      const transformedProfiles: RealUserProfile[] = profiles?.map(profile => ({
        id: profile.id,
        first_name: profile.first_name,
        username: profile.username,
        date_of_birth: profile.date_of_birth,
        gender: profile.gender,
        looking_for_debs: profile.looking_for_debs,
        dating_intentions: profile.dating_intentions,
        bio: profile.bio,
        school_id: profile.school_id,
        school_name: profile.school_name,
        county: profile.county,
        status: profile.status,
        onboarding_completed: profile.onboarding_completed,
        created_at: profile.updated_at,
        looking_for_friends_or_dates: profile.looking_for_friends_or_dates,
        relationship_status: profile.relationship_status,
        interests: profile.interests || [],
        photos: [], // Photos now fetched from storage bucket
        profile_prompts: profile.profile_prompts || {},
      })) || [];

      console.log(`✅ Fetched ${transformedProfiles.length} real user profiles`);
      return { success: true, profiles: transformedProfiles };
    } catch (error) {
      console.error('Error in getActiveUserProfiles:', error);
      return { success: false, error: 'Failed to fetch user profiles' };
    }
  }

  /**
   * Get real user profiles for swiping (excluding already swiped ones)
   */
  static async getUserProfilesForSwiping(
    userId: string, 
    excludeSwipedIds: string[] = []
  ): Promise<{ 
    success: boolean; 
    profiles?: RealUserProfile[]; 
    error?: string 
  }> {
    try {
      let query = supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          username,
          date_of_birth,
          gender,
          looking_for_debs,
          dating_intentions,
          bio,
          school_id,
          school_name,
          county,
          status,
          onboarding_completed,
          updated_at,
          looking_for_friends_or_dates,
          relationship_status,
          interests,
          profile_prompts,
          blocked_schools
        `)
        .eq('status', 'active')
        .eq('onboarding_completed', true)
        .neq('id', userId);

      // Exclude already swiped profiles
      if (excludeSwipedIds.length > 0) {
        query = query.not('id', 'in', `(${excludeSwipedIds.join(',')})`);
      }

      const { data: profiles, error } = await query;

      if (error) {
        console.error('Error fetching user profiles for swiping:', error);
        return { success: false, error: 'Failed to fetch user profiles' };
      }

      // Transform the data
      const transformedProfiles: RealUserProfile[] = profiles?.map(profile => ({
        id: profile.id,
        first_name: profile.first_name,
        username: profile.username,
        date_of_birth: profile.date_of_birth,
        gender: profile.gender,
        looking_for_debs: profile.looking_for_debs,
        dating_intentions: profile.dating_intentions,
        bio: profile.bio,
        school_id: profile.school_id,
        school_name: profile.school_name,
        county: profile.county,
        status: profile.status,
        onboarding_completed: profile.onboarding_completed,
        created_at: profile.updated_at,
        looking_for_friends_or_dates: profile.looking_for_friends_or_dates,
        relationship_status: profile.relationship_status,
        interests: profile.interests || [],
        photos: [], // Photos now fetched from storage bucket
        profile_prompts: profile.profile_prompts || {},
      })) || [];

      console.log(`✅ Fetched ${transformedProfiles.length} user profiles for swiping`);
      return { success: true, profiles: transformedProfiles };
    } catch (error) {
      console.error('Error in getUserProfilesForSwiping:', error);
      return { success: false, error: 'Failed to fetch user profiles for swiping' };
    }
  }

  /**
   * Get a single real user profile by ID
   */
  static async getUserProfileById(userId: string): Promise<{ 
    success: boolean; 
    profile?: RealUserProfile; 
    error?: string 
  }> {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          username,
          date_of_birth,
          gender,
          looking_for_debs,
          dating_intentions,
          bio,
          school_id,
          school_name,
          county,
          status,
          onboarding_completed,
          updated_at,
          looking_for_friends_or_dates,
          relationship_status,
          interests,
          profile_prompts,
          blocked_schools
        `)
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return { success: false, error: 'Failed to fetch user profile' };
      }

      const transformedProfile: RealUserProfile = {
        id: profile.id,
        first_name: profile.first_name,
        username: profile.username,
        date_of_birth: profile.date_of_birth,
        gender: profile.gender,
        looking_for_debs: profile.looking_for_debs,
        dating_intentions: profile.dating_intentions,
        bio: profile.bio,
        school_id: profile.school_id,
        school_name: profile.school_name,
        county: profile.county,
        status: profile.status,
        onboarding_completed: profile.onboarding_completed,
        created_at: profile.updated_at,
        looking_for_friends_or_dates: profile.looking_for_friends_or_dates,
        relationship_status: profile.relationship_status,
        interests: profile.interests || [],
        photos: [], // Photos now fetched from storage bucket
        profile_prompts: profile.profile_prompts || {},
      };

      return { success: true, profile: transformedProfile };
    } catch (error) {
      console.error('Error in getUserProfileById:', error);
      return { success: false, error: 'Failed to fetch user profile' };
    }
  }

  /**
   * Get user photos for a real user from storage bucket
   */
  static async getUserPhotos(userId: string): Promise<{ 
    success: boolean; 
    photos?: string[]; 
    error?: string 
  }> {
    try {
      // Get username first
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', userId)
        .single();

      if (profileError || !profile?.username) {
        console.error('Error fetching username for photos:', profileError);
        return { success: false, error: 'Failed to fetch username' };
      }

      // List photos from storage bucket
      const { data: files, error } = await supabase.storage
        .from('user-photos')
        .list(profile.username, {
          limit: 100,
          sortBy: { column: 'created_at', order: 'asc' }
        });

      if (error) {
        console.error('Error listing photos from storage:', error);
        return { success: false, error: 'Failed to fetch photos from storage' };
      }

      if (!files || files.length === 0) {
        return { success: true, photos: [] };
      }

      // Filter for image files and create signed URLs
      const photoFiles = files.filter(file => 
        file.name.toLowerCase().endsWith('.jpg') || 
        file.name.toLowerCase().endsWith('.jpeg') ||
        file.name.toLowerCase().endsWith('.png')
      );

      const photoUrls = await Promise.all(
        photoFiles.map(async (file) => {
          const { data: signedUrlData, error: signedUrlError } = await supabase.storage
            .from('user-photos')
            .createSignedUrl(`${profile.username}/${file.name}`, 3600);

          if (signedUrlError) {
            console.error('Error creating signed URL for photo:', file.name, signedUrlError);
            return null;
          }

          return signedUrlData.signedUrl;
        })
      );

      const validUrls = photoUrls.filter(url => url !== null) as string[];
      return { success: true, photos: validUrls };
    } catch (error) {
      console.error('Error in getUserPhotos:', error);
      return { success: false, error: 'Failed to fetch user photos' };
    }
  }

  /**
   * Get user interests for a real user
   */
  static async getUserInterests(userId: string): Promise<{ 
    success: boolean; 
    interests?: string[]; 
    error?: string 
  }> {
    try {
      const { data: userInterests, error } = await supabase
        .from('user_interests')
        .select(`
          interests!inner(name)
        `)
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching user interests:', error);
        return { success: false, error: 'Failed to fetch user interests' };
      }

      const interestNames = userInterests?.map(ui => ui.interests?.[0]?.name) || [];
      return { success: true, interests: interestNames };
    } catch (error) {
      console.error('Error in getUserInterests:', error);
      return { success: false, error: 'Failed to fetch user interests' };
    }
  }
}
