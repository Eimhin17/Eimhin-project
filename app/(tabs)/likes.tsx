import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, FlatList, ActivityIndicator, Animated, Alert, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { LikesService, LikeWithProfile } from '../../services/likes';
import { MatchingService } from '../../services/matching';
import { useUser } from '../../contexts/UserContext';
import { CircularProfilePicture } from '../../components/CircularProfilePicture';
import { useMatchCreation } from '../../hooks/useMatchCreation';
import { useProfilePreloader } from '../../hooks/useProfilePreloader';
import { SPACING, BORDER_RADIUS } from '../../utils/constants';
import { Fonts } from '../../utils/fonts';

export default function LikesScreen() {
  const { userProfile } = useUser();
  const { checkAndCreateMatch } = useMatchCreation();
  
  // Preload first profile for instant swiping screen
  useProfilePreloader({ 
    shouldPreload: true, 
    pageName: 'likes' 
  });
  
  // Debug: Check if function exists
  console.log('🔍 LikesScreen: checkAndCreateMatch function:', typeof checkAndCreateMatch);
  const [likes, setLikes] = useState<LikeWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showMatchNotification, setShowMatchNotification] = useState(false);
  const [matchedUser, setMatchedUser] = useState<any>(null);
  const [matchId, setMatchId] = useState<string | null>(null);

  console.log('🎯 LikesScreen rendered - userProfile:', userProfile?.id, 'likes count:', likes.length);

  useEffect(() => {
    loadLikes();
  }, [userProfile]);

  const loadLikes = async () => {
    if (!userProfile) {
      console.log('❌ No user profile available for loading likes');
      return;
    }
    
    console.log('🔄 Loading likes for user:', userProfile.id);
    setLoading(true);
    try {
      const likesData = await LikesService.getLikesReceived(userProfile.id);
      console.log('✅ Loaded likes:', likesData.length, 'likes');
      console.log('📋 Likes data:', likesData);
      setLikes(likesData);
    } catch (error) {
      console.error('❌ Error loading likes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadLikes();
    setRefreshing(false);
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
          }
          
          // Remove the matched user from the likes list
          console.log('🔄 Removing matched user from likes list...');
          setLikes(prevLikes => prevLikes.filter(like => like.liker_id !== likedUserId));
          console.log('✅ Matched user removed from likes list');
        } else {
          console.log('❌ No match created from likes screen');
          // Don't remove from likes list if no match was created
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
    
    // Remove from likes list without creating a like
    console.log('🔄 Removing user from likes list...');
    setLikes(prevLikes => prevLikes.filter(like => like.liker_id !== likedUserId));
    console.log('✅ User removed from likes list');
  };

  const renderLikeItem = ({ item }: { item: LikeWithProfile }) => {
    const profile = item.liker_profile;
    
    return (
      <View style={styles.likeItem}>
        <LinearGradient
          colors={['#FFFFFF', '#FFF0F5']}
          style={styles.likeItemGradient}
        >
          <TouchableOpacity
            style={styles.likeItemContent}
            onPress={() => router.push(`/profile/${profile.id}`)}
            activeOpacity={0.7}
          >
            <View style={styles.avatarContainer}>
              <CircularProfilePicture
                userId={profile.id}
                size={60}
                fallbackIcon={
                  <Ionicons name="person" size={24} color="#c3b1e1" />
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
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerCenter}>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitlePink}>Li</Text>
            <Text style={styles.headerTitlePurple}>kes</Text>
          </View>
        </View>
      </View>

      {/* Likes List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF4F81" />
          <Text style={styles.loadingText}>Loading likes...</Text>
        </View>
      ) : (
        <FlatList
          data={likes}
          renderItem={renderLikeItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.likesList}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="heart-outline" size={64} color="#c3b1e1" />
              <Text style={styles.emptyTitle}>No likes yet</Text>
              <Text style={styles.emptySubtitle}>
                Start swiping to get more likes on your profile!
              </Text>
            </View>
          }
        />
      )}

      {/* Match Notification Modal */}
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
                    router.push(`/chat/${matchId}?name=${encodeURIComponent(matchedUser.first_name)}&userId=${matchedUser.id}`);
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
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
    padding: SPACING.lg,
    backgroundColor: '#FFFFFF',
  },
  likeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
    shadowColor: '#FF4F81',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    overflow: 'hidden',
  },
  likeItemGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
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
  // Match Notification Styles
  matchNotification: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  matchNotificationContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS['2xl'],
    padding: SPACING['2xl'],
    alignItems: 'center',
    width: '90%',
    maxWidth: 400,
    shadowColor: '#FF4F81',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
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
    marginBottom: SPACING.md,
  },
  sparkleIcon: {
    marginHorizontal: SPACING.md,
  },
  matchNotificationTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1B1B3A',
    fontFamily: Fonts.bold,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  matchNotificationText: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: Fonts.regular,
    textAlign: 'center',
    marginBottom: SPACING['2xl'],
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
    color: '#1B1B3A',
    fontFamily: Fonts.semiBold,
    marginTop: SPACING.sm,
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
    gap: SPACING.md,
  },
  matchChatButton: {
    backgroundColor: '#FF4F81',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF4F81',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  matchChatButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
    textAlign: 'center',
  },
  matchKeepSwipingButton: {
    backgroundColor: '#F8F4FF',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#c3b1e1',
    shadowColor: '#c3b1e1',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  matchKeepSwipingButtonText: {
    color: '#c3b1e1',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
    textAlign: 'center',
  },
});
