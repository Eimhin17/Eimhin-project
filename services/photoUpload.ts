import { supabase } from '../lib/supabase';

export interface PhotoUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export class PhotoUploadService {
  /**
   * Upload a single photo to the user-photos storage bucket
   */
  static async uploadPhoto(
    userId: string, 
    username: string,
    photoUri: string, 
    photoIndex: number
  ): Promise<PhotoUploadResult> {
    try {
      console.log(`📸 Uploading photo ${photoIndex} for user: ${username} (${userId})`);

      // Read the image file as ArrayBuffer (React Native compatible)
      console.log(`📸 Fetching photo URI: ${photoUri}`);
      const response = await fetch(photoUri);
      const arrayBuffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      console.log(`📸 Photo data size: ${uint8Array.length} bytes`);
      
      // Create filename with username folder and timestamp
      const timestamp = Date.now();
      const fileName = `${username}/${photoIndex}-${timestamp}.jpg`;
      
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('user-photos')
        .upload(fileName, uint8Array, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (uploadError) {
        console.error('❌ Photo upload failed:', uploadError);
        return { success: false, error: uploadError.message };
      }

      // Get signed URL for private access
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('user-photos')
        .createSignedUrl(fileName, 86400); // 24 hour expiry for faster subsequent loads

      if (signedUrlError) {
        console.error('❌ Failed to create signed URL:', signedUrlError);
        return { success: false, error: signedUrlError.message };
      }

      console.log(`✅ Photo ${photoIndex} uploaded successfully: ${signedUrlData.signedUrl}`);
      return { success: true, url: signedUrlData.signedUrl };

    } catch (error) {
      console.error(`❌ Error uploading photo ${photoIndex}:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Upload multiple photos for a user
   */
  static async uploadUserPhotos(
    userId: string, 
    photoUris: string[]
  ): Promise<{ success: boolean; urls: string[]; errors: string[] }> {
    try {
      console.log(`📸 Uploading ${photoUris.length} photos for user: ${userId}`);

      // Get username from database
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', userId)
        .single();

      if (profileError || !profile?.username) {
        console.error('❌ Failed to get username for user:', profileError);
        console.error('❌ Profile data:', profile);
        console.error('❌ This will cause photos to be uploaded to user ID folder instead of username folder');
        return {
          success: false,
          urls: [],
          errors: ['Failed to get username for photo upload']
        };
      }

      const username = profile.username;
      console.log(`📸 Using username folder: ${username}`);

      // Determine existing indices in storage to avoid overwriting by index
      const { data: existingFiles, error: listError } = await supabase.storage
        .from('user-photos')
        .list(username, { limit: 100, sortBy: { column: 'created_at', order: 'asc' } });

      if (listError) {
        console.warn('⚠️ Could not list existing photos to compute next indices:', listError);
      }

      const usedIndices = new Set<number>();
      (existingFiles || []).forEach((file) => {
        const idx = parseInt(file.name.split('-')[0], 10);
        if (!isNaN(idx)) usedIndices.add(idx);
      });

      const nextAvailableIndex = () => {
        let i = 0;
        while (usedIndices.has(i)) i += 1;
        usedIndices.add(i);
        return i;
      };

      // Upload each new photo to a free index slot to preserve all existing photos
      const results = await Promise.all(
        photoUris.map(async (uri) => {
          const assignedIndex = nextAvailableIndex();
          console.log(`📸 Assigning new photo to index ${assignedIndex}`);
          const result = await this.uploadPhoto(userId, username, uri, assignedIndex);
          return { index: assignedIndex, result };
        })
      );

      const successfulUploads = results.filter(r => r.result.success);
      const failedUploads = results.filter(r => !r.result.success);

      const urls = successfulUploads.map(r => r.result.url!);
      const errors = failedUploads.map(r => `Photo ${r.index + 1}: ${r.result.error}`);

      console.log(`✅ Upload complete: ${successfulUploads.length}/${photoUris.length} photos uploaded`);

      return {
        success: successfulUploads.length > 0,
        urls,
        errors
      };

    } catch (error) {
      console.error('❌ Error uploading user photos:', error);
      return {
        success: false,
        urls: [],
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Delete a photo from storage
   */
  static async deletePhoto(photoUrl: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🗑️ Attempting to delete photo:', photoUrl);
      
      // Extract file path from URL
      const url = new URL(photoUrl);
      console.log('🔍 Parsed URL:', {
        origin: url.origin,
        pathname: url.pathname,
        search: url.search,
        hash: url.hash
      });
      
      const pathParts = url.pathname.split('/');
      console.log('🔍 Path parts:', pathParts);
      
      // Extract file path from the URL
      let filePath = '';
      
      // For signed URLs like: https://tagjfsxeutihwntpudsk.supabase.co/storage/v1/object/sign/user-photos/middy/0-1758206255692.jpg?token=...
      if (photoUrl.includes('user-photos/')) {
        const userPhotosIndex = photoUrl.indexOf('user-photos/');
        const pathAfterUserPhotos = photoUrl.substring(userPhotosIndex + 'user-photos/'.length);
        // Remove query parameters if any
        filePath = pathAfterUserPhotos.split('?')[0];
        console.log('🔍 Extracted from user-photos path:', filePath);
      } else {
        // Fallback to standard path extraction
        const fileName = pathParts[pathParts.length - 1];
        const username = pathParts[pathParts.length - 2];
        filePath = `${username}/${fileName}`;
        console.log('🔍 Extracted from standard path:', filePath);
      }
      
      // Extract username and filename from the filePath for logging
      const filePathParts = filePath.split('/');
      const extractedUsername = filePathParts[0];
      const extractedFileName = filePathParts[1];
      
      console.log('🔍 Extracted details:', {
        extractedUsername,
        extractedFileName,
        filePath,
        originalUrl: photoUrl
      });

      // First, let's list the files in the user's folder to see what's actually there
      if (extractedUsername) {
        console.log('🔍 Listing files in user folder:', extractedUsername);
        const { data: files, error: listError } = await supabase.storage
          .from('user-photos')
          .list(extractedUsername);
        
        if (listError) {
          console.error('❌ Error listing files:', listError);
        } else {
          console.log('📁 Files in user folder:', files?.map(f => f.name) || []);
        }
      }

      const { error } = await supabase.storage
        .from('user-photos')
        .remove([filePath]);

      if (error) {
        console.error('❌ Error deleting photo:', error);
        console.error('❌ Error details:', {
          message: error.message,
          statusCode: error.statusCode,
          error: error.error
        });
        return { success: false, error: error.message };
      }

      console.log(`✅ Photo deleted successfully: ${filePath}`);
      
      // Verify the file was actually deleted by listing the folder again
      if (extractedUsername) {
        console.log('🔍 Verifying deletion by listing files again...');
        const { data: filesAfterDelete, error: listErrorAfter } = await supabase.storage
          .from('user-photos')
          .list(extractedUsername);
        
        if (listErrorAfter) {
          console.error('❌ Error listing files after deletion:', listErrorAfter);
        } else {
          console.log('📁 Files remaining in user folder:', filesAfterDelete?.map(f => f.name) || []);
          const fileStillExists = filesAfterDelete?.some(f => f.name === extractedFileName);
          if (fileStillExists) {
            console.warn('⚠️ File still exists after deletion attempt!');
          } else {
            console.log('✅ File successfully deleted from storage');
          }
        }
      }
      
      return { success: true };

    } catch (error) {
      console.error('❌ Error deleting photo:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get signed URL for a photo (if needed for private access)
   */
  static async getSignedUrl(photoUrl: string): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      // Extract file path from URL
      const url = new URL(photoUrl);
      const pathParts = url.pathname.split('/');
      const fileName = pathParts[pathParts.length - 1];
      const username = pathParts[pathParts.length - 2];
      const filePath = `${username}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('user-photos')
        .createSignedUrl(filePath, 86400); // 24 hour expiry

      if (error) {
        console.error('❌ Error creating signed URL:', error);
        // If file doesn't exist, return the original URL as fallback
        if (error.message.includes('Object not found')) {
          console.log('⚠️ File not found in storage, using original URL as fallback');
          return { success: true, url: photoUrl };
        }
        return { success: false, error: error.message };
      }

      return { success: true, url: data.signedUrl };

    } catch (error) {
      console.error('❌ Error creating signed URL:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Refresh signed URLs for an array of photo URLs
   */
  static async refreshSignedUrls(photoUrls: string[]): Promise<string[]> {
    try {
      // Extract file paths from existing URLs (works for both signed and public storage URLs)
      const paths: string[] = [];
      for (const photoUrl of photoUrls) {
        try {
          const url = new URL(photoUrl);
          const parts = url.pathname.split('/');
          // Expect .../user-photos/<username>/<file>
          const file = parts[parts.length - 1];
          const username = parts[parts.length - 2];
          if (username && file) {
            paths.push(`${username}/${file}`);
          }
        } catch {
          // If URL parsing fails, keep original URL
          paths.push(photoUrl);
        }
      }

      const realPaths = paths.filter(p => !p.startsWith('http'));
      const passthrough = paths.filter(p => p.startsWith('http')) as string[];

      let signedUrls: string[] = [];
      if (realPaths.length > 0) {
        const { data, error } = await supabase.storage
          .from('user-photos')
          .createSignedUrls(realPaths, 86400);
        if (error) {
          console.error('❌ Error batch refreshing signed URLs:', error);
          // Fallback to original URLs in same order
          return photoUrls;
        }
        signedUrls = (data || []).map(item => item?.signedUrl || '').filter(Boolean) as string[];
      }

      // Merge back signed + passthrough preserving original order
      const result: string[] = [];
      let s = 0, p = 0;
      for (const original of paths) {
        if (original.startsWith('http')) {
          result.push(passthrough[p++]);
        } else {
          result.push(signedUrls[s++] || original);
        }
      }
      return result;
    } catch (error) {
      console.error('❌ Error refreshing signed URLs:', error);
      return photoUrls; // Return original URLs if refresh fails
    }
  }

  /**
   * Load photos for a user from the storage bucket
   */
  static async loadPhotos(userId: string, username: string): Promise<string[]> {
    try {
      console.log(`📸 Loading photos for user: ${username} (${userId})`);

      // List all files in the user's folder
      const { data: files, error } = await supabase.storage
        .from('user-photos')
        .list(username, {
          limit: 100,
          sortBy: { column: 'created_at', order: 'asc' }
        });

      if (error) {
        console.error('❌ Error listing photos:', error);
        return [];
      }

      if (!files || files.length === 0) {
        console.log('📸 No photos found for user');
        return [];
      }

      // Filter for image files and sort by name (which includes index)
      const imageFiles = files
        .filter(file => file.name.match(/\.(jpg|jpeg|png)$/i))
        .sort((a, b) => {
          // Extract index from filename (format: index-timestamp.jpg)
          const aIndex = parseInt(a.name.split('-')[0]) || 0;
          const bIndex = parseInt(b.name.split('-')[0]) || 0;
          return aIndex - bIndex;
        });

      console.log(`📸 Found ${imageFiles.length} photos for user`);
      console.log(`📸 Image files:`, imageFiles.map(f => f.name));
      
      // Check for duplicate files (same index)
      const indexCounts: { [key: number]: number } = {};
      imageFiles.forEach(file => {
        const index = parseInt(file.name.split('-')[0]) || 0;
        indexCounts[index] = (indexCounts[index] || 0) + 1;
      });
      
      const duplicates = Object.entries(indexCounts).filter(([_, count]) => count > 1);
      if (duplicates.length > 0) {
        console.warn(`⚠️ Found duplicate photo indices:`, duplicates);
        
        // Clean up duplicates by keeping only the most recent file for each index
        const cleanedFiles = [];
        const processedIndices = new Set();
        
        for (const file of imageFiles) {
          const index = parseInt(file.name.split('-')[0]) || 0;
          if (!processedIndices.has(index)) {
            // Find all files with this index
            const filesWithSameIndex = imageFiles.filter(f => parseInt(f.name.split('-')[0]) === index);
            // Keep the most recent one (last in the array since they're sorted by created_at)
            const mostRecent = filesWithSameIndex[filesWithSameIndex.length - 1];
            cleanedFiles.push(mostRecent);
            processedIndices.add(index);
            
            // Delete the older duplicates
            const duplicatesToDelete = filesWithSameIndex.slice(0, -1);
            for (const duplicate of duplicatesToDelete) {
              console.log(`🗑️ Deleting duplicate file: ${duplicate.name}`);
              try {
                const { error: deleteError } = await supabase.storage
                  .from('user-photos')
                  .remove([`${username}/${duplicate.name}`]);
                
                if (deleteError) {
                  console.error(`❌ Error deleting duplicate ${duplicate.name}:`, deleteError);
                } else {
                  console.log(`✅ Deleted duplicate ${duplicate.name}`);
                }
              } catch (error) {
                console.error(`❌ Error deleting duplicate ${duplicate.name}:`, error);
              }
            }
          }
        }
        
        console.log(`🧹 Cleaned up duplicates, using ${cleanedFiles.length} unique files`);
        // Use cleaned files instead of original imageFiles
        imageFiles.splice(0, imageFiles.length, ...cleanedFiles);
      }

      // Build file paths and create signed URLs in a single batch (24h TTL)
      const paths = imageFiles.map(file => `${username}/${file.name}`);
      const { data: batch, error: batchError } = await supabase.storage
        .from('user-photos')
        .createSignedUrls(paths, 86400);

      if (batchError) {
        console.error('❌ Error creating batch signed URLs:', batchError);
        return [];
      }

      const validUrls = (batch || [])
        .map(item => item?.signedUrl || null)
        .filter(Boolean) as string[];
      console.log(`✅ Loaded ${validUrls.length} photos successfully`);
      
      return validUrls;

    } catch (error) {
      console.error('❌ Error loading photos:', error);
      return [];
    }
  }
}

// Export the loadPhotos function for direct import
export const loadPhotos = PhotoUploadService.loadPhotos;
