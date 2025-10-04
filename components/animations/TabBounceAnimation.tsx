import React, { useRef } from 'react';
import { Animated, TouchableOpacity, View } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

interface TabBounceAnimationProps {
  icon: string;
  isActive: boolean;
  onPress: () => void;
  style?: any;
  badgeCount?: number;
}

export default function TabBounceAnimation({
  icon,
  isActive,
  onPress,
  style,
  badgeCount = 0,
}: TabBounceAnimationProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  const handlePress = () => {
    // Create a gentle single bounce animation
    Animated.sequence([
      // Initial press down (less aggressive)
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 80,
        useNativeDriver: true,
      }),
      // Single bounce up with spring physics
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 200,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();

    // Single gentle bounce animation for the container
    Animated.sequence([
      Animated.timing(bounceAnim, {
        toValue: 1,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(bounceAnim, {
        toValue: 0,
        tension: 180,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();

    onPress();
  };

  const bounceInterpolation = bounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -4],
  });

  return (
    <TouchableOpacity
      style={[style, { flex: 1, alignItems: 'center', justifyContent: 'center' }]}
      onPress={handlePress}
      activeOpacity={1}
    >
      <Animated.View
        style={[
          {
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'transparent',
          },
          {
            transform: [
              { scale: scaleAnim },
              { translateY: bounceInterpolation },
            ],
          },
        ]}
      >
        <View>
          <FontAwesome5
            name={icon as any}
            size={24}
            color={isActive ? '#FF4F81' : '#c3b1e1'}
            solid={isActive}
          />
          {badgeCount > 0 && (
            <View
              style={{
                position: 'absolute',
                top: -4,
                right: -8,
                minWidth: 16,
                height: 16,
                paddingHorizontal: 4,
                borderRadius: 8,
                backgroundColor: '#FF4F81',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Show dot for large counts to avoid crowding */}
              {badgeCount > 9 ? (
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFFFFF' }} />
              ) : (
                <Animated.Text
                  style={{
                    color: '#FFFFFF',
                    fontSize: 10,
                    fontWeight: '700',
                  }}
                >
                  {badgeCount}
                </Animated.Text>
              )}
            </View>
          )}
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}
