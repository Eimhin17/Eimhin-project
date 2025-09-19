import React, { createContext, useContext, useState, useEffect } from 'react';

interface OnboardingData {
  id?: string;
  firstName?: string;
  username?: string;
  dateOfBirth?: Date;
  gender?: string;
  school?: string;
  blockedSchools?: string[];
  schoolEmail?: string;
  emailVerified?: boolean;
  lookingForFriendsOrDates?: string;
  lookingForDebs?: string;
  datingIntentions?: string;
  relationshipStatus?: string;
  genderPreference?: string;
  bio?: string;
  interests?: string[];
  photos?: string[];
  profilePrompts?: Record<string, string>;
  notificationsEnabled?: boolean;
  agreedToTermsAndConditions?: boolean;
  matchPreferences?: Record<string, any>;
  onboardingCompleted?: boolean;
  password?: string;
}

interface OnboardingContextType {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  clearData: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};

interface OnboardingProviderProps {
  children: React.ReactNode;
}

export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({ children }) => {
  const [data, setData] = useState<OnboardingData>({});

  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
    console.log('📝 Onboarding data updated:', updates);
  };

  const clearData = () => {
    setData({});
    console.log('🗑️ Onboarding data cleared');
  };

  // Clear onboarding data when user becomes authenticated
  useEffect(() => {
    // Check if user is authenticated by looking for auth data in localStorage or similar
    // For now, we'll clear data when onboarding is completed
    if (data.onboardingCompleted) {
      console.log('🎉 Onboarding completed, clearing temporary data');
      // Don't clear immediately, let the user see the completion
      // The data will be cleared when the user navigates away
    }
  }, [data.onboardingCompleted]);

  return (
    <OnboardingContext.Provider value={{ data, updateData, clearData }}>
      {children}
    </OnboardingContext.Provider>
  );
};
