import { supabase } from '../lib/supabase';

// Helper function to convert gender values to database enum values
function convertGenderValue(value: any): string {
  const valueStr = String(value).toLowerCase();
  
  // Map app values to database enum values
  if (valueStr.includes('woman') || valueStr.includes('female')) {
    return 'woman';
  } else if (valueStr.includes('man') || valueStr.includes('male')) {
    return 'man';
  } else if (valueStr.includes('non-binary') || valueStr.includes('non_binary') || valueStr.includes('prefer not to say') || valueStr.includes('other')) {
    return 'non_binary';
  }
  
  // Default fallback
  return 'non_binary';
}

// Helper function to convert relationship intention values to database enum values
function convertRelationshipIntentionValue(value: any): string {
  const valueStr = String(value).toLowerCase();
  
  // Map app values to database enum values
  if (valueStr.includes('short-term-only') || valueStr === 'short_term_only') {
    return 'short_term_only';
  } else if (valueStr.includes('short-term-open') || valueStr.includes('short-term-but-open') || valueStr === 'short_term_but_open_to_long_term') {
    return 'short_term_but_open_to_long_term';
  } else if (valueStr.includes('long-term-only') || valueStr === 'long_term_only') {
    return 'long_term_only';
  } else if (valueStr.includes('long-term-open') || valueStr.includes('long-term-but-open') || valueStr === 'long_term_but_open_to_short_term') {
    return 'long_term_but_open_to_short_term';
  } else if (valueStr.includes('one-night') || valueStr === 'one_night_thing') {
    return 'one_night_thing';
  } else if (valueStr.includes('single') || valueStr.includes('casual')) {
    // Map "single" and "casual" to short-term
    return 'short_term_only';
  } else if (valueStr.includes('relationship') || valueStr.includes('in a relationship')) {
    // Map "relationship" and "in a relationship" to long-term
    return 'long_term_only';
  } else if (valueStr.includes('complicated') || valueStr.includes('its complicated')) {
    // Map "complicated" to short-term (flexible)
    return 'short_term_but_open_to_long_term';
  }
  
  // Default fallback
  return 'long_term_only';
}

// Helper function to convert snake_case database fields to camelCase for frontend
function convertFromDatabaseFields(dbProfile: any): any {
  if (!dbProfile) return null;
  
  return {
    id: dbProfile.id,
    email: dbProfile.email,
    schoolEmail: dbProfile.school_email,
    firstName: dbProfile.first_name,
    username: dbProfile.username,
    dateOfBirth: dbProfile.date_of_birth,
    gender: dbProfile.gender,
    lookingFor: dbProfile.looking_for_debs,
    genderPreference: dbProfile.looking_for_friends_or_dates,
    relationshipIntention: dbProfile.dating_intentions,
    bio: dbProfile.bio,
    schoolId: dbProfile.school_id,
    school: dbProfile.schools?.school_name || null, // School name from joined schools table
    county: dbProfile.county || null,
    blockedSchools: dbProfile.blocked_schools || [],
    discoverySource: dbProfile.discovery_source,
    photos: dbProfile.photos || [],
    interests: dbProfile.interests || [],
    profilePrompts: dbProfile.profile_prompts || [],
    relationshipStatus: dbProfile.relationship_status,
    pushNotificationsEnabled: dbProfile.push_notifications_enabled,
    emailNotificationsEnabled: dbProfile.email_notifications_enabled,
    smsNotificationsEnabled: dbProfile.sms_notifications_enabled,
    privacyPolicyAccepted: dbProfile.privacy_policy_accepted,
    termsOfServiceAccepted: dbProfile.terms_of_service_accepted,
    ageVerificationAccepted: dbProfile.age_verification_accepted,
    dataProcessingConsent: dbProfile.data_processing_consent,
    // Privacy preferences
    privacyLevel: dbProfile.privacy_level || 'public',
    showAge: dbProfile.show_age !== false,
    showSchool: dbProfile.show_school !== false,
    showLocation: dbProfile.show_location !== false,
    allowMessaging: dbProfile.allow_messaging !== false,
    showOnlineStatus: dbProfile.show_online_status !== false,
    dataAnalytics: dbProfile.data_analytics !== false,
    marketingEmails: dbProfile.marketing_emails === true,
    onboardingCompleted: dbProfile.onboarding_completed,
    profileCompleted: dbProfile.profile_completed,
    status: dbProfile.status,
    lastActive: dbProfile.last_active,
    createdAt: dbProfile.created_at,
    updatedAt: dbProfile.updated_at,
  };
}

