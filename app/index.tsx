import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Animated, Platform, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useCustomFonts, Fonts } from '../utils/fonts';
import { AnimatedTextButton } from '../components/ui/AnimatedButton';

const { width, height } = Dimensions.get('window');

export default function LandingPage() {
  const fontsLoaded = useCustomFonts();
  const [showContent, setShowContent] = React.useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const logoAnim = useRef(new Animated.Value(0)).current;
  const buttonsSlideUp = useRef(new Animated.Value(50)).current;

  // Fallback timeout in case fonts don't load
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowContent(true);
    }, 3000); // 3 second timeout

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      // Staggered animations following design system principles
      Animated.sequence([
        // First animate logo
        Animated.timing(logoAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        // Then animate main content
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 80,
            friction: 8,
            useNativeDriver: true,
          }),
        ]),
        // Finally animate buttons sliding up
        Animated.timing(buttonsSlideUp, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded && !showContent) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading fonts...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* App Title */}
        <Animated.View 
          style={[
            styles.titleContainer,
            {
              opacity: logoAnim,
              transform: [
                { translateY: logoAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0]
                })}
              ],
            }
          ]}
        >
          <Text style={styles.appTitle}>
            <Text style={styles.debsText}>Debs</Text>
            <Text style={styles.matchText}>Match</Text>
          </Text>
        </Animated.View>

        {/* Large Image Section */}
        <Animated.View 
          style={[
            styles.imageContainer,
            {
              opacity: logoAnim,
              transform: [
                { scale: logoAnim },
                { translateY: logoAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0]
                })}
              ],
            }
          ]}
        >
          <Image
            source={require('../assets/Onboarding photo.png')}
            style={styles.largeImage}
            contentFit="contain"
          />
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View 
          style={[
            styles.actions,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { translateY: buttonsSlideUp }
              ],
            }
          ]}
        >
          <AnimatedTextButton
            text="Create Account"
            onPress={() => router.push('/(onboarding)/mascot-intro')}
            style={styles.primaryButton}
            textStyle={styles.primaryButtonText}
            rippleColor="rgba(255, 255, 255, 0.3)"
            borderRadius={16}
            hapticType={Haptics.ImpactFeedbackStyle.Heavy}
            enableHaptics={true}
          />

          <AnimatedTextButton
            text="Sign In"
            onPress={() => router.push('/(auth)/login')}
            style={styles.secondaryButton}
            textStyle={styles.secondaryButtonText}
            rippleColor="rgba(195, 177, 225, 0.3)"
            borderRadius={16}
            hapticType={Haptics.ImpactFeedbackStyle.Light}
            enableHaptics={true}
          />

          {/* Temporary Dev Button - Dating Intentions Page */}
          <TouchableOpacity
            style={styles.devButton}
            onPress={() => router.push('/(onboarding)/mascot-phase4')}
            activeOpacity={0.8}
          >
            <Text style={styles.devButtonText}>🚧 Dev: Phase 4 Page</Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Main Layout - Following design system exactly
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // 80% white background from design system
  },
  safeArea: {
    flex: 1,
  },
  
  // App Title Section
  titleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 32, // xl spacing from top
    paddingHorizontal: 20, // sm spacing for edge padding
  },
  appTitle: {
    fontFamily: Fonts.bold, // Poppins Bold from design system
    fontWeight: '700', // Bold weight from design system
    fontSize: 36, // Increased from 24px for bigger text
    lineHeight: 44, // Increased proportionally for better readability
    textAlign: 'center',
  },
  debsText: {
    color: '#FF4F81', // Pink from design system
  },
  matchText: {
    color: '#c3b1e1', // Purple from design system
  },
  
  // Large Image Section
  imageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20, // sm spacing for edge padding
  },
  largeImage: {
    width: width * 0.95, // Increased from 90% to 95% of screen width
    height: width * 0.95, // Square aspect ratio
    maxWidth: 450, // Increased from 400
    maxHeight: 450, // Increased from 400
  },
  
  // Action Buttons - Professional Design
  actions: {
    paddingHorizontal: 32, // xl spacing for better margins
    paddingBottom: 48, // 2xl spacing
    gap: 20, // lg spacing between buttons
  },
  primaryButton: {
    backgroundColor: '#FF4F81', // Primary pink from design system
    paddingVertical: 18, // Increased for better touch target
    paddingHorizontal: 32, // Increased for better proportions
    borderRadius: 16, // More rounded for modern look
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56, // Consistent button height
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
  primaryButtonText: {
    color: '#FFFFFF', // Inverse text color from design system
    fontSize: 18, // Slightly larger for better readability
    fontWeight: '600', // SemiBold weight
    fontFamily: Fonts.semiBold, // Poppins SemiBold
    letterSpacing: 0.5, // Better letter spacing
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF', // White background for contrast
    paddingVertical: 18, // Same as primary for consistency
    paddingHorizontal: 32, // Same as primary for consistency
    borderRadius: 16, // Same as primary for consistency
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56, // Same as primary for consistency
    borderWidth: 2, // From design system outline button spec
    borderColor: '#c3b1e1', // Purple from design system
    ...Platform.select({
      ios: {
        shadowColor: '#c3b1e1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
        shadowColor: '#c3b1e1',
      },
    }),
  },
  secondaryButtonText: {
    color: '#c3b1e1', // Purple from design system
    fontSize: 18, // Same as primary for consistency
    fontWeight: '600', // SemiBold weight
    fontFamily: Fonts.semiBold, // Poppins SemiBold
    letterSpacing: 0.5, // Better letter spacing
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  devButton: {
    backgroundColor: '#F3F4F6', // Light gray background
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  devButtonText: {
    color: '#6B7280', // Secondary text color
    fontSize: 14,
    fontWeight: '500',
    fontFamily: Fonts.regular,
  },
});
