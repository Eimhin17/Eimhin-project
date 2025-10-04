import { ChatService } from './chat';
import { LikesService } from './likes';
import { ChatMatch } from '../lib/supabase';
import { LikeWithProfile } from './likes';

interface PreloadedData {
  chats: ChatMatch[] | null;
  likes: LikeWithProfile[] | null;
  timestamp: number;
}

class TabPreloader {
  private preloadedData: PreloadedData = {
    chats: null,
    likes: null,
    timestamp: 0,
  };

  private readonly CACHE_DURATION = 30000; // 30 seconds

  // Preload chats data
  async preloadChats(userId: string): Promise<void> {
    try {
      console.log('⚡ Preloading chats data...');
      const chats = await ChatService.getMatches(userId);
      this.preloadedData.chats = chats;
      this.preloadedData.timestamp = Date.now();
      console.log('✅ Chats data preloaded:', chats.length, 'chats');
    } catch (error) {
      console.error('❌ Error preloading chats:', error);
    }
  }

  // Preload likes data
  async preloadLikes(userId: string): Promise<void> {
    try {
      console.log('⚡ Preloading likes data...');
      const likes = await LikesService.getLikesReceived(userId);
      this.preloadedData.likes = likes;
      this.preloadedData.timestamp = Date.now();
      console.log('✅ Likes data preloaded:', likes.length, 'likes');
    } catch (error) {
      console.error('❌ Error preloading likes:', error);
    }
  }

  // Get preloaded chats (returns null if stale)
  getPreloadedChats(): ChatMatch[] | null {
    if (!this.preloadedData.chats) {
      return null;
    }

    const age = Date.now() - this.preloadedData.timestamp;
    if (age > this.CACHE_DURATION) {
      console.log('⏰ Preloaded chats data is stale');
      return null;
    }

    console.log('⚡ Using preloaded chats data');
    return this.preloadedData.chats;
  }

  // Get preloaded likes (returns null if stale)
  getPreloadedLikes(): LikeWithProfile[] | null {
    if (!this.preloadedData.likes) {
      return null;
    }

    const age = Date.now() - this.preloadedData.timestamp;
    if (age > this.CACHE_DURATION) {
      console.log('⏰ Preloaded likes data is stale');
      return null;
    }

    console.log('⚡ Using preloaded likes data');
    return this.preloadedData.likes;
  }

  // Clear all preloaded data
  clearAll(): void {
    this.preloadedData = {
      chats: null,
      likes: null,
      timestamp: 0,
    };
  }

  // Clear chats data
  clearChats(): void {
    this.preloadedData.chats = null;
  }

  // Clear likes data
  clearLikes(): void {
    this.preloadedData.likes = null;
  }
}

export const tabPreloader = new TabPreloader();
