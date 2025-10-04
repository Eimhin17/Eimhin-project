import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Dimensions, Animated, Easing } from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { playLikeSwipeSuccessHaptic, playDislikeSwipeSuccessHaptic, playMatchCelebrationHaptic, playJoyfulButtonPressHaptic, playLightHaptic } from '../../utils/haptics';
import ReportProfileModal from '../../components/ReportProfileModal';
import BackButton from '../../components/ui/BackButton';
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
import { useMatchCreation } from '../../hooks/useMatchCreation';

const { width: screenWidth } = Dimensions.get('window');
const SWIPE_THRESHOLD = screenWidth * 0.25;

export default function ProfileViewScreen() {
  const { id, source } = useLocalSearchParams();
  const { userProfile } = useUser();
  const { checkAndCreateMatch } = useMatchCreation();
  const isFromChat = source === 'chat';
  const isFromLikes = source === 'likes';
  const [profile, setProfile] = useState<RealUserProfile | null>(null);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [hasLiked, setHasLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [currentUserPhotos, setCurrentUserPhotos] = useState<string[]>([]);

  // Match notification state
  const [showMatchNotification, setShowMatchNotification] = useState(false);
  const [matchedUser, setMatchedUser] = useState<any>(null);
  const [matchId, setMatchId] = useState<string | null>(null);

  // Match animation values
  const matchOverlayOpacity = useRef(new Animated.Value(0)).current;
  const matchScale = useRef(new Animated.Value(0.3)).current;
  const matchProfile1Scale = useRef(new Animated.Value(0.5)).current;
  const matchProfile2Scale = useRef(new Animated.Value(0.5)).current;
  const matchGlowPulse = useRef(new Animated.Value(1)).current;

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
  
  // Swipe animation values (match main swiping: horizontal + rotation)
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current; // -30..30 degrees as numeric, converted to deg string in transform

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

  // Load current user's photos for match notification
  useEffect(() => {
    const loadCurrentUserPhotos = async () => {
      if (!userProfile) return;

      try {
        const photosResult = await RealUserService.getUserPhotos(userProfile.id);
        if (photosResult.success && photosResult.photos) {
          setCurrentUserPhotos(photosResult.photos);
        }
      } catch (error) {
        console.error('Error loading current user photos:', error);
      }
    };

    loadCurrentUserPhotos();
  }, [userProfile]);

  // Animate match notification in with epic celebration
  const animateMatchNotificationIn = () => {
    // Play mega haptic celebration
    playMatchCelebrationHaptic();

    // Reset all animation values
    matchOverlayOpacity.setValue(0);
    matchScale.setValue(0.3);
    matchProfile1Scale.setValue(0.5);
    matchProfile2Scale.setValue(0.5);
    matchGlowPulse.setValue(1);

    // Sequence of delightful animations
    Animated.sequence([
      // 1. Fade in overlay with explosive entrance and profile pictures together
      Animated.parallel([
        Animated.timing(matchOverlayOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(matchScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        // Bounce profile pictures in immediately
        Animated.stagger(150, [
          Animated.spring(matchProfile1Scale, {
            toValue: 1,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.spring(matchProfile2Scale, {
            toValue: 1,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();

    // Continuous glow pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(matchGlowPulse, {
          toValue: 1.3,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(matchGlowPulse, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  // Handle like action
  const handleLike = async () => {
    if (!userProfile || !profile) return;

    // Match main swiping success haptic
    playLikeSwipeSuccessHaptic();

    setHasLiked(true);

    // Start animation immediately
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: screenWidth * 1.5,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(rotate, {
        toValue: 30,
        duration: 300,
        useNativeDriver: false,
      })
    ]).start();

    // Do backend operations in parallel with animation
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

        try {
          const matchResult = await checkAndCreateMatch(profile.id);
          console.log('🎯 Match result from profile view:', matchResult);

          // Check if it's a match
          if (matchResult?.isMatch) {
            console.log('🎉 Match created from profile view!');

            if (isFromLikes) {
              LikesService.removeLike(profile.id, userProfile.id).then(removed => {
                if (removed) {
                  console.log('✅ Removed incoming like after match creation');
                }
              });
            }

            // Wait for animation to complete before showing match notification
            setTimeout(() => {
              // Show match notification after card is off screen
              // Create hybrid object with photos from profileData and fields from profile
              setMatchedUser({
                ...profileData,
                first_name: profile.first_name,
                id: profile.id,
              });
              setMatchId(matchResult.matchId || null);
              setShowMatchNotification(true);
              animateMatchNotificationIn();
            }, 300);
          }
        } catch (matchError) {
          console.error('❌ Error creating match from profile view:', matchError);
        }
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

    // Match main swiping success haptic
    playDislikeSwipeSuccessHaptic();

    setHasLiked(false);

    // Start animation immediately
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: -screenWidth * 1.5,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(rotate, {
        toValue: -30,
        duration: 300,
        useNativeDriver: false,
      })
    ]).start();

    // Do backend operations in parallel with animation
    try {
      // Only record swipe if not viewing own profile
      if (userProfile.id !== profile.id) {
        // Record the swipe in the database
        await MatchingService.recordSwipe(userProfile.id, profile.id, 'left');
      } else {
        console.log('Skipping swipe recording - viewing own profile');
      }

      if (isFromLikes) {
        const removedIncoming = await LikesService.removeLike(profile.id, userProfile.id);
        if (removedIncoming) {
          console.log('✅ Removed incoming like from likes tab');
        }
      }

      console.log('Removing like for user:', userProfile.id, 'disliking:', profile.id);
      const removeResult = await LikesService.removeLike(userProfile.id, profile.id);

      if (removeResult) {
        console.log('✅ Like removed successfully');
      }
    } catch (error) {
      console.error('❌ Error removing like:', error);
    }
  };


  // Swipe gesture handlers (copied feel from main swiping: horizontal only, rotate based on X)
  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }], // Only track horizontal movement
    {
      useNativeDriver: false,
      listener: (event: any) => {
        if (isFromChat) return;

        const { translationX } = event.nativeEvent;

        // Update rotation based on horizontal swipe only (max ±30deg)
        const rotation = (translationX / screenWidth) * 30;
        rotate.setValue(rotation);

        // Lock vertical movement
        translateY.setValue(0);

        // Haptic feedback ramp identical to main swiping
        const getSwipeHapticInfo = (
          dx: number
        ): { level: string; sequence: Array<'selection' | 'light' | 'medium' | 'heavy'> } | null => {
          const absX = Math.abs(dx);
          if (absX >= screenWidth * 0.44) return { level: 'MAX', sequence: ['heavy', 'heavy', 'heavy'] };
          if (absX >= screenWidth * 0.36) return { level: 'HEAVY', sequence: ['heavy', 'heavy'] };
          if (absX >= screenWidth * 0.32) return { level: 'VERY_STRONG', sequence: ['heavy', 'medium'] };
          if (absX >= screenWidth * 0.28) return { level: 'STRONG', sequence: ['medium', 'medium'] };
          if (absX >= screenWidth * 0.24) return { level: 'MED_STRONG', sequence: ['medium'] };
          if (absX >= screenWidth * 0.20) return { level: 'MEDIUM', sequence: ['medium'] };
          if (absX >= screenWidth * 0.16) return { level: 'MED_LIGHT', sequence: ['light'] };
          if (absX >= screenWidth * 0.12) return { level: 'LIGHT', sequence: ['light'] };
          if (absX >= screenWidth * 0.08) return { level: 'VERY_LIGHT', sequence: ['selection'] };
          if (absX >= screenWidth * 0.05) return { level: 'TINY', sequence: ['selection'] };
          if (absX >= screenWidth * 0.03) return { level: 'MICRO', sequence: ['selection'] };
          if (absX >= screenWidth * 0.015) return { level: 'NANO', sequence: ['selection'] };
          return null;
        };

        const playHapticSequence = (sequence: Array<'selection' | 'light' | 'medium' | 'heavy'>) => {
          sequence.forEach((kind, idx) => {
            const delay = idx * 60;
            setTimeout(() => {
              switch (kind) {
                case 'selection':
                  Haptics.selectionAsync();
                  break;
                case 'light':
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  break;
                case 'medium':
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  break;
                case 'heavy':
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                  break;
              }
            }, delay);
          });
        };

        const h = getSwipeHapticInfo(translationX);
        if (h && lastHapticLevel.current !== h.level) {
          playHapticSequence(h.sequence);
          lastHapticLevel.current = h.level;
        } else if (Math.abs(translationX) < screenWidth * 0.015) {
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
        // Return to center with spring animation (X + rotation only)
        Animated.parallel([
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: false,
            tension: 100,
            friction: 8,
          }),
          Animated.spring(rotate, {
            toValue: 0,
            useNativeDriver: false,
            tension: 100,
            friction: 8,
          }),
        ]).start();
        // Keep vertical position locked
        translateY.setValue(0);
      }
    }
  };

  // Calculate rotation and scale based on movement
  const cardRotation = rotate.interpolate({
    inputRange: [-30, 30],
    outputRange: ['-30deg', '30deg'],
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
        <View style={styles.headerLeftContainer}>
          <BackButton
            onPress={() => router.push('/(tabs)/likes')}
          />
        </View>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        <View style={styles.headerRightContainer}>
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

        {/* Header Overlay for Match Notification */}
        {showMatchNotification && (
          <Animated.View style={[
            styles.headerOverlay,
            { opacity: matchOverlayOpacity }
          ]} />
        )}
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
            activeOffsetX={[-10, 10]} // Activate only on meaningful horizontal move
            failOffsetY={[-20, 20]}   // Fail if vertical movement exceeds 20px
            shouldCancelWhenOutside={false}
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
              
              {/* Enhanced Like Overlay - Pink with animations */}
              <Animated.View
                style={[
                  styles.swipeOverlay,
                  styles.likeOverlay,
                  {
                    opacity: likeOverlayOpacity,
                    transform: [{
                      scale: likeOverlayOpacity.interpolate({
                        inputRange: [0, 0.7, 1],
                        outputRange: [0.8, 1.05, 1.1],
                        extrapolate: 'clamp',
                      })
                    }]
                  }
                ]}
                pointerEvents="none"
              >
                <Animated.View style={{
                  transform: [{
                    scale: likeOverlayOpacity.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [1, 1.2, 1.3],
                      extrapolate: 'clamp',
                    })
                  }]
                }}>
                  <FontAwesome5 name="heart" size={60} color="#FFFFFF" />
                </Animated.View>
                <Animated.View style={{
                  transform: [{
                    translateY: likeOverlayOpacity.interpolate({
                      inputRange: [0, 1],
                      outputRange: [10, 0],
                      extrapolate: 'clamp',
                    })
                  }]
                }}>
                  <Text style={[styles.swipeOverlayText, { fontSize: 28, fontWeight: '800' }]}>LIKE</Text>
                </Animated.View>
              </Animated.View>

              {/* Enhanced Dislike Overlay - Purple with animations */}
              <Animated.View
                style={[
                  styles.swipeOverlay,
                  styles.dislikeOverlay,
                  {
                    opacity: dislikeOverlayOpacity,
                    transform: [{
                      scale: dislikeOverlayOpacity.interpolate({
                        inputRange: [0, 0.7, 1],
                        outputRange: [0.8, 1.05, 1.1],
                        extrapolate: 'clamp',
                      })
                    }]
                  }
                ]}
                pointerEvents="none"
              >
                <Animated.View style={{
                  transform: [{
                    scale: dislikeOverlayOpacity.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [1, 1.2, 1.3],
                      extrapolate: 'clamp',
                    }),
                  }, {
                    rotate: dislikeOverlayOpacity.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '90deg'],
                      extrapolate: 'clamp',
                    })
                  }]
                }}>
                  <FontAwesome5 name="times" size={60} color="#FFFFFF" />
                </Animated.View>
                <Animated.View style={{
                  transform: [{
                    translateY: dislikeOverlayOpacity.interpolate({
                      inputRange: [0, 1],
                      outputRange: [10, 0],
                      extrapolate: 'clamp',
                    })
                  }]
                }}>
                  <Text style={[styles.swipeOverlayText, { fontSize: 28, fontWeight: '800' }]}>NOPE</Text>
                </Animated.View>
              </Animated.View>
            </Animated.View>
          </PanGestureHandler>
        )}
      </View>

      {/* Match Notification */}
      {showMatchNotification && matchedUser && (
        <Animated.View style={[
          styles.matchNotification,
          { opacity: matchOverlayOpacity }
        ]}>
          <Animated.View style={[
            styles.matchNotificationContent,
            { transform: [{ scale: matchScale }] }
          ]}>
            {/* Match Title */}
            <View style={styles.matchTitleContainer}>
              <Text style={styles.matchNotificationTitle}>It's a Match!</Text>
            </View>

            {/* Match Description with Profile Pictures */}
            <View style={styles.matchProfilesContainer}>
              <Animated.View style={[
                styles.matchProfileContainer,
                { transform: [{ scale: matchProfile1Scale }] }
              ]}>
                {currentUserPhotos.length > 0 ? (
                  <Image
                    source={{ uri: currentUserPhotos[0] }}
                    style={styles.matchProfileImage}
                    contentFit="cover"
                  />
                ) : (
                  <View style={styles.matchProfilePlaceholder}>
                    <FontAwesome5 name="user" size={20} color="#FF4F81" />
                  </View>
                )}
                <Text style={styles.matchProfileName}>{userProfile?.firstName}</Text>
              </Animated.View>

              <Animated.View style={[
                styles.matchHeartContainer,
                { transform: [{ scale: matchGlowPulse }] }
              ]}>
                <FontAwesome5 name="heart" size={24} color="#FF4F81" />
              </Animated.View>

              <Animated.View style={[
                styles.matchProfileContainer,
                { transform: [{ scale: matchProfile2Scale }] }
              ]}>
                {matchedUser.photos && matchedUser.photos.length > 0 ? (
                  <Image
                    source={{ uri: matchedUser.photos[0] }}
                    style={styles.matchProfileImage}
                    contentFit="cover"
                  />
                ) : (
                  <View style={styles.matchProfilePlaceholder}>
                    <FontAwesome5 name="user" size={20} color="#FF4F81" />
                  </View>
                )}
                <Text style={styles.matchProfileName}>{matchedUser.first_name}</Text>
              </Animated.View>
            </View>

            <Text style={styles.matchNotificationText}>
              You both liked each other!
            </Text>

            {/* Match Buttons */}
            <View style={styles.matchNotificationButtons}>
              <TouchableOpacity
                style={styles.matchChatButton}
                onPress={() => {
                  playJoyfulButtonPressHaptic();
                  setShowMatchNotification(false);
                  // Navigate to chat using match ID
                  if (matchId) {
                    router.push(`/chat/${matchId}?name=${encodeURIComponent(matchedUser.first_name)}&userId=${matchedUser.id}`);
                  }
                }}
              >
                <Text style={styles.matchChatButtonText}>Chat</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.matchKeepSwipingButton}
                onPress={() => {
                  playLightHaptic();
                  setShowMatchNotification(false);
                  // Ensure we land on Likes when coming from Likes preview
                  if (isFromLikes) {
                    router.replace('/(tabs)/likes');
                  } else {
                    // Fallback to previous screen
                    router.back();
                  }
                }}
              >
                <Text style={styles.matchKeepSwipingButtonText} numberOfLines={1}>Ok</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      )}

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
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.md,
    backgroundColor: '#FFFFFF',
    minHeight: 60,
    zIndex: 1000,
  },
  headerLeftContainer: {
    width: 72,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerRightContainer: {
    width: 72,
    alignItems: 'flex-end',
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
    zIndex: 999,
  },
  likeOverlay: {
    backgroundColor: 'rgba(255, 79, 129, 0.85)',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  dislikeOverlay: {
    backgroundColor: 'rgba(195, 177, 225, 0.85)',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  swipeOverlayText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 15,
    letterSpacing: 3,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  // Match Notification Styles
  matchNotification: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    backdropFilter: 'blur(20px)',
  },
  matchNotificationContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 32,
    alignItems: 'center',
    width: screenWidth * 0.78,
    shadowColor: '#FF4F81',
    shadowOffset: {
      width: 0,
      height: 20,
    },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 20,
    borderWidth: 3,
    borderColor: 'rgba(255, 79, 129, 0.2)',
  },
  matchTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  matchNotificationTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1B1B3A',
    marginBottom: 12,
    textAlign: 'center',
  },
  matchNotificationText: {
    fontSize: 18,
    color: '#6C4AB6',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  matchProfilesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SPACING.lg,
  },
  matchProfileContainer: {
    alignItems: 'center',
    marginHorizontal: SPACING.sm,
  },
  matchProfileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#FF4F81',
  },
  matchProfilePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF0F5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FF4F81',
  },
  matchProfileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF4F81',
    marginTop: 8,
    textAlign: 'center',
  },
  matchHeartContainer: {
    marginHorizontal: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchNotificationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 16,
  },
  matchChatButton: {
    backgroundColor: '#FF4F81',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 18,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF4F81',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  matchChatButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  matchKeepSwipingButton: {
    backgroundColor: '#F8F9FA',
    paddingVertical: 22,
    paddingHorizontal: 32,
    borderRadius: 18,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#6C4AB6',
    shadowColor: '#6C4AB6',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  matchKeepSwipingButtonText: {
    color: '#6C4AB6',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 16,
    fontFamily: Fonts.semiBold,
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    zIndex: 10,
    pointerEvents: 'none',
  },
});
