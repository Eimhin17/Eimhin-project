import React, { useRef, useEffect } from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';

interface CardRevealAnimationProps {
  children: React.ReactNode;
  trigger: any; // Key that changes when new card should be revealed
  animationType?: 'gentlePop' | 'slideUpFade';
  enableHaptics?: boolean;
  onAnimationComplete?: () => void;
}

export const CardRevealAnimation: React.FC<CardRevealAnimationProps> = ({
  children,
  trigger,
  animationType = 'gentlePop',
  enableHaptics = true,
  onAnimationComplete,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (trigger) {
      startRevealAnimation();
    }
  }, [trigger]);

  const startRevealAnimation = () => {
    // Reset animation values
    if (animationType === 'gentlePop') {
      scaleAnim.setValue(0.95);
      opacityAnim.setValue(0);
      translateYAnim.setValue(0);
    } else if (animationType === 'slideUpFade') {
      scaleAnim.setValue(1);
      opacityAnim.setValue(0);
      translateYAnim.setValue(20);
    }

    // Play haptic feedback for gentle pop only (not too frequent)
    if (enableHaptics && animationType === 'gentlePop') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (error) {
        console.warn('Haptic feedback failed:', error);
      }
    }

    // Execute animation based on type
    if (animationType === 'gentlePop') {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1.0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onAnimationComplete?.();
      });
    } else if (animationType === 'slideUpFade') {
      Animated.parallel([
        Animated.timing(translateYAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onAnimationComplete?.();
      });
    }
  };

  const getAnimatedStyle = () => {
    const baseStyle = {
      opacity: opacityAnim,
    };

    if (animationType === 'gentlePop') {
      return {
        ...baseStyle,
        transform: [{ scale: scaleAnim }],
      };
    } else if (animationType === 'slideUpFade') {
      return {
        ...baseStyle,
        transform: [{ translateY: translateYAnim }],
      };
    }

    return baseStyle;
  };

  return (
    <Animated.View style={[styles.container, getAnimatedStyle()]}>
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});