import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import ScrollableProfileCard, { ProfileData } from '../../components/ScrollableProfileCard';
import { useUser } from '../../contexts/UserContext';
import { supabase } from '../../lib/supabase';
import { SPACING, BORDER_RADIUS } from '../../utils/constants';
import { Fonts } from '../../utils/fonts';
import { BackButton } from '../../components/ui';

const { width: screenWidth } = Dimensions.get('window');
const SWIPE_THRESHOLD = screenWidth * 0.25;

// Haptic feedback thresholds for gradual intensity (same as profile preview)
const HAPTIC_THRESHOLDS = {
  VERY_LIGHT: screenWidth * 0.05,   // 5% of screen width
  LIGHT: screenWidth * 0.1,         // 10% of screen width
  LIGHT_MEDIUM: screenWidth * 0.15, // 15% of screen width
  MEDIUM: screenWidth * 0.2,        // 20% of screen width
  MEDIUM_STRONG: screenWidth * 0.25, // 25% of screen width
  STRONG: screenWidth * 0.3,        // 30% of screen width
  STRONG_INTENSE: screenWidth * 0.35, // 35% of screen width
  INTENSE: screenWidth * 0.4,       // 40% of screen width
  VERY_INTENSE: screenWidth * 0.45, // 45% of screen width
  MAXIMUM: screenWidth * 0.5,       // 50% of screen width
};

// Helper function to transform current user profile to ProfileData format
const transformCurrentUserToProfileData = (userProfile: any): ProfileData => {
  // Calculate age from date of birth
  const birthDate = new Date(userProfile.dateOfBirth);
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;

  // Transform looking_for_debs to user-friendly text
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
  
  const lookingFor = userProfile.lookingFor ? [getLookingForText(userProfile.lookingFor)] : [];

  // Transform dating_intentions to user-friendly text
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
  
  const intentions = userProfile.relationshipIntention ? [getDatingIntentionText(userProfile.relationshipIntention)] : [];

  return {
    id: userProfile.id,
    name: `${userProfile.firstName} ${userProfile.username}`,
    age: actualAge,
    school: userProfile.school || 'School not specified',
    gender: userProfile.gender,
    lookingFor,
    datingIntentions: intentions,
    bio: userProfile.bio,
    interests: userProfile.interests || [],
    relationshipStatus: userProfile.relationshipStatus,
    profilePrompts: userProfile.profilePrompts || {},
    photos: userProfile.photos || [],
    lookingForFriendsOrDates: userProfile.lookingForFriendsOrDates,
  };
};