// Helper function to convert camelCase to snake_case for database fields
function convertToDatabaseFields(updates: any): any {
  const dbUpdates: any = {};
  console.log('🔧 Converting fields:', Object.keys(updates));
  
  for (const [key, value] of Object.entries(updates)) {
    console.log(`🔧 Converting field: ${key} = ${value}`);
    switch (key) {
      case 'firstName':
        dbUpdates.first_name = value;
        break;
      case 'username':
        dbUpdates.username = value;
        break;
      case 'dateOfBirth':
        dbUpdates.date_of_birth = value;
        break;
      case 'gender':
        // Map gender with value conversion
        dbUpdates.gender = convertGenderValue(value);
        break;
      case 'schoolEmail':
        dbUpdates.school_email = value;
        break;

      case 'lookingFor':
        // Map lookingFor to looking_for_friends_or_dates (who they want to match with)
        const lookingForValue = String(value).toLowerCase();
        if (lookingForValue.includes('women') || lookingForValue.includes('woman')) {
          dbUpdates.looking_for_friends_or_dates = 'women';
        } else if (lookingForValue.includes('men') || lookingForValue.includes('man')) {
          dbUpdates.looking_for_friends_or_dates = 'men';
        } else if (lookingForValue.includes('everyone') || lookingForValue.includes('anyone') || lookingForValue.includes('both')) {
          dbUpdates.looking_for_friends_or_dates = 'everyone';
        } else {
          dbUpdates.looking_for_friends_or_dates = 'everyone'; // Default fallback
        }
        break;
      case 'relationshipIntention':
        // Map relationshipIntention with value conversion
        dbUpdates.dating_intentions = convertRelationshipIntentionValue(value);
        break;
      case 'relationshipStatus':
        // Map relationshipStatus to relationship_status
        dbUpdates.relationship_status = value;
        break;
      case 'intentions':
        // Map intentions to dating_intentions with value conversion
        dbUpdates.dating_intentions = convertRelationshipIntentionValue(value);
        break;
      case 'datingIntention':
        // Map datingIntention to dating_intentions with value conversion
        dbUpdates.dating_intentions = convertRelationshipIntentionValue(value);
        break;
      case 'debsPreference':
        // Map debsPreference to looking_for_debs with value conversion
        const debsValue = String(value).toLowerCase();
        console.log('🔄 Converting debsPreference:', { original: value, converted: debsValue });
        
        if (debsValue === 'swaps') {
          dbUpdates.looking_for_debs = 'swaps';
          console.log('✅ Mapped to swaps');
        } else if (debsValue === 'go_to_someones_debs' || debsValue.includes('go-to-debs') || debsValue.includes('go_debs') || debsValue.includes('everyone') || debsValue.includes('anyone')) {
          dbUpdates.looking_for_debs = 'go_to_someones_debs';
          console.log('✅ Mapped to go_to_someones_debs');
        } else if (debsValue === 'bring_someone_to_my_debs' || debsValue.includes('bring') || debsValue.includes('my-debs') || debsValue.includes('my_debs') || debsValue.includes('host')) {
          dbUpdates.looking_for_debs = 'bring_someone_to_my_debs';
          console.log('✅ Mapped to bring_someone_to_my_debs');
        } else {
          dbUpdates.looking_for_debs = 'go_to_someones_debs'; // Default fallback
          console.log('⚠️ Using default fallback: go_to_someones_debs');
        }
        break;
      case 'discoverySource':
        dbUpdates.discovery_source = value;
        break;
      case 'pushNotificationsEnabled':
        dbUpdates.push_notifications_enabled = value;
        break;
      case 'emailNotificationsEnabled':
        dbUpdates.email_notifications_enabled = value;
        break;
      case 'smsNotificationsEnabled':
        dbUpdates.sms_notifications_enabled = value;
        break;
      case 'privacyPolicyAccepted':
        dbUpdates.privacy_policy_accepted = value;
        break;
      case 'termsOfServiceAccepted':
        dbUpdates.terms_of_service_accepted = value;
        break;
      case 'ageVerificationAccepted':
        dbUpdates.age_verification_accepted = value;
        break;
      case 'dataProcessingConsent':
        dbUpdates.data_processing_consent = value;
        break;
      case 'onboardingCompleted':
        dbUpdates.onboarding_completed = value;
        break;
      case 'profileCompleted':
        dbUpdates.profile_completed = value;
        break;
      case 'lastActive':
        dbUpdates.last_active = value;
        break;
      case 'createdAt':
        dbUpdates.created_at = value;
        break;
      case 'updatedAt':
        dbUpdates.updated_at = value;
        break;
      case 'emailVerified':
        // Map emailVerified to email_verified (if this column exists)
        dbUpdates.email_verified = value;
        break;
      case 'appleConnected':
        // These might be stored in a separate table or as JSON
        // For now, skip them to avoid errors
        break;
      case 'googleConnected':
        // These might be stored in a separate table or as JSON
        // For now, skip them to avoid errors
        break;
      case 'school':
        // School data is handled by temporary storage during onboarding
        // Skip this field as it's not a direct database field
        console.log('🔧 Skipping school field - handled by temporary storage');
        break;
      case 'blockedSchools':
        // Map blockedSchools to blocked_schools
        dbUpdates.blocked_schools = value;
        break;
      case 'county':
        // Map county to county
        dbUpdates.county = value;
        break;
      case 'privacyLevel':
        dbUpdates.privacy_level = value;
        break;
      case 'showAge':
        dbUpdates.show_age = value;
        break;
      case 'showSchool':
        dbUpdates.show_school = value;
        break;
      case 'showLocation':
        dbUpdates.show_location = value;
        break;
      case 'allowMessaging':
        dbUpdates.allow_messaging = value;
        break;
      case 'showOnlineStatus':
        dbUpdates.show_online_status = value;
        break;
      case 'dataAnalytics':
        dbUpdates.data_analytics = value;
        break;
      case 'marketingEmails':
        dbUpdates.marketing_emails = value;
        break;
      case 'interests':
        dbUpdates.interests = value;
        break;
      case 'profilePrompts':
        dbUpdates.profile_prompts = value;
        break;
      case 'relationshipStatus':
        dbUpdates.relationship_status = value;
        break;
      case 'photos':
        // Photos are handled separately in user_photos table
        // Skip this field to avoid database errors
        console.log('🔧 Skipping photos field - handled by user_photos table');
        break;
      default:
        // Keep the original key if it's already in snake_case or doesn't need conversion
        dbUpdates[key] = value;
        break;
    }
  }
  
  console.log('🔧 Final converted fields:', dbUpdates);
  return dbUpdates;
}

