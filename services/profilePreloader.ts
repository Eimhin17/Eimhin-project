import { RealUserService, RealUserProfile } from './realUsers';
import { MatchingService } from './matching';

export interface PreloadedProfile {
  id: string;
  name: string;
  age: number;
  school: string;
  county: string;
  bio: string;
  photos: string[];
  gender: string;
  lookingFor: string[];
  interests: string[];
  profilePrompts: Record<string, string>;
  relationshipStatus: string;
  datingIntentions: string[];
  lookingForFriendsOrDates: string;
  isRealUser: boolean;
}

class ProfilePreloaderService {
  private preloadedProfile: PreloadedProfile | null = null;
  private isLoading = false;
  private lastUserId: string | null = null;

  /**
   * Preload the first profile for a user in the background
   */
  async preloadFirstProfile(userId: string): Promise<void> {
    // Don't preload if already loading or if it's the same user
    if (this.isLoading || this.lastUserId === userId) {
      return;
    }

    this.isLoading = true;
    this.lastUserId = userId;

    try {
      console.log('🔄 Preloading first profile for user:', userId);

      // Get passed users to exclude them
      const passedUserIds = await MatchingService.getPassedUsers(userId);

      // Fetch the first available profile
      const result = await RealUserService.getUserProfilesForSwiping(
        userId,
        passedUserIds
      );

      if (result.success && result.profiles && result.profiles.length > 0) {
        const firstProfile = result.profiles[0];
        const transformedProfile = this.transformProfile(firstProfile);

        // Load photos for the first profile
        const photosResult = await RealUserService.getUserPhotos(firstProfile.id);
        if (photosResult.success && photosResult.photos) {
          transformedProfile.photos = photosResult.photos;
        }

        this.preloadedProfile = transformedProfile;
        console.log('✅ Preloaded first profile:', transformedProfile.name);
      }
    } catch (error) {
      console.error('❌ Error preloading profile:', error);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Get the preloaded profile and clear it
   */
  getPreloadedProfile(): PreloadedProfile | null {
    const profile = this.preloadedProfile;
    this.preloadedProfile = null; // Clear after getting
    return profile;
  }

  /**
   * Check if there's a preloaded profile available
   */
  hasPreloadedProfile(): boolean {
    return this.preloadedProfile !== null;
  }

  /**
   * Clear the preloaded profile
   */
  clearPreloadedProfile(): void {
    this.preloadedProfile = null;
  }

  /**
   * Transform a real user profile to the preloaded format
   */
  private transformProfile(realUser: RealUserProfile): PreloadedProfile {
    // Calculate age
    const birthDate = new Date(realUser.date_of_birth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;

    // Transform looking_for_debs
    const getLookingForText = (lookingFor: string) => {
      switch (lookingFor) {
        case 'go_to_someones_debs':
          return 'Go to someone\'s debs';
        case 'bring_someone_to_my_debs':
          return 'Bring someone to my debs';
        case 'swaps':
          return 'Swaps';
        default:
          return lookingFor;
      }
    };

    const lookingFor = realUser.looking_for_debs ? [getLookingForText(realUser.looking_for_debs)] : [];

    // Transform dating_intentions
    const getDatingIntentionText = (intention: string) => {
      switch (intention) {
        case 'one_night_thing':
          return 'One night thing';
        case 'short_term_only':
          return 'Short term only';
        case 'short_term_but_open_to_long_term':
          return 'Short term but open to long term';
        case 'long_term_only':
          return 'Long term only';
        case 'long_term_but_open_to_short_term':
          return 'Long term but open to short term';
        default:
          return intention;
      }
    };

    const intentions = realUser.dating_intentions ? [getDatingIntentionText(realUser.dating_intentions)] : [];

    // Transform relationship_status
    const getRelationshipStatusText = (status: string) => {
      switch (status) {
        case 'single':
          return 'Single';
        case 'relationship':
          return 'In a relationship';
        case 'complicated':
          return 'It\'s complicated';
        default:
          return status;
      }
    };

    // Transform looking_for_friends_or_dates
    const getLookingForFriendsOrDatesText = (preference: string) => {
      switch (preference) {
        case 'dates':
          return 'Dates';
        case 'friends':
          return 'Friends';
        case 'both':
          return 'Both';
        default:
          return preference;
      }
    };

    const interests = realUser.interests || [];
    const profilePrompts = realUser.profile_prompts || {};

    // Add default interests if none
    if (interests.length === 0) {
      interests.push('Getting to know people', 'Having fun', 'Making connections');
    }

    // Add default profile prompts if none
    if (Object.keys(profilePrompts).length === 0) {
      profilePrompts['My ideal first date is...'] = realUser.bio || 'Ask me about it!';
      profilePrompts['I\'m looking for someone who...'] = `Is interested in ${getLookingForText(realUser.looking_for_debs)}`;
      profilePrompts['My biggest fear is...'] = 'Ask me in person!';
      profilePrompts['My friends would describe me as...'] = 'Friendly and genuine';
    }

    return {
      id: realUser.id,
      name: realUser.first_name,
      age: actualAge,
      school: realUser.school_name || 'Unknown School',
      county: realUser.county || 'Unknown County',
      bio: realUser.bio || 'Ask me about it!',
      photos: [], // Will be loaded separately
      gender: realUser.gender,
      lookingFor,
      interests,
      profilePrompts,
      relationshipStatus: getRelationshipStatusText(realUser.relationship_status || 'single'),
      datingIntentions: intentions,
      lookingForFriendsOrDates: getLookingForFriendsOrDatesText(realUser.looking_for_friends_or_dates || 'both'),
      isRealUser: true,
    };
  }
}

export const profilePreloader = new ProfilePreloaderService();
