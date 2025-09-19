import React, { useRef, useEffect } from 'react';
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
  Dimensions
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { SPACING, BORDER_RADIUS } from '../../utils/constants';
import { Fonts } from '../../utils/fonts';
import { BackButton } from '../../components/ui';

const { width, height } = Dimensions.get('window');

export default function MascotPhase2Screen() {
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const progressFillAnim = useRef(new Animated.Value(0)).current;
  
  // Button press animations
  const buttonScale = useRef(new Animated.Value(1)).current;
  const backButtonScale = useRef(new Animated.Value(1)).current;

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

  const handleContinue = () => {
    animateButtonPress(buttonScale, () => {
      router.push('/(onboarding)/basic-details');
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
              <View style={styles.progressContainer}>
                <Text style={styles.progressText}>Phase 2</Text>
                <Text style={styles.progressSubtext}>Profile setup</Text>
              </View>
            </View>
            
            <View style={styles.headerRight} />
          </Animated.View>

          {/* Main Content - Mascot Image */}
          <Animated.View style={[styles.content, { opacity: contentOpacity }]}>
            <View style={styles.mascotContainer}>
              <Image
                source={require('../../Images/profile mascot stage.png')}
                style={styles.mascotImage}
                contentFit="contain"
              />
            </View>
          </Animated.View>
        </ScrollView>

        {/* Continue Button */}
        <View style={styles.buttonContainer}>
          <Animated.View style={[styles.buttonWrapper, { opacity: buttonOpacity }]}>
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity
                style={styles.continueButton}
                onPress={handleContinue}
                activeOpacity={0.8}
              >
                <Text style={styles.continueButtonText}>
                  Continue
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </View>
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
  progressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    fontSize: 24, // Much larger for main title
    fontWeight: '600', // SemiBold weight for prominence
    color: '#1B1B3A', // Primary text color from design system
    fontFamily: Fonts.semiBold, // Poppins SemiBold from design system
  },
  progressSubtext: {
    fontSize: 18, // Larger for subtitle
    fontWeight: '400', // Regular weight for subtitle
    color: '#6B7280', // Secondary text color from design system
    fontFamily: Fonts.regular, // Poppins Regular from design system
    marginTop: 4, // Increased spacing between lines
  },
  headerRight: {
    width: 72, // Same size as back button for balance
    zIndex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 0, // No horizontal padding
    paddingTop: 0,        // No top padding
    paddingBottom: 0,     // No bottom padding
    // Grid-based layout structure
    display: 'flex',
    flexDirection: 'column',
  },
  mascotContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start', // Move image to the top
    paddingHorizontal: 0, // No horizontal padding
    paddingVertical: 0, // No vertical padding
  },
  mascotImage: {
    width: width * 1.2, // Wider than screen - 110% of screen width
    height: height * 0.7, // Much taller - 70% of screen height
    maxWidth: '100%', // No width constraint
    maxHeight: '100%', // No height constraint
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 32, // xl spacing from design system (matches first mascot)
    paddingBottom: 48, // 2xl spacing from design system (matches first mascot)
    backgroundColor: 'transparent',
  },
  buttonWrapper: {
    // Wrapper for animation
  },
  continueButton: {
    backgroundColor: '#FF4F81', // Primary pink from design system
    paddingVertical: 18, // From design system primary button spec
    paddingHorizontal: 32, // From design system primary button spec (matches first mascot)
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
});
