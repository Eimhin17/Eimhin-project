import React, { useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useUser } from '../contexts/UserContext';
import { EmailService } from '../services/email';

export default function EmailVerifiedScreen() {
  const { userProfile, updateUserProfile } = useUser();

  useEffect(() => {
    // When this page loads, it means the magic link was clicked
    // Update the user profile to mark email as verified
    if (userProfile?.schoolEmail) {
      updateUserProfile({ emailVerified: true });
    }

    // Automatically redirect to the next onboarding step after a short delay
    const timer = setTimeout(() => {
      router.replace('/(onboarding)/basic-details');
    }, 2000);

    return () => clearTimeout(timer);
  }, [userProfile?.schoolEmail, updateUserProfile]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.illustrationContainer}>
          <Text style={styles.emoji}>✅</Text>
        </View>
        
        <Text style={styles.title}>Email Verified!</Text>
        <Text style={styles.subtitle}>
          Your school email has been successfully verified
        </Text>
        
        <Text style={styles.message}>
          Redirecting you to continue with your profile setup...
        </Text>

        <TouchableOpacity
          style={styles.continueButton}
          onPress={() => router.replace('/(onboarding)/basic-details')}
        >
          <Text style={styles.continueButtonText}>Continue Now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  illustrationContainer: {
    marginBottom: 30,
  },
  emoji: {
    fontSize: 80,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1B1B3A',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 38,
  },
  subtitle: {
    fontSize: 18,
    color: '#6C4AB6',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  message: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
  },
  continueButton: {
    backgroundColor: '#6C4AB6',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 25,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});
