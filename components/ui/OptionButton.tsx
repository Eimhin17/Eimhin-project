import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { Fonts } from '../../utils/fonts';

interface OptionButtonProps {
  label: string;
  emoji?: string;
  onPress: () => void;
  isActive?: boolean;
  style?: any;
  disabled?: boolean;
}

export default function OptionButton({ 
  label, 
  emoji, 
  onPress, 
  isActive = false, 
  style, 
  disabled = false 
}: OptionButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.optionButton,
        isActive && styles.optionButtonActive,
        disabled && styles.optionButtonDisabled,
        style
      ]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={disabled}
    >
      {emoji && <Text style={styles.optionEmoji}>{emoji}</Text>}
      <Text style={[
        styles.optionLabel,
        isActive && styles.optionLabelActive,
        disabled && styles.optionLabelDisabled
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  optionButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFE5F0',
    minHeight: 60,
    ...Platform.select({
      ios: {
        shadowColor: '#FF4F81',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
        shadowColor: '#FF4F81',
      },
    }),
  },
  optionButtonActive: {
    backgroundColor: '#FF4F81',
    borderColor: '#FF4F81',
  },
  optionButtonDisabled: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
    opacity: 0.6,
  },
  optionEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  optionLabel: {
    fontSize: 18,
    color: '#1B1B3A',
    fontWeight: '500',
    fontFamily: Fonts.regular,
  },
  optionLabelActive: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
  },
  optionLabelDisabled: {
    color: '#9CA3AF',
  },
});
