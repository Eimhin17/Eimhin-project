import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SPACING, BORDER_RADIUS } from '../utils/constants';
import { Fonts } from '../utils/fonts';
import { BackButton } from './ui';

interface DataUsageModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function DataUsageModal({ visible, onClose }: DataUsageModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <BackButton onPress={onClose} />
          <View style={styles.headerCenter}>
            <Text style={styles.title}>Data Usage & Advertising</Text>
          </View>
          <View style={styles.headerRight} />
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
              <Ionicons name="information-circle" size={24} color="#FF4F81" />
              <Text style={styles.introText}>
                DebsMatch uses your data to provide personalized experiences and relevant 
                advertisements. Learn more about how we use your information.
              </Text>
            </LinearGradient>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How We Use Your Data</Text>
            
            <View style={styles.usageCard}>
              <LinearGradient
                colors={['#FFF0F5', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <Ionicons name="person" size={24} color="#FF4F81" />
                <View style={styles.usageContent}>
                  <Text style={styles.usageTitle}>Profile Matching</Text>
                  <Text style={styles.usageDescription}>
                    Your profile information, interests, and preferences are used to show you 
                    relevant matches and improve your dating experience.
                  </Text>
                </View>
              </LinearGradient>
            </View>

            <View style={styles.usageCard}>
              <LinearGradient
                colors={['#F8F4FF', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <Ionicons name="location" size={24} color="#c3b1e1" />
                <View style={styles.usageContent}>
                  <Text style={styles.usageTitle}>Location-Based Matching</Text>
                  <Text style={styles.usageDescription}>
                    We use your county information to help you find local matches and 
                    people attending nearby Debs events.
                  </Text>
                </View>
              </LinearGradient>
            </View>

            <View style={styles.usageCard}>
              <LinearGradient
                colors={['#FFF0F5', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <Ionicons name="trending-up" size={24} color="#FF4F81" />
                <View style={styles.usageContent}>
                  <Text style={styles.usageTitle}>App Improvement</Text>
                  <Text style={styles.usageDescription}>
                    Usage patterns and app interactions help us improve features, 
                    fix bugs, and enhance your overall experience.
                  </Text>
                </View>
              </LinearGradient>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Advertising & Marketing</Text>
            
            <View style={styles.adCard}>
              <LinearGradient
                colors={['#FFF0F5', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <Ionicons name="megaphone" size={24} color="#FF4F81" />
                <View style={styles.usageContent}>
                  <Text style={styles.usageTitle}>Targeted Advertising</Text>
                  <Text style={styles.usageDescription}>
                    We may share anonymous, aggregated data with advertising partners to show you 
                    relevant ads for products and services you might be interested in.
                  </Text>
                </View>
              </LinearGradient>
            </View>

            <View style={styles.adCard}>
              <LinearGradient
                colors={['#F8F4FF', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <Ionicons name="shield-checkmark" size={24} color="#c3b1e1" />
                <View style={styles.usageContent}>
                  <Text style={styles.usageTitle}>Privacy Protection</Text>
                  <Text style={styles.usageDescription}>
                    We never sell your personal information. All shared data is anonymized 
                    and cannot be traced back to you individually.
                  </Text>
                </View>
              </LinearGradient>
            </View>

            <View style={styles.adCard}>
              <LinearGradient
                colors={['#FFF0F5', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <Ionicons name="settings" size={24} color="#FF4F81" />
                <View style={styles.usageContent}>
                  <Text style={styles.usageTitle}>Your Control</Text>
                  <Text style={styles.usageDescription}>
                    You can opt out of personalized advertising in your Privacy Preferences. 
                    You'll still see ads, but they won't be tailored to your interests.
                  </Text>
                </View>
              </LinearGradient>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data Types We Collect</Text>
            
            <View style={styles.dataTypeCard}>
              <LinearGradient
                colors={['#F8F4FF', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <Ionicons name="person-circle" size={24} color="#c3b1e1" />
                <View style={styles.usageContent}>
                  <Text style={styles.usageTitle}>Profile Information</Text>
                  <Text style={styles.usageDescription}>
                    Name, age, bio, photos, interests, school information, and preferences
                  </Text>
                </View>
              </LinearGradient>
            </View>

            <View style={styles.dataTypeCard}>
              <LinearGradient
                colors={['#FFF0F5', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <Ionicons name="analytics" size={24} color="#FF4F81" />
                <View style={styles.usageContent}>
                  <Text style={styles.usageTitle}>Usage Data</Text>
                  <Text style={styles.usageDescription}>
                    App interactions, features used, time spent, and engagement patterns
                  </Text>
                </View>
              </LinearGradient>
            </View>

            <View style={styles.dataTypeCard}>
              <LinearGradient
                colors={['#F8F4FF', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <Ionicons name="location" size={24} color="#c3b1e1" />
                <View style={styles.usageContent}>
                  <Text style={styles.usageTitle}>Location Data</Text>
                  <Text style={styles.usageDescription}>
                    County information only (no precise location tracking)
                  </Text>
                </View>
              </LinearGradient>
            </View>

            <View style={styles.dataTypeCard}>
              <LinearGradient
                colors={['#FFF0F5', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <Ionicons name="phone-portrait" size={24} color="#FF4F81" />
                <View style={styles.usageContent}>
                  <Text style={styles.usageTitle}>Device Information</Text>
                  <Text style={styles.usageDescription}>
                    Device type, operating system, app version, and technical specifications
                  </Text>
                </View>
              </LinearGradient>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data Security & Privacy</Text>
            
            <View style={styles.securityCard}>
              <LinearGradient
                colors={['#F8F4FF', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <Ionicons name="lock-closed" size={24} color="#c3b1e1" />
                <View style={styles.usageContent}>
                  <Text style={styles.usageTitle}>Secure Storage</Text>
                  <Text style={styles.usageDescription}>
                    All your data is encrypted and stored securely using industry-standard 
                    security measures and protocols.
                  </Text>
                </View>
              </LinearGradient>
            </View>

            <View style={styles.securityCard}>
              <LinearGradient
                colors={['#FFF0F5', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <Ionicons name="eye-off" size={24} color="#FF4F81" />
                <View style={styles.usageContent}>
                  <Text style={styles.usageTitle}>Anonymous Sharing</Text>
                  <Text style={styles.usageDescription}>
                    When we share data with partners, it's always anonymized and aggregated 
                    to protect your individual privacy.
                  </Text>
                </View>
              </LinearGradient>
            </View>

            <View style={styles.securityCard}>
              <LinearGradient
                colors={['#F8F4FF', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <Ionicons name="trash" size={24} color="#c3b1e1" />
                <View style={styles.usageContent}>
                  <Text style={styles.usageTitle}>Data Deletion</Text>
                  <Text style={styles.usageDescription}>
                    You can request deletion of your data at any time. We'll remove your 
                    information within 30 days of your request.
                  </Text>
                </View>
              </LinearGradient>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Privacy Controls</Text>
            
            <View style={styles.controlCard}>
              <LinearGradient
                colors={['#FFF0F5', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <Ionicons name="settings" size={24} color="#FF4F81" />
                <View style={styles.usageContent}>
                  <Text style={styles.usageTitle}>Privacy Preferences</Text>
                  <Text style={styles.usageDescription}>
                    Adjust what information is shared and how your data is used in the 
                    Privacy Preferences section of Settings.
                  </Text>
                </View>
              </LinearGradient>
            </View>

            <View style={styles.controlCard}>
              <LinearGradient
                colors={['#F8F4FF', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <Ionicons name="ban" size={24} color="#c3b1e1" />
                <View style={styles.usageContent}>
                  <Text style={styles.usageTitle}>Opt Out of Ads</Text>
                  <Text style={styles.usageDescription}>
                    Disable personalized advertising while still using all app features 
                    and seeing general advertisements.
                  </Text>
                </View>
              </LinearGradient>
            </View>

            <View style={styles.controlCard}>
              <LinearGradient
                colors={['#FFF0F5', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <Ionicons name="download" size={24} color="#FF4F81" />
                <View style={styles.usageContent}>
                  <Text style={styles.usageTitle}>Data Export</Text>
                  <Text style={styles.usageDescription}>
                    Request a copy of all your data to see exactly what information 
                    we have about you.
                  </Text>
                </View>
              </LinearGradient>
            </View>
          </View>

          <View style={styles.footer}>
            <LinearGradient
              colors={['#F8F4FF', '#FFFFFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.footerGradient}
            >
              <Ionicons name="mail" size={20} color="#c3b1e1" />
              <Text style={styles.footerText}>
                We're committed to transparency and protecting your privacy. If you have 
                any questions about how we use your data, please contact us at 
                privacy@debsmatch.ie
              </Text>
              <Text style={styles.footerText}>
                You can update your privacy preferences at any time in Settings > 
                Privacy Preferences.
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
  title: {
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
  introText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1B1B3A',
    marginLeft: SPACING.md,
    flex: 1,
    fontFamily: Fonts.regular,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#c3b1e1',
    marginBottom: SPACING.md,
    fontFamily: Fonts.semiBold,
  },
  usageCard: {
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardGradient: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
  },
  usageContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  usageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B1B3A',
    marginBottom: SPACING.xs,
    fontFamily: Fonts.semiBold,
  },
  usageDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
    fontFamily: Fonts.regular,
  },
  adCard: {
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dataTypeCard: {
    marginBottom: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  securityCard: {
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  controlCard: {
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
    marginBottom: SPACING.sm,
    fontFamily: Fonts.regular,
  },
});