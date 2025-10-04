import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthService, User, SignUpData } from '../services/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (userData: SignUpData) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<{ success: boolean; error?: string }>;
  updateProfile: (updates: any) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on app start
  useEffect(() => {
    console.log('🔐 Checking for existing auth session...');

    const checkSession = async () => {
      try {
        const { user: currentUser, error } = await AuthService.getCurrentUser();

        if (currentUser && !error) {
          console.log('✅ Found existing session for user:', currentUser.email);
          setUser(currentUser);
        } else if (error) {
          // Handle specific auth errors gracefully
          if (error.includes('Auth session missing') || error.includes('session_missing')) {
            console.log('ℹ️ No auth session found (user not signed in yet)');
          } else {
            console.log('ℹ️ No existing session:', error);
          }
        } else {
          console.log('ℹ️ No existing session found');
        }
      } catch (error: any) {
        // Catch and handle auth session errors gracefully
        const errorMessage = error?.message || String(error);
        if (errorMessage.includes('Auth session missing') || errorMessage.includes('session_missing')) {
          console.log('ℹ️ No auth session found (user not signed in yet)');
        } else {
          console.error('❌ Error checking session:', error);
        }
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Set up auth state change listener
    const { data: { subscription } } = AuthService.onAuthStateChange((user) => {
      console.log('🔐 Auth state changed, updating user state:', user?.email || 'null');
      setUser(user);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔐 Attempting to sign in user:', email);
      setLoading(true);
      
      const result = await AuthService.signIn(email, password);
      
      if (result.success && result.user) {
        console.log('✅ Auth sign in successful');
        console.log('✅ User ID:', result.user.id);
        console.log('✅ User email:', result.user.email);
        
        setUser(result.user);
        return { success: true };
      } else {
        console.error('❌ Auth sign in failed:', result.error);
        return { success: false, error: result.error || 'Sign in failed' };
      }
    } catch (error) {
      console.error('❌ Error in signIn:', error);
      return { success: false, error: 'An unexpected error occurred during sign in' };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (userData: SignUpData) => {
    try {
      console.log('🔐 Attempting to sign up user:', userData.email);
      setLoading(true);
      
      const result = await AuthService.signUp(userData);
      
      if (result.success && result.user) {
        console.log('✅ Auth sign up successful');
        setUser(result.user);
        return { success: true };
      } else {
        console.error('❌ Auth sign up failed:', result.error);
        return { success: false, error: result.error || 'Sign up failed' };
      }
    } catch (error) {
      console.error('❌ Error in signUp:', error);
      return { success: false, error: 'An unexpected error occurred during sign up' };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      console.log('🔐 Attempting to sign out user');
      const result = await AuthService.signOut();
      
      if (result.success) {
        setUser(null);
        console.log('✅ User signed out successfully');
      } else {
        console.error('❌ Sign out failed:', result.error);
      }
    } catch (error) {
      console.error('❌ Error signing out:', error);
    }
  };

  const deleteAccount = async () => {
    try {
      console.log('🗑️ Attempting to delete user account');
      const result = await AuthService.deleteAccount();
      
      if (result.success) {
        setUser(null);
        console.log('✅ User account deleted successfully');
        return { success: true };
      } else {
        console.error('❌ Account deletion failed:', result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('❌ Error deleting account:', error);
      return { success: false, error: 'An unexpected error occurred during account deletion' };
    }
  };

  const updateProfile = async (updates: any) => {
    if (!user) {
      return { success: false, error: 'No user logged in' };
    }

    try {
      console.log('🔐 Attempting to update profile for user:', user.id);
      const result = await AuthService.updateProfile(user.id, updates);
      
      if (result.success && result.user) {
        setUser(result.user);
        return { success: true };
      } else {
        return { success: false, error: result.error || 'Failed to update profile' };
      }
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      return { success: false, error: 'An unexpected error occurred while updating profile' };
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    deleteAccount,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};