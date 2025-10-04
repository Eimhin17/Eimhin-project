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
  Easing,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
// import { BlurView } from 'expo-blur';
import { useUser } from '../../contexts/UserContext';
import { useOnboarding, ONBOARDING_STEPS } from '../../OnboardingContext';
import { safeGoBack } from '../../utils/safeNavigation';
import { SPACING } from '../../utils/constants';
import { Colors, Gradients, GradientConfigs } from '../../utils/colors';
import {
  attachProgressHaptics,
  playLightHaptic,
  playOnboardingProgressHaptic,
} from '../../utils/haptics';
import * as Haptics from 'expo-haptics';
import { ProgressBar, BackButton } from '../../components/ui';
import { Fonts } from '../../utils/fonts';
import { Ionicons } from '@expo/vector-icons';

export default function PasswordCreationScreen() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showAccountConnectPopup, setShowAccountConnectPopup] = useState(false);
  const [isProgressAnimating, setIsProgressAnimating] = useState(false);
  const TOTAL_STEPS = 5;
  const CURRENT_STEP = 5;
  const PREVIOUS_STEP = 4;
  const { updateUserProfile } = useUser();
  const { updateData, setCurrentStep } = useOnboarding();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const progressFillAnim = useRef(new Animated.Value(0)).current;


  useFocusEffect(
    React.useCallback(() => {
      progressFillAnim.stopAnimation();
      progressFillAnim.setValue(0);
      setIsProgressAnimating(false);
      return undefined;
    }, [progressFillAnim])
  );
  
  // Refs for keyboard handling
  const scrollViewRef = useRef<ScrollView>(null);
  const formRef = useRef<View>(null);
  const passwordFillAnim = useRef(new Animated.Value(0)).current;
  const confirmFillAnim = useRef(new Animated.Value(0)).current;
  const [activeField, setActiveField] = useState<'password' | 'confirm' | null>(null);
  
  // Button press animations
  const buttonScale = useRef(new Animated.Value(1)).current;
  const backButtonScale = useRef(new Animated.Value(0.8)).current;
  const backButtonOpacity = useRef(new Animated.Value(0.3)).current;
  const buttonHighlightAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Register this step for resume functionality
    setCurrentStep(ONBOARDING_STEPS.PASSWORD_CREATION);

    // Staggered entrance animations including back button fade + scale
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
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

  useEffect(() => {
    const target = Math.min(password.length / 12, 1);
    Animated.timing(passwordFillAnim, {
      toValue: target,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [password, passwordFillAnim]);

  useEffect(() => {
    const baseLength = password.length > 0 ? password.length : 12;
    const target = Math.min(confirmPassword.length / baseLength, 1);
    Animated.timing(confirmFillAnim, {
      toValue: target,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [confirmPassword, password, confirmFillAnim]);

  // Password validation
  const validatePassword = (pass: string) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(pass);
    const hasLowerCase = /[a-z]/.test(pass);
    const hasNumbers = /\d/.test(pass);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(pass);
    
    return {
      isValid: pass.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar,
      minLength: pass.length >= minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar
    };
  };

  const passwordValidation = validatePassword(password);
  const passwordsMatch = password === confirmPassword && password.length > 0;
  const isFormValid = passwordValidation.isValid && passwordsMatch;

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

  const savePasswordToProfile = async () => {
    try {
      console.log('🔐 Saving password to auth user...');

      // Correct path to Supabase client from onboarding screens
      const { supabase } = await import('../../lib/supabase');

      // Update the user's password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) {
        // Allow duplicate passwords: treat "new password equals old password" as success/no-op
        if (typeof updateError.message === 'string' && updateError.message.includes('New password should be different from the old password')) {
          console.log('ℹ️ Password unchanged (same as old). Treating as success.');
        } else {
          console.error('❌ Error setting password:', updateError);
          // Don't fail completely - password can be set later
          Alert.alert(
            'Warning',
            'Password may not have been saved. You can set it later in settings.',
            [{ text: 'Continue' }]
          );
        }
      } else {
        console.log('✅ Password saved successfully');
      }

      return { success: true };
    } catch (error) {
      console.error('❌ Error in savePasswordToProfile:', error);
      return { success: false };
    }
  };

  const handleCreateAccount = async () => {
    if (!isFormValid) return;

    console.log('🔐 === PASSWORD CREATION START ===');
    console.log('🔐 Form validation passed:', isFormValid);
    console.log('🔐 Password length:', password.length);
    console.log('🔐 Password value (first 3 chars):', password.substring(0, 3) + '...');
    console.log('🔐 Password type:', typeof password);
    console.log('🔐 Confirm password matches:', passwordsMatch);
    console.log('🔐 Password validation results:', passwordValidation);
    console.log('🔐 === END PASSWORD CREATION START ===');

    // Add haptic feedback and button animation
    playLightHaptic();
    triggerButtonSweep();

    // Save password to Supabase Auth
    setIsLoading(true);
    await savePasswordToProfile();
    setIsLoading(false);

    // Store password in OnboardingContext for backward compatibility
    updateData({ password: password });

    // Start step-by-step progress animation with button press animation
    animateButtonPress(buttonScale, animateStepByStepProgress);
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
      playOnboardingProgressHaptic(CURRENT_STEP, TOTAL_STEPS);
      // Celebration will be triggered by progress bar onAnimationComplete callback
    });
  };

  const startCelebrationSequence = () => {
    console.log('🔐 === PASSWORD SAVE TO USERCONTEXT ===');
    console.log('🔐 Password being saved to UserContext:', password ? 'YES' : 'NO');
    console.log('🔐 Password length:', password?.length || 0);
    console.log('🔐 Password value (first 3 chars):', password ? password.substring(0, 3) + '...' : 'undefined');
    console.log('🔐 Password type:', typeof password);
    console.log('🔐 Password validation passed:', passwordValidation.isValid);
    console.log('🔐 About to call updateUserProfile with password');
    console.log('🔐 === END PASSWORD SAVE TO USERCONTEXT ===');

    // Store password in OnboardingContext for account creation
    updateData({ password: password });

    updateUserProfile({
      onboardingCompleted: true
    });

    console.log('🔐 === AFTER UPDATEUSERPROFILE CALL ===');
    console.log('🔐 updateUserProfile called successfully');
    console.log('🔐 Navigating to notifications screen');
    console.log('🔐 === END AFTER UPDATEUSERPROFILE CALL ===');

    // Navigate immediately
    router.push('/(onboarding)/mascot-phase2');
  };

  const playOnboardingCompletionHaptics = () => {
    // Celebration haptic sequence for onboarding completion
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    }, 150);

    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }, 300);

    setTimeout(() => {
      Haptics.selectionAsync().catch(() => {});
    }, 450);

    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }, 600);
  };

  // Removed animateColorTransitionProgress function

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
      safeGoBack(ONBOARDING_STEPS.PASSWORD_CREATION);
    });
  };

  // Handle keyboard focus to center the form
  const handleInputFocus = () => {
    if (formRef.current && scrollViewRef.current) {
      formRef.current.measureLayout(
        scrollViewRef.current as any,
        (x, y, width, height) => {
          // Center the form on screen by scrolling to show it in the middle
          const scrollY = Math.max(0, y - 100); // Offset to center better
          scrollViewRef.current?.scrollTo({
            y: scrollY,
            animated: true,
          });
        },
        () => {
          console.log('Error measuring form layout');
        }
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.contentWrapper}>
          <ScrollView 
            ref={scrollViewRef}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            automaticallyAdjustKeyboardInsets={true}
          >
            <Animated.View style={[styles.topRow, { opacity: fadeAnim }]}>
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
                  currentStep={CURRENT_STEP}
                  previousStep={PREVIOUS_STEP}
                  totalSteps={TOTAL_STEPS}
                  showStepNumbers={false}
                  variant="gradient"
                  size="medium"
                  fill={isProgressAnimating ? progressFillAnim : undefined}
                  isAnimating={isProgressAnimating}
                  useMoti
                  gradientColors={GradientConfigs.phaseOneProgress.colors}
                  style={styles.progressBar}
                  onAnimationComplete={startCelebrationSequence}
                />
              </View>
              {/* Empty spacer to match blocked-schools layout */}
              <View style={{ width: 48, height: 48 }} />
            </Animated.View>

            <Animated.View style={[styles.content, { opacity: contentOpacity }]}>
              <Text style={styles.title}>Create Password</Text>
              <Text style={styles.subtitle}>
                Choose a strong password with 8+ characters, upper & lower case letters, a number, and a special symbol.
              </Text>

              <Animated.View ref={formRef} style={[styles.formContainer, { opacity: formOpacity }]}>
                <View style={styles.inputSection}>
                  <View style={styles.labelRow}>
                    <Text style={styles.inputLabel}>Password</Text>
                    <TouchableOpacity
                      onPress={() => setShowPassword((prev) => !prev)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.toggleButtonText}>
                        {showPassword ? 'Hide' : 'Show'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    style={styles.lineInput}
                    placeholder="Create a strong password"
                    placeholderTextColor="#9CA3AF"
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => {
                      handleInputFocus();
                      setActiveField('password');
                    }}
                    onBlur={() => setActiveField(null)}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    selectionColor="#FF4F81"
                  />
                  <View
                    style={[
                      styles.lineTrack,
                      (activeField === 'password' || password.length > 0) && styles.lineTrackActive,
                    ]}
                  >
                    <Animated.View
                      style={[
                        styles.lineFill,
                        {
                          width: passwordFillAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0%', '100%'],
                          }),
                        },
                      ]}
                    />
                  </View>
                </View>

                <View style={[styles.inputSection, styles.lastInputSection]}>
                  <View style={styles.labelRow}>
                    <Text style={styles.inputLabel}>Confirm Password</Text>
                    <TouchableOpacity
                      onPress={() => setShowConfirmPassword((prev) => !prev)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.toggleButtonText}>
                        {showConfirmPassword ? 'Hide' : 'Show'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    style={styles.lineInput}
                    placeholder="Confirm your password"
                    placeholderTextColor="#9CA3AF"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    onFocus={() => {
                      handleInputFocus();
                      setActiveField('confirm');
                    }}
                    onBlur={() => setActiveField(null)}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    selectionColor="#FF4F81"
                  />
                  <View
                    style={[
                      styles.lineTrack,
                      (activeField === 'confirm' || confirmPassword.length > 0) && styles.lineTrackActive,
                    ]}
                  >
                    <Animated.View
                      style={[
                        styles.lineFill,
                        {
                          width: confirmFillAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0%', '100%'],
                          }),
                        },
                      ]}
                    />
                  </View>
                  {confirmPassword.length > 0 && !passwordsMatch && (
                    <Text style={styles.errorText}>Passwords do not match</Text>
                  )}
                </View>

              </Animated.View>
            </Animated.View>
          </ScrollView>
        </View>

        <Animated.View style={[styles.floatingButtonContainer, { opacity: buttonOpacity }]}>
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity
              style={[
                styles.createAccountButton,
                (!isFormValid || isLoading) && styles.disabledButton
              ]}
              onPress={handleCreateAccount}
              activeOpacity={0.8}
              disabled={!isFormValid || isLoading}
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
              <Text style={[
                styles.createAccountButtonText,
                (!isFormValid || isLoading) && styles.disabledButtonText
              ]}>
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>


        {/* Account Connect Popup */}
        {showAccountConnectPopup && (
            <View
              style={[styles.popupOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}
            >
              <Animated.View
                style={[styles.popupContainer, {
                  opacity: showAccountConnectPopup ? 1 : 0,
                  transform: [
                    { scale: showAccountConnectPopup ? 1 : 0.9 },
                    { translateY: showAccountConnectPopup ? 0 : 20 }
                  ]
                }]}
              >
                <LinearGradient
                  colors={Gradients.primary as [string, string]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.popupHeader}
                >
                  <View style={styles.popupIconContainer}>
                    <Text style={styles.popupIcon}>🔗</Text>
                  </View>
                  <Text style={styles.popupTitle}>Connect Your Account</Text>
                  <Text style={styles.popupSubtitle}>
                    Link your Apple or Google account for faster, easier sign-ins
                  </Text>
                </LinearGradient>

                <View style={styles.popupContent}>
                  <TouchableOpacity
                    style={styles.connectButton}
                    onPress={() => {
                      // Handle Apple Sign In
                      updateUserProfile({ appleConnected: true } as any);
                      router.push('/(onboarding)/mascot-phase2');
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={styles.connectButtonContent}>
                      <Text style={styles.connectButtonIcon}>🍎</Text>
                      <View style={styles.connectButtonTextContainer}>
                        <Text style={styles.connectButtonText}>Continue with Apple</Text>
                        <Text style={styles.connectButtonSubtext}>Secure & Private</Text>
                      </View>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.connectButton}
                    onPress={() => {
                      // Handle Google Sign In
                      updateUserProfile({ googleConnected: true } as any);
                      router.push('/(onboarding)/mascot-phase2');
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={styles.connectButtonContent}>
                      <Text style={styles.connectButtonIcon}>🔍</Text>
                      <View style={styles.connectButtonTextContainer}>
                        <Text style={styles.connectButtonText}>Continue with Google</Text>
                        <Text style={styles.connectButtonSubtext}>Quick & Easy</Text>
                      </View>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.skipButton}
                    onPress={() => {
                      setShowAccountConnectPopup(false);
                      router.push('/(onboarding)/mascot-phase2');
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.skipButtonText}>Skip for now</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </View>
          )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Primary white background from design system
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  contentWrapper: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: SPACING['3xl'] + SPACING.lg,
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
    alignItems: 'stretch',
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
    marginBottom: SPACING['2xl'],
    lineHeight: 24,
    fontFamily: Fonts.regular,
  },
  formContainer: {
    marginBottom: 0,
    width: '100%',
  },
  inputSection: {
    marginBottom: SPACING['2xl'],
    width: '100%',
  },
  lastInputSection: {
    marginBottom: SPACING.lg,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  inputLabel: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    color: '#1B1B3A',
  },
  toggleButtonText: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: '#FF4F81',
  },
  lineInput: {
    fontSize: 20,
    fontFamily: Fonts.semiBold,
    color: '#1B1B3A',
    paddingVertical: 8,
    width: '100%',
  },
  lineTrack: {
    height: 2,
    backgroundColor: '#E5E7EB',
    width: '100%',
    borderRadius: 1,
    overflow: 'hidden',
  },
  lineTrackActive: {
    backgroundColor: '#D6BBFB',
  },
  lineFill: {
    height: '100%',
    backgroundColor: '#c3b1e1',
  },
  errorText: {
    marginTop: SPACING.sm,
    fontSize: 14,
    color: '#EF4444',
    fontFamily: Fonts.regular,
  },
  floatingButtonContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: SPACING.lg,
    paddingHorizontal: SPACING.xl,
  },
  createAccountButton: {
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
  createAccountButtonText: {
    fontFamily: Fonts.semiBold, // Poppins SemiBold from design system
    fontWeight: '600', // SemiBold weight from design system
    fontSize: 18, // From design system primary button spec
    color: '#FFFFFF', // White text from design system
    letterSpacing: 0.5, // From design system primary button spec
  },
  disabledButton: {
    opacity: 0.5, // Reduced opacity for disabled state
  },
  disabledButtonText: {
    opacity: 0.7, // Slightly more visible text when disabled
  },
  popupOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
     popupContainer: {
     backgroundColor: Colors.background.primary,
     borderRadius: 32,
     width: '85%',
     maxWidth: 400,
     shadowColor: Colors.shadow.medium,
     shadowOffset: { width: 0, height: 8 },
     shadowOpacity: 1,
     shadowRadius: 20,
     elevation: 12,
     overflow: 'hidden',
   },
   popupHeader: {
     paddingTop: 32,
     paddingHorizontal: 24,
     paddingBottom: 24,
     alignItems: 'center',
   },
     popupIconContainer: {
     width: 64,
     height: 64,
     borderRadius: 32,
     backgroundColor: 'rgba(255,255,255,0.2)',
     alignItems: 'center',
     justifyContent: 'center',
     marginBottom: 16,
   },
   popupIcon: {
     fontSize: 32,
   },
   popupTitle: {
     fontSize: 26,
     fontWeight: '800',
     color: Colors.text.inverse,
     marginBottom: 12,
     letterSpacing: -0.5,
     textAlign: 'center',
   },
   popupSubtitle: {
     fontSize: 16,
     color: Colors.text.inverse,
     textAlign: 'center',
     opacity: 0.9,
     lineHeight: 22,
   },
   popupContent: {
     paddingHorizontal: 24,
     paddingBottom: 32,
   },
     connectButton: {
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'center',
     backgroundColor: Colors.background.primary,
     borderRadius: 20,
     paddingVertical: 20,
     paddingHorizontal: 20,
     marginBottom: 16,
     shadowColor: Colors.shadow.light,
     shadowOffset: { width: 0, height: 3 },
     shadowOpacity: 1,
     shadowRadius: 10,
     elevation: 3,
     borderWidth: 2,
     borderColor: Colors.border.light,
   },
   connectButtonIcon: {
     fontSize: 28,
     marginRight: 16,
   },
   connectButtonContent: {
     flexDirection: 'row',
     alignItems: 'center',
     flex: 1,
   },
   connectButtonTextContainer: {
     flex: 1,
   },
   connectButtonText: {
     fontSize: 18,
     fontWeight: '700',
     color: Colors.text.primary,
     letterSpacing: -0.3,
     marginBottom: 2,
   },
   connectButtonSubtext: {
     fontSize: 13,
     fontWeight: '500',
     color: Colors.text.secondary,
     letterSpacing: -0.1,
   },
     skipButton: {
     backgroundColor: 'transparent',
     borderRadius: 16,
     paddingVertical: 16,
     paddingHorizontal: 20,
     alignItems: 'center',
     justifyContent: 'center',
     marginTop: 8,
   },
   skipButtonText: {
     fontSize: 16,
     fontWeight: '600',
     color: Colors.text.secondary,
     letterSpacing: -0.2,
   },
});
