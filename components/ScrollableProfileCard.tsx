import React, { forwardRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { FontAwesome5 } from '@expo/vector-icons';
import { SPACING, BORDER_RADIUS } from '../utils/constants';
import { Fonts } from '../utils/fonts';
import * as Haptics from 'expo-haptics';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Profile data interface
export interface ProfileData {
  id: string;
  name: string;
  age: number;
  school: string;
  county?: string;
  gender: string;
  bio?: string;
  interests: string[];
  relationshipStatus?: string;
  lookingFor: string[];
  datingIntentions: string[];
  photos: string[];
  profilePrompts: Record<string, string>;
  lookingForFriendsOrDates?: string; // 'dates', 'friends', or 'both'
  blockedSchools?: string[];
}

interface ScrollableProfileCardProps {
  profile: ProfileData;
  onLike?: () => void;
  onDislike?: () => void;
  onReport?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

const ScrollableProfileCard = forwardRef<View, ScrollableProfileCardProps>(({
  profile,
  onLike,
  onDislike,
  onReport,
  onRefresh,
  isRefreshing = false,
}, ref) => {
  const [displayPhotos, setDisplayPhotos] = useState<string[]>(profile.photos || []);

  // Use provided photos directly; upstream now supplies long-lived, pre-signed URLs.
  useEffect(() => {
    setDisplayPhotos(profile.photos || []);
  }, [profile.photos]);

  return (
    <View style={styles.container} ref={ref}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        nestedScrollEnabled
        refreshControl={
          onRefresh
            ? (
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={onRefresh}
                tintColor="#FF4F81"
                colors={['#FF4F81', '#c3b1e1']}
              />
            )
            : undefined
        }
      >
        {/* Unified Profile Card Container */}
        <View style={styles.profileCard}>
          {/* Main Photo - Takes up most of the card */}
          <View style={styles.mainPhotoContainer}>
            {displayPhotos.length > 0 ? (
              <Image 
                source={{ uri: displayPhotos[0] }} 
                style={styles.mainPhoto}
                contentFit="cover"
                cachePolicy="disk"
                transition={0}
                onError={(error) => {
                  console.log('❌ Image load error:', error);
                  console.log('❌ Image URI:', displayPhotos[0]);
                }}
                onLoad={() => {
                  console.log('✅ Image loaded successfully:', displayPhotos[0]);
                }}
              />
            ) : (
              <View style={[styles.mainPhoto, styles.noPhotoContainer]}>
                <FontAwesome5 name="camera" size={50} color="#CCCCCC" />
                <Text style={styles.noPhotoText}>No photos available</Text>
              </View>
            )}
            
            {/* Profile Info Overlay on Main Photo */}
            <View style={styles.profileInfoOverlay}>
              <Text style={styles.nameText}>{profile.name.split(' ')[0]}, {profile.age}</Text>
              <Text style={styles.schoolText}>{profile.school.split(',')[0]}</Text>
              {profile.county && <Text style={styles.countyText}>{profile.county}</Text>}
            </View>

            {/* Looking For Badge */}
            {profile.lookingForFriendsOrDates && (
              <View style={styles.lookingForBadge}>
                <Text style={styles.lookingForText}>
                  {profile.lookingForFriendsOrDates === 'dates' ? 'Dates' :
                   profile.lookingForFriendsOrDates === 'friends' ? 'Friends' : 'Both'}
                </Text>
              </View>
            )}

          </View>

          {/* Content below main photo - seamlessly connected */}
          <View style={styles.contentContainer}>
        {/* 1. Bio */}
        {profile.bio && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About me</Text>
            <Text style={styles.bioText}>{profile.bio}</Text>
          </View>
        )}

        {/* 2. Interests */}
        {profile.interests && profile.interests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>My interests</Text>
            <View style={styles.tagsContainer}>
              {profile.interests.map((interest, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{interest}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 3. Relationship Status */}
        {profile.relationshipStatus && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Relationship status</Text>
            <View style={styles.tagsContainer}>
              <View style={styles.tag}>
                <Text style={styles.tagText}>
                  {profile.relationshipStatus === 'single' ? 'Single' :
                   profile.relationshipStatus === 'relationship' ? 'In a relationship' :
                   profile.relationshipStatus === 'complicated' ? 'It\'s complicated' :
                   profile.relationshipStatus}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* 4. Looking For (Swaps) */}
        {profile.lookingFor && profile.lookingFor.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Looking for</Text>
            <View style={styles.tagsContainer}>
              {profile.lookingFor.map((lookingFor, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{lookingFor}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 5. Dating Intentions */}
        {profile.datingIntentions && profile.datingIntentions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dating intentions</Text>
            <View style={styles.tagsContainer}>
              {profile.datingIntentions.map((intention, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{intention}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 6. Picture 2 */}
        {displayPhotos[1] && (
          <View style={styles.photoSection}>
            <Image 
              source={{ uri: displayPhotos[1] }} 
              style={styles.additionalPhoto}
              contentFit="cover"
              cachePolicy="disk"
              transition={0}
              onError={(error) => {
                console.log('❌ Additional image load error:', error);
                console.log('❌ Additional image URI:', displayPhotos[1]);
              }}
              onLoad={() => {
                console.log('✅ Additional image loaded successfully:', displayPhotos[1]);
              }}
            />
          </View>
        )}

        {/* 7. Profile Prompt 1 */}
        {profile.profilePrompts && Object.keys(profile.profilePrompts).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Profile prompts</Text>
            {Object.entries(profile.profilePrompts).slice(0, 1).map(([question, answer], index) => (
              <View key={index} style={styles.promptItem}>
                <Text style={styles.promptQuestion}>{question}</Text>
                <Text style={styles.promptAnswer}>{answer}</Text>
              </View>
            ))}
          </View>
        )}

        {/* 8. Picture 3 */}
        {displayPhotos[2] && (
          <View style={styles.photoSection}>
            <Image source={{ uri: displayPhotos[2] }} style={styles.additionalPhoto} contentFit="cover" cachePolicy="disk" transition={0} />
          </View>
        )}

        {/* 9. Profile Prompt 2 */}
        {profile.profilePrompts && Object.keys(profile.profilePrompts).length > 1 && (
          <View style={styles.section}>
            {Object.entries(profile.profilePrompts).slice(1, 2).map(([question, answer], index) => (
              <View key={index} style={styles.promptItem}>
                <Text style={styles.promptQuestion}>{question}</Text>
                <Text style={styles.promptAnswer}>{answer}</Text>
              </View>
            ))}
          </View>
        )}

        {/* 10. Picture 4 */}
        {displayPhotos[3] && (
          <View style={styles.photoSection}>
            <Image source={{ uri: displayPhotos[3] }} style={styles.additionalPhoto} contentFit="cover" cachePolicy="disk" transition={0} />
          </View>
        )}

        {/* 11. Profile Prompt 3 */}
        {profile.profilePrompts && Object.keys(profile.profilePrompts).length > 2 && (
          <View style={styles.section}>
            {Object.entries(profile.profilePrompts).slice(2, 3).map(([question, answer], index) => (
              <View key={index} style={styles.promptItem}>
                <Text style={styles.promptQuestion}>{question}</Text>
                <Text style={styles.promptAnswer}>{answer}</Text>
              </View>
            ))}
          </View>
        )}

        {/* 12. Picture 5 */}
        {displayPhotos[4] && (
          <View style={styles.photoSection}>
            <Image source={{ uri: displayPhotos[4] }} style={styles.additionalPhoto} contentFit="cover" cachePolicy="disk" transition={0} />
          </View>
        )}

        {/* 13. Picture 6 */}
        {displayPhotos[5] && (
          <View style={styles.photoSection}>
            <Image source={{ uri: displayPhotos[5] }} style={styles.additionalPhoto} contentFit="cover" cachePolicy="disk" transition={0} />
          </View>
        )}

            {/* Action Buttons - Like Bumble */}
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity 
                style={styles.dislikeButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onDislike?.();
                }}
              >
                <FontAwesome5 name="times" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.likeButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  onLike?.();
                }}
              >
                <FontAwesome5 name="heart" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Report Button */}
            <TouchableOpacity 
              style={styles.reportButton}
              onPress={onReport}
            >
              <Text style={styles.reportButtonText}>Hide and Report</Text>
            </TouchableOpacity>

            {/* Bottom spacing for better scrolling */}
            <View style={styles.bottomSpacing} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
});

ScrollableProfileCard.displayName = 'ScrollableProfileCard';

export default ScrollableProfileCard;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Primary white background from design system
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.sm, // Using design system token
    paddingTop: SPACING.sm, // Using design system token
  },
  profileCard: {
    backgroundColor: '#FFFFFF', // Primary white background from design system
    borderRadius: BORDER_RADIUS.xl, // Using design system token (20px)
    overflow: 'hidden', // Ensure all content respects rounded corners
    shadowColor: '#FF4F81', // Pink shadow from design system
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB', // Light border from design system
  },
  mainPhotoContainer: {
    width: '100%',
    height: screenHeight * 0.75, // Take up 75% of screen height
    position: 'relative',
  },
  mainPhoto: {
    width: '100%',
    height: '100%',
  },
  noPhotoContainer: {
    backgroundColor: '#F3F4F6', // Gray light background from design system
    justifyContent: 'center',
    alignItems: 'center',
  },
  noPhotoText: {
    marginTop: SPACING.sm, // Using design system token
    fontSize: 16, // Body text size from design system
    color: '#9CA3AF', // Tertiary text color from design system
    fontWeight: '500', // Medium weight from design system
    fontFamily: Fonts.semiBold, // Poppins SemiBold from design system
  },
  profileInfoOverlay: {
    position: 'absolute',
    bottom: SPACING.xl, // Using design system token (32px)
    left: SPACING.lg, // Using design system token (24px)
    // No background - just floating text in bottom left
  },
  nameText: {
    fontSize: Math.min(24, screenWidth * 0.06), // Responsive font size
    fontWeight: '700', // Bold weight from design system
    color: '#FFFFFF',
    marginBottom: SPACING.xs, // Using design system token
    fontFamily: Fonts.bold, // Poppins Bold from design system
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  schoolText: {
    fontSize: 16, // Body text size from design system
    color: '#FFFFFF',
    fontWeight: '600', // SemiBold weight from design system
    fontFamily: Fonts.semiBold, // Poppins SemiBold from design system
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  countyText: {
    fontSize: 16, // Body text size from design system
    color: '#FFFFFF',
    fontWeight: '600', // SemiBold weight from design system
    fontFamily: Fonts.semiBold, // Poppins SemiBold from design system
    opacity: 0.9,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  lookingForBadge: {
    position: 'absolute',
    top: SPACING.md, // Using design system token
    left: SPACING.md, // Using design system token
    backgroundColor: '#FF4F81', // Primary pink from design system
    paddingHorizontal: SPACING.md, // Using design system token
    paddingVertical: SPACING.sm, // Using design system token
    borderRadius: BORDER_RADIUS.lg, // Using design system token (16px)
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#FF4F81', // Pink shadow from design system
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  lookingForText: {
    color: '#FFFFFF',
    fontSize: 14, // Small text size from design system
    fontWeight: '600', // SemiBold weight from design system
    fontFamily: Fonts.semiBold, // Poppins SemiBold from design system
    letterSpacing: 0.5,
  },
  contentContainer: {
    backgroundColor: '#FFFFFF', // Primary white background from design system
    paddingTop: SPACING.lg, // Using design system token
    // No separate margins or borders - seamlessly connected to main photo
  },
  section: {
    paddingHorizontal: SPACING.lg, // Using design system token
    paddingVertical: SPACING.md, // Using design system token
    // No border lines - seamless continuous card
  },
  sectionTitle: {
    fontSize: Math.min(20, screenWidth * 0.05), // Responsive font size
    fontWeight: '600', // SemiBold weight from design system
    color: '#FF4F81', // Primary pink from design system
    marginBottom: SPACING.md, // Using design system token
    fontFamily: Fonts.semiBold, // Poppins SemiBold from design system
  },
  bioText: {
    fontSize: 16, // Body text size from design system
    color: '#1B1B3A', // Primary text color from design system
    lineHeight: 24, // Body line height from design system
    fontFamily: Fonts.regular, // Inter Regular from design system
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm, // Using design system token
  },
  tag: {
    backgroundColor: '#FFE5F0', // Light pink background from design system
    paddingHorizontal: SPACING.md, // Using design system token
    paddingVertical: SPACING.sm, // Using design system token
    borderRadius: 9999, // Full radius for pill shape
    borderWidth: 2,
    borderColor: '#FF4F81', // Primary pink from design system
    shadowColor: '#FF4F81', // Pink shadow from design system
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tagText: {
    fontSize: 14, // Small text size from design system
    color: '#c3b1e1', // Primary purple from design system
    fontWeight: '600', // SemiBold weight from design system
    fontFamily: Fonts.semiBold, // Poppins SemiBold from design system
  },
  photoSection: {
    paddingHorizontal: 0, // Remove horizontal padding to make photos full width
    paddingVertical: SPACING.sm, // Using design system token
  },
  additionalPhoto: {
    width: '100%',
    height: screenWidth * (4 / 3), // Full width with 3:4 aspect ratio like Bumble
    borderRadius: BORDER_RADIUS.md, // Using design system token (12px)
    resizeMode: 'cover',
    shadowColor: '#FF4F81', // Pink shadow from design system
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  promptItem: {
    marginBottom: SPACING.md, // Using design system token
    // No background, padding, or borders - just like other text sections
  },
  promptQuestion: {
    fontSize: 14, // Smaller text for the question (like Hinge)
    fontWeight: '500', // Medium weight from design system
    color: '#c3b1e1', // Primary purple from design system
    marginBottom: SPACING.sm, // Using design system token
    fontFamily: Fonts.medium, // Poppins Medium from design system
    letterSpacing: 0.2, // Subtle letter spacing
  },
  promptAnswer: {
    fontSize: 18, // Larger text for the answer (prominent like Hinge)
    color: '#1B1B3A', // Primary text color from design system
    lineHeight: 26, // Adjusted line height for larger text
    fontFamily: Fonts.semiBold, // SemiBold for more impact
    fontWeight: '600', // SemiBold weight for emphasis
  },
  bottomSpacing: {
    height: SPACING.xl, // Using design system token
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.lg, // Using design system token
    paddingHorizontal: SPACING.lg, // Using design system token
    gap: SPACING.xl, // Using design system token
  },
  likeButton: {
    width: 64, // Slightly larger for better touch target
    height: 64, // Slightly larger for better touch target
    borderRadius: 32, // Half of width/height for perfect circle
    backgroundColor: '#FF4F81', // Primary pink from design system
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF4F81', // Pink shadow from design system
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  dislikeButton: {
    width: 64, // Slightly larger for better touch target
    height: 64, // Slightly larger for better touch target
    borderRadius: 32, // Half of width/height for perfect circle
    backgroundColor: '#c3b1e1', // Primary purple from design system
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#c3b1e1', // Purple shadow from design system
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  reportButton: {
    alignItems: 'center',
    paddingVertical: SPACING.md, // Using design system token
    paddingHorizontal: SPACING.lg, // Using design system token
    marginTop: SPACING.sm, // Using design system token
  },
  reportButtonText: {
    fontSize: 14, // Small text size from design system
    color: '#6B7280', // Secondary text color from design system
    fontWeight: '500', // Medium weight from design system
    fontFamily: Fonts.semiBold, // Poppins SemiBold from design system
  },
});
