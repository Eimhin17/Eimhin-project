import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useUser } from '../../contexts/UserContext';
import CircularProfilePicture from '../../components/CircularProfilePicture';
import { ProfileData } from '../../components/ScrollableProfileCard';
import { useProfilePreloader } from '../../hooks/useProfilePreloader';
import { SPACING, BORDER_RADIUS } from '../../utils/constants';
import { Fonts } from '../../utils/fonts';
import { Button } from '../../components/ui';

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

export default function ProfileScreen() {
  const { userProfile } = useUser();

  // Preload first profile for instant swiping screen
  useProfilePreloader({ 
    shouldPreload: true, 
    pageName: 'profile' 
  });

  if (!userProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerCenter}>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitlePink}>Pro</Text>
              <Text style={styles.headerTitlePurple}>file</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => router.push('/settings')}
          >
            <Ionicons name="settings-outline" size={24} color="#c3b1e1" />
          </TouchableOpacity>
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="person-outline" size={48} color="#c3b1e1" />
          <Text style={styles.emptyStateText}>Complete your profile to get started!</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerCenter}>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitlePink}>Pro</Text>
            <Text style={styles.headerTitlePurple}>file</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => router.push('/settings')}
        >
          <Ionicons name="settings-outline" size={24} color="#c3b1e1" />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Large PFP */}
        <View style={styles.pfpContainer}>
          <CircularProfilePicture 
            userId={userProfile.id} 
            size={280}
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.optionButton}
            onPress={() => router.push('/edit-profile')}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['#FFFFFF', '#FFF0F5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.optionButtonGradient}
            >
              <Ionicons 
                name="create-outline" 
                size={24} 
                color="#c3b1e1" 
                style={styles.optionIcon}
              />
              <Text style={styles.optionLabel}>
                Edit Profile
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionButton}
            onPress={() => {
              // Navigate to view own profile
              router.push('/profile/me');
            }}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['#FFFFFF', '#FFF0F5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.optionButtonGradient}
            >
              <Ionicons 
                name="eye-outline" 
                size={24} 
                color="#c3b1e1" 
                style={styles.optionIcon}
              />
              <Text style={styles.optionLabel}>
                View Profile
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
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
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md, // Match messages page
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    position: 'relative',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  settingsButton: {
    position: 'absolute',
    right: SPACING.lg,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: 40, // Reduced to move PFP up more
  },
  pfpContainer: {
    marginBottom: 40, // Exact same value as paddingTop above
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonContainer: {
    width: '100%',
    gap: SPACING.md,
  },
  optionButton: {
    borderRadius: 16,
    minHeight: 72, // Increased to prevent cut-off
    borderWidth: 2,
    borderColor: '#FFE5F0', // Light pink border from design system
    shadowColor: '#FF4F81', // Pink shadow from design system
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden', // Ensure gradient doesn't overflow
  },
  optionButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start', // Push content to the left
    paddingVertical: 24, // Increased to prevent cut-off
    paddingHorizontal: SPACING.xl, // Same as continue button (32px)
    borderRadius: 14, // Slightly smaller to account for border
  },
  optionIcon: {
    marginRight: SPACING.md, // Using design system token
    marginTop: -2, // Move icons up slightly to align with text
  },
  optionLabel: {
    fontSize: 18, // Slightly smaller to prevent cut-off
    color: '#1B1B3A', // Primary text color from design system
    fontWeight: '600', // SemiBold weight for more prominence
    fontFamily: Fonts.semiBold, // Poppins SemiBold from design system
    lineHeight: 22, // Added line height for better text rendering
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#c3b1e1',
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: Fonts.regular,
    marginTop: SPACING.lg,
  },
});
