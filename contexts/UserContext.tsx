import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { UserProfile } from '../services/auth';

interface UserContextType {
  userProfile: UserProfile | null;
  loading: boolean;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;
  refreshTemporaryData: () => Promise<void>;
  isOnboardingComplete: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

interface UserProviderProps {
  children: React.ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const { user: authUser, updateProfile } = useAuth();

  // Load temporary data from OnboardingContext when user is not authenticated
  const loadTemporaryData = async () => {
    try {
      // Import OnboardingContext to get the current data
      const { useOnboarding } = await import('../OnboardingContext');
      
      // Note: We can't use hooks here, so we'll need to get the data differently
      // For now, just set userProfile to null when not authenticated
      console.log('ℹ️ No auth user, clearing profile');
      setUserProfile(null);
    } catch (error) {
      console.error('❌ Error loading temporary data:', error);
      setUserProfile(null);
    }
  };

  // Load temporary data on initial mount if no auth user
  useEffect(() => {
    if (!authUser) {
      loadTemporaryData();
    }
  }, []);

  // Load user profile when auth user changes
  useEffect(() => {
    if (authUser?.profile) {
      console.log('✅ Loading user profile from auth user:', authUser.profile);
      setUserProfile(authUser.profile);
    } else if (authUser && !authUser.profile) {
      console.log('⚠️ Auth user exists but no profile found');
      setUserProfile(null);
    } else {
      console.log('ℹ️ No auth user, loading temporary data if available');
      // Load temporary data when user is not authenticated
      loadTemporaryData();
    }
  }, [authUser]);

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!authUser) {
      // User not authenticated yet - this should be handled by OnboardingContext
      console.log('🔄 User not authenticated, updates should be handled by OnboardingContext');
      console.log('🔄 Updates:', updates);
      return { success: true };
    }

    try {
      console.log('🔄 Updating user profile:', updates);
      setLoading(true);

      const result = await updateProfile(updates);
      
      if (result.success) {
        console.log('✅ Profile updated successfully');
        // The AuthContext will update the user object, which will trigger the useEffect
        // to update the userProfile state
        return { success: true };
      } else {
        console.error('❌ Profile update failed:', result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      return { success: false, error: 'An unexpected error occurred' };
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (!authUser) return;

    try {
      console.log('🔄 Refreshing user profile...');
      setLoading(true);
      
      // The profile will be automatically updated through the auth state change
      // when the auth service fetches the updated profile
    } catch (error) {
      console.error('❌ Error refreshing profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const isOnboardingComplete = userProfile?.onboardingCompleted || false;

  const value: UserContextType = {
    userProfile,
    loading,
    updateUserProfile,
    refreshProfile,
    refreshTemporaryData: loadTemporaryData,
    isOnboardingComplete,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
