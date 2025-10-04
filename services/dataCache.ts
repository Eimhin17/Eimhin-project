/**
 * Comprehensive data caching service
 * Provides memory-based caching for frequently accessed data with TTL support
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheConfig {
  defaultTTL: number; // milliseconds
  maxSize: number; // maximum number of entries per cache
}

class DataCache {
  private caches: Map<string, Map<string, CacheEntry<any>>> = new Map();
  private config: CacheConfig = {
    defaultTTL: 5 * 60 * 1000, // 5 minutes default
    maxSize: 100
  };

  /**
   * Get or create a specific cache namespace
   */
  private getCache(namespace: string): Map<string, CacheEntry<any>> {
    if (!this.caches.has(namespace)) {
      this.caches.set(namespace, new Map());
    }
    return this.caches.get(namespace)!;
  }

  /**
   * Set a value in cache with optional TTL
   */
  set<T>(namespace: string, key: string, data: T, ttl?: number): void {
    const cache = this.getCache(namespace);

    // Check size limit and remove oldest entry if needed
    if (cache.size >= this.config.maxSize) {
      const oldestKey = cache.keys().next().value;
      cache.delete(oldestKey);
    }

    const expiresAt = Date.now() + (ttl || this.config.defaultTTL);
    cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt
    });
  }

  /**
   * Get a value from cache
   * Returns null if not found or expired
   */
  get<T>(namespace: string, key: string): T | null {
    const cache = this.getCache(namespace);
    const entry = cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Check if a key exists and is not expired
   */
  has(namespace: string, key: string): boolean {
    return this.get(namespace, key) !== null;
  }

  /**
   * Delete a specific entry
   */
  delete(namespace: string, key: string): void {
    const cache = this.getCache(namespace);
    cache.delete(key);
  }

  /**
   * Clear all entries in a namespace
   */
  clearNamespace(namespace: string): void {
    this.caches.delete(namespace);
  }

  /**
   * Clear all caches
   */
  clearAll(): void {
    this.caches.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(namespace?: string): {
    size: number;
    namespaces?: string[];
    entries?: { key: string; age: number }[];
  } {
    if (namespace) {
      const cache = this.getCache(namespace);
      const entries = Array.from(cache.entries()).map(([key, entry]) => ({
        key,
        age: Date.now() - entry.timestamp
      }));
      return { size: cache.size, entries };
    }

    return {
      size: this.caches.size,
      namespaces: Array.from(this.caches.keys())
    };
  }

  /**
   * Clean up expired entries across all caches
   */
  cleanup(): void {
    const now = Date.now();
    for (const [namespace, cache] of this.caches.entries()) {
      for (const [key, entry] of cache.entries()) {
        if (now > entry.expiresAt) {
          cache.delete(key);
        }
      }
    }
  }
}

// Singleton instance
export const dataCache = new DataCache();

// Run cleanup every 60 seconds
setInterval(() => {
  dataCache.cleanup();
}, 60000);

// Cache namespaces
export const CACHE_NAMESPACES = {
  PROFILE_PICTURES: 'profile_pictures',
  USER_PROFILES: 'user_profiles',
  CHAT_MATCHES: 'chat_matches',
  CHAT_MESSAGES: 'chat_messages',
  SIGNED_URLS: 'signed_urls',
  USER_PHOTOS: 'user_photos'
};

// Cache TTLs (in milliseconds)
export const CACHE_TTL = {
  PROFILE_PICTURE: 10 * 60 * 1000, // 10 minutes - profile pictures don't change often
  USER_PROFILE: 5 * 60 * 1000, // 5 minutes
  CHAT_DATA: 30 * 1000, // 30 seconds - chats need fresher data
  SIGNED_URL: 20 * 60 * 1000, // 20 minutes - URLs expire after 1 hour, we refresh before that
  PHOTOS: 10 * 60 * 1000 // 10 minutes
};
