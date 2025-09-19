import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Gradients } from '../../utils/colors';
import { Button, Input } from '../../components/ui';
import { supabase } from '../../lib/supabase';

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);
  
  const searchParams = useLocalSearchParams();

  useEffect(() => {
    // Extract token from URL parameters
    const urlToken = searchParams.token as string;
    if (urlToken) {
      setToken(urlToken);
      setIsValidToken(true);
    } else {
      // If no token, show email form to request password reset
      setShowEmailForm(true);
    }
  }, [searchParams]);

  const handleRequestReset = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      console.log('🔄 Requesting password reset for:', email);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: 'debsmatch://auth/reset-password'
      });

      if (error) {
        console.error('❌ Password reset request error:', error);
        Alert.alert('Error', `Failed to send reset email: ${error.message}`);
        return;
      }

      console.log('✅ Password reset email sent');
      Alert.alert(
        'Email Sent',
        'Check your email for a password reset link. The link will expire in 24 hours.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
      );

    } catch (error) {
      console.error('❌ Unexpected error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!password.trim()) {
      Alert.alert('Error', 'Please enter a new password');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    // Check password strength
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSymbols = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    if (!hasLowercase || !hasUppercase || !hasNumbers || !hasSymbols) {
      Alert.alert(
        'Weak Password',
        'Password must contain at least one lowercase letter, one uppercase letter, one number, and one symbol.',
        [{ text: 'OK' }]
      );
      return;
    }

    setLoading(true);

    try {
      console.log('🔄 Resetting password...');
      
      // Update password using Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        console.error('❌ Password reset error:', error);
        Alert.alert('Error', `Failed to reset password: ${error.message}`);
        return;
      }

      console.log('✅ Password reset successful');
      Alert.alert(
        'Success',
        'Your password has been reset successfully. You can now sign in with your new password.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(auth)/login')
          }
        ]
      );

    } catch (error) {
      console.error('❌ Unexpected error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isValidToken && !showEmailForm) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary.pink[500]} />
          <Text style={styles.loadingText}>Verifying reset link...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show email form if no token (accessed via "Forgot Password" button)
  if (showEmailForm && !isValidToken) {
    return (
      <LinearGradient colors={Gradients.primary as [string, string]} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <View style={styles.content}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>Reset Your Password</Text>
                <Text style={styles.subtitle}>
                  Enter your email address and we'll send you a reset link
                </Text>
              </View>

              {/* Email Form */}
              <View style={styles.form}>
                <Input
                  label="Email Address"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your school email address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={styles.input}
                />

                <Button
                  onPress={handleRequestReset}
                  disabled={loading || !email.trim()}
                  style={styles.resetButton}
                >
                  {loading ? "Sending Reset Email..." : "Send Reset Email"}
                </Button>

                <TouchableOpacity
                  onPress={() => router.replace('/(auth)/login')}
                  style={styles.backButton}
                >
                  <Text style={styles.backButtonText}>Back to Sign In</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={Gradients.primary as [string, string]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Reset Your Password</Text>
              <Text style={styles.subtitle}>
                Enter your new password below
              </Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <Input
                label="New Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your new password"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
              />

              <Input
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm your new password"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
              />

              {/* Password Requirements */}
              <View style={styles.requirements}>
                <Text style={styles.requirementsTitle}>Password Requirements:</Text>
                <Text style={styles.requirement}>• At least 6 characters long</Text>
                <Text style={styles.requirement}>• One lowercase letter (a-z)</Text>
                <Text style={styles.requirement}>• One uppercase letter (A-Z)</Text>
                <Text style={styles.requirement}>• One number (0-9)</Text>
                <Text style={styles.requirement}>• One symbol (!@#$%^&*)</Text>
              </View>

              <Button
                onPress={handleResetPassword}
                disabled={loading}
                style={styles.resetButton}
              >
                {loading ? "Resetting Password..." : "Reset Password"}
              </Button>

              <TouchableOpacity
                onPress={() => router.replace('/(auth)/login')}
                style={styles.backButton}
              >
                <Text style={styles.backButtonText}>Back to Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.text.primary,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    width: '100%',
  },
  input: {
    marginBottom: 16,
  },
  requirements: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  requirement: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  resetButton: {
    marginBottom: 16,
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: Colors.text.primary,
    textDecorationLine: 'underline',
  },
});