export default function MyProfileViewScreen() {
  const { userProfile } = useUser();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Swipe animation values
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  
  // Haptic feedback ref
  const lastHapticLevel = useRef<string | null>(null);
  
  // Function to get haptic intensity based on swipe distance (same as profile preview)
  const getHapticIntensity = (translationX: number, direction: 'left' | 'right') => {
    const absX = Math.abs(translationX);
    
    if (absX >= HAPTIC_THRESHOLDS.MAXIMUM) {
      return { level: 'MAXIMUM', style: Haptics.ImpactFeedbackStyle.Heavy };
    } else if (absX >= HAPTIC_THRESHOLDS.VERY_INTENSE) {
      return { level: 'VERY_INTENSE', style: Haptics.ImpactFeedbackStyle.Heavy };
    } else if (absX >= HAPTIC_THRESHOLDS.INTENSE) {
      return { level: 'INTENSE', style: Haptics.ImpactFeedbackStyle.Heavy };
    } else if (absX >= HAPTIC_THRESHOLDS.STRONG_INTENSE) {
      return { level: 'STRONG_INTENSE', style: Haptics.ImpactFeedbackStyle.Medium };
    } else if (absX >= HAPTIC_THRESHOLDS.STRONG) {
      return { level: 'STRONG', style: Haptics.ImpactFeedbackStyle.Medium };
    } else if (absX >= HAPTIC_THRESHOLDS.MEDIUM_STRONG) {
      return { level: 'MEDIUM_STRONG', style: Haptics.ImpactFeedbackStyle.Medium };
    } else if (absX >= HAPTIC_THRESHOLDS.MEDIUM) {
      return { level: 'MEDIUM', style: Haptics.ImpactFeedbackStyle.Medium };
    } else if (absX >= HAPTIC_THRESHOLDS.LIGHT_MEDIUM) {
      return { level: 'LIGHT_MEDIUM', style: Haptics.ImpactFeedbackStyle.Light };
    } else if (absX >= HAPTIC_THRESHOLDS.LIGHT) {
      return { level: 'LIGHT', style: Haptics.ImpactFeedbackStyle.Light };
    } else if (absX >= HAPTIC_THRESHOLDS.VERY_LIGHT) {
      return { level: 'VERY_LIGHT', style: Haptics.ImpactFeedbackStyle.Light };
    }
    
    return null;
  };
  
  // Function to load photos from storage bucket (same as profile preview)
  const loadPhotos = async (profileId: string, username: string) => {
    try {
      console.log('🖼️ Loading photos for user:', username);
      const { data: files, error } = await supabase.storage
        .from('user-photos')
        .list(username, {
          limit: 100,
          sortBy: { column: 'created_at', order: 'asc' }
        });

      if (error) {
        console.error('❌ Error fetching photos from storage:', error);
        return [];
      }

      if (!files || files.length === 0) {
        console.log('📷 No photos found for user:', username);
        return [];
      }

      // Get signed URLs for each photo
      const photoUrls = await Promise.all(
        files.map(async (file) => {
          const { data: signedUrl } = await supabase.storage
            .from('user-photos')
            .createSignedUrl(`${username}/${file.name}`, 3600); // 1 hour expiry
          return signedUrl?.signedUrl || '';
        })
      );

      const validUrls = photoUrls.filter(url => url !== '');
      console.log(`✅ Loaded ${validUrls.length} photos for user:`, username);
      return validUrls;
    } catch (error) {
      console.error('❌ Error loading photos:', error);
      return [];
    }
  };

  // Transform user profile data and load photos
  useEffect(() => {
    const loadProfileData = async () => {
      if (userProfile) {
        const transformedProfile = transformCurrentUserToProfileData(userProfile);
        setProfileData(transformedProfile);
        
        // Load photos from storage bucket
        if (userProfile.username) {
          const photos = await loadPhotos(userProfile.id, userProfile.username);
          setProfileData(prev => prev ? { ...prev, photos } : null);
        }
        
        setLoading(false);
      } else {
        setLoading(false);
      }
    };

    loadProfileData();
  }, [userProfile]);

  // Swipe gesture handlers with haptic feedback (same as profile preview)
  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX, translationY: translateY } }],
    { 
      useNativeDriver: false,
      listener: (event: any) => {
        const { translationX } = event.nativeEvent;
        const absX = Math.abs(translationX);

        if (translationX > 0) {
          // Swiping right (edit)
          const hapticInfo = getHapticIntensity(translationX, 'right');
          if (hapticInfo && lastHapticLevel.current !== hapticInfo.level) {
            Haptics.impactAsync(hapticInfo.style);
            lastHapticLevel.current = hapticInfo.level;
          }
        } else if (translationX < 0) {
          // Swiping left (back)
          const hapticInfo = getHapticIntensity(translationX, 'left');
          if (hapticInfo && lastHapticLevel.current !== hapticInfo.level) {
            Haptics.impactAsync(hapticInfo.style);
            lastHapticLevel.current = hapticInfo.level;
          }
        } else if (absX < HAPTIC_THRESHOLDS.VERY_LIGHT) {
          // Reset when returning to center
          lastHapticLevel.current = null;
        }
      }
    }
  );

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.BEGAN) {
      // Reset haptic level when gesture starts
      lastHapticLevel.current = null;
    } else if (event.nativeEvent.state === State.END) {
      const { translationX } = event.nativeEvent;

      if (translationX > SWIPE_THRESHOLD) {
        // Swipe right - Navigate to edit profile
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push('/edit-profile');
      } else if (translationX < -SWIPE_THRESHOLD) {
        // Swipe left - Go back to profile page
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push('/(tabs)/profile');
      } else {
        // Return to center with spring animation
        Animated.parallel([
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: false,
            tension: 100,
            friction: 8,
          }),
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: false,
            tension: 100,
            friction: 8,
          }),
        ]).start();
      }
    }
  };

  // Calculate rotation and scale based on movement
  const cardRotation = translateX.interpolate({
    inputRange: [-screenWidth / 2, 0, screenWidth / 2],
    outputRange: ['-10deg', '0deg', '10deg'],
    extrapolate: 'clamp',
  });

  const cardScale = translateX.interpolate({
    inputRange: [-screenWidth / 2, 0, screenWidth / 2],
    outputRange: [0.92, 1, 0.92],
    extrapolate: 'clamp',
  });

  // Edit overlay opacity (pink) - shows when swiping right
  const editOverlayOpacity = translateX.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  // Back overlay opacity (purple) - shows when swiping left
  const backOverlayOpacity = translateX.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  // Show loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show error state if no profile data
  if (!profileData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Profile not found</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} style={styles.errorBackButton}>
            <Text style={styles.errorBackButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header - Same as other pages */}
      <View style={styles.header}>
        <BackButton onPress={() => router.push('/(tabs)/profile')} />
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>
        
        <View style={styles.headerRight} />
      </View>

      {/* Swipe-enabled Profile Card */}
      <View style={styles.cardContainer}>
        <PanGestureHandler
          onGestureEvent={onGestureEvent}
          onHandlerStateChange={onHandlerStateChange}
        >
          <Animated.View
            style={[
              styles.swipeableCard,
              {
                transform: [
                  { translateX: translateX },
                  { translateY: translateY },
                  { rotate: cardRotation },
                  { scale: cardScale },
                ],
              },
            ]}
          >
            {/* Use the ScrollableProfileCard */}
            <ScrollableProfileCard
              profile={profileData}
              onLike={() => router.push('/edit-profile')}
              onDislike={() => router.back()}
              onReport={() => router.push('/edit-profile')}
            />
            
            {/* Edit Overlay - Pink */}
            <Animated.View
              style={[
                styles.swipeOverlay,
                styles.editOverlay,
                { opacity: editOverlayOpacity }
              ]}
            >
              <FontAwesome5 name="edit" size={60} color="#FFFFFF" />
              <Text style={styles.swipeOverlayText}>EDIT</Text>
            </Animated.View>
            
            {/* Back Overlay - Purple */}
            <Animated.View
              style={[
                styles.swipeOverlay,
                styles.backOverlay,
                { opacity: backOverlayOpacity }
              ]}
            >
              <FontAwesome5 name="arrow-left" size={60} color="#FFFFFF" />
              <Text style={styles.swipeOverlayText}>BACK</Text>
            </Animated.View>
          </Animated.View>
        </PanGestureHandler>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: '#FFFFFF',
    minHeight: 60,
    zIndex: 1000,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: Fonts.bold,
    fontWeight: '700',
    fontSize: Math.min(28, screenWidth * 0.07),
    textAlign: 'center',
    color: '#1B1B3A',
  },
  headerRight: {
    width: 72, // Same size as BackButton for balance
    zIndex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#6C4AB6',
    fontWeight: '600',
    marginBottom: 20,
  },
  errorBackButton: {
    backgroundColor: '#FF4F81',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  errorBackButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Swipe-related styles - Same as profile preview
  cardContainer: {
    width: '100%',
    flex: 1,
    paddingHorizontal: SPACING.sm,
  },
  swipeableCard: {
    width: '100%',
    flex: 1,
    position: 'relative',
  },
  swipeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  editOverlay: {
    backgroundColor: 'rgba(255, 79, 129, 0.8)',
  },
  backOverlay: {
    backgroundColor: 'rgba(195, 177, 225, 0.8)', // Purple from design system with transparency
  },
  swipeOverlayText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
  },
});
