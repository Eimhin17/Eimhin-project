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
import { useOnboarding } from '../../OnboardingContext';
import { ProgressBar } from '../../components/ui';

export default function IntentionsScreen() {
  const [selectedIntent, setSelectedIntent] = useState<'Friendship' | 'Casual dating' | null>(null);
  const [isProgressAnimating, setIsProgressAnimating] = useState(false);
  const { updateData } = useOnboarding();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const optionsOpacity = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  
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
      Animated.timing(optionsOpacity, {
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

  const handleIntentSelect = (intent: 'Friendship' | 'Casual dating') => {
    setSelectedIntent(intent);
    
    // Start progress animation
    animateStepByStepProgress(intent);
  };

  const animateStepByStepProgress = (intent: 'Friendship' | 'Casual dating') => {
    setIsProgressAnimating(true);
    
    // Animate from current step progress to next step progress
    Animated.timing(progressFillAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: false,
    }).start(() => {
      // Navigate after smooth animation
    setTimeout(() => {
        updateData({ intentions: intent });
      router.push('/(onboarding)/relationship-status');
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
            <Animated.View style={{ transform: [{ scale: backButtonScale }] }}>
              <TouchableOpacity 
                onPress={handleBackPress} 
                style={styles.backButton}
                activeOpacity={0.7}
                >
                  <Text style={styles.backButtonText}>←</Text>
              </TouchableOpacity>
            </Animated.View>
            
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>What brings you to DebsMatch?</Text>
              <ProgressBar 
                currentStep={9} 
                totalSteps={15} 
                variant="gradient"
                size="small"
                fill={isProgressAnimating ? progressFillAnim : undefined}
                isAnimating={isProgressAnimating}
              />
            </View>
            
            <View style={styles.headerRight} />
          </Animated.View>

          {/* Main Content */}
          <View style={styles.content}>
            <View style={styles.illustrationContainer}>
                <Text style={styles.emoji}>🎯</Text>
            </View>
            
            <Text style={styles.title}>What brings you to DebsMatch?</Text>
            <Text style={styles.subtitle}>
              Choose the option that best describes your situation
            </Text>

            {/* Intent Options */}
            <View style={styles.optionsContainer}>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  selectedIntent === 'Friendship' && styles.optionButtonActive
                ]}
                onPress={() => handleIntentSelect('Friendship')}
              >
                <Text style={styles.optionEmoji}>👥</Text>
                <Text style={[
                  styles.optionLabel,
                  selectedIntent === 'Friendship' && styles.optionLabelActive
                ]}>
                  Looking for Friends
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.optionButton,
                  selectedIntent === 'Casual dating' && styles.optionButtonActive
                ]}
                onPress={() => handleIntentSelect('Casual dating')}
              >
                <Text style={styles.optionEmoji}>💕</Text>
                <Text style={[
                  styles.optionLabel,
                  selectedIntent === 'Casual dating' && styles.optionLabelActive
                ]}>
                  Looking for Dates
                </Text>
              </TouchableOpacity>
            </View>
              </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  backButton: {
    padding: 10,
    backgroundColor: '#FFE5F0',
    borderRadius: 20,
  },
  backButtonText: {
    fontSize: 24,
    color: '#FF4F81',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1B1B3A',
    marginBottom: 12,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  content: {
    alignItems: 'center',
  },
  illustrationContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFE5F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#FF4F81',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  emoji: {
    fontSize: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1B1B3A',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 16,
    color: '#FF4F81',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
    fontWeight: '500',
  },
  optionsContainer: {
    width: '100%',
    gap: 16,
  },
  optionButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFE5F0',
    shadowColor: '#FF4F81',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  optionButtonActive: {
    backgroundColor: '#FF4F81',
    borderColor: '#FF4F81',
  },
  optionEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  optionLabel: {
    fontSize: 18,
    color: '#1B1B3A',
    fontWeight: '500',
  },
  optionLabelActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
});
