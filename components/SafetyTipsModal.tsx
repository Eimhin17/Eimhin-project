import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Linking,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SPACING, BORDER_RADIUS } from '../utils/constants';
import { Fonts } from '../utils/fonts';
import { BackButton } from './ui';
import { playLightHaptic } from '../utils/haptics';

interface SafetyTipsModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function SafetyTipsModal({ visible, onClose }: SafetyTipsModalProps) {
  // Animation values for back button
  const backButtonScale = useRef(new Animated.Value(0.8)).current;
  const backButtonOpacity = useRef(new Animated.Value(0.3)).current;

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

  const openLink = (url: string) => {
    Linking.openURL(url);
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
            <Text style={styles.title}>Safety Tips</Text>
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
              <Ionicons name="shield-checkmark" size={24} color="#FF4F81" />
              <Text style={styles.introText}>
                Your safety is our top priority. Follow these tips to stay safe while 
                meeting new people and attending Debs events.
              </Text>
            </LinearGradient>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Online Safety</Text>
            <Text style={styles.paragraph}>
              Protect yourself while using the app and communicating with matches.
            </Text>
            
            <View style={styles.safetyCard}>
              <LinearGradient
                colors={['#F8F4FF', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <Ionicons name="lock-closed" size={24} color="#c3b1e1" />
                <View style={styles.cardContent}>
                  <Text style={styles.tipTitle}>Keep Personal Information Private</Text>
                  <Text style={styles.tipDescription}>
                    Don't share your full name, address, phone number, or social media accounts 
                    until you've met in person and feel comfortable.
                  </Text>
                </View>
              </LinearGradient>
            </View>

            <View style={styles.safetyCard}>
              <LinearGradient
                colors={['#FFF0F5', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <Ionicons name="eye" size={24} color="#FF4F81" />
                <View style={styles.cardContent}>
                  <Text style={styles.tipTitle}>Trust Your Instincts</Text>
                  <Text style={styles.tipDescription}>
                    If something feels off or makes you uncomfortable, trust your gut. 
                    It's okay to end a conversation or block someone.
                  </Text>
                </View>
              </LinearGradient>
            </View>

            <View style={styles.safetyCard}>
              <LinearGradient
                colors={['#F8F4FF', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <Ionicons name="flag" size={24} color="#c3b1e1" />
                <View style={styles.cardContent}>
                  <Text style={styles.tipTitle}>Report Suspicious Behavior</Text>
                  <Text style={styles.tipDescription}>
                    Report anyone who asks for money, personal information, or behaves 
                    inappropriately. Use the report feature in the app.
                  </Text>
                </View>
              </LinearGradient>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Meeting in Person</Text>
            <Text style={styles.paragraph}>
              When you're ready to meet someone in person, follow these safety guidelines.
            </Text>

            <View style={styles.safetyCard}>
              <LinearGradient
                colors={['#FFF0F5', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <Ionicons name="location" size={24} color="#FF4F81" />
                <View style={styles.cardContent}>
                  <Text style={styles.tipTitle}>Meet in Public Places</Text>
                  <Text style={styles.tipDescription}>
                    Always meet in a public, well-lit location like a café, restaurant, 
                    or shopping center. Avoid private locations for first meetings.
                  </Text>
                </View>
              </LinearGradient>
            </View>

            <View style={styles.safetyCard}>
              <LinearGradient
                colors={['#F8F4FF', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <Ionicons name="people" size={24} color="#c3b1e1" />
                <View style={styles.cardContent}>
                  <Text style={styles.tipTitle}>Tell Someone Where You're Going</Text>
                  <Text style={styles.tipDescription}>
                    Let a friend or family member know where you're going, who you're meeting, 
                    and when you expect to be back.
                  </Text>
                </View>
              </LinearGradient>
            </View>

            <View style={styles.safetyCard}>
              <LinearGradient
                colors={['#FFF0F5', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <Ionicons name="car" size={24} color="#FF4F81" />
                <View style={styles.cardContent}>
                  <Text style={styles.tipTitle}>Plan Your Own Transportation</Text>
                  <Text style={styles.tipDescription}>
                    Drive yourself or arrange your own transportation. Don't rely on your 
                    date for transportation, especially on first meetings.
                  </Text>
                </View>
              </LinearGradient>
            </View>

            <View style={styles.safetyCard}>
              <LinearGradient
                colors={['#F8F4FF', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <Ionicons name="wine" size={24} color="#c3b1e1" />
                <View style={styles.cardContent}>
                  <Text style={styles.tipTitle}>Stay Sober and Alert</Text>
                  <Text style={styles.tipDescription}>
                    Limit alcohol consumption and stay alert. Don't leave drinks unattended 
                    and be cautious about accepting drinks from others.
                  </Text>
                </View>
              </LinearGradient>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Debs Event Safety</Text>
            <Text style={styles.paragraph}>
              Special considerations for attending Debs events with your match.
            </Text>

            <View style={styles.safetyCard}>
              <LinearGradient
                colors={['#F8F4FF', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <Ionicons name="calendar" size={24} color="#c3b1e1" />
                <View style={styles.cardContent}>
                  <Text style={styles.tipTitle}>Verify Event Details</Text>
                  <Text style={styles.tipDescription}>
                    Confirm the event details independently. Check the school's website 
                    or contact the school directly to verify the event.
                  </Text>
                </View>
              </LinearGradient>
            </View>

            <View style={styles.safetyCard}>
              <LinearGradient
                colors={['#FFF0F5', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <Ionicons name="people" size={24} color="#FF4F81" />
                <View style={styles.cardContent}>
                  <Text style={styles.tipTitle}>Meet Before the Event</Text>
                  <Text style={styles.tipDescription}>
                    Meet your date in person before the Debs event to ensure you're 
                    comfortable and compatible.
                  </Text>
                </View>
              </LinearGradient>
            </View>

            <View style={styles.safetyCard}>
              <LinearGradient
                colors={['#F8F4FF', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <Ionicons name="people" size={24} color="#c3b1e1" />
                <View style={styles.cardContent}>
                  <Text style={styles.tipTitle}>Have a Backup Plan</Text>
                  <Text style={styles.tipDescription}>
                    Make sure you have a way to leave the event if needed. Have a friend 
                    on standby or arrange your own transportation.
                  </Text>
                </View>
              </LinearGradient>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Red Flags to Watch For</Text>
            <Text style={styles.paragraph}>
              Be aware of these warning signs and trust your instincts.
            </Text>

            <View style={styles.warningCard}>
              <LinearGradient
                colors={['#FFE5F0', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.warningGradient}
              >
                <Ionicons name="warning" size={20} color="#FF4F81" />
                <Text style={styles.warningText}>Asks for money or financial help</Text>
              </LinearGradient>
            </View>

            <View style={styles.warningCard}>
              <LinearGradient
                colors={['#FFE5F0', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.warningGradient}
              >
                <Ionicons name="warning" size={20} color="#FF4F81" />
                <Text style={styles.warningText}>Wants to meet immediately or in private</Text>
              </LinearGradient>
            </View>

            <View style={styles.warningCard}>
              <LinearGradient
                colors={['#FFE5F0', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.warningGradient}
              >
                <Ionicons name="warning" size={20} color="#FF4F81" />
                <Text style={styles.warningText}>Pressures you for personal information</Text>
              </LinearGradient>
            </View>

            <View style={styles.warningCard}>
              <LinearGradient
                colors={['#FFE5F0', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.warningGradient}
              >
                <Ionicons name="warning" size={20} color="#FF4F81" />
                <Text style={styles.warningText}>Makes inappropriate or sexual comments</Text>
              </LinearGradient>
            </View>

            <View style={styles.warningCard}>
              <LinearGradient
                colors={['#FFE5F0', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.warningGradient}
              >
                <Ionicons name="warning" size={20} color="#FF4F81" />
                <Text style={styles.warningText}>Refuses to video chat or meet in public</Text>
              </LinearGradient>
            </View>

            <View style={styles.warningCard}>
              <LinearGradient
                colors={['#FFE5F0', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.warningGradient}
              >
                <Ionicons name="warning" size={20} color="#FF4F81" />
                <Text style={styles.warningText}>Has inconsistent stories or information</Text>
              </LinearGradient>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Support Resources</Text>
            <Text style={styles.paragraph}>
              If you need help or support, these resources are available:
            </Text>

            <TouchableOpacity 
              style={styles.resourceButton}
              onPress={() => openLink('https://www.womensaid.ie/')}
            >
              <LinearGradient
                colors={['#F8F4FF', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.resourceGradient}
              >
                <Ionicons name="heart" size={20} color="#c3b1e1" />
                <Text style={styles.resourceText}>Women's Aid Ireland</Text>
                <Ionicons name="open" size={16} color="#c3b1e1" />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.resourceButton}
              onPress={() => openLink('https://www.rapecrisishelp.ie/')}
            >
              <LinearGradient
                colors={['#FFF0F5', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.resourceGradient}
              >
                <Ionicons name="heart" size={20} color="#FF4F81" />
                <Text style={styles.resourceText}>Rape Crisis Centre</Text>
                <Ionicons name="open" size={16} color="#FF4F81" />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.resourceButton}
              onPress={() => openLink('https://www.samaritans.org/ireland/')}
            >
              <LinearGradient
                colors={['#F8F4FF', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.resourceGradient}
              >
                <Ionicons name="heart" size={20} color="#c3b1e1" />
                <Text style={styles.resourceText}>Samaritans Ireland</Text>
                <Ionicons name="open" size={16} color="#c3b1e1" />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.resourceButton}
              onPress={() => openLink('https://www.garda.ie/')}
            >
              <LinearGradient
                colors={['#FFF0F5', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.resourceGradient}
              >
                <Ionicons name="shield" size={20} color="#FF4F81" />
                <Text style={styles.resourceText}>An Garda Síochána</Text>
                <Ionicons name="open" size={16} color="#FF4F81" />
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
                Remember: Your safety is more important than being polite. If you feel 
                uncomfortable or unsafe at any time, trust your instincts and remove 
                yourself from the situation.
              </Text>
              <Text style={styles.footerText}>
                DebsMatch is committed to creating a safe environment for all users. 
                If you experience any safety concerns, please report them immediately 
                through the app or contact us at safety@debsmatch.ie
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
  safetyCard: {
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
  cardContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B1B3A',
    marginBottom: SPACING.xs,
    fontFamily: Fonts.semiBold,
  },
  tipDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
    fontFamily: Fonts.regular,
  },
  warningCard: {
    marginBottom: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  warningGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  warningText: {
    fontSize: 14,
    color: '#FF4F81',
    marginLeft: SPACING.sm,
    flex: 1,
    fontFamily: Fonts.regular,
  },
  resourceButton: {
    marginBottom: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  resourceGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
  },
  resourceText: {
    fontSize: 16,
    color: '#1B1B3A',
    marginLeft: SPACING.md,
    flex: 1,
    fontWeight: '600',
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