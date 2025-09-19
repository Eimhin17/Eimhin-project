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
  Alert,
  Animated
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SPACING, BORDER_RADIUS } from '../../utils/constants';
import { Colors, Gradients } from '../../utils/colors';
import { ProgressBar, BackButton } from '../../components/ui';
import { Fonts } from '../../utils/fonts';
import { useOnboarding } from '../../OnboardingContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { ProfilePictureService } from '../../services/profilePicture';
import { Ionicons } from '@expo/vector-icons';

export default function CommunityGuidelinesScreen() {
  const [agreedToGuidelines, setAgreedToGuidelines] = useState(false);
  const [isProgressAnimating, setIsProgressAnimating] = useState(false);
  const { data: onboardingData, updateData } = useOnboarding();
  const { user: authUser } = useAuth();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;

  // Button press animations
  const buttonScale = useRef(new Animated.Value(1)).current;
  const backButtonScale = useRef(new Animated.Value(1)).current;
  const progressFillAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Staggered entrance animations
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
      ]),
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(formOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Button press animations
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

  const handleContinue = async () => {
    if (!agreedToGuidelines) {
      return; // Button should be disabled
    }

    try {
      console.log('🚀 === STARTING ACCOUNT CREATION PROCESS ===');
      console.log('🚀 All validations passed, proceeding with account creation');
      console.log('🚀 === END STARTING ACCOUNT CREATION PROCESS ===');
      
      // Create the account with the password from OnboardingContext
      console.log('🚀 === STARTING ACCOUNT CREATION ===');
      await createUserAccount();
      
      console.log('🎉 === ACCOUNT CREATION COMPLETED ===');
      console.log('🎉 Navigating to main app...');
      
      // Navigate to the main app after successful account creation
      animateStepByStepProgress();
    } catch (error) {
      console.error('❌ Error in handleContinue:', error);
      Alert.alert('Error', `Failed to create user account: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const animateStepByStepProgress = () => {
    setIsProgressAnimating(true);
    
    // Animate from current step progress to next step progress
    Animated.timing(progressFillAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: false,
    }).start(() => {
      // Navigate after smooth animation
      setTimeout(() => {
        // Navigate to main app - this is the final onboarding page
        router.push('/(tabs)');
      }, 200);
    });
  };

  const handleBackPress = () => {
    animateButtonPress(backButtonScale, () => {
      router.back();
    });
  };

  const toggleGuidelines = () => {
    setAgreedToGuidelines(!agreedToGuidelines);
  };

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

      // Get or create school ID
      let schoolId = null;
      const schoolName = onboardingData?.school || authUser?.profile?.school;
      if (schoolName) {
        console.log('🏫 Looking for existing school:', schoolName);
        const { data: existingSchool, error: schoolError } = await supabase
          .from('schools')
          .select('school_id')
          .eq('school_name', schoolName)
          .single();

        if (existingSchool) {
          schoolId = existingSchool.school_id;
          console.log('✅ Found existing school ID:', schoolId);
        } else {
          console.log('🏫 Creating new school:', schoolName);
          const { data: newSchool, error: createError } = await supabase
            .from('schools')
            .insert({
              school_name: schoolName,
              county: 'Unknown',
              is_active: true,
            })
            .select('school_id')
            .single();

          if (newSchool) {
            schoolId = newSchool.school_id;
            console.log('✅ Created new school ID:', schoolId);
          } else {
            console.error('❌ Failed to create school:', createError);
            throw new Error('Failed to create school');
          }
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
      console.log('🔐 About to call SupabaseAuthService.signUp');
      console.log('🔐 === END FINAL PASSWORD VALIDATION ===');
      
      // Since user already exists in auth, check if they need a password update
      console.log('🔐 === CHECKING IF PASSWORD UPDATE NEEDED ===');
      console.log('🔐 Auth user ID:', authUser?.id);
      console.log('🔐 Auth user email:', authUser?.email);
      console.log('🔐 Onboarding email:', onboardingData?.schoolEmail);
      
      // Use the onboarding email if auth user email is not available
      const userEmail = authUser?.email || onboardingData?.schoolEmail || 'temp@debsmatch.ie';
      console.log('🔐 Using email for profile creation:', userEmail);
      
      // Try to update password, but don't fail if it's the same
      console.log('🔐 === ATTEMPTING PASSWORD UPDATE ===');
      const { data: updateData, error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      console.log('🔐 Update result data:', updateData);
      console.log('🔐 Update result error:', updateError);

      if (updateError) {
        if (updateError.code === 'same_password') {
          console.log('ℹ️ Password is already set to the same value, continuing...');
        } else {
          console.error('❌ Error updating password:', updateError);
          console.error('❌ Error details:', JSON.stringify(updateError, null, 2));
          throw new Error(`Failed to update password: ${updateError.message}`);
        }
      } else {
        console.log('✅ Password updated successfully');
        console.log('✅ Update data:', updateData);
      }
      
      // Update the profile with all the onboarding data
      console.log('🔐 === UPDATING PROFILE ===');
      // Check if profile already exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', authUser?.id)
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
          .eq('id', authUser?.id)
          .select();
        
        profileData = updateResult.data;
        profileError = updateResult.error;
      } else {
        // Profile doesn't exist, create it
        console.log('🔐 Profile does not exist, creating new profile...');
        console.log('🔐 Profile creation data:', {
          id: authUser?.id,
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
            id: authUser?.id,
            
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
      const saveTempDataResult = await OnboardingService.saveAllTempData(authUser.id);
      if (saveTempDataResult.success) {
        console.log('✅ Temporary onboarding data saved successfully');
      } else {
        console.warn('⚠️ Failed to save temporary onboarding data:', saveTempDataResult.error);
      }
      
      // Create circular PFP from main photo after profile is updated
      if (onboardingData?.photos && onboardingData.photos.length > 0) {
        console.log('🔄 Creating circular PFP from main photo');
        try {
          const pfpResult = await ProfilePictureService.createPFPFromMainPhoto(authUser.id);
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
      
      // Return the existing user since we updated their password
      const signUpResult = { user: authUser, error: null };

      console.log('🔐 === SIGNUP RESULT RECEIVED ===');
      console.log('🔐 Signup result user:', signUpResult.user ? 'SUCCESS' : 'FAILED');
      console.log('🔐 Signup result error:', signUpResult.error || 'No error');
      console.log('🔐 User ID:', signUpResult.user?.id || 'No ID');
      console.log('🔐 User email:', signUpResult.user?.email || 'No email');
      console.log('🔐 === END SIGNUP RESULT ===');
      
      if (signUpResult.user) {
        console.log('✅ === USER ACCOUNT CREATED SUCCESSFULLY ===');
        console.log('✅ User account created successfully:', signUpResult.user.id);
        console.log('✅ User email:', signUpResult.user.email);
        console.log('✅ === END USER ACCOUNT CREATED ===');
        return signUpResult.user;
      } else {
        console.error('🚨 === SIGNUP FAILED ===');
        console.error('🚨 Signup failed with error:', signUpResult.error);
        throw new Error(signUpResult.error || 'Failed to create user account');
      }
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
          {/* Header */}
          <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
            <View style={styles.backButtonContainer}>
              <BackButton
                onPress={handleBackPress} 
                animatedValue={backButtonScale}
                color="#c3b1e1"
                size={72}
                iconSize={28}
              />
            </View>
            
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Community Guidelines</Text>
              <View style={styles.progressContainer}>
              <ProgressBar 
                currentStep={17} 
                totalSteps={17} 
                variant="gradient"
                size="small"
                fill={isProgressAnimating ? progressFillAnim : undefined}
                isAnimating={isProgressAnimating}
                  style={styles.progressBar}
              />
              </View>
            </View>
            
            <View style={styles.headerRight} />
          </Animated.View>

          {/* Main Content */}
          <Animated.View style={[styles.content, { opacity: contentOpacity }]}>
            <View style={styles.illustrationContainer}>
              <LinearGradient
                colors={['#F8F4FF', '#FFF0F5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.illustrationGradient}
              >
                <Ionicons name="shield-checkmark" size={40} color="#FF4F81" />
              </LinearGradient>
            </View>
            
            <Text style={styles.title}>Community Guidelines</Text>
            <Text style={styles.subtitle}>
              Help us keep DebsMatch a safe and welcoming place for everyone
            </Text>

            {/* Guidelines List */}
            <Animated.View style={[styles.guidelinesContainer, { opacity: formOpacity }]}>
              <Text style={styles.guidelinesTitle}>Our Community Rules</Text>
              
              <View style={styles.guidelineItem}>
                <Ionicons name="shield" size={20} color="#FF4F81" style={styles.guidelineIcon} />
                <Text style={styles.guidelineText}>Be respectful and kind to everyone</Text>
              </View>
              
              <View style={styles.guidelineItem}>
                <Ionicons name="camera" size={20} color="#FF4F81" style={styles.guidelineIcon} />
                <Text style={styles.guidelineText}>Use real photos and authentic information</Text>
              </View>
              
              <View style={styles.guidelineItem}>
                <Ionicons name="close-circle" size={20} color="#FF4F81" style={styles.guidelineIcon} />
                <Text style={styles.guidelineText}>No harassment, bullying, or inappropriate content</Text>
              </View>
              
              <View style={styles.guidelineItem}>
                <Ionicons name="people" size={20} color="#FF4F81" style={styles.guidelineIcon} />
                <Text style={styles.guidelineText}>You must be 18+ to use this app</Text>
              </View>
              
              <View style={styles.guidelineItem}>
                <Ionicons name="flag" size={20} color="#FF4F81" style={styles.guidelineIcon} />
                <Text style={styles.guidelineText}>Report any suspicious or inappropriate behavior</Text>
              </View>
              
              <View style={styles.guidelineItem}>
                <Ionicons name="chatbubbles" size={20} color="#FF4F81" style={styles.guidelineIcon} />
                <Text style={styles.guidelineText}>Keep conversations appropriate and consensual</Text>
              </View>
            </Animated.View>

            {/* Agreement Checkbox */}
            <Animated.View style={[styles.agreementContainer, { opacity: formOpacity }]}>
              <TouchableOpacity 
                style={styles.agreementRow}
                onPress={toggleGuidelines}
                activeOpacity={0.7}
              >
                <View style={styles.checkboxContainer}>
                  <View style={[
                    styles.checkbox,
                    agreedToGuidelines && styles.checkboxChecked
                  ]}>
                    {agreedToGuidelines && (
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    )}
                  </View>
                </View>
                <View style={styles.agreementTextContainer}>
                  <Text style={styles.agreementText}>
                    I agree to follow the community guidelines and understand that violations may result in account suspension.
                  </Text>
                </View>
              </TouchableOpacity>
            </Animated.View>

            {/* Buttons */}
            <Animated.View style={[styles.buttonContainer, { opacity: formOpacity }]}>
              <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                <TouchableOpacity
                  onPress={handleContinue}
                  disabled={!agreedToGuidelines}
                  style={[
                    styles.continueButton,
                    !agreedToGuidelines && styles.continueButtonDisabled
                  ]}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={
                      agreedToGuidelines 
                        ? ['#FF4F81', '#FF4F81'] // Solid pink for active
                        : ['#E5E7EB', '#E5E7EB'] // Gray for disabled
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.continueButtonGradient}
                  >
                    <Text style={[
                      styles.continueButtonText,
                      !agreedToGuidelines && styles.continueButtonTextDisabled
                    ]}>
                      Create Profile
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            </Animated.View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Primary white background from design system
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg, // Using design system token
    paddingVertical: SPACING.md,   // Using design system token
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB', // Light border color from design system
    backgroundColor: '#FFFFFF', // Primary white background from design system
    position: 'relative', // Enable absolute positioning for center content
  },
  backButtonContainer: {
    width: 72, // Even bigger container
    marginLeft: -SPACING.md, // Move further left using design system token
    zIndex: 1, // Ensure it's above other elements
  },
  headerCenter: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 0, // Behind the back button
  },
  headerTitle: {
    fontSize: 20, // Slightly larger for main title
    fontWeight: '600', // SemiBold weight for prominence
    color: '#1B1B3A', // Primary text color from design system
    marginBottom: SPACING.sm, // Using design system token
    fontFamily: Fonts.semiBold, // Poppins SemiBold from design system
  },
  progressContainer: {
    width: '60%', // Make it shorter
    paddingHorizontal: SPACING.md, // Using design system token
  },
  progressBar: {
    marginTop: SPACING.xs, // Using design system token
  },
  headerRight: {
    width: 72, // Same size as back button for balance
    zIndex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg, // Using design system token
    paddingTop: SPACING.lg,        // Using design system token
    paddingBottom: SPACING.lg,     // Add bottom padding for content
    // Grid-based layout structure
    display: 'flex',
    flexDirection: 'column',
  },
  illustrationContainer: {
    alignItems: 'center',
    marginBottom: SPACING.lg, // Using design system token
  },
  illustrationGradient: {
    width: 80,
    height: 80,
    borderRadius: 40, // Full radius for circle
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF4F81', // Pink shadow
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  title: {
    fontSize: 28, // Large title size
    fontWeight: '700', // Bold weight from design system
    color: '#1B1B3A', // Primary text color from design system
    textAlign: 'center',
    marginBottom: SPACING.sm, // Using design system token
    lineHeight: 36,
    letterSpacing: -0.5,
    fontFamily: Fonts.bold, // Poppins Bold from design system
  },
  subtitle: {
    fontSize: 16, // Body text size from design system
    color: '#6B7280', // Secondary text color from design system
    textAlign: 'center',
    marginBottom: SPACING.lg, // Using design system token
    lineHeight: 24,
    paddingHorizontal: SPACING.md, // Using design system token
    fontFamily: Fonts.regular, // Inter Regular from design system
  },
  guidelinesContainer: {
    backgroundColor: '#F8F8F8', // Tertiary background from design system
    borderRadius: BORDER_RADIUS.lg, // Using design system token
    padding: SPACING.lg, // Using design system token
    marginBottom: SPACING.lg, // Using design system token
  },
  guidelinesTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1B1B3A', // Primary text color from design system
    marginBottom: SPACING.md, // Using design system token
    textAlign: 'center',
    fontFamily: Fonts.bold, // Poppins Bold from design system
  },
  guidelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm, // Using design system token
  },
  guidelineIcon: {
    marginRight: SPACING.sm, // Using design system token
    marginTop: 2,
  },
  guidelineText: {
    fontSize: 16,
    color: '#1B1B3A', // Primary text color from design system
    lineHeight: 22,
    flex: 1,
    fontFamily: Fonts.regular, // Inter Regular from design system
  },
  agreementContainer: {
    backgroundColor: '#F8F8F8', // Tertiary background from design system
    borderRadius: BORDER_RADIUS.lg, // Using design system token
    padding: SPACING.lg, // Using design system token
    marginBottom: SPACING.xl, // Using design system token
  },
  agreementRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkboxContainer: {
    marginRight: SPACING.sm, // Using design system token
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: BORDER_RADIUS.sm, // Using design system token
    borderWidth: 2,
    borderColor: '#E5E7EB', // Light border color from design system
    backgroundColor: '#FFFFFF', // Primary white background from design system
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#FF4F81', // Primary pink from design system
    borderColor: '#FF4F81', // Primary pink from design system
  },
  agreementTextContainer: {
    flex: 1,
  },
  agreementText: {
    fontSize: 16,
    color: '#1B1B3A', // Primary text color from design system
    lineHeight: 22,
    fontFamily: Fonts.regular, // Inter Regular from design system
  },
  buttonContainer: {
    paddingBottom: SPACING.xl, // Using design system token
  },
  continueButton: {
    borderRadius: BORDER_RADIUS.lg, // Using design system token
    overflow: 'hidden',
    marginBottom: SPACING.md, // Using design system token
  },
  continueButtonGradient: {
    paddingVertical: 18, // Using design system token
    paddingHorizontal: 32, // Using design system token
    minHeight: 56, // Using design system token
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    fontSize: 18, // Using design system token
    fontWeight: '600', // SemiBold weight from design system
    color: '#FFFFFF', // Inverse text color from design system
    fontFamily: Fonts.semiBold, // Poppins SemiBold from design system
    letterSpacing: 0.5, // Better letter spacing
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonTextDisabled: {
    color: '#9CA3AF', // Tertiary text color for disabled state
  },
});
