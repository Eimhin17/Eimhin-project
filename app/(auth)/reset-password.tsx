import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';
import { SPACING } from '../../utils/constants';
import { BackButton } from '../../components/ui';
import { Fonts } from '../../utils/fonts';
import { playLightHaptic } from '../../utils/haptics';
import { Ionicons } from '@expo/vector-icons';

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);
  const [email, setEmail] = useState('');
  // Start with email form hidden so we can check for a deep link first
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeField, setActiveField] = useState<'email' | 'password' | 'confirmPassword' | null>(null);

  // Deep link handling helpers
  const parseHashParams = (url: string) => {
    try {
      const hashIndex = url.indexOf('#');
      if (hashIndex === -1) return {} as Record<string, string>;
      const hash = url.substring(hashIndex + 1);
      const usp = new URLSearchParams(hash);
      const out: Record<string, string> = {};
      usp.forEach((v, k) => {
        out[k] = v;
      });
      return out;
    } catch (e) {
      console.warn('Failed to parse hash params from URL:', url, e);
      return {} as Record<string, string>;
    }
  };

  const handleIncomingUrl = async (url: string) => {
    // Expecting URLs like: debsmatch://auth/reset-password#access_token=...&refresh_token=...&type=recovery
    const params = parseHashParams(url);
    const type = params['type'];
    const accessToken = params['access_token'];
    const refreshToken = params['refresh_token'];

    if (type === 'recovery' && accessToken && refreshToken) {
      setLoading(true);
      try {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) {
          console.error('❌ Failed to set Supabase session from recovery link:', error);
          setIsValidToken(false);
          setShowEmailForm(true);
          return;
        }
        // Session is now valid; allow user to set a new password
        setIsValidToken(true);
        setShowEmailForm(false);
      } catch (e) {
        console.error('❌ Unexpected error while handling deep link:', e);
        setIsValidToken(false);
        setShowEmailForm(true);
      } finally {
        setLoading(false);
      }
    } else {
      // No valid recovery tokens in URL; show email form
      setIsValidToken(false);
      setShowEmailForm(true);
    }
  };

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
  const confirmPasswordFillAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let subscription: { remove?: () => void } | undefined;

    const init = async () => {
      try {
        // Check the initial URL if the app was opened by the recovery link
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          await handleIncomingUrl(initialUrl);
        } else {
          // No incoming link; default to email form
          setShowEmailForm(true);
        }
      } catch (e) {
        console.error('❌ Error during deep link initialization:', e);
        setShowEmailForm(true);
      }

      // Also listen for links while the app is running
      // @ts-ignore - API shape varies by RN/Expo version; both expose addEventListener('url')
      subscription = Linking.addEventListener('url', ({ url }: { url: string }) => {
        handleIncomingUrl(url);
      });
    };

    init();

    return () => {
      if (subscription && typeof subscription.remove === 'function') {
        subscription.remove();
      }
    };
  }, []);

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

  useEffect(() => {
    const target = confirmPassword.length > 0 ? Math.min(confirmPassword.length / 12, 1) : 0;
    Animated.timing(confirmPasswordFillAnim, {
      toValue: target,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [confirmPassword]);

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
      router.push('/(auth)/login');
    });
  };

  const handleRequestReset = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    // Add haptic feedback and button animation
    playLightHaptic();
    triggerButtonSweep();
    animateButtonPress(buttonScale);

    setLoading(true);
    try {
      console.log('🔄 Requesting password reset for:', email);

      // Call built-in Supabase reset flow unconditionally
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: 'debsmatch://auth/reset-password',
      });

      if (error) {
        // Keep UX generic to avoid enumeration
        console.warn('⚠️ Password reset request error (not shown to user):', error);
      } else {
        console.log('✅ Password reset email requested');
      }

      // Generic confirmation regardless of outcome
      Alert.alert(
        'Email sent',
        'Click the link in the email we sent to reset your password',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
      );

    } catch (error) {
      console.error('❌ Unexpected error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!password.trim()) {
      Alert.alert('Error', 'Please enter a new password');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    // Check password strength
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSymbols = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    if (!hasLowercase || !hasUppercase || !hasNumbers || !hasSymbols) {
      Alert.alert(
        'Weak Password',
        'Password must contain at least one lowercase letter, one uppercase letter, one number, and one symbol.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Add haptic feedback and button animation
    playLightHaptic();
    triggerButtonSweep();
    animateButtonPress(buttonScale);

    setLoading(true);

    try {
      console.log('🔄 Resetting password...');

      // Update password using Supabase Auth (temporary recovery session is active)
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        console.error('❌ Password reset error:', error);
        Alert.alert('Error', `Failed to reset password: ${error.message}`);
        return;
      }

      console.log('✅ Password reset successful');
      // Sign out any active session to ensure re-auth with new password
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('⚠️ Sign out after password reset failed (continuing):', e);
      }
      Alert.alert(
        'Success',
        'Your password has been reset successfully. You can now sign in with your new password.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(auth)/login')
          }
        ]
      );

    } catch (error) {
      console.error('❌ Unexpected error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isValidToken && !showEmailForm) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF4F81" />
          <Text style={styles.loadingText}>Verifying reset link...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isEmailFormValid = Boolean(email.trim());
  const isPasswordFormValid = Boolean(password.trim()) && Boolean(confirmPassword.trim());

  // Show email form if no token (accessed via "Forgot Password" button)
  if (showEmailForm && !isValidToken) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.contentWrapper}>
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

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            automaticallyAdjustKeyboardInsets={false}
          >
            <Animated.View style={[styles.content, { opacity: contentOpacity }]}>
              <Text style={styles.title}>Reset Password</Text>
              <Text style={styles.subtitle}>We knew you'd end up here eventually</Text>

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

                <View style={styles.infoContainer}>
                  <Ionicons name="information-circle" size={16} color="#FF4F81" />
                  <Text style={styles.infoText}>
                    We'll send a password reset link to your school email address
                  </Text>
                </View>
              </Animated.View>
            </Animated.View>
          </ScrollView>

          <Animated.View style={[styles.floatingButtonContainer, { opacity: buttonOpacity }]}>
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity
                style={[
                  styles.signInButton,
                  (!isEmailFormValid || loading) && styles.disabledButton
                ]}
                onPress={handleRequestReset}
                activeOpacity={0.8}
                disabled={!isEmailFormValid || loading}
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
                  (!isEmailFormValid || loading) && styles.disabledButtonText
                ]}>
                  {loading ? 'Sending Reset Email...' : 'Send Reset Email'}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentWrapper}>
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

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          automaticallyAdjustKeyboardInsets={false}
        >
          <Animated.View style={[styles.content, { opacity: contentOpacity }]}>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>We knew you'd end up here eventually</Text>

            <Animated.View style={[styles.formContainer, { opacity: formOpacity }]}>
              <View style={styles.inputSection}>
                <View style={styles.labelRow}>
                  <Text style={styles.inputLabel}>New Password</Text>
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
                  placeholder="Enter your new password"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
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
                  placeholder="Confirm your new password"
                  placeholderTextColor="#9CA3AF"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  onFocus={() => setActiveField('confirmPassword')}
                  onBlur={() => setActiveField(null)}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  selectionColor="#FF4F81"
                />
                <View
                  style={[
                    styles.lineTrack,
                    (activeField === 'confirmPassword' || confirmPassword.length > 0) && styles.lineTrackActive,
                  ]}
                >
                  <Animated.View
                    style={[
                      styles.lineFill,
                      {
                        width: confirmPasswordFillAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '100%'],
                        }),
                      },
                    ]}
                  />
                </View>
              </View>

              {/* Password Requirements */}
              <View style={styles.requirements}>
                <Text style={styles.requirementsTitle}>Password Requirements:</Text>
                <Text style={styles.requirement}>• At least 6 characters long</Text>
                <Text style={styles.requirement}>• One lowercase letter (a-z)</Text>
                <Text style={styles.requirement}>• One uppercase letter (A-Z)</Text>
                <Text style={styles.requirement}>• One number (0-9)</Text>
                <Text style={styles.requirement}>• One symbol (!@#$%^&*)</Text>
              </View>
            </Animated.View>
          </Animated.View>
        </ScrollView>

        <Animated.View style={[styles.floatingButtonContainer, { opacity: buttonOpacity }]}>
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity
              style={[
                styles.signInButton,
                (!isPasswordFormValid || loading) && styles.disabledButton
              ]}
              onPress={handleResetPassword}
              activeOpacity={0.8}
              disabled={!isPasswordFormValid || loading}
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
                (!isPasswordFormValid || loading) && styles.disabledButtonText
              ]}>
                {loading ? 'Resetting Password...' : 'Reset Password'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Primary white background from design system
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
  infoContainer: {
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: '#FFE5F0', // Light pink background
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFB6C1', // Light pink border
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'left',
    lineHeight: 20,
    flex: 1,
    fontFamily: Fonts.regular,
  },
  requirements: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: SPACING.md,
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1B1B3A',
    marginBottom: SPACING.xs,
    fontFamily: Fonts.semiBold,
  },
  requirement: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    fontFamily: Fonts.regular,
  },
  floatingButtonContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: SPACING.lg,
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
    // Removed extra bottom margin so the floating container can place
    // the button closer to the bottom like the onboarding continue button
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#1B1B3A',
    fontFamily: Fonts.regular,
  },
});
