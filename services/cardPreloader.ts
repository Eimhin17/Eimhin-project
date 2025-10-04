import { ProfileData } from '../components/ScrollableProfileCard';
import { PhotoUploadService } from './photoUpload';
import { Image } from 'expo-image';

interface PreloadedCard {
  profile: ProfileData;
  photos: string[];
  isPhotoUrlsRefreshed: boolean;
}

class CardPreloaderService {
  private preloadedCards = new Map<string, PreloadedCard>();
  private preloadingPromises = new Map<string, Promise<void>>();
  private maxPreloadCount = 5; // Preload up to 5 cards ahead

  /**
   * Preload a batch of cards for smooth swiping experience
   */
  async preloadCards(profiles: ProfileData[], startIndex: number = 0): Promise<void> {
    const endIndex = Math.min(startIndex + this.maxPreloadCount, profiles.length);
    const preloadPromises: Promise<void>[] = [];

    for (let i = startIndex; i < endIndex; i++) {
      const profile = profiles[i];

      // If we already have a preloaded card but the incoming profile now has photos,
      // refresh the cached entry to avoid keeping an empty photos array.
      const existing = this.preloadedCards.get(profile.id);
      if (existing && (profile.photos?.length || 0) !== (existing.photos?.length || 0)) {
        this.preloadedCards.set(profile.id, {
          ...existing,
          profile: { ...profile, photos: profile.photos || [] },
          photos: profile.photos || [],
          isPhotoUrlsRefreshed: true,
        });
      }

      if (!this.preloadedCards.has(profile.id) && !this.preloadingPromises.has(profile.id)) {
        const promise = this.preloadSingleCard(profile);
        this.preloadingPromises.set(profile.id, promise);
        preloadPromises.push(promise);
      }
    }

    await Promise.all(preloadPromises);
  }

  /**
   * Preload a single card with photos and refreshed URLs
   */
  private async preloadSingleCard(profile: ProfileData): Promise<void> {
    try {
      console.log(`🔄 Preloading card for ${profile.name}`);

      // Use provided photo URLs directly; upstream now returns long-lived signed URLs
      const refreshedPhotos = profile.photos || [];
      const isPhotoUrlsRefreshed = true;

      // Prefetch first 1-2 photos to disk cache for instant display
      if (refreshedPhotos.length > 0) {
        try {
          await Image.prefetch(refreshedPhotos.slice(0, 2), { cachePolicy: 'disk' });
        } catch (e) {
          console.warn('⚠️ Image prefetch failed:', e);
        }
      }

      // Store preloaded card
      this.preloadedCards.set(profile.id, {
        profile: {
          ...profile,
          photos: refreshedPhotos,
        },
        photos: refreshedPhotos,
        isPhotoUrlsRefreshed,
      });

      console.log(`✅ Successfully preloaded card for ${profile.name}`);
    } catch (error) {
      console.error(`❌ Failed to preload card for ${profile.name}:`, error);
    } finally {
      this.preloadingPromises.delete(profile.id);
    }
  }

  /**
   * Get a preloaded card or fallback to original profile
   */
  getPreloadedCard(profileId: string): ProfileData | null {
    const preloaded = this.preloadedCards.get(profileId);
    return preloaded ? preloaded.profile : null;
  }

  /**
   * Check if a card is preloaded and ready
   */
  isCardPreloaded(profileId: string): boolean {
    return this.preloadedCards.has(profileId);
  }

  /**
   * Get all preloaded cards for a list of profiles, maintaining order
   */
  getPreloadedCards(profiles: ProfileData[]): ProfileData[] {
    return profiles.map(profile => {
      const preloaded = this.getPreloadedCard(profile.id);
      if (!preloaded) return profile;

      // Prefer live profile photos if they exist; otherwise fall back to cached
      const mergedPhotos = (profile.photos && profile.photos.length > 0)
        ? profile.photos
        : preloaded.photos || [];

      // Merge to ensure we never regress to an empty array once photos arrive
      return {
        ...preloaded,
        ...profile,
        photos: mergedPhotos,
      };
    });
  }

  /**
   * Preload next batch of cards when user swipes (background preloading)
   */
  async preloadNextBatch(profiles: ProfileData[], currentIndex: number): Promise<void> {
    // Preload cards ahead of current position
    const nextStartIndex = currentIndex + 1;
    if (nextStartIndex < profiles.length) {
      // Don't await - run in background
      this.preloadCards(profiles, nextStartIndex).catch(error => {
        console.warn('Background preloading failed:', error);
      });
    }
  }

  /**
   * Clean up old preloaded cards to manage memory
   */
  cleanupOldCards(profiles: ProfileData[], currentIndex: number): void {
    const keepIndices = new Set<string>();

    // Keep current card and next few cards
    for (let i = Math.max(0, currentIndex - 1); i < Math.min(currentIndex + this.maxPreloadCount, profiles.length); i++) {
      keepIndices.add(profiles[i].id);
    }

    // Remove cards that are no longer needed
    for (const [profileId] of this.preloadedCards) {
      if (!keepIndices.has(profileId)) {
        this.preloadedCards.delete(profileId);
        this.preloadingPromises.delete(profileId);
      }
    }
  }

  /**
   * Force refresh photos for a specific card
   */
  async refreshCardPhotos(profileId: string): Promise<ProfileData | null> {
    const preloaded = this.preloadedCards.get(profileId);
    if (!preloaded) return null;

    try {
      const refreshedPhotos = await PhotoUploadService.refreshSignedUrls(preloaded.profile.photos);
      const updatedProfile = {
        ...preloaded.profile,
        photos: refreshedPhotos,
      };

      this.preloadedCards.set(profileId, {
        ...preloaded,
        profile: updatedProfile,
        photos: refreshedPhotos,
        isPhotoUrlsRefreshed: true,
      });

      return updatedProfile;
    } catch (error) {
      console.error(`Failed to refresh photos for card ${profileId}:`, error);
      return preloaded.profile;
    }
  }

  /**
   * Clear all preloaded cards
   */
  clear(): void {
    this.preloadedCards.clear();
    this.preloadingPromises.clear();
  }

  /**
   * Get preloading status for debugging
   */
  getStatus(): {
    preloadedCount: number;
    preloadingCount: number;
    preloadedIds: string[];
  } {
    return {
      preloadedCount: this.preloadedCards.size,
      preloadingCount: this.preloadingPromises.size,
      preloadedIds: Array.from(this.preloadedCards.keys()),
    };
  }
}

// Export singleton instance
export const cardPreloader = new CardPreloaderService();
