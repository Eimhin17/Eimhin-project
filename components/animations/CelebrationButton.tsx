import React, { useRef, useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  View,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ConfettiCelebration } from './ConfettiCelebration';
import { playConfettiCelebrationHaptic } from '../../utils/haptics';
import { Fonts } from '../../utils/fonts';

interface CelebrationButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  style?: any;
  textStyle?: any;
  colors?: string[];
  enableConfetti?: boolean;
  confettiParticleCount?: number;
  confettiDuration?: number;
}

export const CelebrationButton: React.FC<CelebrationButtonProps> = ({
  title,
  onPress,
  disabled = false,
  style,
  textStyle,
  colors = ['#FF4F81', '#FF6B9D'],
  enableConfetti = true,
  confettiParticleCount = 50,
  confettiDuration = 3000,
}) => {
  const [showConfetti, setShowConfetti] = useState(false);

  // Animation values for button effects
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  const triggerCelebrationSequence = () => {
    if (disabled) return;

    // 1. Immediate button feedback with haptics
    playConfettiCelebrationHaptic();

    // 2. Button scale down animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.92,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1.05,
        tension: 100,
        friction: 3,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 150,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // 3. Pulsing effect for dopamine
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1.05,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // 4. Glow effect
    Animated.sequence([
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(glowAnim, {
        toValue: 0.3,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // 5. Shimmer sweep effect
    shimmerAnim.setValue(0);
    Animated.timing(shimmerAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // 6. Bounce celebration
    setTimeout(() => {
      Animated.sequence([
        Animated.spring(bounceAnim, {
          toValue: 1,
          tension: 120,
          friction: 4,
          useNativeDriver: true,
        }),
        Animated.spring(bounceAnim, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }, 200);

    // 7. Trigger confetti explosion
    if (enableConfetti) {
      setTimeout(() => {
        setShowConfetti(true);
      }, 250);
    }

    // 8. Execute callback
    setTimeout(() => {
      onPress();
    }, 300);
  };

  const handleConfettiComplete = () => {
    setShowConfetti(false);
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        activeOpacity={0.9}
        disabled={disabled}
        onPress={triggerCelebrationSequence}
        style={styles.touchable}
      >
        <Animated.View
          style={[
            styles.buttonContainer,
            {
              transform: [
                { scale: scaleAnim },
                { scale: pulseAnim },
                {
                  translateY: bounceAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -8],
                  })
                },
              ],
              shadowOpacity: disabled ? 0.1 : glowAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 0.8],
              }),
              shadowRadius: glowAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [12, 24],
              }),
              opacity: disabled ? 0.5 : 1,
            },
          ]}
        >
          <LinearGradient
            colors={disabled ? ['#D1D5DB', '#D1D5DB'] : colors}
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Shimmer overlay */}
            <Animated.View
              style={[
                styles.shimmerOverlay,
                {
                  opacity: shimmerAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0, 0.8, 0],
                  }),
                  transform: [
                    {
                      translateX: shimmerAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-200, 200],
                      }),
                    },
                  ],
                },
              ]}
              pointerEvents="none"
            >
              <LinearGradient
                colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.9)', 'rgba(255,255,255,0)']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.shimmerGradient}
              />
            </Animated.View>

            {/* Button text */}
            <Text style={[styles.buttonText, textStyle, disabled && styles.disabledText]}>
              {title}
            </Text>

            {/* Glow pulse overlay */}
            <Animated.View
              style={[
                styles.glowOverlay,
                {
                  opacity: glowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 0.3],
                  }),
                },
              ]}
              pointerEvents="none"
            />
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>

      {/* Confetti celebration */}
      <ConfettiCelebration
        isVisible={showConfetti}
        onComplete={handleConfettiComplete}
        particleCount={confettiParticleCount}
        duration={confettiDuration}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  touchable: {
    width: '100%',
  },
  buttonContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    minHeight: 56,
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
  gradient: {
    flex: 1,
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    position: 'relative',
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: -100,
    width: 200,
  },
  shimmerGradient: {
    flex: 1,
  },
  glowOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
  },
  buttonText: {
    fontFamily: Fonts.semiBold,
    fontWeight: '600',
    fontSize: 18,
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textAlign: 'center',
    zIndex: 1,
  },
  disabledText: {
    color: '#9CA3AF',
  },
});