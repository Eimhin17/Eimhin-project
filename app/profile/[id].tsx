import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Dimensions, Animated } from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import ReportProfileModal from '../../components/ReportProfileModal';
import { SPACING, BORDER_RADIUS } from '../../utils/constants';
import { Fonts } from '../../utils/fonts';
import { supabase } from '../../lib/supabase';
// import { BlurView } from 'expo-blur';
// Get screen dimensions for haptic thresholds
const { width } = Dimensions.get('window');

// Haptic feedback thresholds for gradual intensity (more levels for smoother progression)
const HAPTIC_THRESHOLDS = {
  VERY_LIGHT: width * 0.05,   // 5% of screen width
  LIGHT: width * 0.1,         // 10% of screen width
  LIGHT_MEDIUM: width * 0.15, // 15% of screen width
  MEDIUM: width * 0.2,        // 20% of screen width
  MEDIUM_STRONG: width * 0.25, // 25% of screen width
  STRONG: width * 0.3,        // 30% of screen width
  STRONG_INTENSE: width * 0.35, // 35% of screen width
  INTENSE: width * 0.4,       // 40% of screen width
  VERY_INTENSE: width * 0.45, // 45% of screen width
  MAXIMUM: width * 0.5,       // 50% of screen width
};

// Helper function to calculate age from date of birth
const calculateAge = (dateOfBirth: string): number => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

// Helper function to transform RealUserProfile to ProfileData
const transformRealUserToProfileData = (realUser: RealUserProfile): ProfileData => {
  const actualAge = calculateAge(realUser.date_of_birth);
  
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
  
  const lookingFor = realUser.looking_for_debs ? [getLookingForText(realUser.looking_for_debs)] : [];
  
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
  
  const intentions = realUser.dating_intentions ? [getDatingIntentionText(realUser.dating_intentions)] : [];
  
  // Use interests from the profile or empty array
  const interests = realUser.interests || [];
  
  // Photos will be loaded separately from storage bucket
  const photos: string[] = [];
  
  // Use profile_prompts or empty object
  const profilePrompts = realUser.profile_prompts || {};
  
  return {
    id: realUser.id,
    name: `${realUser.first_name} ${realUser.username}`,
    age: actualAge,
    school: realUser.school_name || 'School not specified',
    gender: realUser.gender,
    lookingFor,
    datingIntentions: intentions,
    bio: realUser.bio,
    interests,
    profilePrompts,
    photos,
    lookingForFriendsOrDates: realUser.looking_for_friends_or_dates,
  };
};
import ScrollableProfileCard, { ProfileData } from '../../components/ScrollableProfileCard';
import { ReportService } from '../../services/reports';
import { LikesService } from '../../services/likes';
import { MatchingService } from '../../services/matching';
import { RealUserService, RealUserProfile } from '../../services/realUsers';
import { useUser } from '../../contexts/UserContext';

const { width: screenWidth } = Dimensions.get('window');
const SWIPE_THRESHOLD = screenWidth * 0.25;

