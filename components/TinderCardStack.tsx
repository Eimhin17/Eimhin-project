import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Animated,
  Dimensions,
  StyleSheet,
  Easing,
} from 'react-native';
import { Image } from 'expo-image';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { FontAwesome5 } from '@expo/vector-icons';
import ScrollableProfileCard, { ProfileData } from './ScrollableProfileCard';
import { cardPreloader } from '../services/cardPreloader';
import * as Haptics from 'expo-haptics';
import SwipeResultOverlay from './animations/SwipeResultOverlay';
import { playLikeSwipeSuccessHaptic, playDislikeSwipeSuccessHaptic } from '../utils/haptics';

const { width } = Dimensions.get('window');
const SWIPE_THRESHOLD = width * 0.25;
const MAX_VISIBLE_CARDS = 3; // Show current + 2 behind

interface TinderCardStackProps {
  profiles: ProfileData[];
  currentIndex: number;
  onSwipe: (direction: 'left' | 'right', profile: ProfileData) => void;
  onReport?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

interface CardAnimationState {
  translateX: Animated.Value;
  translateY: Animated.Value;
  rotate: Animated.Value; // This will store raw rotation value
  scale: Animated.Value;
  opacity: Animated.Value;
  stackIndex: number;
}

export const TinderCardStack: React.FC<TinderCardStackProps> = ({
  profiles,
  currentIndex,
  onSwipe,
  onReport,
  onRefresh,
  isRefreshing,
}) => {
  const [swipingIndex, setSwipingIndex] = useState<number | null>(null);
  const [preloadedProfiles, setPreloadedProfiles] = useState<ProfileData[]>(profiles);
  const lastHapticLevel = useRef<string | null>(null);

  // Cache profiles that are being animated off-screen so they remain available even after removal from props
  const animatingProfilesCache = useRef<Map<string, ProfileData>>(new Map());

  // New minimal swipe result overlay state
  const [swipeResultType, setSwipeResultType] = useState<'like' | 'dislike' | null>(null);
  const [swipeResultToken, setSwipeResultToken] = useState<number | null>(null);
  

  // Track cards that are currently being animated off-screen to prevent position resets
  const cardsBeingAnimatedOffScreen = useRef<Set<string>>(new Set());

  // Create animation values for visible cards
  const cardStates = useRef<Map<string, CardAnimationState>>(new Map());

  // Haptic feedback thresholds (denser + stronger ramp)
  const HAPTIC_THRESHOLDS = {
    NANO: width * 0.015,
    MICRO: width * 0.03,
    TINY: width * 0.05,
    VERY_LIGHT: width * 0.08,
    LIGHT: width * 0.12,
    MED_LIGHT: width * 0.16,
    MEDIUM: width * 0.20,
    MED_STRONG: width * 0.24,
    STRONG: width * 0.28,
    VERY_STRONG: width * 0.32,
    HEAVY: width * 0.36,
    MAX: width * 0.44,
  } as const;

  // Get or create animation state for a card
  const getCardState = (id: string, initialStackIndex: number = 0): CardAnimationState => {
    if (!cardStates.current.has(id)) {
      cardStates.current.set(id, {
        translateX: new Animated.Value(0),
        translateY: new Animated.Value(initialStackIndex * 12),
        rotate: new Animated.Value(0),
        scale: new Animated.Value(1 - (initialStackIndex * 0.04)),
        opacity: new Animated.Value(initialStackIndex >= 2 ? 0.5 : 1),
        stackIndex: initialStackIndex,
      });
    }
    return cardStates.current.get(id)!;
  };

  // Initialize and manage preloading
  useEffect(() => {
    // Initial preload when profiles change
    if (profiles.length > 0) {
      cardPreloader.preloadCards(profiles, currentIndex).then(() => {
        setPreloadedProfiles(cardPreloader.getPreloadedCards(profiles));
      });
    }
  }, [profiles]);

  // Preload next batch when currentIndex changes
  useEffect(() => {
    if (profiles.length > 0) {
      // Background preload next cards
      cardPreloader.preloadNextBatch(profiles, currentIndex);

      // Clean up old cards to manage memory
      cardPreloader.cleanupOldCards(profiles, currentIndex);

      // Update preloaded profiles
      setPreloadedProfiles(cardPreloader.getPreloadedCards(profiles));
    }
  }, [currentIndex, profiles]);

  // Calculate visible cards using preloaded profiles
  const visibleCards = useMemo(() => {
    const cards = [] as Array<{ profile: ProfileData; id: string; index: number; stackPosition: number }>;
    // Always base ordering on live props to avoid transient preloader gaps
    for (let i = 0; i < MAX_VISIBLE_CARDS && currentIndex + i < profiles.length; i++) {
      const p = profiles[currentIndex + i];
      const pre = cardPreloader.getPreloadedCard(p.id);
      const merged = pre ? { ...pre, ...p, photos: (p.photos?.length ? p.photos : (pre.photos || [])) } : p;
      cards.push({
        profile: merged,
        id: p.id,
        index: currentIndex + i,
        stackPosition: i,
      });
    }

    // Also include cards that are being animated off-screen to prevent premature unmounting
    cardsBeingAnimatedOffScreen.current.forEach(animatingId => {
      // Only add if not already in the cards array
      if (!cards.some(c => c.id === animatingId)) {
        // Try to get profile from cache first, then from profiles array
        const cachedProfile = animatingProfilesCache.current.get(animatingId);
        const profile = cachedProfile || profiles.find(p => p.id === animatingId);

        if (profile) {
          cards.push({
            profile: profile,
            id: profile.id,
            index: -1,
            stackPosition: -1, // Special position for animating cards
          });
        }
      }
    });

    return cards.reverse(); // Render back to front for proper z-index
  }, [currentIndex, profiles]);

  // Update card positions when currentIndex changes
  useEffect(() => {
    // Animate all visible cards to their new positions with spring physics for smoothness
    visibleCards.forEach(({ id, stackPosition }) => {
      const state = getCardState(id, stackPosition);
      const previousStackIndex = state.stackIndex;

      // Update stack index
      state.stackIndex = stackPosition;

      // Special handling for card moving to front (position 0)
      if (stackPosition === 0 && previousStackIndex > 0) {
        console.log(`🔄 Card ${id} moving to front (from position ${previousStackIndex} to 0)`);

        // Card is moving forward to become the front card - ensure no rebound
        // Don't reset position for cards that are being animated off-screen
        // Force cleanup of the animating set if somehow this card got marked (race condition guard)
        if (cardsBeingAnimatedOffScreen.current.has(id)) {
          console.warn(`⚠️ Card ${id} was marked as animating but needs to move to front - cleaning up`);
          cardsBeingAnimatedOffScreen.current.delete(id);
        }

        if (!cardsBeingAnimatedOffScreen.current.has(id)) {
          console.log(`✅ Animating card ${id} to front position`);

          // Stop any ongoing animations first to prevent conflicts
          state.translateX.stopAnimation();
          state.rotate.stopAnimation();
          state.translateY.stopAnimation();
          state.scale.stopAnimation();
          state.opacity.stopAnimation();

          // Instantly zero horizontal transforms to avoid any snapback
          state.translateX.setValue(0);
          state.rotate.setValue(0);

          // Ensure fully visible
          state.opacity.setValue(1);

          // Smooth forward movement to front (no horizontal rebound)
          Animated.parallel([
            Animated.spring(state.translateY, {
              toValue: 0, // Front position
              useNativeDriver: false,
              tension: 80,
              friction: 10,
              velocity: 0,
              overshootClamping: true,
              restDisplacementThreshold: 0.1,
              restSpeedThreshold: 0.1,
            }),
            Animated.spring(state.scale, {
              toValue: 1, // Full size for front card
              useNativeDriver: false,
              tension: 80,
              friction: 10,
              velocity: 0,
              overshootClamping: true,
              restDisplacementThreshold: 0.1,
              restSpeedThreshold: 0.1,
            }),
            Animated.timing(state.opacity, {
              toValue: 1, // Full opacity for front card
              duration: 200,
              useNativeDriver: false,
              easing: Easing.out(Easing.cubic),
            }),
          ]).start(() => {
            console.log(`✅ Card ${id} animation to front complete`);
          });
        } else {
          console.error(`❌ Card ${id} still marked as animating - animation blocked`);
        }
      } else {
        // Normal position update for cards not moving to front
        // Don't reset position for cards that are being animated off-screen
        if (!cardsBeingAnimatedOffScreen.current.has(id)) {
          // Stop any ongoing animations first to prevent conflicts
          state.translateX.stopAnimation();
          state.rotate.stopAnimation();
          state.translateY.stopAnimation();
          state.scale.stopAnimation();
          state.opacity.stopAnimation();

          // For non-front cards, hard reset horizontal transforms to avoid any lateral motion
          if (stackPosition > 0) {
            state.translateX.setValue(0);
            state.rotate.setValue(0);
          } else {
            // For front card staying front, smoothly reset just in case
            Animated.parallel([
              Animated.spring(state.translateX, {
                toValue: 0,
                useNativeDriver: false,
                tension: 120,
                friction: 8,
                overshootClamping: true,
              }),
              Animated.spring(state.rotate, {
                toValue: 0,
                useNativeDriver: false,
                tension: 120,
                friction: 8,
                overshootClamping: true,
              }),
            ]).start();
          }

          // Animate to new stack position
          Animated.parallel([
            Animated.spring(state.translateY, {
              toValue: stackPosition * 12,
              useNativeDriver: false,
              tension: 120,
              friction: 8,
              overshootClamping: true,
            }),
            Animated.spring(state.scale, {
              toValue: 1 - (stackPosition * 0.04),
              useNativeDriver: false,
              tension: 120,
              friction: 8,
              overshootClamping: true,
            }),
            Animated.timing(state.opacity, {
              toValue: stackPosition >= 2 ? 0.5 : 1,
              duration: 200,
              useNativeDriver: false,
            }),
          ]).start();
        }
      }
    });

    // Clean up old card states
    const currentVisibleIds = new Set(visibleCards.map(c => c.id));
    const animatingIds = new Set(cardsBeingAnimatedOffScreen.current);
    for (const [id] of cardStates.current) {
      if (!currentVisibleIds.has(id) && !animatingIds.has(id)) {
        cardStates.current.delete(id);
      }
    }
  }, [currentIndex, visibleCards]);

  const getHapticIntensity = (translationX: number):
    | { level: keyof typeof HAPTIC_THRESHOLDS; sequence: Array<'selection' | 'light' | 'medium' | 'heavy'> }
    | null => {
    const absX = Math.abs(translationX);

    if (absX >= HAPTIC_THRESHOLDS.MAX) {
      // Max zone: triple heavy burst
      return { level: 'MAX', sequence: ['heavy', 'heavy', 'heavy'] };
    } else if (absX >= HAPTIC_THRESHOLDS.HEAVY) {
      // Very strong: double heavy
      return { level: 'HEAVY', sequence: ['heavy', 'heavy'] };
    } else if (absX >= HAPTIC_THRESHOLDS.VERY_STRONG) {
      // Strong ramp: heavy then medium
      return { level: 'VERY_STRONG', sequence: ['heavy', 'medium'] };
    } else if (absX >= HAPTIC_THRESHOLDS.STRONG) {
      // Strong: medium twice
      return { level: 'STRONG', sequence: ['medium', 'medium'] };
    } else if (absX >= HAPTIC_THRESHOLDS.MED_STRONG) {
      return { level: 'MED_STRONG', sequence: ['medium'] };
    } else if (absX >= HAPTIC_THRESHOLDS.MEDIUM) {
      return { level: 'MEDIUM', sequence: ['medium'] };
    } else if (absX >= HAPTIC_THRESHOLDS.MED_LIGHT) {
      return { level: 'MED_LIGHT', sequence: ['light'] };
    } else if (absX >= HAPTIC_THRESHOLDS.LIGHT) {
      return { level: 'LIGHT', sequence: ['light'] };
    } else if (absX >= HAPTIC_THRESHOLDS.VERY_LIGHT) {
      return { level: 'VERY_LIGHT', sequence: ['selection'] };
    } else if (absX >= HAPTIC_THRESHOLDS.TINY) {
      return { level: 'TINY', sequence: ['selection'] };
    } else if (absX >= HAPTIC_THRESHOLDS.MICRO) {
      return { level: 'MICRO', sequence: ['selection'] };
    } else if (absX >= HAPTIC_THRESHOLDS.NANO) {
      return { level: 'NANO', sequence: ['selection'] };
    }

    return null;
  };

  

  const playHapticSequence = (sequence: Array<'selection' | 'light' | 'medium' | 'heavy'>) => {
    sequence.forEach((kind, idx) => {
      const delay = idx * 60; // compact burst
      setTimeout(() => {
        switch (kind) {
          case 'selection':
            Haptics.selectionAsync();
            break;
          case 'light':
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            break;
          case 'medium':
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            break;
          case 'heavy':
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            break;
        }
      }, delay);
    });
  };

  const onGestureEvent = (id: string, index: number) => {
    const state = getCardState(id);

    return Animated.event(
      [{ nativeEvent: { translationX: state.translateX } }], // Only track horizontal movement
      {
        useNativeDriver: false, // Must be false for translateX to work with gestures
        listener: (event: any) => {
          // Only allow swiping on the front card
          if (index !== currentIndex) return;

          const { translationX } = event.nativeEvent;

          // Update rotation based on horizontal swipe only
          const rotation = (translationX / width) * 30; // Max 30 degrees
          state.rotate.setValue(rotation);

          // Keep vertical position locked to prevent up/down movement
          state.translateY.setValue(0);

          // Haptic feedback
          const hapticInfo = getHapticIntensity(translationX);
          if (hapticInfo && lastHapticLevel.current !== hapticInfo.level) {
            playHapticSequence(hapticInfo.sequence);
            lastHapticLevel.current = hapticInfo.level;
          } else if (Math.abs(translationX) < HAPTIC_THRESHOLDS.NANO) {
            lastHapticLevel.current = null;
          }
        }
      }
    );
  };

  const onHandlerStateChange = (id: string, index: number, profile: ProfileData) => {
    return (event: any) => {
      // Only allow swiping on the front card
      if (index !== currentIndex) return;

      const state = getCardState(id);

      if (event.nativeEvent.state === State.BEGAN) {
        lastHapticLevel.current = null;
        setSwipingIndex(index);
      } else if (event.nativeEvent.state === State.END) {
        const { translationX } = event.nativeEvent;
        setSwipingIndex(null);

        // Prevent duplicate handling for the same card while it is animating off-screen
        if (cardsBeingAnimatedOffScreen.current.has(id)) {
          return;
        }

        if (translationX > SWIPE_THRESHOLD) {
          // Swipe right - Like
          // Mark card as being animated off-screen IMMEDIATELY
          cardsBeingAnimatedOffScreen.current.add(id);
          animateCardOffScreen(state, 'right', id);
          // Immediate callback with cached profile data
          onSwipe('right', profile);
        } else if (translationX < -SWIPE_THRESHOLD) {
          // Swipe left - Pass
          // Mark card as being animated off-screen IMMEDIATELY
          cardsBeingAnimatedOffScreen.current.add(id);
          animateCardOffScreen(state, 'left', id);
          // Immediate callback with cached profile data
          onSwipe('left', profile);
        } else {
          // Return to center - only animate horizontal position and rotation
          Animated.parallel([
            Animated.spring(state.translateX, {
              toValue: 0,
              useNativeDriver: false,
              tension: 100,
              friction: 8,
              overshootClamping: true,
            }),
            Animated.spring(state.rotate, {
              toValue: 0,
              useNativeDriver: false,
              tension: 100,
              friction: 8,
              overshootClamping: true,
            }),
          ]).start();
          // Keep vertical position at stack position
          state.translateY.setValue(state.stackIndex * 12);
        }
      }
    };
  };

  const animateCardOffScreen = (state: CardAnimationState, direction: 'left' | 'right', cardId?: string) => {
    const targetX = direction === 'right' ? width * 1.5 : -width * 1.5;
    const targetRotation = direction === 'right' ? 30 : -30;

    // Cache the profile data before it might be removed from props
    if (cardId) {
      const p = profiles.find(p => p.id === cardId);
      if (p) animatingProfilesCache.current.set(cardId, p);
    }

    // Trigger overlay once with a token to ensure single run
    console.log('🎯 animateCardOffScreen - direction:', direction);
    const nextType = direction === 'right' ? 'like' : 'dislike';
    setSwipeResultType(nextType);
    setSwipeResultToken(Date.now());

    // Play enhanced success haptics
    if (direction === 'right') {
      playLikeSwipeSuccessHaptic();
    } else {
      playDislikeSwipeSuccessHaptic();
    }

    // Stop any ongoing animations to prevent conflicts
    state.translateX.stopAnimation();
    state.rotate.stopAnimation();
    state.opacity.stopAnimation();
    state.translateY.stopAnimation();
    state.scale.stopAnimation();

    // Animate current card off screen with consistent animation for both directions
    Animated.parallel([
      Animated.timing(state.translateX, {
        toValue: targetX,
        duration: 300, // Faster animation
        useNativeDriver: false, // Must be false for translateX
      }),
      Animated.timing(state.rotate, {
        toValue: targetRotation,
        duration: 300,
        useNativeDriver: false, // Must be false for rotate
      }),
      Animated.timing(state.opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false, // Keep consistent with other animations
      }),
    ]).start(() => {
      // Clean up tracking immediately when animation completes
      // This ensures the next card can animate forward without delay
      if (cardId) {
        cardsBeingAnimatedOffScreen.current.delete(cardId);
        animatingProfilesCache.current.delete(cardId);
      }
    });
  };

