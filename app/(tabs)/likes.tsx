import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, FlatList, ActivityIndicator, Animated, Alert, Dimensions, Easing } from 'react-native';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { LikesService, LikeWithProfile } from '../../services/likes';
import { MatchingService } from '../../services/matching';
import { useUser } from '../../contexts/UserContext';
import { useMatchNotification } from '../../contexts/MatchNotificationContext';
import { CircularProfilePicture } from '../../components/CircularProfilePicture';
import { useMatchCreation } from '../../hooks/useMatchCreation';
import { useProfilePreloader } from '../../hooks/useProfilePreloader';
import { useTabPreloader } from '../../hooks/useTabPreloader';
import { tabPreloader } from '../../services/tabPreloader';
import { SPACING, BORDER_RADIUS } from '../../utils/constants';
import { Fonts } from '../../utils/fonts';
import { playMatchCelebrationHaptic, playJoyfulButtonPressHaptic, playLightHaptic } from '../../utils/haptics';

export default function LikesScreen() {
  const { userProfile } = useUser();
  const { checkAndCreateMatch } = useMatchCreation();
  const matchNotificationContext = useMatchNotification();

  // Preload first profile for instant swiping screen
  useProfilePreloader({
    shouldPreload: true,
    pageName: 'likes'
  });

  // Preload adjacent tab data
  useTabPreloader({ currentTab: 'likes' });

  // Debug: Check if function exists
  console.log('🔍 LikesScreen: checkAndCreateMatch function:', typeof checkAndCreateMatch);
  const [likes, setLikes] = useState<LikeWithProfile[]>([]);
  const [loading, setLoading] = useState(false); // Changed to false for instant UI
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [showMatchNotification, setShowMatchNotification] = useState(false);
  const [matchedUser, setMatchedUser] = useState<any>(null);
  const [matchId, setMatchId] = useState<string | null>(null);

  // Match animation values - use context's matchOverlayOpacity for footer sync
  const matchOverlayOpacity = matchNotificationContext.matchOverlayOpacity;
  const matchScale = useRef(new Animated.Value(0.3)).current;
  const matchProfile1Scale = useRef(new Animated.Value(0.5)).current;
  const matchProfile2Scale = useRef(new Animated.Value(0.5)).current;
  const matchGlowPulse = useRef(new Animated.Value(1)).current;

  console.log('🎯 LikesScreen rendered - userProfile:', userProfile?.id, 'likes count:', likes.length);

  // Sync match notification state with context for footer overlay
  useEffect(() => {
    matchNotificationContext.setShowMatchNotification(showMatchNotification);
  }, [showMatchNotification]);

  const loadLikes = useCallback(async (skipPreloaded = false) => {
    if (!userProfile) {
      console.log('❌ No user profile available for loading likes');
      return;
    }

    console.log('🔄 Loading likes for user:', userProfile.id);

    // Check for preloaded data first (unless explicitly skipping)
    if (!skipPreloaded && !initialLoadComplete) {
      const preloadedLikes = tabPreloader.getPreloadedLikes();
      if (preloadedLikes && preloadedLikes.length > 0) {
        console.log('⚡ Using preloaded likes data');
        setLikes(preloadedLikes);
        setInitialLoadComplete(true);
        // Still load fresh data in background
        setTimeout(() => loadLikes(true), 100);
        return;
      }
    }

    try {
      const likesData = await LikesService.getLikesReceived(userProfile.id);
      console.log('✅ Loaded likes:', likesData.length, 'likes');
      console.log('📋 Likes data:', likesData);
      setLikes(likesData);
      setInitialLoadComplete(true);
    } catch (error) {
      console.error('❌ Error loading likes:', error);
      setInitialLoadComplete(true);
    }
  }, [userProfile, initialLoadComplete]);

  useEffect(() => {
    loadLikes();
  }, [loadLikes]);

  useFocusEffect(
    useCallback(() => {
      if (!userProfile || !initialLoadComplete) {
        return;
      }

      console.log('🔄 Likes screen focused, refreshing likes in background...');
      loadLikes();
    }, [userProfile, loadLikes, initialLoadComplete])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadLikes();
    setRefreshing(false);
  };

  // Animate match notification in
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

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const likeDate = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - likeDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const handleLike = async (likedUserId: string) => {
    console.log('🔄 LikesScreen: handleLike called with likedUserId:', likedUserId);
    console.log('🔍 LikesScreen: userProfile:', userProfile?.id);
    
    if (!userProfile) {
      console.log('❌ No user profile available');
      return;
    }

    // Add haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    console.log('💖 User liking:', likedUserId, 'Current user:', userProfile.id);

    // Record the swipe in the swipes table (same as swiping screen)
    await MatchingService.recordSwipe(userProfile.id, likedUserId, 'right');
    
    // Save like to database (same as swiping screen)
    const likeResult = await LikesService.createLike(userProfile.id, likedUserId);
    
    if (likeResult) {
      console.log('✅ Like created successfully:', likeResult);
      
      // Check if this creates a match BEFORE removing from likes list (same as swiping screen)
      console.log('🔄 Checking for match after like...');
      console.log('🔍 checkAndCreateMatch function:', typeof checkAndCreateMatch);
      console.log('🔍 likedUserId:', likedUserId);
      try {
        const matchResult = await checkAndCreateMatch(likedUserId);
        console.log('🎯 Match result from likes screen:', matchResult);
        
        if (matchResult.isMatch) {
          console.log('🎉 Match created! Showing notification...');
          // Find the matched user's profile
          const matchedProfile = likes.find(like => like.liker_id === likedUserId);
          if (matchedProfile) {
            console.log('👤 Matched user profile:', matchedProfile.liker_profile);
            setMatchedUser(matchedProfile.liker_profile);
            setMatchId(matchResult.matchId || null);
            setShowMatchNotification(true);
            animateMatchNotificationIn();
          }
          
          // Remove the matched user from the likes list
          console.log('🔄 Removing matched user from likes list...');
          setLikes(prevLikes => prevLikes.filter(like => like.liker_id !== likedUserId));
          console.log('✅ Matched user removed from likes list');
        } else {
          console.log('❌ No match created from likes screen');
          // Don't remove from likes list if no match was created
          // Nothing further
        }
      } catch (error) {
        console.error('❌ Error in match creation:', error);
      }
    } else {
      console.error('Failed to save like to database');
      Alert.alert('Error', 'Failed to like this user. Please try again.');
    }
  };

  const handlePass = async (likedUserId: string) => {
    console.log('❌ Pass button pressed for user:', likedUserId);
    
    if (!userProfile) {
      console.log('❌ No user profile available');
      return;
    }

    // Add haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Record the swipe in the database (same as swiping screen)
    await MatchingService.recordSwipe(userProfile.id, likedUserId, 'left');

    try {
      await LikesService.removeLike(likedUserId, userProfile.id);
      console.log('✅ Removed like record from database for user:', likedUserId);
    } catch (error) {
      console.error('❌ Failed to remove like record for user:', likedUserId, error);
    }

    console.log('🔄 Removing user from likes list...');
    setLikes(prevLikes => prevLikes.filter(like => like.liker_id !== likedUserId));
    console.log('✅ User removed from likes list');
  };

  const renderLikeItem = ({ item }: { item: LikeWithProfile }) => {
    const profile = item.liker_profile;
    const profileInitial = profile.first_name?.charAt(0)?.toUpperCase() || profile.username?.charAt(0)?.toUpperCase() || '?';

    return (
      <View style={styles.likeItem}>
        <LinearGradient
          colors={['#FFF0F5', '#F8F4FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.likeItemGradient}
        >
          <TouchableOpacity
            style={styles.likeItemContent}
            onPress={() => router.push(`/profile/${profile.id}?source=likes`)}
            activeOpacity={0.7}
          >
            <View style={styles.avatarContainer}>
              <CircularProfilePicture
                userId={profile.id}
                size={60}
                fallbackIcon={
                  <Text style={styles.profileInitial}>{profileInitial}</Text>
                }
              />
            </View>
            
            <View style={styles.likeInfo}>
              <View style={styles.likeHeader}>
                <Text style={styles.nameAgeText}>{profile.first_name}, {profile.age}</Text>
                <Text style={styles.timeAgo}>{formatTimeAgo(item.created_at)}</Text>
              </View>
              
              <Text style={styles.schoolCounty}>{profile.school_name}, {profile.county}</Text>
            </View>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  };

  return (
    <>
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerCenter}>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitlePink}>Li</Text>
            <Text style={styles.headerTitlePurple}>kes</Text>
          </View>
        </View>

        {/* Header Overlay for Match Notification */}
        {showMatchNotification && (
          <Animated.View style={[
            styles.headerOverlay,
            { opacity: matchOverlayOpacity }
          ]} />
        )}
      </View>

      {/* Main content area - Likes list or idle image */}
      <View style={styles.mainContent}>
        {likes.length === 0 ? (
          <Image
            source={require('../../Images/likes idle state.png')}
            style={styles.idleImage}
            contentFit="contain"
          />
        ) : (
          <FlatList
            data={likes}
            renderItem={renderLikeItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.likesList}
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        )}
      </View>

      {/* Match Notification - Premium style */}
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
                style={styles.matchKeepSwipingButton}
                onPress={() => {
                  playLightHaptic();
                  setShowMatchNotification(false);
                }}
              >
                <Text style={styles.matchKeepSwipingButtonText} numberOfLines={1}>Ok</Text>
              </TouchableOpacity>

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
            </View>
          </Animated.View>
        </Animated.View>
      )}
    </SafeAreaView>
    </>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 0,
  },
  headerCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1B1B3A',
    fontFamily: Fonts.bold,
    marginBottom: SPACING.xs,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitlePink: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FF4F81',
    fontFamily: Fonts.bold,
  },
  headerTitlePurple: {
    fontSize: 28,
    fontWeight: '700',
    color: '#c3b1e1',
    fontFamily: Fonts.bold,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  likesList: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
    backgroundColor: '#FFFFFF',
  },
  likeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
    shadowColor: '#FF4F81',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 79, 129, 0.35)',
    overflow: 'hidden',
  },
  likeItemGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
  },
  likeItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    marginRight: SPACING.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING['2xl'],
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: 16,
    color: '#c3b1e1',
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
  },
  likeInfo: {
    flex: 1,
  },
  likeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  nameAgeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF4F81',
    fontFamily: Fonts.semiBold,
  },
  timeAgo: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    fontFamily: Fonts.regular,
  },
  schoolCounty: {
    fontSize: 14,
    color: '#c3b1e1',
    fontWeight: '500',
    fontFamily: Fonts.regular,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F4FF',
    paddingHorizontal: SPACING['2xl'],
    paddingVertical: SPACING['2xl'],
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 2,
    borderColor: '#c3b1e1',
    borderStyle: 'dashed',
    marginTop: SPACING['2xl'],
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1B1B3A',
    fontFamily: Fonts.semiBold,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: Fonts.regular,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: SPACING.lg,
  },
  idleImage: {
    width: '100%',
    height: '100%',
    transform: [{ translateY: 2 }],
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
  matchIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    position: 'relative',
  },
  matchIconInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF0F5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF4F81',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
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
    textAlign: 'center',
  },
  profileInitial: {
    fontFamily: Fonts.bold,
    fontSize: 24,
    color: '#FF4F81',
  },
});
