import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import { AnimatedButton, AnimatedTextButton } from './AnimatedButton';
import { Fonts } from '../../utils/fonts';

/**
 * Examples of how to use the AnimatedButton components throughout your app
 * 
 * Copy these examples and customize them for your specific use cases
 */

export const AnimatedButtonExamples = () => {
  return (
    <View style={styles.container}>
      {/* Basic Text Button */}
      <AnimatedTextButton
        text="Basic Button"
        onPress={() => console.log('Basic button pressed')}
        style={styles.basicButton}
        textStyle={styles.basicButtonText}
      />

      {/* Primary Button with Heavy Haptic */}
      <AnimatedTextButton
        text="Primary Action"
        onPress={() => console.log('Primary action')}
        style={styles.primaryButton}
        textStyle={styles.primaryButtonText}
        rippleColor="rgba(255, 255, 255, 0.4)"
        borderRadius={12}
        hapticType={Haptics.ImpactFeedbackStyle.Heavy}
        enableHaptics={true}
      />

      {/* Secondary Button with Light Haptic */}
      <AnimatedTextButton
        text="Secondary Action"
        onPress={() => console.log('Secondary action')}
        style={styles.secondaryButton}
        textStyle={styles.secondaryButtonText}
        rippleColor="rgba(195, 177, 225, 0.3)"
        borderRadius={8}
        hapticType={Haptics.ImpactFeedbackStyle.Light}
        enableHaptics={true}
      />

      {/* Disabled Button */}
      <AnimatedTextButton
        text="Disabled Button"
        onPress={() => console.log('This won\'t fire')}
        style={styles.disabledButton}
        textStyle={styles.disabledButtonText}
        disabled={true}
      />

      {/* Custom Button with Medium Haptic */}
      <AnimatedButton
        onPress={() => console.log('Custom button pressed')}
        style={styles.customButton}
        rippleColor="rgba(255, 79, 129, 0.2)"
        borderRadius={20}
        hapticType={Haptics.ImpactFeedbackStyle.Medium}
        enableHaptics={true}
      >
        <View style={styles.customButtonContent}>
          <Text style={styles.customButtonIcon}>🎉</Text>
          <Text style={styles.customButtonText}>Custom Button</Text>
        </View>
      </AnimatedButton>

      {/* Small Button */}
      <AnimatedTextButton
        text="Small"
        onPress={() => console.log('Small button')}
        style={styles.smallButton}
        textStyle={styles.smallButtonText}
        rippleColor="rgba(0, 0, 0, 0.1)"
        borderRadius={6}
        delay={100}
      />

      {/* Large Button with Heavy Haptic */}
      <AnimatedTextButton
        text="Large Action Button"
        onPress={() => console.log('Large button')}
        style={styles.largeButton}
        textStyle={styles.largeButtonText}
        rippleColor="rgba(255, 255, 255, 0.5)"
        borderRadius={24}
        delay={200}
        hapticType={Haptics.ImpactFeedbackStyle.Heavy}
        enableHaptics={true}
      />

      {/* Button with No Haptics */}
      <AnimatedTextButton
        text="Silent Button"
        onPress={() => console.log('Silent button')}
        style={styles.silentButton}
        textStyle={styles.silentButtonText}
        enableHaptics={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 16,
  },
  
  // Basic Button
  basicButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  basicButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
  },

  // Primary Button
  primaryButton: {
    backgroundColor: '#FF4F81',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#FF4F81',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
  },

  // Secondary Button
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#c3b1e1',
  },
  secondaryButtonText: {
    color: '#c3b1e1',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
  },

  // Disabled Button
  disabledButton: {
    backgroundColor: '#E5E7EB',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButtonText: {
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: '500',
    fontFamily: Fonts.regular,
  },

  // Custom Button
  customButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignItems: 'center',
  },
  customButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customButtonIcon: {
    fontSize: 20,
  },
  customButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
  },

  // Small Button
  smallButton: {
    backgroundColor: '#F9FAFB',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  smallButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: Fonts.regular,
  },

  // Large Button
  largeButton: {
    backgroundColor: '#059669',
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  largeButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    fontFamily: Fonts.bold,
  },

  // Silent Button
  silentButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  silentButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '500',
    fontFamily: Fonts.regular,
  },
});
