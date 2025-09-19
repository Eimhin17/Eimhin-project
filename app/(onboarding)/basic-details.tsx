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
  Dimensions,
  Alert,
  Animated,
  TextInput,
  Keyboard
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useOnboarding } from '../../OnboardingContext';
import { SPACING, BORDER_RADIUS } from '../../utils/constants';
import { Colors, Gradients } from '../../utils/colors';
import { Button, Input, Card, ProgressBar, BackButton } from '../../components/ui';
import { Fonts } from '../../utils/fonts';
import { UsernameValidationService } from '../../services/usernameValidation';
import { Ionicons } from '@expo/vector-icons';

export default function BasicDetailsScreen() {
  const [firstName, setFirstName] = useState('');
  const [username, setUsername] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState(new Date(2006, 0, 1));
  const [dayValue, setDayValue] = useState('01');
  const [monthValue, setMonthValue] = useState('01');
  const [yearValue, setYearValue] = useState('2006');
  const [calculatedAge, setCalculatedAge] = useState<number | null>(null);
  const [isProgressAnimating, setIsProgressAnimating] = useState(false);
  const [usernameError, setUsernameError] = useState<string>('');
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);
  const [isValidatingUsername, setIsValidatingUsername] = useState(false);
  const [showAgeModal, setShowAgeModal] = useState(false);
  const [hasFormBeenPositioned, setHasFormBeenPositioned] = useState(false);
  const { updateData } = useOnboarding();

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
  
  // ScrollView ref for keyboard handling
  const scrollViewRef = useRef<ScrollView>(null);
  const formRef = useRef<View>(null);

  const { height: screenHeight } = Dimensions.get('window');

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

  // Validate username as user types
  const validateUsername = async (usernameToValidate: string) => {
    if (!usernameToValidate.trim()) {
      setUsernameError('');
      setUsernameSuggestions([]);
      return;
    }

    setIsValidatingUsername(true);
    setUsernameError('');

    try {
      const result = await UsernameValidationService.validateUsername(usernameToValidate);
      
      if (!result.isValid) {
        setUsernameError(result.error || 'Invalid username');
        setUsernameSuggestions([]);
      } else if (!result.isAvailable) {
        setUsernameError(result.error || 'Username is already taken');
        setUsernameSuggestions(result.suggestions || []);
      } else {
        setUsernameError('');
        setUsernameSuggestions([]);
      }
    } catch (error) {
      console.error('❌ Error validating username:', error);
      setUsernameError('Failed to validate username');
      setUsernameSuggestions([]);
    } finally {
      setIsValidatingUsername(false);
    }
  };

  // Calculate age when date of birth changes
  useEffect(() => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    setCalculatedAge(age);
  }, [dateOfBirth]);

  // Debounced username validation
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (username.trim()) {
        validateUsername(username);
      }
    }, 500); // 500ms delay

    return () => clearTimeout(timeoutId);
  }, [username]);


  const handleDateValueChange = (field: 'day' | 'month' | 'year', value: string) => {
    // Remove any non-numeric characters
    const numericValue = value.replace(/\D/g, '');
    
    if (field === 'day') {
      setDayValue(numericValue);
    } else if (field === 'month') {
      setMonthValue(numericValue);
    } else if (field === 'year') {
      setYearValue(numericValue);
    }
    
    // Update the date if all fields have values
    const currentDay = field === 'day' ? numericValue : dayValue;
    const currentMonth = field === 'month' ? numericValue : monthValue;
    const currentYear = field === 'year' ? numericValue : yearValue;
    
    if (currentDay && currentMonth && currentYear) {
      const day = parseInt(currentDay);
      const month = parseInt(currentMonth) - 1; // Month is 0-indexed
      const year = parseInt(currentYear);
      
      if (day >= 1 && day <= 31 && month >= 0 && month <= 11 && year >= 1900 && year <= new Date().getFullYear()) {
        const newDate = new Date(year, month, day);
        if (!isNaN(newDate.getTime())) {
          setDateOfBirth(newDate);
        }
      }
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

  const handleContinue = () => {
    if (!firstName.trim() || !username.trim()) {
      Alert.alert('Error', 'Please enter both your first name and username');
      return;
    }

    if (!dayValue || !monthValue || !yearValue) {
      Alert.alert('Error', 'Please enter your complete date of birth');
      return;
    }

    // Dismiss keyboard before showing modal
    Keyboard.dismiss();
    
    // Show age confirmation modal
    setShowAgeModal(true);
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
        proceedToNext();
      }, 200);
    });
  };

  const handleBackPress = () => {
    animateButtonPress(backButtonScale, () => {
      router.back();
    });
  };

  const handleAgeModalConfirm = () => {
    setShowAgeModal(false);
    // Start step-by-step progress animation
    animateStepByStepProgress();
  };

  const handleAgeModalCancel = () => {
    setShowAgeModal(false);
  };

  const handleInputFocus = () => {
    // Only scroll once when any field is first focused, then keep the form positioned
    if (hasFormBeenPositioned) {
      return; // Don't scroll again if form is already positioned
    }

    setTimeout(() => {
      formRef.current?.measureLayout(
        scrollViewRef.current as any,
        (x, y, width, height) => {
          const screenHeight = Dimensions.get('window').height;
          const keyboardHeight = 300; // Approximate keyboard height
          const headerHeight = 120; // Approximate header height
          
          // Scroll to show the entire form card including DOB fields
          const scrollY = Math.max(0, y - 200); // Position to show complete form
          
          scrollViewRef.current?.scrollTo({ y: scrollY, animated: true });
          setHasFormBeenPositioned(true); // Mark that form has been positioned
        },
        () => {
          // Fallback scroll position if measure fails
          scrollViewRef.current?.scrollTo({
            y: 0,
            animated: true,
          });
          setHasFormBeenPositioned(true);
        }
      );
    }, 100);
  };

  const proceedToNext = async () => {
    try {
      // Update onboarding data
      updateData({ 
        firstName: firstName.trim(), 
        username: username.trim(),
        dateOfBirth: dateOfBirth,
        gender: 'woman' // Default gender, will be updated in gender selection
      });
      
      console.log('💾 Basic details saved to onboarding data');
      router.push('/(onboarding)/gender-selection');
    } catch (error) {
      console.error('❌ Error handling basic details:', error);
      // Still continue with onboarding even if there's an error
      router.push('/(onboarding)/gender-selection');
    }
  };

  const isFormValid = firstName.trim() && username.trim() && !usernameError && !isValidatingUsername;

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
              <Text style={styles.headerTitle}>Basic Details</Text>
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
                <Ionicons name="person" size={40} color="#FF4F81" />
              </LinearGradient>
            </View>
            
            <Text style={styles.title}>Tell us about yourself</Text>
            <Text style={styles.subtitle}>
              Let's start with the basics
            </Text>

            {/* Form */}
            <Animated.View ref={formRef} style={[styles.formContainer, { opacity: formOpacity }]}>
              <LinearGradient
                colors={['#F8F4FF', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.formCard}
              >
                <Input
                  label="First Name"
                  placeholder="Enter your first name"
                  value={firstName}
                  onChangeText={setFirstName}
                  onFocus={handleInputFocus}
                  autoCapitalize="words"
                  maxLength={30}
                  leftIcon={<Ionicons name="person" size={18} color="#9CA3AF" />}
                  style={styles.nameInput}
                />
                
                <Input
                  label="Username"
                  placeholder="Enter your username"
                  value={username}
                  onChangeText={setUsername}
                  onFocus={handleInputFocus}
                  autoCapitalize="none"
                  maxLength={30}
                  error={usernameError}
                  leftIcon={<Ionicons name="at" size={18} color="#9CA3AF" />}
                  style={styles.usernameInput}
                />
                
                {/* Username Suggestions */}
                {usernameSuggestions.length > 0 && (
                  <View style={styles.suggestionsContainer}>
                    <Text style={styles.suggestionsTitle}>Try these instead:</Text>
                    {usernameSuggestions.map((suggestion, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.suggestionButton}
                        onPress={() => {
                          setUsername(suggestion);
                          setUsernameSuggestions([]);
                        }}
                      >
                        <Text style={styles.suggestionText}>{suggestion}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                
                <View style={styles.dateInputContainer}>
                  <Text style={styles.dateInputLabel}>Date of Birth</Text>
                  <View style={styles.dateInputFields}>
                    <TextInput
                      style={styles.dateField}
                      value={dayValue}
                      onChangeText={(text) => handleDateValueChange('day', text)}
                      onFocus={handleInputFocus}
                      keyboardType="numeric"
                      maxLength={2}
                      placeholder="DD"
                      placeholderTextColor="#9CA3AF"
                      textAlign="center"
                    />
                    
                    <Text style={styles.dateSeparator}>/</Text>
                    
                    <TextInput
                      style={styles.dateField}
                      value={monthValue}
                      onChangeText={(text) => handleDateValueChange('month', text)}
                      onFocus={handleInputFocus}
                      keyboardType="numeric"
                      maxLength={2}
                      placeholder="MM"
                      placeholderTextColor="#9CA3AF"
                      textAlign="center"
                    />
                    
                    <Text style={styles.dateSeparator}>/</Text>
                    
                    <TextInput
                      style={styles.dateField}
                      value={yearValue}
                      onChangeText={(text) => handleDateValueChange('year', text)}
                      onFocus={handleInputFocus}
                      keyboardType="numeric"
                      maxLength={4}
                      placeholder="YYYY"
                      placeholderTextColor="#9CA3AF"
                      textAlign="center"
                    />
                  </View>
                </View>

              </LinearGradient>
            </Animated.View>

          </Animated.View>
        </ScrollView>

        {/* Continue Button Footer */}
        <View style={styles.footerContainer}>
          <Animated.View style={[styles.buttonContainer, { opacity: buttonOpacity }]}>
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity
                style={[
                  styles.continueButton,
                  (!isFormValid) && styles.disabledButton
                ]}
                onPress={handleContinue}
                activeOpacity={0.8}
                disabled={!isFormValid}
              >
                <Text style={[
                  styles.continueButtonText,
                  (!isFormValid) && styles.disabledButtonText
                ]}>
                  Continue
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>

      {/* Age Confirmation Modal */}
      {showAgeModal && (
        <View style={styles.ageModal}>
          <View style={styles.ageModalContent}>
            <View style={styles.ageModalIcon}>
              <Ionicons 
                name={calculatedAge && calculatedAge < 18 ? "warning" : "information-circle"} 
                size={48} 
                color={calculatedAge && calculatedAge < 18 ? "#EF4444" : "#FF4F81"} 
              />
            </View>
            
            <Text style={styles.ageModalTitle}>
              {calculatedAge && calculatedAge < 18 ? "Age Requirement" : "Confirm Your Age"}
            </Text>
            
            <Text style={styles.ageModalMessage}>
              {calculatedAge && calculatedAge < 18 
                ? "Sorry, you are too young to use this app. You must be at least 18 years old to create an account on DebsMatch."
                : `Are you sure you are ${calculatedAge} years old? This information cannot be changed later.`
              }
            </Text>
            
            <View style={styles.ageModalButtons}>
              {calculatedAge && calculatedAge < 18 ? (
                <TouchableOpacity
                  style={[styles.ageModalButton, styles.ageModalButtonPrimary]}
                  onPress={handleAgeModalCancel}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.ageModalButtonText, styles.ageModalButtonTextPrimary]}>
                    OK
                      </Text>
                </TouchableOpacity>
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.ageModalButton}
                    onPress={handleAgeModalCancel}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.ageModalButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.ageModalButton, styles.ageModalButtonPrimary]}
                    onPress={handleAgeModalConfirm}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.ageModalButtonText, styles.ageModalButtonTextPrimary]}>
                      Yes
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>
      )}
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
  nameInput: {
    marginBottom: 0, // Remove margin since wrapper handles it
  },
  usernameInput: {
    marginBottom: 0, // Remove margin since wrapper handles it
  },
  dateInput: {
    marginBottom: 0, // Remove margin since wrapper handles it
  },
  dateInputContainer: {
    marginTop: SPACING.md, // Using design system token
  },
  dateInputLabel: {
    fontSize: 14, // Small text size from design system
    color: '#6B7280', // Secondary text color from design system
    marginBottom: SPACING.sm, // Using design system token
    fontWeight: '500',
    fontFamily: Fonts.regular, // Inter Regular from design system
  },
  dateInputFields: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm, // Using design system token
  },
  dateField: {
    width: 60,
    height: 50,
    borderBottomWidth: 2,
    borderBottomColor: '#E5E7EB', // Light border color
    backgroundColor: 'transparent',
    fontSize: 18, // Large text for visibility
    color: '#1B1B3A', // Primary text color
    fontWeight: '600',
    fontFamily: Fonts.semiBold, // Poppins SemiBold from design system
  },
  dateSeparator: {
    fontSize: 18,
    color: '#6B7280', // Secondary text color
    fontWeight: '500',
    fontFamily: Fonts.medium, // Poppins Medium from design system
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
  continueButton: {
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
  continueButtonText: {
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
  suggestionsContainer: {
    marginTop: SPACING.sm, // Using design system token
    paddingHorizontal: 4,
  },
  suggestionsTitle: {
    fontSize: 14, // Small text size from design system
    color: '#6B7280', // Secondary text color from design system
    marginBottom: SPACING.sm, // Using design system token
    fontWeight: '500',
    fontFamily: Fonts.regular, // Inter Regular from design system
  },
  suggestionButton: {
    backgroundColor: '#F3F4F6', // Light gray background
    paddingHorizontal: SPACING.sm, // Using design system token
    paddingVertical: SPACING.sm, // Using design system token
    borderRadius: BORDER_RADIUS.sm, // Using design system token
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB', // Light border color
  },
  suggestionText: {
    fontSize: 14, // Small text size from design system
    color: '#FF4F81', // Primary pink from design system
    fontWeight: '500',
    fontFamily: Fonts.medium, // Poppins Medium from design system
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
    backgroundColor: '#FFFFFF', // Primary white background from design system
    borderRadius: 20,
    padding: SPACING.xl, // Using design system token
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
    marginBottom: SPACING.lg, // Using design system token
  },
  ageModalTitle: {
    fontSize: 20, // Large title size
    fontWeight: '700', // Bold weight
    color: '#1B1B3A', // Primary text color
    textAlign: 'center',
    marginBottom: SPACING.md, // Using design system token
    fontFamily: Fonts.bold, // Poppins Bold from design system
  },
  ageModalMessage: {
    fontSize: 16, // Body text size
    color: '#6B7280', // Secondary text color
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.xl, // Using design system token
    fontFamily: Fonts.regular, // Inter Regular from design system
  },
  ageModalButtons: {
    flexDirection: 'row',
    gap: SPACING.md, // Using design system token
    width: '100%',
  },
  ageModalButton: {
    flex: 1,
    paddingVertical: SPACING.md, // Using design system token
    paddingHorizontal: SPACING.lg, // Using design system token
    borderRadius: BORDER_RADIUS.md, // Using design system token
    borderWidth: 1,
    borderColor: '#E5E7EB', // Light border color
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF', // White background
  },
  ageModalButtonPrimary: {
    backgroundColor: '#FF4F81', // Primary pink from design system
    borderColor: '#FF4F81', // Primary pink from design system
  },
  ageModalButtonText: {
    fontSize: 16, // Body text size
    fontWeight: '600',
    color: '#6B7280', // Secondary text color
    fontFamily: Fonts.semiBold, // Poppins SemiBold from design system
  },
  ageModalButtonTextPrimary: {
    color: '#FFFFFF', // White text for primary button
  },
});
