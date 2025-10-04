import React, { useEffect, useRef } from 'react';
import { StyleSheet, Animated } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

type SwipeType = 'like' | 'dislike' | null;

interface Props {
  type: SwipeType;
  token: number | null;
  duration?: number;
  onComplete?: () => void;
}


export const SwipeResultOverlay: React.FC<Props> = ({ type, token, duration = 400, onComplete }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.5)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!type || token == null) return;

    // Reset all values
    opacity.setValue(0);
    scale.setValue(0.5);
    rotate.setValue(0);

    // Derive phase durations from requested total duration
    const inDuration = Math.max(60, Math.min(160, Math.floor(duration * 0.2)));
    const outDuration = Math.max(80, Math.min(220, Math.floor(duration * 0.35)));
    const settleTension = duration < 700 ? 200 : 180;
    const settleFriction = duration < 700 ? 10 : 9;

    // Main icon animation - quick pop
    Animated.sequence([
      // Burst in
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: inDuration,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1.2,
          tension: 150,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(rotate, {
          toValue: 1,
          tension: 150,
          friction: 10,
          useNativeDriver: true,
        }),
      ]),
      // Quick settle
      Animated.spring(scale, {
        toValue: 1.0,
        tension: settleTension,
        friction: settleFriction,
        useNativeDriver: true,
      }),
      // Fade out
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: outDuration,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1.3,
          duration: outDuration,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      onComplete?.();
    });
  }, [token, type]);

  if (!type) return null;

  const isLike = type === 'like';
  const iconName = isLike ? 'heart' : 'times';
  const primaryColor = isLike ? '#FF4F81' : '#c3b1e1';
  const secondaryColor = isLike ? '#FF6B9D' : '#D4C4F0';
  const glowColor = isLike ? '#FF1744' : '#9C7FCC';

  const rotateInterpolation = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', isLike ? '360deg' : '-360deg'],
  });

  return (
    <Animated.View style={[styles.container, { opacity }]} pointerEvents="none">
      {/* Main icon with rotation and scale */}
      <Animated.View
        style={{
          transform: [
            { scale: scale },
            { rotate: rotateInterpolation },
          ],
        }}
      >
        <LinearGradient
          colors={[primaryColor, secondaryColor]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconWrapper}
        >
          <FontAwesome5 name={iconName} size={60} color="#FFFFFF" solid />
        </LinearGradient>
      </Animated.View>
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
    zIndex: 9998,
  },
  iconWrapper: {
    width: 110,
    height: 110,
    borderRadius: 55,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.5)',
  },
});

export default SwipeResultOverlay;
