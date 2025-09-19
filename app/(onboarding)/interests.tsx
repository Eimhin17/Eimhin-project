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
  Animated 
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
import { INTERESTS } from '../../utils/constants';

export default function Interests() {
  const { updateData } = useOnboarding();
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [isProgressAnimating, setIsProgressAnimating] = useState(false);
  const maxInterests = 5;

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  
  // Button press animations
  const buttonScale = useRef(new Animated.Value(1)).current;
  const backButtonScale = useRef(new Animated.Value(1)).current;
  const progressFillAnim = useRef(new Animated.Value(0)).current;

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

  const toggleInterest = (interest: string) => {
    // Quick scale animation for feedback
    const scaleValue = new Animated.Value(1);
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 1.05,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();

    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter(i => i !== interest));
    } else if (selectedInterests.length < maxInterests) {
      setSelectedInterests([...selectedInterests, interest]);
    } else {
      alert(`You can only select up to ${maxInterests} interests.`);
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

  const handleContinue = async () => {
    if (selectedInterests.length !== 5) {
      alert('Please select exactly 5 interests');
      return;
    }

    try {
      // Always store interests temporarily - don't try to save to database yet
      OnboardingService.storeTempData('interests', selectedInterests);
      console.log('💾 Interests stored temporarily:', selectedInterests);
      
      // Continue with onboarding regardless
      animateStepByStepProgress();
    } catch (error) {
      console.error('❌ Error handling interests:', error);
      // Still continue with onboarding even if there's an error
      animateStepByStepProgress();
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
        // Save selected interests to context
        updateData({
          interests: selectedInterests,
        });
        router.push('/(onboarding)/profile-prompts');
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
              <Text style={styles.headerTitle}>Interests</Text>
              <View style={styles.progressContainer}>
              <ProgressBar 
                currentStep={14} 
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
                <Ionicons name="heart" size={40} color="#FF4F81" />
              </LinearGradient>
            </View>
            
              <Text style={styles.title}>What are your interests?</Text>
              <Text style={styles.subtitle}>
                Select up to 5 interests that describe you best
              </Text>

            <Animated.View style={[styles.selectionInfoContainer, { opacity: formOpacity }]}>
              <Text style={styles.selectionInfo}>
                {selectedInterests.length}/5 selected
              </Text>
            </Animated.View>

            {/* Interests Grid */}
            <Animated.View style={[styles.interestsGrid, { opacity: formOpacity }]}>
              {INTERESTS.map((interest) => (
                <TouchableOpacity
                  key={interest}
                  style={[
                    styles.interestItem,
                    selectedInterests.includes(interest) && styles.interestItemSelected,
                  ]}
                  onPress={() => toggleInterest(interest)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.interestText,
                      selectedInterests.includes(interest) && styles.interestTextSelected,
                    ]}
                  >
                    {interest}
                  </Text>
                </TouchableOpacity>
              ))}
            </Animated.View>
          </Animated.View>
        </ScrollView>

        {/* Continue Button Footer */}
        <KeyboardButtonFooter
          onPress={handleContinue}
          title="Continue"
          animatedValue={buttonScale}
          disabled={selectedInterests.length !== 5}
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
  selectionInfoContainer: {
    marginBottom: SPACING.lg, // Using design system token
    alignItems: 'center',
  },
  selectionInfo: {
    fontSize: 14, // Small text size from design system
    color: '#FF4F81', // Primary pink from design system
    fontWeight: '600', // SemiBold weight
    backgroundColor: '#FFE5F0', // Light pink background from design system
    paddingHorizontal: SPACING.md, // Using design system token
    paddingVertical: SPACING.sm, // Using design system token
    borderRadius: 16, // Using design system token
    textAlign: 'center',
    fontFamily: Fonts.semiBold, // Poppins SemiBold from design system
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    gap: 0, // Remove gap since we're using space-between
  },
  interestItem: {
    backgroundColor: '#FFFFFF', // White background from design system
    borderRadius: 12, // Smaller border radius
    paddingHorizontal: SPACING.sm, // Smaller horizontal padding
    paddingVertical: SPACING.sm, // Smaller vertical padding
    marginBottom: SPACING.sm, // Smaller margin
    borderWidth: 2,
    borderColor: '#FFE5F0', // Light pink border from design system
    width: '49%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative', // For checkmark positioning
    shadowColor: '#FF4F81', // Pink shadow from design system
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 44, // Smaller minimum height
  },
  interestItemSelected: {
    backgroundColor: '#c3b1e1', // Primary purple from design system
    borderColor: '#c3b1e1', // Primary purple from design system
  },
  interestText: {
    fontSize: 14, // Smaller text size for compact buttons
    color: '#1B1B3A', // Primary text color from design system
    fontWeight: '600', // SemiBold weight
    textAlign: 'center',
    fontFamily: Fonts.semiBold, // Poppins SemiBold from design system
  },
  interestTextSelected: {
    color: '#FFFFFF', // White text for selected state
    fontWeight: '600', // SemiBold weight
    fontFamily: Fonts.semiBold, // Poppins SemiBold from design system
  },
});
