import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ProfilePictureService } from '../services/profilePicture';
import { convertFileUriToDataUrl } from '../utils/imageUtils';

interface CircularProfilePictureProps {
  userId: string;
  size?: number;
  fallbackIcon?: React.ReactNode;
  style?: any;
}

/**
 * Circular Profile Picture Component
 * Automatically fetches and displays a user's circular profile picture with caching
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
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    loadProfilePicture();

    return () => {
      isMounted.current = false;
    };
  }, [userId]);

  const loadProfilePicture = async () => {
    try {
      if (!isMounted.current) return;

      setLoading(true);
      setError(false);

      // ProfilePictureService.getPFP now uses caching internally
      const url = await ProfilePictureService.getPFP(userId);

      if (!isMounted.current) return;

      // Validate the URL - if it's invalid or a test URL, treat as error
      if (!url || url.includes('example.com') || url.includes('test.jpg')) {
        setError(true);
        setLoading(false);
        return;
      }

      // For local file URIs, convert to data URL
      if (url.startsWith('file://')) {
        const convertedUrl = await convertFileUriToDataUrl(url);
        if (isMounted.current) {
          setPfpUrl(convertedUrl);
        }
      } else {
        // For Supabase storage URLs (already signed and cached by getPFP), use directly
        if (isMounted.current) {
          setPfpUrl(url);
        }
      }
    } catch (err) {
      if (isMounted.current) {
        console.error('Error loading profile picture:', err);
        setError(true);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
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
      <LinearGradient
        colors={['#F8F4FF', '#E8DBFF', '#D8C4FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[containerStyle, styles.placeholder]}
      >
        {fallbackIcon || (
          <View style={styles.defaultIcon}>
            {/* You can replace this with any icon component */}
            <View style={[styles.iconCircle, { width: size * 0.6, height: size * 0.6, borderRadius: (size * 0.6) / 2 }]} />
          </View>
        )}
      </LinearGradient>
    );
  }

  return (
    <Image
      source={{ uri: pfpUrl }}
      style={containerStyle}
      contentFit="cover"
      onError={() => setError(true)}
      cachePolicy="memory-disk"
      priority="high"
      transition={200}
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
    justifyContent: 'center',
    alignItems: 'center',
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
