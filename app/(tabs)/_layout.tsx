import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import NavigationFooter from '../../components/NavigationFooter';
import { MatchNotificationProvider } from '../../contexts/MatchNotificationContext';
import { useAuth } from '../../contexts/AuthContext';

export default function TabLayout() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Protect tabs - only authenticated users with completed onboarding can access
  useEffect(() => {
    // Wait for auth and profile to load
    if (loading || (user && !user.profile)) {
      return;
    }

    // Redirect if no user or onboarding not completed
    if (!user || user.profile?.onboardingCompleted !== true) {
      console.log('❌ Tabs accessed without auth or incomplete onboarding, redirecting to landing');
      router.replace('/');
    }
  }, [user, loading, user?.profile]);

  // Show loading while checking auth or loading profile
  if (loading || (user && !user.profile)) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#FF4F81" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Double-check auth before rendering tabs
  if (!user || user.profile?.onboardingCompleted !== true) {
    return null;
  }

  return (
    <MatchNotificationProvider>
      <View style={styles.container}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: { display: 'none' }, // Hide default tab bar
          }}
        >
          <Tabs.Screen name="index" />
          <Tabs.Screen name="likes" />
          <Tabs.Screen name="chats" />
          <Tabs.Screen name="profile" />
        </Tabs>
        <NavigationFooter />
      </View>
    </MatchNotificationProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
});






