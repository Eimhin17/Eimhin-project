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
import { useOnboarding } from '../../OnboardingContext';
import { SPACING, BORDER_RADIUS } from '../../utils/constants';
import { Colors, Gradients } from '../../utils/colors';
import { ProgressBar, BackButton } from '../../components/ui';
import { Fonts } from '../../utils/fonts';
import { NotificationService } from '../../services/notifications';
import { Ionicons } from '@expo/vector-icons';

export default function NotificationsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean | null>(null);
  const [isProgressAnimating, setIsProgressAnimating] = useState(false);
  const { updateData } = useOnboarding();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  
  // Button press animations
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

  const handleNotificationSelect = async (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    
    if (enabled) {
      // Request notification permissions
      const permissionResult = await NotificationService.requestPermissions();
      
      if (permissionResult.granted) {
        console.log('✅ Notification permissions granted');
        
        // Schedule a test notification to verify it works
        await NotificationService.scheduleTestNotification();
        
        // Start progress animation
        animateStepByStepProgress(true);
      } else {
        console.log('❌ Notification permissions denied');
        
        if (permissionResult.canAskAgain) {
          // Show alert explaining why notifications are helpful
          Alert.alert(
            'Notifications Help You Stay Connected',
            'We\'ll notify you about new matches, messages, and important updates. You can change this later in settings.',
            [
              { text: 'Not Now', style: 'cancel', onPress: () => animateStepByStepProgress(false) },
              { 
                text: 'Try Again', 
                onPress: () => handleNotificationSelect(true) 
              }
            ]
          );
        } else {
          // User permanently denied, show settings option
          Alert.alert(
            'Notifications Disabled',
            'To enable notifications, please go to Settings > Notifications > DebsMatch and turn them on.',
            [
              { text: 'Continue', onPress: () => animateStepByStepProgress(false) },
              { 
                text: 'Open Settings', 
                onPress: async () => {
                  await NotificationService.openNotificationSettings();
                  animateStepByStepProgress(false);
                }
              }
            ]
          );
        }
      }
    } else {
      // User chose to skip notifications
      animateStepByStepProgress(false);
    }
  };

  const animateStepByStepProgress = (enabled: boolean) => {
    setIsProgressAnimating(true);
    
    // Animate from current step progress to next step progress
    Animated.timing(progressFillAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: false,
    }).start(() => {
      // Navigate after smooth animation
      setTimeout(() => {
        // Save notification preferences to context
        // If notifications are enabled, automatically enable all types
        updateData({
          notificationsEnabled: enabled,
        });
        router.push('/(onboarding)/community-guidelines');
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
              <Text style={styles.headerTitle}>Notifications</Text>
              <View style={styles.progressContainer}>
              <ProgressBar 
                  currentStep={16} 
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
                <Ionicons name="notifications" size={40} color="#FF4F81" />
              </LinearGradient>
            </View>
            
            <Text style={styles.title}>Enable Notifications</Text>
            <Text style={styles.subtitle}>
              Stay updated with your matches and messages
            </Text>

            {/* Notification Options */}
            <Animated.View style={[styles.optionsContainer, { opacity: formOpacity }]}>
              <TouchableOpacity
                style={styles.optionButton}
                onPress={() => handleNotificationSelect(true)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={
                    notificationsEnabled 
                      ? ['#FF4F81', '#FF4F81'] // Solid pink for active
                      : ['#FFFFFF', '#FFF0F5'] // White to light pink gradient for inactive
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.optionButtonGradient}
                >
                  <Ionicons 
                    name="notifications" 
                    size={24} 
                    color={notificationsEnabled ? '#FFFFFF' : '#c3b1e1'} 
                    style={styles.optionIcon}
                  />
                <Text style={[
                  styles.optionLabel,
                  notificationsEnabled && styles.optionLabelActive
                ]}>
                  Enable Notifications
                </Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionButton}
                onPress={() => handleNotificationSelect(false)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={
                    notificationsEnabled === false 
                      ? ['#FF4F81', '#FF4F81'] // Solid pink for active
                      : ['#FFFFFF', '#FFF0F5'] // White to light pink gradient for inactive
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.optionButtonGradient}
                >
                  <Ionicons 
                    name="arrow-forward" 
                    size={24} 
                    color={notificationsEnabled === false ? '#FFFFFF' : '#c3b1e1'} 
                    style={styles.optionIcon}
                  />
                <Text style={[
                  styles.optionLabel,
                    notificationsEnabled === false && styles.optionLabelActive
                ]}>
                  Skip for Now
                </Text>
                </LinearGradient>
              </TouchableOpacity>
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
    marginBottom: 0, // Remove bottom margin
    lineHeight: 24,
    paddingHorizontal: SPACING.md, // Using design system token
    fontFamily: Fonts.regular, // Inter Regular from design system
  },
  optionsContainer: {
    width: '100%',
    gap: SPACING.md, // Using design system token
    flex: 1, // Take up remaining space
    justifyContent: 'center', // Center the buttons in the available space
    paddingVertical: SPACING['2xl'], // Equal padding top and bottom
  },
  optionButton: {
    borderRadius: 16, // Same as continue button
    minHeight: 56, // Same as continue button
    borderWidth: 2,
    borderColor: '#FFE5F0', // Light pink border from design system
    shadowColor: '#FF4F81', // Pink shadow from design system
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden', // Ensure gradient doesn't overflow
  },
  optionButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start', // Push content to the left
    paddingVertical: 18, // Same as continue button
    paddingHorizontal: SPACING.xl, // Same as continue button (32px)
    borderRadius: 14, // Slightly smaller to account for border
  },
  optionIcon: {
    marginRight: SPACING.md, // Using design system token
  },
  optionLabel: {
    fontSize: 20, // Larger text size for better visibility
    color: '#1B1B3A', // Primary text color from design system
    fontWeight: '600', // SemiBold weight for more prominence
    fontFamily: Fonts.semiBold, // Poppins SemiBold from design system
  },
  optionLabelActive: {
    color: '#FFFFFF', // White text for active state
    fontWeight: '600', // SemiBold weight for prominence
    fontFamily: Fonts.semiBold, // Poppins SemiBold from design system
  },
});
