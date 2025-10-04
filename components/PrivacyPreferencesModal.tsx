import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Switch,
  Alert,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SPACING, BORDER_RADIUS } from '../utils/constants';
import { Fonts } from '../utils/fonts';
import { BackButton } from './ui';
import { useUser } from '../contexts/UserContext';
import { playLightHaptic } from '../utils/haptics';

interface PrivacyPreferencesModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function PrivacyPreferencesModal({ visible, onClose }: PrivacyPreferencesModalProps) {
  const { userProfile, updateUserProfile } = useUser();

  // Animation values for back button
  const backButtonScale = useRef(new Animated.Value(0.8)).current;
  const backButtonOpacity = useRef(new Animated.Value(0.3)).current;

  // Privacy settings state
  const [profileVisibility, setProfileVisibility] = useState('public');
  const [showAge, setShowAge] = useState(true);
  const [showSchool, setShowSchool] = useState(true);
  const [showLocation, setShowLocation] = useState(true);
  const [allowMessaging, setAllowMessaging] = useState(true);
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [dataAnalytics, setDataAnalytics] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);

  useEffect(() => {
    if (visible) {
      // Reset and animate in when modal opens
      backButtonScale.setValue(0.8);
      backButtonOpacity.setValue(0.3);

      Animated.parallel([
        Animated.timing(backButtonOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(backButtonScale, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  // Load current privacy settings
  useEffect(() => {
    if (userProfile) {
      setProfileVisibility(userProfile.privacyLevel || 'public');
      setShowAge(userProfile.showAge !== false);
      setShowSchool(userProfile.showSchool !== false);
      setShowLocation(userProfile.showLocation !== false);
      setAllowMessaging(userProfile.allowMessaging !== false);
      setShowOnlineStatus(userProfile.showOnlineStatus !== false);
      setDataAnalytics(userProfile.dataAnalytics !== false);
      setMarketingEmails(userProfile.marketingEmails === true);
    }
  }, [userProfile]);

  const handleSavePreferences = async () => {
    try {
      await updateUserProfile({
        privacyLevel: profileVisibility,
        showAge,
        showSchool,
        showLocation,
        allowMessaging,
        showOnlineStatus,
        dataAnalytics,
        marketingEmails,
      });
      
      Alert.alert(
        'Preferences Saved',
        'Your privacy preferences have been updated successfully.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error saving privacy preferences:', error);
      Alert.alert(
        'Error',
        'Failed to save your preferences. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleProfileVisibilityChange = (value: string) => {
    setProfileVisibility(value);
  };

  const handleBackPress = () => {
    playLightHaptic();
    // Animate back with fade + scale combo
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
      onClose();
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleBackPress}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.backButtonWrapper}>
            <Animated.View style={{
              opacity: backButtonOpacity,
              transform: [{ scale: backButtonScale }],
            }}>
              <BackButton
                onPress={handleBackPress}
                color="#c3b1e1"
                size={72}
                iconSize={28}
              />
            </Animated.View>
          </View>
          <View style={styles.headerCenter}>
            <Text style={styles.title}>Privacy Pref</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={handleSavePreferences} style={styles.saveButton}>
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.intro}>
            <LinearGradient
              colors={['#FFF0F5', '#FFFFFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.introGradient}
            >
              <Ionicons name="shield-checkmark" size={24} color="#FF4F81" />
              <Text style={styles.description}>
                Control who can see your information and how your data is used.
              </Text>
            </LinearGradient>
          </View>

          {/* Profile Visibility */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Profile Visibility</Text>
            <Text style={styles.sectionDescription}>
              Choose who can see your profile
            </Text>
            
            <View style={styles.optionGroup}>
              <TouchableOpacity
                style={styles.optionButton}
                onPress={() => handleProfileVisibilityChange('public')}
              >
                <LinearGradient
                  colors={profileVisibility === 'public' ? ['#F8F4FF', '#FFFFFF'] : ['#F8F9FA', '#FFFFFF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.optionGradient}
                >
                  <View style={styles.optionContent}>
                    <Ionicons 
                      name="globe" 
                      size={20} 
                      color={profileVisibility === 'public' ? '#c3b1e1' : '#9CA3AF'} 
                    />
                    <View style={styles.optionTextContent}>
                      <Text style={[
                        styles.optionTitle,
                        profileVisibility === 'public' && styles.optionTitleActive
                      ]}>
                        Public
                      </Text>
                      <Text style={[
                        styles.optionDescription,
                        profileVisibility === 'public' && styles.optionDescriptionActive
                      ]}>
                        Visible to all users
                      </Text>
                    </View>
                  </View>
                  {profileVisibility === 'public' && (
                    <Ionicons name="checkmark-circle" size={20} color="#c3b1e1" />
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionButton}
                onPress={() => handleProfileVisibilityChange('friends_only')}
              >
                <LinearGradient
                  colors={profileVisibility === 'friends_only' ? ['#FFF0F5', '#FFFFFF'] : ['#F8F9FA', '#FFFFFF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.optionGradient}
                >
                  <View style={styles.optionContent}>
                    <Ionicons 
                      name="people" 
                      size={20} 
                      color={profileVisibility === 'friends_only' ? '#FF4F81' : '#9CA3AF'} 
                    />
                    <View style={styles.optionTextContent}>
                      <Text style={[
                        styles.optionTitle,
                        profileVisibility === 'friends_only' && styles.optionTitleActive
                      ]}>
                        Friends Only
                      </Text>
                      <Text style={[
                        styles.optionDescription,
                        profileVisibility === 'friends_only' && styles.optionDescriptionActive
                      ]}>
                        Only visible to your matches
                      </Text>
                    </View>
                  </View>
                  {profileVisibility === 'friends_only' && (
                    <Ionicons name="checkmark-circle" size={20} color="#FF4F81" />
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionButton}
                onPress={() => handleProfileVisibilityChange('private')}
              >
                <LinearGradient
                  colors={profileVisibility === 'private' ? ['#F8F4FF', '#FFFFFF'] : ['#F8F9FA', '#FFFFFF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.optionGradient}
                >
                  <View style={styles.optionContent}>
                    <Ionicons 
                      name="lock-closed" 
                      size={20} 
                      color={profileVisibility === 'private' ? '#c3b1e1' : '#9CA3AF'} 
                    />
                    <View style={styles.optionTextContent}>
                      <Text style={[
                        styles.optionTitle,
                        profileVisibility === 'private' && styles.optionTitleActive
                      ]}>
                        Private
                      </Text>
                      <Text style={[
                        styles.optionDescription,
                        profileVisibility === 'private' && styles.optionDescriptionActive
                      ]}>
                        Only visible to you
                      </Text>
                    </View>
                  </View>
                  {profileVisibility === 'private' && (
                    <Ionicons name="checkmark-circle" size={20} color="#c3b1e1" />
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          {/* Information Sharing */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Information Sharing</Text>
            <Text style={styles.sectionDescription}>
              Choose what information to show on your profile
            </Text>

            <View style={styles.settingCard}>
              <LinearGradient
                colors={['#F8F4FF', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.settingGradient}
              >
                <Ionicons name="calendar" size={20} color="#c3b1e1" />
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Show Age</Text>
                  <Text style={styles.settingDescription}>Display your age on your profile</Text>
                </View>
                <Switch
                  value={showAge}
                  onValueChange={setShowAge}
                  trackColor={{ false: '#E0E0E0', true: '#c3b1e1' }}
                  thumbColor="#FFFFFF"
                />
              </LinearGradient>
            </View>

            <View style={styles.settingCard}>
              <LinearGradient
                colors={['#FFF0F5', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.settingGradient}
              >
                <Ionicons name="school" size={20} color="#FF4F81" />
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Show School</Text>
                  <Text style={styles.settingDescription}>Display your school information</Text>
                </View>
                <Switch
                  value={showSchool}
                  onValueChange={setShowSchool}
                  trackColor={{ false: '#E0E0E0', true: '#FF4F81' }}
                  thumbColor="#FFFFFF"
                />
              </LinearGradient>
            </View>

            <View style={styles.settingCard}>
              <LinearGradient
                colors={['#F8F4FF', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.settingGradient}
              >
                <Ionicons name="location" size={20} color="#c3b1e1" />
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Show Location</Text>
                  <Text style={styles.settingDescription}>Display your county/location</Text>
                </View>
                <Switch
                  value={showLocation}
                  onValueChange={setShowLocation}
                  trackColor={{ false: '#E0E0E0', true: '#c3b1e1' }}
                  thumbColor="#FFFFFF"
                />
              </LinearGradient>
            </View>
          </View>

          {/* Communication */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Communication</Text>
            <Text style={styles.sectionDescription}>
              Control how others can contact you
            </Text>

            <View style={styles.settingCard}>
              <LinearGradient
                colors={['#FFF0F5', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.settingGradient}
              >
                <Ionicons name="chatbubble" size={20} color="#FF4F81" />
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Allow Messaging</Text>
                  <Text style={styles.settingDescription}>Let other users send you messages</Text>
                </View>
                <Switch
                  value={allowMessaging}
                  onValueChange={setAllowMessaging}
                  trackColor={{ false: '#E0E0E0', true: '#FF4F81' }}
                  thumbColor="#FFFFFF"
                />
              </LinearGradient>
            </View>

            <View style={styles.settingCard}>
              <LinearGradient
                colors={['#F8F4FF', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.settingGradient}
              >
                <Ionicons name="radio-button-on" size={20} color="#c3b1e1" />
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Show Online Status</Text>
                  <Text style={styles.settingDescription}>Let others see when you're online</Text>
                </View>
                <Switch
                  value={showOnlineStatus}
                  onValueChange={setShowOnlineStatus}
                  trackColor={{ false: '#E0E0E0', true: '#c3b1e1' }}
                  thumbColor="#FFFFFF"
                />
              </LinearGradient>
            </View>
          </View>

          {/* Data Usage */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data Usage</Text>
            <Text style={styles.sectionDescription}>
              Control how your data is used to improve the app
            </Text>

            <View style={styles.settingCard}>
              <LinearGradient
                colors={['#F8F4FF', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.settingGradient}
              >
                <Ionicons name="analytics" size={20} color="#c3b1e1" />
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Analytics & Insights</Text>
                  <Text style={styles.settingDescription}>Help us improve the app with anonymous usage data</Text>
                </View>
                <Switch
                  value={dataAnalytics}
                  onValueChange={setDataAnalytics}
                  trackColor={{ false: '#E0E0E0', true: '#c3b1e1' }}
                  thumbColor="#FFFFFF"
                />
              </LinearGradient>
            </View>

            <View style={styles.settingCard}>
              <LinearGradient
                colors={['#FFF0F5', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.settingGradient}
              >
                <Ionicons name="mail" size={20} color="#FF4F81" />
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Marketing Emails</Text>
                  <Text style={styles.settingDescription}>Receive promotional emails and updates</Text>
                </View>
                <Switch
                  value={marketingEmails}
                  onValueChange={setMarketingEmails}
                  trackColor={{ false: '#E0E0E0', true: '#FF4F81' }}
                  thumbColor="#FFFFFF"
                />
              </LinearGradient>
            </View>
          </View>

          {/* Data Rights */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Data Rights</Text>
            <Text style={styles.sectionDescription}>
              You have the right to access, modify, or delete your data
            </Text>

            <TouchableOpacity style={styles.actionButton}>
              <LinearGradient
                colors={['#F8F4FF', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.actionGradient}
              >
                <Ionicons name="download" size={20} color="#c3b1e1" />
                <Text style={styles.actionButtonText}>Download My Data</Text>
                <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <LinearGradient
                colors={['#FFE5F0', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.actionGradient}
              >
                <Ionicons name="trash" size={20} color="#FF4F81" />
                <Text style={[styles.actionButtonText, { color: '#FF4F81' }]}>Delete My Account</Text>
                <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <LinearGradient
              colors={['#F8F4FF', '#FFFFFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.footerGradient}
            >
              <Ionicons name="shield-checkmark" size={20} color="#c3b1e1" />
              <Text style={styles.footerText}>
                Your privacy is important to us. These settings help you control how your 
                information is shared and used. You can change these preferences at any time.
              </Text>
            </LinearGradient>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: '#FAFAFA',
    minHeight: 60,
  },
  backButtonWrapper: {
    width: 72,
    marginLeft: -SPACING.lg,
    zIndex: 1,
  },
  headerCenter: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 0,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1B1B3A',
    fontFamily: Fonts.bold,
  },
  headerRight: {
    width: 72,
    zIndex: 1,
    alignItems: 'flex-end',
  },
  saveButton: {
    padding: SPACING.sm,
  },
  saveText: {
    fontSize: 16,
    color: '#c3b1e1',
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  intro: {
    marginBottom: SPACING.lg,
  },
  introGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1B1B3A',
    marginLeft: SPACING.md,
    flex: 1,
    fontFamily: Fonts.regular,
  },
  section: {
    marginBottom: SPACING['2xl'],
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#c3b1e1',
    marginBottom: SPACING.sm,
    fontFamily: Fonts.semiBold,
  },
  sectionDescription: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: SPACING.lg,
    fontFamily: Fonts.regular,
  },
  optionGroup: {
    gap: SPACING.md,
  },
  optionButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  optionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionTextContent: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B1B3A',
    marginBottom: SPACING.xs,
    fontFamily: Fonts.semiBold,
  },
  optionTitleActive: {
    color: '#1B1B3A',
  },
  optionDescription: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: Fonts.regular,
  },
  optionDescriptionActive: {
    color: '#6B7280',
  },
  settingCard: {
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  settingGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
  },
  settingInfo: {
    flex: 1,
    marginLeft: SPACING.md,
    marginRight: SPACING.md,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B1B3A',
    marginBottom: SPACING.xs,
    fontFamily: Fonts.semiBold,
  },
  settingDescription: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: Fonts.regular,
  },
  actionButton: {
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B1B3A',
    marginLeft: SPACING.md,
    flex: 1,
    fontFamily: Fonts.semiBold,
  },
  footer: {
    marginTop: SPACING['2xl'],
    marginBottom: SPACING['2xl'],
  },
  footerGradient: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  footerText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: SPACING.sm,
    fontFamily: Fonts.regular,
  },
});