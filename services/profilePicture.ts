import { supabase } from '../lib/supabase';
import { dataCache, CACHE_NAMESPACES, CACHE_TTL } from './dataCache';

export interface ProfilePicture {
  id: string;
  user_id: string;
  pfp_url: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePFPResult {
  success: boolean;
  pfp?: ProfilePicture;
  error?: string;
}

/**
 * Service for managing circular profile pictures (PFPs)
 * Uploads PFPs to user-pfps storage bucket organized by username
 * Includes intelligent caching to minimize storage API calls
 */
export class ProfilePictureService {
  /**
   * Upload a PFP to the user-pfps storage bucket
   * @param userId - The user's ID
   * @param imageUri - The local file URI of the image to upload
   * @returns Promise with the result of PFP upload
   */
  static async uploadPFP(userId: string, imageUri: string): Promise<CreatePFPResult> {
    try {
      console.log('🔄 Uploading PFP for user:', userId);
      console.log('📸 Image URI:', imageUri);

      // Get user's username for folder structure
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', userId)
        .single();

      if (profileError || !profile?.username) {
        console.error('❌ Error fetching username:', profileError);
        return {
          success: false,
          error: 'Failed to fetch username'
        };
      }

      // Convert image to uploadable format
      console.log('🔄 Converting image to uploadable format...');
      const imageData = await this.convertImageToUploadable(imageUri);
      if (!imageData) {
        console.error('❌ Image conversion failed');
        return {
          success: false,
          error: 'Failed to process image'
        };
      }

      console.log('📊 Image data size:', imageData.length, 'bytes');
      if (imageData.length < 1000) {
        console.warn('⚠️ Image data is very small, might be corrupted');
        return {
          success: false,
          error: 'Image data is too small, likely corrupted'
        };
      }

      // Generate filename with timestamp
      const timestamp = Date.now();
      const fileName = `${profile.username}/pfp-${timestamp}.jpg`;

      console.log('📁 Uploading to:', fileName);

      // Upload to user-pfps bucket
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('user-pfps')
        .upload(fileName, imageData, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (uploadError) {
        console.error('❌ Error uploading PFP:', uploadError);
        return {
          success: false,
          error: 'Failed to upload PFP to storage'
        };
      }

      // Get the signed URL for private access
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('user-pfps')
        .createSignedUrl(fileName, 86400); // 24 hour expiry

      if (signedUrlError) {
        console.error('❌ Failed to create signed URL for PFP:', signedUrlError);
        return {
          success: false,
          error: 'Failed to create signed URL for PFP'
        };
      }

      const pfpUrl = signedUrlData.signedUrl;
      console.log('✅ PFP uploaded successfully:', pfpUrl);

      // Save to database
      return await this.savePFPToDatabase(userId, pfpUrl);

    } catch (error) {
      console.error('❌ Error in uploadPFP:', error);
      return {
        success: false,
        error: 'An unexpected error occurred while uploading PFP'
      };
    }
  }

  /**
   * Convert image URI to uploadable format
   * @param imageUri - The image URI to convert
   * @returns Promise with the uploadable data or null
   */
  private static async convertImageToUploadable(imageUri: string): Promise<Uint8Array | null> {
    try {
      console.log('🔄 Converting image URI:', imageUri);

      if (imageUri.startsWith('data:')) {
        // Handle base64 data URLs with memory checks
        console.log('📸 Processing base64 data URL');
        const base64Data = imageUri.split(',')[1];

        // Check size before converting to prevent memory issues
        const estimatedSize = (base64Data.length * 3) / 4; // Base64 to byte ratio
        if (estimatedSize > 5 * 1024 * 1024) { // 5MB limit for iOS stability
          console.error('❌ Image too large for processing:', estimatedSize);
          return null;
        }

        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        console.log('✅ Base64 conversion complete, size:', bytes.length);
        return bytes;
      } else if (imageUri.startsWith('file://')) {
        // Handle local file URIs with timeout
        console.log('📸 Processing local file URI');
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

        try {
          const response = await fetch(imageUri, { signal: controller.signal });
          clearTimeout(timeout);

          if (!response.ok) {
            throw new Error(`Failed to fetch file: ${response.status}`);
          }

          const contentLength = response.headers.get('content-length');
          if (contentLength && parseInt(contentLength) > 5 * 1024 * 1024) { // 5MB limit for iOS stability
            console.error('❌ Image too large:', contentLength);
            return null;
          }

          const arrayBuffer = await response.arrayBuffer();
          const bytes = new Uint8Array(arrayBuffer);
          console.log('✅ File URI conversion complete, size:', bytes.length);
          return bytes;
        } catch (fetchError) {
          clearTimeout(timeout);
          throw fetchError;
        }
      } else {
        // Handle web URLs with timeout and size checks
        console.log('📸 Processing web URL');
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

        try {
          const response = await fetch(imageUri, { signal: controller.signal });
          clearTimeout(timeout);

          if (!response.ok) {
            throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
          }

          const contentLength = response.headers.get('content-length');
          if (contentLength && parseInt(contentLength) > 5 * 1024 * 1024) { // 5MB limit for iOS stability
            console.error('❌ Image too large:', contentLength);
            return null;
          }

          const arrayBuffer = await response.arrayBuffer();
          const bytes = new Uint8Array(arrayBuffer);
          console.log('✅ Web URL conversion complete, size:', bytes.length);
          return bytes;
        } catch (fetchError) {
          clearTimeout(timeout);
          throw fetchError;
        }
      }
    } catch (error) {
      console.error('❌ Error converting image:', error);
      console.error('❌ Image URI was:', imageUri);
      return null;
    }
  }

  /**
   * Save PFP URL to database
   * @param userId - The user's ID
   * @param pfpUrl - The PFP URL to save
   * @returns Promise with the result of saving
   */
  private static async savePFPToDatabase(userId: string, pfpUrl: string): Promise<CreatePFPResult> {
    try {
      // Check if user profile exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('id', userId)
        .single();

      if (checkError) {
        console.error('❌ Error checking existing profile:', checkError);
        return {
          success: false,
          error: 'Failed to check existing profile'
        };
      }

      // Delete any old PFP files from storage
      if (existingProfile?.username) {
        const { data: existingFiles, error: listError } = await supabase.storage
          .from('user-pfps')
          .list(existingProfile.username);

        if (!listError && existingFiles && existingFiles.length > 0) {
          // Delete old PFP files (keeping only the newest one that was just uploaded)
          const oldFiles = existingFiles.slice(0, -1); // Keep the last file (newest)
          if (oldFiles.length > 0) {
            const filesToDelete = oldFiles.map(file => `${existingProfile.username}/${file.name}`);
            await supabase.storage
              .from('user-pfps')
              .remove(filesToDelete);
          }
        }
      }

      // Update profile timestamp to indicate PFP was updated
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select('id, updated_at');

      if (updateError) {
        console.error('❌ Error updating profile timestamp:', updateError);
        return {
          success: false,
          error: 'Failed to update profile timestamp'
        };
      }

      if (!updatedProfile || updatedProfile.length === 0) {
        return {
          success: false,
          error: 'No profile updated'
        };
      }

      // Create a ProfilePicture-like object
      const pfp: ProfilePicture = {
        id: updatedProfile[0].id,
        user_id: userId,
        pfp_url: pfpUrl,
        created_at: updatedProfile[0].updated_at,
        updated_at: updatedProfile[0].updated_at
      };

      console.log('✅ Profile PFP updated successfully');

      // Invalidate cache so next fetch gets the new PFP
      this.invalidateCache(userId);

      return {
        success: true,
        pfp
      };

    } catch (error) {
      console.error('❌ Error in savePFPToDatabase:', error);
      return {
        success: false,
        error: 'An unexpected error occurred while saving PFP'
      };
    }
  }

  /**
   * Delete PFP from storage bucket
   * @param pfpUrl - The PFP URL to delete
   * @returns Promise with the result of deletion
   */
  private static async deletePFPFromStorage(pfpUrl: string): Promise<boolean> {
    try {
      // Extract filename from URL
      const urlParts = pfpUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const username = urlParts[urlParts.length - 2];
      const fullPath = `${username}/${fileName}`;

      const { error } = await supabase.storage
        .from('user-pfps')
        .remove([fullPath]);

      if (error) {
        console.error('❌ Error deleting PFP from storage:', error);
        return false;
      }

      console.log('✅ PFP deleted from storage:', fullPath);
      return true;
    } catch (error) {
      console.error('❌ Error in deletePFPFromStorage:', error);
      return false;
    }
  }

  /**
   * Create a circular profile picture from a user's main photo
   * @param userId - The user's ID
   * @param originalPhotoUrl - The URL of the original photo to convert
   * @returns Promise with the result of PFP creation
   */
  static async createPFP(userId: string, originalPhotoUrl: string): Promise<CreatePFPResult> {
    try {
      console.log('🔄 Creating PFP for user:', userId);
      console.log('📸 Original photo URL:', originalPhotoUrl);

      // Upload the photo to the user-pfps bucket
      return await this.uploadPFP(userId, originalPhotoUrl);

    } catch (error) {
      console.error('❌ Error in createPFP:', error);
      return {
        success: false,
        error: 'An unexpected error occurred while creating PFP'
      };
    }
  }

  /**
   * Get a user's profile picture
   * @param userId - The user's ID
   * @returns Promise with the PFP URL or null
   */
  static async getPFP(userId: string): Promise<string | null> {
    try {
      // Check cache first
      const cachedUrl = dataCache.get<string>(CACHE_NAMESPACES.PROFILE_PICTURES, userId);
      if (cachedUrl) {
        return cachedUrl;
      }

      // Get user's username to construct storage path
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No profile found - cache the null result briefly to avoid repeated lookups
          dataCache.set(CACHE_NAMESPACES.PROFILE_PICTURES, userId, null as any, 60000); // 1 minute
          return null;
        }
        console.error('❌ Error fetching username:', error);
        return null;
      }

      if (!profile?.username) {
        dataCache.set(CACHE_NAMESPACES.PROFILE_PICTURES, userId, null as any, 60000);
        return null;
      }

      // List files in the user's PFP folder
      const { data: files, error: listError } = await supabase.storage
        .from('user-pfps')
        .list(profile.username, {
          limit: 1,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (listError) {
        console.error('❌ Error listing PFP files:', listError);
        return null;
      }

      if (!files || files.length === 0) {
        // No PFP found - cache the null result
        dataCache.set(CACHE_NAMESPACES.PROFILE_PICTURES, userId, null as any, 60000);
        return null;
      }

      // Get the most recent PFP file
      const latestPFP = files[0];
      const filePath = `${profile.username}/${latestPFP.name}`;

      // Create signed URL for the PFP with longer expiry
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('user-pfps')
        .createSignedUrl(filePath, 86400); // 24 hour expiry

      if (signedUrlError) {
        console.error('❌ Error creating signed URL for PFP:', signedUrlError);
        return null;
      }

      const url = signedUrlData.signedUrl;

      // Cache the URL for 20 minutes (well before 24 hour expiry)
      dataCache.set(CACHE_NAMESPACES.PROFILE_PICTURES, userId, url, CACHE_TTL.PROFILE_PICTURE);

      return url;

    } catch (error) {
      console.error('❌ Error in getPFP:', error);
      return null;
    }
  }

  /**
   * Batch get multiple profile pictures efficiently
   * @param userIds - Array of user IDs
   * @returns Promise with map of userId to PFP URL
   */
  static async batchGetPFPs(userIds: string[]): Promise<Map<string, string | null>> {
    const results = new Map<string, string | null>();
    const uncachedIds: string[] = [];

    // Check cache for each user
    for (const userId of userIds) {
      const cached = dataCache.get<string>(CACHE_NAMESPACES.PROFILE_PICTURES, userId);
      if (cached !== null) {
        results.set(userId, cached);
      } else {
        uncachedIds.push(userId);
      }
    }

    // Fetch uncached profiles
    if (uncachedIds.length > 0) {
      await Promise.all(
        uncachedIds.map(async (userId) => {
          const url = await this.getPFP(userId);
          results.set(userId, url);
        })
      );
    }

    return results;
  }

  /**
   * Invalidate cached PFP for a user (call after uploading new PFP)
   * @param userId - The user's ID
   */
  static invalidateCache(userId: string): void {
    dataCache.delete(CACHE_NAMESPACES.PROFILE_PICTURES, userId);
  }

  /**
   * Get a user's profile picture with full details
   * @param userId - The user's ID
   * @returns Promise with the full PFP object or null
   */
  static async getPFPDetails(userId: string): Promise<ProfilePicture | null> {
    try {
      // Get the PFP URL using the updated getPFP method
      const pfpUrl = await this.getPFP(userId);

      if (!pfpUrl) {
        return null;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, updated_at')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ Error fetching profile details:', error);
        return null;
      }

      // Create a ProfilePicture-like object
      return {
        id: profile.id,
        user_id: userId,
        pfp_url: pfpUrl,
        created_at: profile.updated_at || new Date().toISOString(),
        updated_at: profile.updated_at || new Date().toISOString()
      } as ProfilePicture;

    } catch (error) {
      console.error('❌ Error in getPFPDetails:', error);
      return null;
    }
  }

