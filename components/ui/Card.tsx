import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity, Platform } from 'react-native';
import { Colors } from '../../utils/colors';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined' | 'gradient';
  padding?: 'small' | 'medium' | 'large';
  onPress?: () => void;
  disabled?: boolean;
}

export default function Card({
  children,
  style,
  variant = 'default',
  padding = 'medium',
  onPress,
  disabled = false,
}: CardProps) {
  const getCardStyle = () => {
    const baseStyle = [styles.card, styles[variant], styles[padding], style];
    
    if (disabled) {
      baseStyle.push(styles.disabled);
    }
    
    return baseStyle;
  };

  if (onPress) {
    return (
      <TouchableOpacity
        style={getCardStyle()}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.9}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={getCardStyle()}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    backgroundColor: Colors.background.primary,
    overflow: 'hidden',
  },
  default: {
    backgroundColor: Colors.background.primary,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  elevated: {
    backgroundColor: Colors.background.primary,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadow.medium,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 1,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  outlined: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.primary.pink[200],
  },
  gradient: {
    backgroundColor: Colors.primary.pink[50],
    borderWidth: 1,
    borderColor: Colors.primary.pink[100],
  },
  small: {
    padding: 16,
  },
  medium: {
    padding: 24,
  },
  large: {
    padding: 32,
  },
  disabled: {
    opacity: 0.6,
  },
});
