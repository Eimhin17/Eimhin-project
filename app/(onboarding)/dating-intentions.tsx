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
import { LinearGradient } from 'expo-linear-gradient';
import { useOnboarding, ONBOARDING_STEPS } from '../../OnboardingContext';
import { SPACING, BORDER_RADIUS } from '../../utils/constants';
import { Colors, Gradients } from '../../utils/colors';
import { ProgressBar, BackButton } from '../../components/ui';
import { Fonts } from '../../utils/fonts';
import { safeGoBack } from '../../utils/safeNavigation';
import { attachProgressHaptics, playLightHaptic, playOnboardingProgressHaptic } from '../../utils/haptics';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

export default function DatingIntentionsScreen() {
  const [selectedIntention, setSelectedIntention] = useState<string | null>(null);
  const [isProgressAnimating, setIsProgressAnimating] = useState(false);
  const { updateData, setCurrentStep } = useOnboarding();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;

  // Button press animations
  const backButtonScale = useRef(new Animated.Value(0.8)).current;
  const backButtonOpacity = useRef(new Animated.Value(0.3)).current;
  const progressFillAnim = useRef(new Animated.Value(0)).current;

  // Weight-Push Button Animation values
  const buttonAnimValue = useRef(new Animated.Value(0)).current;
  const buttonScaleValue = useRef(new Animated.Value(1)).current;
  const leftWaveValue = useRef(new Animated.Value(0)).current;
  const rightWaveValue = useRef(new Animated.Value(0)).current;

  // Register this step for resume functionality
  useEffect(() => {
    setCurrentStep(ONBOARDING_STEPS.DATING_INTENTIONS);
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

  const handleIntentionSelect = (intention: string) => {
    if (isProgressAnimating) return;

    setSelectedIntention(intention);
    animateButtonSelection();
    animateStepByStepProgress(intention);
  };

  const animateStepByStepProgress = (intention: string) => {
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
        playOnboardingProgressHaptic(17, 17);

        // Navigate after smooth animation
        setTimeout(() => {
          updateData({ datingIntentions: intention });
          router.push('/(onboarding)/mascot-phase4');
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
      safeGoBack(ONBOARDING_STEPS.DATING_INTENTIONS);
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
            <View style={styles.backButtonContainer}>
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
              <Text style={styles.headerTitle}>Dating Intentions</Text>
              <View style={styles.progressContainer}>
                <ProgressBar
                  currentStep={17}
                  totalSteps={17}
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
          <Animated.View style={[styles.content, { opacity: contentOpacity }]}>
            <View style={styles.illustrationContainer}>
              <LinearGradient
                colors={['#F8F4FF', '#FFF0F5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.illustrationGradient}
              >
                <Ionicons name="heart" size={40} color="#FF4F81" />
              </LinearGradient>
            </View>
            
              <Text style={styles.title}>What are your dating intentions?</Text>
              <Text style={styles.subtitle}>
                Be honest about what you're looking for to find compatible matches
              </Text>

            {/* Dating Intention Options */}
            <Animated.View style={[styles.optionsContainer, { opacity: formOpacity }]}>
              <Animated.View
                style={{
                  transform: [{ scale: selectedIntention === 'one_night_thing' ? buttonScaleValue : 1 }]
                }}
              >
                <TouchableOpacity
                  style={styles.optionButton}
                  onPress={() => handleIntentionSelect('one_night_thing')}
                  activeOpacity={0.7}
                >
                  {/* Air wave effects */}
                  {selectedIntention === 'one_night_thing' && (
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

                  <LinearGradient
                    colors={
                      selectedIntention === 'one_night_thing'
                        ? ['#FF4F81', '#FF4F81'] // Solid pink for active
                        : ['#FFFFFF', '#FFF0F5'] // White to light pink gradient for inactive
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.optionButtonGradient}
                  >
                    <Ionicons
                      name="moon"
                      size={24}
                      color={selectedIntention === 'one_night_thing' ? '#FFFFFF' : '#c3b1e1'}
                      style={styles.optionIcon}
                    />
                  <Text style={[
                    styles.optionLabel,
                    selectedIntention === 'one_night_thing' && styles.optionLabelActive
                  ]}>
                    One night thing
                  </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>

              <Animated.View
                style={{
                  transform: [{ scale: selectedIntention === 'short_term_only' ? buttonScaleValue : 1 }]
                }}
              >
                <TouchableOpacity
                  style={styles.optionButton}
                  onPress={() => handleIntentionSelect('short_term_only')}
                  activeOpacity={0.7}
                >
                  {/* Air wave effects */}
                  {selectedIntention === 'short_term_only' && (
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

                  <LinearGradient
                    colors={
                      selectedIntention === 'short_term_only'
                        ? ['#FF4F81', '#FF4F81'] // Solid pink for active
                        : ['#FFFFFF', '#FFF0F5'] // White to light pink gradient for inactive
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.optionButtonGradient}
                  >
                    <Ionicons
                      name="gift"
                      size={24}
                      color={selectedIntention === 'short_term_only' ? '#FFFFFF' : '#c3b1e1'}
                      style={styles.optionIcon}
                    />
                  <Text style={[
                    styles.optionLabel,
                    selectedIntention === 'short_term_only' && styles.optionLabelActive
                  ]}>
                    Short term only
                  </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>

              <Animated.View
                style={{
                  transform: [{ scale: selectedIntention === 'short_term_but_open_to_long_term' ? buttonScaleValue : 1 }]
                }}
              >
                <TouchableOpacity
                  style={styles.optionButton}
                  onPress={() => handleIntentionSelect('short_term_but_open_to_long_term')}
                  activeOpacity={0.7}
                >
                  {/* Air wave effects */}
                  {selectedIntention === 'short_term_but_open_to_long_term' && (
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
                  <LinearGradient
                    colors={selectedIntention === 'short_term_but_open_to_long_term' ? ['#FF4F81', '#FF4F81'] : ['#FFFFFF', '#FFF0F5']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.optionButtonGradient}
                  >
                    <Ionicons name="happy" size={24} color={selectedIntention === 'short_term_but_open_to_long_term' ? '#FFFFFF' : '#c3b1e1'} style={styles.optionIcon} />
                    <Text style={[styles.optionLabel, selectedIntention === 'short_term_but_open_to_long_term' && styles.optionLabelActive]}>Short term but open to long term</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>

              <Animated.View
                style={{
                  transform: [{ scale: selectedIntention === 'long_term_only' ? buttonScaleValue : 1 }]
                }}
              >
                <TouchableOpacity
                  style={styles.optionButton}
                  onPress={() => handleIntentionSelect('long_term_only')}
                  activeOpacity={0.7}
                >
                  {/* Air wave effects */}
                  {selectedIntention === 'long_term_only' && (
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
                  <LinearGradient
                    colors={selectedIntention === 'long_term_only' ? ['#FF4F81', '#FF4F81'] : ['#FFFFFF', '#FFF0F5']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.optionButtonGradient}
                  >
                    <Ionicons name="diamond" size={24} color={selectedIntention === 'long_term_only' ? '#FFFFFF' : '#c3b1e1'} style={styles.optionIcon} />
                    <Text style={[styles.optionLabel, selectedIntention === 'long_term_only' && styles.optionLabelActive]}>Long term only</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>

              <Animated.View
                style={{
                  transform: [{ scale: selectedIntention === 'long_term_but_open_to_short_term' ? buttonScaleValue : 1 }]
                }}
              >
                <TouchableOpacity
                  style={styles.optionButton}
                  onPress={() => handleIntentionSelect('long_term_but_open_to_short_term')}
                  activeOpacity={0.7}
                >
                  {/* Air wave effects */}
                  {selectedIntention === 'long_term_but_open_to_short_term' && (
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
                  <LinearGradient
                    colors={selectedIntention === 'long_term_but_open_to_short_term' ? ['#FF4F81', '#FF4F81'] : ['#FFFFFF', '#FFF0F5']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.optionButtonGradient}
                  >
                    <Ionicons name="heart" size={24} color={selectedIntention === 'long_term_but_open_to_short_term' ? '#FFFFFF' : '#c3b1e1'} style={styles.optionIcon} />
                    <Text style={[styles.optionLabel, selectedIntention === 'long_term_but_open_to_short_term' && styles.optionLabelActive]}>Long term but open to short term</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>

              <Animated.View
                style={{
                  transform: [{ scale: selectedIntention === 'friends' ? buttonScaleValue : 1 }]
                }}
              >
                <TouchableOpacity
                  style={styles.optionButton}
                  onPress={() => handleIntentionSelect('friends')}
                  activeOpacity={0.7}
                >
                  {/* Air wave effects */}
                  {selectedIntention === 'friends' && (
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
                  <LinearGradient
                    colors={selectedIntention === 'friends' ? ['#FF4F81', '#FF4F81'] : ['#FFFFFF', '#FFF0F5']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.optionButtonGradient}
                  >
                    <Ionicons name="people" size={24} color={selectedIntention === 'friends' ? '#FFFFFF' : '#c3b1e1'} style={styles.optionIcon} />
                    <Text style={[styles.optionLabel, selectedIntention === 'friends' && styles.optionLabelActive]}>Friends</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
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
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg, // Using design system token
    paddingVertical: SPACING.md,   // Using design system token
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB', // Light border color from design system
    backgroundColor: '#FFFFFF', // Primary white background from design system
    position: 'relative', // Enable absolute positioning for center content
  },
  backButtonContainer: {
    width: 72, // Even bigger container
    marginLeft: -SPACING.md, // Move further left using design system token
    zIndex: 1, // Ensure it's above other elements
  },
  headerCenter: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 0, // Behind the back button
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
    width: 72, // Same size as back button for balance
    zIndex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg, // Using design system token
    paddingTop: SPACING.lg,        // Using design system token
    paddingBottom: SPACING.lg,     // Add bottom padding for content
    // Grid-based layout structure
    display: 'flex',
    flexDirection: 'column',
  },
  illustrationContainer: {
    alignItems: 'center',
    marginBottom: SPACING.lg, // Using design system token
  },
  illustrationGradient: {
    width: 80,
    height: 80,
    borderRadius: 40, // Full radius for circle
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF4F81', // Pink shadow
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  title: {
    fontSize: 28, // Large title size
    fontWeight: '700', // Bold weight from design system
    color: '#1B1B3A', // Primary text color from design system
    textAlign: 'center',
    marginBottom: SPACING.sm, // Using design system token
    lineHeight: 36,
    letterSpacing: -0.5,
    fontFamily: Fonts.bold, // Poppins Bold from design system
  },
  subtitle: {
    fontSize: 16, // Body text size from design system
    color: '#6B7280', // Secondary text color from design system
    textAlign: 'center',
    marginBottom: 0, // Remove bottom margin
    lineHeight: 24,
    paddingHorizontal: SPACING.md, // Using design system token
    fontFamily: Fonts.regular, // Inter Regular from design system
  },
  optionsContainer: {
    width: '100%',
    gap: SPACING.md, // Using design system token
    flex: 1, // Take up remaining space
    justifyContent: 'center', // Center the buttons in the available space
    paddingVertical: SPACING['2xl'], // Equal padding top and bottom
  },
  optionButton: {
    borderRadius: 16, // Same as continue button
    minHeight: 56, // Same as continue button
    borderWidth: 2,
    borderColor: '#FFE5F0', // Light pink border from design system
    shadowColor: '#FF4F81', // Pink shadow from design system
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden', // Ensure gradient doesn't overflow
  },
  optionButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start', // Push content to the left
    paddingVertical: 18, // Same as continue button
    paddingHorizontal: SPACING.xl, // Same as continue button (32px)
    borderRadius: 14, // Slightly smaller to account for border
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
  optionIcon: {
    marginRight: SPACING.md, // Using design system token
  },
  optionLabel: {
    fontSize: 20, // Larger text size for better visibility
    color: '#1B1B3A', // Primary text color from design system
    fontWeight: '600', // SemiBold weight for more prominence
    fontFamily: Fonts.semiBold, // Poppins SemiBold from design system
  },
  optionLabelActive: {
    color: '#FFFFFF', // White text for active state
    fontWeight: '600', // SemiBold weight for prominence
    fontFamily: Fonts.semiBold, // Poppins SemiBold from design system
  },
});
