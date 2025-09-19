import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, View, Platform } from 'react-native';
import { Colors, Gradients } from '../../utils/colors';
import { LinearGradient } from 'expo-linear-gradient';

interface ButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'gradient';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  loading?: boolean;
}

export default function Button({
  children,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  style,
  textStyle,
  icon,
  loading = false,
}: ButtonProps) {
  const getButtonStyle = () => {
    const baseStyle = [styles.button, styles[size], style];
    
    switch (variant) {
      case 'primary':
        return [...baseStyle, styles.primary];
      case 'secondary':
        return [...baseStyle, styles.secondary];
      case 'outline':
        return [...baseStyle, styles.outline];
      case 'gradient':
        return [...baseStyle, styles.gradient];
      default:
        return [...baseStyle, styles.primary];
    }
  };

  const getTextStyle = () => {
    const baseTextStyle = [styles.text, styles[`${size}Text`], textStyle];
    
    switch (variant) {
      case 'outline':
        return [...baseTextStyle, styles.outlineText];
      default:
        return [...baseTextStyle, styles.primaryText];
    }
  };

  const renderContent = () => (
    <>
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text style={getTextStyle()}>{children}</Text>
      {loading && (
        <View style={styles.loadingSpinner}>
          <Text style={styles.spinnerText}>⟳</Text>
        </View>
      )}
    </>
  );

  if (variant === 'gradient') {
    return (
      <TouchableOpacity
        style={getButtonStyle()}
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={Gradients.primary as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBackground}
        >
          {renderContent()}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {renderContent()}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadow.medium,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 1,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  primary: {
    backgroundColor: Colors.primary.pink[500],
  },
  secondary: {
    backgroundColor: Colors.primary.purple[500],
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.primary.pink[400],
  },
  gradient: {
    backgroundColor: 'transparent',
  },
  gradientBackground: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  small: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    minHeight: 44,
  },
  medium: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    minHeight: 52,
  },
  large: {
    paddingVertical: 18,
    paddingHorizontal: 36,
    minHeight: 60,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  primaryText: {
    color: Colors.text.inverse,
  },
  secondaryText: {
    color: Colors.text.inverse,
  },
  outlineText: {
    color: Colors.primary.pink[500],
  },
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },
  disabledText: {
    color: Colors.text.muted,
  },
  iconContainer: {
    marginRight: 8,
  },
  loadingSpinner: {
    marginLeft: 8,
  },
  spinnerText: {
    fontSize: 16,
    color: Colors.text.inverse,
  },
});
