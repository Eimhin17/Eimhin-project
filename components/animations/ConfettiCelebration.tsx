import React, { useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ConfettiParticle {
  x: Animated.Value;
  y: Animated.Value;
  rotation: Animated.Value;
  scale: Animated.Value;
  opacity: Animated.Value;
  color: string;
  shape: 'circle' | 'square' | 'triangle' | 'star' | 'heart';
}

interface ConfettiCelebrationProps {
  isVisible: boolean;
  onComplete?: () => void;
  particleCount?: number;
  duration?: number;
  colors?: string[];
  enableHaptics?: boolean;
}

export const ConfettiCelebration: React.FC<ConfettiCelebrationProps> = ({
  isVisible,
  onComplete,
  particleCount = 50,
  duration = 3000,
  colors = ['#FF4F81', '#FF6B9D', '#FFB6C1', '#c3b1e1', '#DDA0DD', '#FFD700', '#FF69B4', '#00CED1'],
  enableHaptics = true,
}) => {
  const particlesRef = useRef<ConfettiParticle[]>([]);
  const containerOpacity = useRef(new Animated.Value(0)).current;

  // Initialize particles
  useEffect(() => {
    particlesRef.current = Array.from({ length: particleCount }, () => ({
      x: new Animated.Value(screenWidth / 2),
      y: new Animated.Value(screenHeight / 2),
      rotation: new Animated.Value(0),
      scale: new Animated.Value(0),
      opacity: new Animated.Value(0),
      color: colors[Math.floor(Math.random() * colors.length)],
      shape: (['circle', 'square', 'triangle', 'star', 'heart'] as const)[Math.floor(Math.random() * 5)],
    }));
  }, [particleCount, colors]);

  // Trigger confetti animation
  useEffect(() => {
    if (isVisible) {
      startCelebration();
    } else {
      stopCelebration();
    }
  }, [isVisible]);

  const playDopamineHapticSequence = () => {
    if (!enableHaptics) return;

    try {
      // Initial burst of excitement
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Rapid fire dopamine hits
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 100);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 200);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 300);
      setTimeout(() => Haptics.selectionAsync(), 400);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 500);

      // Building excitement
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 700);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 850);
      setTimeout(() => Haptics.selectionAsync(), 1000);

      // Peak celebration
      setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success), 1200);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 1350);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 1500);

      // Satisfying conclusion
      setTimeout(() => Haptics.selectionAsync(), 1700);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 1900);
      setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success), 2100);
    } catch (error) {
      console.warn('Confetti haptics failed:', error);
    }
  };

  const startCelebration = () => {
    // Reset all particles
    particlesRef.current.forEach(particle => {
      particle.x.setValue(screenWidth / 2);
      particle.y.setValue(screenHeight / 2);
      particle.rotation.setValue(0);
      particle.scale.setValue(0);
      particle.opacity.setValue(0);
    });

    // Show container
    Animated.timing(containerOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    // Play haptics
    playDopamineHapticSequence();

    // Animate particles in waves for maximum dopamine impact
    const waveCount = 3;
    const particlesPerWave = Math.ceil(particleCount / waveCount);

    for (let wave = 0; wave < waveCount; wave++) {
      const waveDelay = wave * 300; // Stagger waves

      setTimeout(() => {
        const startIndex = wave * particlesPerWave;
        const endIndex = Math.min(startIndex + particlesPerWave, particleCount);

        for (let i = startIndex; i < endIndex; i++) {
          const particle = particlesRef.current[i];
          if (!particle) continue;

          // Random explosion parameters for maximum visual impact
          const angle = (Math.random() * 360) * (Math.PI / 180);
          const velocity = 150 + Math.random() * 200;
          const finalX = screenWidth / 2 + Math.cos(angle) * velocity;
          const finalY = screenHeight / 2 + Math.sin(angle) * velocity - Math.random() * 100;

          const particleDelay = (i - startIndex) * 50; // Stagger within wave

          // Scale and opacity entrance
          setTimeout(() => {
            Animated.parallel([
              Animated.spring(particle.scale, {
                toValue: 0.8 + Math.random() * 0.4,
                tension: 120,
                friction: 3,
                useNativeDriver: true,
              }),
              Animated.timing(particle.opacity, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
              }),
            ]).start();
          }, particleDelay);

          // Movement and rotation
          setTimeout(() => {
            Animated.parallel([
              Animated.timing(particle.x, {
                toValue: finalX,
                duration: 2000 + Math.random() * 1000,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
              }),
              Animated.timing(particle.y, {
                toValue: finalY,
                duration: 2000 + Math.random() * 1000,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
              }),
              Animated.timing(particle.rotation, {
                toValue: 720 + Math.random() * 1080, // Multiple full rotations
                duration: 2000 + Math.random() * 1000,
                easing: Easing.out(Easing.linear),
                useNativeDriver: true,
              }),
            ]).start();
          }, particleDelay + 100);

          // Fade out
          setTimeout(() => {
            Animated.parallel([
              Animated.timing(particle.opacity, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
              }),
              Animated.timing(particle.scale, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
              }),
            ]).start();
          }, particleDelay + 1500);
        }
      }, waveDelay);
    }

    // Hide container and call completion
    setTimeout(() => {
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        onComplete?.();
      });
    }, duration);
  };

  const stopCelebration = () => {
    // Reset container
    containerOpacity.setValue(0);

    // Reset all particles
    particlesRef.current.forEach(particle => {
      particle.x.setValue(screenWidth / 2);
      particle.y.setValue(screenHeight / 2);
      particle.rotation.setValue(0);
      particle.scale.setValue(0);
      particle.opacity.setValue(0);
    });
  };

  const renderParticle = (particle: ConfettiParticle, index: number) => {
    const ParticleShape = () => {
      const baseStyle = {
        width: 12,
        height: 12,
        backgroundColor: particle.color,
      };

      switch (particle.shape) {
        case 'circle':
          return <View style={[baseStyle, { borderRadius: 6 }]} />;
        case 'square':
          return <View style={[baseStyle, { borderRadius: 2 }]} />;
        case 'triangle':
          return (
            <View
              style={{
                width: 0,
                height: 0,
                backgroundColor: 'transparent',
                borderStyle: 'solid',
                borderLeftWidth: 6,
                borderRightWidth: 6,
                borderBottomWidth: 12,
                borderLeftColor: 'transparent',
                borderRightColor: 'transparent',
                borderBottomColor: particle.color,
              }}
            />
          );
        case 'star':
          return (
            <View
              style={[
                baseStyle,
                {
                  borderRadius: 2,
                  transform: [{ rotate: '45deg' }],
                }
              ]}
            />
          );
        case 'heart':
          return (
            <View style={{ width: 12, height: 12 }}>
              <LinearGradient
                colors={[particle.color, particle.color]}
                style={{
                  width: 12,
                  height: 10,
                  borderTopLeftRadius: 6,
                  borderTopRightRadius: 6,
                  borderBottomLeftRadius: 0,
                  borderBottomRightRadius: 0,
                  transform: [{ rotate: '45deg' }],
                }}
              />
            </View>
          );
        default:
          return <View style={[baseStyle, { borderRadius: 6 }]} />;
      }
    };

    return (
      <Animated.View
        key={index}
        style={[
          styles.particle,
          {
            opacity: particle.opacity,
            transform: [
              { translateX: particle.x },
              { translateY: particle.y },
              { scale: particle.scale },
              {
                rotate: particle.rotation.interpolate({
                  inputRange: [0, 360],
                  outputRange: ['0deg', '360deg'],
                }),
              },
            ],
          },
        ]}
        pointerEvents="none"
      >
        <ParticleShape />
      </Animated.View>
    );
  };

  if (!isVisible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity: containerOpacity }
      ]}
      pointerEvents="none"
    >
      {particlesRef.current.map((particle, index) => renderParticle(particle, index))}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  particle: {
    position: 'absolute',
  },
});