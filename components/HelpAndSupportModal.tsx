import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SPACING, BORDER_RADIUS } from '../utils/constants';
import { Fonts } from '../utils/fonts';
import { BackButton } from './ui';

interface HelpAndSupportModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function HelpAndSupportModal({ visible, onClose }: HelpAndSupportModalProps) {
  const openLink = (url: string) => {
    Linking.openURL(url);
  };

  const sendEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`);
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
          <BackButton onPress={onClose} />
          <View style={styles.headerCenter}>
            <Text style={styles.title}>Help & Support</Text>
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
              <Ionicons name="help-circle" size={24} color="#FF4F81" />
              <Text style={styles.introText}>
                We're here to help! Find answers to common questions or get in touch 
                with our support team.
              </Text>
            </LinearGradient>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
            
            <View style={styles.faqCard}>
              <LinearGradient
                colors={['#F8F4FF', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <Ionicons name="person-add" size={24} color="#c3b1e1" />
                <View style={styles.faqContent}>
                  <Text style={styles.faqQuestion}>How do I create an account?</Text>
                  <Text style={styles.faqAnswer}>
                    Download the app and follow the onboarding process. You'll need to provide 
                    basic information, verify your email, and complete your profile.
                  </Text>
                </View>
              </LinearGradient>
            </View>

            <View style={styles.faqCard}>
              <LinearGradient
                colors={['#FFF0F5', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <Ionicons name="heart" size={24} color="#FF4F81" />
                <View style={styles.faqContent}>
                  <Text style={styles.faqQuestion}>How does the matching system work?</Text>
                  <Text style={styles.faqAnswer}>
                    We match you with other users based on your preferences, location, school, 
                    and interests. You can swipe right to like someone or left to pass.
                  </Text>
                </View>
              </LinearGradient>
            </View>

            <View style={styles.faqCard}>
              <LinearGradient
                colors={['#F8F4FF', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <Ionicons name="create" size={24} color="#c3b1e1" />
                <View style={styles.faqContent}>
                  <Text style={styles.faqQuestion}>How do I update my profile?</Text>
                  <Text style={styles.faqAnswer}>
                    Go to Settings {'>'} Edit Profile to update your information, photos, bio, 
                    and preferences at any time.
                  </Text>
                </View>
              </LinearGradient>
            </View>

            <View style={styles.faqCard}>
              <LinearGradient
                colors={['#FFF0F5', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <Ionicons name="flag" size={24} color="#FF4F81" />
                <View style={styles.faqContent}>
                  <Text style={styles.faqQuestion}>How do I report someone?</Text>
                  <Text style={styles.faqAnswer}>
                    Tap the three dots on their profile or in your chat, then select "Report" 
                    and choose the reason. We review all reports promptly.
                  </Text>
                </View>
              </LinearGradient>
            </View>

            <View style={styles.faqCard}>
              <LinearGradient
                colors={['#F8F4FF', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <Ionicons name="ban" size={24} color="#c3b1e1" />
                <View style={styles.faqContent}>
                  <Text style={styles.faqQuestion}>How do I block someone?</Text>
                  <Text style={styles.faqAnswer}>
                    Go to their profile, tap the three dots, and select "Block User". 
                    They won't be able to see your profile or message you.
                  </Text>
                </View>
              </LinearGradient>
            </View>

            <View style={styles.faqCard}>
              <LinearGradient
                colors={['#FFF0F5', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <Ionicons name="trash" size={24} color="#FF4F81" />
                <View style={styles.faqContent}>
                  <Text style={styles.faqQuestion}>How do I delete my account?</Text>
                  <Text style={styles.faqAnswer}>
                    Go to Settings {'>'} Account Settings {'>'} Delete Account. This action is 
                    permanent and cannot be undone.
                  </Text>
                </View>
              </LinearGradient>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Troubleshooting</Text>
            
            <View style={styles.troubleshootCard}>
              <LinearGradient
                colors={['#F8F4FF', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <Ionicons name="wifi" size={24} color="#c3b1e1" />
                <View style={styles.troubleshootContent}>
                  <Text style={styles.troubleshootTitle}>App won't load or crashes</Text>
                  <Text style={styles.troubleshootDescription}>
                    • Check your internet connection{'\n'}
                    • Close and restart the app{'\n'}
                    • Update to the latest version{'\n'}
                    • Restart your device
                  </Text>
                </View>
              </LinearGradient>
            </View>

            <View style={styles.troubleshootCard}>
              <LinearGradient
                colors={['#FFF0F5', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <Ionicons name="notifications" size={24} color="#FF4F81" />
                <View style={styles.troubleshootContent}>
                  <Text style={styles.troubleshootTitle}>Not receiving notifications</Text>
                  <Text style={styles.troubleshootDescription}>
                    • Check notification settings in your device{'\n'}
                    • Enable notifications in app settings{'\n'}
                    • Check if Do Not Disturb is enabled{'\n'}
                    • Restart the app
                  </Text>
                </View>
              </LinearGradient>
            </View>

            <View style={styles.troubleshootCard}>
              <LinearGradient
                colors={['#F8F4FF', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <Ionicons name="image" size={24} color="#c3b1e1" />
                <View style={styles.troubleshootContent}>
                  <Text style={styles.troubleshootTitle}>Photos not uploading</Text>
                  <Text style={styles.troubleshootDescription}>
                    • Check your internet connection{'\n'}
                    • Ensure photo meets size requirements{'\n'}
                    • Try a different photo{'\n'}
                    • Check app storage permissions
                  </Text>
                </View>
              </LinearGradient>
            </View>

            <View style={styles.troubleshootCard}>
              <LinearGradient
                colors={['#FFF0F5', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <Ionicons name="chatbubbles" size={24} color="#FF4F81" />
                <View style={styles.troubleshootContent}>
                  <Text style={styles.troubleshootTitle}>Messages not sending</Text>
                  <Text style={styles.troubleshootDescription}>
                    • Check your internet connection{'\n'}
                    • Ensure you're matched with the person{'\n'}
                    • Try refreshing the chat{'\n'}
                    • Restart the app
                  </Text>
                </View>
              </LinearGradient>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Support</Text>
            <Text style={styles.paragraph}>
              Can't find what you're looking for? Our support team is here to help.
            </Text>

            <TouchableOpacity 
              style={styles.contactButton}
              onPress={() => sendEmail('support@debsmatch.ie')}
            >
              <LinearGradient
                colors={['#FFF0F5', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.contactButtonGradient}
              >
                <Ionicons name="mail" size={20} color="#FF4F81" />
                <View style={styles.contactButtonContent}>
                  <Text style={styles.contactButtonText}>Email Support</Text>
                  <Text style={styles.contactButtonSubtext}>support@debsmatch.ie</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#FF4F81" />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.contactButton}
              onPress={() => sendEmail('technical@debsmatch.ie')}
            >
              <LinearGradient
                colors={['#F8F4FF', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.contactButtonGradient}
              >
                <Ionicons name="bug" size={20} color="#c3b1e1" />
                <View style={styles.contactButtonContent}>
                  <Text style={styles.contactButtonText}>Technical Issues</Text>
                  <Text style={styles.contactButtonSubtext}>technical@debsmatch.ie</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#c3b1e1" />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.contactButton}
              onPress={() => sendEmail('safety@debsmatch.ie')}
            >
              <LinearGradient
                colors={['#FFF0F5', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.contactButtonGradient}
              >
                <Ionicons name="shield-checkmark" size={20} color="#FF4F81" />
                <View style={styles.contactButtonContent}>
                  <Text style={styles.contactButtonText}>Safety Concerns</Text>
                  <Text style={styles.contactButtonSubtext}>safety@debsmatch.ie</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#FF4F81" />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.contactButton}
              onPress={() => sendEmail('feedback@debsmatch.ie')}
            >
              <LinearGradient
                colors={['#F8F4FF', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.contactButtonGradient}
              >
                <Ionicons name="thumbs-up" size={20} color="#c3b1e1" />
                <View style={styles.contactButtonContent}>
                  <Text style={styles.contactButtonText}>Feedback & Suggestions</Text>
                  <Text style={styles.contactButtonSubtext}>feedback@debsmatch.ie</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#c3b1e1" />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Support Hours</Text>
            <View style={styles.hoursCard}>
              <LinearGradient
                colors={['#F8F4FF', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <Ionicons name="time" size={24} color="#c3b1e1" />
                <View style={styles.hoursContent}>
                  <Text style={styles.hoursText}>
                    <Text style={styles.hoursLabel}>Monday - Friday:</Text> 9:00 AM - 6:00 PM{'\n'}
                    <Text style={styles.hoursLabel}>Saturday:</Text> 10:00 AM - 4:00 PM{'\n'}
                    <Text style={styles.hoursLabel}>Sunday:</Text> Closed
                  </Text>
                  <Text style={styles.hoursNote}>
                    We typically respond within 24 hours during business hours.
                  </Text>
                </View>
              </LinearGradient>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>App Information</Text>
            <View style={styles.infoCard}>
              <LinearGradient
                colors={['#FFF0F5', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <Ionicons name="phone-portrait" size={24} color="#FF4F81" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoText}>
                    <Text style={styles.infoLabel}>Version:</Text> 1.0.0{'\n'}
                    <Text style={styles.infoLabel}>Last Updated:</Text> {new Date().toLocaleDateString()}{'\n'}
                    <Text style={styles.infoLabel}>Platform:</Text> iOS & Android{'\n'}
                    <Text style={styles.infoLabel}>Minimum OS:</Text> iOS 13.0 / Android 8.0
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
              <Ionicons name="heart" size={20} color="#c3b1e1" />
              <Text style={styles.footerText}>
                Thank you for using DebsMatch! We're committed to providing you with 
                the best possible experience and support.
              </Text>
              <Text style={styles.footerText}>
                If you have any questions or concerns, don't hesitate to reach out to us.
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
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: '#6B7280',
    marginBottom: SPACING.md,
    fontFamily: Fonts.regular,
  },
  faqCard: {
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
  faqContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B1B3A',
    marginBottom: SPACING.xs,
    fontFamily: Fonts.semiBold,
  },
  faqAnswer: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
    fontFamily: Fonts.regular,
  },
  troubleshootCard: {
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  troubleshootContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  troubleshootTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B1B3A',
    marginBottom: SPACING.xs,
    fontFamily: Fonts.semiBold,
  },
  troubleshootDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
    fontFamily: Fonts.regular,
  },
  contactButton: {
    marginBottom: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  contactButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
  },
  contactButtonContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B1B3A',
    fontFamily: Fonts.semiBold,
  },
  contactButtonSubtext: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    fontFamily: Fonts.regular,
  },
  hoursCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  hoursContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  hoursText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1B1B3A',
    marginBottom: SPACING.xs,
    fontFamily: Fonts.regular,
  },
  hoursLabel: {
    fontWeight: '600',
    color: '#1B1B3A',
    fontFamily: Fonts.semiBold,
  },
  hoursNote: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
    fontFamily: Fonts.regular,
  },
  infoCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  infoText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1B1B3A',
    fontFamily: Fonts.regular,
  },
  infoLabel: {
    fontWeight: '600',
    color: '#1B1B3A',
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