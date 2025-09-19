import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { SPACING } from '../../utils/constants';
import KeyboardButton from './KeyboardButton';

interface KeyboardButtonFooterProps {
  onPress: () => void;
  title: string;
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
  animatedValue?: Animated.Value;
  buttonStyle?: any;
  textStyle?: any;
  children?: React.ReactNode; // For additional content like info cards
}

export default function KeyboardButtonFooter({
  onPress,
  title,
  disabled = false,
  loading = false,
  loadingText = 'Loading...',
  animatedValue,
  buttonStyle,
  textStyle,
  children
}: KeyboardButtonFooterProps) {
  return (
    <View style={styles.footerContainer}>
      <Animated.View style={[styles.buttonContainer, { opacity: animatedValue || 1 }]}>
        <KeyboardButton
          onPress={onPress}
          title={title}
          disabled={disabled}
          loading={loading}
          loadingText={loadingText}
          animatedValue={animatedValue}
          style={buttonStyle}
          textStyle={textStyle}
        />
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  footerContainer: {
    backgroundColor: '#FFFFFF', // White background
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB', // Light border color
    paddingTop: SPACING.lg, // Consistent with design system grid
    paddingBottom: SPACING.md, // Consistent bottom padding
  },
  buttonContainer: {
    paddingHorizontal: SPACING.xl, // Using design system token (32px)
    paddingBottom: SPACING.sm, // Minimal bottom padding
  },
});
