import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors, GradientConfigs } from '../../utils/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { playLightHaptic } from '../../utils/haptics';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  showStepNumbers?: boolean;
  variant?: 'default' | 'gradient' | 'minimal';
  size?: 'small' | 'medium' | 'large';
  style?: any;
  fill?: Animated.Value;
  isAnimating?: boolean;
  useMoti?: boolean;
  gradientColors?: string[];
  gradientLocations?: number[];
  previousStep?: number;
  onAnimationComplete?: () => void;
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
  useMoti = false,
  gradientColors,
  gradientLocations,
  previousStep,
  onAnimationComplete,
}: ProgressBarProps) {
  const normalizedTotal = Math.max(totalSteps, 1);
  const clampedCurrentStep = Math.min(Math.max(currentStep, 0), normalizedTotal);
  const clampedPreviousStep = Math.min(
    Math.max(previousStep ?? clampedCurrentStep - 1, 0),
    normalizedTotal,
  );
  const basePercentage = Math.min(100, Math.max(0, (clampedPreviousStep / normalizedTotal) * 100));
  const targetPercentage = Math.min(100, Math.max(0, (clampedCurrentStep / normalizedTotal) * 100));
  const baseWidth = `${basePercentage}%` as const;
  const targetWidth = `${targetPercentage}%` as const;
  const animatedWidth = fill ?
    fill.interpolate({
      inputRange: [0, 1],
      outputRange: [baseWidth, targetWidth],
    }) :
    baseWidth;
  const celebrationAnim = React.useRef(new Animated.Value(0)).current;
  const isCompleted = totalSteps > 0 && clampedCurrentStep >= totalSteps;
  const [shouldCelebrate, setShouldCelebrate] = React.useState(false);
  const [trackWidth, setTrackWidth] = React.useState<number | null>(null);

  // Enhanced dot animations
  const dotAnimValues = React.useRef(
    Array.from({ length: totalSteps }, () => new Animated.Value(0))
  ).current;
  const morphAnimValues = React.useRef(
    Array.from({ length: totalSteps }, () => new Animated.Value(0))
  ).current;
  const [prevCurrentStep, setPrevCurrentStep] = React.useState(currentStep);

  // Listen for fill animation completion
  React.useEffect(() => {
    if (fill && isCompleted && isAnimating) {
      const listener = fill.addListener(({ value }) => {
        if (value >= 1 && !shouldCelebrate) {
          setShouldCelebrate(true);
          if (onAnimationComplete) {
            onAnimationComplete();
          }
        }
      });

      return () => {
        fill.removeListener(listener);
      };
    }
  }, [fill, isCompleted, isAnimating, shouldCelebrate, onAnimationComplete]);

  // Enhanced dot animation effect
  React.useEffect(() => {
    if (variant === 'minimal' && currentStep !== prevCurrentStep) {
      // Play haptic feedback for step change
      playLightHaptic();

      // Separate native and non-native animations
      const nativeAnimations: Animated.CompositeAnimation[] = [];
      const nonNativeAnimations: Animated.CompositeAnimation[] = [];

      for (let i = 0; i < totalSteps; i++) {
        const isActive = i < currentStep;
        const wasActive = i < prevCurrentStep;

        // If this dot is transitioning, create morph animation (native)
        if (isActive !== wasActive) {
          nativeAnimations.push(
            Animated.sequence([
              // Scale up with bounce
              Animated.timing(morphAnimValues[i], {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
              }),
              // Scale back down
              Animated.timing(morphAnimValues[i], {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
              }),
            ])
          );
        }

        // Color transition animation (non-native)
        nonNativeAnimations.push(
          Animated.timing(dotAnimValues[i], {
            toValue: isActive ? 1 : 0,
            duration: 400,
            useNativeDriver: false,
          })
        );
      }

      // Run native and non-native animations in parallel
      Animated.parallel([
        Animated.parallel(nativeAnimations),
        Animated.parallel(nonNativeAnimations)
      ]).start();

      setPrevCurrentStep(currentStep);
    }
  }, [currentStep, prevCurrentStep, variant, totalSteps, dotAnimValues, morphAnimValues]);

  React.useEffect(() => {
    if (shouldCelebrate) {
      celebrationAnim.stopAnimation();
      celebrationAnim.setValue(0);
      Animated.sequence([
        Animated.timing(celebrationAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.delay(150),
        Animated.timing(celebrationAnim, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      celebrationAnim.stopAnimation();
      celebrationAnim.setValue(0);
    }
  }, [shouldCelebrate, celebrationAnim]);

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
      const defaultGradient = GradientConfigs.phaseOneProgress;
      const gradientPalette = gradientColors && gradientColors.length > 0
        ? gradientColors
        : defaultGradient.colors;
      const gradientStops = gradientLocations && gradientLocations.length > 0
        ? gradientLocations
        : defaultGradient.locations;

      // Prefer pixel-based animation when animating (more reliable than %)
      const baseCoverPercent = Math.max(0, 100 - basePercentage);
      const targetCoverPercent = Math.max(0, 100 - targetPercentage);
      const baseCoverPx = trackWidth != null ? (baseCoverPercent / 100) * trackWidth : null;
      const targetCoverPx = trackWidth != null ? (targetCoverPercent / 100) * trackWidth : null;
      const baseCoverWidth = `${baseCoverPercent}%` as const;
      const targetCoverWidth = `${targetCoverPercent}%` as const;
      const animateWithPixels = Boolean(fill && trackWidth != null);
      const coverAnimatedWidth = fill ?
        (animateWithPixels
          ? fill.interpolate({ inputRange: [0, 1], outputRange: [baseCoverPx as number, targetCoverPx as number] })
          : fill.interpolate({ inputRange: [0, 1], outputRange: [baseCoverWidth, targetCoverWidth] })
        ) : (trackWidth != null ? (baseCoverPx as number) : baseCoverWidth);

      const borderRadius = height / 2;

      return (
        <View
          style={[styles.progressTrack, { height, borderRadius }] }
          onLayout={(e) => {
            const w = e.nativeEvent.layout.width;
            if (w && w !== trackWidth) setTrackWidth(w);
          }}
        >
          <LinearGradient
            colors={gradientPalette}
            locations={gradientStops}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.gradientBackground, { borderRadius }]}
          />
          <View style={[styles.progressShine, { borderRadius }]} pointerEvents="none" />
          <Animated.View
            style={[styles.progressCover, {
              width: coverAnimatedWidth,
              borderTopLeftRadius: 0,
              borderBottomLeftRadius: 0,
              borderTopRightRadius: borderRadius,
              borderBottomRightRadius: borderRadius,
            }]}
          />
        </View>
      );
    }

    const progressColor = variant === 'minimal'
      ? Colors.primary.pink[400]
      : Colors.primary.pink[500];
    const borderRadius = height / 2;

    // Default variant: animate width; prefer pixel-based when animating
    const baseWidthPercent = basePercentage;
    const targetWidthPercent = targetPercentage;
    const baseWidthPx = trackWidth != null ? (baseWidthPercent / 100) * trackWidth : null;
    const targetWidthPx = trackWidth != null ? (targetWidthPercent / 100) * trackWidth : null;
    const baseWidth = `${baseWidthPercent}%` as const;
    const targetWidth = `${targetWidthPercent}%` as const;
    const animateWithPixels = Boolean(fill && trackWidth != null);
    const barAnimatedWidth = fill ?
      (animateWithPixels
        ? fill.interpolate({ inputRange: [0, 1], outputRange: [baseWidthPx as number, targetWidthPx as number] })
        : fill.interpolate({ inputRange: [0, 1], outputRange: [baseWidth, targetWidth] })
      ) : (trackWidth != null ? (baseWidthPx as number) : baseWidth);

    return (
      <View
        style={[styles.progressTrack, { height, borderRadius }] }
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          if (w && w !== trackWidth) setTrackWidth(w);
        }}
      >
        <Animated.View 
          style={[styles.progressBar, {
            width: barAnimatedWidth,
            height,
            backgroundColor: progressColor,
            borderRadius,
          }]} 
        />
      </View>
    );
  };

  const celebrationScale = celebrationAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.08, 1.02],
  });

  const celebrationGlowOpacity = celebrationAnim.interpolate({
    inputRange: [0, 0.2, 0.6, 1],
    outputRange: [0, 0.4, 0.25, 0],
  });

  const celebrationBurstScale = celebrationAnim.interpolate({
    inputRange: [0, 0.35, 0.7, 1],
    outputRange: [0.8, 1.2, 1.4, 1.1],
  });

  const celebrationBurstOpacity = celebrationAnim.interpolate({
    inputRange: [0, 0.15, 0.6, 1],
    outputRange: [0, 0.5, 0.3, 0],
  });

  const progressBarContent = renderProgressBar();

  return (
    <View style={[styles.container, style]}>
      {showStepNumbers && (
        <View style={styles.stepNumbersContainer}>
          <Text style={[styles.stepNumbers, { fontSize: getStepNumberSize() }]}>
            Step {currentStep} of {totalSteps}
          </Text>
        </View>
      )}
      
      <Animated.View style={[styles.celebrationWrapper, { transform: [{ scale: celebrationScale }] }] }>
        {progressBarContent}
        {shouldCelebrate && (
          <Animated.View
            pointerEvents="none"
            style={[styles.celebrationGlow, { opacity: celebrationGlowOpacity }]}
          />
        )}
        {shouldCelebrate && (
          <Animated.View
            pointerEvents="none"
            style={[styles.celebrationBurst,
              {
                opacity: celebrationBurstOpacity,
                transform: [{ scale: celebrationBurstScale }],
              },
            ]}
          >
            <LinearGradient
              colors={['rgba(255,79,129,0.6)', 'rgba(195,177,225,0.6)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.celebrationBurstFill}
            />
          </Animated.View>
        )}
      </Animated.View>
      
      {variant === 'minimal' && (
        <View style={styles.stepDots}>
          {Array.from({ length: totalSteps }, (_, index) => {
            const backgroundColor = dotAnimValues[index].interpolate({
              inputRange: [0, 1],
              outputRange: [Colors.border.light, Colors.primary.pink[500]],
            });

            const morphScale = morphAnimValues[index].interpolate({
              inputRange: [0, 1],
              outputRange: [1, 1.3],
            });

            const dotSize = getProgressBarHeight();

            return (
              <Animated.View
                key={index}
                style={[
                  styles.stepDot,
                  {
                    backgroundColor,
                    width: dotSize,
                    height: dotSize,
                    transform: [{ scale: morphScale }],
                    shadowColor: Colors.primary.pink[500],
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: dotAnimValues[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 0.3],
                    }),
                    shadowRadius: 4,
                    elevation: dotAnimValues[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 4],
                    }),
                  }
                ]}
              />
            );
          })}
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
    position: 'relative',
  },
  progressBar: {
    borderRadius: 12,
    backgroundColor: Colors.primary.pink[500],
    position: 'relative',
  },
  progressShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  gradientBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  progressCover: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    backgroundColor: '#F3F4F6',
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  celebrationWrapper: {
    position: 'relative',
  },
  celebrationGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  celebrationBurst: {
    position: 'absolute',
    top: -6,
    bottom: -6,
    left: -6,
    right: -6,
    borderRadius: 999,
    overflow: 'hidden',
  },
  celebrationBurstFill: {
    flex: 1,
  },
  stepDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
  },
  stepDot: {
    borderRadius: 999, // Make fully circular
  },
});