  const handleLike = () => {
    if (currentIndex < profiles.length) {
      const profileToSwipe = profiles[currentIndex];
      if (!profileToSwipe) return;
      const id = profileToSwipe.id;
      if (cardsBeingAnimatedOffScreen.current.has(id)) return;
      const state = getCardState(id);
      cardsBeingAnimatedOffScreen.current.add(id);
      animateCardOffScreen(state, 'right', id);
      onSwipe('right', profileToSwipe);
    }
  };

  const handleDislike = () => {
    if (currentIndex < profiles.length) {
      const profileToSwipe = profiles[currentIndex];
      if (!profileToSwipe) return;
      const id = profileToSwipe.id;
      if (cardsBeingAnimatedOffScreen.current.has(id)) return;
      const state = getCardState(id);
      cardsBeingAnimatedOffScreen.current.add(id);
      animateCardOffScreen(state, 'left', id);
      onSwipe('left', profileToSwipe);
    }
  };

  // Calculate overlay opacities for front card
  // Determine the current front card id and state
  const frontProfile = preloadedProfiles[currentIndex];
  const frontId = frontProfile ? frontProfile.id : undefined;
  const frontCardState = frontId ? getCardState(frontId) : getCardState('front-placeholder', 0);
  const likeOverlayOpacity = frontCardState.translateX.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const dislikeOverlayOpacity = frontCardState.translateX.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  // Show empty state if no profiles available - but keep rendering the stack structure
  // This prevents the idle image from showing during fast swipes
  // IMPORTANT: Keep rendering cards that are being animated off-screen
  const hasCardsBeingAnimated = cardsBeingAnimatedOffScreen.current.size > 0;

