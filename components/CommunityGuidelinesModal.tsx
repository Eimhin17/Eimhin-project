import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SPACING, BORDER_RADIUS } from '../utils/constants';
import { Fonts } from '../utils/fonts';
import { BackButton } from './ui';

interface CommunityGuidelinesModalProps {
  visible: boolean;
  onClose: () => void;
}

const { height: screenHeight } = Dimensions.get('window');

export default function CommunityGuidelinesModal({ visible, onClose }: CommunityGuidelinesModalProps) {
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
            <Text style={styles.title}>Comm Guidelines</Text>
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
              <Ionicons name="people" size={24} color="#FF4F81" />
              <Text style={styles.introText}>
                Welcome to DebsMatch! Our community guidelines help create a safe, respectful, 
                and enjoyable environment for everyone. Please read and follow these guidelines 
                to ensure a positive experience for all users.
              </Text>
            </LinearGradient>
          </View>

          <View style={styles.section}>
            <View style={styles.guidelineCard}>
              <LinearGradient
                colors={['#F8F4FF', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <Ionicons name="heart" size={24} color="#c3b1e1" />
                <View style={styles.cardContent}>
                  <Text style={styles.sectionTitle}>1. Be Respectful and Kind</Text>
                  <Text style={styles.paragraph}>
                    Treat all users with respect, kindness, and dignity. We're all here to find 
                    connections and have fun at Debs events.
                  </Text>
                  <Text style={styles.bulletPoint}>• Use polite and friendly language</Text>
                  <Text style={styles.bulletPoint}>• Respect others' boundaries and preferences</Text>
                  <Text style={styles.bulletPoint}>• Be patient and understanding</Text>
                  <Text style={styles.bulletPoint}>• Avoid aggressive or confrontational behavior</Text>
                </View>
              </LinearGradient>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.guidelineCard}>
              <LinearGradient
                colors={['#FFF0F5', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <Ionicons name="person" size={24} color="#FF4F81" />
                <View style={styles.cardContent}>
                  <Text style={styles.sectionTitle}>2. Authentic Profiles</Text>
                  <Text style={styles.paragraph}>
                    Create and maintain authentic profiles that accurately represent who you are.
                  </Text>
                  <Text style={styles.bulletPoint}>• Use recent, clear photos of yourself</Text>
                  <Text style={styles.bulletPoint}>• Provide accurate personal information</Text>
                  <Text style={styles.bulletPoint}>• Don't use photos of other people</Text>
                  <Text style={styles.bulletPoint}>• Keep your bio honest and genuine</Text>
                  <Text style={styles.bulletPoint}>• Don't create fake or misleading profiles</Text>
                </View>
              </LinearGradient>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.guidelineCard}>
              <LinearGradient
                colors={['#F8F4FF', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <Ionicons name="shield-checkmark" size={24} color="#c3b1e1" />
                <View style={styles.cardContent}>
                  <Text style={styles.sectionTitle}>3. Appropriate Content</Text>
                  <Text style={styles.paragraph}>
                    Keep all content appropriate and suitable for a dating app community.
                  </Text>
                  <Text style={styles.bulletPoint}>• No explicit, sexual, or inappropriate content</Text>
                  <Text style={styles.bulletPoint}>• No violence, weapons, or harmful imagery</Text>
                  <Text style={styles.bulletPoint}>• No hate speech or discriminatory content</Text>
                  <Text style={styles.bulletPoint}>• No spam, advertising, or promotional content</Text>
                  <Text style={styles.bulletPoint}>• No illegal activities or content</Text>
                </View>
              </LinearGradient>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.guidelineCard}>
              <LinearGradient
                colors={['#FFF0F5', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <Ionicons name="chatbubbles" size={24} color="#FF4F81" />
                <View style={styles.cardContent}>
                  <Text style={styles.sectionTitle}>4. Safe Communication</Text>
                  <Text style={styles.paragraph}>
                    Communicate safely and respectfully with other users.
                  </Text>
                  <Text style={styles.bulletPoint}>• Start conversations politely and respectfully</Text>
                  <Text style={styles.bulletPoint}>• Respect "no" and personal boundaries</Text>
                  <Text style={styles.bulletPoint}>• Don't pressure others for personal information</Text>
                  <Text style={styles.bulletPoint}>• Report any inappropriate or concerning behavior</Text>
                  <Text style={styles.bulletPoint}>• Don't share others' personal information</Text>
                </View>
              </LinearGradient>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.guidelineCard}>
              <LinearGradient
                colors={['#F8F4FF', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <Ionicons name="calendar" size={24} color="#c3b1e1" />
                <View style={styles.cardContent}>
                  <Text style={styles.sectionTitle}>5. Age and Eligibility</Text>
                  <Text style={styles.paragraph}>
                    Only users who meet our age requirements and eligibility criteria may use the app.
                  </Text>
                  <Text style={styles.bulletPoint}>• You must be 18 years or older</Text>
                  <Text style={styles.bulletPoint}>• You must be attending or have attended a Debs event</Text>
                  <Text style={styles.bulletPoint}>• Don't create accounts for others</Text>
                  <Text style={styles.bulletPoint}>• Don't misrepresent your age or eligibility</Text>
                </View>
              </LinearGradient>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.guidelineCard}>
              <LinearGradient
                colors={['#FFF0F5', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <Ionicons name="lock-closed" size={24} color="#FF4F81" />
                <View style={styles.cardContent}>
                  <Text style={styles.sectionTitle}>6. Privacy and Safety</Text>
                  <Text style={styles.paragraph}>
                    Protect your privacy and the privacy of others.
                  </Text>
                  <Text style={styles.bulletPoint}>• Don't share personal contact information too quickly</Text>
                  <Text style={styles.bulletPoint}>• Meet in public places for first meetings</Text>
                  <Text style={styles.bulletPoint}>• Trust your instincts and prioritize safety</Text>
                  <Text style={styles.bulletPoint}>• Don't share others' photos or personal information</Text>
                  <Text style={styles.bulletPoint}>• Report any suspicious or concerning behavior</Text>
                </View>
              </LinearGradient>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.guidelineCard}>
              <LinearGradient
                colors={['#F8F4FF', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <Ionicons name="warning" size={24} color="#c3b1e1" />
                <View style={styles.cardContent}>
                  <Text style={styles.sectionTitle}>7. Prohibited Behavior</Text>
                  <Text style={styles.paragraph}>
                    The following behaviors are strictly prohibited and may result in account suspension or termination:
                  </Text>
                  <Text style={styles.bulletPoint}>• Harassment, bullying, or intimidation</Text>
                  <Text style={styles.bulletPoint}>• Discrimination based on race, gender, religion, etc.</Text>
                  <Text style={styles.bulletPoint}>• Sexual harassment or inappropriate advances</Text>
                  <Text style={styles.bulletPoint}>• Impersonation or fake accounts</Text>
                  <Text style={styles.bulletPoint}>• Scamming, fraud, or financial exploitation</Text>
                  <Text style={styles.bulletPoint}>• Stalking or persistent unwanted contact</Text>
                  <Text style={styles.bulletPoint}>• Sharing explicit or inappropriate content</Text>
                  <Text style={styles.bulletPoint}>• Spam or unsolicited promotional content</Text>
                </View>
              </LinearGradient>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.guidelineCard}>
              <LinearGradient
                colors={['#FFF0F5', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <Ionicons name="flag" size={24} color="#FF4F81" />
                <View style={styles.cardContent}>
                  <Text style={styles.sectionTitle}>8. Reporting and Enforcement</Text>
                  <Text style={styles.paragraph}>
                    Help us maintain a safe community by reporting violations.
                  </Text>
                  <Text style={styles.bulletPoint}>• Report any behavior that violates these guidelines</Text>
                  <Text style={styles.bulletPoint}>• Use the in-app reporting feature</Text>
                  <Text style={styles.bulletPoint}>• Provide as much detail as possible when reporting</Text>
                  <Text style={styles.bulletPoint}>• False reports may result in account action</Text>
                  <Text style={styles.paragraph}>
                    We review all reports and take appropriate action, which may include warnings, 
                    temporary suspensions, or permanent account termination.
                  </Text>
                </View>
              </LinearGradient>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.guidelineCard}>
              <LinearGradient
                colors={['#F8F4FF', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <Ionicons name="alert-circle" size={24} color="#c3b1e1" />
                <View style={styles.cardContent}>
                  <Text style={styles.sectionTitle}>9. Consequences of Violations</Text>
                  <Text style={styles.paragraph}>
                    Violations of these guidelines may result in:
                  </Text>
                  <Text style={styles.bulletPoint}>• Warning messages</Text>
                  <Text style={styles.bulletPoint}>• Temporary account suspension</Text>
                  <Text style={styles.bulletPoint}>• Permanent account termination</Text>
                  <Text style={styles.bulletPoint}>• Legal action in severe cases</Text>
                  <Text style={styles.paragraph}>
                    We reserve the right to take action against any account that violates these 
                    guidelines or our Terms of Service.
                  </Text>
                </View>
              </LinearGradient>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.guidelineCard}>
              <LinearGradient
                colors={['#FFF0F5', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <Ionicons name="refresh" size={24} color="#FF4F81" />
                <View style={styles.cardContent}>
                  <Text style={styles.sectionTitle}>10. Updates to Guidelines</Text>
                  <Text style={styles.paragraph}>
                    These guidelines may be updated from time to time. We will notify users of 
                    significant changes through the app or email. Continued use of the app 
                    constitutes acceptance of any updated guidelines.
                  </Text>
                </View>
              </LinearGradient>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.guidelineCard}>
              <LinearGradient
                colors={['#F8F4FF', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <Ionicons name="mail" size={24} color="#c3b1e1" />
                <View style={styles.cardContent}>
                  <Text style={styles.sectionTitle}>11. Contact and Support</Text>
                  <Text style={styles.paragraph}>
                    If you have questions about these guidelines or need to report a violation, 
                    please contact us:
                  </Text>
                  <Text style={styles.contactInfo}>Email: community@debsmatch.ie</Text>
                  <Text style={styles.contactInfo}>In-App: Use the report feature</Text>
                  <Text style={styles.contactInfo}>Emergency: Contact local authorities if in immediate danger</Text>
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
              <Ionicons name="heart" size={20} color="#c3b1e1" />
              <Text style={styles.footerText}>
                By using DebsMatch, you agree to follow these Community Guidelines. 
                Together, we can create a safe, respectful, and enjoyable environment 
                for everyone to find their perfect Debs match!
              </Text>
              <Text style={styles.footerText}>
                Thank you for being part of our community and helping us maintain 
                a positive experience for all users.
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
  guidelineCard: {
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
    marginBottom: SPACING.sm,
    fontFamily: Fonts.regular,
  },
});