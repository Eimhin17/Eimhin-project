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
  Alert,
  Easing,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useOnboarding, ONBOARDING_STEPS } from '../../OnboardingContext';
import { SPACING } from '../../utils/constants';
import { safeGoBack } from '../../utils/safeNavigation';
import { ProgressiveOnboardingService } from '../../services/progressiveOnboarding';
import { ProgressBar, BackButton } from '../../components/ui';
import { Fonts } from '../../utils/fonts';
import { LinearGradient } from 'expo-linear-gradient';
import { attachProgressHaptics, playLightHaptic, playOnboardingProgressHaptic, playCardSelectionHaptic } from '../../utils/haptics';

// Create animated TouchableOpacity component
const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function DateOfBirthScreen() {
  const { data, updateData, setCurrentStep } = useOnboarding();

  const existingDate = data.dateOfBirth ? new Date(data.dateOfBirth) : null;
  const [dayValue, setDayValue] = useState(existingDate ? existingDate.getDate().toString().padStart(2, '0') : '');
  const [monthValue, setMonthValue] = useState(existingDate ? (existingDate.getMonth() + 1).toString().padStart(2, '0') : '');
  const [yearValue, setYearValue] = useState(existingDate ? existingDate.getFullYear().toString() : '');
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(existingDate);
  const [calculatedAge, setCalculatedAge] = useState<number | null>(null);
  const [showAgeModal, setShowAgeModal] = useState(false);
  const [focusedField, setFocusedField] = useState<'day' | 'month' | 'year' | null>(null);
  const [isProgressAnimating, setIsProgressAnimating] = useState(false);

  const TOTAL_STEPS = 5;
  const CURRENT_STEP = 2;
  const PREVIOUS_STEP = 1;

  // Digit pulse animations for each field
  const dayDigitPulseAnimations = useRef(Array.from({ length: 2 }, () => new Animated.Value(0))).current;
  const monthDigitPulseAnimations = useRef(Array.from({ length: 2 }, () => new Animated.Value(0))).current;
  const yearDigitPulseAnimations = useRef(Array.from({ length: 4 }, () => new Animated.Value(0))).current;


  // Input refs for auto-navigation
  const dayInputRef = useRef<TextInput>(null);
  const monthInputRef = useRef<TextInput>(null);
  const yearInputRef = useRef<TextInput>(null);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const progressFillAnim = useRef(new Animated.Value(0)).current;
  const buttonHighlightAnim = useRef(new Animated.Value(0)).current;

  // Button press animations
  const buttonScale = useRef(new Animated.Value(1)).current;
  const backButtonScale = useRef(new Animated.Value(0.8)).current;
  const backButtonOpacity = useRef(new Animated.Value(0.3)).current;
  
  // Register this step for resume functionality
  useEffect(() => {
    setCurrentStep(ONBOARDING_STEPS.DATE_OF_BIRTH);
  }, []);

  // Age modal animations
  const modalBackdropOpacity = useRef(new Animated.Value(0)).current;
  const modalScale = useRef(new Animated.Value(0.3)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const iconBounce = useRef(new Animated.Value(0)).current;
  const titleSlide = useRef(new Animated.Value(30)).current;
  const messageSlide = useRef(new Animated.Value(30)).current;
  const buttonsSlide = useRef(new Animated.Value(30)).current;
  const modalButtonScale1 = useRef(new Animated.Value(1)).current;
  const modalButtonScale2 = useRef(new Animated.Value(1)).current;

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
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, contentOpacity, formOpacity, buttonOpacity]);

  useEffect(() => {
    if (!dayValue || !monthValue || !yearValue) {
      setDateOfBirth(null);
      setCalculatedAge(null);
      return;
    }

    const day = parseInt(dayValue, 10);
    const month = parseInt(monthValue, 10) - 1;
    const year = parseInt(yearValue, 10);

    const candidateDate = new Date(year, month, day);

    // Validate the date thoroughly
    const today = new Date();
    const currentYear = today.getFullYear();

    if (
      Number.isNaN(day) ||
      Number.isNaN(month) ||
      Number.isNaN(year) ||
      month < 0 ||
      month > 11 ||
      day < 1 ||
      day > 31 ||
      year < 1900 ||
      year > currentYear ||
      candidateDate.getFullYear() !== year ||
      candidateDate.getMonth() !== month ||
      candidateDate.getDate() !== day // This catches invalid days like Feb 30th
    ) {
      setDateOfBirth(null);
      setCalculatedAge(null);
      return;
    }

    // Check if date is in the future
    if (candidateDate > today) {
      setDateOfBirth(null);
      setCalculatedAge(null);
      return;
    }

    setDateOfBirth(candidateDate);

    let age = today.getFullYear() - candidateDate.getFullYear();
    const monthDiff = today.getMonth() - candidateDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < candidateDate.getDate())) {
      age -= 1;
    }

    setCalculatedAge(age);
  }, [dayValue, monthValue, yearValue]);

  // Digit pulse animation functions (similar to email code verification)
  const triggerDigitPulse = (field: 'day' | 'month' | 'year', digitIndex: number) => {
    const pulseAnimations = field === 'day' ? dayDigitPulseAnimations :
                           field === 'month' ? monthDigitPulseAnimations : yearDigitPulseAnimations;

    const pulseAnim = pulseAnimations[digitIndex];

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
  };


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

  const handleDateValueChange = (field: 'day' | 'month' | 'year', value: string) => {
    const numericValue = value.replace(/\D/g, '');
    const previousValue = field === 'day' ? dayValue : field === 'month' ? monthValue : yearValue;

    // Handle backspace navigation to previous field
    if (numericValue.length === 0 && previousValue.length > 0) {
      // User is backspacing and clearing the field
      if (field === 'month' && dayValue.length > 0) {
        // Jump to day field and focus it
        setTimeout(() => dayInputRef.current?.focus(), 50);
      } else if (field === 'year' && monthValue.length > 0) {
        // Jump to month field and focus it
        setTimeout(() => monthInputRef.current?.focus(), 50);
      }
    }

    // Validate input based on field type
    let validatedValue = numericValue;

    if (field === 'day') {
      // Limit day to 1-31
      const dayNum = parseInt(validatedValue, 10);
      if (validatedValue.length === 2 && (dayNum < 1 || dayNum > 31)) {
        return; // Don't update if invalid
      }
      if (validatedValue.length === 1 && parseInt(validatedValue, 10) > 3) {
        return; // Don't allow first digit > 3
      }
      setDayValue(validatedValue);
    } else if (field === 'month') {
      // Limit month to 1-12
      const monthNum = parseInt(validatedValue, 10);
      if (validatedValue.length === 2 && (monthNum < 1 || monthNum > 12)) {
        return; // Don't update if invalid
      }
      if (validatedValue.length === 1 && parseInt(validatedValue, 10) > 1) {
        return; // Don't allow first digit > 1
      }
      setMonthValue(validatedValue);
    } else {
      // Limit year to reasonable range (1900-current year)
      const currentYear = new Date().getFullYear();
      if (validatedValue.length === 4) {
        const yearNum = parseInt(validatedValue, 10);
        if (yearNum < 1900 || yearNum > currentYear) {
          return; // Don't update if invalid
        }
      }
      if (validatedValue.length === 1 && parseInt(validatedValue, 10) < 1) {
        return; // Don't allow first digit < 1
      }
      if (validatedValue.length === 2) {
        const partial = parseInt(validatedValue, 10);
        if (partial < 19) {
          return; // Only allow years starting with 19 or 20
        }
      }
      setYearValue(validatedValue);
    }

    // Trigger pulse animation for the digit that was just added
    if (numericValue.length > previousValue.length) {
      const digitIndex = numericValue.length - 1;
      triggerDigitPulse(field, digitIndex);
    }

    // Add haptic feedback for progress milestones
    if (field === 'day' || field === 'month') {
      // Add haptic feedback for progress milestone
      if (numericValue.length === 1) {
        playLightHaptic();
      }

      // Auto-navigate when field is complete
      if (numericValue.length === 2) {
        if (field === 'day') {
          monthInputRef.current?.focus();
        } else if (field === 'month') {
          yearInputRef.current?.focus();
        }
      }
    } else if (field === 'year') {
      // Add haptic feedback for progress milestone
      if (numericValue.length === 1 || numericValue.length === 2) {
        playLightHaptic();
      }

      // Dismiss keyboard when year is complete
      if (numericValue.length === 4) {
        yearInputRef.current?.blur();
      }
    }
  };

  // Function to get border color based on input progress
  const getBorderColor = (field: 'day' | 'month' | 'year', value: string) => {
    if (!value) return '#E5E7EB'; // Default gray

    if (field === 'day' || field === 'month') {
      // 50% completion (purple) for 1 digit, stays purple for 2 digits
      return value.length >= 1 ? '#c3b1e1' : '#E5E7EB';
    } else if (field === 'year') {
      // Purple for any digits in year field
      return value.length >= 1 ? '#c3b1e1' : '#E5E7EB';
    }

    return '#E5E7EB';
  };

  // Component to render digit highlights (similar to email code verification)
  const DigitHighlights = ({ field, value }: { field: 'day' | 'month' | 'year'; value: string }) => {
    const pulseAnimations = field === 'day' ? dayDigitPulseAnimations :
                           field === 'month' ? monthDigitPulseAnimations : yearDigitPulseAnimations;

    return (
      <>
        {value.split('').map((_, index) => (
          <Animated.View
            key={`${field}-highlight-${index}`}
            pointerEvents="none"
            style={[
              styles.digitHighlight,
              {
                opacity: pulseAnimations[index].interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 1],
                }),
              },
            ]}
          />
        ))}
      </>
    );
  };

  const animateModalEntrance = () => {
    // Reset all animation values
    modalBackdropOpacity.setValue(0);
    modalScale.setValue(0.3);
    modalOpacity.setValue(0);
    iconBounce.setValue(0);
    titleSlide.setValue(30);
    messageSlide.setValue(30);
    buttonsSlide.setValue(30);

    // Staggered entrance animation with haptics
    Animated.sequence([
      // Backdrop fade in
      Animated.timing(modalBackdropOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      // Modal scale and fade in
      Animated.parallel([
        Animated.spring(modalScale, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(modalOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      // Icon bounce with haptic
      Animated.spring(iconBounce, {
        toValue: 1,
        tension: 120,
        friction: 6,
        useNativeDriver: true,
      }),
      // Staggered text animations
      Animated.stagger(100, [
        Animated.spring(titleSlide, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(messageSlide, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(buttonsSlide, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      // Final haptic when all animations complete
      playLightHaptic();
    });

    // Add haptics at key moments
    setTimeout(() => playLightHaptic(), 200); // Modal appearance
    setTimeout(() => playCardSelectionHaptic(), 500); // Icon bounce
  };

  const animateModalExit = (callback: () => void) => {
    // Haptic feedback for modal dismissal
    playLightHaptic();

    Animated.parallel([
      Animated.timing(modalBackdropOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(modalScale, {
        toValue: 0.8,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Final completion haptic
      playLightHaptic();
      callback();
    });
  };

  const openAgeModal = () => {
    if (!dateOfBirth || calculatedAge === null) {
      Alert.alert('Invalid date', 'Please enter a valid date of birth.');
      return;
    }

    setShowAgeModal(true);
    // Add slight delay to ensure modal is rendered before animating
    setTimeout(() => {
      animateModalEntrance();
      playLightHaptic(); // Haptic feedback for modal appearance
    }, 50);
  };

  const animateProgressAndContinue = () => {
    if (isProgressAnimating) {
      return;
    }

    if (!dateOfBirth) {
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
      // Save immediately to Supabase, then continue
      (async () => {
        try {
          if (dateOfBirth) {
            const dobStr = dateOfBirth.toISOString().split('T')[0];
            await ProgressiveOnboardingService.updateProfile({
              date_of_birth: dobStr,
            });
          }
        } catch (e) {
          // Non-blocking: continue even if save fails
          console.warn('DOB save failed, continuing onboarding', e);
        }

        updateData({
          dateOfBirth,
        });

        router.push('/(onboarding)/gender-selection');
      })();
    });
  };

  const handleContinue = () => {
    if (!dayValue || !monthValue || !yearValue) {
      Alert.alert('Almost there', 'Please enter your full date of birth.');
      return;
    }

    playLightHaptic();
    triggerButtonSweep();
    animateButtonPress(buttonScale, openAgeModal);
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
      safeGoBack(ONBOARDING_STEPS.DATE_OF_BIRTH);
    });
  };

  const animateModalButtonPress = (animValue: Animated.Value, callback: () => void) => {
    // Immediate haptic feedback on press
    playCardSelectionHaptic();

    Animated.sequence([
      Animated.timing(animValue, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(animValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Additional light haptic for completion
      playLightHaptic();
      callback();
    });
  };

  const handleAgeModalCancel = () => {
    animateModalExit(() => {
      setShowAgeModal(false);
    });
  };

  const handleAgeModalConfirm = () => {
    animateModalExit(() => {
      setShowAgeModal(false);
      animateProgressAndContinue();
    });
  };

  const isFormValid = Boolean(dayValue) && Boolean(monthValue) && Boolean(yearValue) && Boolean(dateOfBirth);

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
            <Text style={styles.title}>What's you're DOB?</Text>
            <Text style={styles.subtitle}>
              Remember, no one likes a liar...
            </Text>

            <Animated.View style={[styles.formContainer, { opacity: formOpacity }]}>
              <View style={styles.dateRow}>
                <View style={styles.dateFieldWrapper}>
                  <Animated.View style={[
                    styles.digitContainer,
                    {
                      transform: [{
                        scale: dayDigitPulseAnimations[0].interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.08],
                        }),
                      }],
                      borderBottomColor: getBorderColor('day', dayValue),
                    },
                  ]}>
                    <DigitHighlights field="day" value={dayValue} />
                    <TextInput
                      ref={dayInputRef}
                      style={styles.dateField}
                      value={dayValue}
                      onChangeText={(text) => handleDateValueChange('day', text)}
                      onKeyPress={({ nativeEvent }) => {
                        if (nativeEvent.key === 'Backspace' && dayValue.length === 0) {
                          // Already at first field, nothing to navigate to
                        }
                      }}
                      onFocus={() => setFocusedField('day')}
                      onBlur={() => setFocusedField((prev) => (prev === 'day' ? null : prev))}
                      keyboardType="numeric"
                      maxLength={2}
                      placeholder="DD"
                      placeholderTextColor="#9CA3AF"
                      selectionColor="#FF4F81"
                    />
                  </Animated.View>
                </View>

                <Text style={styles.separator}>/</Text>

                <View style={styles.dateFieldWrapper}>
                  <Animated.View style={[
                    styles.digitContainer,
                    {
                      transform: [{
                        scale: monthDigitPulseAnimations[0].interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.08],
                        }),
                      }],
                      borderBottomColor: getBorderColor('month', monthValue),
                    },
                  ]}>
                    <DigitHighlights field="month" value={monthValue} />
                    <TextInput
                      ref={monthInputRef}
                      style={styles.dateField}
                      value={monthValue}
                      onChangeText={(text) => handleDateValueChange('month', text)}
                      onKeyPress={({ nativeEvent }) => {
                        if (nativeEvent.key === 'Backspace' && monthValue.length === 0) {
                          // Navigate to day field
                          dayInputRef.current?.focus();
                        }
                      }}
                      onFocus={() => setFocusedField('month')}
                      onBlur={() => setFocusedField((prev) => (prev === 'month' ? null : prev))}
                      keyboardType="numeric"
                      maxLength={2}
                      placeholder="MM"
                      placeholderTextColor="#9CA3AF"
                      selectionColor="#FF4F81"
                    />
                  </Animated.View>
                </View>

                <Text style={styles.separator}>/</Text>

                <View style={styles.dateFieldWrapper}>
                  <Animated.View style={[
                    styles.digitContainer,
                    {
                      transform: [{
                        scale: yearDigitPulseAnimations[0].interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.08],
                        }),
                      }],
                      borderBottomColor: getBorderColor('year', yearValue),
                    },
                  ]}>
                    <DigitHighlights field="year" value={yearValue} />
                    <TextInput
                      ref={yearInputRef}
                      style={styles.dateField}
                      value={yearValue}
                      onChangeText={(text) => handleDateValueChange('year', text)}
                      onKeyPress={({ nativeEvent }) => {
                        if (nativeEvent.key === 'Backspace' && yearValue.length === 0) {
                          // Navigate to month field
                          monthInputRef.current?.focus();
                        }
                      }}
                      onFocus={() => setFocusedField('year')}
                      onBlur={() => setFocusedField((prev) => (prev === 'year' ? null : prev))}
                      keyboardType="numeric"
                      maxLength={4}
                      placeholder="YYYY"
                      placeholderTextColor="#9CA3AF"
                      selectionColor="#FF4F81"
                    />
                  </Animated.View>
                </View>
              </View>

            </Animated.View>
          </Animated.View>
        </ScrollView>

        <Animated.View style={[styles.floatingButtonContainer, { opacity: buttonOpacity }]}>
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity
              style={[styles.continueButton, !isFormValid && styles.disabledButton]}
              onPress={handleContinue}
              activeOpacity={0.8}
              disabled={!isFormValid}
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
              <Text style={[styles.continueButtonText, !isFormValid && styles.disabledButtonText]}>
                Continue
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </KeyboardAvoidingView>

      {showAgeModal && (
        <Animated.View style={[
          styles.ageModal,
          {
            opacity: modalBackdropOpacity,
          },
        ]}>
          <Animated.View style={[
            styles.ageModalContent,
            {
              opacity: modalOpacity,
              transform: [
                { scale: modalScale },
              ],
            },
          ]}>
            <Animated.View style={[
              styles.ageModalIcon,
              {
                transform: [
                  {
                    scale: iconBounce.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0.3, 1.1, 1],
                    }),
                  },
                  {
                    rotate: iconBounce.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: ['0deg', '5deg', '0deg'],
                    }),
                  },
                ],
              },
            ]}>
              <Ionicons
                name={calculatedAge !== null && calculatedAge < 18 ? 'warning' : 'information-circle'}
                size={48}
                color={calculatedAge !== null && calculatedAge < 18 ? '#EF4444' : '#c3b1e1'}
              />
            </Animated.View>

            <Animated.Text style={[
              styles.ageModalTitle,
              {
                opacity: titleSlide.interpolate({
                  inputRange: [0, 30],
                  outputRange: [1, 0],
                }),
                transform: [
                  {
                    translateY: titleSlide,
                  },
                ],
              },
            ]}>
              {calculatedAge !== null && calculatedAge < 18 ? 'Age Requirement' : 'Confirm Your Age'}
            </Animated.Text>

            <Animated.Text style={[
              styles.ageModalMessage,
              {
                opacity: messageSlide.interpolate({
                  inputRange: [0, 30],
                  outputRange: [1, 0],
                }),
                transform: [
                  {
                    translateY: messageSlide,
                  },
                ],
              },
            ]}>
              {calculatedAge !== null && calculatedAge < 18
                ? 'Sorry, you are too young to use this app. You must be at least 18 years old to create an account on DebsMatch.'
                : `Are you sure you are ${calculatedAge} years old? This information cannot be changed later.`}
            </Animated.Text>

            <Animated.View style={[
              styles.ageModalButtons,
              {
                opacity: buttonsSlide.interpolate({
                  inputRange: [0, 30],
                  outputRange: [1, 0],
                }),
                transform: [
                  {
                    translateY: buttonsSlide,
                  },
                ],
              },
            ]}>
              {calculatedAge !== null && calculatedAge < 18 ? (
                <AnimatedTouchableOpacity
                  style={[styles.ageModalButton, styles.ageModalButtonPrimary, {
                    transform: [{ scale: modalButtonScale1 }]
                  }]}
                  onPress={() => animateModalButtonPress(modalButtonScale1, handleAgeModalCancel)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.ageModalButtonText, styles.ageModalButtonTextPrimary]}>OK</Text>
                </AnimatedTouchableOpacity>
              ) : (
                <>
                  <AnimatedTouchableOpacity
                    style={[styles.ageModalButton, {
                      transform: [{ scale: modalButtonScale1 }]
                    }]}
                    onPress={() => animateModalButtonPress(modalButtonScale1, handleAgeModalCancel)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.ageModalButtonText}>Cancel</Text>
                  </AnimatedTouchableOpacity>
                  <AnimatedTouchableOpacity
                    style={[styles.ageModalButton, styles.ageModalButtonPrimary, {
                      transform: [{ scale: modalButtonScale2 }]
                    }]}
                    onPress={() => animateModalButtonPress(modalButtonScale2, handleAgeModalConfirm)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.ageModalButtonText, styles.ageModalButtonTextPrimary]}>Yes</Text>
                  </AnimatedTouchableOpacity>
                </>
              )}
            </Animated.View>
          </Animated.View>
        </Animated.View>
      )}
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
    gap: SPACING.lg,
  },
  inputLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: Fonts.semiBold,
    marginBottom: SPACING.sm,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  dateFieldWrapper: {
    flex: 1,
  },
  dateField: {
    width: '100%',
    height: '100%',
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '600',
    color: '#1B1B3A',
    backgroundColor: 'transparent',
    fontFamily: Fonts.semiBold,
  },
  separator: {
    fontSize: 20,
    color: '#6B7280',
    fontFamily: Fonts.semiBold,
    paddingHorizontal: SPACING.xs,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: '#FFE5F0',
    borderWidth: 1,
    borderColor: '#FFB6C1',
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
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
  ageModal: {
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
  ageModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: SPACING.xl,
    width: '85%',
    maxWidth: 400,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 10,
    alignItems: 'center',
  },
  ageModalIcon: {
    marginBottom: SPACING.lg,
  },
  ageModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1B1B3A',
    textAlign: 'center',
    marginBottom: SPACING.md,
    fontFamily: Fonts.bold,
  },
  ageModalMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.xl,
    fontFamily: Fonts.regular,
  },
  ageModalButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
    width: '100%',
  },
  ageModalButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  ageModalButtonPrimary: {
    backgroundColor: '#FF4F81',
    borderColor: '#FF4F81',
  },
  ageModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: Fonts.semiBold,
  },
  ageModalButtonTextPrimary: {
    color: '#FFFFFF',
  },
  digitContainer: {
    height: 62,
    borderBottomWidth: 3,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    position: 'relative',
  },
  digitHighlight: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(195, 177, 225, 0.18)',
    borderRadius: 8,
  },
});
