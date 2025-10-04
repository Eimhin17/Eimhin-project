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
  Animated
} from 'react-native';
import { router } from 'expo-router';
import { useOnboarding, ONBOARDING_STEPS } from '../../OnboardingContext';
import { ProgressBar, BackButton } from '../../components/ui';
import { SPACING } from '../../utils/constants';
import { Fonts } from '../../utils/fonts';
import { safeGoBack } from '../../utils/safeNavigation';
import { attachProgressHaptics, playLightHaptic, playOnboardingProgressHaptic } from '../../utils/haptics';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

export default function IntentionsScreen() {
  const [selectedIntent, setSelectedIntent] = useState<'Friendship' | 'Casual dating' | null>(null);
  const [isProgressAnimating, setIsProgressAnimating] = useState(false);
  const { updateData } = useOnboarding();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const optionsOpacity = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;

  // Button press animations
  const backButtonScale = useRef(new Animated.Value(0.8)).current;
  const backButtonOpacity = useRef(new Animated.Value(0.3)).current;
  const progressFillAnim = useRef(new Animated.Value(0)).current;

  // Weight-Push Button Animation values
  const buttonAnimValue = useRef(new Animated.Value(0)).current;
  const buttonScaleValue = useRef(new Animated.Value(1)).current;
  const leftWaveValue = useRef(new Animated.Value(0)).current;
  const rightWaveValue = useRef(new Animated.Value(0)).current;

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
      Animated.timing(optionsOpacity, {
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
  }, [fadeAnim, slideAnim, contentOpacity, optionsOpacity, buttonOpacity]);

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

  const handleIntentSelect = (intent: 'Friendship' | 'Casual dating') => {
    if (isProgressAnimating) return;

    setSelectedIntent(intent);
    animateButtonSelection();
    animateStepByStepProgress(intent);
  };

  const animateStepByStepProgress = (intent: 'Friendship' | 'Casual dating') => {
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
        playOnboardingProgressHaptic(9, 15);

        // Navigate after smooth animation
        setTimeout(() => {
          updateData({ intentions: intent });
          router.push('/(onboarding)/relationship-status');
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
      safeGoBack(ONBOARDING_STEPS.INTENTIONS);
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
          {/* Header */}
          <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
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
            
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>What brings you to DebsMatch?</Text>
              <View style={styles.progressContainer}>
                <ProgressBar
                  currentStep={9}
                  totalSteps={15}
                  showStepNumbers={false}
                  variant="gradient"
                  size="small"
                  fill={isProgressAnimating ? progressFillAnim : undefined}
                  isAnimating={isProgressAnimating}
                  style={styles.progressBar}
                />
              </View>
            </View>
            
            <View style={styles.headerRight} />
          </Animated.View>

          {/* Main Content */}
          <View style={styles.content}>
            <View style={styles.illustrationContainer}>
                <Text style={styles.emoji}>🎯</Text>
            </View>
            
            <Text style={styles.title}>What brings you to DebsMatch?</Text>
            <Text style={styles.subtitle}>
              Choose the option that best describes your situation
            </Text>

            {/* Intent Options */}
            <View style={styles.optionsContainer}>
              <Animated.View
                style={{
                  transform: [{ scale: selectedIntent === 'Friendship' ? buttonScaleValue : 1 }]
                }}
              >
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    selectedIntent === 'Friendship' && styles.optionButtonActive
                  ]}
                  onPress={() => handleIntentSelect('Friendship')}
                >
                  {/* Air wave effects */}
                  {selectedIntent === 'Friendship' && (
                    <>
                      <Animated.View style={[styles.airWave, styles.leftAirWave, {
                        opacity: leftWaveValue.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0.3, 0] }),
                        transform: [{ scaleX: leftWaveValue.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.5] }) }, { translateX: leftWaveValue.interpolate({ inputRange: [0, 1], outputRange: [0, -15] }) }]
                      }]} />
                      <Animated.View style={[styles.airWave, styles.rightAirWave, {
                        opacity: rightWaveValue.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0.3, 0] }),
                        transform: [{ scaleX: rightWaveValue.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.5] }) }, { translateX: rightWaveValue.interpolate({ inputRange: [0, 1], outputRange: [0, 15] }) }]
                      }]} />
                    </>
                  )}

                  {/* Center-out fill background */}
                  {selectedIntent === 'Friendship' && (
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

                  <Text style={styles.optionEmoji}>👥</Text>
                  <Text style={[
                    styles.optionLabel,
                    selectedIntent === 'Friendship' && styles.optionLabelActive
                  ]}>
                    Looking for Friends
                  </Text>
                </TouchableOpacity>
              </Animated.View>

              <Animated.View
                style={{
                  transform: [{ scale: selectedIntent === 'Casual dating' ? buttonScaleValue : 1 }]
                }}
              >
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    selectedIntent === 'Casual dating' && styles.optionButtonActive
                  ]}
                  onPress={() => handleIntentSelect('Casual dating')}
                >
                  {/* Air wave effects */}
                  {selectedIntent === 'Casual dating' && (
                    <>
                      <Animated.View style={[styles.airWave, styles.leftAirWave, {
                        opacity: leftWaveValue.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0.3, 0] }),
                        transform: [{ scaleX: leftWaveValue.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.5] }) }, { translateX: leftWaveValue.interpolate({ inputRange: [0, 1], outputRange: [0, -15] }) }]
                      }]} />
                      <Animated.View style={[styles.airWave, styles.rightAirWave, {
                        opacity: rightWaveValue.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0.3, 0] }),
                        transform: [{ scaleX: rightWaveValue.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.5] }) }, { translateX: rightWaveValue.interpolate({ inputRange: [0, 1], outputRange: [0, 15] }) }]
                      }]} />
                    </>
                  )}

                  {/* Center-out fill background */}
                  {selectedIntent === 'Casual dating' && (
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

                  <Text style={styles.optionEmoji}>💕</Text>
                  <Text style={[
                    styles.optionLabel,
                    selectedIntent === 'Casual dating' && styles.optionLabelActive
                  ]}>
                    Looking for Dates
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
              </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  backButton: {
    padding: 10,
    backgroundColor: '#FFE5F0',
    borderRadius: 20,
  },
  backButtonText: {
    fontSize: 24,
    color: '#FF4F81',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 24,
  },
  headerTitle: {
    fontSize: 22, // Slightly larger for main title
    fontWeight: '600', // SemiBold weight for prominence
    color: '#1B1B3A', // Primary text color from design system
    marginBottom: SPACING.sm,
    fontFamily: Fonts.semiBold, // Poppins SemiBold from design system
  },
  progressContainer: {
    width: '100%',
    maxWidth: 200,
    alignItems: 'center',
    marginTop: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  progressBar: {
    marginTop: 0,
    width: '100%',
  },
  headerRight: {
    width: 40,
  },
  content: {
    alignItems: 'center',
  },
  illustrationContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFE5F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#FF4F81',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  emoji: {
    fontSize: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1B1B3A',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 16,
    color: '#FF4F81',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
    fontWeight: '500',
  },
  optionsContainer: {
    width: '100%',
    gap: 16,
  },
  optionButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFE5F0',
    shadowColor: '#FF4F81',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  optionButtonActive: {
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
  optionEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  optionLabel: {
    fontSize: 18,
    color: '#1B1B3A',
    fontWeight: '500',
  },
  optionLabelActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
});
