import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors, Gradients } from '../../utils/colors';
import { LinearGradient } from 'expo-linear-gradient';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  showStepNumbers?: boolean;
  variant?: 'default' | 'gradient' | 'minimal';
  size?: 'small' | 'medium' | 'large';
  style?: any;
  fill?: Animated.Value;
  isAnimating?: boolean;
}

export default function ProgressBar({
  currentStep,
  totalSteps,
  showStepNumbers = true,
  variant = 'default',
  size = 'medium',
  style,
  fill,
  isAnimating = false,
}: ProgressBarProps) {
  const progressPercentage = ((currentStep - 1) / (totalSteps - 1)) * 100;
  
  // Use animated fill if provided, otherwise use static progress
  const animatedWidth = fill ? 
    fill.interpolate({
      inputRange: [0, 1],
      outputRange: [`${progressPercentage}%`, `${((currentStep) / (totalSteps - 1)) * 100}%`]
    }) : 
    `${progressPercentage}%` as const;

  const getProgressBarHeight = () => {
    switch (size) {
      case 'small': return 12;   // Increased from 8 to 12
      case 'medium': return 18;  // Increased from 12 to 18
      case 'large': return 24;   // Increased from 16 to 24
      default: return 18;        // Increased from 12 to 18
    }
  };

  const getStepNumberSize = () => {
    switch (size) {
      case 'small': return 12;
      case 'medium': return 14;
      case 'large': return 16;
      default: return 14;
    }
  };

  const renderProgressBar = () => {
    const height = getProgressBarHeight();
    
    if (variant === 'gradient') {
      return (
        <View style={[styles.progressTrack, { height }]}>
          <Animated.View style={[styles.progressBar, { width: animatedWidth, height }]}>
            <LinearGradient
              colors={['#FF4F81', '#c3b1e1', '#FF4F81']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientProgress}
            />
            {/* Add a subtle shine effect */}
            <View style={styles.progressShine} />
          </Animated.View>
        </View>
      );
    }

    return (
      <View style={[styles.progressTrack, { height }]}>
        <Animated.View 
          style={[
            styles.progressBar, 
            { 
              width: animatedWidth,
              height,
              backgroundColor: variant === 'minimal' 
                ? Colors.primary.pink[400] 
                : Colors.primary.pink[500]
            }
          ]} 
        />
      </View>
    );
  };

  return (
    <View style={[styles.container, style]}>
      {showStepNumbers && (
        <View style={styles.stepNumbersContainer}>
          <Text style={[styles.stepNumbers, { fontSize: getStepNumberSize() }]}>
            Step {currentStep} of {totalSteps}
          </Text>
        </View>
      )}
      
      {renderProgressBar()}
      
      {variant === 'minimal' && (
        <View style={styles.stepDots}>
          {Array.from({ length: totalSteps }, (_, index) => (
            <View
              key={index}
              style={[
                styles.stepDot,
                {
                  backgroundColor: index < currentStep 
                    ? Colors.primary.pink[500] 
                    : Colors.border.light,
                  width: getProgressBarHeight(),
                  height: getProgressBarHeight(),
                }
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  stepNumbersContainer: {
    marginBottom: 12,
    alignItems: 'center',
  },
  stepNumbers: {
    color: '#6B7280', // Secondary text color
    fontWeight: '600',
    letterSpacing: 0.5,
    fontSize: 12,
  },
  progressTrack: {
    width: '100%',
    backgroundColor: '#F3F4F6', // Light gray background
    borderRadius: 12,  // Increased from 6 to 12 for better appearance with much thicker bars
    overflow: 'hidden',
    shadowColor: '#FF4F81',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  progressBar: {
    borderRadius: 12,  // Increased from 6 to 12 for better appearance with much thicker bars
    backgroundColor: Colors.primary.pink[500],
    position: 'relative',
  },
  gradientProgress: {
    width: '100%',
    height: '100%',
  },
  progressShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
  },
  stepDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
  },
  stepDot: {
    borderRadius: 2,
  },
});
