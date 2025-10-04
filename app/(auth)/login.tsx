import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform,
  TextInput,
  Animated,
  Easing,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { SPACING } from '../../utils/constants';
import { BackButton } from '../../components/ui';
import { Fonts } from '../../utils/fonts';
import { playLightHaptic } from '../../utils/haptics';
import { ResumeOnboardingModal } from '../../components/ResumeOnboardingModal';
import { ProgressiveOnboardingService } from '../../services/progressiveOnboarding';
import { supabase } from '../../lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeField, setActiveField] = useState<'email' | 'password' | null>(null);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [incompleteProfileData, setIncompleteProfileData] = useState<any>(null);
  const { signIn } = useAuth();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const backButtonScale = useRef(new Animated.Value(0.8)).current;
  const backButtonOpacity = useRef(new Animated.Value(0.3)).current;
  const buttonHighlightAnim = useRef(new Animated.Value(0)).current;
  const emailFillAnim = useRef(new Animated.Value(0)).current;
  const passwordFillAnim = useRef(new Animated.Value(0)).current;
  const swipeTranslateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Staggered entrance animations
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
    const target = email.length > 0 ? Math.min(email.length / 20, 1) : 0;
    Animated.timing(emailFillAnim, {
      toValue: target,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [email]);

  useEffect(() => {
    const target = password.length > 0 ? Math.min(password.length / 12, 1) : 0;
    Animated.timing(passwordFillAnim, {
      toValue: target,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [password]);

  // Debug password state changes
  useEffect(() => {
    console.log('🔐 Password state changed - Type:', typeof password, 'Length:', password?.length, 'Value:', password);
  }, [password]);

  const handlePasswordChange = (text: string) => {
    console.log('🔐 Password input changed - Type:', typeof text, 'Length:', text?.length, 'Value:', text);
    setPassword(text);
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

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    // Add haptic feedback and button animation
    playLightHaptic();
    triggerButtonSweep();
    animateButtonPress(buttonScale);

    setIsLoading(true);
    try {
      console.log('🚀 Login attempt for:', email.trim());

      // FIRST: Check if this email has an incomplete profile (before attempting login)
      // This prevents "invalid credentials" errors for incomplete accounts
      const { data: existingProfile, error: profileCheckError } = await supabase
        .from('profiles')
        .select('id, profile_completed, onboarding_completed, onboarding_step, email')
        .eq('email', email.trim().toLowerCase())
        .maybeSingle();

      // If profile exists and is incomplete, show resume modal immediately
      if (existingProfile && !existingProfile.profile_completed) {
        console.log('⚠️ Found incomplete profile for this email, showing resume modal');
        setIncompleteProfileData(existingProfile);
        setShowResumeModal(true);
        setIsLoading(false);
        return;
      }

      // If profile doesn't exist or is complete, proceed with normal login
      console.log('🔐 Attempting authentication...');
      const result = await signIn(email.trim(), password);

      if (result.success) {
        console.log('✅ Login successful, checking profile completion status...');

        // Check if profile is completed (double-check for safety)
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
          Alert.alert('Error', 'Failed to verify account. Please try again.');
          setIsLoading(false);
          return;
        }

        // Fetch profile to check completion status
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('profile_completed, onboarding_completed, onboarding_step')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('❌ Error fetching profile:', profileError);
          Alert.alert('Error', 'Failed to load profile. Please try again.');
          setIsLoading(false);
          return;
        }

        // Check if profile is incomplete (shouldn't happen due to earlier check, but just in case)
        if (!profile.profile_completed) {
          console.log('⚠️ Profile is incomplete, showing resume modal');
          setIncompleteProfileData(profile);
          setShowResumeModal(true);
          setIsLoading(false);
          return;
        }

        // Profile is complete, proceed to main app
        console.log('✅ Profile is complete, redirecting to main app');
        router.push('/(tabs)');
      } else {
        console.error('❌ Login failed:', result.error);

        // Show clear error messages
        let errorMessage = 'Login failed. Please try again.';
        if (result.error?.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password. Please check your credentials and try again.';
        } else if (result.error?.includes('User not found')) {
          errorMessage = 'No account found with this email. Please complete onboarding first.';
        } else if (result.error?.includes('Email not confirmed')) {
          errorMessage = 'Please check your email and confirm your account before signing in.';
        } else if (result.error?.includes('Too many requests')) {
          errorMessage = 'Too many sign-in attempts. Please wait a moment and try again.';
        } else if (result.error) {
          errorMessage = result.error;
        }

        Alert.alert('Login Failed', errorMessage);
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResumeOnboarding = async () => {
    setShowResumeModal(false);

    // If there's a profile ID, we need to authenticate first (they were logged out)
    if (incompleteProfileData?.id && incompleteProfileData?.email) {
      try {
        // Sign them in silently with their existing credentials
        // Note: This assumes they entered correct password
        const result = await signIn(email.trim(), password);

        if (!result.success) {
          Alert.alert('Authentication Required', 'Please enter your password to resume onboarding.');
          return;
        }
      } catch (error) {
        console.error('❌ Error authenticating for resume:', error);
        Alert.alert('Error', 'Failed to authenticate. Please try logging in again.');
        return;
      }
    }

    // Navigate to the last step they were on
    const lastStep = incompleteProfileData?.onboarding_step;

    if (lastStep) {
      console.log('📍 Resuming onboarding at step:', lastStep);
      router.push(lastStep);
    } else {
      // Default to basic details if no step is saved
      console.log('📍 No saved step, starting from basic details');
      router.push('/(onboarding)/basic-details');
    }
  };

  const handleStartOverOnboarding = async () => {
    try {
      setShowResumeModal(false);
      setIsLoading(true);

      console.log('🔄 Starting over - deleting incomplete profile');

      // Check if user is authenticated first
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      // If not authenticated but we have profile data, we need to authenticate first to delete
      if (!user && incompleteProfileData?.id) {
        console.log('🔐 Authenticating to delete incomplete profile...');
        const result = await signIn(email.trim(), password);

        if (!result.success) {
          Alert.alert('Authentication Required', 'Please enter your password to delete the incomplete profile.');
          setIsLoading(false);
          return;
        }
      }

      // Now delete the incomplete profile
      const resetResult = await ProgressiveOnboardingService.resetOnboarding();

      if (!resetResult.success) {
        console.error('❌ Error resetting onboarding:', resetResult.error);
        Alert.alert('Error', 'Failed to reset onboarding. Please try again.');
        setIsLoading(false);
        return;
      }

      console.log('✅ Profile deleted successfully, redirecting to onboarding');

      // Navigate to the beginning of onboarding
      router.push('/(onboarding)/mascot-intro');
    } catch (error) {
      console.error('❌ Error starting over:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
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
      router.push('/');
    });
  };

  const handleSocialLogin = (provider: string) => {
    playLightHaptic();
    Alert.alert(
      'Coming Soon',
      `${provider} login will be available soon!`,
      [{ text: 'OK' }]
    );
  };

  const isFormValid = Boolean(email.trim()) && Boolean(password.trim());

  // Swipe gesture handler
  const onSwipeGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: swipeTranslateX } }],
    { useNativeDriver: true }
  );

  const onSwipeHandlerStateChange = (event: any) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      const { translationX, velocityX } = event.nativeEvent;

      // Check if swipe is to the right and has enough distance or velocity
      if (translationX > 100 || velocityX > 500) {
        // Trigger back navigation
        handleBackPress();
      } else {
        // Reset position
        Animated.spring(swipeTranslateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <PanGestureHandler
        onGestureEvent={onSwipeGestureEvent}
        onHandlerStateChange={onSwipeHandlerStateChange}
        activeOffsetX={[-10, 10]}
        failOffsetY={[-20, 20]}
      >
        <Animated.View
          style={[
            styles.keyboardAvoidingView,
            { transform: [{ translateX: swipeTranslateX }] }
          ]}
        >
          <View style={styles.contentWrapper}>
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              automaticallyAdjustKeyboardInsets={false}
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
              {/* Empty spacer to match onboarding layout */}
              <View style={{ width: 48, height: 48 }} />
            </Animated.View>

            <Animated.View style={[styles.content, { opacity: contentOpacity }]}>
              <Text style={styles.title}>Welcome back</Text>
              <Text style={styles.subtitle}>
                Sign in to continue your journey
              </Text>

              <Animated.View style={[styles.formContainer, { opacity: formOpacity }]}>
                <View style={styles.inputSection}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <TextInput
                    style={styles.lineInput}
                    placeholder="Enter your school email"
                    placeholderTextColor="#9CA3AF"
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setActiveField('email')}
                    onBlur={() => setActiveField(null)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    selectionColor="#FF4F81"
                  />
                  <View
                    style={[
                      styles.lineTrack,
                      (activeField === 'email' || email.length > 0) && styles.lineTrackActive,
                    ]}
                  >
                    <Animated.View
                      style={[
                        styles.lineFill,
                        {
                          width: emailFillAnim.interpolate({
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
                    placeholder="Enter your password"
                    placeholderTextColor="#9CA3AF"
                    value={password}
                    onChangeText={handlePasswordChange}
                    onFocus={() => setActiveField('password')}
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

                {/* Forgot Password */}
                <TouchableOpacity
                  style={styles.forgotPasswordButton}
                  onPress={() => {
                    playLightHaptic();
                    router.push('/(auth)/reset-password');
                  }}
                >
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>
              </Animated.View>
            </Animated.View>
          </ScrollView>
        </View>

        <Animated.View style={[styles.floatingButtonContainer, { opacity: buttonOpacity }]}>
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity
              style={[
                styles.signInButton,
                (!isFormValid || isLoading) && styles.disabledButton
              ]}
              onPress={handleLogin}
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
                styles.signInButtonText,
                (!isFormValid || isLoading) && styles.disabledButtonText
              ]}>
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
        </Animated.View>
      </PanGestureHandler>

      {/* Resume Onboarding Modal */}
      <ResumeOnboardingModal
        visible={showResumeModal}
        onContinue={handleResumeOnboarding}
        onStartOver={handleStartOverOnboarding}
      />
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
    marginBottom: SPACING.lg,
  },
  backButtonWrapper: {
    marginLeft: -SPACING.lg,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
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
    marginBottom: SPACING.xl,
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
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginTop: SPACING.sm,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#FF4F81',
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
  },
  floatingButtonContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: SPACING.sm,
    paddingHorizontal: SPACING.xl,
  },
  signInButton: {
    backgroundColor: '#FF4F81', // Primary pink from design system
    paddingVertical: 18, // From design system primary button spec
    paddingHorizontal: SPACING.xl, // Using design system token (32px)
    borderRadius: 16, // From design system primary button spec
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56, // From design system primary button spec
    width: '100%',
    overflow: 'hidden',
    marginBottom: SPACING.lg,
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
  signInButtonText: {
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
});
