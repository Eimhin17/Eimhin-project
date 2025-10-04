import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import { router } from 'expo-router';
import { SPACING } from '../../utils/constants';
import { Fonts } from '../../utils/fonts';
import { BackButton, ProgressBar } from '../../components/ui';
import { attachProgressHaptics, playLightHaptic, playOnboardingProgressHaptic } from '../../utils/haptics';
import * as Haptics from 'expo-haptics';
import { ProgressiveOnboardingService } from '../../services/progressiveOnboarding';
import { useOnboarding, ONBOARDING_STEPS } from '../../OnboardingContext';
import { Ionicons } from '@expo/vector-icons';
import { safeGoBack } from '../../utils/safeNavigation';
import { registerForPushNotificationsAsync, savePushToken } from '../../services/notifications';
import { supabase } from '../../lib/supabase';
import * as Notifications from 'expo-notifications';

export default function NotificationsScreen() {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isProgressAnimating, setIsProgressAnimating] = useState(false);
  const { updateData, setCurrentStep } = useOnboarding();

  const NOTIFICATION_OPTIONS = [
    { id: 'enable', label: 'Enable Notifications', icon: 'notifications' },
    { id: 'disable', label: 'Disable Notifications', icon: 'notifications-off' },
  ];

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const backButtonScale = useRef(new Animated.Value(0.8)).current;
  const backButtonOpacity = useRef(new Animated.Value(0.3)).current;
  const progressFillAnim = useRef(new Animated.Value(0)).current;

  // Weight-Push Button Animation values
  const buttonAnimValue = useRef(new Animated.Value(0)).current;
  const buttonScaleValue = useRef(new Animated.Value(1)).current;
  const leftWaveValue = useRef(new Animated.Value(0)).current;
  const rightWaveValue = useRef(new Animated.Value(0)).current;

  const TOTAL_STEPS = 3;
  const CURRENT_STEP = 1;
  const PREVIOUS_STEP = 0;

  // Register this step for resume functionality
  useEffect(() => {
    setCurrentStep(ONBOARDING_STEPS.NOTIFICATIONS);
  }, []);

  useEffect(() => {
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
    ]).start();
  }, [fadeAnim, slideAnim, contentOpacity, formOpacity]);

  // Weight-Push Button Animation
  const animateButtonSelection = () => {
    playLightHaptic(); // Initial tap haptic

    // Reset animations
    buttonAnimValue.setValue(0);
    buttonScaleValue.setValue(1);
    leftWaveValue.setValue(0);
    rightWaveValue.setValue(0);

    // Attach continuous haptics to the fill animation
    const detachFillHaptics = attachProgressHaptics(buttonAnimValue, {
      thresholds: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]
    });

    // Weight-push effect
    Animated.parallel([
      // Fill animation with continuous haptic feedback
      Animated.timing(buttonAnimValue, {
        toValue: 1,
        duration: 600,
        useNativeDriver: false,
      }),
      // Button scale + air waves
      Animated.sequence([
        Animated.delay(400), // Wait for fill to reach edges
        Animated.parallel([
          // Button push out
          Animated.timing(buttonScaleValue, {
            toValue: 1.04,
            duration: 100,
            useNativeDriver: true,
          }),
          // Left air wave
          Animated.timing(leftWaveValue, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          // Right air wave (slightly delayed)
          Animated.sequence([
            Animated.delay(20),
            Animated.timing(rightWaveValue, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
          ]),
        ]),
        // Return to normal size
        Animated.timing(buttonScaleValue, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ])
    ]).start(() => {
      // Clean up haptics when animation completes
      detachFillHaptics();
    });

    // Strong haptic feedback when button gets pushed out
    setTimeout(() => {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } catch (error) {
        console.warn('Strong haptic failed:', error);
      }
    }, 500); // Timed with the button push-out effect
  };

  const handleNotificationSelect = async (optionId: string) => {
    if (isProgressAnimating) return;

    // If enabling notifications, request permission FIRST
    if (optionId === 'enable') {
      try {
        // Request permission - this shows the native iOS/Android dialog
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== 'granted') {
          // User denied permission - treat as if they selected "disable"
          console.log('Notification permission denied');
          optionId = 'disable';
        }
      } catch (error) {
        console.error('Error requesting notification permissions:', error);
        optionId = 'disable';
      }
    }

    setSelectedOption(optionId);
    animateButtonSelection();
    animateStepByStepProgress(optionId);
  };

  const animateStepByStepProgress = (optionId: string) => {
    progressFillAnim.setValue(0);
    setIsProgressAnimating(true);
    const detachHaptics = attachProgressHaptics(progressFillAnim);

    // Wait for button animation to complete (600ms) before starting progress animation
    setTimeout(() => {
      Animated.timing(progressFillAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: false,
      }).start(() => {
        detachHaptics();
        setIsProgressAnimating(false);
        playOnboardingProgressHaptic(CURRENT_STEP, TOTAL_STEPS);

        // Navigate after smooth animation
        setTimeout(async () => {
          const notificationsEnabled = optionId === 'enable';

          try {
            // If user enabled notifications, get the push token and save it
            if (notificationsEnabled) {
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                const token = await registerForPushNotificationsAsync();
                if (token) {
                  await savePushToken(user.id, token);
                  console.log('Push notifications enabled and token saved');
                } else {
                  console.warn('Failed to get push token');
                }
              }
            }

            // Save preference to Supabase
            await ProgressiveOnboardingService.updateProfile({
              push_notifications_enabled: notificationsEnabled,
              email_notifications_enabled: notificationsEnabled,
            });

            // Also reflect in onboarding context for consistency
            updateData({
              pushNotificationsEnabled: notificationsEnabled,
              emailNotificationsEnabled: notificationsEnabled,
            } as any);
          } catch (e) {
            console.warn('Notification prefs save failed, continuing', e);
          }

          router.push('/(onboarding)/legal-agreements');
        }, 200);
      });
    }, 600); // Wait for button animation duration
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
      safeGoBack(ONBOARDING_STEPS.NOTIFICATIONS);
    });
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
            <Text style={styles.title}>Enable notifications?</Text>
            <Text style={styles.subtitle}>
              Don't miss out on all the hotties you match with!
            </Text>

            <Animated.View style={[styles.optionsContainer, { opacity: formOpacity }]}>
              {NOTIFICATION_OPTIONS.map((option) => {
                const isSelected = selectedOption === option.id;

                return (
                  <Animated.View
                    key={option.id}
                    style={{
                      transform: [{ scale: isSelected ? buttonScaleValue : 1 }]
                    }}
                  >
                    <TouchableOpacity
                      style={[
                        styles.optionButton,
                        isSelected && styles.optionButtonSelected,
                      ]}
                      onPress={() => handleNotificationSelect(option.id)}
                      activeOpacity={0.8}
                    >
                      {/* Air wave effects */}
                      {isSelected && (
                        <>
                          {/* Left air wave */}
                          <Animated.View
                            style={[
                              styles.airWave,
                              styles.leftAirWave,
                              {
                                opacity: leftWaveValue.interpolate({
                                  inputRange: [0, 0.5, 1],
                                  outputRange: [0, 0.3, 0],
                                }),
                                transform: [{
                                  scaleX: leftWaveValue.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0.8, 1.5],
                                  }),
                                }, {
                                  translateX: leftWaveValue.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0, -15],
                                  }),
                                }],
                              },
                            ]}
                          />

                          {/* Right air wave */}
                          <Animated.View
                            style={[
                              styles.airWave,
                              styles.rightAirWave,
                              {
                                opacity: rightWaveValue.interpolate({
                                  inputRange: [0, 0.5, 1],
                                  outputRange: [0, 0.3, 0],
                                }),
                                transform: [{
                                  scaleX: rightWaveValue.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0.8, 1.5],
                                  }),
                                }, {
                                  translateX: rightWaveValue.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0, 15],
                                  }),
                                }],
                              },
                            ]}
                          />
                        </>
                      )}

                      {/* Center-out fill background */}
                      {isSelected && (
                        <Animated.View
                          style={[
                            styles.centerFillBackground,
                            {
                              transform: [{
                                scaleX: buttonAnimValue.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [0, 1],
                                }),
                              }],
                            },
                          ]}
                        />
                      )}

                      <View style={styles.buttonContent}>
                        <Ionicons
                          name={option.icon as any}
                          size={24}
                          color={isSelected ? '#FFFFFF' : '#c3b1e1'}
                          style={styles.optionIcon}
                        />
                        <Text style={[
                          styles.optionLabel,
                          isSelected && styles.optionLabelActive
                        ]}>
                          {option.label}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
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
  optionsContainer: {
    alignSelf: 'stretch',
    gap: SPACING.md,
    flex: 1,
    justifyContent: 'center',
  },
  optionButton: {
    borderRadius: 16,
    minHeight: 56,
    borderWidth: 2,
    borderColor: '#FFE5F0',
    shadowColor: '#FF4F81',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  optionButtonSelected: {
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    borderColor: '#FF4F81',
  },
  centerFillBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FF4F81',
    borderRadius: 14,
  },
  airWave: {
    position: 'absolute',
    top: '10%',
    bottom: '10%',
    width: 30,
    backgroundColor: '#FF4F81',
    borderRadius: 15,
    zIndex: 0,
  },
  leftAirWave: {
    left: -25,
  },
  rightAirWave: {
    right: -25,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: SPACING.xl,
    zIndex: 2,
  },
  optionIcon: {
    marginRight: SPACING.md,
  },
  optionLabel: {
    fontSize: 20,
    color: '#1B1B3A',
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
  },
  optionLabelActive: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
  },
});
