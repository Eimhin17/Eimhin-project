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
  Alert,
  TextInput
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useOnboarding } from '../../OnboardingContext';
import { SPACING, BORDER_RADIUS } from '../../utils/constants';
import { Colors, Gradients } from '../../utils/colors';
import { Button, Input, Card, ProgressBar, BackButton } from '../../components/ui';
import { Fonts } from '../../utils/fonts';
import { EmailService } from '../../services/email';
import { Ionicons } from '@expo/vector-icons';

export default function EmailCodeScreen() {
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isProgressAnimating, setIsProgressAnimating] = useState(false);
  const { data: onboardingData, updateData } = useOnboarding();
  
  // Refs for each input
  const inputRefs = useRef<TextInput[]>([]);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  
  // Button press animations
  const buttonScale = useRef(new Animated.Value(1)).current;
  const backButtonScale = useRef(new Animated.Value(1)).current;
  const progressFillAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // Log onboarding data when component mounts
    console.log('📧 Email code screen - onboarding data:', onboardingData);
    
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

  const handleDigitChange = (text: string, index: number) => {
    // Only allow single digit
    if (text.length > 1) return;
    
    const newCode = [...verificationCode];
    newCode[index] = text;
    setVerificationCode(newCode);
    
    // Auto-focus next input if digit entered
    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    
    // Auto-verify when all 6 digits are entered
    if (newCode.every(digit => digit !== '') && newCode.length === 6) {
      const fullCode = newCode.join('');
      handleVerifyCode(fullCode);
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    // Handle backspace
    if (key === 'Backspace' && !verificationCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyCode = async (code?: string) => {
    const codeToVerify = code || verificationCode.join('');
    
    if (!codeToVerify || codeToVerify.length !== 6) {
      return;
    }

    try {
      setIsLoading(true);
      
      // Get the email from onboarding data
      const email = onboardingData.schoolEmail;
      if (!email) {
        Alert.alert('Error', 'No email found. Please go back and enter your email first.');
        return;
      }

      // Actually verify the code using EmailService
      const result = await EmailService.verifyCode(email, codeToVerify);
      
      if (result.success) {
        console.log('✅ Email verification successful!');
        // Start step-by-step progress animation
        animateStepByStepProgress();
      } else {
        console.error('❌ Email verification failed:', result.error);
        Alert.alert(
          'Verification Failed',
          result.error || 'Invalid verification code. Please try again.',
          [{ text: 'OK' }]
        );
        // Clear the code on failure
        setVerificationCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      console.error('❌ Verification error:', error);
      Alert.alert(
        'Verification Error',
        'An unexpected error occurred. Please try again.',
        [{ text: 'OK' }]
      );
      // Clear the code on error
      setVerificationCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
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
        updateData({ emailVerified: true });
        router.push('/(onboarding)/password-creation');
      }, 200);
    });
  };

  const handleBackPress = () => {
    animateButtonPress(backButtonScale, () => {
      router.back();
    });
  };

  const handleResendCode = async () => {
    try {
      const email = onboardingData.schoolEmail;
      if (!email) {
        Alert.alert('Error', 'No email found. Please go back and enter your email first.');
        return;
      }

      const result = await EmailService.sendVerificationCode(email);
      if (result.success) {
        Alert.alert('Code Resent', 'A new verification code has been sent to your email');
      } else {
        Alert.alert('Error', result.error || 'Failed to resend code. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to resend code. Please try again.');
    }
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
              <BackButton
                onPress={handleBackPress} 
                animatedValue={backButtonScale}
                color="#c3b1e1"
                size={72}
                iconSize={28}
              />
            </View>
            
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Verify Email</Text>
              <View style={styles.progressContainer}>
              <ProgressBar 
                  currentStep={4} 
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
                <Ionicons name="mail" size={40} color="#FF4F81" />
              </LinearGradient>
            </View>
            
            <Text style={styles.title}>Enter verification code</Text>
                            <Text style={styles.subtitle}>
              Enter the 6-digit code from your email
                </Text>

            {/* 6-Digit Code Input */}
            <Animated.View style={[styles.codeContainer, { opacity: formOpacity }]}>
              <View style={styles.codeInputs}>
                {verificationCode.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => {
                      if (ref) inputRefs.current[index] = ref;
                    }}
                    style={[
                      styles.digitInput,
                      digit && styles.digitInputFilled,
                      isLoading && styles.digitInputLoading
                    ]}
                    value={digit}
                    onChangeText={(text) => handleDigitChange(text, index)}
                    onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                  keyboardType="numeric"
                    maxLength={1}
                    selectTextOnFocus
                    editable={!isLoading}
                  />
                ))}
                </View>
              </Animated.View>

              {/* Resend Code */}
            <Animated.View style={[styles.resendContainer, { opacity: buttonOpacity }]}>
              <TouchableOpacity 
                style={styles.resendButton}
                onPress={handleResendCode}
                disabled={isLoading}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.resendButtonText, 
                  isLoading && styles.resendButtonTextDisabled
                ]}>
                  {isLoading ? 'Verifying...' : 'Resend Code'}
                </Text>
              </TouchableOpacity>

              <View style={styles.noteContainer}>
                <Ionicons name="information-circle" size={16} color="#FF4F81" />
                <Text style={styles.noteText}>
                  Didn't receive the code? Check your spam folder or try resending.
                </Text>
              </View>
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
  scrollView: {
    flex: 1,
  },
  keyboardAvoidingView: {
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
  codeContainer: {
    marginBottom: SPACING['2xl'], // Using design system token
  },
  codeInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg, // Using design system token
    paddingHorizontal: SPACING.sm, // Using design system token
  },
  digitInput: {
    flex: 1,
    height: 50,
    borderBottomWidth: 3,
    borderColor: '#E5E7EB', // Light border color from design system
    textAlign: 'center',
    fontSize: 28,
    fontWeight: '600',
    color: '#1B1B3A', // Primary text color from design system
    backgroundColor: 'transparent', // Transparent background
    fontFamily: Fonts.semiBold, // Poppins SemiBold from design system
    marginHorizontal: SPACING.xs, // Small margin between lines
  },
  digitInputFilled: {
    borderColor: '#c3b1e1', // Purple border when filled
  },
  digitInputLoading: {
    opacity: 0.6,
  },
  resendContainer: {
    alignItems: 'center',
    paddingHorizontal: SPACING.lg, // Using design system token for proper grid spacing
  },
  resendButton: {
    paddingVertical: SPACING.md, // Using design system token
    paddingHorizontal: SPACING.lg, // Using design system token
    marginBottom: SPACING.lg, // Using design system token
    alignItems: 'center',
  },
  resendButtonText: {
    fontSize: 16, // UI elements size from design system
    color: '#FF4F81', // Pink color from design system
    fontWeight: '600', // SemiBold weight
    textDecorationLine: 'underline',
    fontFamily: Fonts.semiBold, // Poppins SemiBold from design system
  },
  resendButtonTextDisabled: {
    color: '#9CA3AF', // Tertiary text color from design system
    textDecorationLine: 'none',
  },
  noteContainer: {
    paddingHorizontal: SPACING.md, // Using design system token
    paddingVertical: SPACING.sm, // Using design system token
    backgroundColor: '#FFE5F0', // Light pink background
    borderRadius: BORDER_RADIUS.md, // Using design system token
    borderWidth: 1,
    borderColor: '#FFB6C1', // Light pink border
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm, // Using design system token
  },
  noteText: {
    fontSize: 14, // Small text size from design system
    color: '#6B7280', // Secondary text color from design system
    textAlign: 'left',
    lineHeight: 20,
    flex: 1,
    fontFamily: Fonts.regular, // Inter Regular from design system
  },
});
