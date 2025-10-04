import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Modal, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fonts } from '../utils/fonts';
import { SPACING, BORDER_RADIUS } from '../utils/constants';

interface FiltersResetSuccessPopupProps {
  visible: boolean;
  onClose: () => void;
}

export const FiltersResetSuccessPopup: React.FC<FiltersResetSuccessPopupProps> = ({
  visible,
  onClose,
}) => {
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const popupScale = useRef(new Animated.Value(0.3)).current;
  const popupOpacity = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(0.5)).current;
  const iconRotation = useRef(new Animated.Value(0)).current;
  const textSlide = useRef(new Animated.Value(20)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.sequence([
        // Overlay fade in
        Animated.timing(overlayOpacity, {
          toValue: 0.5,
          duration: 200,
          useNativeDriver: true,
        }),

        // Popup scale and fade in
        Animated.parallel([
          Animated.spring(popupScale, {
            toValue: 1,
            tension: 300,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.timing(popupOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),

        // Icon animation
        Animated.parallel([
          Animated.spring(iconScale, {
            toValue: 1,
            tension: 400,
            friction: 6,
            useNativeDriver: true,
          }),
          Animated.timing(iconRotation, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),

        // Text slide up and fade in
        Animated.parallel([
          Animated.spring(textSlide, {
            toValue: 0,
            tension: 300,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.timing(textOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      // Auto close after 2.5 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 2500);

      return () => clearTimeout(timer);
    } else {
      // Reset all animations
      overlayOpacity.setValue(0);
      popupScale.setValue(0.3);
      popupOpacity.setValue(0);
      iconScale.setValue(0.5);
      iconRotation.setValue(0);
      textSlide.setValue(20);
      textOpacity.setValue(0);
    }
  }, [visible]);

  const handleClose = () => {
    // Animate out
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(popupOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(popupScale, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const rotateInterpolation = iconRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Modal transparent visible={visible} animationType="none">
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.overlay}>
          <Animated.View
            style={[
              styles.overlayBackground,
              { opacity: overlayOpacity }
            ]}
          />

          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.popup,
                {
                  opacity: popupOpacity,
                  transform: [{ scale: popupScale }],
                }
              ]}
            >
              <Animated.View
                style={[
                  styles.iconContainer,
                  {
                    transform: [
                      { scale: iconScale },
                      { rotate: rotateInterpolation }
                    ],
                  }
                ]}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={48}
                  color="#FF4F81"
                />
              </Animated.View>

              <Animated.View
                style={[
                  styles.textContainer,
                  {
                    opacity: textOpacity,
                    transform: [{ translateY: textSlide }],
                  }
                ]}
              >
                <Text style={styles.title}>Filters Reset!</Text>
                <Text style={styles.subtitle}>All filters have been successfully cleared</Text>
              </Animated.View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  overlayBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
  },
  popup: {
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
    maxWidth: 300,
    marginHorizontal: SPACING.lg,
  },
  iconContainer: {
    marginBottom: SPACING.lg,
    padding: SPACING.md,
    backgroundColor: '#FFE5F0',
    borderRadius: 40,
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1B1B3A',
    fontFamily: Fonts.bold,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: Fonts.regular,
    textAlign: 'center',
    lineHeight: 20,
  },
});