export default function ProfileViewScreen() {
  const { id, source } = useLocalSearchParams();
  const { userProfile } = useUser();
  const isFromChat = source === 'chat';
  const [profile, setProfile] = useState<RealUserProfile | null>(null);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [hasLiked, setHasLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  
  // Haptic feedback ref
  const lastHapticLevel = useRef<string | null>(null);
  
  // Function to get haptic intensity based on swipe distance
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
  
  // Swipe animation values
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  // Function to load photos from storage bucket
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

  // Fetch the real user profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        console.log('Fetching profile for ID:', id);
        const result = await RealUserService.getUserProfileById(id as string);
        
        if (result.success && result.profile) {
          console.log('✅ Profile fetched successfully:', result.profile.first_name);
          setProfile(result.profile);
          const transformedProfile = transformRealUserToProfileData(result.profile);
          setProfileData(transformedProfile);
          
          // Load photos from storage bucket
          if (result.profile.username) {
            const photos = await loadPhotos(result.profile.id, result.profile.username);
            setProfileData(prev => prev ? { ...prev, photos } : null);
          }
        } else {
          console.error('❌ Failed to fetch profile:', result.error);
          // Navigate back if profile not found
          router.back();
        }
      } catch (error) {
        console.error('❌ Error fetching profile:', error);
        router.back();
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

  // Check if user has already liked this profile and if they've passed on them
  useEffect(() => {
    const checkUserStatus = async () => {
      if (!userProfile || !profile) return;
      
      try {
        // Check if already liked
        const alreadyLiked = await LikesService.hasLiked(userProfile.id, profile.id);
        setHasLiked(alreadyLiked);
        
        // Check if user has already passed on this profile
        const passedUsers = await MatchingService.getPassedUsers(userProfile.id);
        if (passedUsers.includes(profile.id)) {
          // User has already passed on this profile, redirect back
          console.log('User has already passed on this profile, redirecting back');
          router.back();
          return;
        }
      } catch (error) {
        console.error('Error checking user status:', error);
      }
    };

    checkUserStatus();
  }, [userProfile, profile]);

  // Handle like action
  const handleLike = async () => {
    if (!userProfile || !profile) return;
    
    // Haptic feedback for like
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      // Only record swipe if not viewing own profile
      if (userProfile.id !== profile.id) {
        // Record the swipe in the swipes table
        await MatchingService.recordSwipe(userProfile.id, profile.id, 'right');
      } else {
        console.log('Skipping swipe recording - viewing own profile');
      }
      
      console.log('Creating like for user:', userProfile.id, 'liking:', profile.id);
      const likeResult = await LikesService.createLike(userProfile.id, profile.id);
      
      if (likeResult) {
        console.log('✅ Like created successfully');
        setHasLiked(true);
        
        // Animate card off screen to the right
        Animated.timing(translateX, {
          toValue: screenWidth * 1.5,
          duration: 300,
          useNativeDriver: false,
        }).start(() => {
          // Navigate back to likes screen
          router.back();
        });
      } else {
        console.error('❌ Failed to create like');
      }
    } catch (error) {
      console.error('❌ Error creating like:', error);
    }
  };

  // Handle dislike action
  const handleDislike = async () => {
    if (!userProfile || !profile) return;
    
    // Haptic feedback for pass
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    try {
      // Only record swipe if not viewing own profile
      if (userProfile.id !== profile.id) {
        // Record the swipe in the database
        await MatchingService.recordSwipe(userProfile.id, profile.id, 'left');
      } else {
        console.log('Skipping swipe recording - viewing own profile');
      }
      
      console.log('Removing like for user:', userProfile.id, 'disliking:', profile.id);
      const removeResult = await LikesService.removeLike(userProfile.id, profile.id);
      
      if (removeResult) {
        console.log('✅ Like removed successfully');
        setHasLiked(false);
      }
      
      // Animate card off screen to the left
      Animated.timing(translateX, {
        toValue: -screenWidth * 1.5,
        duration: 300,
        useNativeDriver: false,
      }).start(() => {
        // Navigate back to likes screen
        router.back();
      });
    } catch (error) {
      console.error('❌ Error removing like:', error);
    }
  };


  // Swipe gesture handlers
  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX, translationY: translateY } }],
    { 
      useNativeDriver: false,
      listener: (event: any) => {
        // Disable haptic feedback if accessed from chat
        if (isFromChat) {
          return;
        }

        const { translationX } = event.nativeEvent;
        const absX = Math.abs(translationX);

        if (translationX > 0) {
          // Swiping right (like)
          const hapticInfo = getHapticIntensity(translationX, 'right');
          if (hapticInfo && lastHapticLevel.current !== hapticInfo.level) {
            Haptics.impactAsync(hapticInfo.style);
            lastHapticLevel.current = hapticInfo.level;
          }
        } else if (translationX < 0) {
          // Swiping left (pass)
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
    // Disable swiping if accessed from chat
    if (isFromChat) {
      return;
    }

    if (event.nativeEvent.state === State.BEGAN) {
      // Reset haptic level when gesture starts
      lastHapticLevel.current = null;
    } else if (event.nativeEvent.state === State.END) {
      const { translationX } = event.nativeEvent;

      if (translationX > SWIPE_THRESHOLD) {
        // Swipe right - Like
        handleLike();
      } else if (translationX < -SWIPE_THRESHOLD) {
        // Swipe left - Dislike
        handleDislike();
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

  // Like overlay opacity (pink) - shows when swiping right
  const likeOverlayOpacity = translateX.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  // Dislike overlay opacity (purple) - shows when swiping left
  const dislikeOverlayOpacity = translateX.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  // Handle report action - show modal
  const handleReport = () => {
    setShowReportModal(true);
  };


  // Show loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
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
          <TouchableOpacity onPress={() => router.push('/(tabs)/likes')} style={styles.backButton}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.push('/(tabs)/likes')}
        >
          <FontAwesome5 
            name="arrow-left" 
            size={20} 
            color="#c3b1e1" 
          />
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.reportButton}
          onPress={handleReport}
        >
          <FontAwesome5 
            name="flag" 
            size={20} 
            color="#FF4F81" 
          />
        </TouchableOpacity>
      </View>

      {/* Profile Card - Swipeable only if not from chat */}
      <View style={styles.cardContainer}>
        {isFromChat ? (
          // Static card when accessed from chat
          <View style={styles.staticCard}>
            <ScrollableProfileCard
              profile={profileData}
              onLike={undefined}
              onDislike={undefined}
              onReport={handleReport}
            />
          </View>
        ) : (
          // Swipeable card when accessed from other screens
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
              <ScrollableProfileCard
                profile={profileData}
                onLike={handleLike}
                onDislike={handleDislike}
                onReport={handleReport}
              />
              
              {/* Like Overlay - Pink */}
              <Animated.View
                style={[
                  styles.swipeOverlay,
                  styles.likeOverlay,
                  { opacity: likeOverlayOpacity }
                ]}
              >
                <FontAwesome5 name="heart" size={60} color="#FFFFFF" />
                <Text style={styles.swipeOverlayText}>LIKE</Text>
              </Animated.View>
              
              {/* Dislike Overlay - Red */}
              <Animated.View
                style={[
                  styles.swipeOverlay,
                  styles.dislikeOverlay,
                  { opacity: dislikeOverlayOpacity }
                ]}
              >
                <FontAwesome5 name="times" size={60} color="#FFFFFF" />
                <Text style={styles.swipeOverlayText}>NOPE</Text>
              </Animated.View>
            </Animated.View>
          </PanGestureHandler>
        )}
      </View>

      {/* Report Profile Modal */}
      {profile && (
        <ReportProfileModal
          visible={showReportModal}
          onClose={() => setShowReportModal(false)}
          reportedUserId={profile.id}
          reportedUserName={`${profile.first_name} (@${profile.username})`}
        />
      )}
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
  backButton: {
    minWidth: 40,
    minHeight: 40,
    padding: SPACING.sm,
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
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.sm,
  },
  reportButton: {
    minWidth: 40,
    minHeight: 40,
    padding: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
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
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  photoSection: {
    backgroundColor: '#FFFFFF',
    paddingBottom: 20,
  },
  photoContainer: {
    width: screenWidth,
    height: screenWidth,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  mainPhoto: {
    width: '100%',
    height: '100%',
  },
  photoNavigation: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  navButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  navButtonContent: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoIndicators: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  activeIndicator: {
    backgroundColor: '#FFFFFF',
  },
  profileInfo: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  nameAgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1B1B3A',
    marginRight: 12,
  },
  age: {
    fontSize: 20,
    color: '#666666',
  },
  school: {
    fontSize: 16,
    color: '#6C4AB6',
    marginBottom: 16,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 20,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666666',
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1B1B3A',
    marginBottom: 12,
  },
  bio: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333333',
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestTag: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  interestText: {
    fontSize: 14,
    color: '#666666',
  },
  promptContainer: {
    marginBottom: 16,
  },
  promptQuestion: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6C4AB6',
    marginBottom: 4,
  },
  promptAnswer: {
    fontSize: 16,
    lineHeight: 22,
    color: '#333333',
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
  },
  passButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF5F5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FF4F81',
  },
  likeButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F5F0FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#6C4AB6',
  },
  // Swipe-related styles
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
  staticCard: {
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
  likeOverlay: {
    backgroundColor: 'rgba(255, 79, 129, 0.8)',
  },
  dislikeOverlay: {
    backgroundColor: 'rgba(195, 177, 225, 0.8)', // New purple from design system with transparency
  },
  swipeOverlayText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
  },
});
