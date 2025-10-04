import { supabase } from '../lib/supabase';
import { PhotoUploadService } from './photoUpload';
import { sendPushNotification } from './notifications';

export interface LikeData {
  id: string;
  liker_id: string;
  liked_user_id: string;
  created_at: string;
}

export interface LikeWithProfile extends LikeData {
  liker_profile: {
    id: string;
    first_name: string;
    photos: string[];
    school_name: string;
    age: number;
    county: string | null;
  };
}

export class LikesService {
  /**
   * Create a new like
   */
  static async createLike(likerId: string, likedUserId: string): Promise<LikeData | null> {
    try {
      console.log('Creating like for user:', likerId, 'liking:', likedUserId);

      const { data, error } = await supabase
        .from('likes')
        .insert({
          liker_id: likerId,
          liked_user_id: likedUserId,
        })
        .select()
        .single();

      if (error) {
        // Allow duplicate likes: if constraint violation, fetch existing like and return it
        if ((error as any).code === '23505') {
          console.warn('Duplicate like detected; returning existing like');
          const { data: existing, error: selectError } = await supabase
            .from('likes')
            .select('*')
            .eq('liker_id', likerId)
            .eq('liked_user_id', likedUserId)
            .single();

          if (selectError) {
            console.error('Error fetching existing like after duplicate:', selectError);
            return null;
          }
          return existing as LikeData;
        }
        console.error('Error creating like:', error);
        return null;
      }

      console.log('Like created successfully:', data);

      // Send push notification to the liked user
      try {
        // Get liker's profile for notification
        const { data: likerProfile } = await supabase
          .from('profiles')
          .select('first_name')
          .eq('id', likerId)
          .single();

        if (likerProfile) {
          await sendPushNotification(
            likedUserId,
            '💖 New Like!',
            `${likerProfile.first_name} liked you!`,
            { type: 'new_like', liker_id: likerId }
          );
        }
      } catch (notifError) {
        console.error('Error sending like notification:', notifError);
        // Don't fail the like creation if notification fails
      }

      return data;
    } catch (error) {
      console.error('Error creating like:', error);
      return null;
    }
  }

  /**
   * Get likes received by a user (people who liked them)
   * Excludes users who have already matched
   */
  static async getLikesReceived(userId: string): Promise<LikeWithProfile[]> {
    try {
      // First get the likes
      const { data: likesData, error: likesError } = await supabase
        .from('likes')
        .select('*')
        .eq('liked_user_id', userId)
        .order('created_at', { ascending: false });

      if (likesError) {
        console.error('Error fetching likes:', likesError);
        return [];
      }

      if (!likesData || likesData.length === 0) {
        return [];
      }

      // Get the liker IDs
      const likerIds = likesData.map(like => like.liker_id);

      // Check for existing matches to exclude them from likes
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select('user1_id, user2_id')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

      if (matchesError) {
        console.error('Error fetching matches:', matchesError);
        // Continue without filtering if matches query fails
      }

      // Get matched user IDs
      const matchedUserIds = new Set<string>();
      if (matchesData) {
        matchesData.forEach(match => {
          if (match.user1_id === userId) {
            matchedUserIds.add(match.user2_id);
          } else {
            matchedUserIds.add(match.user1_id);
          }
        });
      }

      // Filter out likes from users who have already matched
      const filteredLikes = likesData.filter(like => !matchedUserIds.has(like.liker_id));

      if (filteredLikes.length === 0) {
        return [];
      }

      // Get the filtered liker IDs
      const filteredLikerIds = filteredLikes.map(like => like.liker_id);

      // Fetch profiles for the filtered likers (only completed profiles)
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          username,
          date_of_birth,
          bio,
          county,
          schools (school_name)
        `)
        .in('id', filteredLikerIds)
        .eq('profile_completed', true)
        .eq('status', 'active');

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return [];
      }

      // Combine the data using filtered likes and refresh signed URLs for photos
      const result: LikeWithProfile[] = await Promise.all(
        filteredLikes.map(async (like) => {
          const profile = profilesData?.find(p => p.id === like.liker_id);
          
          // Calculate age from date of birth
          let age = 0;
          if (profile?.date_of_birth) {
            const birthDate = new Date(profile.date_of_birth);
            const today = new Date();
            age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
              age--;
            }
          }
          
          // Fetch photos from storage bucket
          let refreshedPhotos: string[] = [];
          if (profile?.username) {
            try {
              console.log('🔄 Fetching photos from storage for username:', profile.username);
              const { data: files, error } = await supabase.storage
                .from('user-photos')
                .list(profile.username, {
                  limit: 100,
                  sortBy: { column: 'created_at', order: 'asc' }
                });

              if (!error && files && files.length > 0) {
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

                refreshedPhotos = photoUrls.filter(url => url !== null) as string[];
                console.log('✅ Fetched photos from storage:', refreshedPhotos);
              }
            } catch (error) {
              console.error('❌ Error fetching photos from storage:', error);
              refreshedPhotos = []; // Fallback to empty array
            }
          }
          
          return {
            ...like,
            liker_profile: profile ? {
              id: profile.id,
              first_name: profile.first_name,
              photos: refreshedPhotos,
              school_name: profile.schools?.[0]?.school_name || 'Unknown',
              age: age,
              county: profile.county || null
            } : {
              id: like.liker_id,
              first_name: 'Unknown',
              photos: [],
              school_name: 'Unknown',
              age: 0,
              county: null
            }
          };
        })
      );

      return result;
    } catch (error) {
      console.error('Error fetching likes received:', error);
      return [];
    }
  }

  /**
   * Get likes given by a user (people they liked)
   * Excludes users who have already matched
   */
  static async getLikesGiven(userId: string): Promise<LikeWithProfile[]> {
    try {
      // First get the likes
      const { data: likesData, error: likesError } = await supabase
        .from('likes')
        .select('*')
        .eq('liker_id', userId)
        .order('created_at', { ascending: false });

      if (likesError) {
        console.error('Error fetching likes:', likesError);
        return [];
      }

      if (!likesData || likesData.length === 0) {
        return [];
      }

      // Check for existing matches to exclude them from likes
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select('user1_id, user2_id')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

      if (matchesError) {
        console.error('Error fetching matches:', matchesError);
        // Continue without filtering if matches query fails
      }

      // Get matched user IDs
      const matchedUserIds = new Set<string>();
      if (matchesData) {
        matchesData.forEach(match => {
          if (match.user1_id === userId) {
            matchedUserIds.add(match.user2_id);
          } else {
            matchedUserIds.add(match.user1_id);
          }
        });
      }

      // Filter out likes to users who have already matched
      const filteredLikes = likesData.filter(like => !matchedUserIds.has(like.liked_user_id));

      if (filteredLikes.length === 0) {
        return [];
      }

      // Get the filtered liked user IDs
      const likedUserIds = filteredLikes.map(like => like.liked_user_id);

      // Fetch profiles for the liked users (only completed profiles)
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          username,
          date_of_birth,
          bio,
          county,
          schools (school_name)
        `)
        .in('id', likedUserIds)
        .eq('profile_completed', true)
        .eq('status', 'active');

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return [];
      }