  /**
   * Delete a user's profile picture
   * @param userId - The user's ID
   * @returns Promise with the result of deletion
   */
  static async deletePFP(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get user's username
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', userId)
        .single();

      if (profileError || !profile?.username) {
        console.error('❌ Error fetching username:', profileError);
        return {
          success: false,
          error: 'Failed to fetch username'
        };
      }

      // Delete all PFP files from storage
      const { data: files, error: listError } = await supabase.storage
        .from('user-pfps')
        .list(profile.username);

      if (!listError && files && files.length > 0) {
        const filesToDelete = files.map(file => `${profile.username}/${file.name}`);
        const { error: deleteError } = await supabase.storage
          .from('user-pfps')
          .remove(filesToDelete);

        if (deleteError) {
          console.error('❌ Error deleting PFP files from storage:', deleteError);
          return {
            success: false,
            error: 'Failed to delete PFP files'
          };
        }
      }

      console.log('✅ PFP deleted successfully');
      return { success: true };

    } catch (error) {
      console.error('❌ Error in deletePFP:', error);
      return {
        success: false,
        error: 'An unexpected error occurred while deleting PFP'
      };
    }
  }

  /**
   * List photos from user-photos storage bucket for a user
   * @param username - The user's username
   * @returns Promise with array of photo URLs
   */
  private static async listUserPhotosFromStorage(username: string): Promise<string[]> {
    try {
      console.log('📸 Listing photos from storage for username:', username);

      const { data: files, error } = await supabase.storage
        .from('user-photos')
        .list(username, {
          limit: 100,
          sortBy: { column: 'created_at', order: 'asc' }
        });

      if (error) {
        console.error('❌ Error listing photos from storage:', error);
        return [];
      }

      if (!files || files.length === 0) {
        console.log('⚠️ No photos found in storage for username:', username);
        return [];
      }

      // Filter for image files and create signed URLs
      const photoFiles = files.filter(file => 
        file.name.toLowerCase().endsWith('.jpg') || 
        file.name.toLowerCase().endsWith('.jpeg') ||
        file.name.toLowerCase().endsWith('.png')
      );

      console.log(`📸 Found ${photoFiles.length} photo files in storage`);

      // Create signed URLs for each photo
      const photoUrls = await Promise.all(
        photoFiles.map(async (file) => {
          const { data: signedUrlData, error: signedUrlError } = await supabase.storage
            .from('user-photos')
            .createSignedUrl(`${username}/${file.name}`, 3600);

          if (signedUrlError) {
            console.error('❌ Error creating signed URL for photo:', file.name, signedUrlError);
            return null;
          }

          return signedUrlData.signedUrl;
        })
      );

      // Filter out null values and return valid URLs
      const validUrls = photoUrls.filter(url => url !== null) as string[];
      console.log(`✅ Generated ${validUrls.length} signed URLs for photos`);
      
      return validUrls;

    } catch (error) {
      console.error('❌ Error in listUserPhotosFromStorage:', error);
      return [];
    }
  }

