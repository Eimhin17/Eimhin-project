import React, { useRef, useEffect } from 'react';
import {
  Animated,
  View,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import ScrollableProfileCard, { ProfileData } from './ScrollableProfileCard';
import { FontAwesome5 } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const SWIPE_THRESHOLD = width * 0.25;

interface AnimatedProfileCardProps {
  profile: ProfileData;
  stackPosition: number; // 0=front, 1=middle, 2=back
  zIndex: number;
  isSwipeable: boolean;
  onSwipe?: (direction: 'left' | 'right') => void;
  onUndo?: () => void;
  canUndo?: boolean;
  onLike?: () => void;
  onDislike?: () => void;
  onReport?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const AnimatedProfileCard: React.FC<AnimatedProfileCardProps> = ({
  profile,
  stackPosition,
  zIndex,
  isSwipeable,
  onSwipe,
  onUndo,
  canUndo,
  onLike,
  onDislike,
  onReport,
  onRefresh,
  isRefreshing,
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const stackTranslateY = useRef(new Animated.Value(0)).current;
  const stackScale = useRef(new Animated.Value(1)).current;
  const stackTranslateX = useRef(new Animated.Value(0)).current;
  const stackOpacity = useRef(new Animated.Value(1)).current;

  const lastHapticLevel = useRef<string | null>(null);
  const profileCardRef = useRef<any>(null);

  // Haptic feedback thresholds
  const HAPTIC_THRESHOLDS = {
    LIGHT: width * 0.1,
    MEDIUM: width * 0.2,
    HEAVY: width * 0.3,
  };

  // Animate to stack position
  useEffect(() => {
    const targetTransform = getStackTransform(stackPosition);

    Animated.parallel([
      Animated.timing(stackTranslateY, {
        toValue: targetTransform.translateY,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(stackScale, {
        toValue: targetTransform.scale,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(stackTranslateX, {
        toValue: targetTransform.translateX,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(stackOpacity, {
        toValue: targetTransform.opacity,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [stackPosition]);

  const getStackTransform = (position: number) => {
    return {
      translateY: position * 8, // Cards stack slightly lower
      scale: 1 - (position * 0.05), // Cards get slightly smaller behind
      translateX: position * 4, // Slight horizontal offset for peek effect
      opacity: position === 2 ? 0.6 : 1, // Back card is more transparent
    };
  };

  const getHapticIntensity = (translationX: number) => {
    const absX = Math.abs(translationX);

    if (absX >= HAPTIC_THRESHOLDS.HEAVY) {
      return { level: 'HEAVY', style: Haptics.ImpactFeedbackStyle.Heavy };
    } else if (absX >= HAPTIC_THRESHOLDS.MEDIUM) {
      return { level: 'MEDIUM', style: Haptics.ImpactFeedbackStyle.Medium };
    } else if (absX >= HAPTIC_THRESHOLDS.LIGHT) {
      return { level: 'LIGHT', style: Haptics.ImpactFeedbackStyle.Light };
    }

    return null;
  };

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }], // Only track horizontal movement
    {
      useNativeDriver: false,
      listener: (event: any) => {
        if (!isSwipeable) return;

        const { translationX } = event.nativeEvent;

        // Keep vertical position locked
        translateY.setValue(0);

        // Haptic feedback during swipe
        const hapticInfo = getHapticIntensity(translationX);
        if (hapticInfo && lastHapticLevel.current !== hapticInfo.level) {
          Haptics.impactAsync(hapticInfo.style);
          lastHapticLevel.current = hapticInfo.level;
        } else if (Math.abs(translationX) < HAPTIC_THRESHOLDS.LIGHT) {
          lastHapticLevel.current = null;
        }
      }
    }
  );

  const onHandlerStateChange = (event: any) => {
    if (!isSwipeable) return;

    if (event.nativeEvent.state === State.BEGAN) {
      lastHapticLevel.current = null;
    } else if (event.nativeEvent.state === State.END) {
      const { translationX } = event.nativeEvent;

      if (translationX > SWIPE_THRESHOLD) {
        // Swipe right - Like
        animateOffScreen('right');
        onLike?.();
        setTimeout(() => onSwipe?.('right'), 100);
      } else if (translationX < -SWIPE_THRESHOLD) {
        // Swipe left - Pass
        animateOffScreen('left');
        onDislike?.();
        setTimeout(() => onSwipe?.('left'), 100);
      } else {
        // Return to center - only animate horizontal position
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: false,
          tension: 100,
          friction: 8,
        }).start();
        // Keep vertical position at 0
        translateY.setValue(0);
      }
    }
  };

  const animateOffScreen = (direction: 'left' | 'right') => {
    const targetX = direction === 'right' ? width * 1.5 : -width * 1.5;

    Animated.parallel([
      Animated.timing(translateX, {
        toValue: targetX,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Calculate rotation based on horizontal movement (only for front card)
  const cardRotation = translateX.interpolate({
    inputRange: [-width / 2, 0, width / 2],
    outputRange: ['-10deg', '0deg', '10deg'],
    extrapolate: 'clamp',
  });

  // Like overlay opacity (shows when swiping right)
  const likeOverlayOpacity = translateX.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  // Dislike overlay opacity (shows when swiping left)
  const dislikeOverlayOpacity = translateX.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <View
      style={[
        styles.cardContainer,
        {
          zIndex,
          position: stackPosition === 0 ? 'relative' : 'absolute',
          top: stackPosition === 0 ? 0 : 0,
          left: stackPosition === 0 ? 0 : 0,
          right: stackPosition === 0 ? 0 : 0,
        }
      ]}
    >
      <PanGestureHandler
        onGestureEvent={isSwipeable ? onGestureEvent : undefined}
        onHandlerStateChange={isSwipeable ? onHandlerStateChange : undefined}
        enabled={isSwipeable}
        activeOffsetX={[-10, 10]} // Only activate when horizontal movement is at least 10 pixels
        failOffsetY={[-20, 20]}   // Fail gesture if vertical movement exceeds 20 pixels
        shouldCancelWhenOutside={false}
      >
        <Animated.View
          style={[
            styles.animatedCard,
            {
              opacity: stackOpacity,
              transform: [
                { translateX: isSwipeable ? translateX : 0 },
                { translateY: isSwipeable ? translateY : 0 },
                { translateX: stackTranslateX },
                { translateY: stackTranslateY },
                { scale: stackScale },
                { rotate: isSwipeable ? cardRotation : '0deg' },
              ],
            },
          ]}
        >
          <ScrollableProfileCard
            ref={profileCardRef}
            profile={profile}
            onUndo={isSwipeable ? onUndo : undefined}
            canUndo={isSwipeable ? canUndo : false}
            onLike={isSwipeable ? onLike : undefined}
            onDislike={isSwipeable ? onDislike : undefined}
            onReport={isSwipeable ? onReport : undefined}
            isRefreshing={isSwipeable ? isRefreshing : false}
            onRefresh={isSwipeable ? onRefresh : undefined}
          />

          {/* Swipe Overlays - Only show on front card */}
          {isSwipeable && (
            <>
              {/* Like Overlay - Pink */}
              <Animated.View
                style={[
                  styles.swipeOverlay,
                  styles.likeOverlay,
                  { opacity: likeOverlayOpacity }
                ]}
                pointerEvents="none"
              >
                <FontAwesome5 name="heart" size={60} color="#FFFFFF" />
                <Text style={styles.swipeOverlayText}>LIKE</Text>
              </Animated.View>

              {/* Dislike Overlay - Purple */}
              <Animated.View
                style={[
                  styles.swipeOverlay,
                  styles.dislikeOverlay,
                  { opacity: dislikeOverlayOpacity }
                ]}
                pointerEvents="none"
              >
                <FontAwesome5 name="times" size={60} color="#FFFFFF" />
                <Text style={styles.swipeOverlayText}>NOPE</Text>
              </Animated.View>
            </>
          )}
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    flex: 1,
    width: '100%',
  },
  animatedCard: {
    flex: 1,
    width: '100%',
  },
  swipeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  likeOverlay: {
    backgroundColor: 'rgba(255, 79, 129, 0.8)',
  },
  dislikeOverlay: {
    backgroundColor: 'rgba(195, 177, 225, 0.8)',
  },
  swipeOverlayText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
    letterSpacing: 2,
  },
});
