import { Slot, Stack, useRouter, useSegments } from 'expo-router';
import { useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { UserProvider } from '../contexts/UserContext';
import { FilterProvider } from '../contexts/FilterContext';
import { OnboardingProvider } from '../OnboardingContext';
import * as Linking from 'expo-linking';
import { useEffect, useState } from 'react';
import { useCustomFonts } from '../utils/fonts';
import { initializeImageConfig } from '../utils/imageConfig';
import { ResumeOnboardingModal } from '../components/ResumeOnboardingModal';
import { ProgressiveOnboardingService } from '../services/progressiveOnboarding';
import { supabase } from '../lib/supabase';

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [incompleteProfileData, setIncompleteProfileData] = useState<any>(null);

  useEffect(() => {
    const checkProfileCompletion = async () => {
      if (loading) {
        // Still checking auth state, don't navigate yet
        return;
      }

      const inAuthGroup = segments[0] === '(auth)';
      const inOnboardingGroup = segments[0] === '(onboarding)';
      const inTabsGroup = segments[0] === '(tabs)';
      const isOnLandingPage = segments.length === 0 || segments[0] === 'index';

      console.log('🔐 Auth routing check:', {
        hasUser: !!user,
        hasProfile: !!user?.profile,
        onboardingCompleted: user?.profile?.onboardingCompleted,
        profileCompleted: user?.profile?.profileCompleted,
        currentSegments: segments,
        inAuthGroup,
        inOnboardingGroup,
        inTabsGroup,
        isOnLandingPage
      });

      // Wait for profile to load before making routing decisions
      if (user && !user.profile) {
        console.log('⏳ Waiting for profile to load...');
        return;
      }

      // Check if authenticated user has incomplete profile
      if (user?.profile) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('profile_completed, onboarding_completed, onboarding_step')
          .eq('id', user.id)
          .single();

        if (!error && profile && !profile.profile_completed) {
          console.log('⚠️ User has incomplete profile, showing resume modal');
          setIncompleteProfileData(profile);
          setShowResumeModal(true);
          return; // Don't do any navigation, modal will handle it
        }
      }

      // If user is signed in and completed profile, they should be in tabs
      if (user?.profile?.onboardingCompleted === true && user?.profile?.profileCompleted === true) {
        // Allow certain authenticated routes outside of tabs
        const allowedRoutes = ['filter', 'edit-profile', 'settings', 'profile', 'chat'];
        const isOnAllowedRoute = allowedRoutes.some(route => segments.includes(route));

        // Redirect to tabs if not already there and not on an allowed route
        // This includes redirecting from landing page when user is authenticated
        if (!inTabsGroup && !isOnAllowedRoute) {
          console.log('✅ User authenticated and onboarded, redirecting to tabs');
          router.replace('/(tabs)');
        }
      }
      // If user is signed in but hasn't completed onboarding, keep them in onboarding
      else if (user?.profile && user.profile.onboardingCompleted === false) {
        if (inTabsGroup || isOnLandingPage) {
          console.log('🔄 User authenticated but not onboarded, needs to complete onboarding');
          // Stay on landing page or let them continue onboarding
        }
      }
      // If no user, they should be on landing or auth pages
      else if (!user) {
        if (inTabsGroup) {
          console.log('❌ No user, redirecting to landing page');
          router.replace('/');
        }
      }
    };

    checkProfileCompletion();
  }, [user, loading, segments]);

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

  const handleResumeOnboarding = () => {
    setShowResumeModal(false);

    // Navigate to the last step they were on
    const lastStep = incompleteProfileData?.onboarding_step;

    if (lastStep) {
      console.log('📍 Resuming onboarding at step:', lastStep);
      router.push(lastStep);
    } else {
      // Default to basic details if no step is saved
      console.log('📍 No saved step, starting from basic details');
      router.push('/(onboarding)/basic-details');
    }
  };

  const handleStartOverOnboarding = async () => {
    try {
      setShowResumeModal(false);

      console.log('🔄 Starting over - deleting incomplete profile');

      // Use the ProgressiveOnboardingService to reset
      const resetResult = await ProgressiveOnboardingService.resetOnboarding();

      if (!resetResult.success) {
        console.error('❌ Error resetting onboarding:', resetResult.error);
        return;
      }

      console.log('✅ Profile deleted successfully, redirecting to onboarding');

      // Navigate to the beginning of onboarding
      router.push('/(onboarding)/mascot-intro');
    } catch (error) {
      console.error('❌ Error starting over:', error);
    }
  };

  return (
    <>
      <Slot />

      {/* Resume Onboarding Modal - Shows when authenticated user has incomplete profile */}
      <ResumeOnboardingModal
        visible={showResumeModal}
        onContinue={handleResumeOnboarding}
        onStartOver={handleStartOverOnboarding}
      />
    </>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const fontsLoaded = useCustomFonts();

  // Initialize image caching configuration on app startup
  useEffect(() => {
    initializeImageConfig();
  }, []);

  // Ensure fonts are loaded globally before rendering routes to prevent
  // "Unrecognized font family" crashes that can yield a blank screen.
  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <UserProvider>
          <OnboardingProvider>
            <FilterProvider>
              <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
              <RootLayoutNav />
            </FilterProvider>
          </OnboardingProvider>
        </UserProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
