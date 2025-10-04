import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Map of onboarding steps to their routes
export const ONBOARDING_STEPS = {
  MASCOT_INTRO: '/(onboarding)/mascot-intro',
  EMAIL_VERIFICATION: '/(onboarding)/email-verification',
  EMAIL_CODE: '/(onboarding)/email-code',
  PASSWORD_CREATION: '/(onboarding)/password-creation',
  MASCOT_PHASE2: '/(onboarding)/mascot-phase2',
  BASIC_DETAILS: '/(onboarding)/basic-details',
  DATE_OF_BIRTH: '/(onboarding)/date-of-birth',
  GENDER_SELECTION: '/(onboarding)/gender-selection',
  SCHOOL_SELECTION: '/(onboarding)/school-selection',
  BLOCKED_SCHOOLS: '/(onboarding)/blocked-schools',
  MASCOT_PHASE3: '/(onboarding)/mascot-phase3',
  PHOTO_UPLOAD: '/(onboarding)/photo-upload',
  BIO: '/(onboarding)/bio',
  LOOKING_FOR: '/(onboarding)/looking-for',
  GENDER_PREFERENCE: '/(onboarding)/gender-preference',
  DEBS_PREFERENCES: '/(onboarding)/debs-preferences',
  DATING_INTENTIONS: '/(onboarding)/dating-intentions',
  RELATIONSHIP_STATUS: '/(onboarding)/relationship-status',
  MASCOT_PHASE4: '/(onboarding)/mascot-phase4',
  MASCOT_PHASE5: '/(onboarding)/mascot-phase5',
  INTERESTS: '/(onboarding)/interests',
  PROFILE_PROMPTS: '/(onboarding)/profile-prompts',
  NOTIFICATIONS: '/(onboarding)/notifications',
  LEGAL_AGREEMENTS: '/(onboarding)/legal-agreements',
  COMMUNITY_GUIDELINES: '/(onboarding)/community-guidelines',
} as const;

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
  agreedToCommunityGuidelines?: boolean;
  matchPreferences?: Record<string, any>;
  onboardingCompleted?: boolean;
  password?: string;
  currentStep?: string; // Track current onboarding step
}

interface OnboardingContextType {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  clearData: () => void;
  setCurrentStep: (step: string) => void;
  isLoaded: boolean; // Track if data has been loaded from storage
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const STORAGE_KEY = '@debsmatch_onboarding_data';

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
  const [isLoaded, setIsLoaded] = useState(false);

  // Load onboarding data from AsyncStorage on mount
  useEffect(() => {
    loadOnboardingData();
  }, []);

  const loadOnboardingData = async () => {
    try {
      const storedData = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedData) {
        const parsed = JSON.parse(storedData);
        // Convert dateOfBirth string back to Date if it exists
        if (parsed.dateOfBirth) {
          parsed.dateOfBirth = new Date(parsed.dateOfBirth);
        }
        setData(parsed);
        console.log('✅ Loaded onboarding data from storage:', parsed.currentStep);
      }
    } catch (error) {
      console.error('❌ Failed to load onboarding data:', error);
    } finally {
      setIsLoaded(true);
    }
  };

  const saveOnboardingData = async (newData: OnboardingData) => {
    try {
      // Convert Date to string for storage
      const dataToStore = {
        ...newData,
        dateOfBirth: newData.dateOfBirth?.toISOString(),
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(dataToStore));
      console.log('💾 Saved onboarding data to storage:', newData.currentStep);
    } catch (error) {
      console.error('❌ Failed to save onboarding data:', error);
    }
  };

  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => {
      const newData = { ...prev, ...updates };
      // Auto-save to AsyncStorage whenever data updates
      saveOnboardingData(newData);
      console.log('📝 Onboarding data updated:', updates);
      return newData;
    });
  };

  const setCurrentStep = (step: string) => {
    updateData({ currentStep: step });
    console.log('📍 Current onboarding step:', step);
  };

  const clearData = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setData({});
      console.log('🗑️ Onboarding data cleared from storage');
    } catch (error) {
      console.error('❌ Failed to clear onboarding data:', error);
    }
  };

  // Clear onboarding data when onboarding completes
  useEffect(() => {
    if (data.onboardingCompleted) {
      console.log('🎉 Onboarding completed, clearing temporary data');
      // Clear after a short delay to allow completion animations
      setTimeout(() => {
        clearData();
      }, 3000);
    }
  }, [data.onboardingCompleted]);

  return (
    <OnboardingContext.Provider value={{ data, updateData, clearData, setCurrentStep, isLoaded }}>
      {children}
    </OnboardingContext.Provider>
  );
};