  /**
   * Create PFP for a user from their main photo
   * This is the main method to call during account creation
   * @param userId - The user's ID
   * @returns Promise with the result of PFP creation
   */
  static async createPFPFromMainPhoto(userId: string): Promise<CreatePFPResult> {
    try {
      console.log('🔄 Creating PFP from main photo for user:', userId);

      // Get user's username first
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', userId)
        .single();

      if (profileError || !profile?.username) {
        console.error('❌ Error fetching username:', profileError);
        return {
          success: false,
          error: 'Failed to fetch username'
        };
      }

      // Get user's photos from storage bucket
      const photoUrls = await this.listUserPhotosFromStorage(profile.username);

      if (photoUrls.length === 0) {
        console.log('⚠️ No photos found for user in storage, skipping PFP creation');
        return {
          success: false,
          error: 'No photos found for user'
        };
      }

      // Use the first photo as the main photo (they're ordered by creation time)
      const mainPhotoUrl = photoUrls[0];
      console.log('📸 Using main photo from storage:', mainPhotoUrl);

      // Create the PFP using the storage URL
      return await this.createPFP(userId, mainPhotoUrl);

    } catch (error) {
      console.error('❌ Error in createPFPFromMainPhoto:', error);
      return {
        success: false,
        error: 'An unexpected error occurred while creating PFP from main photo'
      };
    }
  }
}
