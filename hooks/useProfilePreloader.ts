import { useEffect, useRef } from 'react';
import { useUser } from '../contexts/UserContext';
import { profilePreloader } from '../services/profilePreloader';

interface UseProfilePreloaderProps {
  shouldPreload: boolean;
  pageName: string;
}

export const useProfilePreloader = ({ shouldPreload, pageName }: UseProfilePreloaderProps) => {
  const { userProfile } = useUser();
  const preloadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear any existing timeout
    if (preloadTimeoutRef.current) {
      clearTimeout(preloadTimeoutRef.current);
    }

    if (shouldPreload && userProfile?.id) {
      console.log(`🔄 Starting profile preload from ${pageName} page`);
      
      // Shorter delay for filters page since it's a modal
      const delay = pageName === 'filters' ? 200 : 1000;
      
      preloadTimeoutRef.current = setTimeout(() => {
        profilePreloader.preloadFirstProfile(userProfile.id);
      }, delay);
    }

    // Cleanup timeout on unmount or dependency change
    return () => {
      if (preloadTimeoutRef.current) {
        clearTimeout(preloadTimeoutRef.current);
      }
    };
  }, [shouldPreload, userProfile?.id, pageName]);

  return {
    hasPreloadedProfile: profilePreloader.hasPreloadedProfile(),
    getPreloadedProfile: () => profilePreloader.getPreloadedProfile(),
    clearPreloadedProfile: () => profilePreloader.clearPreloadedProfile(),
  };
};
