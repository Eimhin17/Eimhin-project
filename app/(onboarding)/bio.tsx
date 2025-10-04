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
  TextInput,
  Animated,
  Dimensions,
  Easing
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useOnboarding, ONBOARDING_STEPS } from '../../OnboardingContext';
import { SPACING, BORDER_RADIUS } from '../../utils/constants';
import { Colors, Gradients } from '../../utils/colors';
import { ProgressBar, BackButton } from '../../components/ui';
import { Fonts } from '../../utils/fonts';
import { safeGoBack } from '../../utils/safeNavigation';
import { OnboardingService } from '../../services/onboarding';
import { ProgressiveOnboardingService } from '../../services/progressiveOnboarding';
import { attachProgressHaptics, playLightHaptic, playOnboardingProgressHaptic } from '../../utils/haptics';

export default function BioScreen() {
  const [bio, setBio] = useState('');
  const [isProgressAnimating, setIsProgressAnimating] = useState(false);
  const [focusedField, setFocusedField] = useState<'bio' | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [reachedMilestones, setReachedMilestones] = useState<Set<number>>(new Set());
  const [bioQuality, setBioQuality] = useState(0);
  const [hasReachedMax, setHasReachedMax] = useState(false);
  const { data: onboardingData, updateData, setCurrentStep } = useOnboarding();
  const TOTAL_STEPS = 5;
  const CURRENT_STEP = 4;

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
  const buttonHighlightAnim = useRef(new Animated.Value(0)).current;

  // Dopamine animations
  const confettiAnimations = useRef(
    Array.from({ length: 15 }, () => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      rotation: new Animated.Value(0),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(1),
    }))
  ).current;
  const qualityMeterAnim = useRef(new Animated.Value(0)).current;

  // Register this step for resume functionality
  useEffect(() => {
    setCurrentStep(ONBOARDING_STEPS.BIO);
  }, []);

  // Max completion celebration animations
  const maxCompletionPulse = useRef(new Animated.Value(1)).current;
  const maxCompletionGlow = useRef(new Animated.Value(0)).current;
  const maxCompletionShake = useRef(new Animated.Value(0)).current;
  const maxCompletionRainbow = useRef(new Animated.Value(0)).current;

  // ScrollView ref
  const scrollViewRef = useRef<ScrollView>(null);

  const { height: screenHeight } = Dimensions.get('window');

  // Calculate bio quality based on length, words, and variety
  const calculateBioQuality = (text: string) => {
    const length = text.length;
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    const hasEmoji = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/u.test(text);

    let quality = 0;

    // Simplified linear progression based on character count
    // 0-37 chars = 0-25%
    // 37-75 chars = 25-50%
    // 75-112 chars = 50-75%
    // 112-150 chars = 75-100%

    if (length <= 37) {
      quality = (length / 37) * 25;
    } else if (length <= 75) {
      quality = 25 + ((length - 37) / 38) * 25;
    } else if (length <= 112) {
      quality = 50 + ((length - 75) / 37) * 25;
    } else {
      quality = 75 + ((length - 112) / 38) * 25;
    }

    // Small bonuses for engagement
    if (words.length >= 8) quality += 5;  // Decent word count
    if (hasEmoji) quality += 3;           // Emoji bonus
    if (words.length >= 15) quality += 2; // Good word count

    return Math.min(Math.round(quality), 100);
  };

  // Trigger maximum completion celebration
  const triggerMaxCompletionCelebration = () => {
    if (hasReachedMax) return;
    setHasReachedMax(true);

    // Epic haptic celebration sequence
    playLightHaptic();
    setTimeout(() => playLightHaptic(), 60);
    setTimeout(() => playLightHaptic(), 120);
    setTimeout(() => playLightHaptic(), 180);
    setTimeout(() => playLightHaptic(), 220);
    setTimeout(() => playLightHaptic(), 260);
    setTimeout(() => playLightHaptic(), 320);
    setTimeout(() => playLightHaptic(), 380);

    // Trigger massive confetti burst
    setShowConfetti(true);
    confettiAnimations.forEach((confetti) => {
      confetti.x.setValue(0);
      confetti.y.setValue(0);
      confetti.rotation.setValue(0);
      confetti.opacity.setValue(0);
      confetti.scale.setValue(1);
    });

    // Even more intense confetti animation
    const maxConfettiAnimations = confettiAnimations.map((confetti, index) => {
      const randomX = (Math.random() - 0.5) * 400;
      const randomY = -200 - Math.random() * 150;
      const randomRotation = Math.random() * 1080; // More rotation
      const randomScale = 1.0 + Math.random() * 0.8; // Bigger pieces

      return Animated.parallel([
        Animated.timing(confetti.opacity, {
          toValue: 1,
          duration: 80,
          delay: index * 15,
          useNativeDriver: true,
        }),
        Animated.timing(confetti.scale, {
          toValue: randomScale,
          duration: 80,
          delay: index * 15,
          useNativeDriver: true,
        }),
        Animated.timing(confetti.x, {
          toValue: randomX,
          duration: 2000, // Longer flight
          delay: index * 15,
          useNativeDriver: true,
        }),
        Animated.timing(confetti.y, {
          toValue: randomY,
          duration: 2000,
          delay: index * 15,
          useNativeDriver: true,
        }),
        Animated.timing(confetti.rotation, {
          toValue: randomRotation,
          duration: 2000,
          delay: index * 15,
          useNativeDriver: true,
        }),
      ]);
    });

    Animated.parallel(maxConfettiAnimations).start();

    // Progress bar celebration animations
    Animated.parallel([
      // Pulsing effect
      Animated.loop(
        Animated.sequence([
          Animated.timing(maxCompletionPulse, {
            toValue: 1.1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(maxCompletionPulse, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
        { iterations: 3 }
      ),
      // Glowing effect
      Animated.timing(maxCompletionGlow, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      // Shake effect
      Animated.loop(
        Animated.sequence([
          Animated.timing(maxCompletionShake, {
            toValue: 5,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.timing(maxCompletionShake, {
            toValue: -5,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.timing(maxCompletionShake, {
            toValue: 3,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.timing(maxCompletionShake, {
            toValue: -3,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.timing(maxCompletionShake, {
            toValue: 0,
            duration: 50,
            useNativeDriver: true,
          }),
        ]),
        { iterations: 2 }
      ),
      // Rainbow color cycling
      Animated.loop(
        Animated.timing(maxCompletionRainbow, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        { iterations: 2 }
      ),
    ]).start();

    // Hide confetti after longer animation
    setTimeout(() => {
      Animated.parallel(
        confettiAnimations.map((confetti) =>
          Animated.timing(confetti.opacity, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          })
        )
      ).start(() => {
        setShowConfetti(false);
      });
    }, 3000);

    // Reset celebration animations
    setTimeout(() => {
      maxCompletionGlow.setValue(0);
      maxCompletionRainbow.setValue(0);
    }, 4000);
  };

  // Trigger confetti for character milestones with enhanced haptics
  const triggerMilestoneConfetti = (milestone: number) => {
    if (reachedMilestones.has(milestone)) return;

    setReachedMilestones(prev => new Set([...prev, milestone]));
    setShowConfetti(true);

    // Milestone-specific haptic patterns that sync with confetti burst
    if (milestone === 150) {
      // Epic celebration for 150 chars - crescendo pattern
      playLightHaptic();
      setTimeout(() => playLightHaptic(), 100);
      setTimeout(() => playLightHaptic(), 180);
      setTimeout(() => playLightHaptic(), 240);
      setTimeout(() => playLightHaptic(), 280);
      // Extra celebration burst
      setTimeout(() => playLightHaptic(), 400);
      setTimeout(() => playLightHaptic(), 450);
    } else if (milestone === 100) {
      // Strong pattern for 100 chars
      playLightHaptic();
      setTimeout(() => playLightHaptic(), 80);
      setTimeout(() => playLightHaptic(), 160);
      setTimeout(() => playLightHaptic(), 240);
      setTimeout(() => playLightHaptic(), 350);
    } else if (milestone === 50) {
      // Simple pattern for 50 chars
      playLightHaptic();
      setTimeout(() => playLightHaptic(), 120);
      setTimeout(() => playLightHaptic(), 250);
    }

    // Reset confetti animations
    confettiAnimations.forEach((confetti) => {
      confetti.x.setValue(0);
      confetti.y.setValue(0);
      confetti.rotation.setValue(0);
      confetti.opacity.setValue(0);
      confetti.scale.setValue(1);
    });

    // Animate confetti burst
    const confettiAnimationsArray = confettiAnimations.map((confetti, index) => {
      const randomX = (Math.random() - 0.5) * 300;
      const randomY = -150 - Math.random() * 100;
      const randomRotation = Math.random() * 720;
      const randomScale = 0.8 + Math.random() * 0.4;

      return Animated.parallel([
        Animated.timing(confetti.opacity, {
          toValue: 1,
          duration: 100,
          delay: index * 20,
          useNativeDriver: true,
        }),
        Animated.timing(confetti.scale, {
          toValue: randomScale,
          duration: 100,
          delay: index * 20,
          useNativeDriver: true,
        }),
        Animated.timing(confetti.x, {
          toValue: randomX,
          duration: 1500,
          delay: index * 20,
          useNativeDriver: true,
        }),
        Animated.timing(confetti.y, {
          toValue: randomY,
          duration: 1500,
          delay: index * 20,
          useNativeDriver: true,
        }),
        Animated.timing(confetti.rotation, {
          toValue: randomRotation,
          duration: 1500,
          delay: index * 20,
          useNativeDriver: true,
        }),
      ]);
    });

    Animated.parallel(confettiAnimationsArray).start();

    // Mid-flight haptics during confetti burst for extra satisfaction
    setTimeout(() => {
      // Light haptic when confetti is mid-flight
      import('expo-haptics').then((Haptics) => {
        Haptics.selectionAsync();
      });
    }, 500);

    setTimeout(() => {
      // Final gentle haptic when confetti starts to fade
      import('expo-haptics').then((Haptics) => {
        Haptics.selectionAsync();
      });
    }, 1200);

    // Hide confetti after animation
    setTimeout(() => {
      Animated.parallel(
        confettiAnimations.map((confetti) =>
          Animated.timing(confetti.opacity, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          })
        )
      ).start(() => {
        setShowConfetti(false);
      });
    }, 2000);
  };

  // Handle bio text changes
  const handleBioChange = (text: string) => {
    setBio(text);

    // Check for character milestones
    const milestones = [50, 100, 150];
    milestones.forEach(milestone => {
      if (text.length >= milestone && !reachedMilestones.has(milestone)) {
        triggerMilestoneConfetti(milestone);
      }
    });

    // Update bio quality with enhanced haptic feedback
    const previousQuality = bioQuality;
    const quality = calculateBioQuality(text);
    setBioQuality(quality);

    // Check if we've reached maximum completion (100% quality)
    if (quality >= 100 && previousQuality < 100) {
      triggerMaxCompletionCelebration();
    }

    // Enhanced haptic feedback for quality improvements
    if (quality > previousQuality && quality > 10) {
      // Major milestone haptics
      if (quality >= 85 && previousQuality < 85) {
        // Bio perfection - celebration haptic sequence
        playLightHaptic();
        setTimeout(() => playLightHaptic(), 80);
        setTimeout(() => playLightHaptic(), 160);
      } else if (quality >= 60 && previousQuality < 60) {
        // Great personality - double haptic
        playLightHaptic();
        setTimeout(() => playLightHaptic(), 100);
      } else if (quality >= 30 && previousQuality < 30) {
        // Looking good - single strong haptic
        playLightHaptic();
      }
      // Color transition haptics (more frequent)
      else if (quality >= 70 && previousQuality < 70) {
        // Green to pink transition
        playLightHaptic();
      } else if (quality >= 40 && previousQuality < 40) {
        // Orange transition
        playLightHaptic();
      } else if (quality >= 20 && previousQuality < 20) {
        // Yellow transition
        playLightHaptic();
      }
      // Micro haptics for steady progress (every 10%)
      else if (Math.floor(quality / 10) > Math.floor(previousQuality / 10)) {
        // Subtle haptic for every 10% milestone
        import('expo-haptics').then((Haptics) => {
          Haptics.selectionAsync();
        });
      }
    }

    // Animate quality meter
    Animated.timing(qualityMeterAnim, {
      toValue: quality / 100,
      duration: 300,
      useNativeDriver: false,
    }).start();

  };

  // Load existing bio if available
  useEffect(() => {
    if (onboardingData?.bio) {
      setBio(onboardingData.bio);
    }
  }, [onboardingData?.bio]);

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

  const handleInputFocus = () => {
    // Do nothing - prevent automatic scrolling behavior
  };

  const handleContinue = async () => {
    if (!bio.trim()) return;

    playLightHaptic();
    triggerButtonSweep();
    // Save bio immediately to Supabase (non-blocking on failure)
    try {
      await ProgressiveOnboardingService.updateProfile({ bio: bio.trim() });
    } catch (e) {
      console.warn('Bio save failed, continuing onboarding', e);
    }

    // Save to onboarding data
    updateData({ bio: bio.trim() });

    // Animate progress and navigate
    animateButtonPress(buttonScale, animateStepByStepProgress);
  };

  const animateStepByStepProgress = () => {
    setIsProgressAnimating(true);
    const detachHaptics = attachProgressHaptics(progressFillAnim);

    // Animate from current step progress to next step progress
    Animated.timing(progressFillAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: false,
    }).start(() => {
      detachHaptics();
      playOnboardingProgressHaptic(CURRENT_STEP, TOTAL_STEPS);

      // Navigate after smooth animation
      setTimeout(() => {
        router.push('/(onboarding)/photo-upload');
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
      safeGoBack(ONBOARDING_STEPS.BIO);
    });
  };


  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? undefined : undefined}
        keyboardVerticalOffset={0}
      >
        <>
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          scrollEnabled={false}
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
                previousStep={3}
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
            <Text style={styles.title}>Write a short bio</Text>
            <Text style={styles.subtitle}>
              Try not to be too boring
            </Text>

            {/* Bio Quality Meter */}
            {bio.length > 0 && (
              <Animated.View
                style={[
                  styles.qualityMeterContainer,
                  {
                    transform: [
                      { scale: maxCompletionPulse },
                      { translateX: maxCompletionShake }
                    ]
                  }
                ]}
              >
                <Text style={styles.qualityLabel}>
                  {bioQuality < 30 ? 'Getting started...' :
                   bioQuality < 60 ? 'Looking good!' :
                   bioQuality < 85 ? 'Great personality!' :
                   bioQuality >= 100 ? 'LEGENDARY BIO! 🚀✨' :
                   'Bio perfection! 🔥'}
                </Text>
                <Animated.View
                  style={[
                    styles.qualityMeterTrack,
                    {
                      shadowOpacity: maxCompletionGlow.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 0.8],
                      }),
                      shadowRadius: maxCompletionGlow.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 20],
                      }),
                      shadowColor: '#FF4F81',
                      shadowOffset: { width: 0, height: 0 },
                    }
                  ]}
                >
                  <Animated.View
                    style={[
                      styles.qualityMeterFill,
                      {
                        width: qualityMeterAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '100%'],
                        }),
                        backgroundColor: bioQuality >= 100 ?
                          maxCompletionRainbow.interpolate({
                            inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
                            outputRange: ['#FF4F81', '#FF6B35', '#F7931E', '#FFD23F', '#06D6A0', '#4ECDC4'],
                          }) :
                          qualityMeterAnim.interpolate({
                            inputRange: [0, 0.2, 0.4, 0.7, 1],
                            outputRange: ['#E5E7EB', '#FCD34D', '#F59E0B', '#10B981', '#FF4F81'],
                          }),
                      }
                    ]}
                  />
                </Animated.View>
              </Animated.View>
            )}

            <Animated.View style={[styles.formContainer, { opacity: formOpacity }]}>
              <View style={styles.inputGroup}>
                <TextInput
                  style={styles.bioInput}
                  value={bio}
                  onChangeText={handleBioChange}
                  onFocus={() => {
                    setFocusedField('bio');
                    handleInputFocus();
                  }}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Share something interesting about yourself..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={2}
                  maxLength={150}
                  textAlignVertical="top"
                  selectionColor="#FF4F81"
                />
                <View
                  style={[
                    styles.inputUnderline,
                    (focusedField === 'bio' || bio.trim()) && styles.inputUnderlineActive,
                  ]}
                />
                <Text style={styles.characterCount}>
                  {bio.length}/150
                </Text>
              </View>

            </Animated.View>

          </Animated.View>
        </ScrollView>

        {/* Confetti Overlay */}
        {showConfetti && (
            <View style={styles.confettiContainer} pointerEvents="none">
              {confettiAnimations.map((confetti, index) => {
                const shapes = ['rectangle', 'circle', 'triangle'];
                const colors = ['#FF4F81', '#c3b1e1']; // App pink and purple only
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
                          { scale: confetti.scale },
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
          )}

          <Animated.View style={[styles.floatingButtonContainer, { opacity: formOpacity }]}>
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity
              style={[styles.continueButton, !bio.trim() && styles.disabledButton]}
              onPress={handleContinue}
              activeOpacity={0.8}
              disabled={!bio.trim()}
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
              <Text style={[styles.continueButtonText, !bio.trim() && styles.disabledButtonText]}>
                Continue
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
        </>
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
  formContainer: {
    alignSelf: 'stretch',
  },
  inputGroup: {
    alignSelf: 'stretch',
    marginBottom: SPACING.lg,
  },
  bioInput: {
    fontSize: 20,
    color: '#1B1B3A',
    fontFamily: Fonts.semiBold,
    paddingVertical: SPACING.xs,
    minHeight: 50,
    maxHeight: 100,
    textAlignVertical: 'top',
  },
  inputUnderline: {
    height: 2,
    backgroundColor: '#E5E7EB',
    borderRadius: 1,
    marginBottom: SPACING.sm,
  },
  inputUnderlineActive: {
    backgroundColor: '#c3b1e1',
  },
  characterCount: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
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
    fontFamily: Fonts.semiBold,
    fontWeight: '600',
    fontSize: 18,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledButtonText: {
    opacity: 0.7,
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
  qualityMeterContainer: {
    alignSelf: 'stretch',
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.xs,
  },
  qualityLabel: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: SPACING.xs,
    fontFamily: Fonts.semiBold,
    fontWeight: '500',
  },
  qualityMeterTrack: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  qualityMeterFill: {
    height: '100%',
    borderRadius: 4,
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
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
});
