import React, { useState, useEffect, useRef } from 'react';
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
  TextInput,
  Easing,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useOnboarding, ONBOARDING_STEPS } from '../../OnboardingContext';
import { safeGoBack } from '../../utils/safeNavigation';
import { SPACING } from '../../utils/constants';
import { ProgressBar, BackButton } from '../../components/ui';
import { Fonts } from '../../utils/fonts';
import { UsernameValidationService } from '../../services/usernameValidation';
import { ProgressiveOnboardingService } from '../../services/progressiveOnboarding';
import { LinearGradient } from 'expo-linear-gradient';
import { attachProgressHaptics, playLightHaptic, playOnboardingProgressHaptic } from '../../utils/haptics';

export default function BasicDetailsScreen() {
  const { data, updateData, setCurrentStep } = useOnboarding();

  const [firstName, setFirstName] = useState(data.firstName ?? '');
  const [username, setUsername] = useState(data.username ?? '');
  const [usernameError, setUsernameError] = useState<string>('');
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);
  const [isValidatingUsername, setIsValidatingUsername] = useState(false);
  const [focusedField, setFocusedField] = useState<'firstName' | 'username' | null>(null);
  const [isProgressAnimating, setIsProgressAnimating] = useState(false);
  const [showUsernameConfetti, setShowUsernameConfetti] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const TOTAL_STEPS = 5;
  const CURRENT_STEP = 1;
  const PREVIOUS_STEP = 0;

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const progressFillAnim = useRef(new Animated.Value(0)).current;
  const buttonHighlightAnim = useRef(new Animated.Value(0)).current;

  // Confetti and popup animations (REDUCED from 12 to 4 for memory safety)
  const popupScale = useRef(new Animated.Value(0)).current;
  const popupOpacity = useRef(new Animated.Value(0)).current;
  const confettiAnimations = useRef(
    Array.from({ length: 4 }, () => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      rotation: new Animated.Value(0),
      opacity: new Animated.Value(0),
    }))
  ).current;

  // Button press animations
  const buttonScale = useRef(new Animated.Value(1)).current;
  const backButtonScale = useRef(new Animated.Value(0.8)).current;
  const backButtonOpacity = useRef(new Animated.Value(0.3)).current;

  // Sync local state with context data (for back navigation)
  useEffect(() => {
    if (data.firstName && data.firstName !== firstName) {
      setFirstName(data.firstName);
    }
    if (data.username && data.username !== username) {
      setUsername(data.username);
    }
  }, [data.firstName, data.username]);

  useEffect(() => {
    // Register this step for resume functionality
    setCurrentStep(ONBOARDING_STEPS.BASIC_DETAILS);

    // Staggered entrance animations including back button fade + scale
    const entranceAnimation = Animated.sequence([
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
    ]);

    entranceAnimation.start();

    // CRITICAL: Cleanup function to prevent memory leaks
    return () => {
      entranceAnimation.stop();

      // Stop all confetti animations
      confettiAnimations.forEach(confetti => {
        confetti.x.stopAnimation();
        confetti.y.stopAnimation();
        confetti.rotation.stopAnimation();
        confetti.opacity.stopAnimation();
      });

      // Reset animation values
      fadeAnim.setValue(0);
      slideAnim.setValue(30);
      contentOpacity.setValue(0);
      formOpacity.setValue(0);
      buttonOpacity.setValue(0);
      backButtonOpacity.setValue(0.3);
      backButtonScale.setValue(0.8);
    };
  }, []);

  // Username available popup and confetti animation
  const triggerUsernameConfetti = () => {
    setShowUsernameConfetti(true);

    // Initial success haptic
    playLightHaptic();

    // Reset popup and confetti animations
    popupScale.setValue(0);
    popupOpacity.setValue(0);
    confettiAnimations.forEach((confetti) => {
      confetti.x.setValue(0);
      confetti.y.setValue(0);
      confetti.rotation.setValue(0);
      confetti.opacity.setValue(0);
    });

    // Animate popup first
    Animated.parallel([
      Animated.spring(popupScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 120,
        friction: 8,
      }),
      Animated.timing(popupOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Progressive haptic feedback during confetti burst
    const hapticTimings = [
      { delay: 0, type: 'light' },      // Initial burst
      { delay: 200, type: 'light' },   // Peak of burst
      { delay: 400, type: 'selection' }, // Mid-flight
      { delay: 800, type: 'selection' }, // Settling
      { delay: 1200, type: 'light' },  // Final flourish
    ];

    hapticTimings.forEach(({ delay, type }) => {
      setTimeout(() => {
        if (type === 'light') {
          playLightHaptic();
        } else {
          // Selection haptic for variety
          import('expo-haptics').then((Haptics) => {
            Haptics.selectionAsync();
          });
        }
      }, delay);
    });

    // Then animate confetti pieces
    const confettiAnimations_Array = confettiAnimations.map((confetti, index) => {
      const randomX = (Math.random() - 0.5) * 400;
      const randomY = -200 - Math.random() * 100;
      const randomRotation = Math.random() * 720;

      return Animated.parallel([
        Animated.timing(confetti.opacity, {
          toValue: 1,
          duration: 100,
          delay: index * 30,
          useNativeDriver: true,
        }),
        Animated.timing(confetti.x, {
          toValue: randomX,
          duration: 1800,
          delay: index * 30,
          useNativeDriver: true,
        }),
        Animated.timing(confetti.y, {
          toValue: randomY,
          duration: 1800,
          delay: index * 30,
          useNativeDriver: true,
        }),
        Animated.timing(confetti.rotation, {
          toValue: randomRotation,
          duration: 1800,
          delay: index * 30,
          useNativeDriver: true,
        }),
      ]);
    });

    Animated.parallel(confettiAnimations_Array).start();

    // Hide popup and confetti after delay
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(popupOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        ...confettiAnimations.map((confetti) =>
          Animated.timing(confetti.opacity, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          })
        ),
      ]).start(() => {
        setShowUsernameConfetti(false);
      });
    }, 2500);
  };

  const validateUsername = async (usernameToValidate: string) => {
    if (!usernameToValidate.trim()) {
      setUsernameError('');
      setUsernameSuggestions([]);
      return;
    }

    setIsValidatingUsername(true);
    setUsernameError('');

    try {
      const result = await UsernameValidationService.validateUsername(usernameToValidate);

      if (!result.isValid) {
        setUsernameError(result.error || 'Invalid username');
        setUsernameSuggestions([]);
      } else if (!result.isAvailable) {
        setUsernameError(result.error || 'Username is already taken');
        setUsernameSuggestions(result.suggestions || []);
      } else {
        setUsernameError('');
        setUsernameSuggestions([]);
        // Trigger confetti celebration when username is available
        triggerUsernameConfetti();
      }
    } catch (error) {
      console.error('❌ Error validating username:', error);
      setUsernameError('Failed to validate username');
      setUsernameSuggestions([]);
    } finally {
      setIsValidatingUsername(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (username.trim()) {
        validateUsername(username);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [username]);


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

  const animateProgressAndContinue = () => {
    if (isProgressAnimating) {
      return;
    }

    progressFillAnim.setValue(0);
    setIsProgressAnimating(true);
    const detachHaptics = attachProgressHaptics(progressFillAnim);

    Animated.timing(progressFillAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: false,
    }).start(() => {
      detachHaptics();
      setIsProgressAnimating(false);
      playOnboardingProgressHaptic(CURRENT_STEP, TOTAL_STEPS);
      router.push('/(onboarding)/date-of-birth');
    });
  };

  const handleContinue = async () => {
    if (!firstName.trim() || !username.trim() || usernameError || isValidatingUsername || isSaving) {
      return;
    }

    playLightHaptic();
    triggerButtonSweep();

    // Save to database immediately
    setIsSaving(true);
    const result = await ProgressiveOnboardingService.updateProfile({
      first_name: firstName.trim(),
      username: username.trim(),
    });
    setIsSaving(false);

    if (!result.success) {
      Alert.alert('Error', 'Failed to save your details. Please try again.');
      return;
    }

    // Also save to context for backward compatibility
    updateData({
      firstName: firstName.trim(),
      username: username.trim(),
    });

    animateButtonPress(buttonScale, animateProgressAndContinue);
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
      safeGoBack(ONBOARDING_STEPS.BASIC_DETAILS);
    });
  };

  const isFormValid =
    Boolean(firstName.trim()) && Boolean(username.trim()) && !usernameError && !isValidatingUsername;

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
                  currentStep={ONBOARDING_STEPS.BASIC_DETAILS}
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

          <Animated.View
            style={[
              styles.content,
              {
                opacity: contentOpacity,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={styles.title}>Basic details</Text>
            <Text style={styles.subtitle}>
              Let's start with the basics
            </Text>

            <Animated.View style={[styles.formContainer, { opacity: formOpacity }]}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>First name</Text>
                <TextInput
                  value={firstName}
                  onChangeText={setFirstName}
                  onFocus={() => setFocusedField('firstName')}
                  onBlur={() => setFocusedField((prev) => (prev === 'firstName' ? null : prev))}
                  placeholder="e.g. Aoife"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="words"
                  autoCorrect={false}
                  style={styles.inputField}
                  selectionColor="#FF4F81"
                />
                <View
                  style={[
                    styles.inputUnderline,
                    (focusedField === 'firstName' || firstName.trim()) && styles.inputUnderlineActive,
                  ]}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Username</Text>
                <TextInput
                  value={username}
                  onChangeText={setUsername}
                  onFocus={() => setFocusedField('username')}
                  onBlur={() => setFocusedField((prev) => (prev === 'username' ? null : prev))}
                  placeholder="Pick something memorable"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={15}
                  style={styles.inputField}
                  selectionColor="#FF4F81"
                  returnKeyType="done"
                />
                <View
                  style={[
                    styles.inputUnderline,
                    (focusedField === 'username' || username.trim()) && styles.inputUnderlineActive,
                  ]}
                />

                {usernameError ? (
                  <Text style={styles.errorText}>{usernameError}</Text>
                ) : null}

                {isValidatingUsername && (
                  <Text style={styles.helperText}>Checking availability…</Text>
                )}

                {usernameSuggestions.length > 0 && (
                  <View style={styles.suggestionsContainer}>
                    <Text style={styles.suggestionsTitle}>Try one of these:</Text>
                    <View style={styles.suggestionsRow}>
                      {usernameSuggestions.map((suggestion) => (
                        <TouchableOpacity
                          key={suggestion}
                          style={styles.suggestionPill}
                          onPress={() => {
                            setUsername(suggestion);
                            setUsernameSuggestions([]);
                          }}
                        >
                          <Text style={styles.suggestionText}>{suggestion}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            </Animated.View>
          </Animated.View>
        </ScrollView>

        {/* Username available popup and confetti */}
        {showUsernameConfetti && (
          <>
            {/* Success popup */}
            <Animated.View
              style={[
                styles.usernamePopupContainer,
                {
                  opacity: popupOpacity,
                  transform: [{ scale: popupScale }],
                },
              ]}
            >
              <View style={styles.usernamePopupContent}>
                <Text style={styles.usernamePopupIcon}>✅</Text>
                <Text style={styles.usernamePopupText}>Username is available!</Text>
              </View>
            </Animated.View>

            {/* Confetti burst */}
            <View style={styles.confettiContainer} pointerEvents="none">
              {confettiAnimations.map((confetti, index) => {
                const shapes = ['rectangle', 'circle', 'triangle'];
                const colors = ['#FF4F81', '#c3b1e1'];
                const shape = shapes[index % 3];
                const color = colors[index % 2];

                return (
                  <Animated.View
                    key={index}
                    style={[
                      styles.confettiPiece,
                      {
                        opacity: confetti.opacity,
                        transform: [
                          { translateX: confetti.x },
                          { translateY: confetti.y },
                          { rotate: confetti.rotation.interpolate({
                              inputRange: [0, 360],
                              outputRange: ['0deg', '360deg'],
                            }) },
                        ],
                      },
                    ]}
                  >
                    <View style={[
                      styles.confettiBit,
                      shape === 'rectangle' && [styles.confettiRectangle, { backgroundColor: color }],
                      shape === 'circle' && [styles.confettiCircle, { backgroundColor: color }],
                      shape === 'triangle' && [styles.confettiTriangle, { borderBottomColor: color }],
                    ]} />
                  </Animated.View>
                );
              })}
            </View>
          </>
        )}

        <Animated.View style={[styles.floatingButtonContainer, { opacity: buttonOpacity }]}>
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity
              style={[styles.continueButton, (!isFormValid || isSaving) && styles.disabledButton]}
              onPress={handleContinue}
              activeOpacity={0.8}
              disabled={!isFormValid || isSaving}
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
              <Text style={[styles.continueButtonText, (!isFormValid || isSaving) && styles.disabledButtonText]}>
                {isSaving ? 'Saving...' : 'Continue'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
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
  formContainer: {
    alignSelf: 'stretch',
    gap: SPACING['2xl'],
  },
  inputGroup: {
    alignSelf: 'stretch',
  },
  inputLabel: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'left',
    marginBottom: SPACING.xs,
    fontFamily: Fonts.semiBold,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  inputField: {
    fontSize: 20,
    color: '#1B1B3A',
    fontFamily: Fonts.semiBold,
    paddingVertical: SPACING.xs,
  },
  inputUnderline: {
    height: 2,
    backgroundColor: '#E5E7EB',
    borderRadius: 1,
  },
  inputUnderlineActive: {
    backgroundColor: '#c3b1e1',
  },
  errorText: {
    marginTop: SPACING.sm,
    color: '#EF4444',
    fontSize: 14,
    fontFamily: Fonts.semiBold,
  },
  helperText: {
    marginTop: SPACING.sm,
    color: '#6B7280',
    fontSize: 13,
    fontFamily: Fonts.regular,
  },
  suggestionsContainer: {
    marginTop: SPACING.md,
    gap: SPACING.xs,
  },
  suggestionsTitle: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: Fonts.semiBold,
  },
  suggestionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  suggestionPill: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  suggestionText: {
    fontSize: 14,
    color: '#FF4F81',
    fontFamily: Fonts.semiBold,
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
  usernamePopupContainer: {
    position: 'absolute',
    top: 140,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
  usernamePopupContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FF4F81',
    ...Platform.select({
      ios: {
        shadowColor: '#FF4F81',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
        shadowColor: '#FF4F81',
      },
    }),
  },
  usernamePopupIcon: {
    fontSize: 24,
    marginRight: SPACING.md,
  },
  usernamePopupText: {
    color: '#FF4F81',
    fontSize: 18,
    fontFamily: Fonts.semiBold,
    fontWeight: '600',
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  confettiPiece: {
    position: 'absolute',
  },
  confettiBit: {
    width: 8,
    height: 8,
  },
  confettiRectangle: {
    width: 12,
    height: 6,
    borderRadius: 1,
  },
  confettiCircle: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  confettiTriangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
});
