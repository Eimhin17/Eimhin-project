import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  ScrollView, 
  Platform, 
  Animated 
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useOnboarding, ONBOARDING_STEPS } from '../../OnboardingContext';
import { SPACING, BORDER_RADIUS } from '../../utils/constants';
import { Colors, Gradients } from '../../utils/colors';
import { ProgressBar, BackButton, KeyboardButtonFooter } from '../../components/ui';
import { Fonts } from '../../utils/fonts';
import { safeGoBack } from '../../utils/safeNavigation';
import { OnboardingService } from '../../services/onboarding';
import { ProgressiveOnboardingService } from '../../services/progressiveOnboarding';
import { Ionicons } from '@expo/vector-icons';
import { INTERESTS } from '../../utils/constants';
import { attachProgressHaptics, playLightHaptic, playOnboardingProgressHaptic } from '../../utils/haptics';

// Ripple Effect Component
const RippleEffect = ({ x, y }: { x: number; y: number }) => {
  const rippleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(rippleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.ripple,
        {
          left: x - 25,
          top: y - 25,
          opacity: opacityAnim,
          transform: [
            {
              scale: rippleAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 2],
              }),
            },
          ],
        },
      ]}
    />
  );
};

export default function Interests() {
  const { updateData, setCurrentStep } = useOnboarding();
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [isProgressAnimating, setIsProgressAnimating] = useState(false);
  const [ripples, setRipples] = useState<{ id: string; x: number; y: number; interestId: string }[]>([]);
  const [showCompletionCelebration, setShowCompletionCelebration] = useState(false);
  const maxInterests = 5; // Max number of interests user can select
  const TOTAL_STEPS = 6;
  const CURRENT_STEP = 5;
  const PREVIOUS_STEP = 4;

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;

  // Button press animations
  const buttonScale = useRef(new Animated.Value(1)).current;
  const backButtonScale = useRef(new Animated.Value(0.8)).current;
  const backButtonOpacity = useRef(new Animated.Value(0.3)).current;
  const progressFillAnim = useRef(new Animated.Value(0)).current;

  // Interest button animations
  const [interestAnimations] = useState(() =>
    INTERESTS.reduce((acc, interest, index) => {
      acc[interest] = {
        scale: new Animated.Value(0),
        glow: new Animated.Value(0),
        pulse: new Animated.Value(1),
        colorWave: new Animated.Value(0),
      };
      return acc;
    }, {} as Record<string, { scale: Animated.Value; glow: Animated.Value; pulse: Animated.Value; colorWave: Animated.Value }>)
  );

  // Completion celebration animations (REDUCED from 20 to 6 to prevent memory crashes)
  const celebrationAnimations = useRef(
    Array.from({ length: 6 }, () => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      rotation: new Animated.Value(0),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(1),
    }))
  ).current;

  // Register this step for resume functionality
  useEffect(() => {
    setCurrentStep(ONBOARDING_STEPS.INTERESTS);
  }, []);

  useEffect(() => {
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
    ]);

    let staggeredAnimation: Animated.CompositeAnimation | null = null;

    entranceAnimation.start(() => {
      // Start staggered entrance for interest buttons
      const staggeredAnimations = INTERESTS.map((interest, index) =>
        Animated.timing(interestAnimations[interest].scale, {
          toValue: 1,
          duration: 500,
          delay: index * 50, // 50ms delay between each
          useNativeDriver: true,
        })
      );
      staggeredAnimation = Animated.parallel(staggeredAnimations);
      staggeredAnimation.start();
    });

    // CRITICAL: Cleanup function to prevent memory leaks
    return () => {
      entranceAnimation.stop();
      staggeredAnimation?.stop();

      // Stop all celebration animations
      celebrationAnimations.forEach(celebration => {
        celebration.x.stopAnimation();
        celebration.y.stopAnimation();
        celebration.rotation.stopAnimation();
        celebration.opacity.stopAnimation();
        celebration.scale.stopAnimation();
      });

      // Stop all interest animations
      Object.values(interestAnimations).forEach(animations => {
        animations.scale.stopAnimation();
        animations.glow.stopAnimation();
        animations.pulse.stopAnimation();
        animations.colorWave.stopAnimation();
      });

      // Reset main animation values
      fadeAnim.setValue(0);
      slideAnim.setValue(30);
      contentOpacity.setValue(0);
      formOpacity.setValue(0);
      backButtonOpacity.setValue(0.3);
      backButtonScale.setValue(0.8);
    };
  }, []);

  const toggleInterest = (interest: string, event: any) => {
    const wasSelected = selectedInterests.includes(interest);

    // Extract event values immediately to avoid synthetic event issues
    const rippleX = event?.nativeEvent?.locationX || 25;
    const rippleY = event?.nativeEvent?.locationY || 25;

    // Pulse and glow animation for button feedback
    const animations = interestAnimations[interest];
    if (!animations) {
      console.error(`❌ No animations found for interest: ${interest}`);
      return;
    }
    const pulseAnim = animations.pulse;
    const glowAnim = animations.glow;
    const colorWaveAnim = animations.colorWave;

    // Enhanced pulse animation with more bounce and haptic feedback
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.15,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 0.95,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Additional haptic feedback after animation completes
      setTimeout(() => playLightHaptic(), 50);
    });

    // Glow animation with haptic feedback
    Animated.timing(glowAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      // Haptic feedback at peak glow
      playLightHaptic();
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }).start();
    });

    // Color wave animation (pink to purple transition)
    if (!wasSelected && selectedInterests.length < maxInterests) {
      colorWaveAnim.setValue(0);
      Animated.timing(colorWaveAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: false,
      }).start();
    } else if (wasSelected) {
      // Reset color when deselecting
      colorWaveAnim.setValue(0);
    }

    // Create ripple effect only for the tapped button
    const rippleId = Date.now().toString();
    setRipples(prev => [...prev, {
      id: rippleId,
      x: rippleX,
      y: rippleY,
      interestId: interest,
    }]);

    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== rippleId));
    }, 600);

    let newSelectedInterests;
    if (wasSelected) {
      newSelectedInterests = selectedInterests.filter(i => i !== interest);
      setSelectedInterests(newSelectedInterests);
    } else if (selectedInterests.length < maxInterests) {
      newSelectedInterests = [...selectedInterests, interest];
      setSelectedInterests(newSelectedInterests);

      // Check for completion celebration and auto-navigate
      if (newSelectedInterests.length === maxInterests) {
        triggerCompletionCelebration();

        // Auto-navigate after celebration delay
        setTimeout(() => {
          handleAutoNavigation(newSelectedInterests);
        }, 1500); // Wait 1.5 seconds to let user enjoy the celebration and ensure cleanup
      }
    } else {
      alert(`You can only select up to ${maxInterests} interests.`);
      return;
    }

    playLightHaptic();
  };

  // Epic completion celebration when 5 interests are selected
  const triggerCompletionCelebration = () => {
    setShowCompletionCelebration(true);

    // Enhanced epic haptic sequence with more feedback
    playLightHaptic();
    setTimeout(() => playLightHaptic(), 50);
    setTimeout(() => playLightHaptic(), 100);
    setTimeout(() => playLightHaptic(), 150);
    setTimeout(() => playLightHaptic(), 200);
    setTimeout(() => playLightHaptic(), 300);
    setTimeout(() => playLightHaptic(), 400);
    setTimeout(() => playLightHaptic(), 500);
    setTimeout(() => playLightHaptic(), 650);
    setTimeout(() => playLightHaptic(), 800);

    // Reset celebration animations
    celebrationAnimations.forEach((particle) => {
      particle.x.setValue(0);
      particle.y.setValue(0);
      particle.rotation.setValue(0);
      particle.opacity.setValue(0);
      particle.scale.setValue(1);
    });

    // Epic particle burst animation with faster upward movement
    const particleAnimations = celebrationAnimations.map((particle, index) => {
      const randomX = (Math.random() - 0.5) * 600;
      const randomY = -500 - Math.random() * 300; // Faster and higher movement
      const randomRotation = Math.random() * 1440; // More rotation
      const randomScale = 1.2 + Math.random() * 1.8; // Larger particles

      return Animated.parallel([
        Animated.timing(particle.opacity, {
          toValue: 1,
          duration: 80,
          delay: index * 20, // Faster stagger
          useNativeDriver: true,
        }),
        Animated.timing(particle.scale, {
          toValue: randomScale,
          duration: 80,
          delay: index * 20,
          useNativeDriver: true,
        }),
        Animated.timing(particle.x, {
          toValue: randomX,
          duration: 1800, // Faster horizontal movement
          delay: index * 20,
          useNativeDriver: true,
        }),
        Animated.timing(particle.y, {
          toValue: randomY,
          duration: 1500, // Much faster upward movement
          delay: index * 20,
          useNativeDriver: true,
        }),
        Animated.timing(particle.rotation, {
          toValue: randomRotation,
          duration: 1800, // Faster rotation
          delay: index * 20,
          useNativeDriver: true,
        }),
      ]);
    });

    Animated.parallel(particleAnimations).start();

    // Additional haptic feedback during confetti animation
    setTimeout(() => playLightHaptic(), 200);
    setTimeout(() => playLightHaptic(), 400);
    setTimeout(() => playLightHaptic(), 600);
    setTimeout(() => playLightHaptic(), 900);
    setTimeout(() => playLightHaptic(), 1200);

    // Hide celebration after animation (faster cleanup)
    setTimeout(() => {
      Animated.parallel(
        celebrationAnimations.map((particle) =>
          Animated.timing(particle.opacity, {
            toValue: 0,
            duration: 300, // Faster fade out
            useNativeDriver: true,
          })
        )
      ).start(() => {
        setShowCompletionCelebration(false);
      });
    }, 1200); // Start fade out sooner
  };

  // Auto-navigation when 5 interests are selected
  const handleAutoNavigation = async (selectedInterests: string[]) => {
    try {
      // Save immediately to Supabase
      try {
        await ProgressiveOnboardingService.updateProfile({ interests: selectedInterests });
        console.log('✅ Interests saved to database:', selectedInterests.length);
      } catch (e) {
        console.warn('Interests save failed, continuing onboarding', e);
      }

      // Still store locally for continuity
      OnboardingService.storeTempData('interests', selectedInterests);
      console.log('💾 Interests stored temporarily:', selectedInterests);

      // Update context data
      updateData({
        interests: selectedInterests,
      });

      // Navigate to next page with smooth transition
      animateStepByStepProgress();
    } catch (error) {
      console.error('❌ Error handling interests:', error);
      // Still continue with onboarding even if there's an error
      animateStepByStepProgress();
    }
  };

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

      // Navigate after smooth animation
      setTimeout(() => {
        // Save selected interests to context
        updateData({
          interests: selectedInterests,
        });
        router.push('/(onboarding)/profile-prompts');
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
      safeGoBack(ONBOARDING_STEPS.INTERESTS);
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
          {/* Header with new design system layout */}
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
            <Text style={styles.title}>Interests?</Text>
            <Text style={styles.subtitle}>
              Choose 5, or else.
            </Text>


            {/* Interests Grid */}
            <Animated.View style={[styles.interestsGrid, { opacity: formOpacity }]}>
              {INTERESTS.map((interest) => (
                <Animated.View
                  key={interest}
                  style={[
                    styles.interestItemWrapper,
                    {
                      transform: [{ scale: interestAnimations[interest].scale }],
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      styles.interestItem,
                      selectedInterests.includes(interest) && styles.interestItemSelected,
                    ]}
                    onPress={(event) => toggleInterest(interest, event)}
                    activeOpacity={0.7}
                  >
                    {/* Color Wave Background */}
                    <Animated.View
                      style={[
                        styles.colorWaveBackground,
                        {
                          backgroundColor: interestAnimations[interest].colorWave.interpolate({
                            inputRange: [0, 0.5, 1],
                            outputRange: ['#F8F9FA', '#c3b1e1', '#FF4F81'],
                          }),
                          opacity: selectedInterests.includes(interest) ? 1 : 0,
                        },
                      ]}
                    />

                    {/* Pulse and Glow Effect */}
                    <Animated.View
                      style={[
                        styles.interestItemContent,
                        {
                          transform: [{ scale: interestAnimations[interest].pulse }],
                        },
                      ]}
                    >
                      {/* Glow Effect */}
                      <Animated.View
                        style={[
                          styles.glowEffect,
                          {
                            opacity: interestAnimations[interest].glow,
                          },
                        ]}
                      />

                      {/* Ripple Effects - Only show ripples for this specific button */}
                      {ripples
                        .filter(ripple => ripples.indexOf(ripple) < 3) // Limit concurrent ripples
                        .filter(ripple => ripple.interestId === interest) // Only show ripples for this button
                        .map((ripple) => (
                          <RippleEffect
                            key={ripple.id}
                            x={ripple.x}
                            y={ripple.y}
                          />
                        ))}

                      <Text
                        style={[
                          styles.interestText,
                          selectedInterests.includes(interest) && styles.interestTextSelected,
                        ]}
                      >
                        {interest}
                      </Text>
                    </Animated.View>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </Animated.View>
          </Animated.View>
        </ScrollView>

        {/* Epic Completion Celebration */}
        {showCompletionCelebration && (
          <View style={styles.celebrationContainer} pointerEvents="none">
            {celebrationAnimations.map((particle, index) => {
              const shapes = ['rectangle', 'circle', 'triangle'];
              const colors = ['#FF4F81', '#c3b1e1']; // App pink and purple only
              const shape = shapes[index % 3];
              const color = colors[index % 2];

              return (
                <Animated.View
                  key={index}
                  style={[
                    styles.celebrationParticle,
                    {
                      opacity: particle.opacity,
                      transform: [
                        { translateX: particle.x },
                        { translateY: particle.y },
                        { scale: particle.scale },
                        {
                          rotate: particle.rotation.interpolate({
                            inputRange: [0, 360],
                            outputRange: ['0deg', '360deg'],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.celebrationBit,
                      shape === 'rectangle' && [styles.celebrationRectangle, { backgroundColor: color }],
                      shape === 'circle' && [styles.celebrationCircle, { backgroundColor: color }],
                      shape === 'triangle' && [styles.celebrationTriangle, { borderBottomColor: color }],
                    ]}
                  />
                </Animated.View>
              );
            })}
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
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    gap: 0,
  },
  interestItemWrapper: {
    width: '31%',
    marginBottom: SPACING.sm,
  },
  interestItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    minHeight: 38,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  interestItemContent: {
    width: '100%',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  interestItemSelected: {
    borderColor: '#c3b1e1',
    shadowColor: '#c3b1e1',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  colorWaveBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
  },
  interestText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
    textAlign: 'center',
    fontFamily: Fonts.medium,
    letterSpacing: 0.1,
  },
  interestTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
  },
  // Animation Styles
  glowEffect: {
    position: 'absolute',
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderRadius: 25,
    backgroundColor: '#FF4F81',
    shadowColor: '#FF4F81',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  ripple: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF4F81',
  },
  celebrationContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  celebrationParticle: {
    position: 'absolute',
  },
  celebrationBit: {
    width: 10,
    height: 10,
  },
  celebrationRectangle: {
    width: 15,
    height: 8,
    borderRadius: 2,
  },
  celebrationCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  celebrationTriangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
});
