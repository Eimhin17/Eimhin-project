import { router } from 'expo-router';
import { ONBOARDING_STEPS } from '../OnboardingContext';

// Define the onboarding flow order
const ONBOARDING_FLOW_ORDER = [
  ONBOARDING_STEPS.MASCOT_INTRO,
  ONBOARDING_STEPS.SCHOOL_SELECTION,
  ONBOARDING_STEPS.EMAIL_VERIFICATION,
  ONBOARDING_STEPS.EMAIL_CODE,
  ONBOARDING_STEPS.PASSWORD_CREATION,
  ONBOARDING_STEPS.MASCOT_PHASE2,
  ONBOARDING_STEPS.BASIC_DETAILS,
  ONBOARDING_STEPS.DATE_OF_BIRTH,
  ONBOARDING_STEPS.GENDER_SELECTION,
  ONBOARDING_STEPS.BLOCKED_SCHOOLS,
  ONBOARDING_STEPS.MASCOT_PHASE3,
  ONBOARDING_STEPS.PHOTO_UPLOAD,
  ONBOARDING_STEPS.BIO,
  ONBOARDING_STEPS.LOOKING_FOR,
  ONBOARDING_STEPS.GENDER_PREFERENCE,
  ONBOARDING_STEPS.DEBS_PREFERENCES,
  ONBOARDING_STEPS.DATING_INTENTIONS,
  ONBOARDING_STEPS.RELATIONSHIP_STATUS,
  ONBOARDING_STEPS.MASCOT_PHASE4,
  ONBOARDING_STEPS.MASCOT_PHASE5,
  ONBOARDING_STEPS.INTERESTS,
  ONBOARDING_STEPS.PROFILE_PROMPTS,
  ONBOARDING_STEPS.NOTIFICATIONS,
  ONBOARDING_STEPS.LEGAL_AGREEMENTS,
  ONBOARDING_STEPS.COMMUNITY_GUIDELINES,
];

/**
 * Get the previous step in the onboarding flow
 */
export const getPreviousOnboardingStep = (currentStep: string): string | null => {
  const currentIndex = ONBOARDING_FLOW_ORDER.indexOf(currentStep);

  if (currentIndex <= 0) {
    // First step or not found - go to landing page
    return '/';
  }

  return ONBOARDING_FLOW_ORDER[currentIndex - 1];
};

/**
 * Safely navigate back in onboarding flow.
 * Uses the defined onboarding order, so works even after app restart.
 */
export const safeGoBack = (currentStep?: string) => {
  console.log('🔙 Safe go back called, current step:', currentStep);

  try {
    // Try standard back navigation first
    if (router.canGoBack()) {
      console.log('✅ Using router.back()');
      router.back();
      return;
    }
  } catch (error) {
    console.log('⚠️ router.back() failed:', error);
  }

  // Fallback: Use onboarding flow order
  if (currentStep) {
    const previousStep = getPreviousOnboardingStep(currentStep);
    console.log('📍 Navigating to previous step:', previousStep);

    if (previousStep === '/') {
      router.replace('/');
    } else if (previousStep) {
      router.push(previousStep as any);
    } else {
      router.replace('/');
    }
  } else {
    console.log('⚠️ No current step provided, going to landing page');
    router.replace('/');
  }
};

/**
 * Check if we can safely go back in navigation history
 */
export const canGoBack = (): boolean => {
  return router.canGoBack();
};
