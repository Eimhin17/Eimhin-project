import React from 'react';
import { TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING } from '../../utils/constants';

interface BackButtonProps {
  onPress: () => void;
  color?: string;
  size?: number;
  iconSize?: number;
  style?: any;
  activeOpacity?: number;
  animatedValue?: Animated.Value;
}

export default function BackButton({
  onPress,
  color = '#c3b1e1', // Default purple color from design system
  size = 72, // Default size from design system
  iconSize = 28, // Proportional icon size
  style,
  activeOpacity = 0.7,
  animatedValue,
}: BackButtonProps) {
  const buttonStyle = [
    styles.backButton,
    { width: size, height: size },
    style,
  ];

  const iconStyle = { size: iconSize, color };

  if (animatedValue) {
    return (
      <Animated.View style={[{ transform: [{ scale: animatedValue }] }]}>
        <TouchableOpacity
          onPress={onPress}
          style={buttonStyle}
          activeOpacity={activeOpacity}
        >
          <Ionicons name="arrow-back" {...iconStyle} />
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      style={buttonStyle}
      activeOpacity={activeOpacity}
    >
      <Ionicons name="arrow-back" {...iconStyle} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
