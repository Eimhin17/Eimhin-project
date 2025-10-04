import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Modal,
  TextInput,
  Animated,
  Easing,
} from 'react-native';
import { Image } from 'expo-image';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
// import { BlurView } from 'expo-blur';
import { router, useFocusEffect } from 'expo-router';
// import { ViewShot } from 'react-native-view-shot';
import { Button, BackButton } from '../../components/ui';
import { useFilters } from '../../contexts/FilterContext';
import { useMatchCreation } from '../../hooks/useMatchCreation';
import { RealUserService, RealUserProfile } from '../../services/realUsers';
import { MatchingService } from '../../services/matching';
import ReportProfileModal from '../../components/ReportProfileModal';
import { useUser } from '../../contexts/UserContext';
import { useMatchNotification } from '../../contexts/MatchNotificationContext';
import ScrollableProfileCard, { ProfileData } from '../../components/ScrollableProfileCard';
import { CardRevealAnimation } from '../../components/animations/CardRevealAnimation';
import { TinderCardStack } from '../../components/TinderCardStack';
import { ReportService } from '../../services/reports';
import { ScreenshotService } from '../../services/screenshot';
import { LikesService } from '../../services/likes';
import { captureRef } from 'react-native-view-shot';
import { useCustomFonts, Fonts } from '../../utils/fonts';
import { SPACING, BORDER_RADIUS } from '../../utils/constants';
import { shuffleArray } from '../../utils/shuffleArray';
import * as Haptics from 'expo-haptics';
import { profilePreloader } from '../../services/profilePreloader';
import { attachProgressHaptics, playLightHaptic, playJoyfulButtonPressHaptic, playLikeSwipeSuccessHaptic, playDislikeSwipeSuccessHaptic, playMatchCelebrationHaptic } from '../../utils/haptics';
import { FiltersAppliedPopup } from '../../components/FiltersAppliedPopup';
import { useTabPreloader } from '../../hooks/useTabPreloader';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const fontsLoaded = useCustomFonts();
  const { filters, resetFilters, showFiltersAppliedPopup, setShowFiltersAppliedPopup, getActiveFiltersCount } = useFilters();
  const { checkAndCreateMatch } = useMatchCreation();
  const matchNotificationContext = useMatchNotification();

  // Preload adjacent tab data
  useTabPreloader({ currentTab: 'index' });

  // Debug: Check if function exists
  console.log('🔍 checkAndCreateMatch in component:', typeof checkAndCreateMatch);
  const { userProfile } = useUser();
  
  // Unified profile interface for both real and mock users
  interface UnifiedProfile extends ProfileData {
    isRealUser: boolean;
  }

  // Only real user profiles
  const [allProfiles, setAllProfiles] = useState<UnifiedProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false); // Changed to false for immediate UI
  
  const [currentUserIndex, setCurrentUserIndex] = useState(0);
  const [likedUsers, setLikedUsers] = useState<string[]>([]);
  const [passedUsers, setPassedUsers] = useState<string[]>([]);
  const [isReviewMode, setIsReviewMode] = useState(false); // Indicates user is reviewing passed profiles
  const [reviewedProfilesInSession, setReviewedProfilesInSession] = useState<string[]>([]); // Track profiles swiped during review session
  const [showReviewPrompt, setShowReviewPrompt] = useState(false); // Show popup asking to review profiles
  const [promptShownOnce, setPromptShownOnce] = useState(false); // Track if we've shown the prompt for this empty state

  // Review prompt animation values
  const reviewPromptScale = useRef(new Animated.Value(0.8)).current;
  const reviewPromptOpacity = useRef(new Animated.Value(0)).current;

  const [showMatchNotification, setShowMatchNotification] = useState(false);
  const [matchedUser, setMatchedUser] = useState<any>(null);
  const [matchId, setMatchId] = useState<string | null>(null);

  // Match animation values - use context's matchOverlayOpacity for footer sync
  const matchOverlayOpacity = matchNotificationContext.matchOverlayOpacity;
  const matchScale = useRef(new Animated.Value(0.3)).current;
  const matchHeartScale = useRef(new Animated.Value(0)).current;
  const matchSparkle1Rotation = useRef(new Animated.Value(0)).current;
  const matchSparkle2Rotation = useRef(new Animated.Value(0)).current;
  const matchProfile1Scale = useRef(new Animated.Value(0.5)).current;
  const matchProfile2Scale = useRef(new Animated.Value(0.5)).current;
  const matchGlowPulse = useRef(new Animated.Value(1)).current;
  const [reportedUsers, setReportedUsers] = useState<string[]>([]);
  const [showCustomReportModal, setShowCustomReportModal] = useState(false);
  const [customReportReason, setCustomReportReason] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ============================================================================
  // STABLE DISPLAY BUFFER PATTERN
  // ============================================================================
  // This pattern solves the "idle state flash" and "disappearing card" problems.
  //
  // The Problem:
  // - Cards animate over 300ms but React state updates instantly
  // - Updating filteredUsers immediately causes array to shift during animation
  // - TinderCardStack's index-based system breaks when array changes mid-animation
  //
  // The Solution:
  // - Maintain a separate "display buffer" that TinderCardStack renders from
  // - Only update the display buffer AFTER animations complete
  // - This keeps the array and indices stable during animation
  // ============================================================================
  const [displayProfiles, setDisplayProfiles] = useState<UnifiedProfile[]>([]);
  const pendingSwipes = useRef<Map<string, 'left' | 'right'>>(new Map());

  // Sidebar state
  const [showSidebar, setShowSidebar] = useState(false);
  const [lookingForPreference, setLookingForPreference] = useState<'dates' | 'friends' | 'both'>('both');

  // Sidebar animation
  const sidebarTranslateX = useRef(new Animated.Value(-width * 0.8)).current;
  const sidebarOpacity = useRef(new Animated.Value(0)).current;

  // Back button animation (matching onboarding pattern)
  const backButtonScale = useRef(new Animated.Value(1)).current;
  const backButtonOpacity = useRef(new Animated.Value(1)).current;

  // Button selection animations (matching onboarding looking-for page)
  const buttonAnimValue = useRef(new Animated.Value(0)).current;
  const buttonScaleValue = useRef(new Animated.Value(1)).current;
  const [animatingButton, setAnimatingButton] = useState<string | null>(null);

  // Filter button animation
  const filterButtonScale = useRef(new Animated.Value(1)).current;

  // Idle image fade animation - start at 0 for smooth fade-in
  const idleImageOpacity = useRef(new Animated.Value(0)).current;

  // Animate idle image opacity when cards change
  useEffect(() => {
    const length = displayProfiles?.length ?? 0;
    console.log('🖼️ Idle image animation check - displayProfiles.length:', length);

    if (!displayProfiles || displayProfiles.length === 0) {
      console.log('🖼️ Fading in idle image');
      // Fade in idle image smoothly when no cards left
      Animated.timing(idleImageOpacity, {
        toValue: 1,
        duration: 300, // Match card animation duration
        useNativeDriver: false,
        easing: Easing.out(Easing.ease),
      }).start(() => {
        console.log('🖼️ Idle image fade-in complete');
      });
    } else {
      console.log('🖼️ Hiding idle image');
      // Instantly hide when cards are present (no fade out needed)
      idleImageOpacity.setValue(0);
    }
  }, [displayProfiles]);

  // Load current looking for preference from user profile
  useEffect(() => {
    if (userProfile && 'looking_for_friends_or_dates' in userProfile) {
      const preference = (userProfile as any).looking_for_friends_or_dates;
      if (preference) {
        setLookingForPreference(preference as 'dates' | 'friends' | 'both');
      }
    }
  }, [userProfile]);

  // Sync match notification state with context for footer overlay
  useEffect(() => {
    matchNotificationContext.setShowMatchNotification(showMatchNotification);
  }, [showMatchNotification]);

  const profileCardRef = useRef<any>(null);


  // Function to transform real user profiles to unified format (without photos initially)
  const transformRealUserToUnified = (realUser: RealUserProfile): UnifiedProfile => {
    // Calculate age from date of birth
    const birthDate = new Date(realUser.date_of_birth);
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

    // Photos will be loaded asynchronously later for better performance
    const photos: string[] = [];

    const interests = realUser.interests || [];
    const profilePrompts = realUser.profile_prompts || {};

    console.log('🖼️ Final photos array:', photos);
    console.log('🖼️ Photos length:', photos.length);
    
    if (interests.length === 0) {
      interests.push('Getting to know people', 'Having fun', 'Making connections');
    }
    
    if (Object.keys(profilePrompts).length === 0) {
      profilePrompts['My ideal first date is...'] = realUser.bio || 'Ask me about it!';
      profilePrompts['I\'m looking for someone who...'] = `Is interested in ${getLookingForText(realUser.looking_for_debs)}`;
      profilePrompts['My biggest fear is...'] = 'Ask me in person!';
      profilePrompts['My friends would describe me as...'] = 'Friendly and genuine';
      profilePrompts['My love language is...'] = 'Quality time and good conversations';
    }

    const transformedProfile = {
      id: realUser.id,
      name: `${realUser.first_name} ${realUser.username}`,
      age: actualAge,
      school: realUser.school_name || 'School not specified',
      county: realUser.county || null,
      gender: realUser.gender,
      lookingFor,
      datingIntentions: intentions,
      bio: realUser.bio,
      interests,
      relationshipStatus: realUser.relationship_status,
      profilePrompts,
      photos,
      lookingForFriendsOrDates: realUser.looking_for_friends_or_dates,
      blockedSchools: realUser.blocked_schools || [],
      isRealUser: true,
    };

    console.log('🔄 Transformed profile for user:', realUser.id, {
      name: transformedProfile.name,
      bio: transformedProfile.bio,
      interests: transformedProfile.interests,
      photos: transformedProfile.photos,
      profilePrompts: transformedProfile.profilePrompts,
      lookingFor: transformedProfile.lookingFor,
      datingIntentions: transformedProfile.datingIntentions
    });

    return transformedProfile;
  };


  // Function to refresh profiles - only real users
  const refreshProfiles = async () => {
    console.log('🔄 refreshProfiles called');
    console.log('- userProfile:', userProfile);
    console.log('- likedUsers:', likedUsers);
    console.log('- passedUsers:', passedUsers);

    // Load profiles in background without showing loading state
    try {
      // Check for preloaded profile first
      const preloadedProfile = profilePreloader.getPreloadedProfile();
      if (preloadedProfile) {
        console.log('⚡ Using preloaded profile:', preloadedProfile.name);
        setAllProfiles([preloadedProfile]);

        // Load remaining profiles in background
        loadRemainingProfiles();
        return;
      }

      // Use a default user ID if no user profile exists
      const currentUserId = userProfile?.id || 'default-user-id';
      console.log('- Using currentUserId:', currentUserId);
      
      // Fetch passed users from database and update local state
      const passedUserIds = await MatchingService.getPassedUsers(currentUserId);
      console.log('- Fetched passed users from DB:', passedUserIds);

      // Update local state to match database
      setPassedUsers(passedUserIds);

      const result = await RealUserService.getUserProfilesForSwiping(
        currentUserId,
        [...likedUsers, ...passedUserIds]
      );
      
      console.log('- RealUserService result:', result);
      
      if (result.success && result.profiles) {
        console.log('- Setting real user profiles:', result.profiles.length);
        console.log('- Raw profiles data:', result.profiles);
        try {
          // Transform real users to unified format (synchronous now)
          console.log('- Transforming profiles...');
          const transformedRealUsers = result.profiles.map(transformRealUserToUnified);
          const shuffledRealUsers = shuffleArray(transformedRealUsers);
          
          console.log('- Transformed profiles:', shuffledRealUsers.length);
          console.log('- Transformed profiles data:', shuffledRealUsers);
          
          // Only use real user profiles
          setAllProfiles(shuffledRealUsers);
          
          console.log(`✅ Loaded ${shuffledRealUsers.length} real user profiles`);
          console.log('- allProfiles state after setAllProfiles:', shuffledRealUsers);
          
          // Load photos asynchronously for better performance
          loadPhotosAsync(shuffledRealUsers);
        } catch (error) {
          console.error('Error transforming real user profiles:', error);
          setAllProfiles([]);
        }
      } else {
        // No real users found
        console.log('⚠️ No real users found, result:', result);
        setAllProfiles([]);
      }
    } catch (error) {
      console.error('Error fetching real user profiles:', error);
      setAllProfiles([]);
      console.log('❌ Error occurred, no profiles loaded');
    }
    // Removed finally block with setIsLoading(false) for seamless experience
  };

  // Function to load remaining profiles in background after using preloaded one
  const loadRemainingProfiles = async () => {
    try {
      const currentUserId = userProfile?.id || 'default-user-id';
      const passedUserIds = await MatchingService.getPassedUsers(currentUserId);

      // Update local state to match database
      setPassedUsers(passedUserIds);

      const result = await RealUserService.getUserProfilesForSwiping(
        currentUserId,
        [...likedUsers, ...passedUserIds]
      );
      
      if (result.success && result.profiles) {
        const transformedRealUsers = result.profiles.map(transformRealUserToUnified);
        const shuffledRealUsers = shuffleArray(transformedRealUsers);
        setAllProfiles(shuffledRealUsers);
        loadPhotosAsync(shuffledRealUsers);
      }
    } catch (error) {
      console.error('Error loading remaining profiles:', error);
    }
  };

  // Function to load photos asynchronously for better performance
  const loadPhotosAsync = async (profiles: UnifiedProfile[]) => {
    console.log('🖼️ Loading photos asynchronously for', profiles.length, 'profiles');

    if (profiles.length === 0) return;

    // 1) Prioritize first visible profile for instant display
    try {
      const first = profiles[0];
      const firstPhotos = await RealUserService.getUserPhotos(first.id);
      if (firstPhotos.success && firstPhotos.photos) {
        // Prefetch first 1-2 photos to disk cache
        try {
          await Image.prefetch(firstPhotos.photos.slice(0, 2), { cachePolicy: 'disk' });
        } catch {}
        setAllProfiles(prev => prev.map(p => p.id === first.id ? { ...p, photos: firstPhotos.photos! } : p));
      }
    } catch (e) {
      console.error('❌ Error fetching first profile photos:', e);
    }

    // 2) Load remaining photos in small batches
    const batchSize = 5;
    const remaining = profiles.slice(1);
    for (let i = 0; i < remaining.length; i += batchSize) {
      const batch = remaining.slice(i, i + batchSize);

      const photoPromises = batch.map(async (profile) => {
        try {
          const photosResult = await RealUserService.getUserPhotos(profile.id);
          if (photosResult.success && photosResult.photos) {
            return { profileId: profile.id, photos: photosResult.photos };
          }
          return { profileId: profile.id, photos: [] };
        } catch (error) {
          console.error('❌ Error fetching photos for profile', profile.id, error);
          return { profileId: profile.id, photos: [] };
        }
      });

      const photoResults = await Promise.all(photoPromises);

      setAllProfiles(prevProfiles => 
        prevProfiles.map(profile => {
          const photoResult = photoResults.find(r => r.profileId === profile.id);
          if (photoResult) {
            return { ...profile, photos: photoResult.photos };
          }
          return profile;
        })
      );

      if (i + batchSize < remaining.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log('✅ Finished loading photos asynchronously');
  };

  const handlePullToRefresh = () => {
    if (isRefreshing) {
      return;
    }

    setIsRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setAllProfiles(prevProfiles => shuffleArray(prevProfiles));
    setCurrentUserIndex(0);

    setTimeout(() => {
      setIsRefreshing(false);
    }, 400);
  };

  // Animate review prompt in with bounce
  const animateReviewPromptIn = () => {
    // Play haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Reset animation values
    reviewPromptScale.setValue(0.8);
    reviewPromptOpacity.setValue(0);

    // Animate in with bounce
    Animated.parallel([
      Animated.spring(reviewPromptScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.timing(reviewPromptOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Animate review prompt out
  const animateReviewPromptOut = (callback?: () => void) => {
    Animated.parallel([
      Animated.timing(reviewPromptScale, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(reviewPromptOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowReviewPrompt(false);
      if (callback) callback();
    });
  };

  // Animate match notification in with epic celebration
  const animateMatchNotificationIn = () => {
    // Play mega haptic celebration
    playMatchCelebrationHaptic();

    // Reset all animation values
    matchOverlayOpacity.setValue(0);
    matchScale.setValue(0.3);
    matchHeartScale.setValue(0);
    matchSparkle1Rotation.setValue(0);
    matchSparkle2Rotation.setValue(0);
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

  // Fetch real user profiles on component mount only
  // refreshProfiles now also loads swipe history from DB to prevent re-showing swiped profiles
  useEffect(() => {
    refreshProfiles();
    // Ensure reports storage bucket exists
    ScreenshotService.ensureReportsBucket();
  }, []); // Only run once on mount - don't refetch on swipe changes

  // Filter profiles based on active filters
  const filteredUsers = useMemo(() => {
    console.log('🔍 getFilteredUsers called');
    console.log('- allProfiles count:', allProfiles.length);
    console.log('- allProfiles data:', allProfiles);
    console.log('- filters:', filters);
    console.log('- likedUsers:', likedUsers);
    console.log('- passedUsers:', passedUsers);
    console.log('- reviewMode:', isReviewMode);

    // Don't filter if we're still loading profiles
    if (allProfiles.length === 0) {
      console.log('⚠️ No profiles to filter yet, returning empty array');
      return [];
    }

    const filtered = allProfiles.filter(user => {
      console.log(`🔍 Filtering user: ${user.name} (${user.gender})`);

      // Always skip liked users (preserves match integrity)
      if (likedUsers.includes(user.id)) {
        console.log(`❌ Filtered out - already liked: ${user.name}`);
        return false;
      }

      // In review mode, INCLUDE passed users (allow re-swiping)
      // But EXCLUDE profiles already reviewed in this session
      if (isReviewMode && reviewedProfilesInSession.includes(user.id)) {
        console.log(`❌ Filtered out - already reviewed in this session: ${user.name}`);
        return false;
      }

      // In normal mode, EXCLUDE passed users
      if (!isReviewMode && passedUsers.includes(user.id)) {
        console.log(`❌ Filtered out - already passed: ${user.name}`);
        return false;
      }
      
      // Filter by blocked schools - check if current user's school is blocked by this profile
      if (userProfile?.school && user.blockedSchools && user.blockedSchools.length > 0) {
        if (user.blockedSchools.includes(userProfile.school)) {
          console.log(`❌ Filtered out - current user's school "${userProfile.school}" is blocked by ${user.name}`);
          return false;
        }
      }
      
      // Filter by blocked schools - check if this profile's school is blocked by current user
      if (user.blockedSchools && user.blockedSchools.length > 0 && userProfile?.blockedSchools && userProfile.blockedSchools.length > 0) {
        if (userProfile.blockedSchools.includes(user.school)) {
          console.log(`❌ Filtered out - profile's school "${user.school}" is blocked by current user`);
          return false;
        }
      }
      
      // Filter by gender
      if (filters.selectedGenders.length > 0) {
        // Map database gender values to filter IDs
        let normalizedGender = user.gender.toLowerCase();
        if (normalizedGender === 'non_binary') {
          normalizedGender = 'non-binary';
        }
        
        if (!filters.selectedGenders.includes(normalizedGender)) {
          console.log(`❌ Filtered out by gender: ${user.gender} (normalized: ${normalizedGender}) not in ${filters.selectedGenders}`);
          return false;
        }
      }
      
      // Filter by school
      if (filters.selectedSchools.length > 0 && !filters.selectedSchools.includes(user.school)) {
        console.log(`❌ Filtered out by school: ${user.school} not in ${filters.selectedSchools}`);
        return false;
      }
      
      // Filter by county
      if (filters.selectedCounties.length > 0 && user.county && !filters.selectedCounties.includes(user.county)) {
        console.log(`❌ Filtered out by county: ${user.county} not in ${filters.selectedCounties}`);
        return false;
      }
      
      // Filter by looking for
      if (filters.selectedLookingFor.length > 0) {
        const hasMatchingLookingFor = user.lookingFor.some(option => {
          // Map the profile option to the filter ID format
          let normalizedOption = option.toLowerCase().replace(/\s+/g, '-').replace(/'/g, '');
          
          // Handle specific mappings
          if (normalizedOption === 'go-to-someones-debs') {
            normalizedOption = 'go-to-debs';
          } else if (normalizedOption === 'bring-someone-to-my-debs') {
            normalizedOption = 'bring-to-debs';
          }
          
          return filters.selectedLookingFor.includes(normalizedOption);
        });
        
        if (!hasMatchingLookingFor) {
          console.log(`❌ Filtered out by looking for: ${user.lookingFor} not matching ${filters.selectedLookingFor}`);
          return false;
        }
      }
      
      // Filter by common interests
      if (filters.minCommonInterests > 0) {
        // Calculate common interests between current user and profile user
        const currentUserInterests = userProfile?.interests || [];
        const profileUserInterests = user.interests || [];
        
        // Find common interests (case-insensitive comparison)
        const commonInterests = currentUserInterests.filter(currentInterest =>
          profileUserInterests.some(profileInterest =>
            currentInterest.toLowerCase() === profileInterest.toLowerCase()
          )
        );
        
        if (commonInterests.length < filters.minCommonInterests) {
          console.log(`❌ Filtered out by common interests: ${commonInterests.length} < ${filters.minCommonInterests} (current user: ${currentUserInterests.length}, profile: ${profileUserInterests.length})`);
          return false;
        }
      }
      
      // Filter by dating intentions
      if (filters.selectedDatingIntentions.length > 0) {
        // Check if user's dating intention matches any selected intentions
        const hasMatchingIntention = user.datingIntentions.some(intention => {
          // Map the user-friendly text back to the database format
          let normalizedIntention = intention.toLowerCase().replace(/\s+/g, '_').replace(/but/g, 'but');
          
          // Handle specific mappings
          if (normalizedIntention === 'one_night_thing') {
            normalizedIntention = 'one_night_thing';
          } else if (normalizedIntention === 'short_term_only') {
            normalizedIntention = 'short_term_only';
          } else if (normalizedIntention === 'short_term_but_open_to_long_term') {
            normalizedIntention = 'short_term_but_open_to_long_term';
          } else if (normalizedIntention === 'long_term_only') {
            normalizedIntention = 'long_term_only';
          } else if (normalizedIntention === 'long_term_but_open_to_short_term') {
            normalizedIntention = 'long_term_but_open_to_short_term';
          }
          
          return filters.selectedDatingIntentions.includes(normalizedIntention);
        });
        
        if (!hasMatchingIntention) {
          console.log(`❌ Filtered out by dating intentions: ${user.datingIntentions} not matching ${filters.selectedDatingIntentions}`);
          return false;
        }
      }
      
      // Filter by relationship status
      if (filters.selectedRelationshipStatuses.length > 0) {
        // Check if user's relationship status matches any selected statuses
        const hasMatchingStatus = filters.selectedRelationshipStatuses.includes(user.relationshipStatus);
        
        if (!hasMatchingStatus) {
          console.log(`❌ Filtered out by relationship status: ${user.relationshipStatus} not in ${filters.selectedRelationshipStatuses}`);
          return false;
        }
      }
      
      console.log(`✅ User passed all filters: ${user.name}`);
      return true;
    });
    
    const shuffledFiltered = shuffleArray(filtered);

    console.log(`🔍 Filtered users result: ${shuffledFiltered.length} profiles (randomized order)`);

    // Do not show the prompt immediately here; we'll trigger it
    // via a delayed effect so the user can see the last swipe finish.

    // Reset promptShownOnce when we have profiles again
    if (shuffledFiltered.length > 0 && promptShownOnce) {
      setPromptShownOnce(false);
    }

    return shuffledFiltered;
  }, [allProfiles, filters, likedUsers, passedUsers, isReviewMode, reviewedProfilesInSession, showReviewPrompt, promptShownOnce]);

  // Delay the empty-state review prompt by 1 second after the stack becomes empty
  useEffect(() => {
    // Only schedule when truly empty and we haven't shown it for this empty state
    if (filteredUsers.length === 0 && !showReviewPrompt && !promptShownOnce && passedUsers.length > 0) {
      const timeout = setTimeout(() => {
        // Re-check conditions at timeout to avoid stale triggers
        if (filteredUsers.length === 0 && !showReviewPrompt && !promptShownOnce && passedUsers.length > 0) {
          console.log('⏱️ Delayed: showing review prompt after last swipe');
          setShowReviewPrompt(true);
          setPromptShownOnce(true);
          animateReviewPromptIn();
        }
      }, 1000);

      return () => clearTimeout(timeout);
    }
  }, [filteredUsers.length, showReviewPrompt, promptShownOnce, passedUsers.length]);
  
  // Log filtering results for debugging
  useEffect(() => {
    console.log(`🔍 DEBUG: Filters applied: ${filteredUsers.length} profiles match out of ${allProfiles.length} total`);
    console.log('🔍 DEBUG: Active filters:', {
      genders: filters.selectedGenders,
      schools: filters.selectedSchools,
      counties: filters.selectedCounties,
      lookingFor: filters.selectedLookingFor,
      minInterests: filters.minCommonInterests,
      datingIntentions: filters.selectedDatingIntentions,
      relationshipStatuses: filters.selectedRelationshipStatuses
    });
    
    // Log profile details for debugging
    if (allProfiles.length > 0) {
      console.log('🔍 DEBUG: Available profiles:', allProfiles.map(p => ({
        id: p.id,
        name: p.name,
        school: p.school,
        county: p.county,
        gender: p.gender
      })));
    }
  }, [filteredUsers.length, allProfiles.length, filters, allProfiles]);
  
  // Reset current user index when filters change
  useEffect(() => {
    setCurrentUserIndex(0);
  }, [filters.selectedGenders, filters.selectedSchools, filters.selectedCounties, filters.selectedLookingFor, filters.minCommonInterests, filters.selectedDatingIntentions, filters.selectedRelationshipStatuses]);
  
  // Update display buffer when filteredUsers changes (but only when no pending swipes)
  useEffect(() => {
    if (pendingSwipes.current.size === 0) {
      // No animations in progress, update display buffer immediately
      setDisplayProfiles(filteredUsers);
    }
    // If there are pending swipes, the display buffer will update after animation completes
  }, [filteredUsers]);

  // Reset current user index when display profiles change
  useEffect(() => {
    // If current index is out of bounds, reset to 0
    if (currentUserIndex >= displayProfiles.length && displayProfiles.length > 0) {
      console.log('🔄 Resetting currentUserIndex from', currentUserIndex, 'to 0 because it was out of bounds');
      setCurrentUserIndex(0);
    }
  }, [displayProfiles.length, currentUserIndex]);

  const currentUser = displayProfiles[currentUserIndex];
  
  console.log('🔍 Current state:', {
    currentUserIndex,
    filteredUsersLength: filteredUsers.length,
    displayProfilesLength: displayProfiles.length,
    currentUser: currentUser ? currentUser.name : 'No user',
    hasCurrentUser: !!currentUser,
    pendingSwipesCount: pendingSwipes.current.size
  });

  // Remove loading state for seamless card experience
  // Profiles will load in background while showing interface

  // Show the interface even when no profiles are available
  // This prevents the loading flash and maintains smooth UX

  const handleSwipe = async (direction: 'left' | 'right', profile: ProfileData) => {
    if (!userProfile) return;

    console.log(`🎯 handleSwipe: ${direction} on profile ${profile.name} (${profile.id})`);

    // PHASE 1: Add to pending swipes (prevents display buffer from updating)
    pendingSwipes.current.set(profile.id, direction);

    // Play haptic feedback immediately
    if (direction === 'right') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Start database operations asynchronously (don't block)
    if (direction === 'right') {
      // Record the swipe and create like in database
      MatchingService.recordSwipe(userProfile.id, profile.id, 'right');

      LikesService.createLike(userProfile.id, profile.id).then(likeResult => {
        if (likeResult) {
          // Check if this creates a match
          checkAndCreateMatch(profile.id).then(matchResult => {
            if (matchResult.isMatch) {
              setMatchedUser(profile);
              setMatchId(matchResult.matchId || null);
              setShowMatchNotification(true);
              animateMatchNotificationIn();
            }
          }).catch(error => {
            console.error('❌ Error in match creation:', error);
          });
        } else {
          console.error('Failed to save like to database');
        }
      });
    } else {
      // Record the pass in database
      MatchingService.recordSwipe(userProfile.id, profile.id, 'left');
    }

    // PHASE 2: After animation completes, update permanent state AND display buffer
    setTimeout(() => {
      console.log(`✅ Animation complete for ${profile.name}, updating permanent state`);

      if (direction === 'right') {
        // Add to permanent liked users
        setLikedUsers(prev => [...prev, profile.id]);

        // If in review mode and user likes someone they previously passed, remove from passed list
        if (isReviewMode && passedUsers.includes(profile.id)) {
          setPassedUsers(prev => prev.filter(id => id !== profile.id));
        }
      } else {
        // Add to permanent passed users
        setPassedUsers(prev => {
          if (!prev.includes(profile.id)) {
            return [...prev, profile.id];
          }
          return prev;
        });
      }

      // If in review mode, track that we've reviewed this profile in this session
      if (isReviewMode) {
        setReviewedProfilesInSession(prev => {
          if (!prev.includes(profile.id)) {
            return [...prev, profile.id];
          }
          return prev;
        });
      }

      // Update display buffer first - remove the swiped card
      setDisplayProfiles(prev => prev.filter(p => p.id !== profile.id));

      // Remove from pending swipes queue
      pendingSwipes.current.delete(profile.id);

      // No need to increment currentUserIndex since we're removing from the array
      // The next card will automatically be at index 0

      console.log(`🗑️ Removed ${profile.name} from display buffer and pending swipes`);
    }, 320); // Wait for card exit animation (300ms) + small buffer for cleanup
  };

  const handleLike = async () => {
    if (currentUser) {
      await handleSwipe('right', currentUser);
    }
  };

  const handlePass = async () => {
    if (currentUser) {
      await handleSwipe('left', currentUser);
    }
  };


  const handleReport = () => {
    if (currentUser) {
      setShowReportModal(true);
    }
  };

  const submitReport = async (reason: string) => {
    if (currentUser && userProfile) {
      try {
        // Add to local state immediately for UI feedback
      setReportedUsers([...reportedUsers, currentUser.id]);
      
        // First, submit the report without screenshot to get the report ID
        const reportData = {
          reporter_id: userProfile.id,
          reported_user_id: currentUser.id,
          content_type: 'profile',
          reason: reason,
          description: `Profile report: ${currentUser.name} (${currentUser.school})`,
        };

        const result = await ReportService.submitReport(reportData);
        
        if (result.success && result.report) {
          console.log('✅ Report submitted successfully to database');
          
          // Now capture and upload screenshot
          try {
            const screenshotResult = await ScreenshotService.captureAndUploadScreenshot(
              profileCardRef,
              result.report.id
            );
            
            if (screenshotResult.success && screenshotResult.screenshotUrl) {
              // Update the report with screenshot URL
              // Note: Screenshots are now handled in the ReportProfileModal
              console.log('✅ Report submitted (screenshots handled in modal)');
            } else {
              console.warn('⚠️ Screenshot capture failed, but report was submitted:', screenshotResult.error);
            }
          } catch (screenshotError) {
            console.warn('⚠️ Screenshot capture failed, but report was submitted:', screenshotError);
          }
      
      Alert.alert(
        'Report Submitted',
        `Thank you for reporting ${currentUser.name}'s profile for "${reason}". We will review this within 24 hours.`,
        [
          {
            text: 'OK',
            onPress: () => {
              nextUser();
            },
          },
        ]
      );
        } else {
          console.error('❌ Failed to submit report to database:', result.error);
          Alert.alert(
            'Report Error',
            'There was an error submitting your report. Please try again.',
            [
              {
                text: 'OK',
                onPress: () => {
                  // Remove from local state if database submission failed
                  setReportedUsers(reportedUsers.filter(id => id !== currentUser.id));
                },
              },
            ]
          );
        }
      } catch (error) {
        console.error('❌ Exception submitting report:', error);
        Alert.alert(
          'Report Error',
          'There was an error submitting your report. Please try again.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Remove from local state if database submission failed
                setReportedUsers(reportedUsers.filter(id => id !== currentUser.id));
              },
            },
          ]
        );
      }
    }
  };

  const handleFilter = () => {
    // Play joyful haptics and animate button
    playJoyfulButtonPressHaptic();
    animateJoyfulFilterButton(() => {
      router.push('/filter');
    });
  };

  // Sidebar animation functions
  const openSidebar = () => {
    // Haptic feedback when opening
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Reset button & back-button animation values when opening sidebar
    buttonAnimValue.setValue(0);
    buttonScaleValue.setValue(1);
    setAnimatingButton(null);
    backButtonOpacity.setValue(1);
    backButtonScale.setValue(1);

    setShowSidebar(true);
    Animated.parallel([
      Animated.timing(sidebarTranslateX, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(sidebarOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const closeSidebar = () => {
    // Haptic feedback when closing
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Animated.parallel([
      Animated.timing(sidebarTranslateX, {
        toValue: -width * 0.8,
        duration: 250,
        useNativeDriver: false,
      }),
      Animated.timing(sidebarOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start(() => {
      setShowSidebar(false);
      // Reset button animation values when closing sidebar
      buttonAnimValue.setValue(0);
      buttonScaleValue.setValue(1);
      setAnimatingButton(null);
      // Also reset back button visuals so it isn't stuck small
      backButtonOpacity.setValue(1);
      backButtonScale.setValue(1);
    });
  };

  // Back button animation with haptics (matching onboarding pattern)
  const animateBackButton = (callback?: () => void) => {
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Animate back with fade + scale combo like onboarding
    Animated.parallel([
      Animated.timing(backButtonOpacity, {
        toValue: 0.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(backButtonScale, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (callback) callback();
    });
  };

  // Joyful filter button animation
  const animateJoyfulFilterButton = (callback?: () => void) => {
    Animated.sequence([
      // Initial press down - quick and satisfying
      Animated.timing(filterButtonScale, {
        toValue: 0.92,
        duration: 80,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      // Jump with joy - overshoot for bounce effect
      Animated.timing(filterButtonScale, {
        toValue: 1.08,
        duration: 120,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
      // Small secondary bounce
      Animated.timing(filterButtonScale, {
        toValue: 0.98,
        duration: 100,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
      // Final settle with slight overshoot
      Animated.timing(filterButtonScale, {
        toValue: 1.02,
        duration: 80,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      // Return to normal
      Animated.timing(filterButtonScale, {
        toValue: 1,
        duration: 120,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (callback) callback();
    });
  };

  // Button selection animation (matching onboarding looking-for page)
  const animateButtonSelection = (optionId: string) => {
    playLightHaptic(); // Initial tap haptic
    setAnimatingButton(optionId);

    // Ensure clean reset of animations (critical for modal consistency)
    buttonAnimValue.setValue(0);
    buttonScaleValue.setValue(1);

    // Attach continuous haptics to the fill animation
    const detachFillHaptics = attachProgressHaptics(buttonAnimValue, {
      thresholds: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]
    });

    // Weight-push effect
    Animated.parallel([
      // Fill animation with continuous haptic feedback
      Animated.timing(buttonAnimValue, {
        toValue: 1,
        duration: 600,
        useNativeDriver: false,
      }),
      // Button scale + push out effect
      Animated.sequence([
        Animated.delay(400), // Wait for fill to reach edges
        Animated.parallel([
          // Button push out
          Animated.timing(buttonScaleValue, {
            toValue: 1.04,
            duration: 100,
            useNativeDriver: true,
          }),
        ]),
        // Return to normal size
        Animated.timing(buttonScaleValue, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ])
    ]).start(() => {
      // Clean up haptics when animation completes
      detachFillHaptics();
      setAnimatingButton(null);
    });

    // Strong haptic feedback when button gets pushed out
    setTimeout(() => {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } catch (error) {
        console.warn('Strong haptic failed:', error);
      }
    }, 500); // Timed with the button push-out effect
  };

  // Update looking for preference in database with animation
  const updateLookingForPreference = async (preference: 'dates' | 'friends' | 'both') => {
    if (!userProfile || animatingButton) return; // Prevent multiple animations

    // Start the button animation first
    animateButtonSelection(preference);

    try {
      const { supabase } = await import('../../lib/supabase');

      const { error } = await supabase
        .from('profiles')
        .update({ looking_for_friends_or_dates: preference })
        .eq('id', userProfile.id);

      if (error) {
        console.error('Error updating looking for preference:', error);
        Alert.alert('Error', 'Failed to update preference. Please try again.');
      } else {
        console.log('✅ Looking for preference updated to:', preference);
        setLookingForPreference(preference);
        // Don't close sidebar automatically - let user see the visual feedback
      }
    } catch (error) {
      console.error('Error updating looking for preference:', error);
      Alert.alert('Error', 'Failed to update preference. Please try again.');
    }
  };

  const nextUser = () => {
    console.log('🔄 nextUser called:', {
      currentIndex: currentUserIndex,
      filteredUsersLength: filteredUsers.length,
      canMoveNext: currentUserIndex < filteredUsers.length - 1
    });

    setCurrentUserIndex(prevIndex => {
      console.log('🔄 nextUser state update:', {
        prevIndex,
        filteredUsersLength: filteredUsers.length,
        willMoveNext: prevIndex < filteredUsers.length - 1
      });

      // Only move to next user if there are more users available
      if (prevIndex < filteredUsers.length - 1) {
        return prevIndex + 1;
      }

      // If we're at the end, stay at the current index
      console.log('⚠️ Already at the last user, staying at index:', prevIndex);
      return prevIndex;
    });
  };

  return (
    <>
    <SafeAreaView style={styles.container}>
      {/* Header integrated into main container */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={openSidebar}
        >
          <FontAwesome5
            name="bars"
            size={20}
            color="#FF4F81"
          />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>
            <Text style={styles.debsText}>Debs</Text>
            <Text style={styles.matchText}>Match</Text>
          </Text>
        </View>

        <Animated.View style={{ transform: [{ scale: filterButtonScale }] }}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={handleFilter}
          >
            <FontAwesome5
              name="filter"
              size={20}
              color="#c3b1e1"
            />
          </TouchableOpacity>
        </Animated.View>


        {/* Header Overlay for Match Notification */}
        {showMatchNotification && (
          <Animated.View style={[
            styles.headerOverlay,
            { opacity: matchOverlayOpacity }
          ]} />
        )}
      </View>

      {/* Main content area - idle image behind card stack for peek effect */}
      <View style={styles.mainContent}>
        {/* Always render idle image (preloaded) - animated fade-in when no cards available */}
        <Animated.View style={[
          styles.idleImageWrapper,
          { opacity: idleImageOpacity }
        ]} pointerEvents="none">
          <Image
            source={require('../../Images/swiping idle state.png')}
            style={styles.idleImage}
            contentFit="cover"
            priority="high"
          />
        </Animated.View>

        {displayProfiles.length > 0 && (
          <TinderCardStack
            profiles={displayProfiles}
            currentIndex={currentUserIndex}
            onSwipe={handleSwipe}
            onReport={handleReport}
            onRefresh={handlePullToRefresh}
            isRefreshing={isRefreshing}
          />
        )}
      </View>

      {/* Sidebar Menu */}
      {showSidebar && (
        <View style={styles.sidebarOverlay}>
          <Animated.View
            style={[
              styles.sidebarBackdrop,
              { opacity: sidebarOpacity }
            ]}
          >
            <TouchableOpacity
              style={{ flex: 1 }}
              onPress={closeSidebar}
              activeOpacity={1}
            />
          </Animated.View>
          <Animated.View style={[
            styles.sidebar,
            { transform: [{ translateX: sidebarTranslateX }] }
          ]}>
            <View style={styles.sidebarHeader}>
              <Text style={styles.sidebarTitle}>Looking For</Text>
              <View style={styles.sidebarCloseButton}>
                <Animated.View style={{
                  opacity: backButtonOpacity,
                  transform: [{ scale: backButtonScale }],
                }}>
                  <BackButton
                    onPress={() => animateBackButton(closeSidebar)}
                    color="#c3b1e1"
                    size={56}
                    iconSize={24}
                    direction="right"
                  />
                </Animated.View>
              </View>
            </View>
            
            <View style={styles.sidebarContent}>
              <Animated.View
                style={{
                  transform: [{
                    scale: (animatingButton === 'dates') ? buttonScaleValue : 1
                  }]
                }}
              >
                <TouchableOpacity
                  style={styles.sidebarOptionButton}
                  onPress={() => updateLookingForPreference('dates')}
                  activeOpacity={0.7}
                >
                  {/* Background gradient base */}
                  <LinearGradient
                    colors={
                      (lookingForPreference === 'dates' && animatingButton !== 'dates')
                        ? ['#FF4F81', '#FF4F81'] // Solid pink when active and not animating
                        : ['#FFFFFF', '#FFF0F5'] // Keep inactive during animation to show center fill
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.sidebarOptionBackground}
                  />

                  {/* Animated center-out fill background (above gradient, below content) */}
                  {animatingButton === 'dates' && (
                    <Animated.View
                      style={[
                        styles.centerFillBackground,
                        {
                          transform: [{
                            scaleX: buttonAnimValue.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, 1],
                            }),
                          }],
                        },
                      ]}
                    />
                  )}

                  {/* Content */}
                  <View style={styles.sidebarOptionContent}>
                    <Ionicons
                      name="heart"
                      size={24}
                      color={
                        (lookingForPreference === 'dates' || animatingButton === 'dates')
                          ? '#FFFFFF'
                          : '#c3b1e1'
                      }
                      style={styles.sidebarOptionIcon}
                    />
                    <Text style={[
                      styles.sidebarOptionLabel,
                      (lookingForPreference === 'dates' || animatingButton === 'dates') && styles.sidebarOptionLabelActive
                    ]}>
                      Dates
                    </Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
              
              <Animated.View
                style={{
                  transform: [{
                    scale: (animatingButton === 'friends') ? buttonScaleValue : 1
                  }]
                }}
              >
                <TouchableOpacity
                  style={styles.sidebarOptionButton}
                  onPress={() => updateLookingForPreference('friends')}
                  activeOpacity={0.7}
                >
                  {/* Background gradient base */}
                  <LinearGradient
                    colors={
                      (lookingForPreference === 'friends' && animatingButton !== 'friends')
                        ? ['#FF4F81', '#FF4F81'] // Solid pink when active and not animating
                        : ['#FFFFFF', '#FFF0F5'] // Keep inactive during animation to show center fill
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.sidebarOptionBackground}
                  />

                  {/* Animated center-out fill background (above gradient, below content) */}
                  {animatingButton === 'friends' && (
                    <Animated.View
                      style={[
                        styles.centerFillBackground,
                        {
                          transform: [{
                            scaleX: buttonAnimValue.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, 1],
                            }),
                          }],
                        },
                      ]}
                    />
                  )}

                  {/* Content */}
                  <View style={styles.sidebarOptionContent}>
                    <Ionicons
                      name="people"
                      size={24}
                      color={
                        (lookingForPreference === 'friends' || animatingButton === 'friends')
                          ? '#FFFFFF'
                          : '#c3b1e1'
                      }
                      style={styles.sidebarOptionIcon}
                    />
                    <Text style={[
                      styles.sidebarOptionLabel,
                      (lookingForPreference === 'friends' || animatingButton === 'friends') && styles.sidebarOptionLabelActive
                    ]}>
                      Friends
                    </Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
              
              <Animated.View
                style={{
                  transform: [{
                    scale: (animatingButton === 'both') ? buttonScaleValue : 1
                  }]
                }}
              >
                <TouchableOpacity
                  style={styles.sidebarOptionButton}
                  onPress={() => updateLookingForPreference('both')}
                  activeOpacity={0.7}
                >
                  {/* Background gradient base */}
                  <LinearGradient
                    colors={
                      (lookingForPreference === 'both' && animatingButton !== 'both')
                        ? ['#FF4F81', '#FF4F81'] // Solid pink when active and not animating
                        : ['#FFFFFF', '#FFF0F5'] // Keep inactive during animation to show center fill
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.sidebarOptionBackground}
                  />

                  {/* Animated center-out fill background (above gradient, below content) */}
                  {animatingButton === 'both' && (
                    <Animated.View
                      style={[
                        styles.centerFillBackground,
                        {
                          transform: [{
                            scaleX: buttonAnimValue.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, 1],
                            }),
                          }],
                        },
                      ]}
                    />
                  )}

                  {/* Content */}
                  <View style={styles.sidebarOptionContent}>
                    <Ionicons
                      name="happy"
                      size={24}
                      color={
                        (lookingForPreference === 'both' || animatingButton === 'both')
                          ? '#FFFFFF'
                          : '#c3b1e1'
                      }
                      style={styles.sidebarOptionIcon}
                    />
                    <Text style={[
                      styles.sidebarOptionLabel,
                      (lookingForPreference === 'both' || animatingButton === 'both') && styles.sidebarOptionLabelActive
                    ]}>
                      Both
                    </Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </Animated.View>
        </View>
      )}

              {/* Match Notification - Premium Bumble style */}
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
                  {userProfile?.photos && userProfile.photos.length > 0 ? (
                    <Image
                      source={{ uri: userProfile.photos[0] }}
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
                      router.push(`/chat/${matchId}?name=${encodeURIComponent(matchedUser.name)}&userId=${matchedUser.id}`);
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
                  }}
                >
                  <Text style={styles.matchKeepSwipingButtonText} numberOfLines={1}>Ok</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </Animated.View>
        )}

        {/* Custom Report Modal */}
        <Modal
          visible={showCustomReportModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowCustomReportModal(false)}
        >
          <View 
            style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}
          >
            <View style={styles.customReportModal}>
              <Text style={styles.customReportTitle}>Custom Report Reason</Text>
              <Text style={styles.customReportSubtitle}>
                Please describe why you're reporting {currentUser?.name}'s profile
              </Text>
              
              <TextInput
                style={styles.customReportInput}
                placeholder="Enter your reason here..."
                value={customReportReason}
                onChangeText={setCustomReportReason}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                placeholderTextColor="#999999"
              />
              
              <View style={styles.customReportButtons}>
                <TouchableOpacity
                  style={styles.customReportCancelButton}
                  onPress={() => {
                    setShowCustomReportModal(false);
                    setCustomReportReason('');
                  }}
                >
                  <Text style={styles.customReportCancelText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.customReportSubmitButton, !customReportReason.trim() && styles.customReportSubmitButtonDisabled]}
                  onPress={() => {
                    if (customReportReason.trim()) {
                      submitReport(`Other: ${customReportReason.trim()}`);
                      setShowCustomReportModal(false);
                      setCustomReportReason('');
                    }
                  }}
                  disabled={!customReportReason.trim()}
                >
                  <Text style={styles.customReportSubmitText}>Submit Report</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Report Profile Modal */}
        <ReportProfileModal
          visible={showReportModal}
          onClose={() => setShowReportModal(false)}
          reportedUserId={currentUser?.id || ''}
          reportedUserName={currentUser?.name || ''}
        />

        {/* Filters Applied Popup */}
        <FiltersAppliedPopup
          visible={showFiltersAppliedPopup}
          onClose={() => setShowFiltersAppliedPopup(false)}
          filterCount={getActiveFiltersCount()}
        />

        {/* Review Profiles Prompt Modal */}
        <Modal
          visible={showReviewPrompt}
          transparent={true}
          animationType="none"
          onRequestClose={() => animateReviewPromptOut()}
        >
          <View style={styles.modalOverlay}>
            <Animated.View
              style={[
                styles.reviewPromptModal,
                {
                  opacity: reviewPromptOpacity,
                  transform: [{ scale: reviewPromptScale }],
                }
              ]}
            >

              {/* Title */}
              <Text style={styles.reviewPromptTitle}>You've Seen Everyone!</Text>

              {/* Message */}
              <Text style={styles.reviewPromptMessage}>
                You've swiped through all available profiles. Would you like to review profiles you previously passed on?
              </Text>

              {/* Info note */}
              <View style={styles.reviewPromptInfoBox}>
                <FontAwesome5 name="info-circle" size={14} color="#FF4F81" style={{ marginRight: 8 }} />
                <Text style={styles.reviewPromptInfoText}>
                  You won't see profiles you've already liked
                </Text>
              </View>

              {/* Buttons */}
              <View style={styles.reviewPromptButtons}>
                <TouchableOpacity
                  style={styles.reviewPromptDeclineButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    animateReviewPromptOut(() => {
                      // User declined - exit review mode if in it
                      setIsReviewMode(false);
                      setReviewedProfilesInSession([]); // Reset reviewed profiles
                    });
                  }}
                >
                  <Text style={styles.reviewPromptDeclineText}>No</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.reviewPromptAcceptButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    animateReviewPromptOut(() => {
                      // User accepted - enter/stay in review mode and reset index
                      setIsReviewMode(true);
                      setReviewedProfilesInSession([]); // Reset reviewed profiles for new session
                      setCurrentUserIndex(0);
                    });
                  }}
                >
                  <Text style={styles.reviewPromptAcceptText}>Yes</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </Modal>

      </SafeAreaView>
    </>
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
  menuButton: {
    minWidth: 40,
    minHeight: 40,
    padding: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: Fonts.bold,
    fontWeight: '700',
    fontSize: Math.min(28, width * 0.07), // Responsive font size
    textAlign: 'center',
  },
  debsText: {
    color: '#FF4F81',
  },
  matchText: {
    color: '#c3b1e1',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.sm,
  },
  filterButton: {
    minWidth: 40,
    minHeight: 40,
    padding: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
      mainContent: {
      flex: 1,
      backgroundColor: '#FFFFFF',
    },
      cardContainer: {
      width: '100%',
      flex: 1,
      paddingHorizontal: SPACING.sm,
    },
  userCard: {
    width: '100%',
    backgroundColor: '#FFF8FF',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#FF4F81',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#6C4AB6',
    borderRightWidth: 2,
    borderRightColor: '#FF4F81',
    borderTopWidth: 1,
    borderTopColor: '#E8D4FF',
  },
  userPhoto: {
    width: '100%',
    height: height * 0.78,
    resizeMode: 'cover',
  },
  idleImage: {
    width: '100%',
    height: '100%',
  },
  idleImageWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    marginHorizontal: 8,  // Match card margins and underlay
    marginBottom: 0,
    borderRadius: 20,
    overflow: 'hidden',
  },
  userInfo: {
    padding: 20,
    backgroundColor: '#FAFAFA',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1B1B3A',
    marginBottom: 8,
  },
  userSchool: {
    fontSize: 16,
    color: '#FF4F81',
    marginBottom: 12,
  },
  userBio: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 22,
  },
  undoButtonOnCard: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 44,
    height: 44,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 15,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  undoButtonDisabled: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderColor: '#999999',
  },
  stats: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  statsText: {
    fontSize: 14,
    color: '#FF4F81',
    textAlign: 'center',
  },
  noMoreUsers: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    backgroundColor: '#FFF8FF',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FF4F81',
    borderStyle: 'dashed',
    margin: 20,
  },
  noMoreUsersText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF4F81',
    marginBottom: 12,
    textAlign: 'center',
  },
  noMoreUsersSubtext: {
    fontSize: 16,
    color: '#6C4AB6',
    textAlign: 'center',
    lineHeight: 22,
  },
  likeIndicator: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: '#27AE60',
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  passIndicator: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: '#E74C3C',
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
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
    width: width * 0.78,
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
  matchIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  matchIconInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF5F7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF4F81',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  matchIconGlow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FF4F81',
    opacity: 0.25,
  },
  matchTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  sparkleIcon: {
    marginHorizontal: 12,
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
  matchUserName: {
    fontWeight: '700',
    color: '#FF4F81',
  },
  matchProfilesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  matchProfileContainer: {
    alignItems: 'center',
    marginHorizontal: 10,
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
    backgroundColor: '#FFE6F0',
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
    marginHorizontal: 15,
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
  },
  // Custom Report Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customReportModal: {
    backgroundColor: '#FAFAFA',
    borderRadius: 20,
    padding: 24,
    width: width * 0.85,
    maxWidth: 400,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  customReportTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1B1B3A',
    textAlign: 'center',
    marginBottom: 8,
  },
  customReportSubtitle: {
    fontSize: 16,
    color: '#6C4AB6',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  customReportInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    fontSize: 16,
    color: '#1B1B3A',
    minHeight: 100,
    marginBottom: 24,
  },
  customReportButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  customReportCancelButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  customReportCancelText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '600',
  },
  customReportSubmitButton: {
    flex: 1,
    backgroundColor: '#FF4F81',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  customReportSubmitButtonDisabled: {
    backgroundColor: '#E8E8E8',
  },
  customReportSubmitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Interests and Looking For Styles
  interestsContainer: {
    marginTop: 12,
  },
  interestsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6C4AB6',
    marginBottom: 6,
  },
  interestsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  interestTag: {
    backgroundColor: 'rgba(108, 74, 182, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#6C4AB6',
  },
  interestText: {
    fontSize: 12,
    color: '#6C4AB6',
    fontWeight: '500',
  },
  moreInterestsText: {
    fontSize: 12,
    color: '#666666',
    fontStyle: 'italic',
    alignSelf: 'center',
  },
  lookingForContainer: {
    marginTop: 12,
  },
  lookingForLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF4F81',
    marginBottom: 6,
  },
  lookingForText: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
  },
  adjustFiltersButton: {
    backgroundColor: '#6C4AB6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 20,
  },
  adjustFiltersButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  filterSummary: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  filterSummaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6C4AB6',
    marginBottom: 10,
  },
  filterTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 15,
  },
  filterTag: {
    backgroundColor: '#6C4AB6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  filterTagText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  clearFiltersButton: {
    backgroundColor: '#FF4F81',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 15,
    alignSelf: 'flex-start',
  },
  clearFiltersButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  filterButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  
  // Bumble-style Profile Overlay Styles
      imageContainer: {
      position: 'relative',
      height: height * 0.78,
      width: '100%',
    },
  profileInfoOverlay: {
    position: 'absolute',
    bottom: 16, // Position at the bottom left of the image
    left: 16,
    zIndex: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
  },
  userNameOverlay: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userSchoolOverlay: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 1,
  },

  profileContentOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    zIndex: 5,
  },
      profileContentContainer: {
      paddingTop: height * 0.78 + 8, // Start below the main image with minimal spacing
      paddingHorizontal: 0,
      paddingBottom: 60,
      backgroundColor: '#FFF8FF',
      borderTopLeftRadius: 0,
      borderTopRightRadius: 0,
    },
      profileInfoSection: {
      backgroundColor: '#FFF8FF',
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 12,
      borderTopLeftRadius: 0,
      borderTopRightRadius: 0,
    },
  userNameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1B1B3A',
    marginBottom: 4,
  },
  userSchoolText: {
    fontSize: 16,
    color: '#6C4AB6',
    fontWeight: '500',
  },
      bioSection: {
      marginBottom: 12,
      paddingHorizontal: 12,
    },
      sectionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#FF4F81',
      marginBottom: 8,
      marginTop: 2,
    },
  sectionDivider: {
    height: 1,
    backgroundColor: '#FF4F81',
    marginVertical: 20,
    marginHorizontal: 0,
    opacity: 0.3,
  },
      bioText: {
      fontSize: 14,
      color: '#6C4AB6',
      lineHeight: 20,
      marginBottom: 6,
    },
      aboutSection: {
      marginBottom: 12,
      paddingHorizontal: 12,
    },
    lifeSection: {
      marginBottom: 12,
      paddingHorizontal: 12,
    },
    interestsSection: {
      marginBottom: 12,
      paddingHorizontal: 12,
    },
    lookingForSection: {
      marginBottom: 12,
      paddingHorizontal: 12,
    },
    intentionsSection: {
      marginBottom: 12,
      paddingHorizontal: 12,
    },
    promptsSection: {
      marginBottom: 12,
      paddingHorizontal: 12,
    },
      tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
      tag: {
      backgroundColor: '#FFE6F0',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: '#FF4F81',
      marginBottom: 6,
      marginRight: 6,
      flexDirection: 'row',
      alignItems: 'center',
    },
  tagText: {
    fontSize: 14,
    color: '#FF4F81',
    fontWeight: '600',
  },
  tagIcon: {
    marginRight: 6,
  },
      promptItem: {
      marginBottom: 16,
    },
  promptQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF4F81',
    marginBottom: 8,
  },
  promptAnswer: {
    fontSize: 16,
    color: '#6C4AB6',
    lineHeight: 22,
  },
      bottomSpacing: {
      height: 20,
    },
      photoSection: {
      marginBottom: 12,
      alignItems: 'center',
    },
      profilePhoto: {
      width: '100%',
      height: 280,
      borderRadius: 12,
      resizeMode: 'cover',
    },
    // Loading and no profiles styles
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#fff',
    },
    loadingText: {
      fontSize: 18,
      color: '#6C4AB6',
      fontWeight: '600',
    },
    noProfilesContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#fff',
      paddingHorizontal: 20,
    },
    noProfilesTitle: {
      fontSize: 24,
      color: '#FF4F81',
      fontWeight: 'bold',
      marginBottom: 16,
      textAlign: 'center',
    },
    noProfilesText: {
      fontSize: 16,
      color: '#6C4AB6',
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: 24,
    },
    resetFiltersButton: {
      backgroundColor: '#FF4F81',
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 25,
    },
    swipeOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 20,
    },
    likeOverlay: {
      backgroundColor: 'rgba(255, 79, 129, 0.8)', // Pink with transparency
    },
    dislikeOverlay: {
      backgroundColor: 'rgba(195, 177, 225, 0.8)', // New purple from design system with transparency
    },
    swipeOverlayText: {
      color: '#FFFFFF',
      fontSize: 24,
      fontWeight: 'bold',
      marginTop: 10,
      letterSpacing: 2,
    },
    // Sidebar styles
    sidebarOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1000,
    },
    sidebarBackdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    sidebar: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: width * 0.8,
      height: '100%',
      backgroundColor: '#FFFFFF',
      paddingTop: 60,
      paddingHorizontal: 24,
      shadowColor: '#000',
      shadowOffset: { width: 2, height: 0 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 10,
    },
    sidebarHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 32,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#E5E7EB',
    },
    sidebarTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: '#1B1B3A',
      fontFamily: Fonts.bold,
    },
    sidebarCloseButton: {
      width: 56,
      height: 56,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sidebarContent: {
      flex: 1,
      gap: SPACING.md, // Using design system token
    },
    sidebarOptionButton: {
      borderRadius: BORDER_RADIUS.lg, // 16px from design system
      minHeight: 80, // Use minHeight instead of fixed height
      borderWidth: 2,
      borderColor: '#FFE5F0', // Light pink border from design system
      shadowColor: '#FF4F81', // Pink shadow from design system
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
      overflow: 'hidden', // Ensure gradient doesn't overflow
    },
    // Absolute background gradient for the button container
    sidebarOptionBackground: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: 14,
    },
    // Foreground content layer (icon + text)
    sidebarOptionContent: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      paddingVertical: 24,
      paddingHorizontal: SPACING.xl,
      borderRadius: 14,
      minHeight: 76,
      zIndex: 2,
    },
    sidebarOptionIcon: {
      marginRight: SPACING.md, // Using design system token
    },
    sidebarOptionLabel: {
      fontSize: 16, // Smaller font size to ensure it fits
      color: '#1B1B3A', // Primary text color from design system
      fontWeight: '600', // SemiBold weight for more prominence
      fontFamily: Fonts.semiBold, // Poppins SemiBold from design system
      lineHeight: 20, // Add line height for better text rendering
    },
    sidebarOptionLabelActive: {
      color: '#FFFFFF', // White text for active state
      fontWeight: '600', // SemiBold weight for prominence
      fontFamily: Fonts.semiBold, // Poppins SemiBold from design system
    },
    centerFillBackground: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#FF4F81',
      borderRadius: 14, // Slightly smaller than button border radius to account for border
      zIndex: 1,
    },
  // Review Prompt Modal Styles
  reviewPromptModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    width: width * 0.85,
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  reviewPromptTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1B1B3A',
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: Fonts.bold,
  },
  reviewPromptMessage: {
    fontSize: 16,
    color: '#c3b1e1',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
    fontFamily: Fonts.regular,
  },
  reviewPromptInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE8F0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FFC3D4',
  },
  reviewPromptInfoText: {
    fontSize: 13,
    color: '#FF4F81',
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
  },
  reviewPromptButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  reviewPromptDeclineButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E8E8E8',
  },
  reviewPromptDeclineText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Fonts.bold,
  },
  reviewPromptAcceptButton: {
    flex: 1,
    backgroundColor: '#FF4F81',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#FF4F81',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  reviewPromptAcceptText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Fonts.bold,
  },
});
