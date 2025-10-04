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
  Alert,
  TextInput,
  Easing
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useOnboarding, ONBOARDING_STEPS } from '../../OnboardingContext';
import { safeGoBack } from '../../utils/safeNavigation';
import { SPACING, BORDER_RADIUS } from '../../utils/constants';
import { GradientConfigs } from '../../utils/colors';
import {
  attachProgressHaptics,
  playCardSelectionHaptic,
  playLightHaptic,
  playOnboardingProgressHaptic,
} from '../../utils/haptics';
import { ProgressBar, BackButton } from '../../components/ui';
import { Fonts } from '../../utils/fonts';
import { EmailService } from '../../services/email';
import { Ionicons } from '@expo/vector-icons';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);
const CODE_LENGTH = 6;

export default function EmailCodeScreen() {
  const [verificationCode, setVerificationCode] = useState(Array(CODE_LENGTH).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [isProgressAnimating, setIsProgressAnimating] = useState(false);
  const { data: onboardingData, updateData, setCurrentStep } = useOnboarding();
  
  // Refs for each input
  const inputRefs = useRef<TextInput[]>([]);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const digitPulseAnimations = useRef(Array.from({ length: CODE_LENGTH }, () => new Animated.Value(0))).current;
  const successCascadeAnimations = useRef(Array.from({ length: CODE_LENGTH }, () => new Animated.Value(0))).current;
  const successMessageAnim = useRef(new Animated.Value(0)).current;
  const [hasVerificationSucceeded, setHasVerificationSucceeded] = useState(false);

  // Button press animations - fade + scale combo
  const buttonScale = useRef(new Animated.Value(1)).current;
  const backButtonScale = useRef(new Animated.Value(0.8)).current;
  const backButtonOpacity = useRef(new Animated.Value(0.3)).current;
  const resendButtonScale = useRef(new Animated.Value(1)).current;
  const progressFillAnim = useRef(new Animated.Value(0)).current;
  useFocusEffect(
    React.useCallback(() => {
      progressFillAnim.stopAnimation();
      progressFillAnim.setValue(0);
      setIsProgressAnimating(false);
      return undefined;
    }, [progressFillAnim])
  );

  useEffect(() => {
    // Register this step for resume functionality
    setCurrentStep(ONBOARDING_STEPS.EMAIL_CODE);

    // Log onboarding data when component mounts
    console.log('📧 Email code screen - onboarding data:', onboardingData);

    // Staggered entrance animations including back button bounce
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

  const resetDigitAnimations = () => {
    digitPulseAnimations.forEach((anim) => {
      anim.stopAnimation();
      anim.setValue(0);
    });
  };

  const resetSuccessAnimations = () => {
    successCascadeAnimations.forEach((anim) => {
      anim.stopAnimation();
      anim.setValue(0);
    });
    successMessageAnim.stopAnimation();
    successMessageAnim.setValue(0);
  };

  const startSuccessSequence = () => {
    resetSuccessAnimations();
    const cascadeAnimations = successCascadeAnimations.map((anim, index) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      })
    );

    Animated.parallel([
      Animated.stagger(70, cascadeAnimations),
      Animated.timing(successMessageAnim, {
        toValue: 1,
        duration: 420,
        delay: 70 * cascadeAnimations.length,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      animateStepByStepProgress();
    });
  };

  const handleDigitChange = (text: string, index: number) => {
    // Only allow single digit
    if (text.length > 1) return;
    
    const newCode = [...verificationCode];
    newCode[index] = text;
    setVerificationCode(newCode);

    const pulseAnim = digitPulseAnimations[index];

    if (text) {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(0);
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 150,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
      playCardSelectionHaptic();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(0);
    }
    
    // Auto-focus next input if digit entered
    if (text && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
    
    // Auto-verify when all 6 digits are entered
    if (newCode.every(digit => digit !== '') && newCode.length === CODE_LENGTH) {
      const fullCode = newCode.join('');
      handleVerifyCode(fullCode);
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    // Handle backspace
    if (key === 'Backspace' && !verificationCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const ensureProfileExists = async (email: string) => {
    try {
      const { supabase } = await import('../../lib/supabase');

      // Get the current authenticated user
      const { data: { user }, error: getUserError } = await supabase.auth.getUser();
      if (getUserError || !user) {
        console.error('❌ No authenticated user');
        return { success: false };
      }

      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (existingProfile) {
        console.log('✅ Profile already exists');
        return { success: true, userId: user.id };
      }

      // Profile doesn't exist - try to create with upsert using only fields we know exist
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: email,
          first_name: '',
          username: `user_${user.id.substring(0, 8)}`,
          // Ensure NOT NULL constraint is satisfied in DB
          // Use a safe placeholder; onboarding will update real DOB later
          date_of_birth: '2000-01-01',
          gender: 'woman',
          looking_for_debs: 'go_to_someones_debs',
          dating_intentions: 'long_term_only',
          onboarding_completed: false,
          status: 'active',
        }, {
          onConflict: 'id'
        });

      if (upsertError) {
        console.error('❌ Profile upsert error:', upsertError);
        // Don't throw - profile might be created by trigger or can be created later
        return { success: false, error: upsertError.message };
      }

      console.log('✅ Profile created via upsert');
      return { success: true, userId: user.id };
    } catch (error) {
      console.error('❌ Error ensuring profile exists:', error);
      return { success: false };
    }
  };

  const handleVerifyCode = async (code?: string) => {
    const codeToVerify = code || verificationCode.join('');

    if (!codeToVerify || codeToVerify.length !== CODE_LENGTH) {
      return;
    }

    try {
      setIsLoading(true);

      // Get the email from onboarding data
      const email = onboardingData.schoolEmail;
      if (!email) {
        Alert.alert('Error', 'No email found. Please go back and enter your email first.');
        return;
      }

      // Testing bypass: accept "000000" as valid code
      if (codeToVerify === '000000') {
        console.log('✅ Email verification successful (testing bypass)!');

        if (!hasVerificationSucceeded) {
          setHasVerificationSucceeded(true);
          startSuccessSequence();
        }
        return;
      }

      // Actually verify the code using EmailService
      const result = await EmailService.verifyCode(email, codeToVerify);

      if (result.success) {
        console.log('✅ Email verification successful!');

        // Try to ensure profile exists (but don't fail if it doesn't work)
        await ensureProfileExists(email);

        if (!hasVerificationSucceeded) {
          setHasVerificationSucceeded(true);
          startSuccessSequence();
        }
      } else {
        console.error('❌ Email verification failed:', result.error);
        Alert.alert(
          'Verification Failed',
          result.error || 'Invalid verification code. Please try again.',
          [{ text: 'OK' }]
        );
        // Clear the code on failure
        setVerificationCode(Array(CODE_LENGTH).fill(''));
        inputRefs.current[0]?.focus();
        setHasVerificationSucceeded(false);
        resetSuccessAnimations();
        resetDigitAnimations();
      }
    } catch (error) {
      console.error('❌ Verification error:', error);
      Alert.alert(
        'Verification Error',
        'An unexpected error occurred. Please try again.',
        [{ text: 'OK' }]
      );
      // Clear the code on error
      setVerificationCode(Array(CODE_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
      setHasVerificationSucceeded(false);
      resetSuccessAnimations();
      resetDigitAnimations();
    } finally {
      setIsLoading(false);
    }
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
      playOnboardingProgressHaptic(4, 5);
      // Navigate after smooth animation
      setTimeout(() => {
        updateData({ emailVerified: true });
        router.push('/(onboarding)/password-creation');
      }, 200);
    });
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
      safeGoBack(ONBOARDING_STEPS.EMAIL_CODE);
    });
  };

  const playResendFeedback = () => {
    Animated.sequence([
      Animated.timing(resendButtonScale, {
        toValue: 0.94,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.spring(resendButtonScale, {
        toValue: 1,
        friction: 6,
        tension: 120,
        useNativeDriver: true,
      }),
    ]).start();
    playLightHaptic();
  };

  const handleResendCode = async () => {
    try {
      const email = onboardingData.schoolEmail;
      if (!email) {
        Alert.alert('Error', 'No email found. Please go back and enter your email first.');
        return;
      }

      playResendFeedback();
      const result = await EmailService.sendVerificationCode(email);
      if (result.success) {
        Alert.alert('Code Resent', 'A new verification code has been sent to your email');
      } else {
        Alert.alert('Error', result.error || 'Failed to resend code. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to resend code. Please try again.');
    }
  };

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
          <Animated.View style={[styles.topRow, { opacity: fadeAnim }]}
          >
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
            <View style={styles.progressWrapper}>
              <ProgressBar
                currentStep={4}
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
            <Text style={styles.title}>Enter verification code</Text>
            <Text style={styles.subtitle}>
              Enter the 6-digit code from your email
            </Text>

            {/* 6-Digit Code Input */}
            <Animated.View style={[styles.codeContainer, { opacity: formOpacity }]}>
              <View style={styles.codeInputs}>
                {verificationCode.map((digit, index) => {
                  const pulseAnim = digitPulseAnimations[index];
                  const successAnim = successCascadeAnimations[index];
                  return (
                    <Animated.View
                      key={index}
                      style={[
                        styles.digitWrapper,
                        digit && styles.digitWrapperFilled,
                        (isLoading || hasVerificationSucceeded) && styles.digitWrapperLoading,
                        {
                          opacity: successAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, 0],
                          }),
                          transform: [
                            {
                              scale: successAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [1, 0.6],
                              }),
                            },
                            {
                              scale: pulseAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [1, 1.08],
                              }),
                            },
                          ],
                        },
                      ]}
                    >
                      <Animated.View
                        pointerEvents="none"
                        style={[
                          styles.digitHighlight,
                          {
                            opacity: pulseAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, 1],
                            }),
                          },
                        ]}
                      />
                      <TextInput
                        ref={(ref) => {
                          if (ref) inputRefs.current[index] = ref;
                        }}
                        style={styles.digitInput}
                        value={digit}
                        onChangeText={(text) => handleDigitChange(text, index)}
                        onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                        keyboardType="numeric"
                        maxLength={1}
                        selectTextOnFocus
                        editable={!isLoading && !hasVerificationSucceeded}
                      />
                    </Animated.View>
                  );
                })}
              </View>
            </Animated.View>

            {hasVerificationSucceeded && (
              <AnimatedLinearGradient
                colors={['#FFB4E6', '#FFC4E4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  styles.successMessage,
                  {
                    opacity: successMessageAnim,
                    transform: [
                      {
                        translateY: successMessageAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [16, 0],
                        }),
                      },
                      {
                        scale: successMessageAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.92, 1],
                        }),
                      },
                    ],
                  },
                ]}
                pointerEvents="none"
              >
                <View style={styles.successMessageContent}>
                  <Ionicons name="sparkles" size={18} color="#FFFFFF" />
                  <Text style={styles.successMessageText}>Email verified!</Text>
                </View>
              </AnimatedLinearGradient>
            )}

              {/* Resend Code */}
            <Animated.View style={[styles.resendContainer, { opacity: buttonOpacity }]}>
              <Animated.View style={[styles.resendButtonWrapper, { transform: [{ scale: resendButtonScale }] }]}
              >
                <TouchableOpacity 
                  style={styles.resendButton}
                  onPress={handleResendCode}
                  disabled={isLoading}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.resendButtonText, 
                    isLoading && styles.resendButtonTextDisabled
                  ]}>
                    {isLoading ? 'Verifying...' : 'Resend Code'}
                  </Text>
                </TouchableOpacity>
              </Animated.View>

              <View style={styles.noteContainer}>
                <Ionicons name="information-circle" size={16} color="#FF4F81" />
                <Text style={styles.noteText}>
                  Didn't receive the code? Check your spam folder or try resending.
                </Text>
              </View>
            </Animated.View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Primary white background from design system
  },
  scrollView: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.lg,
    alignItems: 'flex-start',
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
  codeContainer: {
    marginBottom: SPACING['2xl'],
    alignSelf: 'stretch',
  },
  codeInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.xs,
  },
  digitWrapper: {
    flex: 1,
    maxWidth: 48,
    height: 62,
    borderBottomWidth: 3,
    borderColor: '#E5E7EB',
    marginHorizontal: SPACING.xs / 2,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  digitWrapperFilled: {
    borderColor: '#c3b1e1',
  },
  digitWrapperLoading: {
    opacity: 0.6,
  },
  digitHighlight: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(195, 177, 225, 0.18)',
  },
  digitInput: {
    width: '100%',
    height: '100%',
    textAlign: 'center',
    fontSize: 28,
    fontWeight: '600',
    color: '#1B1B3A',
    backgroundColor: 'transparent',
    fontFamily: Fonts.semiBold,
  },
  resendContainer: {
    width: '100%',
    alignSelf: 'stretch',
    alignItems: 'stretch',
  },
  resendButtonWrapper: {
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
    position: 'relative',
  },
  resendButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: 0,
    paddingRight: SPACING.md,
    alignItems: 'center',
  },
  resendButtonText: {
    fontSize: 16,
    color: '#FF4F81',
    fontWeight: '600',
    textDecorationLine: 'underline',
    fontFamily: Fonts.semiBold,
  },
  resendButtonTextDisabled: {
    color: '#9CA3AF',
    textDecorationLine: 'none',
  },
  noteContainer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: '#FFE5F0',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: '#FFB6C1',
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    alignSelf: 'stretch',
    width: '100%',
  },
  noteText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'left',
    lineHeight: 20,
    flex: 1,
    fontFamily: Fonts.regular,
  },
  successMessage: {
    borderRadius: BORDER_RADIUS.md,
    marginHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    alignSelf: 'stretch',
  },
  successMessageContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  successMessageText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
  },
});
