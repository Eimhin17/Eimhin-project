import React from 'react';
import * as FileSystem from 'expo-file-system/legacy';

/**
 * Converts a local file URI to a base64 data URL for display
 * This is necessary because Expo 54 no longer supports file:// URIs directly
 */
export async function convertFileUriToDataUrl(uri: string): Promise<string> {
  // If it's already a data URL or web URL, return as is
  if (uri.startsWith('data:') || uri.startsWith('http')) {
    return uri;
  }
  
  // If it's a local file URI, convert to base64
  if (uri.startsWith('file://')) {
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return `data:image/jpeg;base64,${base64}`;
    } catch (error) {
      console.error('❌ Error converting photo to base64:', error);
      return null;
    }
  }
  
  // Return null for unknown URI types
  return null;
}

/**
 * Converts an array of photo URIs to data URLs
 */
export async function convertPhotoArrayToDataUrls(photos: string[]): Promise<string[]> {
  if (!photos || photos.length === 0) {
    return [];
  }
  
  const convertedPhotos = await Promise.all(photos.map(photo => convertFileUriToDataUrl(photo)));
  // Filter out null values (invalid files)
  return convertedPhotos.filter(photo => photo !== null) as string[];
}

/**
 * Hook to convert photos for display
 */
export function useConvertedPhotos(photos: string[]) {
  const [convertedPhotos, setConvertedPhotos] = React.useState<string[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  
  React.useEffect(() => {
    const convertPhotos = async () => {
      setIsLoading(true);
      try {
        const converted = await convertPhotoArrayToDataUrls(photos);
        setConvertedPhotos(converted);
      } catch (error) {
        console.error('Error converting photos:', error);
        setConvertedPhotos([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    convertPhotos();
  }, [photos]);
  
  return { convertedPhotos, isLoading };
}
