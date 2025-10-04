import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Platform,
  Animated,
  Alert,
  Easing,
  TextInput,
} from 'react-native';
import ReanimatedView, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { MotiView } from 'moti';
import { router, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useOnboarding, ONBOARDING_STEPS } from '../../OnboardingContext';
import { safeGoBack } from '../../utils/safeNavigation';
import { SPACING, BORDER_RADIUS } from '../../utils/constants';
import { GradientConfigs } from '../../utils/colors';
import {
  attachProgressHaptics,
  playLightHaptic,
  playOnboardingProgressHaptic,
} from '../../utils/haptics';
import { ProgressBar, BackButton } from '../../components/ui';
import { Fonts } from '../../utils/fonts';
import { EmailService } from '../../services/email';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import EmailExistsModal from '../../components/EmailExistsModal';

export default function EmailVerificationScreen() {
  const { data, updateData, setCurrentStep } = useOnboarding();

  const [email, setEmail] = useState(data.schoolEmail ?? '');
  const [isLoading, setIsLoading] = useState(false);
  const [isProgressAnimating, setIsProgressAnimating] = useState(false);
  const [isValidEmail, setIsValidEmail] = useState(false);
  const [showEmailError, setShowEmailError] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [showEmailExistsModal, setShowEmailExistsModal] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Reanimated values for new animations
  const emailShakeX = useSharedValue(0);
  const rippleProgress = useSharedValue(0);
  const emailValidated = useSharedValue(0);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;

  // Button press animations - fade + scale combo
  const buttonScale = useRef(new Animated.Value(1)).current;
  const backButtonScale = useRef(new Animated.Value(0.8)).current;
  const backButtonOpacity = useRef(new Animated.Value(0.3)).current;
  const progressFillAnim = useRef(new Animated.Value(0)).current;
  const buttonHighlightAnim = useRef(new Animated.Value(0)).current;

  // Email validation function
  const validateEmail = (emailInput: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(emailInput.trim());
  };

  // Haptic feedback for ripple animation
  const triggerRippleHaptic = (index: number, totalLength: number) => {
    if (index < totalLength) {
      playLightHaptic();
    }
  };

  // Character ripple animation that moves through the email text
  const triggerEmailRipple = (emailText: string) => {
    rippleProgress.value = 0;
    emailValidated.value = withTiming(1, { duration: 300 });

    // Animate through each character with haptic feedback
    rippleProgress.value = withTiming(1, {
      duration: emailText.length * 80, // 80ms per character for smoother effect
    }, (finished) => {
      if (finished) {
        runOnJS(playOnboardingProgressHaptic)(2, 4);
      }
    });
  };

  // Shake animation for invalid email
  const triggerEmailShake = () => {
    setShowEmailError(true);
    emailShakeX.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(0, { duration: 50 }),
    );
    playLightHaptic();
    setTimeout(() => setShowEmailError(false), 3000);
  };

  // Animated styles
  const emailInputAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: emailShakeX.value }],
    };
  });

  const rippleAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      rippleProgress.value,
      [0, 0.3, 0.7, 1],
      [0, 0.6, 0.3, 0],
      Extrapolate.CLAMP
    );

    return {
      opacity,
      transform: [
        {
          scaleX: interpolate(
            rippleProgress.value,
            [0, 1],
            [0, 1],
            Extrapolate.CLAMP
          )
        }
      ],
    };
  });

  // Individual character ripple animation
  const createCharacterRippleStyle = (index: number, totalLength: number) => {
    return useAnimatedStyle(() => {
      const charProgress = interpolate(
        rippleProgress.value,
        [
          Math.max(0, (index - 1) / totalLength),
          index / totalLength,
          Math.min(1, (index + 2) / totalLength)
        ],
        [0, 1, 0],
        Extrapolate.CLAMP
      );

      const scale = interpolate(charProgress, [0, 1], [1, 1.2], Extrapolate.CLAMP);
      const opacity = interpolate(charProgress, [0, 1], [1, 0.7], Extrapolate.CLAMP);

      // Trigger haptic when this character is at peak animation
      if (charProgress > 0.8 && charProgress < 0.9) {
        runOnJS(playLightHaptic)();
      }

      return {
        transform: [{ scale }],
        opacity,
        backgroundColor: charProgress > 0.3 ? '#FF4F81' : 'transparent',
      };
    });
  };

  // Scroll refs
  useFocusEffect(
    React.useCallback(() => {
      progressFillAnim.stopAnimation();
      progressFillAnim.setValue(0);
      setIsProgressAnimating(false);
      rippleProgress.value = 0;
      emailValidated.value = 0;
      emailShakeX.value = 0;
      return undefined;
    }, [progressFillAnim])
  );

  // Sync local state with context data (for back navigation)
  useEffect(() => {
    if (data.schoolEmail && data.schoolEmail !== email) {
      setEmail(data.schoolEmail);
      setIsValidEmail(validateEmail(data.schoolEmail));
    }
  }, [data.schoolEmail]);

  useEffect(() => {
    // Register this step for resume functionality
    setCurrentStep(ONBOARDING_STEPS.EMAIL_VERIFICATION);

    // Staggered entrance animations including back button fade + scale
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
        // Back button fade + scale combo animation
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
      Animated.timing(formOpacity, {
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
  }, []);
  // Button press animations
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



  const animateStepByStepProgress = () => {
    progressFillAnim.setValue(0);
    setIsProgressAnimating(true);
    const detachHaptics = attachProgressHaptics(progressFillAnim);
    
    // Animate from current step progress to next step progress
    Animated.timing(progressFillAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: false,
    }).start(() => {
      detachHaptics();
      setIsProgressAnimating(false);
      playOnboardingProgressHaptic(3, 5);
      // Navigate after smooth animation
      setTimeout(() => {
        // Store email in onboarding data
        updateData({ schoolEmail: email });
        router.push('/(onboarding)/email-code');
      }, 200);
    });
  };

  const checkEmailExists = async (emailToCheck: string): Promise<boolean> => {
    try {
      // Check if email exists in profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', emailToCheck.trim())
        .maybeSingle();

      if (profileError) {
        console.error('Error checking email in profiles:', profileError);
        return false;
      }

      if (profileData) {
        return true;
      }

      // Also check auth.users via RPC or edge function if needed
      // For now, checking profiles table should be sufficient
      return false;
    } catch (error) {
      console.error('Error checking if email exists:', error);
      return false;
    }
  };

  const handleSendCode = async () => {
    if (!email.trim()) return;

    // Validate email format first
    const isValid = validateEmail(email);

    if (!isValid) {
      triggerEmailShake();
      return;
    }

    console.log('🚀 handleSendCode called with email:', email.trim());
    console.log('📧 Attempting to send verification email...');

    // Add haptic feedback and button animation
    playLightHaptic();
    triggerButtonSweep();

    try {
      setIsLoading(true);
      console.log('⏳ Loading state set to true');

      // Check if email already exists
      console.log('🔍 Checking if email already exists...');
      const emailExists = await checkEmailExists(email);

      if (emailExists) {
        console.log('⚠️ Email already exists!');
        setIsLoading(false);
        setShowEmailExistsModal(true);
        return;
      }

      console.log('✅ Email is available');

      // Trigger ripple animation for valid email
      triggerEmailRipple(email);

      // Actually send the verification email
      console.log('📤 Calling EmailService.sendVerificationCode...');
      const result = await EmailService.sendVerificationCode(email.trim());

      console.log('📨 Email service result:', result);

      if (result.success) {
        console.log('✅ Email sent successfully!');
        // Start step-by-step progress animation with button press animation
        animateButtonPress(buttonScale, animateStepByStepProgress);
      } else {
        console.error('❌ Failed to send email:', result.error);
        Alert.alert(
          'Email Error',
          result.error || 'Failed to send verification email. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('❌ Email service error:', error);
      Alert.alert(
        'Email Error',
        'An unexpected error occurred. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      console.log('🏁 Setting loading state to false');
      setIsLoading(false);
    }
  };

  const handleGoToLogin = () => {
    setShowEmailExistsModal(false);
    // Navigate to login page
    router.push('/(auth)/login');
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    const isValid = validateEmail(text);
    setIsValidEmail(isValid);

    // Reset error state when user starts typing
    if (showEmailError) {
      setShowEmailError(false);
    }
  };

  // Component to render individual animated characters
  const AnimatedEmailText = ({ text }: { text: string }) => {
    return (
      <View style={styles.animatedTextContainer}>
        {text.split('').map((char, index) => {
          const charStyle = createCharacterRippleStyle(index, text.length);
          return (
            <ReanimatedView.View key={`${char}-${index}`} style={[styles.character, charStyle]}>
              <Text style={styles.characterText}>{char}</Text>
            </ReanimatedView.View>
          );
        })}
      </View>
    );
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
      safeGoBack(ONBOARDING_STEPS.EMAIL_VERIFICATION);
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentWrapper}>
        <Animated.View style={[styles.topRow, { opacity: fadeAnim }]}>
          <View style={styles.backButtonWrapper}>
            <Animated.View style={{
              opacity: backButtonOpacity,
              transform: [{ scale: backButtonScale }],
            }}>
              <BackButton
                currentStep={ONBOARDING_STEPS.EMAIL_VERIFICATION}
                onPress={handleBackPress}
                color="#c3b1e1"
                size={72}
                iconSize={28}
              />
            </Animated.View>
          </View>
          <View style={styles.progressWrapper}>
            <ProgressBar
              currentStep={3}
              totalSteps={5}
              showStepNumbers={false}
              variant="gradient"
              size="medium"
              fill={isProgressAnimating ? progressFillAnim : undefined}
              isAnimating={isProgressAnimating}
              useMoti
              gradientColors={GradientConfigs.phaseOneProgress.colors}
              style={styles.progressBar}
            />
          </View>
          {/* Empty spacer to match blocked-schools layout */}
          <View style={{ width: 48, height: 48 }} />
        </Animated.View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >

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
            <Text style={styles.title}>School Email?</Text>
            <Text style={styles.subtitle}>
              We will send you a code
            </Text>

            {/* Email Input Form */}
            <Animated.View style={[styles.formContainer, { opacity: formOpacity }]}>
              <ReanimatedView.View
                style={[styles.emailLineWrapper, emailInputAnimatedStyle]}
              >
                <View style={styles.inputContainer}>
                  <TextInput
                    ref={inputRef}
                    style={[
                      styles.emailLineInput,
                      showEmailError && styles.emailInputError,
                      email.length > 0 && styles.emailInputWithContent
                    ]}
                    placeholder="your.name@schoolname.ie"
                    placeholderTextColor="#9CA3AF"
                    value={email}
                    onChangeText={handleEmailChange}
                    onFocus={() => setIsInputFocused(true)}
                    onBlur={() => setIsInputFocused(false)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    selectionColor="#FF4F81"
                  />
                  {email.length > 0 && (
                    <TouchableOpacity
                      style={styles.animatedTextOverlay}
                      onPress={() => {
                        // Focus the hidden input to show keyboard
                        const input = inputRef.current;
                        if (input) {
                          input.focus();
                        }
                      }}
                      activeOpacity={1}
                    >
                      <AnimatedEmailText text={email} />
                    </TouchableOpacity>
                  )}
                </View>
                <View style={[
                  styles.emailLineTrack,
                  isInputFocused && styles.emailLineTrackFocused
                ]}>
                  <ReanimatedView.View
                    style={[styles.emailLineFill, rippleAnimatedStyle]}
                  />
                </View>
              </ReanimatedView.View>

              {showEmailError && (
                <MotiView
                  from={{ opacity: 0, translateY: -10 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  exit={{ opacity: 0, translateY: -10 }}
                  transition={{ type: 'spring', damping: 15 }}
                  style={styles.errorContainer}
                >
                  <Ionicons name="alert-circle" size={16} color="#FF4D4F" />
                  <Text style={styles.errorText}>
                    Please enter a valid email address
                  </Text>
                </MotiView>
              )}

              <View style={styles.infoContainer}>
                <Ionicons name="information-circle" size={16} color="#FF4F81" />
                <Text style={styles.infoText}>
                  This helps us verify you're a student at an Irish secondary school
                </Text>
              </View>
            </Animated.View>

          </Animated.View>
        </ScrollView>

        <Animated.View style={[styles.floatingButtonContainer, { opacity: buttonOpacity }]}>
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity
              style={[
                styles.continueButton,
                (!email.trim() || isLoading) && styles.disabledButton
              ]}
              onPress={handleSendCode}
              activeOpacity={0.8}
              disabled={!email.trim() || isLoading}
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
                  }
                ]}
              >
                <LinearGradient
                  colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.6)', 'rgba(255,255,255,0)']}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.buttonHighlightGradient}
                />
              </Animated.View>
              <Text style={[
                styles.continueButtonText,
                (!email.trim() || isLoading) && styles.disabledButtonText
              ]}>
                {isLoading ? 'Sending...' : 'Send Verification Code'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

        {/* Email Exists Modal */}
        <EmailExistsModal
          visible={showEmailExistsModal}
          onClose={() => setShowEmailExistsModal(false)}
          onGoToLogin={handleGoToLogin}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Primary white background from design system
  },
  contentWrapper: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING['3xl'], // Add bottom padding for floating button
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING['2xl'],
  },
  backButtonWrapper: {
    marginLeft: -SPACING.lg,
  },
  progressWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  progressBar: {
    width: 160,
  },
  content: {
    flex: 1,
    paddingHorizontal: 0,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.lg,
    display: 'flex',
    flexDirection: 'column',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1B1B3A',
    textAlign: 'left',
    marginBottom: SPACING.xs,
    lineHeight: 36,
    letterSpacing: -0.5,
    fontFamily: Fonts.bold,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'left',
    marginBottom: SPACING.xl,
    lineHeight: 24,
    paddingHorizontal: 0,
    fontFamily: Fonts.regular,
  },
  formContainer: {
    marginTop: -SPACING.sm,
    marginBottom: 0,
  },
  emailLineWrapper: {
    paddingBottom: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  inputContainer: {
    position: 'relative',
  },
  animatedTextOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingVertical: 8,
    zIndex: 2,
  },
  animatedTextContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  character: {
    borderRadius: 4,
  },
  characterText: {
    fontSize: 20,
    fontFamily: Fonts.semiBold,
    color: '#1B1B3A',
  },
  emailLineInput: {
    fontSize: 20,
    fontFamily: Fonts.semiBold,
    color: '#1B1B3A',
    paddingVertical: 8,
  },
  emailInputWithContent: {
    opacity: 0,
  },
  emailLineTrack: {
    height: 2,
    backgroundColor: '#E5E7EB',
    width: '100%',
    borderRadius: 1,
    overflow: 'hidden',
  },
  emailLineTrackFocused: {
    backgroundColor: '#c3b1e1', // Purple color when focused
  },
  emailLineFill: {
    height: '100%',
    backgroundColor: '#FF4F81', // Pink for valid email
    borderRadius: 1,
  },
  emailInputError: {
    color: '#FF4D4F',
  },
  errorContainer: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: '#FFF1F0',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: '#FFCCC7',
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  errorText: {
    fontSize: 14,
    color: '#FF4D4F',
    textAlign: 'left',
    lineHeight: 20,
    flex: 1,
    fontFamily: Fonts.regular,
  },
  infoContainer: {
    marginTop: SPACING.md, // Using design system token
    paddingHorizontal: SPACING.md, // Using design system token
    paddingVertical: SPACING.sm, // Using design system token
    backgroundColor: '#FFE5F0', // Light pink background
    borderRadius: BORDER_RADIUS.md, // Using design system token
    borderWidth: 1,
    borderColor: '#FFB6C1', // Light pink border
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm, // Using design system token
  },
  infoText: {
    fontSize: 14, // Small text size from design system
    color: '#6B7280', // Secondary text color from design system
    textAlign: 'left',
    lineHeight: 20,
    flex: 1,
    fontFamily: Fonts.regular, // Inter Regular from design system
  },
  floatingButtonContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: SPACING.lg,
    paddingHorizontal: SPACING.xl,
  },
  continueButton: {
    backgroundColor: '#FF4F81', // Primary pink from design system
    paddingVertical: 18, // From design system primary button spec
    paddingHorizontal: SPACING.xl, // Using design system token (32px)
    borderRadius: 16, // From design system primary button spec
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56, // From design system primary button spec
    width: '100%',
    overflow: 'hidden',
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
    fontFamily: Fonts.semiBold, // Poppins SemiBold from design system
    fontWeight: '600', // SemiBold weight from design system
    fontSize: 18, // From design system primary button spec
    color: '#FFFFFF', // White text from design system
    letterSpacing: 0.5, // From design system primary button spec
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
    opacity: 0.5, // Reduced opacity for disabled state
  },
  disabledButtonText: {
    opacity: 0.7, // Slightly more visible text when disabled
  },
});