  if ((preloadedProfiles.length === 0 || visibleCards.length === 0) && !hasCardsBeingAnimated) {
    return (
      <View style={styles.container}>
        {/* Empty container that maintains layout structure during profile loading */}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Underlay image that peeks through when swiping the last card */}
      {currentIndex >= profiles.length - 1 && (
        <View style={styles.underlayContainer} pointerEvents="none">
          <Image
            source={require('../Images/swiping idle state.png')}
            style={styles.underlayImage}
            contentFit="cover"
          />
        </View>
      )}
      {/* Render cards from back to front */}
      {visibleCards.map(({ profile, id, index, stackPosition }) => {
        const state = getCardState(id, stackPosition);
        const isFrontCard = index === currentIndex;
        const isSwipeable = isFrontCard && !isRefreshing;

        return (
          <View
            key={`card-${id}`}
            style={[
              styles.cardContainer,
              {
                zIndex: stackPosition < 0 ? 0 : (MAX_VISIBLE_CARDS - stackPosition),
                // Keep all cards absolutely positioned to avoid layout reflow when promoting to front
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }
            ]}
          >
            <PanGestureHandler
              onGestureEvent={isSwipeable ? onGestureEvent(id, index) : undefined}
              onHandlerStateChange={isSwipeable ? onHandlerStateChange(id, index, profile) : undefined}
              enabled={isSwipeable}
              activeOffsetX={[-10, 10]} // Only activate when horizontal movement is at least 10 pixels
              failOffsetY={[-20, 20]}   // Fail gesture if vertical movement exceeds 20 pixels
              shouldCancelWhenOutside={false}
            >
              <Animated.View
                style={[
                  styles.animatedCard,
                  {
                    opacity: state.opacity,
                    transform: [
                      { translateX: state.translateX },
                      { translateY: state.translateY },
                      { rotate: state.rotate.interpolate({
                          inputRange: [-30, 30],
                          outputRange: ['-30deg', '30deg'],
                          extrapolate: 'clamp',
                        }) },
                      { scale: state.scale },
                    ],
                  },
                ]}
              >
                {/* Wrapper for the card content with overlays constrained to it */}
                <View style={styles.cardContentWrapper}>
                  <ScrollableProfileCard
                    profile={profile}
                    onLike={isFrontCard ? handleLike : undefined}
                    onDislike={isFrontCard ? handleDislike : undefined}
                    onReport={isFrontCard ? onReport : undefined}
                    isRefreshing={isFrontCard ? isRefreshing : false}
                    onRefresh={isFrontCard ? onRefresh : undefined}
                  />

                  {/* Swipe Overlays - Only show on front card during active swiping */}
                  {isFrontCard && swipingIndex === index && (
                    <>
                      {/* Enhanced Like Overlay - Pink with animations */}
                      <Animated.View
                        style={[
                          styles.swipeOverlay,
                          styles.likeOverlay,
                          {
                            opacity: likeOverlayOpacity,
                            transform: [{
                              scale: likeOverlayOpacity.interpolate({
                                inputRange: [0, 0.7, 1],
                                outputRange: [0.8, 1.05, 1.1],
                                extrapolate: 'clamp',
                              })
                            }]
                          }
                        ]}
                        pointerEvents="none"
                      >
                        <Animated.View style={{
                          transform: [{
                            scale: likeOverlayOpacity.interpolate({
                              inputRange: [0, 0.5, 1],
                              outputRange: [1, 1.2, 1.3],
                              extrapolate: 'clamp',
                            })
                          }]
                        }}>
                          <FontAwesome5 name="heart" size={60} color="#FFFFFF" />
                        </Animated.View>
                        <Animated.View style={{
                          transform: [{
                            translateY: likeOverlayOpacity.interpolate({
                              inputRange: [0, 1],
                              outputRange: [10, 0],
                              extrapolate: 'clamp',
                            })
                          }]
                        }}>
                          <Text style={[styles.swipeOverlayText, { fontSize: 28, fontWeight: '800' }]}>LIKE</Text>
                        </Animated.View>
                      </Animated.View>

                      {/* Enhanced Dislike Overlay - Purple with animations */}
                      <Animated.View
                        style={[
                          styles.swipeOverlay,
                          styles.dislikeOverlay,
                          {
                            opacity: dislikeOverlayOpacity,
                            transform: [{
                              scale: dislikeOverlayOpacity.interpolate({
                                inputRange: [0, 0.7, 1],
                                outputRange: [0.8, 1.05, 1.1],
                                extrapolate: 'clamp',
                              })
                            }]
                          }
                        ]}
                        pointerEvents="none"
                      >
                        <Animated.View style={{
                          transform: [{
                            scale: dislikeOverlayOpacity.interpolate({
                              inputRange: [0, 0.5, 1],
                              outputRange: [1, 1.2, 1.3],
                              extrapolate: 'clamp',
                            }),
                          }, {
                            rotate: dislikeOverlayOpacity.interpolate({
                              inputRange: [0, 1],
                              outputRange: ['0deg', '90deg'],
                              extrapolate: 'clamp',
                            })
                          }]
                        }}>
                          <FontAwesome5 name="times" size={60} color="#FFFFFF" />
                        </Animated.View>
                        <Animated.View style={{
                          transform: [{
                            translateY: dislikeOverlayOpacity.interpolate({
                              inputRange: [0, 1],
                              outputRange: [10, 0],
                              extrapolate: 'clamp',
                            })
                          }]
                        }}>
                          <Text style={[styles.swipeOverlayText, { fontSize: 28, fontWeight: '800' }]}>NOPE</Text>
                        </Animated.View>
                      </Animated.View>
                    </>
                  )}
                </View>
              </Animated.View>
            </PanGestureHandler>
          </View>
        );
      })}

      {/* New minimal Swipe Result Overlay */}
      {(() => {
        const isLastCard = currentIndex >= profiles.length - 1;
        const overlayDuration = isLastCard ? 500 : 800; // slightly shorter on last card
        return (
      <SwipeResultOverlay
        type={swipeResultType}
        token={swipeResultToken}
        duration={overlayDuration}
        onComplete={() => {
          setSwipeResultType(null);
          setSwipeResultToken(null);
        }}
      />
        );
      })()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  underlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    marginHorizontal: 8,  // Match card margins so image only shows within rounded area
    marginBottom: 0,
    borderRadius: 20,
    overflow: 'hidden',
  },
  underlayImage: {
    width: '100%',
    height: '100%',
  },
  cardContainer: {
    flex: 1,
    width: '100%',
  },
  animatedCard: {
    flex: 1,
    width: '100%',
  },
  cardContentWrapper: {
    flex: 1,
    position: 'relative',
    marginHorizontal: 8,  // Match SPACING.sm (8px) from main container
    marginBottom: 0,      // Remove bottom margin to stretch to footer
    borderRadius: 20,     // Match the card border radius
    overflow: 'hidden',   // Ensure overlays don't extend beyond rounded corners
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
    backgroundColor: 'rgba(255, 79, 129, 0.85)',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  dislikeOverlay: {
    backgroundColor: 'rgba(195, 177, 225, 0.85)',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  swipeOverlayText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 15,
    letterSpacing: 3,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});
