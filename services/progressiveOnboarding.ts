import { supabase } from '../lib/supabase';

/**
 * Service for progressive onboarding - allows saving profile data incrementally
 * during the onboarding flow instead of all at once at the end
 */
export class ProgressiveOnboardingService {
  /**
   * Update the current user's profile with partial data
   * This can be called from any onboarding screen to save data immediately
   */
  static async updateProfile(data: Partial<{
    first_name: string;
    username: string;
    date_of_birth: string;
    gender: string;
    school_id: string;
    school_name: string;
    bio: string;
    match_preferences: any;
    looking_for_friends_or_dates: string;
    relationship_status: string;
    looking_for_debs: string;
    dating_intentions: string;
    blocked_schools: string[];
    interests: string[];
    profile_prompts: any;
    notifications_enabled: boolean;
    push_notifications_enabled: boolean;
    email_notifications_enabled: boolean;
    sms_notifications_enabled: boolean;
    onboarding_step: string;
  }>): Promise<{ success: boolean; error?: string }> {
    try {
      // Get current authenticated user
      const { data: { user }, error: getUserError } = await supabase.auth.getUser();

      if (getUserError || !user) {
        console.error('❌ No authenticated user found');
        return { success: false, error: 'Not authenticated' };
      }

      console.log('📝 Updating profile for user:', user.id, 'with data:', Object.keys(data));

      // Update the profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('❌ Error updating profile:', updateError);
        return { success: false, error: updateError.message };
      }

      console.log('✅ Profile updated successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Error in updateProfile:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Upload photos immediately during onboarding
   */
  static async uploadPhotos(photoUris: string[]): Promise<{ success: boolean; urls?: string[]; error?: string }> {
    try {
      // Get current authenticated user
      const { data: { user }, error: getUserError } = await supabase.auth.getUser();

      if (getUserError || !user) {
        return { success: false, error: 'Not authenticated' };
      }

      console.log('📸 Uploading', photoUris.length, 'photos for user:', user.id);

      // Import photo upload service
      const { PhotoUploadService } = await import('./photoUpload');

      // Upload photos
      const uploadResult = await PhotoUploadService.uploadUserPhotos(user.id, photoUris);

      if (!uploadResult.success) {
        console.error('❌ Photo upload failed:', uploadResult.errors);
        return { success: false, error: 'Failed to upload photos' };
      }

      console.log('✅ Photos uploaded successfully:', uploadResult.urls.length);
      return { success: true, urls: uploadResult.urls };
    } catch (error) {
      console.error('❌ Error in uploadPhotos:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Complete onboarding - set onboarding_completed to true
   * This should only be called on the final onboarding screen
   */
  static async completeOnboarding(): Promise<{ success: boolean; error?: string }> {
    try {
      // Get current authenticated user
      const { data: { user }, error: getUserError } = await supabase.auth.getUser();

      if (getUserError || !user) {
        return { success: false, error: 'Not authenticated' };
      }

      console.log('🎉 Completing onboarding for user:', user.id);

      // Set onboarding flags
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          onboarding_completed: true,
          profile_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('❌ Error completing onboarding:', updateError);
        return { success: false, error: updateError.message };
      }

      console.log('✅ Onboarding completed successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Error in completeOnboarding:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get or create school and return school_id
   */
  static async getOrCreateSchool(schoolName: string): Promise<{ success: boolean; schoolId?: string; error?: string }> {
    try {
      console.log('🏫 Getting or creating school:', schoolName);

      // Check if school exists
      const { data: existingSchool, error: schoolError } = await supabase
        .from('schools')
        .select('school_id')
        .eq('school_name', schoolName)
        .maybeSingle();

      if (existingSchool) {
        console.log('✅ Found existing school:', existingSchool.school_id);
        return { success: true, schoolId: existingSchool.school_id };
      }

      // Create new school
      const { data: newSchool, error: createError } = await supabase
        .from('schools')
        .insert({
          school_name: schoolName,
          county: 'Unknown',  // Can be updated later
          is_active: true,
        })
        .select('school_id')
        .single();

      if (createError) {
        console.error('❌ Error creating school:', createError);
        return { success: false, error: createError.message };
      }

      console.log('✅ Created new school:', newSchool.school_id);
      return { success: true, schoolId: newSchool.school_id };
    } catch (error) {
      console.error('❌ Error in getOrCreateSchool:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Reset onboarding - delete all profile data for the current user
   * This allows users to start fresh with the same email
   */
  static async resetOnboarding(): Promise<{ success: boolean; error?: string }> {
    try {
      // Get current authenticated user
      const { data: { user }, error: getUserError } = await supabase.auth.getUser();

      if (getUserError || !user) {
        console.error('❌ No authenticated user found');
        return { success: false, error: 'Not authenticated' };
      }

      console.log('🔄 Resetting onboarding for user:', user.id);

      // Get username for photo cleanup (photos are stored by username, not user_id)
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();

      // Clean up photos from storage buckets
      if (profile?.username) {
        console.log('🧹 Cleaning up photos for username:', profile.username);

        try {
          // Delete all photos from user-photos bucket
          const { data: photoFiles } = await supabase.storage
            .from('user-photos')
            .list(profile.username);

          if (photoFiles && photoFiles.length > 0) {
            const photoPaths = photoFiles.map(file => `${profile.username}/${file.name}`);
            await supabase.storage
              .from('user-photos')
              .remove(photoPaths);
            console.log(`✅ Deleted ${photoPaths.length} photos from user-photos`);
          }

          // Delete all PFPs from user-pfps bucket
          const { data: pfpFiles } = await supabase.storage
            .from('user-pfps')
            .list(profile.username);

          if (pfpFiles && pfpFiles.length > 0) {
            const pfpPaths = pfpFiles.map(file => `${profile.username}/${file.name}`);
            await supabase.storage
              .from('user-pfps')
              .remove(pfpPaths);
            console.log(`✅ Deleted ${pfpPaths.length} PFPs from user-pfps`);
          }
        } catch (storageError) {
          console.error('⚠️ Error cleaning up photos (continuing with profile deletion):', storageError);
          // Continue with profile deletion even if photo cleanup fails
        }
      }

      // Delete the profile row entirely - it will be recreated during onboarding
      const { error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (deleteError) {
        console.error('❌ Error deleting profile:', deleteError);
        return { success: false, error: deleteError.message };
      }

      console.log('✅ Profile and photos deleted successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Error in resetOnboarding:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}
