import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert, KeyboardAvoidingView, ScrollView, Platform, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { SPACING, BORDER_RADIUS } from '../../utils/constants';
import { Fonts } from '../../utils/fonts';
import { BackButton } from '../../components/ui';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();

  // Debug password state changes
  useEffect(() => {
    console.log('🔐 Password state changed - Type:', typeof password, 'Length:', password?.length, 'Value:', password);
  }, [password]);

  const handlePasswordChange = (text: string) => {
    console.log('🔐 Password input changed - Type:', typeof text, 'Length:', text?.length, 'Value:', text);
    setPassword(text);
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setIsLoading(true);
    try {
      console.log('🚀 Login attempt for:', email.trim());
      console.log('🔐 Password debug - Type:', typeof password, 'Length:', password?.length, 'Value:', password);
      
      // FIXED: The login should work with either email or school_email
      // The database trigger now sets both fields to the same value
      const result = await signIn(email.trim(), password);
      
      if (result.success) {
        console.log('✅ Login successful, redirecting to main app');
        router.push('/(tabs)');
      } else {
        console.error('❌ Login failed:', result.error);
        
        // Show clear error messages
        let errorMessage = 'Login failed. Please try again.';
        if (result.error?.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password. Please check your credentials and try again.';
        } else if (result.error?.includes('User not found')) {
          errorMessage = 'No account found with this email. Please complete onboarding first.';
        } else if (result.error?.includes('Email not confirmed')) {
          errorMessage = 'Please check your email and confirm your account before signing in.';
        } else if (result.error?.includes('Too many requests')) {
          errorMessage = 'Too many sign-in attempts. Please wait a moment and try again.';
        } else if (result.error) {
          errorMessage = result.error;
        }
        
        Alert.alert('Login Failed', errorMessage);
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    Alert.alert(
      'Coming Soon',
      `${provider} login will be available soon!`,
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <BackButton onPress={() => router.push('/')} />
          </View>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Sign In</Text>
          </View>
          <View style={styles.headerRight} />
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Main Content */}
          <View style={styles.content}>
            {/* Welcome Section */}
            <View style={styles.welcomeSection}>
              <LinearGradient
                colors={['#FFE5F0', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.welcomeGradient}
              >
                <Ionicons name="lock-closed" size={48} color="#FF4F81" />
                <Text style={styles.welcomeTitle}>Welcome Back!</Text>
                <Text style={styles.welcomeSubtitle}>Sign in to continue your journey</Text>
              </LinearGradient>
            </View>

            {/* Form Section */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Login Details</Text>
              
              {/* Email Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <LinearGradient
                  colors={['#F8F4FF', '#FFFFFF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.inputGradient}
                >
                  <Ionicons name="mail" size={20} color="#c3b1e1" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter your school email"
                    placeholderTextColor="#9CA3AF"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </LinearGradient>
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Password</Text>
                <LinearGradient
                  colors={['#F8F4FF', '#FFFFFF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.inputGradient}
                >
                  <Ionicons name="lock-closed" size={20} color="#c3b1e1" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter your password"
                    placeholderTextColor="#9CA3AF"
                    value={password}
                    onChangeText={handlePasswordChange}
                    secureTextEntry
                  />
                </LinearGradient>
              </View>

              {/* Forgot Password */}
              <TouchableOpacity
                style={styles.forgotPasswordButton}
                onPress={() => router.push('/(auth)/reset-password')}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>

              {/* Login Button */}
              <TouchableOpacity
                style={[
                  styles.loginButton,
                  (!email.trim() || !password.trim()) && styles.loginButtonDisabled
                ]}
                onPress={handleLogin}
                disabled={!email.trim() || !password.trim() || isLoading}
              >
                <LinearGradient
                  colors={(!email.trim() || !password.trim()) ? ['#E5E7EB', '#F3F4F6'] : ['#FF4F81', '#FF6B9D']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.loginGradient}
                >
                  <Ionicons 
                    name="log-in" 
                    size={20} 
                    color={(!email.trim() || !password.trim()) ? '#9CA3AF' : '#FFFFFF'} 
                    style={styles.loginIcon}
                  />
                  <Text style={[
                    styles.loginButtonText,
                    (!email.trim() || !password.trim()) && styles.loginButtonTextDisabled
                  ]}>
                    {isLoading ? 'Signing In...' : 'Sign In'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Social Login Section */}
            <View style={styles.socialSection}>
              <Text style={styles.socialTitle}>Or continue with</Text>
              
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => handleSocialLogin('Apple')}
              >
                <LinearGradient
                  colors={['#F8F4FF', '#FFFFFF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.socialGradient}
                >
                  <Ionicons name="logo-apple" size={24} color="#c3b1e1" />
                  <Text style={styles.socialButtonText}>Continue with Apple</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => handleSocialLogin('Google')}
              >
                <LinearGradient
                  colors={['#F8F4FF', '#FFFFFF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.socialGradient}
                >
                  <Ionicons name="logo-google" size={24} color="#c3b1e1" />
                  <Text style={styles.socialButtonText}>Continue with Google</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Help Section */}
            <View style={styles.helpSection}>
              <LinearGradient
                colors={['#FFF0F5', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.helpGradient}
              >
                <Ionicons name="information-circle" size={24} color="#FF4F81" />
                <Text style={styles.helpText}>
                  Don't have an account? Complete onboarding to create one with your email and password.
                </Text>
                <TouchableOpacity
                  style={styles.createAccountButton}
                  onPress={() => router.push('/(onboarding)/school-selection')}
                >
                  <LinearGradient
                    colors={['#FF4F81', '#FF6B9D']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.createAccountGradient}
                  >
                    <Ionicons name="add-circle" size={20} color="#FFFFFF" />
                    <Text style={styles.createAccountText}>Create New Account</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Need help? </Text>
              <TouchableOpacity onPress={() => router.push('/(onboarding)/school-selection')}>
                <Text style={styles.footerLink}>Contact Support</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    minHeight: 60,
  },
  headerLeft: {
    width: 72,
    zIndex: 1,
  },
  headerCenter: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 0,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1B1B3A',
    fontFamily: Fonts.bold,
  },
  headerRight: {
    width: 72,
    zIndex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  welcomeSection: {
    marginBottom: SPACING['2xl'],
  },
  welcomeGradient: {
    padding: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FF4F81',
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    fontFamily: Fonts.bold,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    fontFamily: Fonts.regular,
  },
  formSection: {
    marginBottom: SPACING['2xl'],
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#c3b1e1',
    marginBottom: SPACING.lg,
    fontFamily: Fonts.semiBold,
  },
  inputContainer: {
    marginBottom: SPACING.lg,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1B1B3A',
    marginBottom: SPACING.sm,
    fontFamily: Fonts.regular,
  },
  inputGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputIcon: {
    marginRight: SPACING.sm,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1B1B3A',
    fontFamily: Fonts.regular,
    paddingVertical: SPACING.sm,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#FF4F81',
    fontWeight: '500',
    fontFamily: Fonts.regular,
  },
  loginButton: {
    marginTop: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  loginButtonDisabled: {
    opacity: 0.5,
  },
  loginGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.sm,
  },
  loginIcon: {
    marginRight: SPACING.sm,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: Fonts.semiBold,
  },
  loginButtonTextDisabled: {
    color: '#9CA3AF',
  },
  socialSection: {
    marginBottom: SPACING['2xl'],
  },
  socialTitle: {
    fontSize: 16,
    color: '#c3b1e1',
    textAlign: 'center',
    marginBottom: SPACING.lg,
    fontFamily: Fonts.regular,
  },
  socialButton: {
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  socialGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    gap: SPACING.sm,
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1B1B3A',
    fontFamily: Fonts.regular,
  },
  helpSection: {
    marginBottom: SPACING['2xl'],
  },
  helpGradient: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  helpText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
    lineHeight: 20,
    fontFamily: Fonts.regular,
  },
  createAccountButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  createAccountGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.sm,
  },
  createAccountText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: Fonts.semiBold,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: Fonts.regular,
  },
  footerLink: {
    fontSize: 14,
    color: '#FF4F81',
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
  },
});