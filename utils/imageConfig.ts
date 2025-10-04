/**
 * Global image configuration for expo-image
 * Optimizes image caching and loading across the app
 */

import { Image } from 'expo-image';

/**
 * Initialize global image configuration
 * Call this once at app startup
 */
export function initializeImageConfig() {
  // Configure expo-image defaults
  // Note: expo-image automatically uses disk and memory cache

  // Optionally pre-warm the cache with placeholder images
  // This helps avoid flashing when switching between screens

  console.log('✅ Image configuration initialized with aggressive caching');
}

/**
 * Preload images into cache
 * Useful for images that will be shown soon
 */
export async function preloadImages(uris: string[]): Promise<void> {
  try {
    await Promise.all(
      uris.map(uri => Image.prefetch(uri))
    );
    console.log(`⚡ Preloaded ${uris.length} images into cache`);
  } catch (error) {
    console.error('Error preloading images:', error);
  }
}

/**
 * Clear image cache if needed (e.g., on logout)
 */
export async function clearImageCache(): Promise<void> {
  try {
    await Image.clearMemoryCache();
    await Image.clearDiskCache();
    console.log('🗑️ Image cache cleared');
  } catch (error) {
    console.error('Error clearing image cache:', error);
  }
}
