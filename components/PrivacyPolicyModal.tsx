import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SPACING, BORDER_RADIUS } from '../utils/constants';
import { Fonts } from '../utils/fonts';
import { BackButton } from './ui';
import { playLightHaptic } from '../utils/haptics';

interface PrivacyPolicyModalProps {
  visible: boolean;
  onClose: () => void;
}

const { height: screenHeight } = Dimensions.get('window');

export default function PrivacyPolicyModal({ visible, onClose }: PrivacyPolicyModalProps) {
  const backButtonScale = useRef(new Animated.Value(0.8)).current;
  const backButtonOpacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (visible) {
      // Animate back button on modal open - match onboarding pattern
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

  const handleBackPress = () => {
    // Match onboarding: light haptic + fade/scale out then close
    playLightHaptic();
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
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.backButtonWrapper}>
            <Animated.View style={{ opacity: backButtonOpacity, transform: [{ scale: backButtonScale }] }}>
              <BackButton
                onPress={handleBackPress}
                color="#c3b1e1"
                size={72}
                iconSize={28}
              />
            </Animated.View>
          </View>
          <View style={styles.headerCenter} pointerEvents="none">
            <Text style={styles.title}>Privacy Policy</Text>
          </View>
          <View style={styles.headerRight} />
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.lastUpdated}>Last updated: {new Date().toLocaleDateString()}</Text>

          <View style={styles.intro}>
            <LinearGradient
              colors={['#FFF0F5', '#FFFFFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.introGradient}
            >
              <Ionicons name="shield-checkmark" size={24} color="#FF4F81" />
              <Text style={styles.introText}>
                Your privacy is important to us. This policy explains how we collect, use, and protect 
                your personal information when you use DebsMatch.
              </Text>
            </LinearGradient>
          </View>

          <View style={styles.section}>
            <View style={styles.policyCard}>
              <LinearGradient
                colors={['#F8F4FF', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <Ionicons name="information-circle" size={24} color="#c3b1e1" />
                <View style={styles.cardContent}>
                  <Text style={styles.sectionTitle}>1. Information We Collect</Text>
                  <Text style={styles.paragraph}>
                    We collect information you provide directly to us, such as when you create an account, 
                    complete your profile, or use our services:
                  </Text>
                  <Text style={styles.bulletPoint}>• Personal information (name, date of birth, email, phone number)</Text>
                  <Text style={styles.bulletPoint}>• Profile information (photos, bio, interests, school information)</Text>
                  <Text style={styles.bulletPoint}>• Location data (county, school location for matching purposes)</Text>
                  <Text style={styles.bulletPoint}>• Communication data (messages, voice prompts, profile responses)</Text>
                  <Text style={styles.bulletPoint}>• Usage data (app interactions, preferences, settings)</Text>
                </View>
              </LinearGradient>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.policyCard}>
              <LinearGradient
                colors={['#FFF0F5', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <Ionicons name="settings" size={24} color="#FF4F81" />
                <View style={styles.cardContent}>
                  <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
                  <Text style={styles.paragraph}>We use your information to:</Text>
                  <Text style={styles.bulletPoint}>• Provide and improve our matching services</Text>
                  <Text style={styles.bulletPoint}>• Create and maintain your profile</Text>
                  <Text style={styles.bulletPoint}>• Facilitate connections between users</Text>
                  <Text style={styles.bulletPoint}>• Send you notifications about matches and messages</Text>
                  <Text style={styles.bulletPoint}>• Ensure safety and prevent abuse</Text>
                  <Text style={styles.bulletPoint}>• Comply with legal obligations</Text>
                </View>
              </LinearGradient>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.policyCard}>
              <LinearGradient
                colors={['#F8F4FF', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <Ionicons name="people" size={24} color="#c3b1e1" />
                <View style={styles.cardContent}>
                  <Text style={styles.sectionTitle}>3. Information Sharing</Text>
                  <Text style={styles.paragraph}>
                    We do not sell your personal information. We may share your information only in these limited circumstances:
                  </Text>
                  <Text style={styles.bulletPoint}>• With other users as part of our matching service (profile information only)</Text>
                  <Text style={styles.bulletPoint}>• With service providers who help us operate our app</Text>
                  <Text style={styles.bulletPoint}>• When required by law or to protect our rights</Text>
                  <Text style={styles.bulletPoint}>• In case of a business transfer (with notice)</Text>
                </View>
              </LinearGradient>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.policyCard}>
              <LinearGradient
                colors={['#FFF0F5', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <Ionicons name="lock-closed" size={24} color="#FF4F81" />
                <View style={styles.cardContent}>
                  <Text style={styles.sectionTitle}>4. Data Security</Text>
                  <Text style={styles.paragraph}>
                    We implement appropriate security measures to protect your personal information:
                  </Text>
                  <Text style={styles.bulletPoint}>• End-to-end encryption for messages</Text>
                  <Text style={styles.bulletPoint}>• Secure data storage and transmission</Text>
                  <Text style={styles.bulletPoint}>• Regular security audits and updates</Text>
                  <Text style={styles.bulletPoint}>• Access controls and authentication</Text>
                </View>
              </LinearGradient>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.policyCard}>
              <LinearGradient
                colors={['#F8F4FF', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <Ionicons name="checkmark-circle" size={24} color="#c3b1e1" />
                <View style={styles.cardContent}>
                  <Text style={styles.sectionTitle}>5. Your Rights</Text>
                  <Text style={styles.paragraph}>You have the right to:</Text>
                  <Text style={styles.bulletPoint}>• Access your personal information</Text>
                  <Text style={styles.bulletPoint}>• Correct inaccurate information</Text>
                  <Text style={styles.bulletPoint}>• Delete your account and data</Text>
                  <Text style={styles.bulletPoint}>• Withdraw consent for data processing</Text>
                  <Text style={styles.bulletPoint}>• Export your data</Text>
                  <Text style={styles.bulletPoint}>• Object to certain processing activities</Text>
                </View>
              </LinearGradient>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.policyCard}>
              <LinearGradient
                colors={['#FFF0F5', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <Ionicons name="calendar" size={24} color="#FF4F81" />
                <View style={styles.cardContent}>
                  <Text style={styles.sectionTitle}>6. Age Requirements</Text>
                  <Text style={styles.paragraph}>
                    DebsMatch is designed for users aged 18 and over. We do not knowingly collect 
                    personal information from individuals under 18. If we become aware that we have 
                    collected personal information from someone under 18, we will take steps to delete it.
                  </Text>
                </View>
              </LinearGradient>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.policyCard}>
              <LinearGradient
                colors={['#F8F4FF', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <Ionicons name="location" size={24} color="#c3b1e1" />
                <View style={styles.cardContent}>
                  <Text style={styles.sectionTitle}>7. Location Data</Text>
                  <Text style={styles.paragraph}>
                    We collect your county and school information to facilitate local matching. 
                    We do not track your precise location in real-time. You can control location 
                    sharing in your device settings.
                  </Text>
                </View>
              </LinearGradient>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.policyCard}>
              <LinearGradient
                colors={['#FFF0F5', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <Ionicons name="time" size={24} color="#FF4F81" />
                <View style={styles.cardContent}>
                  <Text style={styles.sectionTitle}>8. Data Retention</Text>
                  <Text style={styles.paragraph}>
                    We retain your personal information for as long as your account is active or as 
                    needed to provide our services. When you delete your account, we will delete 
                    your personal information within 30 days, except where we are required to retain 
                    it for legal reasons.
                  </Text>
                </View>
              </LinearGradient>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.policyCard}>
              <LinearGradient
                colors={['#F8F4FF', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <Ionicons name="globe" size={24} color="#c3b1e1" />
                <View style={styles.cardContent}>
                  <Text style={styles.sectionTitle}>9. International Transfers</Text>
                  <Text style={styles.paragraph}>
                    Your information may be transferred to and processed in countries other than your 
                    country of residence. We ensure appropriate safeguards are in place to protect 
                    your information in accordance with this privacy policy.
                  </Text>
                </View>
              </LinearGradient>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.policyCard}>
              <LinearGradient
                colors={['#FFF0F5', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <Ionicons name="refresh" size={24} color="#FF4F81" />
                <View style={styles.cardContent}>
                  <Text style={styles.sectionTitle}>10. Changes to This Policy</Text>
                  <Text style={styles.paragraph}>
                    We may update this privacy policy from time to time. We will notify you of any 
                    material changes by posting the new policy in the app and updating the "Last updated" 
                    date. Your continued use of our services after such changes constitutes acceptance of 
                    the updated policy.
                  </Text>
                </View>
              </LinearGradient>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.policyCard}>
              <LinearGradient
                colors={['#F8F4FF', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <Ionicons name="mail" size={24} color="#c3b1e1" />
                <View style={styles.cardContent}>
                  <Text style={styles.sectionTitle}>11. Contact Us</Text>
                  <Text style={styles.paragraph}>
                    If you have any questions about this privacy policy or our data practices, 
                    please contact us at:
                  </Text>
                  <Text style={styles.contactInfo}>Email: privacy@debsmatch.ie</Text>
                  <Text style={styles.contactInfo}>Address: DebsMatch, Ireland</Text>
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
              <Ionicons name="shield" size={20} color="#c3b1e1" />
              <Text style={styles.footerText}>
                This privacy policy is effective as of the date listed above and applies to all 
                information collected by DebsMatch.
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
    zIndex: 2,
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
  lastUpdated: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
    marginBottom: SPACING.lg,
    textAlign: 'center',
    fontFamily: Fonts.regular,
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
  policyCard: {
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
  cardContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1B1B3A',
    marginBottom: SPACING.sm,
    fontFamily: Fonts.semiBold,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1B1B3A',
    marginBottom: SPACING.sm,
    fontFamily: Fonts.regular,
  },
  bulletPoint: {
    fontSize: 16,
    lineHeight: 24,
    color: '#6B7280',
    marginLeft: SPACING.md,
    marginBottom: SPACING.xs,
    fontFamily: Fonts.regular,
  },
  contactInfo: {
    fontSize: 16,
    lineHeight: 24,
    color: '#c3b1e1',
    fontWeight: '600',
    marginBottom: SPACING.xs,
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
    fontFamily: Fonts.regular,
  },
});
