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
  Dimensions
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useOnboarding } from '../../OnboardingContext';
import { SPACING, BORDER_RADIUS } from '../../utils/constants';
import { Colors, Gradients } from '../../utils/colors';
import { ProgressBar, BackButton, KeyboardButtonFooter } from '../../components/ui';
import { Fonts } from '../../utils/fonts';
import { OnboardingService } from '../../services/onboarding';
import { Ionicons } from '@expo/vector-icons';

export default function BioScreen() {
  const [bio, setBio] = useState('');
  const [isProgressAnimating, setIsProgressAnimating] = useState(false);
  const { data: onboardingData, updateData } = useOnboarding();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  
  // Button press animations
  const buttonScale = useRef(new Animated.Value(1)).current;
  const backButtonScale = useRef(new Animated.Value(1)).current;
  const progressFillAnim = useRef(new Animated.Value(0)).current;
  
  // ScrollView ref for keyboard handling
  const scrollViewRef = useRef<ScrollView>(null);
  const formRef = useRef<View>(null);
  const [hasFormBeenPositioned, setHasFormBeenPositioned] = useState(false);

  const { height: screenHeight } = Dimensions.get('window');

  // Load existing bio if available
  useEffect(() => {
    if (onboardingData?.bio) {
      setBio(onboardingData.bio);
    }
  }, [onboardingData?.bio]);

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
          
          // Scroll to position the form card slightly lower on the screen
          const scrollY = Math.max(0, y - 90); // Position to show form slightly lower
          
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

  const handleContinue = () => {
    // Save bio to onboarding data
    updateData({ bio: bio.trim() });
    
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
        router.push('/(onboarding)/dating-intentions');
      }, 200);
    });
  };

  const handleBackPress = () => {
    animateButtonPress(backButtonScale, () => {
      router.back();
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
              <Text style={styles.headerTitle}>Bio</Text>
              <View style={styles.progressContainer}>
                <ProgressBar 
                  currentStep={13} 
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
                <Ionicons name="create" size={40} color="#FF4F81" />
              </LinearGradient>
            </View>
            
            <Text style={styles.title}>Tell us about yourself</Text>
            <Text style={styles.subtitle}>
              Write a short bio that shows off you
            </Text>

            {/* Bio Input */}
            <Animated.View ref={formRef} style={[styles.formContainer, { opacity: formOpacity }]}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.bioInput}
                  value={bio}
                  onChangeText={setBio}
                  onFocus={handleInputFocus}
                  placeholder="Share something interesting about yourself..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={6}
                  maxLength={500}
                  textAlignVertical="top"
                />
                <Text style={styles.characterCount}>
                  {bio.length}/500
                </Text>
              </View>

              {/* Bio Tips */}
              <View style={styles.tipsContainer}>
                <View style={styles.tipsHeader}>
                  <Ionicons name="bulb" size={20} color="#FF4F81" />
                  <Text style={styles.tipsTitle}>Bio Tips</Text>
                </View>
                <Text style={styles.tipText}>• Share your interests or hobbies</Text>
                <Text style={styles.tipText}>• Mention what you're looking for</Text>
                <Text style={styles.tipText}>• Keep it positive and authentic</Text>
                <Text style={styles.tipText}>• Don't include personal contact info</Text>
              </View>
            </Animated.View>

          </Animated.View>
        </ScrollView>

        {/* Continue Button Footer */}
        <KeyboardButtonFooter
          onPress={handleContinue}
          title="Continue"
          animatedValue={buttonScale}
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
    marginBottom: SPACING.lg, // Using design system token
    lineHeight: 24,
    paddingHorizontal: SPACING.md, // Using design system token
    fontFamily: Fonts.regular, // Inter Regular from design system
  },
  formContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  inputContainer: {
    marginBottom: SPACING.lg, // Using design system token
  },
  bioInput: {
    backgroundColor: '#F8F8F8', // Tertiary background from design system
    borderRadius: 16, // Using design system token
    borderWidth: 1,
    borderColor: '#E5E7EB', // Light border color from design system
    paddingHorizontal: SPACING.lg, // Using design system token
    paddingVertical: SPACING.md, // Using design system token
    fontSize: 16, // Body text size from design system
    color: '#1B1B3A', // Primary text color from design system
    minHeight: 120,
    textAlignVertical: 'top',
    fontFamily: Fonts.regular, // Inter Regular from design system
  },
  characterCount: {
    fontSize: 12, // Small text size from design system
    color: '#9CA3AF', // Tertiary text color from design system
    textAlign: 'right',
    marginTop: SPACING.sm, // Using design system token
    fontFamily: Fonts.regular, // Inter Regular from design system
  },
  tipsContainer: {
    backgroundColor: '#F8F4FF', // Purple light background from design system
    borderRadius: 16, // Using design system token
    padding: SPACING.lg, // Using design system token
    marginBottom: SPACING.lg, // Using design system token
    borderWidth: 1,
    borderColor: '#D8BFD8', // Purple light border from design system
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md, // Using design system token
  },
  tipsTitle: {
    fontSize: 16, // Body text size from design system
    fontWeight: '600', // SemiBold weight for prominence
    color: '#1B1B3A', // Primary text color from design system
    marginLeft: SPACING.sm, // Using design system token
    fontFamily: Fonts.semiBold, // Poppins SemiBold from design system
  },
  tipText: {
    fontSize: 14, // Small text size from design system
    color: '#6B7280', // Secondary text color from design system
    lineHeight: 20,
    marginBottom: SPACING.xs, // Using design system token
    fontFamily: Fonts.regular, // Inter Regular from design system
  },
});
