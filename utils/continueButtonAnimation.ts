import { useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { playLightHaptic } from './haptics';

export interface ContinueButtonAnimationHook {
  buttonScale: Animated.Value;
  buttonHighlightAnim: Animated.Value;
  triggerButtonPress: (callback?: () => void) => void;
  triggerButtonSweep: () => void;
  animateButtonPress: (animValue: Animated.Value, callback?: () => void) => void;
}

export const useContinueButtonAnimation = (): ContinueButtonAnimationHook => {
  const buttonScale = useRef(new Animated.Value(1)).current;
  const buttonHighlightAnim = useRef(new Animated.Value(0)).current;

  const animateButtonPress = (animValue: Animated.Value, callback?: () => void) => {
    Animated.sequence([
      Animated.timing(animValue, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(animValue, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (callback) callback();
    });
  };

  const triggerButtonSweep = () => {
    buttonHighlightAnim.stopAnimation();
    buttonHighlightAnim.setValue(0);
    Animated.timing(buttonHighlightAnim, {
      toValue: 1,
      duration: 750,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  const triggerButtonPress = (callback?: () => void) => {
    playLightHaptic();
    triggerButtonSweep();
    animateButtonPress(buttonScale, callback);
  };

  return {
    buttonScale,
    buttonHighlightAnim,
    triggerButtonPress,
    triggerButtonSweep,
    animateButtonPress,
  };
};

export const getButtonHighlightStyle = (buttonHighlightAnim: Animated.Value) => ({
  opacity: buttonHighlightAnim.interpolate({
    inputRange: [0, 0.2, 0.8, 1],
    outputRange: [0, 0.45, 0.25, 0],
  }),
  transform: [
    {
      translateX: buttonHighlightAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-220, 220],
      }),
    },
  ],
});