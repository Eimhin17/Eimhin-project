import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { ProfilePictureService } from '../services/profilePicture';
import { convertFileUriToDataUrl } from '../utils/imageUtils';
import { PhotoUploadService } from '../services/photoUpload';
import { supabase } from '../lib/supabase';

interface CircularProfilePictureProps {
  userId: string;
  size?: number;
  fallbackIcon?: React.ReactNode;
  style?: any;
}

/**
 * Circular Profile Picture Component
 * Automatically fetches and displays a user's circular profile picture
 * Falls back to a placeholder if no PFP is available
 */
export const CircularProfilePicture: React.FC<CircularProfilePictureProps> = ({
  userId,
  size = 50,
  fallbackIcon,
  style
}) => {
  const [pfpUrl, setPfpUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadProfilePicture();
  }, [userId]);

  const loadProfilePicture = async () => {
    try {
      setLoading(true);
      setError(false);
      
      const url = await ProfilePictureService.getPFP(userId);
      
      // Validate the URL - if it's invalid or a test URL, treat as error
      if (!url || url.includes('example.com') || url.includes('test.jpg')) {
        console.log('⚠️ Invalid PFP URL, falling back to user initial');
        setError(true);
        return;
      }
      
      // For storage URLs, refresh signed URL if needed
      if (url.startsWith('file://')) {
        const convertedUrl = await convertFileUriToDataUrl(url);
        setPfpUrl(convertedUrl);
      } else if (url.includes('supabase.co')) {
        // Storage URL - check if it's a PFP URL and refresh accordingly
        try {
          let refreshResult;
          if (url.includes('user-pfps')) {
            // This is a PFP URL - use ProfilePictureService logic
            const urlParts = url.split('/');
            const fileName = urlParts[urlParts.length - 1];
            const username = urlParts[urlParts.length - 2];
            const filePath = `${username}/${fileName}`;
            
            const { data: signedUrlData, error: signedUrlError } = await supabase.storage
              .from('user-pfps')
              .createSignedUrl(filePath, 3600);
              
            if (signedUrlError) {
              console.log('⚠️ PFP file not found in storage, using original URL as fallback');
              setPfpUrl(url);
            } else {
              setPfpUrl(signedUrlData.signedUrl);
            }
          } else {
            // This is a regular photo URL - use PhotoUploadService
            refreshResult = await PhotoUploadService.getSignedUrl(url);
            if (refreshResult.success && refreshResult.url) {
              setPfpUrl(refreshResult.url);
            } else {
              // Fallback to original URL
              setPfpUrl(url);
            }
          }
        } catch (error) {
          console.error('❌ Error refreshing PFP signed URL:', error);
          // Fallback to original URL
          setPfpUrl(url);
        }
      } else {
        // Other URL types - use directly
        setPfpUrl(url);
      }
    } catch (err) {
      console.error('Error loading profile picture:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const containerStyle = [
    styles.container,
    {
      width: size,
      height: size,
      borderRadius: size / 2,
    },
    style
  ];

  if (loading) {
    return (
      <View style={containerStyle}>
        <ActivityIndicator 
          size="small" 
          color="#9B59B6" 
          style={styles.loader}
        />
      </View>
    );
  }

  if (error || !pfpUrl) {
    return (
      <View style={[containerStyle, styles.placeholder]}>
        {fallbackIcon || (
          <View style={styles.defaultIcon}>
            {/* You can replace this with any icon component */}
            <View style={[styles.iconCircle, { width: size * 0.6, height: size * 0.6, borderRadius: (size * 0.6) / 2 }]} />
          </View>
        )}
      </View>
    );
  }

  return (
    <Image
      source={{ uri: pfpUrl }}
      style={containerStyle}
      contentFit="cover"
      onError={() => setError(true)}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  placeholder: {
    backgroundColor: '#E0E0E0',
  },
  loader: {
    position: 'absolute',
  },
  defaultIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    backgroundColor: '#9B59B6',
    opacity: 0.3,
  },
});

export default CircularProfilePicture;
