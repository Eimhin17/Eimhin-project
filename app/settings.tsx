import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Switch, Alert, Share } from 'react-native';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useUser } from '../contexts/UserContext';
import { useAuth } from '../contexts/AuthContext';
import { NotificationService } from '../services/notifications';
import { SPACING, BORDER_RADIUS } from '../utils/constants';
import { Fonts } from '../utils/fonts';
import { BackButton } from '../components/ui';
import PrivacyPolicyModal from '../components/PrivacyPolicyModal';
import TermsOfServiceModal from '../components/TermsOfServiceModal';
import LicensesModal from '../components/LicensesModal';
import PrivacyPreferencesModal from '../components/PrivacyPreferencesModal';
import CommunityGuidelinesModal from '../components/CommunityGuidelinesModal';
import SafetyTipsModal from '../components/SafetyTipsModal';
import HelpAndSupportModal from '../components/HelpAndSupportModal';
import DataUsageModal from '../components/DataUsageModal';
import DeleteAccountModal from '../components/DeleteAccountModal';

export default function SettingsScreen() {
  const { userProfile, updateUserProfile } = useUser();
  const { signOut, deleteAccount } = useAuth();
  const [darkMode, setDarkMode] = useState('system');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTermsOfService, setShowTermsOfService] = useState(false);
  const [showLicenses, setShowLicenses] = useState(false);
  const [showPrivacyPreferences, setShowPrivacyPreferences] = useState(false);
  const [showCommunityGuidelines, setShowCommunityGuidelines] = useState(false);
  const [showSafetyTips, setShowSafetyTips] = useState(false);
  const [showHelpAndSupport, setShowHelpAndSupport] = useState(false);
  const [showDataUsage, setShowDataUsage] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);

  // Load notification status on mount
  useEffect(() => {
    loadNotificationStatus();
  }, []);

  const loadNotificationStatus = async () => {
    try {
      const isEnabled = await NotificationService.areNotificationsEnabled();
      setPushNotifications(isEnabled);
      
      // Also load from user profile if available
      if (userProfile?.pushNotificationsEnabled !== undefined) {
        setPushNotifications(userProfile.pushNotificationsEnabled);
      }
    } catch (error) {
      console.error('Error loading notification status:', error);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.push('/');
          }
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    setShowDeleteAccount(true);
  };

  const handleConfirmDeleteAccount = async () => {
    try {
      const result = await deleteAccount();
      
      if (result.success) {
        Alert.alert(
          'Account Deleted',
          'Your account and all associated data have been permanently deleted.',
          [
            {
              text: 'OK',
              onPress: () => {
                router.push('/');
              }
            }
          ]
        );
      } else {
        Alert.alert(
          'Error',
          result.error || 'Failed to delete account. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      Alert.alert(
        'Error',
        'An unexpected error occurred. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleShare = async () => {
    try {
      const shareOptions = {
        message: 'Check out DebsMatch - the app for finding your perfect Debs date! 🎉\n\nFind someone special to go to Debs with or bring someone to your Debs. Download now!',
        url: 'https://debsmatch.ie', // Replace with your actual app store URL
        title: 'DebsMatch - Find Your Perfect Debs Date'
      };

      const result = await Share.share(shareOptions);
      
      if (result.action === Share.sharedAction) {
        console.log('Content shared successfully');
      } else if (result.action === Share.dismissedAction) {
        console.log('Share dismissed');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert(
        'Error',
        'Unable to share at this time. Please try again later.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleRestorePurchases = () => {
    Alert.alert(
      'Restore Purchases',
      'No purchases found to restore. DebsMatch is completely free to use with no in-app purchases required.',
      [
        { text: 'OK', style: 'default' }
      ]
    );
  };

  const handleDataUsagePress = () => {
    setShowDataUsage(true);
  };

  const handlePushNotificationToggle = async (enabled: boolean) => {
    if (enabled) {
      // Request notification permissions
      const permissionResult = await NotificationService.requestPermissions();
      
      if (permissionResult.granted) {
        console.log('✅ Push notification permissions granted');
        setPushNotifications(true);
        
        // Update user profile
        await updateUserProfile({ pushNotificationsEnabled: true });
        
        // Schedule test notification
        await NotificationService.scheduleTestNotification();
      } else {
        console.log('❌ Push notification permissions denied');
        
        if (permissionResult.canAskAgain) {
          Alert.alert(
            'Enable Notifications',
            'To receive push notifications, please allow notifications for DebsMatch in your device settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Open Settings', 
                onPress: async () => {
                  await NotificationService.openNotificationSettings();
                }
              }
            ]
          );
        } else {
          Alert.alert(
            'Notifications Disabled',
            'Notifications are currently disabled. To enable them, go to Settings > Notifications > DebsMatch and turn them on.',
            [
              { text: 'OK' },
              { 
                text: 'Open Settings', 
                onPress: async () => {
                  await NotificationService.openNotificationSettings();
                }
              }
            ]
          );
        }
      }
    } else {
      // Disable notifications
      setPushNotifications(false);
      await updateUserProfile({ pushNotificationsEnabled: false });
    }
  };

  const handleEmailNotificationToggle = async (enabled: boolean) => {
    setEmailNotifications(enabled);
    await updateUserProfile({ emailNotificationsEnabled: enabled });
  };

  const handlePrivacyPolicyPress = () => {
    setShowPrivacyPolicy(true);
  };

  const handleTermsOfServicePress = () => {
    setShowTermsOfService(true);
  };

  const handleLicensesPress = () => {
    setShowLicenses(true);
  };

  const handlePrivacyPreferencesPress = () => {
    setShowPrivacyPreferences(true);
  };

  const handleCommunityGuidelinesPress = () => {
    setShowCommunityGuidelines(true);
  };

  const handleSafetyTipsPress = () => {
    setShowSafetyTips(true);
  };

  const handleHelpAndSupportPress = () => {
    setShowHelpAndSupport(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Account Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="mail" size={20} color="#FF4F81" />
              <Text style={styles.settingLabel}>Email</Text>
            </View>
            <Text style={styles.settingValue}>{userProfile?.email || 'Not set'}</Text>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="person" size={20} color="#FF4F81" />
              <Text style={styles.settingLabel}>First Name</Text>
            </View>
            <Text style={styles.settingValue}>{userProfile?.firstName || 'Not set'}</Text>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="at" size={20} color="#FF4F81" />
              <Text style={styles.settingLabel}>Username</Text>
            </View>
            <Text style={styles.settingValue}>{userProfile?.username || 'Not set'}</Text>
          </View>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="location" size={20} color="#FF4F81" />
              <Text style={styles.settingLabel}>
                {userProfile?.county ? `${userProfile.county}, Ireland` : 'County, Ireland'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Data Usage */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Usage</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={handleDataUsagePress}>
            <View style={styles.settingLeft}>
              <Ionicons name="analytics" size={20} color="#FF4F81" />
              <Text style={styles.settingLabel}>Data Usage</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Active Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Status</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="pulse" size={20} color="#FF4F81" />
              <Text style={styles.settingLabel}>Status</Text>
            </View>
            <View style={styles.statusContainer}>
              <View style={[styles.statusDot, { backgroundColor: userProfile?.status === 'active' ? '#10B981' : '#EF4444' }]} />
              <Text style={styles.statusText}>{userProfile?.status === 'active' ? 'Active' : 'Inactive'}</Text>
            </View>
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="mail" size={20} color="#FF4F81" />
              <Text style={styles.settingLabel}>Email</Text>
            </View>
            <Switch
              value={emailNotifications}
              onValueChange={handleEmailNotificationToggle}
              trackColor={{ false: '#E5E7EB', true: '#FF4F81' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="notifications" size={20} color="#FF4F81" />
              <Text style={styles.settingLabel}>Push Notifications</Text>
            </View>
            <Switch
              value={pushNotifications}
              onValueChange={handlePushNotificationToggle}
              trackColor={{ false: '#E5E7EB', true: '#FF4F81' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Dark Mode */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dark Mode</Text>
          
          <TouchableOpacity 
            style={[styles.settingItem, darkMode === 'system' && styles.selectedItem]}
            onPress={() => setDarkMode('system')}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="phone-portrait" size={20} color="#FF4F81" />
              <Text style={styles.settingLabel}>Use system setting</Text>
            </View>
            {darkMode === 'system' && <Ionicons name="checkmark" size={20} color="#FF4F81" />}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingItem, darkMode === 'light' && styles.selectedItem]}
            onPress={() => setDarkMode('light')}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="sunny" size={20} color="#FF4F81" />
              <Text style={styles.settingLabel}>Light Mode</Text>
            </View>
            {darkMode === 'light' && <Ionicons name="checkmark" size={20} color="#FF4F81" />}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingItem, darkMode === 'dark' && styles.selectedItem]}
            onPress={() => setDarkMode('dark')}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="moon" size={20} color="#FF4F81" />
              <Text style={styles.settingLabel}>Dark Mode</Text>
            </View>
            {darkMode === 'dark' && <Ionicons name="checkmark" size={20} color="#FF4F81" />}
          </TouchableOpacity>
        </View>

        {/* Restore Purchases */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Restore Purchases</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={handleRestorePurchases}>
            <View style={styles.settingLeft}>
              <Ionicons name="refresh" size={20} color="#FF4F81" />
              <Text style={styles.settingLabel}>Restore here</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Share DebsMatch */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Share DebsMatch</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={handleShare}>
            <View style={styles.settingLeft}>
              <Ionicons name="share" size={20} color="#FF4F81" />
              <Text style={styles.settingLabel}>Share</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Contact Us */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={handleHelpAndSupportPress}>
            <View style={styles.settingLeft}>
              <Ionicons name="help-circle" size={20} color="#FF4F81" />
              <Text style={styles.settingLabel}>Help and Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Community */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Community</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={handleCommunityGuidelinesPress}>
            <View style={styles.settingLeft}>
              <Ionicons name="people" size={20} color="#FF4F81" />
              <Text style={styles.settingLabel}>Community Guidelines</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handleSafetyTipsPress}>
            <View style={styles.settingLeft}>
              <Ionicons name="shield-checkmark" size={20} color="#FF4F81" />
              <Text style={styles.settingLabel}>Safety Tips</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Privacy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={handlePrivacyPolicyPress}>
            <View style={styles.settingLeft}>
              <Ionicons name="lock-closed" size={20} color="#FF4F81" />
              <Text style={styles.settingLabel}>Privacy Policy</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handlePrivacyPreferencesPress}>
            <View style={styles.settingLeft}>
              <Ionicons name="settings" size={20} color="#FF4F81" />
              <Text style={styles.settingLabel}>Privacy Preferences</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Legal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={handleLicensesPress}>
            <View style={styles.settingLeft}>
              <Ionicons name="document-text" size={20} color="#FF4F81" />
              <Text style={styles.settingLabel}>Licences</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handleTermsOfServicePress}>
            <View style={styles.settingLeft}>
              <Ionicons name="document" size={20} color="#FF4F81" />
              <Text style={styles.settingLabel}>Terms of Service</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutItem} onPress={handleSignOut}>
            <Ionicons name="log-out" size={20} color="#FF4F81" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Delete Account */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.deleteItem} onPress={handleDeleteAccount}>
            <Ionicons name="trash" size={20} color="#EF4444" />
            <Text style={styles.deleteText}>Delete Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

        {/* Privacy Policy Modal */}
        <PrivacyPolicyModal
          visible={showPrivacyPolicy}
          onClose={() => setShowPrivacyPolicy(false)}
        />

        {/* Terms of Service Modal */}
        <TermsOfServiceModal
          visible={showTermsOfService}
          onClose={() => setShowTermsOfService(false)}
        />

        {/* Licenses Modal */}
        <LicensesModal
          visible={showLicenses}
          onClose={() => setShowLicenses(false)}
        />

        {/* Privacy Preferences Modal */}
        <PrivacyPreferencesModal
          visible={showPrivacyPreferences}
          onClose={() => setShowPrivacyPreferences(false)}
        />

        {/* Community Guidelines Modal */}
        <CommunityGuidelinesModal
          visible={showCommunityGuidelines}
          onClose={() => setShowCommunityGuidelines(false)}
        />

        {/* Safety Tips Modal */}
        <SafetyTipsModal
          visible={showSafetyTips}
          onClose={() => setShowSafetyTips(false)}
        />

        {/* Help and Support Modal */}
        <HelpAndSupportModal
          visible={showHelpAndSupport}
          onClose={() => setShowHelpAndSupport(false)}
        />

        {/* Data Usage Modal */}
        <DataUsageModal
          visible={showDataUsage}
          onClose={() => setShowDataUsage(false)}
        />

        {/* Delete Account Modal */}
        <DeleteAccountModal
          visible={showDeleteAccount}
          onClose={() => setShowDeleteAccount(false)}
          onConfirm={handleConfirmDeleteAccount}
        />
    </SafeAreaView>
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
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    minHeight: 60,
  },
  headerCenter: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 0,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1B1B3A',
    fontFamily: Fonts.bold,
  },
  headerRight: {
    width: 72,
    zIndex: 1,
  },
  content: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: SPACING.lg,
    marginHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#c3b1e1',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    fontFamily: Fonts.semiBold,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    color: '#1B1B3A',
    fontWeight: '500',
    marginLeft: SPACING.md,
    fontFamily: Fonts.regular,
  },
  settingValue: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: Fonts.regular,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SPACING.sm,
  },
  statusText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    fontFamily: Fonts.regular,
  },
  selectedItem: {
    backgroundColor: '#FFF0F5',
  },
  logoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  logoutText: {
    fontSize: 16,
    color: '#c3b1e1',
    fontWeight: '600',
    marginLeft: SPACING.sm,
    fontFamily: Fonts.semiBold,
  },
  deleteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  deleteText: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '600',
    marginLeft: SPACING.sm,
    fontFamily: Fonts.semiBold,
  },
});