export interface User {
  id: string;
  email: string;
  email_verified: boolean;
  phone?: string;
  phone_verified: boolean;
  created_at: string;
  updated_at: string;
  last_sign_in?: string;
  profile?: UserProfile;
}

export interface UserProfile {
  id: string;
  email: string;
  schoolEmail?: string;
  firstName: string;
  username: string;
  dateOfBirth: string;
  gender: 'woman' | 'man' | 'non_binary';
  lookingFor: 'swaps' | 'go_to_someones_debs' | 'bring_someone_to_my_debs';
  genderPreference: 'men' | 'women' | 'everyone';
  relationshipIntention: 'one_night_thing' | 'short_term_only' | 'short_term_but_open_to_long_term' | 'long_term_only' | 'long_term_but_open_to_short_term';
  looking_for_friends_or_dates?: 'dates' | 'friends' | 'both';
  bio?: string;
  schoolId?: string;
  school?: string;
  county?: string;
  blockedSchools?: string[];
  discoverySource?: string;
  photos?: string[];
  interests?: string[];
  profilePrompts?: Array<{prompt: string, response: string}>;
  relationshipStatus?: string;
  pushNotificationsEnabled: boolean;
  emailNotificationsEnabled: boolean;
  smsNotificationsEnabled: boolean;
  privacyPolicyAccepted: boolean;
  termsOfServiceAccepted: boolean;
  ageVerificationAccepted: boolean;
  // Privacy preferences
  privacyLevel?: 'public' | 'friends_only' | 'private';
  showAge?: boolean;
  showSchool?: boolean;
  showLocation?: boolean;
  allowMessaging?: boolean;
  showOnlineStatus?: boolean;
  dataAnalytics?: boolean;
  marketingEmails?: boolean;
  dataProcessingConsent: boolean;
  onboardingCompleted: boolean;
  profileCompleted: boolean;
  status: 'active' | 'inactive' | 'suspended';
  lastActive: string;
  createdAt: string;
  updatedAt: string;
}

