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
  Alert
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
// import { BlurView } from 'expo-blur';
import { useUser } from '../../contexts/UserContext';
import { useOnboarding } from '../../OnboardingContext';
import { SPACING, BORDER_RADIUS } from '../../utils/constants';
import { Colors, Gradients } from '../../utils/colors';
import { Button, Input, Card, ProgressBar, BackButton } from '../../components/ui';
import { Fonts } from '../../utils/fonts';
import { Ionicons } from '@expo/vector-icons';

export default function PasswordCreationScreen() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showAccountConnectPopup, setShowAccountConnectPopup] = useState(false);
  const [isProgressAnimating, setIsProgressAnimating] = useState(false);
  const { updateUserProfile } = useUser();
  const { updateData } = useOnboarding();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const progressFillAnim = useRef(new Animated.Value(0)).current;
  
  // Refs for keyboard handling
  const scrollViewRef = useRef<ScrollView>(null);
  const formRef = useRef<View>(null);
  
  // Button press animations
  const buttonScale = useRef(new Animated.Value(1)).current;
  const backButtonScale = useRef(new Animated.Value(1)).current;
  const popupScale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
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

  // Password validation
  const validatePassword = (pass: string) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(pass);
    const hasLowerCase = /[a-z]/.test(pass);
    const hasNumbers = /\d/.test(pass);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(pass);
    
    return {
      isValid: pass.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar,
      minLength: pass.length >= minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar
    };
  };

  const passwordValidation = validatePassword(password);
  const passwordsMatch = password === confirmPassword && password.length > 0;
  const isFormValid = passwordValidation.isValid && passwordsMatch;

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

  const handleCreateAccount = async () => {
    if (!isFormValid) return;

    console.log('🔐 === PASSWORD CREATION START ===');
    console.log('🔐 Form validation passed:', isFormValid);
    console.log('🔐 Password length:', password.length);
    console.log('🔐 Password value (first 3 chars):', password.substring(0, 3) + '...');
    console.log('🔐 Password type:', typeof password);
    console.log('🔐 Confirm password matches:', passwordsMatch);
    console.log('🔐 Password validation results:', passwordValidation);
    console.log('🔐 === END PASSWORD CREATION START ===');

    // Start step-by-step progress animation
    animateStepByStepProgress();
  };

  const animateStepByStepProgress = () => {
    setIsProgressAnimating(true);
    
    // Animate from current step progress to next step progress
    Animated.timing(progressFillAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: false,
    }).start(() => {
      // Navigate after smooth animation
      setTimeout(() => {
        console.log('🔐 === PASSWORD SAVE TO USERCONTEXT ===');
        console.log('🔐 Password being saved to UserContext:', password ? 'YES' : 'NO');
        console.log('🔐 Password length:', password?.length || 0);
        console.log('🔐 Password value (first 3 chars):', password ? password.substring(0, 3) + '...' : 'undefined');
        console.log('🔐 Password type:', typeof password);
        console.log('🔐 Password validation passed:', passwordValidation.isValid);
        console.log('🔐 About to call updateUserProfile with password');
        console.log('🔐 === END PASSWORD SAVE TO USERCONTEXT ===');
        
        // Store password in OnboardingContext for account creation
        updateData({ password: password });
        
        updateUserProfile({ 
          onboardingCompleted: true 
        });
        
        console.log('🔐 === AFTER UPDATEUSERPROFILE CALL ===');
        console.log('🔐 updateUserProfile called successfully');
        console.log('🔐 Navigating to notifications screen');
        console.log('🔐 === END AFTER UPDATEUSERPROFILE CALL ===');
        
        router.push('/(onboarding)/legal-agreements');
      }, 200);
    });
  };

  // Removed animateColorTransitionProgress function

  const handleBackPress = () => {
    animateButtonPress(backButtonScale, () => {
      router.back();
    });
  };

  // Handle keyboard focus to center the form
  const handleInputFocus = () => {
    if (formRef.current && scrollViewRef.current) {
      formRef.current.measureLayout(
        scrollViewRef.current as any,
        (x, y, width, height) => {
          // Center the form on screen by scrolling to show it in the middle
          const scrollY = Math.max(0, y - 100); // Offset to center better
          scrollViewRef.current?.scrollTo({
            y: scrollY,
            animated: true,
          });
        },
        () => {
          console.log('Error measuring form layout');
        }
      );
    }
  };

  const renderPasswordRequirement = (isMet: boolean, text: string) => (
    <View style={styles.requirementRow}>
      <Text style={[
        styles.requirementIcon,
        isMet ? styles.requirementMet : styles.requirementUnmet
      ]}>
        {isMet ? '✓' : '○'}
      </Text>
      <Text style={[
        styles.requirementText,
        isMet ? styles.requirementMet : styles.requirementUnmet
      ]}>
        {text}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          automaticallyAdjustKeyboardInsets={true}
        >
          {/* Header */}
          <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
            <View style={styles.backButtonContainer}>
              <BackButton
                onPress={handleBackPress}
                animatedValue={backButtonScale}
                color="#c3b1e1"
                size={72}
                iconSize={28}
              />
            </View>
            
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Create Password</Text>
              <View style={styles.progressContainer}>
              <ProgressBar 
                  currentStep={5} 
                totalSteps={17} 
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
                <Ionicons name="lock-closed" size={40} color="#FF4F81" />
              </LinearGradient>
            </View>
            
            <Text style={styles.title}>Secure Your Account</Text>
            <Text style={styles.subtitle}>
              Create a strong password to protect your account
            </Text>

            {/* Password Form */}
            <Animated.View ref={formRef} style={[styles.formContainer, { opacity: formOpacity }]}>
              <LinearGradient
                colors={['#F8F4FF', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.formCard}
              >
                <Input
                  label="Password"
                  placeholder="Create a strong password"
                  value={password}
                  onChangeText={setPassword}
                  onFocus={handleInputFocus}
                  secureTextEntry={!showPassword}
                  leftIcon={<Ionicons name="lock-closed" size={18} color="#9CA3AF" />}
                  rightIcon={
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                      <Ionicons 
                        name={showPassword ? "eye" : "eye-off"} 
                        size={18} 
                        color="#9CA3AF" 
                      />
                    </TouchableOpacity>
                  }
                  onRightIconPress={() => setShowPassword(!showPassword)}
                  style={styles.passwordInput}
                />
                
                <Input
                  label="Confirm Password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  onFocus={handleInputFocus}
                  secureTextEntry={!showConfirmPassword}
                  leftIcon={<Ionicons name="lock-closed" size={18} color="#9CA3AF" />}
                  rightIcon={
                    <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                      <Ionicons 
                        name={showConfirmPassword ? "eye" : "eye-off"} 
                        size={18} 
                        color="#9CA3AF" 
                      />
                    </TouchableOpacity>
                  }
                  onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.passwordInput}
                />

                {/* Password Requirements */}
                <View style={styles.requirementsContainer}>
                  <Text style={styles.requirementsTitle}>Password Requirements:</Text>
                  {renderPasswordRequirement(passwordValidation.minLength, 'At least 8 characters')}
                  {renderPasswordRequirement(passwordValidation.hasUpperCase, 'One uppercase letter')}
                  {renderPasswordRequirement(passwordValidation.hasLowerCase, 'One lowercase letter')}
                  {renderPasswordRequirement(passwordValidation.hasNumbers, 'One number')}
                  {renderPasswordRequirement(passwordValidation.hasSpecialChar, 'One special character')}
                  {renderPasswordRequirement(passwordsMatch, 'Passwords match')}
                </View>
              </LinearGradient>
            </Animated.View>
          </Animated.View>
        </ScrollView>

        {/* Create Account Button Footer */}
        <View style={styles.footerContainer}>
            <Animated.View style={[styles.buttonContainer, { opacity: buttonOpacity }]}>
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity
                style={[
                  styles.createAccountButton,
                  (!isFormValid || isLoading) && styles.disabledButton
                ]}
                onPress={handleCreateAccount}
                activeOpacity={0.8}
                disabled={!isFormValid || isLoading}
              >
                <Text style={[
                  styles.createAccountButtonText,
                  (!isFormValid || isLoading) && styles.disabledButtonText
                ]}>
                {isLoading ? 'Creating Account...' : 'Create Account'}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </View>

          {/* Account Connect Popup */}
          {showAccountConnectPopup && (
            <View 
              style={[styles.popupOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}
            >
              <Animated.View 
                style={[styles.popupContainer, { 
                  opacity: showAccountConnectPopup ? 1 : 0,
                  transform: [
                    { scale: showAccountConnectPopup ? 1 : 0.9 },
                    { translateY: showAccountConnectPopup ? 0 : 20 }
                  ]
                }]}
              >
                <LinearGradient
                  colors={Gradients.primary as [string, string]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.popupHeader}
                >
                  <View style={styles.popupIconContainer}>
                    <Text style={styles.popupIcon}>🔗</Text>
                  </View>
                  <Text style={styles.popupTitle}>Connect Your Account</Text>
                  <Text style={styles.popupSubtitle}>
                    Link your Apple or Google account for faster, easier sign-ins
                  </Text>
                </LinearGradient>

                <View style={styles.popupContent}>
                  <TouchableOpacity
                    style={styles.connectButton}
                    onPress={() => {
                      // Handle Apple Sign In
                      updateUserProfile({ appleConnected: true } as any);
                      router.push('/(onboarding)/legal-agreements');
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={styles.connectButtonContent}>
                      <Text style={styles.connectButtonIcon}>🍎</Text>
                      <View style={styles.connectButtonTextContainer}>
                        <Text style={styles.connectButtonText}>Continue with Apple</Text>
                        <Text style={styles.connectButtonSubtext}>Secure & Private</Text>
                      </View>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.connectButton}
                    onPress={() => {
                      // Handle Google Sign In
                      updateUserProfile({ googleConnected: true } as any);
                      router.push('/(onboarding)/legal-agreements');
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={styles.connectButtonContent}>
                      <Text style={styles.connectButtonIcon}>🔍</Text>
                      <View style={styles.connectButtonTextContainer}>
                        <Text style={styles.connectButtonText}>Continue with Google</Text>
                        <Text style={styles.connectButtonSubtext}>Quick & Easy</Text>
                      </View>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.skipButton}
                    onPress={() => {
                      setShowAccountConnectPopup(false);
                      router.push('/(onboarding)/legal-agreements');
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.skipButtonText}>Skip for now</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
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
    fontSize: 20, // Slightly larger for main title
    fontWeight: '600', // SemiBold weight for prominence
    color: '#1B1B3A', // Primary text color from design system
    marginBottom: SPACING.sm, // Using design system token
    fontFamily: Fonts.semiBold, // Poppins SemiBold from design system
  },
  progressContainer: {
    width: '60%', // Make it shorter
    paddingHorizontal: SPACING.md, // Using design system token
  },
  progressBar: {
    marginTop: SPACING.xs, // Using design system token
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
    marginBottom: SPACING['2xl'], // Using design system token
    lineHeight: 24,
    paddingHorizontal: SPACING.md, // Using design system token
    fontFamily: Fonts.regular, // Inter Regular from design system
  },
  formContainer: {
    marginBottom: 0, // No margin since button is at bottom
  },
  formCard: {
    borderRadius: BORDER_RADIUS.md, // Using design system token
    padding: SPACING.lg, // Using design system token
    overflow: 'hidden', // For gradient background
  },
  passwordInput: {
    marginBottom: SPACING.md, // Using design system token
  },
  requirementsContainer: {
    marginTop: SPACING.lg, // Using design system token
    paddingTop: SPACING.lg, // Using design system token
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB', // Light border color from design system
  },
  requirementsTitle: {
    fontSize: 16, // UI elements size from design system
    fontWeight: '600', // SemiBold weight
    color: '#1B1B3A', // Primary text color from design system
    marginBottom: SPACING.md, // Using design system token
    fontFamily: Fonts.semiBold, // Poppins SemiBold from design system
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm, // Using design system token
  },
  requirementIcon: {
    fontSize: 16,
    marginRight: SPACING.sm, // Using design system token
    fontWeight: 'bold',
  },
  requirementText: {
    fontSize: 14, // Small text size from design system
    lineHeight: 20,
    fontFamily: Fonts.regular, // Inter Regular from design system
  },
  requirementMet: {
    color: '#c3b1e1', // Purple color from design system
  },
  requirementUnmet: {
    color: '#9CA3AF', // Tertiary text color from design system
  },
  footerContainer: {
    backgroundColor: '#FFFFFF', // White background
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB', // Light border color
    paddingTop: SPACING.lg, // Consistent with design system grid
    paddingBottom: SPACING.md, // Consistent bottom padding
  },
  buttonContainer: {
    paddingHorizontal: SPACING.xl, // Using design system token (32px)
    paddingBottom: SPACING.sm, // Minimal bottom padding
  },
  createAccountButton: {
    backgroundColor: '#FF4F81', // Primary pink from design system
    paddingVertical: 18, // From design system primary button spec
    paddingHorizontal: SPACING.xl, // Using design system token (32px)
    borderRadius: 16, // From design system primary button spec
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56, // From design system primary button spec
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
  createAccountButtonText: {
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
  popupOverlay: {
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
     popupContainer: {
     backgroundColor: Colors.background.primary,
     borderRadius: 32,
     width: '85%',
     maxWidth: 400,
     shadowColor: Colors.shadow.medium,
     shadowOffset: { width: 0, height: 8 },
     shadowOpacity: 1,
     shadowRadius: 20,
     elevation: 12,
     overflow: 'hidden',
   },
   popupHeader: {
     paddingTop: 32,
     paddingHorizontal: 24,
     paddingBottom: 24,
     alignItems: 'center',
   },
     popupIconContainer: {
     width: 64,
     height: 64,
     borderRadius: 32,
     backgroundColor: 'rgba(255,255,255,0.2)',
     alignItems: 'center',
     justifyContent: 'center',
     marginBottom: 16,
   },
   popupIcon: {
     fontSize: 32,
   },
   popupTitle: {
     fontSize: 26,
     fontWeight: '800',
     color: Colors.text.inverse,
     marginBottom: 12,
     letterSpacing: -0.5,
     textAlign: 'center',
   },
   popupSubtitle: {
     fontSize: 16,
     color: Colors.text.inverse,
     textAlign: 'center',
     opacity: 0.9,
     lineHeight: 22,
   },
   popupContent: {
     paddingHorizontal: 24,
     paddingBottom: 32,
   },
     connectButton: {
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'center',
     backgroundColor: Colors.background.primary,
     borderRadius: 20,
     paddingVertical: 20,
     paddingHorizontal: 20,
     marginBottom: 16,
     shadowColor: Colors.shadow.light,
     shadowOffset: { width: 0, height: 3 },
     shadowOpacity: 1,
     shadowRadius: 10,
     elevation: 3,
     borderWidth: 2,
     borderColor: Colors.border.light,
   },
   connectButtonIcon: {
     fontSize: 28,
     marginRight: 16,
   },
   connectButtonContent: {
     flexDirection: 'row',
     alignItems: 'center',
     flex: 1,
   },
   connectButtonTextContainer: {
     flex: 1,
   },
   connectButtonText: {
     fontSize: 18,
     fontWeight: '700',
     color: Colors.text.primary,
     letterSpacing: -0.3,
     marginBottom: 2,
   },
   connectButtonSubtext: {
     fontSize: 13,
     fontWeight: '500',
     color: Colors.text.secondary,
     letterSpacing: -0.1,
   },
     skipButton: {
     backgroundColor: 'transparent',
     borderRadius: 16,
     paddingVertical: 16,
     paddingHorizontal: 20,
     alignItems: 'center',
     justifyContent: 'center',
     marginTop: 8,
   },
   skipButtonText: {
     fontSize: 16,
     fontWeight: '600',
     color: Colors.text.secondary,
     letterSpacing: -0.2,
   },
});