      // Combine the data using filtered likes and refresh signed URLs for photos
      const result: LikeWithProfile[] = await Promise.all(
        filteredLikes.map(async (like) => {
          const profile = profilesData?.find(p => p.id === like.liked_user_id);
          
          // Calculate age from date of birth
          let age = 0;
          if (profile?.date_of_birth) {
            const birthDate = new Date(profile.date_of_birth);
            const today = new Date();
            age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
              age--;
            }
          }
          
          // Fetch photos from storage bucket
          let refreshedPhotos: string[] = [];
          if (profile?.username) {
            try {
              console.log('🔄 Fetching photos from storage for username:', profile.username);
              const { data: files, error } = await supabase.storage
                .from('user-photos')
                .list(profile.username, {
                  limit: 100,
                  sortBy: { column: 'created_at', order: 'asc' }
                });

              if (!error && files && files.length > 0) {
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

                refreshedPhotos = photoUrls.filter(url => url !== null) as string[];
                console.log('✅ Fetched photos from storage:', refreshedPhotos);
              }
            } catch (error) {
              console.error('❌ Error fetching photos from storage:', error);
              refreshedPhotos = []; // Fallback to empty array
            }
          }
          
          return {
            ...like,
            liker_profile: profile ? {
              id: profile.id,
              first_name: profile.first_name,
              photos: refreshedPhotos,
              school_name: profile.schools?.[0]?.school_name || 'Unknown',
              age: age,
              county: profile.county || null
            } : {
              id: like.liked_user_id,
              first_name: 'Unknown',
              photos: [],
              school_name: 'Unknown',
              age: 0,
              county: null
            }
          };
        })
      );

      return result;
    } catch (error) {
      console.error('Error fetching likes given:', error);
      return [];
    }
  }

  /**
   * Check if user A has liked user B
   */
  static async hasLiked(likerId: string, likedUserId: string): Promise<boolean> {
    try {
      console.log('🔍 Checking if user', likerId, 'has liked user', likedUserId);
      
      // First, let's check what likes exist for this liker
      const { data: allLikes, error: allLikesError } = await supabase
        .from('likes')
        .select('*')
        .eq('liker_id', likerId);
      
      console.log('🔍 All likes by user', likerId, ':', allLikes);
      
      const { data, error } = await supabase
        .from('likes')
        .select('id')
        .eq('liker_id', likerId)
        .eq('liked_user_id', likedUserId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('❌ Error checking if user has liked:', error);
        return false;
      }

      const hasLiked = !!data;
      console.log('💖 Has liked result:', hasLiked, 'Data:', data);
      return hasLiked;
    } catch (error) {
      console.error('❌ Error checking if user has liked:', error);
      return false;
    }
  }

  /**
   * Check if two users have liked each other (mutual like = match)
   */
  static async checkMutualLike(user1Id: string, user2Id: string): Promise<boolean> {
    try {
      console.log('🔍 Checking mutual like between:', user1Id, 'and', user2Id);
      
      const [like1, like2] = await Promise.all([
        this.hasLiked(user1Id, user2Id),
        this.hasLiked(user2Id, user1Id)
      ]);

      console.log('💖 User1 liked User2:', like1);
      console.log('💖 User2 liked User1:', like2);
      console.log('🤝 Mutual like result:', like1 && like2);

      return like1 && like2;
    } catch (error) {
      console.error('❌ Error checking mutual like:', error);
      return false;
    }
  }

  /**
   * Remove a like
   */
  static async removeLike(likerId: string, likedUserId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('liker_id', likerId)
        .eq('liked_user_id', likedUserId);

      if (error) {
        console.error('Error removing like:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error removing like:', error);
      return false;
    }
  }
}
