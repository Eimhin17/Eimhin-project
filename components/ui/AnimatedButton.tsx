import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle, TextStyle, Text } from 'react-native';
import { Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useButtonPressAnimation } from '../../hooks/useButtonPressAnimation';

interface AnimatedButtonProps {
  onPress: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  children: React.ReactNode;
  rippleColor?: string;
  borderRadius?: number;
  delay?: number;
  disabled?: boolean;
  activeOpacity?: number;
  hapticType?: Haptics.ImpactFeedbackStyle;
  enableHaptics?: boolean;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  onPress,
  style,
  textStyle,
  children,
  rippleColor = 'rgba(255, 255, 255, 0.3)',
  borderRadius = 16,
  delay = 150,
  disabled = false,
  activeOpacity = 1,
  hapticType = Haptics.ImpactFeedbackStyle.Medium,
  enableHaptics = true,
}) => {
  const { animateButtonPress, getAnimatedStyle, getRippleStyle } = useButtonPressAnimation();

  const handlePress = () => {
    if (!disabled) {
      const hapticToUse = enableHaptics ? hapticType : undefined;
      animateButtonPress(onPress, delay, hapticToUse);
    }
  };

  return (
    <Animated.View style={getAnimatedStyle()}>
      <TouchableOpacity
        style={[styles.button, style, disabled && styles.disabled]}
        onPress={handlePress}
        activeOpacity={activeOpacity}
        disabled={disabled}
      >
        {/* Ripple Effect */}
        <Animated.View style={getRippleStyle(rippleColor, borderRadius)} />
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};

interface AnimatedTextButtonProps extends Omit<AnimatedButtonProps, 'children'> {
  text: string;
  textStyle?: TextStyle;
}

export const AnimatedTextButton: React.FC<AnimatedTextButtonProps> = ({
  text,
  textStyle,
  ...props
}) => {
  return (
    <AnimatedButton {...props}>
      <Text style={[styles.buttonText, textStyle]}>{text}</Text>
    </AnimatedButton>
  );
};

const styles = StyleSheet.create({
  button: {
    position: 'relative',
    overflow: 'hidden',
  },
  buttonText: {
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
});
