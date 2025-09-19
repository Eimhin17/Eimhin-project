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
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
// import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
// import { ViewShot } from 'react-native-view-shot';
import { Button } from '../../components/ui';
import { useFilters } from '../../contexts/FilterContext';
import { useMatchCreation } from '../../hooks/useMatchCreation';
import { RealUserService, RealUserProfile } from '../../services/realUsers';
import { MatchingService } from '../../services/matching';
import ReportProfileModal from '../../components/ReportProfileModal';
import { useUser } from '../../contexts/UserContext';
import ScrollableProfileCard, { ProfileData } from '../../components/ScrollableProfileCard';
import { ReportService } from '../../services/reports';
import { ScreenshotService } from '../../services/screenshot';
import { LikesService } from '../../services/likes';
import { captureRef } from 'react-native-view-shot';
import { useCustomFonts, Fonts } from '../../utils/fonts';
import { SPACING, BORDER_RADIUS } from '../../utils/constants';
import * as Haptics from 'expo-haptics';
import { profilePreloader } from '../../services/profilePreloader';

const { width, height } = Dimensions.get('window');
const SWIPE_THRESHOLD = width * 0.25;

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

export default function HomeScreen() {
  const fontsLoaded = useCustomFonts();
  const { filters, resetFilters } = useFilters();
  const { checkAndCreateMatch } = useMatchCreation();
  
  // Debug: Check if function exists
  console.log('🔍 checkAndCreateMatch in component:', typeof checkAndCreateMatch);
  const { userProfile } = useUser();
  
  // Unified profile interface for both real and mock users
  interface UnifiedProfile extends ProfileData {
    isRealUser: boolean;
  }

  // Only real user profiles
  const [allProfiles, setAllProfiles] = useState<UnifiedProfile[]>([]);
  const [realUserProfiles, setRealUserProfiles] = useState<RealUserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [currentUserIndex, setCurrentUserIndex] = useState(0);
  const [likedUsers, setLikedUsers] = useState<string[]>([]);
  const [passedUsers, setPassedUsers] = useState<string[]>([]);
  const [showMatchNotification, setShowMatchNotification] = useState(false);
  const [matchedUser, setMatchedUser] = useState<any>(null);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [reportedUsers, setReportedUsers] = useState<string[]>([]);
  const [showCustomReportModal, setShowCustomReportModal] = useState(false);
  const [customReportReason, setCustomReportReason] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  
  // Sidebar state
  const [showSidebar, setShowSidebar] = useState(false);
  const [lookingForPreference, setLookingForPreference] = useState<'dates' | 'friends' | 'both'>('both');

  // Load current looking for preference from user profile
  useEffect(() => {
    if (userProfile && 'looking_for_friends_or_dates' in userProfile) {
      const preference = (userProfile as any).looking_for_friends_or_dates;
      if (preference) {
        setLookingForPreference(preference as 'dates' | 'friends' | 'both');
      }
    }
  }, [userProfile]);
  
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const profileCardRef = useRef<any>(null);
  const lastHapticLevel = useRef<string | null>(null);

  // Function to get haptic intensity based on swipe distance
  const getHapticIntensity = (translationX: number, direction: 'right' | 'left') => {
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
    
    setIsLoading(true);
    try {
      // Check for preloaded profile first
      const preloadedProfile = profilePreloader.getPreloadedProfile();
      if (preloadedProfile) {
        console.log('⚡ Using preloaded profile:', preloadedProfile.name);
        setAllProfiles([preloadedProfile]);
        setIsLoading(false);
        
        // Load remaining profiles in background
        loadRemainingProfiles();
        return;
      }

      // Use a default user ID if no user profile exists
      const currentUserId = userProfile?.id || 'default-user-id';
      console.log('- Using currentUserId:', currentUserId);
      
      // Fetch passed users from database
      const passedUserIds = await MatchingService.getPassedUsers(currentUserId);
      console.log('- Fetched passed users from DB:', passedUserIds);
      
      const result = await RealUserService.getUserProfilesForSwiping(
        currentUserId, 
        [...likedUsers, ...passedUserIds]
      );
      
      console.log('- RealUserService result:', result);
      
      if (result.success && result.profiles) {
        console.log('- Setting real user profiles:', result.profiles.length);
        console.log('- Raw profiles data:', result.profiles);
        setRealUserProfiles(result.profiles);
        
        try {
          // Transform real users to unified format (synchronous now)
          console.log('- Transforming profiles...');
          const transformedRealUsers = result.profiles.map(transformRealUserToUnified);
          
          console.log('- Transformed profiles:', transformedRealUsers.length);
          console.log('- Transformed profiles data:', transformedRealUsers);
          
          // Only use real user profiles
          setAllProfiles(transformedRealUsers);
          
          console.log(`✅ Loaded ${transformedRealUsers.length} real user profiles`);
          console.log('- allProfiles state after setAllProfiles:', transformedRealUsers);
          
          // Load photos asynchronously for better performance
          loadPhotosAsync(transformedRealUsers);
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
    } finally {
      setIsLoading(false);
    }
  };

  // Function to load remaining profiles in background after using preloaded one
  const loadRemainingProfiles = async () => {
    try {
      const currentUserId = userProfile?.id || 'default-user-id';
      const passedUserIds = await MatchingService.getPassedUsers(currentUserId);
      
      const result = await RealUserService.getUserProfilesForSwiping(
        currentUserId, 
        [...likedUsers, ...passedUserIds]
      );
      
      if (result.success && result.profiles) {
        const transformedRealUsers = result.profiles.map(transformRealUserToUnified);
        setAllProfiles(transformedRealUsers);
        loadPhotosAsync(transformedRealUsers);
      }
    } catch (error) {
      console.error('Error loading remaining profiles:', error);
    }
  };

  // Function to load photos asynchronously for better performance
  const loadPhotosAsync = async (profiles: UnifiedProfile[]) => {
    console.log('🖼️ Loading photos asynchronously for', profiles.length, 'profiles');
    
    // Load photos in batches to avoid overwhelming the API
    const batchSize = 5;
    for (let i = 0; i < profiles.length; i += batchSize) {
      const batch = profiles.slice(i, i + batchSize);
      
      // Load photos for this batch in parallel
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
      
      // Update profiles with photos
      setAllProfiles(prevProfiles => 
        prevProfiles.map(profile => {
          const photoResult = photoResults.find(r => r.profileId === profile.id);
          if (photoResult) {
            return { ...profile, photos: photoResult.photos };
          }
          return profile;
        })
      );
      
      // Small delay between batches to avoid overwhelming the API
      if (i + batchSize < profiles.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log('✅ Finished loading photos asynchronously');
  };

  // Fetch real user profiles on component mount
  useEffect(() => {
    refreshProfiles();
    // Ensure reports storage bucket exists
    ScreenshotService.ensureReportsBucket();
  }, [likedUsers, passedUsers]);

  // Filter profiles based on active filters
  const filteredUsers = useMemo(() => {
    console.log('🔍 getFilteredUsers called');
    console.log('- allProfiles count:', allProfiles.length);
    console.log('- allProfiles data:', allProfiles);
    console.log('- filters:', filters);
    console.log('- likedUsers:', likedUsers);
    console.log('- passedUsers:', passedUsers);
    
    const filtered = allProfiles.filter(user => {
      console.log(`🔍 Filtering user: ${user.name} (${user.gender})`);
      
      // Skip users that have already been liked or passed
      if (likedUsers.includes(user.id) || passedUsers.includes(user.id)) {
        console.log(`❌ Filtered out - already swiped: ${user.name} (liked: ${likedUsers.includes(user.id)}, passed: ${passedUsers.includes(user.id)})`);
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
    
    console.log(`🔍 Filtered users result: ${filtered.length} profiles`);
    return filtered;
  }, [allProfiles, filters, likedUsers, passedUsers]);
  
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
  
  // Reset current user index when filtered users change (e.g., after swiping)
  useEffect(() => {
    // If current index is out of bounds, reset to 0
    if (currentUserIndex >= filteredUsers.length && filteredUsers.length > 0) {
      console.log('🔄 Resetting currentUserIndex from', currentUserIndex, 'to 0 because it was out of bounds');
      setCurrentUserIndex(0);
    }
  }, [filteredUsers.length, currentUserIndex]);
  
  const currentUser = filteredUsers[currentUserIndex];
  
  console.log('🔍 Current user debug:', {
    currentUserIndex,
    filteredUsersLength: filteredUsers.length,
    currentUser: currentUser ? currentUser.name : 'No user',
    hasCurrentUser: !!currentUser
  });

  // Show loading state while fetching profiles
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profiles...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show message if no profiles available
  if (filteredUsers.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.noProfilesContainer}>
          <Text style={styles.noProfilesTitle}>No profiles available</Text>
          <Text style={styles.noProfilesText}>
            {allProfiles.length === 0 
              ? 'No profiles have been created yet. Complete onboarding to see profiles!' 
              : 'No profiles match your current filters. Try adjusting your preferences.'
            }
          </Text>
          <Button 
            onPress={resetFilters}
            style={styles.resetFiltersButton}
          >
            Reset Filters
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const handleLike = async () => {
    if (currentUser && userProfile) {
      // Haptic feedback for like
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Record the swipe in the swipes table
      await MatchingService.recordSwipe(userProfile.id, currentUser.id, 'right');
      
      // Save like to database
      const likeResult = await LikesService.createLike(userProfile.id, currentUser.id);
      
      if (likeResult) {
        setLikedUsers([...likedUsers, currentUser.id]);
        
        // Check if this creates a match BEFORE moving to next user
        console.log('🔄 Checking for match after like...');
        console.log('🔍 checkAndCreateMatch function:', typeof checkAndCreateMatch);
        console.log('🔍 currentUser.id:', currentUser.id);
        try {
          const matchResult = await checkAndCreateMatch(currentUser.id);
          console.log('🎯 Match result from main page:', matchResult);
          
          if (matchResult.isMatch) {
            console.log('🎉 Match created! Showing notification...');
            setMatchedUser(currentUser);
            setMatchId(matchResult.matchId || null);
            setShowMatchNotification(true);
          } else {
            console.log('❌ No match created from main page');
          }
        } catch (error) {
          console.error('❌ Error in match creation:', error);
        }
        
        // Move to next user after match check
        nextUser();
        
        // Animate card off screen to the right (faster animation)
        Animated.timing(translateX, {
          toValue: width * 1.5,
          duration: 150,
          useNativeDriver: false,
        }).start();
      } else {
        console.error('Failed to save like to database');
        // Move to next user immediately even if database save failed
        nextUser();
        
        // Still animate the card off screen even if database save failed
        Animated.timing(translateX, {
          toValue: width * 1.5,
          duration: 150,
          useNativeDriver: false,
        }).start();
      }
    }
  };

  const handlePass = async () => {
    if (currentUser && userProfile) {
      // Haptic feedback for pass
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Record the swipe in the database
      await MatchingService.recordSwipe(userProfile.id, currentUser.id, 'left');
      
      setPassedUsers([...passedUsers, currentUser.id]);
      
      // Move to next user immediately for instant profile switching
      nextUser();
      
      // Animate card off screen to the left (faster animation)
      Animated.timing(translateX, {
        toValue: -width * 1.5,
        duration: 150,
        useNativeDriver: false,
      }).start();
    }
  };

  const handleUndo = () => {
    if (likedUsers.length > 0) {
      const newLikedUsers = [...likedUsers];
      newLikedUsers.pop();
      setLikedUsers(newLikedUsers);
      setCurrentUserIndex(Math.max(0, currentUserIndex - 1));
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
    // Trigger immediate preload when opening filters
    if (userProfile?.id) {
      console.log('🔄 Filter button pressed - triggering immediate preload');
      profilePreloader.preloadFirstProfile(userProfile.id);
    }
    router.push('/filter');
  };

  // Update looking for preference in database
  const updateLookingForPreference = async (preference: 'dates' | 'friends' | 'both') => {
    if (!userProfile) return;
    
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
        // Reset animation values
        translateX.setValue(0);
        translateY.setValue(0);
        rotate.setValue(0);
        return prevIndex + 1;
      }
      
      // If we're at the end, stay at the current index
      console.log('⚠️ Already at the last user, staying at index:', prevIndex);
      return prevIndex;
    });
  };

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX, translationY: translateY } }],
    { 
      useNativeDriver: false,
      listener: (event: any) => {
        const { translationX } = event.nativeEvent;
        const absX = Math.abs(translationX);
        
        // Determine direction and get haptic intensity
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
    if (event.nativeEvent.state === State.BEGAN) {
      // Reset haptic level when gesture starts
      lastHapticLevel.current = null;
    } else if (event.nativeEvent.state === State.END) {
      const { translationX } = event.nativeEvent;

      if (translationX > SWIPE_THRESHOLD) {
        // Swipe right - Like
        handleLike();
      } else if (translationX < -SWIPE_THRESHOLD) {
        // Swipe left - Pass
        handlePass();
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

  // Calculate rotation based on horizontal movement
  const cardRotation = translateX.interpolate({
    inputRange: [-width / 2, 0, width / 2],
    outputRange: ['-10deg', '0deg', '10deg'],
    extrapolate: 'clamp',
  });

  // Calculate scale based on movement (subtle zoom effect)
  const cardScale = translateX.interpolate({
    inputRange: [-width / 2, 0, width / 2],
    outputRange: [0.92, 1, 0.92],
    extrapolate: 'clamp',
  });

  // Add subtle vertical movement for more natural feel
  const cardTranslateY = translateX.interpolate({
    inputRange: [-width / 2, 0, width / 2],
    outputRange: [20, 0, -20],
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

  if (!currentUser) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.noMoreUsers}>
          <Text style={styles.noMoreUsersText}>
            {filteredUsers.length === 0 ? 'No profiles match your filters' : 'No more profiles to show'}
          </Text>
          <Text style={styles.noMoreUsersSubtext}>
            {filteredUsers.length === 0 
              ? 'Try adjusting your filters to see more profiles' 
              : 'Check back later for new matches!'
            }
          </Text>
          {filteredUsers.length === 0 && (
            <TouchableOpacity 
              style={styles.adjustFiltersButton}
              onPress={() => router.push('/filter')}
            >
              <Text style={styles.adjustFiltersButtonText}>Adjust Filters</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header integrated into main container */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => setShowSidebar(true)}
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
      </View>



      {/* Main content area - New Scrollable Profile Card with Swipe Gestures */}
      <View style={styles.mainContent}>
          <PanGestureHandler
            onGestureEvent={onGestureEvent}
            onHandlerStateChange={onHandlerStateChange}
          >
            <Animated.View
              style={[
              styles.cardContainer,
                {
                  transform: [
                    { translateX },
                    { translateY: cardTranslateY },
                    { rotate: cardRotation },
                    { scale: cardScale },
                  ],
                },
              ]}
            >
            <ScrollableProfileCard
              ref={profileCardRef}
              profile={currentUser}
              onUndo={handleUndo}
              canUndo={likedUsers.length > 0}
              onLike={handleLike}
              onDislike={handlePass}
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

            {/* Dislike Overlay - Purple */}
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
      </View>

      {/* Sidebar Menu */}
      {showSidebar && (
        <View style={styles.sidebarOverlay}>
          <TouchableOpacity 
            style={styles.sidebarBackdrop}
            onPress={() => setShowSidebar(false)}
            activeOpacity={1}
          />
          <View style={styles.sidebar}>
            <View style={styles.sidebarHeader}>
              <Text style={styles.sidebarTitle}>Looking For</Text>
              <TouchableOpacity 
                style={styles.sidebarCloseButton}
                onPress={() => setShowSidebar(false)}
              >
                <FontAwesome5 name="times" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.sidebarContent}>
              <TouchableOpacity 
                style={styles.sidebarOptionButton}
                onPress={() => updateLookingForPreference('dates')}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={
                    lookingForPreference === 'dates' 
                      ? ['#FF4F81', '#FF4F81'] // Solid pink for active
                      : ['#FFFFFF', '#FFF0F5'] // White to light pink gradient for inactive
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.sidebarOptionGradient}
                >
                  <Ionicons 
                    name="heart" 
                    size={24} 
                    color={lookingForPreference === 'dates' ? '#FFFFFF' : '#c3b1e1'} 
                    style={styles.sidebarOptionIcon}
                  />
                  <Text style={[
                    styles.sidebarOptionLabel,
                    lookingForPreference === 'dates' && styles.sidebarOptionLabelActive
                  ]}>
                    Dates
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.sidebarOptionButton}
                onPress={() => updateLookingForPreference('friends')}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={
                    lookingForPreference === 'friends' 
                      ? ['#FF4F81', '#FF4F81'] // Solid pink for active
                      : ['#FFFFFF', '#FFF0F5'] // White to light pink gradient for inactive
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.sidebarOptionGradient}
                >
                  <Ionicons 
                    name="people" 
                    size={24} 
                    color={lookingForPreference === 'friends' ? '#FFFFFF' : '#c3b1e1'} 
                    style={styles.sidebarOptionIcon}
                  />
                  <Text style={[
                    styles.sidebarOptionLabel,
                    lookingForPreference === 'friends' && styles.sidebarOptionLabelActive
                  ]}>
                    Friends
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.sidebarOptionButton}
                onPress={() => updateLookingForPreference('both')}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={
                    lookingForPreference === 'both' 
                      ? ['#FF4F81', '#FF4F81'] // Solid pink for active
                      : ['#FFFFFF', '#FFF0F5'] // White to light pink gradient for inactive
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.sidebarOptionGradient}
                >
                  <Ionicons 
                    name="happy" 
                    size={24} 
                    color={lookingForPreference === 'both' ? '#FFFFFF' : '#c3b1e1'} 
                    style={styles.sidebarOptionIcon}
                  />
                  <Text style={[
                    styles.sidebarOptionLabel,
                    lookingForPreference === 'both' && styles.sidebarOptionLabelActive
                  ]}>
                    Both
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

              {/* Match Notification - Premium Bumble style */}
        {showMatchNotification && matchedUser && (
          <Animated.View style={styles.matchNotification}>
            <View style={styles.matchNotificationContent}>
              {/* Match Icon with Animation */}
              <View style={styles.matchIconContainer}>
                <View style={styles.matchIconInner}>
                  <FontAwesome5 name="heart" size={45} color="#FF4F81" />
                </View>
                <View style={styles.matchIconGlow} />
              </View>
              
              {/* Match Title with Sparkle */}
              <View style={styles.matchTitleContainer}>
                <FontAwesome5 name="sparkles" size={20} color="#FFD700" style={styles.sparkleIcon} />
                <Text style={styles.matchNotificationTitle}>It's a Match!</Text>
                <FontAwesome5 name="sparkles" size={20} color="#FFD700" style={styles.sparkleIcon} />
              </View>
              
              {/* Match Description with Profile Pictures */}
              <View style={styles.matchProfilesContainer}>
                <View style={styles.matchProfileContainer}>
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
                </View>
                
                <View style={styles.matchHeartContainer}>
                  <FontAwesome5 name="heart" size={24} color="#FF4F81" />
                </View>
                
                <View style={styles.matchProfileContainer}>
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
                </View>
              </View>
              
              <Text style={styles.matchNotificationText}>
                You both liked each other!
              </Text>
              
              {/* Match Buttons */}
              <View style={styles.matchNotificationButtons}>
                                  <TouchableOpacity 
                    style={styles.matchChatButton}
                    onPress={() => {
                      setShowMatchNotification(false);
                      // Navigate to chat using match ID
                      if (matchId) {
                        router.push(`/chat/${matchId}?name=${encodeURIComponent(matchedUser.name)}&userId=${matchedUser.id}`);
                      }
                    }}
                  >
                    <Text style={styles.matchChatButtonText}>Start Chat</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.matchKeepSwipingButton}
                    onPress={() => setShowMatchNotification(false)}
                  >
                    <Text style={styles.matchKeepSwipingButtonText}>Keep Swiping</Text>
                  </TouchableOpacity>
              </View>
            </View>
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
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  matchNotificationContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 36,
    alignItems: 'center',
    width: width * 0.88,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 15,
    },
    shadowOpacity: 0.4,
    shadowRadius: 25,
    elevation: 15,
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
    opacity: 0.1,
    transform: [{ scale: 1.2 }],
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
      flex: 1,
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
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#F3F4F6',
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
    sidebarOptionGradient: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start', // Push content to the left
      paddingVertical: 24, // Generous vertical padding
      paddingHorizontal: SPACING.xl, // Same as continue button (32px)
      borderRadius: 14, // Slightly smaller to account for border
      minHeight: 76, // Ensure minimum height for content
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
});
