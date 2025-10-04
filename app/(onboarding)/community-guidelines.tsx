import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
  ActivityIndicator,
  Alert
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SPACING, BORDER_RADIUS } from '../../utils/constants';
import { ProgressBar, BackButton } from '../../components/ui';
import { Fonts } from '../../utils/fonts';
import { Ionicons } from '@expo/vector-icons';
import { useOnboarding, ONBOARDING_STEPS } from '../../OnboardingContext';
import { useAuth } from '../../contexts/AuthContext';
import { ProgressiveOnboardingService } from '../../services/progressiveOnboarding';
import { supabase } from '../../lib/supabase';
import { safeGoBack } from '../../utils/safeNavigation';
import { ProfilePictureService } from '../../services/profilePicture';
import { attachProgressHaptics, playLightHaptic, playOnboardingProgressHaptic } from '../../utils/haptics';
import CommunityGuidelinesModal from '../../components/CommunityGuidelinesModal';

export default function CommunityGuidelinesScreen() {
  const [agreedToGuidelines, setAgreedToGuidelines] = useState(false);
  const [isProgressAnimating, setIsProgressAnimating] = useState(false);
  const [showGuidelinesModal, setShowGuidelinesModal] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const { data: onboardingData, updateData, setCurrentStep } = useOnboarding();
  const { user: authUser } = useAuth();
  // Local 3-step progress for Notifications → Legal → Community
  const TOTAL_STEPS = 3;
  const CURRENT_STEP = 3;
  const PREVIOUS_STEP = 2;

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const backButtonScale = useRef(new Animated.Value(0.8)).current;
  const backButtonOpacity = useRef(new Animated.Value(0.3)).current;
  const progressFillAnim = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const buttonHighlightAnim = useRef(new Animated.Value(0)).current;

  // Checkbox animations
  const guidelinesCheckboxScale = useRef(new Animated.Value(1)).current;
  const guidelinesCheckboxBounce = useRef(new Animated.Value(0)).current;
  const guidelinesCheckmarkScale = useRef(new Animated.Value(0)).current;

  // Load existing agreement status if available
  useEffect(() => {
    if (onboardingData?.agreedToCommunityGuidelines) {
      setAgreedToGuidelines(true);
      // Set initial checkmark scale to 1 if already agreed
      guidelinesCheckmarkScale.setValue(1);
    }
  }, [onboardingData?.agreedToCommunityGuidelines]);

  // Entrance animations (match onboarding pages)
  useEffect(() => {
    // Register this step for resume functionality
    setCurrentStep(ONBOARDING_STEPS.COMMUNITY_GUIDELINES);

    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        // Back button fade + scale
        Animated.timing(backButtonOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(backButtonScale, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, backButtonOpacity, backButtonScale, contentOpacity, buttonOpacity]);

  const animateButtonPress = (animValue: Animated.Value, callback?: () => void) => {
    Animated.sequence([
      Animated.timing(animValue, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(animValue, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (callback) callback();
    });
  };

  const triggerButtonSweep = () => {
    buttonHighlightAnim.stopAnimation();
    buttonHighlightAnim.setValue(0);
    Animated.timing(buttonHighlightAnim, {
      toValue: 1,
      duration: 750,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  const handleAutoAdvance = async () => {
    // Save agreement status to onboarding data
    updateData({ agreedToCommunityGuidelines: true });

    try {
      console.log('🎉 === COMPLETING ONBOARDING ===');
      console.log('🎉 All data already saved progressively, just flipping completion flag...');

      setIsCreatingAccount(true);

      // Just flip the onboarding_completed flag - all data already saved!
      const result = await ProgressiveOnboardingService.completeOnboarding();

      setIsCreatingAccount(false);

      if (!result.success) {
        console.error('❌ Error completing onboarding:', result.error);
        Alert.alert('Error', 'Failed to complete onboarding. Please try again.');
        return;
      }

      console.log('✅ === ONBOARDING COMPLETED SUCCESSFULLY ===');
      console.log('✅ Navigating to main app...');

      // Navigate to the main app after successful completion
      animateStepByStepProgress();
    } catch (error) {
      console.error('❌ Error in handleAutoAdvance:', error);
      setIsCreatingAccount(false);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  const handleContinue = () => {
    if (!agreedToGuidelines) {
      return;
    }

    playLightHaptic();
    triggerButtonSweep();
    animateButtonPress(buttonScale, handleAutoAdvance);
  };

  const animateStepByStepProgress = () => {
    setIsProgressAnimating(true);
    const detachHaptics = attachProgressHaptics(progressFillAnim);

    // Animate from current step progress to next step progress
    Animated.timing(progressFillAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: false,
    }).start(() => {
      detachHaptics();
      // Final step completion haptic
      playOnboardingProgressHaptic(CURRENT_STEP, TOTAL_STEPS);
      // Navigate after smooth animation
      setTimeout(() => {
        // Navigate to new mascot page
        router.push('/(onboarding)/mascot-phase5');
      }, 200);
    });
  };

  const handleBackPress = () => {
    playLightHaptic();
    Animated.parallel([
      Animated.timing(backButtonOpacity, {
        toValue: 0.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(backButtonScale, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      safeGoBack(ONBOARDING_STEPS.COMMUNITY_GUIDELINES);
    });
  };

  const handleGuidelinesPress = () => {
    // Show community guidelines modal
    setShowGuidelinesModal(true);
  };

  const animateCheckbox = (
    checkboxScale: Animated.Value,
    checkboxBounce: Animated.Value,
    checkmarkScale: Animated.Value,
    isChecking: boolean
  ) => {
    playLightHaptic();

    if (isChecking) {
      // Checking animation - scale down, bounce up, then scale checkmark in
      Animated.sequence([
        // Initial press down
        Animated.timing(checkboxScale, {
          toValue: 0.85,
          duration: 100,
          useNativeDriver: true,
        }),
        // Bounce back up bigger
        Animated.timing(checkboxScale, {
          toValue: 1.1,
          duration: 150,
          useNativeDriver: true,
        }),
        // Settle to normal size
        Animated.timing(checkboxScale, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      // Bounce effect for the whole checkbox
      Animated.sequence([
        Animated.delay(100),
        Animated.timing(checkboxBounce, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(checkboxBounce, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Checkmark scale in with delay
      setTimeout(() => {
        Animated.spring(checkmarkScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 120,
          friction: 6,
        }).start();
      }, 150);

      // Success haptic after animation
      setTimeout(() => {
        playLightHaptic();
      }, 300);
    } else {
      // Unchecking animation - scale checkmark out, then quick scale
      Animated.timing(checkmarkScale, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();

      Animated.sequence([
        Animated.timing(checkboxScale, {
          toValue: 0.9,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(checkboxScale, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const toggleGuidelines = () => {
    const newState = !agreedToGuidelines;
    setAgreedToGuidelines(newState);
    animateCheckbox(guidelinesCheckboxScale, guidelinesCheckboxBounce, guidelinesCheckmarkScale, newState);
  };

  // Check if form is complete for button enable/disable
  const isFormValid = agreedToGuidelines;

  /**
   * Simple user creation function that actually works
   */
  const createUserAccount = async () => {
    try {
      console.log('🔐 === CREATEUSERACCOUNT FUNCTION START ===');
      console.log('🔐 OnboardingContext keys:', Object.keys(onboardingData || {}));
      console.log('🔐 OnboardingContext email:', onboardingData?.schoolEmail);
      console.log('🔐 OnboardingContext firstName:', onboardingData?.firstName);
      console.log('🔐 OnboardingContext username:', onboardingData?.username);
      console.log('🔐 === END CREATEUSERACCOUNT FUNCTION START ===');

      // Get or create school ID with timeout protection
      let schoolId = null;
      const schoolName = onboardingData?.school || authUser?.profile?.school;
      if (schoolName) {
        console.log('🏫 Looking for existing school:', schoolName);

        try {
          // Add timeout protection for database operations
          const { data: existingSchool, error: schoolError } = await Promise.race([
            supabase
              .from('schools')
              .select('school_id')
              .eq('school_name', schoolName)
              .single(),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('School lookup timeout')), 10000)
            )
          ]) as any;

          if (existingSchool) {
            schoolId = existingSchool.school_id;
            console.log('✅ Found existing school ID:', schoolId);
          } else if (schoolError?.code !== 'PGRST116') {
            // PGRST116 means no rows found, which is expected
            console.error('❌ School lookup error:', schoolError);
            throw new Error(`School lookup failed: ${schoolError?.message}`);
          } else {
            console.log('🏫 Creating new school:', schoolName);

            const { data: newSchool, error: createError } = await Promise.race([
              supabase
                .from('schools')
                .insert({
                  school_name: schoolName,
                  county: 'Unknown',
                  is_active: true,
                })
                .select('school_id')
                .single(),
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error('School creation timeout')), 10000)
              )
            ]) as any;

            if (newSchool) {
              schoolId = newSchool.school_id;
              console.log('✅ Created new school ID:', schoolId);
            } else {
              console.error('❌ Failed to create school:', createError);
              throw new Error(`Failed to create school: ${createError?.message}`);
            }
          }
        } catch (error) {
          console.error('❌ School operation failed:', error);
          // Don't fail the entire onboarding for school issues
          console.warn('⚠️ Continuing without school ID due to error');
        }
      }

      // Map OnboardingContext values to database enum values
      const mappedValues = mapToDatabaseValues(onboardingData);
      console.log('🔍 Mapped database values:', mappedValues);
      console.log('🔍 Onboarding data for profile creation:', {
        lookingForFriendsOrDates: onboardingData?.lookingForFriendsOrDates,
        gender: onboardingData?.gender,
        school: onboardingData?.school,
        schoolEmail: onboardingData?.schoolEmail,
        profilePrompts: onboardingData?.profilePrompts,
        profilePromptsKeys: onboardingData?.profilePrompts ? Object.keys(onboardingData.profilePrompts) : 'none',
        profilePromptsValues: onboardingData?.profilePrompts ? Object.values(onboardingData.profilePrompts) : 'none'
      });

      console.log('🔑 === FINAL SIGNUP DEBUG ===');
      console.log('🔑 Email being used:', onboardingData?.schoolEmail || 'temp@debsmatch.ie');
      console.log('🔑 === END FINAL SIGNUP DEBUG ===');

      // FINAL VALIDATION: Ensure password is valid before sending to Supabase
      const password = onboardingData?.password;
      console.log('🔐 === FINAL PASSWORD VALIDATION ===');
      console.log('🔐 Password exists:', !!password);
      console.log('🔐 Password type:', typeof password);
      console.log('🔐 Password length:', password?.length || 0);
      console.log('🔐 Password trimmed length:', password?.trim().length || 0);

      if (!password || typeof password !== 'string' || password.trim().length === 0) {
        console.error('🚨 === PASSWORD VALIDATION FAILED ===');
        console.error('🚨 Password is invalid or missing - cannot create account');
        throw new Error('Password is invalid or missing - cannot create account');
      }

      console.log('🔐 === PASSWORD VALIDATION PASSED ===');
      console.log('🔐 === GETTING CURRENT AUTH USER ===');

      // Get current auth user (created from email OTP verification)
      const { data: { user: currentAuthUser }, error: getUserError } = await supabase.auth.getUser();

      if (getUserError || !currentAuthUser) {
        console.error('❌ No authenticated user found:', getUserError);
        throw new Error('No authenticated user. Please verify your email first.');
      }

      console.log('✅ Current auth user found:', currentAuthUser.id);
      console.log('✅ User email:', currentAuthUser.email);
      console.log('✅ User email_confirmed:', !!currentAuthUser.email_confirmed_at);

      // Update the user's password (they were created via OTP, so they don't have a password yet)
      console.log('🔐 === SETTING USER PASSWORD ===');
      const { error: updatePasswordError } = await supabase.auth.updateUser({
        password: password
      });

      if (updatePasswordError) {
        // Treat "same password" validation from Supabase as non-fatal
        const samePasswordSignals = [
          'should be different from the old password',
          'different from the old password',
          'same password'
        ];
        const errMsg = String(
          // Supabase AuthApiError can carry message or error_description
          // Normalize to string and lowercase for robust matching
          (updatePasswordError as any)?.error_description ||
          (updatePasswordError as any)?.message ||
          updatePasswordError
        ).toLowerCase();

        const isSamePassword = samePasswordSignals.some(sig => errMsg.includes(sig));

        if (isSamePassword) {
          console.log('ℹ️ Password already set to this value, continuing...');
        } else {
          console.error('❌ Error setting password:', updatePasswordError);
          throw new Error(`Failed to set password: ${(updatePasswordError as any)?.message || 'Unknown error'}`);
        }
      } else {
        console.log('✅ Password set successfully');
      }
      const createdUser = {
        id: currentAuthUser.id,
        email: currentAuthUser.email!,
        email_verified: !!currentAuthUser.email_confirmed_at,
        created_at: currentAuthUser.created_at,
        updated_at: currentAuthUser.updated_at,
        last_sign_in: currentAuthUser.last_sign_in_at,
        phone: currentAuthUser.phone || '',
        phone_verified: !!currentAuthUser.phone_confirmed_at,
      };

      // Update the profile with all the onboarding data
      console.log('🔐 === UPDATING PROFILE ===');
      // Check if profile already exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', createdUser.id)
        .single();

      let profileData, profileError;

      if (existingProfile) {
        // Profile exists, update it
        console.log('🔐 Profile exists, updating...');
        console.log('🔐 Profile update data:', {
          first_name: onboardingData?.firstName || '',
          username: onboardingData?.username || '',
          school_id: schoolId,
          looking_for_debs: mappedValues.lookingForDebs,
          dating_intentions: mappedValues.datingIntentions,
          onboarding_completed: true,
          profile_completed: true
        });

        const updateResult = await supabase
          .from('profiles')
          .update({
            // 1. School Information
            school_id: schoolId,
            school_name: onboardingData?.school || '',

            // 2. Contact Information
            email: onboardingData?.schoolEmail || '',

            // 3. Notification Preferences
            notifications_enabled: onboardingData?.notificationsEnabled ?? true,

            // 4. Basic Personal Information
            first_name: onboardingData?.firstName || '',
            username: onboardingData?.username || '',
            date_of_birth: onboardingData?.dateOfBirth instanceof Date ? onboardingData.dateOfBirth.toISOString().split('T')[0] : onboardingData?.dateOfBirth || '2000-01-01',
            gender: onboardingData?.gender || 'woman',

            // 5. Profile Content
            bio: onboardingData?.bio || '',

            // 6. Legal Compliance
            agreed_to_terms_and_conditions: true, // Default to true since they're completing onboarding

            // 7. Match Preferences
            match_preferences: onboardingData?.genderPreference || 'everyone',

            // 8. Relationship Preferences
            looking_for_friends_or_dates: onboardingData?.lookingForFriendsOrDates || 'both',
            relationship_status: onboardingData?.relationshipStatus || 'single',
            looking_for_debs: mappedValues.lookingForDebs,
            dating_intentions: mappedValues.datingIntentions,

            // 9. Privacy Settings
            blocked_schools: onboardingData?.blockedSchools || [],

            // 10. Interests and Content
            interests: onboardingData?.interests || [],
            profile_prompts: onboardingData?.profilePrompts || {},

            // 11. Activity Tracking
            last_active_at: new Date().toISOString(),

            // 12. System Fields
            status: 'active',
            onboarding_completed: true,
            profile_completed: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', createdUser.id)
          .select();

        profileData = updateResult.data;
        profileError = updateResult.error;
      } else {
        // Profile doesn't exist, create it
        console.log('🔐 Profile does not exist, creating new profile...');
        console.log('🔐 === CRITICAL: USER ID BEING USED ===');
        console.log('🔐 createdUser object:', createdUser);
        console.log('🔐 createdUser.id:', createdUser.id);
        console.log('🔐 createdUser.id type:', typeof createdUser.id);
        console.log('🔐 === END CRITICAL DEBUG ===');

        console.log('🔐 Profile creation data:', {
          id: createdUser.id,
          first_name: onboardingData?.firstName || '',
          username: onboardingData?.username || '',
          school_id: schoolId,
          looking_for_debs: mappedValues.lookingForDebs,
          dating_intentions: mappedValues.datingIntentions,
          profile_prompts: onboardingData?.profilePrompts,
          onboarding_completed: true,
          profile_completed: true
        });

        const createResult = await supabase
          .from('profiles')
          .insert({
            // Primary Key
            id: createdUser.id,

            // 1. School Information
            school_id: schoolId,
            school_name: onboardingData?.school || '',

            // 2. Contact Information
            email: onboardingData?.schoolEmail || '',

            // 3. Notification Preferences
            notifications_enabled: onboardingData?.notificationsEnabled ?? true,

            // 4. Basic Personal Information
            first_name: onboardingData?.firstName || '',
            username: onboardingData?.username || '',
            date_of_birth: onboardingData?.dateOfBirth instanceof Date ? onboardingData.dateOfBirth.toISOString().split('T')[0] : onboardingData?.dateOfBirth || '2000-01-01',
            gender: onboardingData?.gender || 'woman',

            // 5. Profile Content
            bio: onboardingData?.bio || '',

            // 6. Legal Compliance
            agreed_to_terms_and_conditions: true, // Default to true since they're completing onboarding

            // 7. Match Preferences
            match_preferences: onboardingData?.genderPreference || 'everyone',

            // 8. Relationship Preferences
            looking_for_friends_or_dates: onboardingData?.lookingForFriendsOrDates || 'both',
            relationship_status: onboardingData?.relationshipStatus || 'single',
            looking_for_debs: mappedValues.lookingForDebs,
            dating_intentions: mappedValues.datingIntentions,

            // 9. Privacy Settings
            blocked_schools: onboardingData?.blockedSchools || [],

            // 10. Interests and Content
            interests: onboardingData?.interests || [],
            profile_prompts: onboardingData?.profilePrompts || {},

            // 11. Activity Tracking
            last_active_at: new Date().toISOString(),

            // 12. System Fields
            status: 'active',
            onboarding_completed: true,
            profile_completed: true
          })
          .select();

        profileData = createResult.data;
        profileError = createResult.error;
      }

      console.log('🔐 Profile update result data:', profileData);
      console.log('🔐 Profile update result error:', profileError);

      if (profileError) {
        console.error('❌ Error updating profile:', profileError);
        console.error('❌ Profile error details:', JSON.stringify(profileError, null, 2));
        throw new Error(`Failed to update profile: ${profileError.message}`);
      }

      console.log('✅ Profile updated successfully');
      console.log('✅ Profile data:', profileData);

      // Save any temporary onboarding data (including photos) to storage
      const { OnboardingService } = await import('../../services/onboarding');
      const saveTempDataResult = await OnboardingService.saveAllTempData(createdUser.id);
      if (saveTempDataResult.success) {
        console.log('✅ Temporary onboarding data saved successfully');
      } else {
        console.warn('⚠️ Failed to save temporary onboarding data:', saveTempDataResult.error);
      }

      // Create circular PFP from main photo after profile is updated
      if (onboardingData?.photos && onboardingData.photos.length > 0) {
        console.log('🔄 Creating circular PFP from main photo');
        try {
          const pfpResult = await ProfilePictureService.createPFPFromMainPhoto(createdUser.id);
          if (!pfpResult.success) {
            console.error('❌ Failed to create PFP:', pfpResult.error);
            // Don't fail the entire process if PFP creation fails
          } else {
            console.log('✅ Circular PFP created successfully');
          }
        } catch (pfpError) {
          console.error('❌ Error creating PFP:', pfpError);
          // Don't fail the entire process if PFP creation fails
        }
      } else {
        console.log('⚠️ No photos found, skipping PFP creation');
      }

      console.log('🔐 === SIGNUP RESULT RECEIVED ===');
      console.log('🔐 Signup result user:', createdUser ? 'SUCCESS' : 'FAILED');
      console.log('🔐 User ID:', createdUser?.id || 'No ID');
      console.log('🔐 User email:', createdUser?.email || 'No email');
      console.log('🔐 === END SIGNUP RESULT ===');

      console.log('✅ === USER ACCOUNT CREATED SUCCESSFULLY ===');
      console.log('✅ User account created successfully:', createdUser.id);
      console.log('✅ User email:', createdUser.email);
      console.log('✅ === END USER ACCOUNT CREATED ===');
      return createdUser;
    } catch (error) {
      console.error('❌ === ERROR IN CREATEUSERACCOUNT ===');
      console.error('❌ Error in createUserAccount:', error);
      console.error('❌ Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.error('❌ === END ERROR IN CREATEUSERACCOUNT ===');
      throw error;
    }
  };

  /**
   * Map OnboardingContext values to database enum values
   */
  const mapToDatabaseValues = (onboardingData: any) => {
    // Map looking_for_debs values from onboarding data
    let lookingForDebs: 'go_to_someones_debs' | 'bring_someone_to_my_debs';
    switch (onboardingData?.lookingForDebs) {
      case 'swaps':
        lookingForDebs = 'go_to_someones_debs'; // Swaps maps to going to someone's debs
        break;
      case 'go_to_someones_debs':
        lookingForDebs = 'go_to_someones_debs';
        break;
      case 'bring_someone_to_my_debs':
        lookingForDebs = 'bring_someone_to_my_debs';
        break;
      default:
        lookingForDebs = 'go_to_someones_debs'; // Default fallback
    }

    // Map dating_intentions values from onboarding data
    let datingIntentions: 'one_night_thing' | 'short_term_only' | 'short_term_but_open_to_long_term' | 'long_term_only' | 'long_term_but_open_to_short_term';
    switch (onboardingData?.datingIntentions) {
      case 'one_night_thing':
        datingIntentions = 'one_night_thing';
        break;
      case 'short_term_only':
        datingIntentions = 'short_term_only';
        break;
      case 'short_term_but_open_to_long_term':
        datingIntentions = 'short_term_but_open_to_long_term';
        break;
      case 'long_term_only':
        datingIntentions = 'long_term_only';
        break;
      case 'long_term_but_open_to_short_term':
        datingIntentions = 'long_term_but_open_to_short_term';
        break;
      default:
        datingIntentions = 'long_term_only'; // Default fallback
    }

    console.log('🔍 Onboarding data mapped to:', { lookingForDebs, datingIntentions });
    console.log('🔍 Onboarding data lookingForFriendsOrDates:', onboardingData?.lookingForFriendsOrDates);
    console.log('🔍 Onboarding data gender:', onboardingData?.gender);
    console.log('🔍 Onboarding data lookingForDebs (raw):', onboardingData?.lookingForDebs);
    return { lookingForDebs, datingIntentions };
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={[styles.topRow, { opacity: fadeAnim }]}>
            <View style={styles.backButtonWrapper}>
              <Animated.View style={{ transform: [{ scale: backButtonScale }], opacity: backButtonOpacity }}>
                <BackButton
                  onPress={handleBackPress}
                  color="#c3b1e1"
                  size={72}
                  iconSize={28}
                />
              </Animated.View>
            </View>
            <View style={styles.progressWrapper}>
              <ProgressBar
                currentStep={CURRENT_STEP}
                totalSteps={TOTAL_STEPS}
                previousStep={PREVIOUS_STEP}
                showStepNumbers={false}
                variant="gradient"
                size="medium"
                fill={isProgressAnimating ? progressFillAnim : undefined}
                isAnimating={isProgressAnimating}
                useMoti
                style={styles.progressBar}
              />
            </View>
            <View style={styles.topRowSpacer} />
          </Animated.View>

          {/* Main Content */}
          <Animated.View
            style={[
              styles.content,
              {
                opacity: contentOpacity,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.headerSection}>
              <Text style={styles.title}>Com guidelines</Text>
              <Text style={styles.subtitle}>Dont just blidnly select agree...</Text>
            </View>

            {/* Community Guidelines Agreement */}
            <TouchableOpacity
              style={styles.agreementRow}
              onPress={toggleGuidelines}
              activeOpacity={0.7}
            >
              <View style={styles.checkboxContainer}>
                <Animated.View style={[
                  styles.checkbox,
                  agreedToGuidelines && styles.checkboxChecked,
                  {
                    transform: [
                      { scale: guidelinesCheckboxScale },
                      {
                        translateY: guidelinesCheckboxBounce.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, -3],
                        })
                      }
                    ]
                  }
                ]}>
                  {agreedToGuidelines && (
                    <Animated.View style={{
                      transform: [{ scale: guidelinesCheckmarkScale }]
                    }}>
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    </Animated.View>
                  )}
                </Animated.View>
              </View>
              <Text style={styles.agreementText}>
                I agree to the{' '}
                <Text style={styles.linkText} onPress={handleGuidelinesPress}>
                  Com guidelines
                </Text>
              </Text>
            </TouchableOpacity>

          </Animated.View>
        </ScrollView>

        {/* Continue Button */}
        <Animated.View style={[styles.floatingButtonContainer, { opacity: buttonOpacity }]}>
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity
              style={[styles.continueButton, !isFormValid && styles.disabledButton]}
              onPress={handleContinue}
              activeOpacity={0.8}
              disabled={!isFormValid || isCreatingAccount}
            >
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.buttonHighlight,
                  {
                    opacity: buttonHighlightAnim.interpolate({
                      inputRange: [0, 0.2, 0.8, 1],
                      outputRange: [0, 0.45, 0.25, 0],
                    }),
                    transform: [
                      {
                        translateX: buttonHighlightAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-220, 220],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <LinearGradient
                  colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.6)', 'rgba(255,255,255,0)']}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.buttonHighlightGradient}
                />
              </Animated.View>
              {isCreatingAccount ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={[styles.continueButtonText, { marginLeft: 10 }]}>
                    Creating account...
                  </Text>
                </View>
              ) : (
                <Text style={[styles.continueButtonText, !isFormValid && styles.disabledButtonText]}>
                  Continue
                </Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

        {/* Modal */}
        <CommunityGuidelinesModal
          visible={showGuidelinesModal}
          onClose={() => setShowGuidelinesModal(false)}
        />

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: SPACING['3xl'],
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  backButtonWrapper: {
    width: 72,
    marginLeft: -SPACING.lg,
  },
  progressWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  topRowSpacer: {
    width: 48,
  },
  progressBar: {
    width: 160,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.lg,
    alignItems: 'flex-start',
  },
  headerSection: {
    alignSelf: 'stretch',
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1B1B3A',
    textAlign: 'left',
    marginBottom: SPACING.sm,
    lineHeight: 36,
    letterSpacing: -0.5,
    fontFamily: Fonts.bold,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'left',
    marginBottom: SPACING['2xl'],
    lineHeight: 24,
    paddingRight: SPACING.lg,
    fontFamily: Fonts.regular,
  },
  agreementRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },
  checkboxContainer: {
    marginRight: SPACING.sm,
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#c3b1e1',
    borderColor: '#c3b1e1',
  },
  agreementText: {
    fontSize: 16,
    color: '#1B1B3A',
    lineHeight: 22,
    fontFamily: Fonts.regular,
    flex: 1,
  },
  linkText: {
    color: '#FF4F81',
    fontWeight: '600',
    textDecorationLine: 'underline',
    fontFamily: Fonts.semiBold,
  },
  floatingButtonContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: SPACING.lg,
    paddingHorizontal: SPACING.xl,
  },
  continueButton: {
    backgroundColor: '#FF4F81',
    paddingVertical: 18,
    paddingHorizontal: SPACING.xl,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    width: '100%',
    ...Platform.select({
      ios: {
        shadowColor: '#FF4F81',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
        shadowColor: '#FF4F81',
      },
    }),
  },
  continueButtonText: {
    fontFamily: Fonts.semiBold,
    fontWeight: '600',
    fontSize: 18,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  buttonHighlight: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 180,
  },
  buttonHighlightGradient: {
    flex: 1,
    borderRadius: 16,
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledButtonText: {
    opacity: 0.7,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
