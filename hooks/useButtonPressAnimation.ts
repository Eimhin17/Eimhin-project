import { useRef } from 'react';
import { Animated } from 'react-native';
import * as Haptics from 'expo-haptics';

export const useButtonPressAnimation = () => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rippleAnim = useRef(new Animated.Value(0)).current;

  const animateButtonPress = (callback: () => void, delay: number = 150, hapticType: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Medium) => {
    // Trigger haptic feedback immediately
    Haptics.impactAsync(hapticType);

    // Scale down animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Ripple effect
    Animated.sequence([
      Animated.timing(rippleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(rippleAnim, {
        toValue: 0,
        duration: 0,
        useNativeDriver: true,
      }),
    ]).start();

    // Execute callback after delay
    setTimeout(callback, delay);
  };

  const getAnimatedStyle = () => ({
    transform: [{ scale: scaleAnim }],
  });

  const getRippleStyle = (rippleColor: string = 'rgba(255, 255, 255, 0.3)', borderRadius: number = 16) => ({
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius,
    backgroundColor: rippleColor,
    transform: [{ scale: rippleAnim }],
    opacity: rippleAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.2, 0],
    }),
  });

  return {
    animateButtonPress,
    getAnimatedStyle,
    getRippleStyle,
  };
};
