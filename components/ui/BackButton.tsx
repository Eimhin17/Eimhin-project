import React, { useRef } from 'react';
import { TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING } from '../../utils/constants';
import { safeGoBack } from '../../utils/safeNavigation';
import { playLightHaptic } from '../../utils/haptics';

interface BackButtonProps {
  onPress?: () => void; // Now optional - will use safeGoBack if not provided
  currentStep?: string; // Current onboarding step for smart back navigation
  color?: string;
  size?: number;
  iconSize?: number;
  style?: any;
  activeOpacity?: number;
  animatedValue?: Animated.Value;
  direction?: 'left' | 'right';
}

export default function BackButton({
  onPress,
  currentStep,
  color = '#c3b1e1', // Default purple color from design system
  size = 72, // Default size from design system
  iconSize = 28, // Proportional icon size
  style,
  activeOpacity = 0.7,
  animatedValue,
  direction = 'left',
}: BackButtonProps) {
  // Use internal animation if no external animatedValue is provided
  const internalScale = useRef(new Animated.Value(1)).current;
  const scaleValue = animatedValue || internalScale;

  // Animate button press with haptic feedback
  const handlePress = () => {
    playLightHaptic();

    // Scale animation
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Execute custom onPress or default safeGoBack
      if (onPress) {
        onPress();
      } else {
        safeGoBack(currentStep);
      }
    });
  };

  const buttonStyle = [
    styles.backButton,
    { width: size, height: size },
    style,
  ];

  const iconStyle = { size: iconSize, color };
  const iconName = direction === 'right' ? 'arrow-forward' : 'arrow-back';

  return (
    <Animated.View style={[{ transform: [{ scale: scaleValue }] }]}>
      <TouchableOpacity
        onPress={handlePress}
        style={buttonStyle}
        activeOpacity={activeOpacity}
      >
        <Ionicons name={iconName as any} {...iconStyle} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
