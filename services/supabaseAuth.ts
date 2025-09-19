import { supabase } from '../lib/supabase';
import { AuthUser, Profile, OnboardingData } from '../lib/supabase';

export interface SupabaseAuthUser {
  id: string;
  email: string;
  email_verified?: boolean;
  phone?: string;
  phone_verified?: boolean;
  created_at: string;
  updated_at: string;
  last_sign_in?: string;
  profile?: Profile;
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

export class SupabaseAuthService {
  // Sign up with email and password
  static async signUp(data: SignUpData): Promise<{ user: SupabaseAuthUser | null; error: string | null }> {
    try {
      console.log('🔐 === SUPABASE AUTH SIGNUP STARTED ===');
      console.log('🔐 Creating new user account for:', data.email);
      console.log('🔐 === COMPLETE SIGNUP DATA DEBUG ===');
      console.log('🔐 Password provided:', data.password ? 'YES' : 'NO');
      console.log('🔐 Password type:', typeof data.password);
      console.log('🔐 Password length:', data.password?.length || 0);
      console.log('🔐 Password value (first 3 chars):', data.password ? data.password.substring(0, 3) + '...' : 'undefined');
      console.log('🔐 Email provided:', data.email ? 'YES' : 'NO');
      console.log('🔐 Email value:', data.email);
      console.log('🔐 First name:', data.first_name);
      console.log('🔐 Username:', data.username);
      console.log('🔐 Date of birth:', data.date_of_birth);
      console.log('🔐 Gender:', data.gender);
      console.log('🔐 Looking for:', data.looking_for);
      console.log('🔐 Relationship intention:', data.relationship_intention);
      console.log('🔐 Bio:', data.bio || 'No bio');
      console.log('🔐 School ID:', data.school_id || 'No school ID');
      console.log('🔐 === END COMPLETE SIGNUP DATA DEBUG ===');

      // Create user in Supabase Auth
      console.log('🔐 === CALLING SUPABASE AUTH API ===');
      console.log('🔐 API call data:', {
        email: data.email,
        password: data.password ? `[${data.password.length} chars]` : 'undefined',
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
      
      console.log('🔐 === SUPABASE AUTH API RESPONSE ===');
      console.log('🔐 API response received:', !!authData);
      console.log('🔐 API error received:', !!authError);
      if (authError) {
        console.log('🔐 API error details:', authError);
        console.log('🔐 API error message:', authError.message);
        console.log('🔐 API error code:', authError.code);
      }
      if (authData) {
        console.log('🔐 API response data keys:', Object.keys(authData));
        console.log('🔐 User object received:', !!authData.user);
        console.log('🔐 Session object received:', !!authData.session);
        if (authData.user) {
          console.log('🔐 User ID:', authData.user.id);
          console.log('🔐 User email:', authData.user.email);
          console.log('🔐 User email confirmed:', !!authData.user.email_confirmed_at);
          console.log('🔐 User created at:', authData.user.created_at);
          console.log('🔐 User last sign in:', authData.user.last_sign_in_at);
        }
        if (authData.session) {
          console.log('🔐 Session access token exists:', !!authData.session.access_token);
          console.log('🔐 Session refresh token exists:', !!authData.session.refresh_token);
        }
      }
      console.log('🔐 === END SUPABASE AUTH API RESPONSE ===');

      if (authError) {
        console.error('❌ Supabase Auth signup error:', authError);
        return { user: null, error: authError.message };
      }

      if (!authData.user) {
        console.error('❌ No user data returned from signup');
        return { user: null, error: 'No user data returned from signup' };
      }

      console.log('✅ Supabase Auth user created successfully:', authData.user.id);

      // The profile will be automatically created by the database trigger
      // We can fetch it to return the complete user data
      console.log('🔐 === FETCHING PROFILE AFTER AUTH CREATION ===');
      console.log('🔐 Looking for profile with ID:', authData.user.id);
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();
        
      console.log('🔐 Profile fetch result:', {
        profileReceived: !!profile,
        profileError: !!profileError,
        profileKeys: profile ? Object.keys(profile) : 'none'
      });
      console.log('🔐 === END PROFILE FETCH ===');

      if (profileError) {
        console.warn('⚠️ Profile fetch error (may still be creating):', profileError);
        // Profile might still be creating, return auth user without profile
        return {
          user: {
            id: authData.user.id,
            email: authData.user.email!,
            email_verified: authData.user.email_confirmed_at ? true : false,
            phone: authData.user.phone,
            phone_verified: authData.user.phone_confirmed_at ? true : false,
            created_at: authData.user.created_at,
            updated_at: authData.user.updated_at,
            last_sign_in: authData.user.last_sign_in_at,
          },
          error: null
        };
      }

      console.log('🔐 === FINAL SIGNUP RESULT ===');
      console.log('🔐 Final user object created:', {
        id: authData.user.id,
        email: authData.user.email,
        emailVerified: !!authData.user.email_confirmed_at,
        hasProfile: !!profile
      });
      console.log('🔐 === SIGNUP COMPLETE ===');

      return {
        user: {
          id: authData.user.id,
          email: authData.user.email!,
          email_verified: authData.user.email_confirmed_at ? true : false,
          phone: authData.user.phone,
          phone_verified: authData.user.phone_confirmed_at ? true : false,
          created_at: authData.user.created_at,
          updated_at: authData.user.updated_at,
          last_sign_in: authData.user.last_sign_in_at,
          profile: profile
        },
        error: null
      };

    } catch (error) {
      console.error('❌ Unexpected error in signup:', error);
      return { user: null, error: 'An unexpected error occurred during signup' };
    }
  }

  // Sign in with email and password
  static async signIn(data: SignInData): Promise<{ user: SupabaseAuthUser | null; error: string | null }> {
    try {
      console.log('🔐 === SUPABASE AUTH SIGNIN STARTED ===');
      console.log('🔐 Attempting to sign in user:', data.email);

      console.log('🔐 === SIGNIN API CALL ===');
      console.log('🔐 Calling Supabase Auth signInWithPassword with:');
      console.log('🔐 Email:', data.email);
      console.log('🔐 Password provided:', data.password ? 'YES' : 'NO');
      console.log('🔐 Password type:', typeof data.password);
      console.log('🔐 Password length:', data.password?.length || 0);
      console.log('🔐 === END SIGNIN API CALL ===');
      
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        console.error('❌ Supabase Auth signin error:', authError);
        return { user: null, error: authError.message };
      }

      if (!authData.user) {
        console.error('❌ No user data returned from signin');
        return { user: null, error: 'No user data returned from signin' };
      }

      console.log('✅ Supabase Auth signin successful:', authData.user.id);

      // Fetch the user's profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError) {
        console.warn('⚠️ Profile fetch error:', profileError);
        // Return auth user without profile if there's an issue
        return {
          user: {
            id: authData.user.id,
            email: authData.user.email!,
            email_verified: authData.user.email_confirmed_at ? true : false,
            phone: authData.user.phone,
            phone_verified: authData.user.phone_confirmed_at ? true : false,
            created_at: authData.user.created_at,
            updated_at: authData.user.updated_at,
            last_sign_in: authData.user.last_sign_in_at,
          },
          error: null
        };
      }

      return {
        user: {
          id: authData.user.id,
          email: authData.user.email!,
          email_verified: authData.user.email_confirmed_at ? true : false,
          phone: authData.user.phone,
          phone_verified: authData.user.phone_confirmed_at ? true : false,
          created_at: authData.user.created_at,
          updated_at: authData.user.updated_at,
          last_sign_in: authData.user.last_sign_in_at,
          profile: profile
        },
        error: null
      };

    } catch (error) {
      console.error('❌ Unexpected error in signin:', error);
      return { user: null, error: 'An unexpected error occurred during signin' };
    }
  }

