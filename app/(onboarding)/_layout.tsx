import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 300,
        contentStyle: {
          backgroundColor: '#FFFFFF',
        },
      }}
    >
      {/* Phase 1: Core trust & access */}
      <Stack.Screen name="mascot-intro" />
      <Stack.Screen name="school-selection" />
      <Stack.Screen name="blocked-schools" />
      <Stack.Screen name="email-verification" />
      <Stack.Screen name="email-code" />
      <Stack.Screen name="password-creation" />
      
      {/* Phase 2: Identity basics */}
      <Stack.Screen name="mascot-phase2" />
      <Stack.Screen name="basic-details" />
      <Stack.Screen name="gender-selection" />
      <Stack.Screen name="bio" />
      <Stack.Screen name="photo-upload" />
      
      {/* Phase 3: Match foundation */}
      <Stack.Screen name="gender-preference" />
      <Stack.Screen name="looking-for" />
      <Stack.Screen name="relationship-status" />
      <Stack.Screen name="debs-preferences" />
      
      {/* Phase 4: Personality & depth */}
      <Stack.Screen name="interests" />
      <Stack.Screen name="profile-prompts" />
      
      {/* Phase 5: Engagement hooks */}
      <Stack.Screen name="notifications" />
      <Stack.Screen name="dating-intentions" />
      <Stack.Screen name="legal-agreements" />

      {/* Phase 6: Final setup */}
      <Stack.Screen name="community-guidelines" />
    </Stack>
  );
}
