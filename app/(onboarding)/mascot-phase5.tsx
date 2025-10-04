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
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { SPACING, BORDER_RADIUS } from '../../utils/constants';
import { useOnboarding, ONBOARDING_STEPS } from '../../OnboardingContext';
import { Fonts } from '../../utils/fonts';
import { safeGoBack } from '../../utils/safeNavigation';
import { BackButton } from '../../components/ui';
import { playLightHaptic } from '../../utils/haptics';
import { Easing } from 'react-native';
// import { ConfettiCelebration } from '../../components/animations/ConfettiCelebration';
import { supabase } from '../../lib/supabase';
import { useUser } from '../../contexts/UserContext';

const { width, height } = Dimensions.get('window');

export default function MascotPhase5Screen() {
  const { setCurrentStep } = useOnboarding();
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;

  // Button press animations
  const buttonScale = useRef(new Animated.Value(1)).current;
  const buttonHighlightAnim = useRef(new Animated.Value(0)).current;
  const backButtonScale = useRef(new Animated.Value(0.8)).current;
  const backButtonOpacity = useRef(new Animated.Value(0.3)).current;

  // Animation states
  const [isFinalizing, setIsFinalizing] = useState(false);
  const { isOnboardingComplete } = useUser();

  // Removed congratulations overlay animations

  // Final onboarding step

  useEffect(() => {
    // Register this step for resume functionality
    setCurrentStep(ONBOARDING_STEPS.MASCOT_PHASE5);

    // Staggered entrance animations
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

  // Removed congratulations overlay logic

  const handleContinue = () => {
    console.log('➡️ Proceed to main app');
    playLightHaptic();
    triggerButtonSweep();
    animateButtonPress(buttonScale, async () => {
      await waitForFinalizationThenProceed();
    });
  };

  // Removed step-by-step progress animation; navigate directly after finalization

  const waitForFinalizationThenProceed = async () => {
    try {
      // If context reports completed, proceed immediately
      if (isOnboardingComplete) {
        router.push('/(tabs)');
        return;
      }

      setIsFinalizing(true);

      // Poll profile flags briefly to allow backend to finish
      const { data: userResp } = await supabase.auth.getUser();
      const userId = userResp?.user?.id;
      const maxAttempts = 8; // ~6s total with 750ms intervals
      const delayMs = 750;

      for (let i = 0; i < maxAttempts; i++) {
        if (!userId) break;
        const { data, error } = await supabase
          .from('profiles')
          .select('onboarding_completed, profile_completed')
          .eq('id', userId)
          .single();

        if (data?.onboarding_completed && data?.profile_completed) {
          break;
        }

        await new Promise((r) => setTimeout(r, delayMs));
      }
    } catch (e) {
      // Non-blocking: proceed regardless on errors/timeouts
      console.warn('⚠️ Finalization check encountered an issue, proceeding');
    } finally {
      setIsFinalizing(false);
      router.push('/(tabs)');
    }
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
      safeGoBack(ONBOARDING_STEPS.MASCOT_PHASE5);
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
            <View style={styles.topRowSpacer} />
          </Animated.View>

          {/* Full Screen Mascot */}
          <Animated.View
            style={[
              styles.fullScreenContainer,
              {
                opacity: contentOpacity,
                transform: [{ scale: contentOpacity.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.9, 1]
                })}]
              },
            ]}
          >
            <Image
              source={require('../../Images/Celebration masot.png')}
              style={styles.fullScreenImage}
              contentFit="contain"
              transition={300}
            />
          </Animated.View>
        </ScrollView>

        {/* Continue Button */}
        <Animated.View style={[styles.floatingButtonContainer, { opacity: buttonOpacity }]}>
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleContinue}
              activeOpacity={0.8}
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
              <Text style={styles.continueButtonText}>Start Matching</Text>
            </TouchableOpacity>
            {isFinalizing && (
              <View style={styles.finalizeRow}>
                <ActivityIndicator size="small" color="#FF4F81" />
                <Text style={styles.finalizeText}>Finishing account setup…</Text>
              </View>
            )}
          </Animated.View>
        </Animated.View>

        {/* Congratulations overlay removed */}
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
  topRowSpacer: {
    width: 48,
  },
  fullScreenContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xl,
    marginTop: -SPACING['2xl'],
  },
  fullScreenImage: {
    width: width * 0.9,
    height: height * 0.7,
    maxWidth: width - (SPACING.md * 2),
    maxHeight: height * 0.7,
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
  // Congratulations overlay styles removed
  finalizeRow: {
    marginTop: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  finalizeText: {
    marginLeft: 8,
    color: '#6B7280',
    fontFamily: Fonts.regular,
    fontSize: 14,
  },
});
