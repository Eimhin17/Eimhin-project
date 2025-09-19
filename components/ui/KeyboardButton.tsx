import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Platform,
  Animated
} from 'react-native';
import { SPACING } from '../../utils/constants';
import { Fonts } from '../../utils/fonts';

interface KeyboardButtonProps {
  onPress: () => void;
  title: string;
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
  animatedValue?: Animated.Value;
  style?: any;
  textStyle?: any;
}

export default function KeyboardButton({
  onPress,
  title,
  disabled = false,
  loading = false,
  loadingText = 'Loading...',
  animatedValue,
  style,
  textStyle
}: KeyboardButtonProps) {
  const buttonContent = (
    <Animated.View style={animatedValue ? { transform: [{ scale: animatedValue }] } : undefined}>
      <TouchableOpacity
        style={[
          styles.button,
          disabled && styles.disabledButton,
          style
        ]}
        onPress={onPress}
        activeOpacity={0.8}
        disabled={disabled || loading}
      >
        <Text style={[
          styles.buttonText,
          disabled && styles.disabledButtonText,
          textStyle
        ]}>
          {loading ? loadingText : title}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );

  return buttonContent;
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#FF4F81', // Primary pink from design system
    paddingVertical: 18, // From design system primary button spec
    paddingHorizontal: SPACING.xl, // Using design system token (32px)
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
  buttonText: {
    fontFamily: Fonts.semiBold, // Poppins SemiBold from design system
    fontWeight: '600', // SemiBold weight from design system
    fontSize: 18, // From design system primary button spec
    color: '#FFFFFF', // White text from design system
    letterSpacing: 0.5, // From design system primary button spec
  },
  disabledButton: {
    opacity: 0.5, // Reduced opacity for disabled state
  },
  disabledButtonText: {
    opacity: 0.7, // Slightly more visible text when disabled
  },
});
