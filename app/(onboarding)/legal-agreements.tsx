import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SPACING, BORDER_RADIUS } from '../../utils/constants';
import { ProgressBar, BackButton } from '../../components/ui';
import { Fonts } from '../../utils/fonts';
import { Ionicons } from '@expo/vector-icons';
import { useOnboarding, ONBOARDING_STEPS } from '../../OnboardingContext';
import { attachProgressHaptics, playLightHaptic, playOnboardingProgressHaptic } from '../../utils/haptics';
import PrivacyPolicyModal from '../../components/PrivacyPolicyModal';
import TermsOfServiceModal from '../../components/TermsOfServiceModal';
import { safeGoBack } from '../../utils/safeNavigation';

export default function LegalAgreementsScreen() {
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [isProgressAnimating, setIsProgressAnimating] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const { data: onboardingData, updateData, setCurrentStep } = useOnboarding();
  // Local 3-step progress for Notifications → Legal → Community
  const TOTAL_STEPS = 3;
  const CURRENT_STEP = 2;
  const PREVIOUS_STEP = 1;

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const backButtonScale = useRef(new Animated.Value(0.8)).current;
  const backButtonOpacity = useRef(new Animated.Value(0.3)).current;
  const progressFillAnim = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const buttonHighlightAnim = useRef(new Animated.Value(0)).current;

  // Checkbox animations
  const termsCheckboxScale = useRef(new Animated.Value(1)).current;
  const termsCheckboxBounce = useRef(new Animated.Value(0)).current;
  const termsCheckmarkScale = useRef(new Animated.Value(0)).current;
  const privacyCheckboxScale = useRef(new Animated.Value(1)).current;
  const privacyCheckboxBounce = useRef(new Animated.Value(0)).current;
  const privacyCheckmarkScale = useRef(new Animated.Value(0)).current;

  // Register this step for resume functionality
  useEffect(() => {
    setCurrentStep(ONBOARDING_STEPS.LEGAL_AGREEMENTS);
  }, []);

  // Load existing agreement status if available
  useEffect(() => {
    if (onboardingData?.agreedToTermsAndConditions) {
      setAgreedToTerms(true);
      setAgreedToPrivacy(true);
      // Set initial checkmark scales to 1 if already agreed
      termsCheckmarkScale.setValue(1);
      privacyCheckmarkScale.setValue(1);
    }
  }, [onboardingData?.agreedToTermsAndConditions]);

  // Entrance animations (match onboarding pages)
  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        // Back button fade + scale
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
      ]),
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, backButtonOpacity, backButtonScale, contentOpacity, buttonOpacity]);

  const animateButtonPress = (animValue: Animated.Value, callback?: () => void) => {
    Animated.sequence([
      Animated.timing(animValue, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(animValue, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (callback) callback();
    });
  };

  const triggerButtonSweep = () => {
    buttonHighlightAnim.stopAnimation();
    buttonHighlightAnim.setValue(0);
    Animated.timing(buttonHighlightAnim, {
      toValue: 1,
      duration: 750,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  const handleAutoAdvance = () => {
    // Save agreement status to onboarding data
    updateData({ agreedToTermsAndConditions: true });

    // Animate progress and navigate
    animateStepByStepProgress();
  };

  const handleContinue = () => {
    if (!agreedToTerms || !agreedToPrivacy) {
      return;
    }

    playLightHaptic();
    triggerButtonSweep();
    animateButtonPress(buttonScale, handleAutoAdvance);
  };

  const animateStepByStepProgress = () => {
    setIsProgressAnimating(true);
    // Haptics tied to progress fill (match other phases)
    const detachHaptics = attachProgressHaptics(progressFillAnim);

    // Animate from current step progress to next step progress
    Animated.timing(progressFillAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: false,
    }).start(() => {
      // Stop haptics and play step haptic
      detachHaptics();
      playOnboardingProgressHaptic(CURRENT_STEP, TOTAL_STEPS);
      // Navigate after smooth animation
      setTimeout(() => {
        router.push('/(onboarding)/community-guidelines');
      }, 200);
    });
  };

  const handleBackPress = () => {
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
      safeGoBack(ONBOARDING_STEPS.LEGAL_AGREEMENTS);
    });
  };

  const handleTermsPress = () => {
    // Show terms of service modal
    setShowTermsModal(true);
  };

  const handlePrivacyPress = () => {
    // Show privacy policy modal
    setShowPrivacyModal(true);
  };

  const animateCheckbox = (
    checkboxScale: Animated.Value,
    checkboxBounce: Animated.Value,
    checkmarkScale: Animated.Value,
    isChecking: boolean
  ) => {
    playLightHaptic();

    if (isChecking) {
      // Checking animation - scale down, bounce up, then scale checkmark in
      Animated.sequence([
        // Initial press down
        Animated.timing(checkboxScale, {
          toValue: 0.85,
          duration: 100,
          useNativeDriver: true,
        }),
        // Bounce back up bigger
        Animated.timing(checkboxScale, {
          toValue: 1.1,
          duration: 150,
          useNativeDriver: true,
        }),
        // Settle to normal size
        Animated.timing(checkboxScale, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      // Bounce effect for the whole checkbox
      Animated.sequence([
        Animated.delay(100),
        Animated.timing(checkboxBounce, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(checkboxBounce, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Checkmark scale in with delay
      setTimeout(() => {
        Animated.spring(checkmarkScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 120,
          friction: 6,
        }).start();
      }, 150);

      // Success haptic after animation
      setTimeout(() => {
        playLightHaptic();
      }, 300);
    } else {
      // Unchecking animation - scale checkmark out, then quick scale
      Animated.timing(checkmarkScale, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();

      Animated.sequence([
        Animated.timing(checkboxScale, {
          toValue: 0.9,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(checkboxScale, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const toggleTerms = () => {
    const newState = !agreedToTerms;
    setAgreedToTerms(newState);
    animateCheckbox(termsCheckboxScale, termsCheckboxBounce, termsCheckmarkScale, newState);
  };

  const togglePrivacy = () => {
    const newState = !agreedToPrivacy;
    setAgreedToPrivacy(newState);
    animateCheckbox(privacyCheckboxScale, privacyCheckboxBounce, privacyCheckmarkScale, newState);
  };

  // Check if form is complete for button enable/disable
  const isFormValid = agreedToTerms && agreedToPrivacy;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={[styles.topRow, { opacity: fadeAnim }]}>
            <View style={styles.backButtonWrapper}>
              <Animated.View style={{ transform: [{ scale: backButtonScale }], opacity: backButtonOpacity }}>
                <BackButton
                  onPress={handleBackPress}
                  color="#c3b1e1"
                  size={72}
                  iconSize={28}
                />
              </Animated.View>
            </View>
            <View style={styles.progressWrapper}>
              <ProgressBar
                currentStep={CURRENT_STEP}
                totalSteps={TOTAL_STEPS}
                previousStep={PREVIOUS_STEP}
                showStepNumbers={false}
                variant="gradient"
                size="medium"
                fill={isProgressAnimating ? progressFillAnim : undefined}
                isAnimating={isProgressAnimating}
                useMoti
                style={styles.progressBar}
              />
            </View>
            <View style={styles.topRowSpacer} />
          </Animated.View>

          {/* Main Content */}
          <Animated.View
            style={[
              styles.content,
              {
                opacity: contentOpacity,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.headerSection}>
              <Text style={styles.title}>Legal Agreements</Text>
              <Text style={styles.subtitle}>Please read and review</Text>
            </View>

            {/* Terms and Conditions */}
              <TouchableOpacity
                style={styles.agreementRow}
                onPress={toggleTerms}
                activeOpacity={0.7}
              >
                <View style={styles.checkboxContainer}>
                  <Animated.View style={[
                    styles.checkbox,
                    agreedToTerms && styles.checkboxChecked,
                    {
                      transform: [
                        { scale: termsCheckboxScale },
                        {
                          translateY: termsCheckboxBounce.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, -3],
                          })
                        }
                      ]
                    }
                  ]}>
                    {agreedToTerms && (
                      <Animated.View style={{
                        transform: [{ scale: termsCheckmarkScale }]
                      }}>
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      </Animated.View>
                    )}
                  </Animated.View>
                </View>
                <Text style={styles.agreementText}>
                  I agree to the{' '}
                  <Text style={styles.linkText} onPress={handleTermsPress}>
                    Terms of Service
                  </Text>
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.agreementRow}
                onPress={togglePrivacy}
                activeOpacity={0.7}
              >
                <View style={styles.checkboxContainer}>
                  <Animated.View style={[
                    styles.checkbox,
                    agreedToPrivacy && styles.checkboxChecked,
                    {
                      transform: [
                        { scale: privacyCheckboxScale },
                        {
                          translateY: privacyCheckboxBounce.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, -3],
                          })
                        }
                      ]
                    }
                  ]}>
                    {agreedToPrivacy && (
                      <Animated.View style={{
                        transform: [{ scale: privacyCheckmarkScale }]
                      }}>
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      </Animated.View>
                    )}
                  </Animated.View>
                </View>
                <Text style={styles.agreementText}>
                  I agree to the{' '}
                  <Text style={styles.linkText} onPress={handlePrivacyPress}>
                    Privacy Policy
                  </Text>
                </Text>
              </TouchableOpacity>

          </Animated.View>
        </ScrollView>

        {/* Continue Button */}
        <Animated.View style={[styles.floatingButtonContainer, { opacity: buttonOpacity }]}>
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity
              style={[styles.continueButton, !isFormValid && styles.disabledButton]}
              onPress={handleContinue}
              activeOpacity={0.8}
              disabled={!isFormValid}
            >
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.buttonHighlight,
                  {
                    opacity: buttonHighlightAnim.interpolate({
                      inputRange: [0, 0.2, 0.8, 1],
                      outputRange: [0, 0.45, 0.25, 0],
                    }),
                    transform: [
                      {
                        translateX: buttonHighlightAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-220, 220],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <LinearGradient
                  colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.6)', 'rgba(255,255,255,0)']}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.buttonHighlightGradient}
                />
              </Animated.View>
              <Text style={[styles.continueButtonText, !isFormValid && styles.disabledButtonText]}>
                Continue
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

        {/* Modals */}
        <TermsOfServiceModal
          visible={showTermsModal}
          onClose={() => setShowTermsModal(false)}
        />

        <PrivacyPolicyModal
          visible={showPrivacyModal}
          onClose={() => setShowPrivacyModal(false)}
        />

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: SPACING['3xl'],
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  backButtonWrapper: {
    width: 72,
    marginLeft: -SPACING.lg,
  },
  progressWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  topRowSpacer: {
    width: 48,
  },
  progressBar: {
    width: 160,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.lg,
    alignItems: 'flex-start',
  },
  headerSection: {
    alignSelf: 'stretch',
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1B1B3A',
    textAlign: 'left',
    marginBottom: SPACING.sm,
    lineHeight: 36,
    letterSpacing: -0.5,
    fontFamily: Fonts.bold,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'left',
    marginBottom: SPACING['2xl'],
    lineHeight: 24,
    paddingRight: SPACING.lg,
    fontFamily: Fonts.regular,
  },
  agreementContainer: {
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  agreementRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },
  checkboxContainer: {
    marginRight: SPACING.sm, // Using design system token
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#E5E7EB', // Light border color from design system
    backgroundColor: '#FFFFFF', // White background
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#c3b1e1', // Purple from design system
    borderColor: '#c3b1e1', // Purple from design system
  },
  agreementTextContainer: {
    flex: 1,
  },
  agreementText: {
    fontSize: 16,
    color: '#1B1B3A',
    lineHeight: 22,
    fontFamily: Fonts.regular,
    flex: 1,
  },
  linkText: {
    color: '#FF4F81', // Primary pink from design system
    fontWeight: '600', // SemiBold weight
    textDecorationLine: 'underline',
    fontFamily: Fonts.semiBold, // Poppins SemiBold from design system
  },
  noticeContainer: {
    paddingHorizontal: SPACING.md, // Using design system token
    paddingVertical: SPACING.sm, // Using design system token
    backgroundColor: '#FFE5F0', // Light pink background
    borderRadius: BORDER_RADIUS.md, // Using design system token
    borderWidth: 1,
    borderColor: '#FFB6C1', // Light pink border
    marginBottom: 0, // No margin since button is at bottom
  },
  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm, // Using design system token
    marginBottom: SPACING.sm, // Using design system token
  },
  noticeTitle: {
    fontSize: 16, // UI elements size from design system
    fontWeight: '600', // SemiBold weight
    color: '#1B1B3A', // Primary text color from design system
    fontFamily: Fonts.semiBold, // Poppins SemiBold from design system
  },
  noticeText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    fontFamily: Fonts.regular,
  },
  floatingButtonContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: SPACING.lg,
    paddingHorizontal: SPACING.xl,
  },
  continueButton: {
    backgroundColor: '#FF4F81',
    paddingVertical: 18,
    paddingHorizontal: SPACING.xl,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    width: '100%',
    ...Platform.select({
      ios: {
        shadowColor: '#FF4F81',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
        shadowColor: '#FF4F81',
      },
    }),
  },
  continueButtonText: {
    fontFamily: Fonts.semiBold,
    fontWeight: '600',
    fontSize: 18,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  buttonHighlight: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 180,
  },
  buttonHighlightGradient: {
    flex: 1,
    borderRadius: 16,
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledButtonText: {
    opacity: 0.7,
  },
  floatingButtonContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: SPACING.lg,
    paddingHorizontal: SPACING.xl,
  },
  buttonHighlight: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 180,
  },
  buttonHighlightGradient: {
    flex: 1,
    borderRadius: 16,
  },
});
