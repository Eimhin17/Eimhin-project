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

interface TermsOfServiceModalProps {
  visible: boolean;
  onClose: () => void;
}

const { height: screenHeight } = Dimensions.get('window');

export default function TermsOfServiceModal({ visible, onClose }: TermsOfServiceModalProps) {
  const backButtonScale = useRef(new Animated.Value(0.8)).current;
  const backButtonOpacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (visible) {
      // Animate back button on modal open
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
            <Text style={styles.title}>Terms of Service</Text>
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
              <Ionicons name="document-text" size={24} color="#FF4F81" />
              <Text style={styles.introText}>
                Welcome to DebsMatch! These terms govern your use of our service and outline
                your rights and responsibilities as a user.
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
                <Ionicons name="checkmark-circle" size={24} color="#c3b1e1" />
                <View style={styles.cardContent}>
                  <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
                  <Text style={styles.paragraph}>
                    By accessing and using DebsMatch ("the Service"), you accept and agree to be bound by the
                    terms and provision of this agreement. If you do not agree to abide by the above, please
                    do not use this service.
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
                <Ionicons name="phone-portrait" size={24} color="#FF4F81" />
                <View style={styles.cardContent}>
                  <Text style={styles.sectionTitle}>2. Description of Service</Text>
                  <Text style={styles.paragraph}>
                    DebsMatch is a mobile application that facilitates connections between users for the
                    purpose of attending Debs (graduation) events. The service includes:
                  </Text>
                  <Text style={styles.bulletPoint}>• User profile creation and management</Text>
                  <Text style={styles.bulletPoint}>• Matching system based on preferences and location</Text>
                  <Text style={styles.bulletPoint}>• Messaging and communication features</Text>
                  <Text style={styles.bulletPoint}>• Event and school information</Text>
                  <Text style={styles.bulletPoint}>• Safety and reporting tools</Text>
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
                <Ionicons name="person-circle" size={24} color="#c3b1e1" />
                <View style={styles.cardContent}>
                  <Text style={styles.sectionTitle}>3. User Eligibility</Text>
                  <Text style={styles.paragraph}>
                    You must be at least 18 years old to use this service. By using DebsMatch, you represent
                    and warrant that:
                  </Text>
                  <Text style={styles.bulletPoint}>• You are at least 18 years of age</Text>
                  <Text style={styles.bulletPoint}>• You have the legal capacity to enter into this agreement</Text>
                  <Text style={styles.bulletPoint}>• You are not prohibited from using the service under applicable law</Text>
                  <Text style={styles.bulletPoint}>• You will provide accurate and truthful information</Text>
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
                <Ionicons name="person-add" size={24} color="#FF4F81" />
                <View style={styles.cardContent}>
                  <Text style={styles.sectionTitle}>4. User Accounts and Registration</Text>
                  <Text style={styles.paragraph}>
                    To use certain features of the service, you must register for an account. You agree to:
                  </Text>
                  <Text style={styles.bulletPoint}>• Provide accurate, current, and complete information</Text>
                  <Text style={styles.bulletPoint}>• Maintain and update your information to keep it accurate</Text>
                  <Text style={styles.bulletPoint}>• Maintain the security of your password and account</Text>
                  <Text style={styles.bulletPoint}>• Accept responsibility for all activities under your account</Text>
                  <Text style={styles.bulletPoint}>• Notify us immediately of any unauthorized use</Text>
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
                <Ionicons name="warning" size={24} color="#c3b1e1" />
                <View style={styles.cardContent}>
                  <Text style={styles.sectionTitle}>5. User Conduct and Prohibited Activities</Text>
                  <Text style={styles.paragraph}>You agree not to engage in any of the following prohibited activities:</Text>
                  <Text style={styles.bulletPoint}>• Harassment, abuse, or intimidation of other users</Text>
                  <Text style={styles.bulletPoint}>• Posting false, misleading, or fraudulent information</Text>
                  <Text style={styles.bulletPoint}>• Sharing inappropriate, offensive, or illegal content</Text>
                  <Text style={styles.bulletPoint}>• Impersonating another person or entity</Text>
                  <Text style={styles.bulletPoint}>• Attempting to gain unauthorized access to the service</Text>
                  <Text style={styles.bulletPoint}>• Using the service for commercial purposes without permission</Text>
                  <Text style={styles.bulletPoint}>• Violating any applicable laws or regulations</Text>
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
                <Ionicons name="document-attach" size={24} color="#FF4F81" />
                <View style={styles.cardContent}>
                  <Text style={styles.sectionTitle}>6. Content and Intellectual Property</Text>
                  <Text style={styles.paragraph}>
                    You retain ownership of content you post, but grant us a license to use, display, and
                    distribute it in connection with the service. You agree not to post content that:
                  </Text>
                  <Text style={styles.bulletPoint}>• Infringes on intellectual property rights</Text>
                  <Text style={styles.bulletPoint}>• Contains personal information of others without consent</Text>
                  <Text style={styles.bulletPoint}>• Is defamatory, obscene, or harmful</Text>
                  <Text style={styles.bulletPoint}>• Violates privacy or publicity rights</Text>
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
                <Ionicons name="shield-checkmark" size={24} color="#c3b1e1" />
                <View style={styles.cardContent}>
                  <Text style={styles.sectionTitle}>7. Safety and Reporting</Text>
                  <Text style={styles.paragraph}>
                    User safety is our priority. You agree to:
                  </Text>
                  <Text style={styles.bulletPoint}>• Report any suspicious or inappropriate behavior</Text>
                  <Text style={styles.bulletPoint}>• Meet in public places for first meetings</Text>
                  <Text style={styles.bulletPoint}>• Trust your instincts and prioritize your safety</Text>
                  <Text style={styles.bulletPoint}>• Not share personal contact information until comfortable</Text>
                  <Text style={styles.paragraph}>
                    We reserve the right to investigate and take action against users who violate our safety guidelines.
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
                <Ionicons name="lock-closed" size={24} color="#FF4F81" />
                <View style={styles.cardContent}>
                  <Text style={styles.sectionTitle}>8. Privacy and Data Protection</Text>
                  <Text style={styles.paragraph}>
                    Your privacy is important to us. Our collection and use of personal information is governed
                    by our Privacy Policy, which is incorporated into these terms by reference. By using the
                    service, you consent to the collection and use of information as described in our Privacy Policy.
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
                <Ionicons name="settings" size={24} color="#c3b1e1" />
                <View style={styles.cardContent}>
                  <Text style={styles.sectionTitle}>9. Service Availability and Modifications</Text>
                  <Text style={styles.paragraph}>
                    We reserve the right to:
                  </Text>
                  <Text style={styles.bulletPoint}>• Modify or discontinue the service at any time</Text>
                  <Text style={styles.bulletPoint}>• Update these terms from time to time</Text>
                  <Text style={styles.bulletPoint}>• Suspend or terminate accounts for violations</Text>
                  <Text style={styles.bulletPoint}>• Perform maintenance that may temporarily affect availability</Text>
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
                <Ionicons name="alert-circle" size={24} color="#FF4F81" />
                <View style={styles.cardContent}>
                  <Text style={styles.sectionTitle}>10. Disclaimers and Limitations of Liability</Text>
                  <Text style={styles.paragraph}>
                    The service is provided "as is" without warranties of any kind. We do not guarantee:
                  </Text>
                  <Text style={styles.bulletPoint}>• The accuracy or completeness of user profiles</Text>
                  <Text style={styles.bulletPoint}>• Successful matches or relationships</Text>
                  <Text style={styles.bulletPoint}>• Uninterrupted or error-free service</Text>
                  <Text style={styles.bulletPoint}>• The conduct of other users</Text>
                  <Text style={styles.paragraph}>
                    To the maximum extent permitted by law, we shall not be liable for any indirect, incidental,
                    special, or consequential damages arising from your use of the service.
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
                <Ionicons name="hand-right" size={24} color="#c3b1e1" />
                <View style={styles.cardContent}>
                  <Text style={styles.sectionTitle}>11. Indemnification</Text>
                  <Text style={styles.paragraph}>
                    You agree to indemnify and hold harmless DebsMatch and its officers, directors, employees,
                    and agents from any claims, damages, or expenses arising from your use of the service or
                    violation of these terms.
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
                <Ionicons name="power" size={24} color="#FF4F81" />
                <View style={styles.cardContent}>
                  <Text style={styles.sectionTitle}>12. Termination</Text>
                  <Text style={styles.paragraph}>
                    Either party may terminate this agreement at any time. Upon termination:
                  </Text>
                  <Text style={styles.bulletPoint}>• Your right to use the service ceases immediately</Text>
                  <Text style={styles.bulletPoint}>• We may delete your account and data</Text>
                  <Text style={styles.bulletPoint}>• Certain provisions survive termination</Text>
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
                <Ionicons name="library" size={24} color="#c3b1e1" />
                <View style={styles.cardContent}>
                  <Text style={styles.sectionTitle}>13. Governing Law and Disputes</Text>
                  <Text style={styles.paragraph}>
                    These terms are governed by the laws of Ireland. Any disputes arising from these terms
                    or your use of the service will be resolved in the courts of Ireland.
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
                <Ionicons name="git-branch" size={24} color="#FF4F81" />
                <View style={styles.cardContent}>
                  <Text style={styles.sectionTitle}>14. Severability</Text>
                  <Text style={styles.paragraph}>
                    If any provision of these terms is found to be unenforceable, the remaining provisions
                    will remain in full force and effect.
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
                  <Text style={styles.sectionTitle}>15. Contact Information</Text>
                  <Text style={styles.paragraph}>
                    If you have any questions about these Terms of Service, please contact us at:
                  </Text>
                  <Text style={styles.contactInfo}>Email: legal@debsmatch.ie</Text>
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
                By using DebsMatch, you acknowledge that you have read, understood, and agree to be bound
                by these Terms of Service.
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
