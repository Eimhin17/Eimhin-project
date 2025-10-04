# Continue Button Animation Pattern - Complete Reference

This document contains the exact button animation and haptic pattern used in the email verification page. Use this as a reference to replicate the same animations on any continue button.

## Animation Values (useRef declarations)
```javascript
// Button press animations
const buttonScale = useRef(new Animated.Value(1)).current;
const backButtonScale = useRef(new Animated.Value(1)).current;
const progressFillAnim = useRef(new Animated.Value(0)).current;
const buttonHighlightAnim = useRef(new Animated.Value(0)).current;
```

## Animation Functions
```javascript
// Button press animation - scales button down then back up
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

// Button sweep animation - creates highlight effect
const triggerButtonSweep = () => {
  buttonHighlightAnim.stopAnimation();
  buttonHighlightAnim.setValue(0);
  Animated.timing(buttonHighlightAnim, {
    toValue: 1,
    duration: 750,
    easing: Easing.out(Easing.quad),
    useNativeDriver: true,
  }).start();
};

// Progress animation with haptics
const animateStepByStepProgress = () => {
  progressFillAnim.setValue(0);
  setIsProgressAnimating(true);
  const detachHaptics = attachProgressHaptics(progressFillAnim);
  
  Animated.timing(progressFillAnim, {
    toValue: 1,
    duration: 1000,
    useNativeDriver: false,
  }).start(() => {
    detachHaptics();
    setIsProgressAnimating(false);
    playOnboardingProgressHaptic(3, 5); // Adjust step numbers as needed
    // Navigate after smooth animation
    setTimeout(() => {
      // Navigation logic here
    }, 200);
  });
};
```

## Button Handler Pattern
```javascript
const handleContinue = async () => {
  if (!isFormValid) return; // Add validation check

  // 1. Immediate haptic feedback
  playLightHaptic();
  
  // 2. Trigger button sweep animation
  triggerButtonSweep();

  try {
    // 3. Any async operations here
    const result = await someAsyncOperation();
    
    if (result.success) {
      // 4. Button press animation with progress animation
      animateButtonPress(buttonScale, animateStepByStepProgress);
    } else {
      // Handle error
    }
  } catch (error) {
    // Handle error
  }
};
```

## Button JSX Structure
```jsx
<Animated.View style={[styles.floatingButtonContainer, { opacity: buttonOpacity }]}>
  <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
    <TouchableOpacity
      style={[
        styles.continueButton,
        (!isFormValid || isLoading) && styles.disabledButton
      ]}
      onPress={handleContinue}
      activeOpacity={0.8}
      disabled={!isFormValid || isLoading}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.buttonHighlight,
          {
            opacity: buttonHighlightAnim.interpolate({
              inputRange: [0, 0.2, 0.8, 1],
              outputRange: [0, 0.45, 0.25, 0],
            }),
            transform: [
              {
                translateX: buttonHighlightAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-220, 220],
                }),
              },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.6)', 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.buttonHighlightGradient}
        />
      </Animated.View>
      <Text style={[
        styles.continueButtonText,
        (!isFormValid || isLoading) && styles.disabledButtonText
      ]}>
        {isLoading ? 'Loading...' : 'Continue'}
      </Text>
    </TouchableOpacity>
  </Animated.View>
</Animated.View>
```

## Required Styles
```javascript
floatingButtonContainer: {
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: SPACING.lg,
  paddingHorizontal: SPACING.xl,
},
continueButton: {
  backgroundColor: '#FF4F81',
  paddingVertical: 18,
  paddingHorizontal: SPACING.xl,
  borderRadius: 16,
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 56,
  width: '100%',
  overflow: 'hidden',
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
buttonHighlight: {
  position: 'absolute',
  top: 0,
  bottom: 0,
  width: 180,
},
buttonHighlightGradient: {
  flex: 1,
  borderRadius: 16,
},
disabledButton: {
  opacity: 0.5,
},
disabledButtonText: {
  opacity: 0.7,
},
```

## Required Imports
```javascript
import { playLightHaptic, playOnboardingProgressHaptic, attachProgressHaptics } from '../../utils/haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Easing } from 'react-native';
```

## Animation Sequence
1. User taps button → `playLightHaptic()` + `triggerButtonSweep()`
2. Button scales down to 0.95 → scales back to 1.0
3. Button highlight sweeps across (left to right)
4. Progress bar fills with haptic feedback
5. Navigation occurs after 200ms delay

## Key Features
- **Haptic Feedback**: Light haptic on button press
- **Button Scale**: Button gets bigger (1.05x) then returns to normal
- **Sweep Animation**: White highlight sweeps across button
- **Progress Animation**: Progress bar fills with haptic feedback
- **Smooth Transitions**: All animations use native driver where possible
- **Error Handling**: Graceful handling of async operations

This pattern provides consistent, satisfying button interactions across all onboarding screens.