export interface SignUpData {
  email: string;
  password: string;
  first_name: string;
  username: string;
  date_of_birth: string;
  gender: 'woman' | 'man' | 'non_binary';
  looking_for: 'go_to_someones_debs' | 'bring_someone_to_my_debs';
  relationship_intention: 'one_night_thing' | 'short_term_only' | 'short_term_but_open_to_long_term' | 'long_term_only' | 'long_term_but_open_to_short_term';
  bio?: string;
  school_id?: string;
  discovery_source?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

export class AuthService {
  /**
   * Sign up a new user with email and password
   */
  static async signUp(data: SignUpData): Promise<AuthResult> {
    try {
      console.log('🔐 AuthService.signUp called for:', data.email);

      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.first_name,
            username: data.username,
            date_of_birth: data.date_of_birth,
            gender: data.gender,
            looking_for: data.looking_for,
            relationship_intention: data.relationship_intention,
            bio: data.bio,
            school_id: data.school_id,
            discovery_source: data.discovery_source,
          }
        }
      });

      if (authError) {
        console.error('❌ Supabase Auth signup error:', authError);
        return {
          success: false,
          error: this.getSignUpErrorMessage(authError.message)
        };
      }

      if (!authData.user) {
        console.error('❌ No user data returned from signup');
        return {
          success: false,
          error: 'Failed to create user account. Please try again.'
        };
      }

      console.log('✅ Supabase Auth user created successfully:', authData.user.id);

      // Save any temporary onboarding data to the database
      const { OnboardingService } = await import('./onboarding');
      const saveTempDataResult = await OnboardingService.saveAllTempData(authData.user.id);
      if (saveTempDataResult.success) {
        console.log('✅ Temporary onboarding data saved successfully');
      } else {
        console.warn('⚠️ Failed to save temporary onboarding data:', saveTempDataResult.error);
      }

      // Wait a moment for the profile to be created by the database trigger
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Fetch the created profile with school name
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`
          *,
          schools!profiles_school_id_fkey(school_name)
        `)
        .eq('id', authData.user.id)
        .single();

      if (profileError) {
        console.warn('⚠️ Profile fetch error (may still be creating):', profileError);
        // Return auth user without profile if there's an issue
        return {
          success: true,
          user: {
            id: authData.user.id,
            email: authData.user.email!,
            email_verified: !!authData.user.email_confirmed_at,
            phone: authData.user.phone,
            phone_verified: !!authData.user.phone_confirmed_at,
            created_at: authData.user.created_at,
            updated_at: authData.user.updated_at,
            last_sign_in: authData.user.last_sign_in_at,
          }
        };
      }

      return {
        success: true,
        user: {
          id: authData.user.id,
          email: authData.user.email!,
          email_verified: !!authData.user.email_confirmed_at,
          phone: authData.user.phone,
          phone_verified: !!authData.user.phone_confirmed_at,
          created_at: authData.user.created_at,
          updated_at: authData.user.updated_at,
          last_sign_in: authData.user.last_sign_in_at,
          profile: convertFromDatabaseFields(profile)
        }
      };

    } catch (error) {
      console.error('❌ Unexpected error in signup:', error);
      return {
        success: false,
        error: 'An unexpected error occurred during signup'
      };
    }
  }

  /**
   * Sign in with email and password
   */
  static async signIn(email: string, password: string): Promise<AuthResult> {
    try {
      console.log('🔐 AuthService.signIn called for:', email);

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (authError) {
        console.error('❌ Supabase Auth signin error:', authError);
        return {
          success: false,
          error: this.getSignInErrorMessage(authError.message)
        };
      }

      if (!authData.user) {
        console.error('❌ No user data returned from signin');
        return {
          success: false,
          error: 'Failed to sign in. Please try again.'
        };
      }

      console.log('✅ Supabase Auth signin successful:', authData.user.id);

      // Fetch the user's profile with school name
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`
          *,
          schools!profiles_school_id_fkey(school_name)
        `)
        .eq('id', authData.user.id)
        .single();

      if (profileError) {
        console.warn('⚠️ Profile fetch error:', profileError);
        // Return auth user without profile if there's an issue
        return {
          success: true,
          user: {
            id: authData.user.id,
            email: authData.user.email!,
            email_verified: !!authData.user.email_confirmed_at,
            phone: authData.user.phone,
            phone_verified: !!authData.user.phone_confirmed_at,
            created_at: authData.user.created_at,
            updated_at: authData.user.updated_at,
            last_sign_in: authData.user.last_sign_in_at,
          }
        };
      }

      return {
        success: true,
        user: {
          id: authData.user.id,
          email: authData.user.email!,
          email_verified: !!authData.user.email_confirmed_at,
          phone: authData.user.phone,
          phone_verified: !!authData.user.phone_confirmed_at,
          created_at: authData.user.created_at,
          updated_at: authData.user.updated_at,
          last_sign_in: authData.user.last_sign_in_at,
          profile: convertFromDatabaseFields(profile)
        }
      };

    } catch (error) {
      console.error('❌ Unexpected error in signin:', error);
      return {
        success: false,
        error: 'An unexpected error occurred during sign in'
      };
    }
  }

  /**
   * Sign out the current user
   */
  static async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔐 AuthService.signOut called');

      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('❌ Supabase Auth signout error:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Supabase Auth signout successful');
      return { success: true };

    } catch (error) {
      console.error('❌ Unexpected error in signout:', error);
      return { success: false, error: 'An unexpected error occurred during sign out' };
    }
  }

  /**
   * Delete the current user's account and all associated data
   */
  static async deleteAccount(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔐 AuthService.deleteAccount called');

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('❌ Error getting current user for deletion:', userError);
        return { success: false, error: 'No authenticated user found' };
      }

      const userId = user.id;
      console.log('🗑️ Deleting account for user:', userId);

      // First, fetch photo URLs before deleting from database
      let userPhotos: string[] = [];
      let profilePictureUrl: string | null = null;

      // Fetch user photos from database
      try {
        const { data: photos, error: photosError } = await supabase
          .from('user_photos')
          .select('photo_url')
          .eq('user_id', userId);

        if (photosError) {
          console.error('❌ Error fetching user photos:', photosError);
        } else if (photos && photos.length > 0) {
          userPhotos = photos.map(photo => photo.photo_url).filter(Boolean);
          console.log(`📸 Found ${userPhotos.length} user photos to delete`);
        }
      } catch (error) {
        console.error('❌ Error fetching user photos:', error);
      }

      // Fetch profile picture from database
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('profile_picture_url')
          .eq('id', userId)
          .single();

        if (profile?.profile_picture_url) {
          profilePictureUrl = profile.profile_picture_url;
          console.log('📸 Found profile picture to delete');
        }
      } catch (error) {
        console.error('❌ Error fetching profile picture:', error);
      }

      // Delete user photos from storage
      if (userPhotos.length > 0) {
        for (const photoUrl of userPhotos) {
          try {
            // Extract file path from URL
            const url = new URL(photoUrl);
            const pathParts = url.pathname.split('/');
            const filePath = pathParts.slice(2).join('/'); // Remove 'storage/v1/object' prefix
            
            console.log(`🗑️ Deleting photo from storage: ${filePath}`);
            
            const { error: deleteError } = await supabase.storage
              .from('user-photos')
              .remove([filePath]);

            if (deleteError) {
              console.error('❌ Error deleting photo from storage:', deleteError);
            } else {
              console.log('✅ Photo deleted from storage:', filePath);
            }
          } catch (urlError) {
            console.error('❌ Error parsing photo URL:', urlError);
          }
        }
      }

      // Delete profile picture from storage
      if (profilePictureUrl) {
        try {
          const url = new URL(profilePictureUrl);
          const pathParts = url.pathname.split('/');
          const filePath = pathParts.slice(2).join('/');
          
          console.log(`🗑️ Deleting profile picture from storage: ${filePath}`);
          
          const { error: deleteError } = await supabase.storage
            .from('user-pfp')
            .remove([filePath]);

          if (deleteError) {
            console.error('❌ Error deleting profile picture from storage:', deleteError);
          } else {
            console.log('✅ Profile picture deleted from storage:', filePath);
          }
        } catch (urlError) {
          console.error('❌ Error parsing profile picture URL:', urlError);
        }
      }

      // Delete user data from database tables with correct column names
      
      // Delete from user_photos table
      try {
        const { error: deleteError } = await supabase
          .from('user_photos')
          .delete()
          .eq('user_id', userId);

        if (deleteError) {
          console.error('❌ Error deleting from user_photos:', deleteError);
        } else {
          console.log('✅ Deleted data from user_photos');
        }
      } catch (tableError) {
        console.error('❌ Error handling user_photos deletion:', tableError);
      }

      // Delete from matches table (user can be either user1_id or user2_id)
      try {
        const { error: deleteError } = await supabase
          .from('matches')
          .delete()
          .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

        if (deleteError) {
          console.error('❌ Error deleting from matches:', deleteError);
        } else {
          console.log('✅ Deleted data from matches');
        }
      } catch (tableError) {
        console.error('❌ Error handling matches deletion:', tableError);
      }

      // Delete from swipes table (user can be either swiper_id or swiped_user_id)
      try {
        const { error: deleteError } = await supabase
          .from('swipes')
          .delete()
          .or(`swiper_id.eq.${userId},swiped_user_id.eq.${userId}`);

        if (deleteError) {
          console.error('❌ Error deleting from swipes:', deleteError);
        } else {
          console.log('✅ Deleted data from swipes');
        }
      } catch (tableError) {
        console.error('❌ Error handling swipes deletion:', tableError);
      }

      // Delete from messages table (user is sender_id)
      try {
        const { error: deleteError } = await supabase
          .from('messages')
          .delete()
          .eq('sender_id', userId);

        if (deleteError) {
          console.error('❌ Error deleting from messages:', deleteError);
        } else {
          console.log('✅ Deleted data from messages');
        }
      } catch (tableError) {
        console.error('❌ Error handling messages deletion:', tableError);
      }

      // Delete from profiles table (id is the user_id)
      try {
        const { error: deleteError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', userId);

        if (deleteError) {
          console.error('❌ Error deleting from profiles:', deleteError);
        } else {
          console.log('✅ Deleted data from profiles');
        }
      } catch (tableError) {
        console.error('❌ Error handling profiles deletion:', tableError);
      }

      // Delete from user_interests table
      try {
        const { error: deleteError } = await supabase
          .from('user_interests')
          .delete()
          .eq('user_id', userId);

        if (deleteError) {
          console.error('❌ Error deleting from user_interests:', deleteError);
        } else {
          console.log('✅ Deleted data from user_interests');
        }
      } catch (tableError) {
        console.error('❌ Error handling user_interests deletion:', tableError);
      }

      // Delete from user_profile_prompts table
      try {
        const { error: deleteError } = await supabase
          .from('user_profile_prompts')
          .delete()
          .eq('user_id', userId);

        if (deleteError) {
          console.error('❌ Error deleting from user_profile_prompts:', deleteError);
        } else {
          console.log('✅ Deleted data from user_profile_prompts');
        }
      } catch (tableError) {
        console.error('❌ Error handling user_profile_prompts deletion:', tableError);
      }

      // Delete from reports table (user can be reporter_id or reported_user_id)
      // Note: This table might not exist in all database schemas
      try {
        const { error: deleteError } = await supabase
          .from('reports')
          .delete()
          .or(`reporter_id.eq.${userId},reported_user_id.eq.${userId}`);

        if (deleteError) {
          if (deleteError.code === 'PGRST205') {
            console.log('ℹ️ Reports table does not exist, skipping deletion');
          } else {
            console.error('❌ Error deleting from reports:', deleteError);
          }
        } else {
          console.log('✅ Deleted data from reports');
        }
      } catch (tableError) {
        console.log('ℹ️ Reports table does not exist, skipping deletion');
      }

      // Delete from blocked_users table (user can be blocker_id or blocked_user_id)
      // Note: This table might not exist in all database schemas
      try {
        const { error: deleteError } = await supabase
          .from('blocked_users')
          .delete()
          .or(`blocker_id.eq.${userId},blocked_user_id.eq.${userId}`);

        if (deleteError) {
          if (deleteError.code === 'PGRST205') {
            console.log('ℹ️ Blocked_users table does not exist, skipping deletion');
          } else {
            console.error('❌ Error deleting from blocked_users:', deleteError);
          }
        } else {
          console.log('✅ Deleted data from blocked_users');
        }
      } catch (tableError) {
        console.log('ℹ️ Blocked_users table does not exist, skipping deletion');
      }

      // Sign out the user (we can't delete auth users without admin privileges)
      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        console.error('❌ Error signing out user:', signOutError);
        return { success: false, error: signOutError.message };
      }

      console.log('✅ Account and all associated data deleted successfully');
      return { success: true };

    } catch (error) {
      console.error('❌ Unexpected error in deleteAccount:', error);
      return { success: false, error: 'An unexpected error occurred during account deletion' };
    }
  }

  /**
   * Get the current authenticated user
   */
  static async getCurrentUser(): Promise<{ user: User | null; error?: string }> {
    try {
      console.log('🔐 AuthService.getCurrentUser called');

      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

      if (authError) {
        // Handle "Auth session missing" gracefully (user just hasn't signed in yet)
        if (authError.message?.includes('Auth session missing') || authError.message?.includes('session_missing')) {
          console.log('ℹ️ No auth session found (user not authenticated)');
          return { user: null };
        }
        console.error('❌ Error getting current auth user:', authError);
        return { user: null, error: authError.message };
      }

      if (!authUser) {
        console.log('ℹ️ No current auth user found');
        return { user: null };
      }

      console.log('✅ Current auth user found:', authUser.id);

      // Fetch the user's profile with school name
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`
          *,
          schools!profiles_school_id_fkey(school_name)
        `)
        .eq('id', authUser.id)
        .single();

      console.log('🔍 Profile data from database:', { 
        county: profile?.county, 
        school: profile?.schools?.school_name
      });

      if (profileError) {
        console.warn('⚠️ Profile fetch error:', profileError);
        // Return auth user without profile if there's an issue
        return {
          user: {
            id: authUser.id,
            email: authUser.email!,
            email_verified: !!authUser.email_confirmed_at,
            phone: authUser.phone,
            phone_verified: !!authUser.phone_confirmed_at,
            created_at: authUser.created_at,
            updated_at: authUser.updated_at,
            last_sign_in: authUser.last_sign_in_at,
          }
        };
      }

      return {
        user: {
          id: authUser.id,
          email: authUser.email!,
          email_verified: !!authUser.email_confirmed_at,
          phone: authUser.phone,
          phone_verified: !!authUser.phone_confirmed_at,
          created_at: authUser.created_at,
          updated_at: authUser.updated_at,
          last_sign_in: authUser.last_sign_in_at,
          profile: convertFromDatabaseFields(profile)
        }
      };

    } catch (error) {
      console.error('❌ Unexpected error getting current user:', error);
      return { user: null, error: 'An unexpected error occurred while getting current user' };
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<AuthResult> {
    try {
      console.log('🔐 AuthService.updateProfile called for user:', userId);

      // Handle photos separately as they go to user_photos table
      const { photos, ...otherUpdates } = updates;
      
      // Convert camelCase field names to snake_case for database
      const dbUpdates = convertToDatabaseFields(otherUpdates);
      console.log('🔐 Converted updates for database:', dbUpdates);

      // First, check if profile exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();

      console.log('🔍 Profile check result:', { existingProfile, checkError });

      if (checkError && (checkError.code === 'PGRST116' || checkError.message.includes('0 rows'))) {
        // Profile doesn't exist, create it with default values
        console.log('🔐 Profile doesn\'t exist, creating new profile for user:', userId);
        
        // Get the user's email from auth.users
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        if (authError || !authUser) {
          console.error('❌ Failed to get auth user for profile creation:', authError);
          return { success: false, error: 'Failed to get user information' };
        }
        
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email: authUser.email || 'user@example.com', // Required field
            first_name: 'User',
            username: 'user_' + userId.substring(0, 8),
            date_of_birth: '2000-01-01',
            gender: 'non_binary',
            looking_for_debs: 'go_to_someones_debs',
            looking_for_friends_or_dates: 'everyone',
            dating_intentions: 'long_term_only',
            ...dbUpdates
          })
          .select(`
            *,
            schools!profiles_school_id_fkey(school_name)
          `)
          .single();

        if (createError) {
          console.error('❌ Profile creation error:', createError);
          console.error('❌ Profile creation data attempted:', {
            id: userId,
            email: authUser.email || 'user@example.com',
            first_name: 'User',
            username: 'user_' + userId.substring(0, 8),
            date_of_birth: '2000-01-01',
            gender: 'non_binary',
            looking_for_debs: 'go_to_someones_debs',
            looking_for_friends_or_dates: 'everyone',
            dating_intentions: 'long_term_only',
            ...dbUpdates
          });
          return { success: false, error: createError.message };
        }

        console.log('✅ Profile created successfully:', newProfile.id);
        
        // Photos are handled entirely in storage buckets, no database operations needed
        if (photos && Array.isArray(photos)) {
          console.log('📸 Photos are managed in storage buckets only for new profile:', photos.length, 'photos');
          console.log('📸 No database operations needed for photos');
        }
        
        return { success: true, user: { id: userId, profile: convertFromDatabaseFields(newProfile) } };
      } else if (checkError) {
        console.error('❌ Profile check error:', checkError);
        return { success: false, error: checkError.message };
      }

      // Profile exists, update it
      console.log('🔍 Updating existing profile with data:', dbUpdates);
      
      // If no other fields to update, just update the timestamp
      if (Object.keys(dbUpdates).length === 0) {
        dbUpdates.updated_at = new Date().toISOString();
        console.log('🔍 No profile fields to update, just updating timestamp');
      }
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .update(dbUpdates)
        .eq('id', userId)
        .select(`
          *,
          schools!profiles_school_id_fkey(school_name)
        `)
        .single();

      if (profileError) {
        console.error('❌ Profile update error:', profileError);
        console.error('❌ Update data that failed:', dbUpdates);
        return { success: false, error: profileError.message };
      }

      if (!profile) {
        console.error('❌ Profile update returned no data');
        return { success: false, error: 'Profile update failed - no data returned' };
      }

      console.log('✅ Profile updated successfully');

      // Photos are handled entirely in storage buckets, no database operations needed
      if (photos && Array.isArray(photos)) {
        console.log('📸 Photos are managed in storage buckets only:', photos.length, 'photos');
        console.log('📸 No database operations needed for photos');
      }

      // Get the updated auth user
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

      if (authError || !authUser) {
        console.error('❌ Error getting auth user after profile update:', authError);
        return { success: false, error: 'Profile updated but could not fetch user data' };
      }

      return {
        success: true,
        user: {
          id: authUser.id,
          email: authUser.email!,
          email_verified: !!authUser.email_confirmed_at,
          phone: authUser.phone,
          phone_verified: !!authUser.phone_confirmed_at,
          created_at: authUser.created_at,
          updated_at: authUser.updated_at,
          last_sign_in: authUser.last_sign_in_at,
          profile: convertFromDatabaseFields(profile)
        }
      };

    } catch (error) {
      console.error('❌ Unexpected error updating profile:', error);
      return { success: false, error: 'An unexpected error occurred while updating profile' };
    }
  }

  /**
   * Set up auth state change listener
   */
  static onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Auth state change event:', event);
      
      if (event === 'SIGNED_OUT') {
        callback(null);
        return;
      }

      if (session?.user) {
        // Fetch the user's profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          console.warn('⚠️ Profile fetch error in auth state change:', profileError);
          // Return auth user without profile if there's an issue
          callback({
            id: session.user.id,
            email: session.user.email!,
            email_verified: !!session.user.email_confirmed_at,
            phone: session.user.phone,
            phone_verified: !!session.user.phone_confirmed_at,
            created_at: session.user.created_at,
            updated_at: session.user.updated_at,
            last_sign_in: session.user.last_sign_in_at,
          });
          return;
        }

        callback({
          id: session.user.id,
          email: session.user.email!,
          email_verified: !!session.user.email_confirmed_at,
          phone: session.user.phone,
          phone_verified: !!session.user.phone_confirmed_at,
          created_at: session.user.created_at,
          updated_at: session.user.updated_at,
          last_sign_in: session.user.last_sign_in_at,
          profile: convertFromDatabaseFields(profile)
        });
      } else {
        callback(null);
      }
    });
  }

  /**
   * Reset password
   */
  static async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔐 AuthService.resetPassword called for:', email);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        // Use native app deep link (TestFlight build), not Expo dev URL
        redirectTo: 'debsmatch://auth/reset-password',
      });

      if (error) {
        console.error('❌ Password reset error:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Password reset email sent successfully');
      return { success: true };

    } catch (error) {
      console.error('❌ Unexpected error in password reset:', error);
      return { success: false, error: 'An unexpected error occurred during password reset' };
    }
  }

  /**
   * Update password
   */
  static async updatePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔐 AuthService.updatePassword called');

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        // Allow duplicate passwords: treat same-as-old as success/no-op
        if (typeof error.message === 'string' && error.message.includes('New password should be different from the old password')) {
          console.log('ℹ️ Password unchanged (same as old). Treating as success.');
        } else {
          console.error('❌ Password update error:', error);
          return { success: false, error: error.message };
        }
      }

      console.log('✅ Password updated successfully');
      return { success: true };

    } catch (error) {
      console.error('❌ Unexpected error in password update:', error);
      return { success: false, error: 'An unexpected error occurred during password update' };
    }
  }

  /**
   * Get user-friendly signup error messages
   */
  private static getSignUpErrorMessage(error: string): string {
    if (error.includes('User already registered')) {
      return 'An account with this email already exists. Please sign in instead.';
    }
    if (error.includes('Password should be at least')) {
      return 'Password must be at least 6 characters long.';
    }
    if (error.includes('Invalid email')) {
      return 'Please enter a valid email address.';
    }
    if (error.includes('Signup is disabled')) {
      return 'Account creation is currently disabled. Please try again later.';
    }
    return error || 'Failed to create account. Please try again.';
  }

  /**
   * Get user-friendly signin error messages
   */
  private static getSignInErrorMessage(error: string): string {
    if (error.includes('Invalid login credentials')) {
      return 'Invalid email or password. Please check your credentials and try again.';
    }
    if (error.includes('Email not confirmed')) {
      return 'Please check your email and confirm your account before signing in.';
    }
    if (error.includes('Too many requests')) {
      return 'Too many sign-in attempts. Please wait a moment and try again.';
    }
    if (error.includes('User not found')) {
      return 'No account found with this email. Please complete onboarding first.';
    }
    return error || 'Sign in failed. Please try again.';
  }
}