  // Sign out
  static async signOut(): Promise<{ error: string | null }> {
    try {
      console.log('🔐 === SUPABASE AUTH SIGNOUT STARTED ===');

      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('❌ Supabase Auth signout error:', error);
        return { error: error.message };
      }

      console.log('✅ Supabase Auth signout successful');
      return { error: null };

    } catch (error) {
      console.error('❌ Unexpected error in signout:', error);
      return { error: 'An unexpected error occurred during signout' };
    }
  }

  // Get current user
  static async getCurrentUser(): Promise<{ user: SupabaseAuthUser | null; error: string | null }> {
    try {
      console.log('🔐 === GETTING CURRENT USER ===');

      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

      if (authError) {
        console.error('❌ Error getting current auth user:', authError);
        return { user: null, error: authError.message };
      }

      if (!authUser) {
        console.log('ℹ️ No current auth user found');
        return { user: null, error: null };
      }

      console.log('✅ Current auth user found:', authUser.id);

      // Fetch the user's profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profileError) {
        console.warn('⚠️ Profile fetch error:', profileError);
        // Return auth user without profile if there's an issue
        return {
          user: {
            id: authUser.id,
            email: authUser.email!,
            email_verified: authUser.email_confirmed_at ? true : false,
            phone: authUser.phone,
            phone_verified: authUser.phone_confirmed_at ? true : false,
            created_at: authUser.created_at,
            updated_at: authUser.updated_at,
            last_sign_in: authUser.last_sign_in_at,
          },
          error: null
        };
      }

      return {
        user: {
          id: authUser.id,
          email: authUser.email!,
          email_verified: authUser.email_confirmed_at ? true : false,
          phone: authUser.phone,
          phone_verified: authUser.phone_confirmed_at ? true : false,
          created_at: authUser.created_at,
          updated_at: authUser.updated_at,
          last_sign_in: authUser.last_sign_in_at,
          profile: profile
        },
        error: null
      };

    } catch (error) {
      console.error('❌ Unexpected error getting current user:', error);
      return { user: null, error: 'An unexpected error occurred while getting current user' };
    }
  }

  // Update user profile
  static async updateProfile(userId: string, updates: Partial<Profile>): Promise<{ user: SupabaseAuthUser | null; error: string | null }> {
    try {
      console.log('🔐 === UPDATING USER PROFILE ===');
      console.log('🔐 Updating profile for user:', userId);

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select('*')
        .single();

      if (profileError) {
        console.error('❌ Profile update error:', profileError);
        return { user: null, error: profileError.message };
      }

      console.log('✅ Profile updated successfully');

      // Get the updated auth user
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

      if (authError || !authUser) {
        console.error('❌ Error getting auth user after profile update:', authError);
        return { user: null, error: 'Profile updated but could not fetch user data' };
      }

      return {
        user: {
          id: authUser.id,
          email: authUser.email!,
          email_verified: authUser.email_confirmed_at ? true : false,
          phone: authUser.phone,
          phone_verified: authUser.phone_confirmed_at ? true : false,
          created_at: authUser.created_at,
          updated_at: authUser.updated_at,
          last_sign_in: authUser.last_sign_in_at,
          profile: profile
        },
        error: null
      };

    } catch (error) {
      console.error('❌ Unexpected error updating profile:', error);
      return { user: null, error: 'An unexpected error occurred while updating profile' };
    }
  }

  // Set up auth state change listener
  static onAuthStateChange(callback: (user: SupabaseAuthUser | null) => void) {
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
            email_verified: session.user.email_confirmed_at ? true : false,
            phone: session.user.phone,
            phone_verified: session.user.phone_confirmed_at ? true : false,
            created_at: session.user.created_at,
            updated_at: session.user.updated_at,
            last_sign_in: session.user.last_sign_in_at,
          });
          return;
        }

        callback({
          id: session.user.id,
          email: session.user.email!,
          email_verified: session.user.email_confirmed_at ? true : false,
          phone: session.user.phone,
          phone_verified: session.user.phone_confirmed_at ? true : false,
          created_at: session.user.created_at,
          updated_at: session.user.updated_at,
          last_sign_in: session.user.last_sign_in_at,
          profile: profile
        });
      } else {
        callback(null);
      }
    });
  }

  // Reset password
  static async resetPassword(email: string): Promise<{ error: string | null }> {
    try {
      console.log('🔐 === RESETTING PASSWORD ===');
      console.log('🔐 Sending password reset email to:', email);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'debsmatch://reset-password',
      });

      if (error) {
        console.error('❌ Password reset error:', error);
        return { error: error.message };
      }

      console.log('✅ Password reset email sent successfully');
      return { error: null };

    } catch (error) {
      console.error('❌ Unexpected error in password reset:', error);
      return { error: 'An unexpected error occurred during password reset' };
    }
  }

  // Update password
  static async updatePassword(newPassword: string): Promise<{ error: string | null }> {
    try {
      console.log('🔐 === UPDATING PASSWORD ===');

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('❌ Password update error:', error);
        return { error: error.message };
      }

      console.log('✅ Password updated successfully');
      return { error: null };

    } catch (error) {
      console.error('❌ Unexpected error in password update:', error);
      return { error: 'An unexpected error occurred during password update' };
    }
  }
}
