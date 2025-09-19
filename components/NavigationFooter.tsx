import React from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { useCustomFonts } from '../utils/fonts';

const { width } = Dimensions.get('window');

interface NavigationFooterProps {
  // No props needed as we'll determine active state from pathname
}

export default function NavigationFooter({}: NavigationFooterProps) {
  const pathname = usePathname();
  const fontsLoaded = useCustomFonts();

  const navigationItems = [
    {
      id: 'home',
      icon: 'home', // Home icon for main swiping screen
      route: '/',
      isActive: pathname === '/' || pathname === '/index'
    },
    {
      id: 'likes',
      icon: 'heart', // Matches design system
      route: '/likes',
      isActive: pathname === '/likes'
    },
    {
      id: 'chats',
      icon: 'comments', // Using chat-circle equivalent
      route: '/chats',
      isActive: pathname === '/chats'
    },
    {
      id: 'profile',
      icon: 'user', // Matches design system
      route: '/profile',
      isActive: pathname === '/profile'
    }
  ];

  const handleNavigation = (route: string) => {
    router.push(route);
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.container}>
      {navigationItems.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={styles.navItem}
          onPress={() => handleNavigation(item.route)}
          activeOpacity={0.7}
        >
          <View style={[
            styles.iconContainer,
            item.isActive && styles.activeIconContainer
          ]}>
            <FontAwesome5 
              name={item.icon as any} 
              size={24} 
              color={item.isActive ? '#FF4F81' : '#c3b1e1'} 
              solid={item.isActive}
            />
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB', // Using design system border color
    paddingHorizontal: 16, // Reduced padding
    paddingVertical: 8, // Much smaller vertical padding
    paddingBottom: 20, // Reduced safe area padding
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 4,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4, // Reduced padding
  },
  iconContainer: {
    width: 40, // Smaller icon container
    height: 40, // Smaller icon container
    borderRadius: 20, // Smaller border radius
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  activeIconContainer: {
    // No background - just filled pink icon
  },
});
