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
import { SPACING, BORDER_RADIUS } from '../../utils/constants';
import { Colors, Gradients } from '../../utils/colors';
import { Button, ProgressBar, BackButton } from '../../components/ui';
import { Fonts } from '../../utils/fonts';
import { Ionicons } from '@expo/vector-icons';
import { useOnboarding } from '../../OnboardingContext';
import PrivacyPolicyModal from '../../components/PrivacyPolicyModal';
import TermsOfServiceModal from '../../components/TermsOfServiceModal';

export default function LegalAgreementsScreen() {
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [isProgressAnimating, setIsProgressAnimating] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const { data: onboardingData, updateData } = useOnboarding();

  // Animation values
  const backButtonScale = useRef(new Animated.Value(1)).current;
  const progressFillAnim = useRef(new Animated.Value(0)).current;

  // Load existing agreement status if available
  useEffect(() => {
    if (onboardingData?.agreedToTermsAndConditions) {
      setAgreedToTerms(true);
      setAgreedToPrivacy(true);
    }
  }, [onboardingData?.agreedToTermsAndConditions]);

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

  const handleAutoAdvance = () => {
    // Save agreement status to onboarding data
    updateData({ agreedToTermsAndConditions: true });
    
    // Animate progress and navigate
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
        router.push('/(onboarding)/mascot-phase2');
      }, 200);
    });
  };

  const handleBackPress = () => {
    animateButtonPress(backButtonScale, () => {
      router.back();
    });
  };

  const handleTermsPress = () => {
    // Show terms of service modal
    setShowTermsModal(true);
  };

  const handlePrivacyPress = () => {
    // Show privacy policy modal
    setShowPrivacyModal(true);
  };

  const toggleTerms = () => {
    setAgreedToTerms(!agreedToTerms);
  };

  const togglePrivacy = () => {
    setAgreedToPrivacy(!agreedToPrivacy);
  };

  // Auto-advance when both checkboxes are checked
  useEffect(() => {
    if (agreedToTerms && agreedToPrivacy) {
      // Small delay to show the checkmarks before advancing
      const timer = setTimeout(() => {
        handleAutoAdvance();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [agreedToTerms, agreedToPrivacy]);

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
          <View style={styles.header}>
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
              <Text style={styles.headerTitle}>Legal Agreements</Text>
              <View style={styles.progressContainer}>
              <ProgressBar 
                  currentStep={6} 
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
          </View>

          {/* Main Content */}
          <View style={styles.content}>
            <View style={styles.illustrationContainer}>
              <LinearGradient
                colors={['#F8F4FF', '#FFF0F5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.illustrationGradient}
              >
                <Ionicons name="document-text" size={40} color="#FF4F81" />
              </LinearGradient>
            </View>
            
            <Text style={styles.title}>Legal Agreements</Text>
            <Text style={styles.subtitle}>
              Please review and agree to our terms and privacy policy to continue
            </Text>

            {/* Terms and Conditions */}
            <LinearGradient
              colors={['#F8F4FF', '#FFFFFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.agreementContainer}
            >
              <TouchableOpacity 
                style={styles.agreementRow}
                onPress={toggleTerms}
                activeOpacity={0.7}
              >
                <View style={styles.checkboxContainer}>
                  <View style={[
                    styles.checkbox,
                    agreedToTerms && styles.checkboxChecked
                  ]}>
                    {agreedToTerms && (
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    )}
                  </View>
                </View>
                <View style={styles.agreementTextContainer}>
                  <Text style={styles.agreementText}>
                    I agree to the{' '}
                    <Text style={styles.linkText} onPress={handleTermsPress}>
                      Terms of Service
                    </Text>
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.agreementRow}
                onPress={togglePrivacy}
                activeOpacity={0.7}
              >
                <View style={styles.checkboxContainer}>
                  <View style={[
                    styles.checkbox,
                    agreedToPrivacy && styles.checkboxChecked
                  ]}>
                    {agreedToPrivacy && (
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    )}
                  </View>
                </View>
                <View style={styles.agreementTextContainer}>
                  <Text style={styles.agreementText}>
                    I agree to the{' '}
                    <Text style={styles.linkText} onPress={handlePrivacyPress}>
                      Privacy Policy
                    </Text>
                  </Text>
                </View>
              </TouchableOpacity>
            </LinearGradient>

            {/* Important Notice */}
            <View style={styles.noticeContainer}>
              <View style={styles.noticeHeader}>
                <Ionicons name="lock-closed" size={16} color="#FF4F81" />
                <Text style={styles.noticeTitle}>Important Notice</Text>
              </View>
              <Text style={styles.noticeText}>
                By agreeing to these terms, you confirm that you are at least 18 years old and eligible to use our service. We take your privacy and safety seriously.
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Modals */}
        <TermsOfServiceModal
          visible={showTermsModal}
          onClose={() => setShowTermsModal(false)}
        />
        
        <PrivacyPolicyModal
          visible={showPrivacyModal}
          onClose={() => setShowPrivacyModal(false)}
        />

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
  agreementContainer: {
    borderRadius: BORDER_RADIUS.md, // Using design system token
    padding: SPACING.lg, // Using design system token
    marginBottom: SPACING.lg, // Using design system token
    overflow: 'hidden', // For gradient background
  },
  agreementRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md, // Using design system token
  },
  checkboxContainer: {
    marginRight: SPACING.sm, // Using design system token
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#E5E7EB', // Light border color from design system
    backgroundColor: '#FFFFFF', // White background
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#FF4F81', // Primary pink from design system
    borderColor: '#FF4F81', // Primary pink from design system
  },
  agreementTextContainer: {
    flex: 1,
  },
  agreementText: {
    fontSize: 16, // Body text size from design system
    color: '#1B1B3A', // Primary text color from design system
    lineHeight: 22,
    fontFamily: Fonts.regular, // Inter Regular from design system
  },
  linkText: {
    color: '#FF4F81', // Primary pink from design system
    fontWeight: '600', // SemiBold weight
    textDecorationLine: 'underline',
    fontFamily: Fonts.semiBold, // Poppins SemiBold from design system
  },
  noticeContainer: {
    paddingHorizontal: SPACING.md, // Using design system token
    paddingVertical: SPACING.sm, // Using design system token
    backgroundColor: '#FFE5F0', // Light pink background
    borderRadius: BORDER_RADIUS.md, // Using design system token
    borderWidth: 1,
    borderColor: '#FFB6C1', // Light pink border
    marginBottom: 0, // No margin since button is at bottom
  },
  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm, // Using design system token
    marginBottom: SPACING.sm, // Using design system token
  },
  noticeTitle: {
    fontSize: 16, // UI elements size from design system
    fontWeight: '600', // SemiBold weight
    color: '#1B1B3A', // Primary text color from design system
    fontFamily: Fonts.semiBold, // Poppins SemiBold from design system
  },
  noticeText: {
    fontSize: 14, // Small text size from design system
    color: '#6B7280', // Secondary text color from design system
    lineHeight: 20,
    fontFamily: Fonts.regular, // Inter Regular from design system
  },
});
