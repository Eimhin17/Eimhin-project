import { Slot, Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from '../contexts/AuthContext';
import { UserProvider } from '../contexts/UserContext';
import { FilterProvider } from '../contexts/FilterContext';
import { OnboardingProvider } from '../OnboardingContext';
import * as Linking from 'expo-linking';
import { useEffect } from 'react';
import { router } from 'expo-router';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    // Handle deep links when app is already running
    const handleDeepLink = (url: string) => {
      console.log('🔗 Deep link received:', url);
      
      if (url.includes('auth/reset-password')) {
        console.log('🔗 Navigating to reset password screen');
        router.push('/(auth)/reset-password');
      }
    };

    // Listen for deep links
    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    // Handle deep link if app was opened by one
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('🔗 App opened with deep link:', url);
        handleDeepLink(url);
      }
    });

    return () => subscription?.remove();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <UserProvider>
          <OnboardingProvider>
            <FilterProvider>
              <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
              <Slot />
            </FilterProvider>
          </OnboardingProvider>
        </UserProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
